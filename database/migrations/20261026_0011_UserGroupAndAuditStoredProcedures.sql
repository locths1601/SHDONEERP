-- =========================================================================
-- Migration: 20261026_0011_UserGroupAndAuditStoredProcedures.sql
-- Description: Stored Procedures for FND-01 (UserGroup & Direct GBAC Management) 
--              and FND-02 (Audit Log Viewer with Scoped Data Access).
-- =========================================================================

-- 1. Bổ sung Permission mới cho phân hệ Audit Log
DECLARE @AuditPermissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Module] NVARCHAR(50),
    [Description] NVARCHAR(250)
);

INSERT INTO @AuditPermissions ([Code], [Name], [Module], [Description]) VALUES
('identity.audit.view', N'Xem nhật ký kiểm toán hệ thống', 'Identity', N'Cho phép tra cứu và xem lịch sử kiểm toán CUD toàn hệ thống theo scope'),
('identity.audit.export', N'Xuất nhật ký kiểm toán', 'Identity', N'Cho phép trích xuất nhật ký kiểm toán ra tệp tin');

MERGE [dbo].[Identity_Permissions] AS target
USING @AuditPermissions AS source
ON (target.[Code] = source.[Code])
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Module], [Description], [CreatedAtUtc])
    VALUES (NEWID(), source.[Code], source.[Name], source.[Module], source.[Description], SYSUTCDATETIME());
GO

-- 2. Stored Procedure: Phân trang danh sách User Groups
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_UserGroup_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SearchTerm NVARCHAR(100) = NULL,
    @ScopeType NVARCHAR(30) = NULL,
    @IsActive BIT = NULL,
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Kiểm tra quyền xem UserGroup (identity.group.view)
    IF @CurrentUserId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
    ) AND NOT EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @CurrentUserId AND ug.[IsActive] = 1 AND p.[Code] = 'identity.group.view'
    )
    BEGIN
        SET @TotalCount = 0;
        RETURN;
    END;

    -- Đếm tổng số bản ghi
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Identity_UserGroups] ug
    WHERE (@IsActive IS NULL OR ug.[IsActive] = @IsActive)
      AND (@ScopeType IS NULL OR ug.[ScopeType] = @ScopeType)
      AND (@SearchTerm IS NULL 
           OR ug.[Code] LIKE '%' + @SearchTerm + '%' 
           OR ug.[Name] LIKE '%' + @SearchTerm + '%'
           OR ug.[Description] LIKE '%' + @SearchTerm + '%');

    -- Truy vấn dữ liệu phân trang
    SELECT 
        ug.[Id],
        ug.[Code],
        ug.[Name],
        ug.[Description],
        ug.[ScopeType],
        ug.[IsSystem],
        ug.[IsActive],
        (SELECT COUNT(1) FROM [dbo].[Identity_UserGroupMembers] ugm WHERE ugm.[UserGroupId] = ug.[Id]) AS [MemberCount],
        (SELECT COUNT(1) FROM [dbo].[Identity_UserGroupPermissions] ugp WHERE ugp.[UserGroupId] = ug.[Id]) AS [PermissionCount],
        ug.[CreatedAtUtc],
        ug.[UpdatedAtUtc],
        ug.[RowVersion]
    FROM [dbo].[Identity_UserGroups] ug
    WHERE (@IsActive IS NULL OR ug.[IsActive] = @IsActive)
      AND (@ScopeType IS NULL OR ug.[ScopeType] = @ScopeType)
      AND (@SearchTerm IS NULL 
           OR ug.[Code] LIKE '%' + @SearchTerm + '%' 
           OR ug.[Name] LIKE '%' + @SearchTerm + '%'
           OR ug.[Description] LIKE '%' + @SearchTerm + '%')
    ORDER BY ug.[IsSystem] DESC, ug.[Code] ASC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 3. Stored Procedure: Lấy chi tiết User Group theo Id
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_UserGroup_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ug.[Id],
        ug.[Code],
        ug.[Name],
        ug.[Description],
        ug.[ScopeType],
        ug.[IsSystem],
        ug.[IsActive],
        (SELECT COUNT(1) FROM [dbo].[Identity_UserGroupMembers] ugm WHERE ugm.[UserGroupId] = ug.[Id]) AS [MemberCount],
        (SELECT COUNT(1) FROM [dbo].[Identity_UserGroupPermissions] ugp WHERE ugp.[UserGroupId] = ug.[Id]) AS [PermissionCount],
        ug.[CreatedAtUtc],
        ug.[UpdatedAtUtc],
        ug.[RowVersion]
    FROM [dbo].[Identity_UserGroups] ug
    WHERE ug.[Id] = @Id;
END;
GO

-- 4. Stored Procedure: Lấy danh sách thành viên của User Group
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_UserGroup_GetMembers]
    @UserGroupId UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ugm.[Id] AS [MembershipId],
        ugm.[UserId],
        u.[Username],
        u.[FullName],
        u.[Email],
        u.[PhoneNumber],
        u.[IsActive] AS [IsUserActive],
        ugm.[ScopeLegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        ugm.[ScopeBusinessUnitId],
        bu.[Code] AS [BusinessUnitCode],
        bu.[Name] AS [BusinessUnitName],
        ugm.[ScopeBranchId],
        br.[Code] AS [BranchCode],
        br.[Name] AS [BranchName],
        ugm.[AssignedAtUtc]
    FROM [dbo].[Identity_UserGroupMembers] ugm
    JOIN [dbo].[Identity_Users] u ON u.[Id] = ugm.[UserId]
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = ugm.[ScopeLegalEntityId]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = ugm.[ScopeBusinessUnitId]
    LEFT JOIN [dbo].[Org_Branches] br ON br.[Id] = ugm.[ScopeBranchId]
    WHERE ugm.[UserGroupId] = @UserGroupId
    ORDER BY u.[FullName] ASC;
END;
GO

-- 5. Stored Procedure: Lấy danh sách mã quyền đã gán cho User Group
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_UserGroup_GetPermissions]
    @UserGroupId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.[Id] AS [PermissionId],
        p.[Code] AS [PermissionCode],
        p.[Name] AS [PermissionName],
        p.[Module],
        p.[Description],
        ugp.[GrantedAtUtc]
    FROM [dbo].[Identity_UserGroupPermissions] ugp
    JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
    WHERE ugp.[UserGroupId] = @UserGroupId
    ORDER BY p.[Module] ASC, p.[Code] ASC;
END;
GO

-- 6. Stored Procedure: Lấy toàn bộ danh mục quyền hệ thống (phục vụ Permission Matrix)
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_Permission_GetAll]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.[Id],
        p.[Code],
        p.[Name],
        p.[Module],
        p.[Description],
        p.[CreatedAtUtc]
    FROM [dbo].[Identity_Permissions] p
    ORDER BY p.[Module] ASC, p.[Code] ASC;
END;
GO

-- 7. Stored Procedure: Xem quyền hiệu lực chi tiết của một User kèm nguồn nhóm và Scope
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_User_GetDetailedEffectivePermissions]
    @TargetUserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Nếu user là System Administrator
    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @TargetUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
    )
    BEGIN
        SELECT 
            p.[Code] AS [PermissionCode],
            p.[Name] AS [PermissionName],
            p.[Module],
            'Global' AS [ScopeType],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeLegalEntityId],
            N'Toàn tập đoàn (Tất cả pháp nhân)' AS [ScopeLegalEntityName],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBusinessUnitId],
            CAST(NULL AS NVARCHAR(200)) AS [ScopeBusinessUnitName],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBranchId],
            CAST(NULL AS NVARCHAR(200)) AS [ScopeBranchName],
            'ADMINISTRATORS' AS [ViaGroupName]
        FROM [dbo].[Identity_Permissions] p
        ORDER BY p.[Module] ASC, p.[Code] ASC;
        RETURN;
    END;

    -- Lấy theo các nhóm thông thường của user
    SELECT DISTINCT
        p.[Code] AS [PermissionCode],
        p.[Name] AS [PermissionName],
        p.[Module],
        ug.[ScopeType],
        ugm.[ScopeLegalEntityId],
        le.[Name] AS [ScopeLegalEntityName],
        ugm.[ScopeBusinessUnitId],
        bu.[Name] AS [ScopeBusinessUnitName],
        ugm.[ScopeBranchId],
        br.[Name] AS [ScopeBranchName],
        ug.[Name] AS [ViaGroupName]
    FROM [dbo].[Identity_UserGroupMembers] ugm
    JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
    JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
    JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = ugm.[ScopeLegalEntityId]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = ugm.[ScopeBusinessUnitId]
    LEFT JOIN [dbo].[Org_Branches] br ON br.[Id] = ugm.[ScopeBranchId]
    WHERE ugm.[UserId] = @TargetUserId
      AND ug.[IsActive] = 1
    ORDER BY p.[Module] ASC, p.[Code] ASC;
END;
GO

-- 8. Stored Procedure: Phân trang danh sách Nhật ký Kiểm toán (Audit Logs)
CREATE OR ALTER PROCEDURE [dbo].[sp_Audit_SystemLog_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @FromDateUtc DATETIME2 = NULL,
    @ToDateUtc DATETIME2 = NULL,
    @UserId UNIQUEIDENTIFIER = NULL,
    @Action NVARCHAR(50) = NULL,
    @EntityName NVARCHAR(100) = NULL,
    @EntityId NVARCHAR(100) = NULL,
    @CorrelationId NVARCHAR(100) = NULL,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;

    -- Kiểm tra quyền xem audit log (identity.audit.view)
    DECLARE @IsGlobalAdmin BIT = 0;
    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsGlobalAdmin = 1;
    END;

    -- Lấy danh sách pháp nhân mà CurrentUser được phép xem audit
    DECLARE @AllowedLegalEntities TABLE ([Id] UNIQUEIDENTIFIER PRIMARY KEY);
    IF @IsGlobalAdmin = 1
    BEGIN
        INSERT INTO @AllowedLegalEntities ([Id]) SELECT [Id] FROM [dbo].[Org_LegalEntities];
    END
    ELSE
    BEGIN
        INSERT INTO @AllowedLegalEntities ([Id])
        SELECT DISTINCT ugm.[ScopeLegalEntityId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @CurrentUserId 
          AND ug.[IsActive] = 1 
          AND p.[Code] = 'identity.audit.view'
          AND ugm.[ScopeLegalEntityId] IS NOT NULL;

        -- Nếu có nhóm Global với quyền identity.audit.view
        IF EXISTS (
            SELECT 1
            FROM [dbo].[Identity_UserGroupMembers] ugm
            JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
            JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
            JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
            WHERE ugm.[UserId] = @CurrentUserId 
              AND ug.[IsActive] = 1 
              AND p.[Code] = 'identity.audit.view'
              AND ug.[ScopeType] = 'Global'
        )
        BEGIN
            INSERT INTO @AllowedLegalEntities ([Id]) SELECT [Id] FROM [dbo].[Org_LegalEntities];
        END;
    END;

    -- Nếu user không có quyền trên bất kỳ scope nào, trả về 0 kết quả
    IF NOT EXISTS (SELECT 1 FROM @AllowedLegalEntities) AND @IsGlobalAdmin = 0
    BEGIN
        SET @TotalCount = 0;
        RETURN;
    END;

    -- Đếm tổng số bản ghi phù hợp
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Audit_SystemLogs] a
    WHERE (@FromDateUtc IS NULL OR a.[CreatedAtUtc] >= @FromDateUtc)
      AND (@ToDateUtc IS NULL OR a.[CreatedAtUtc] <= @ToDateUtc)
      AND (@UserId IS NULL OR a.[UserId] = @UserId)
      AND (@Action IS NULL OR a.[Action] = @Action)
      AND (@EntityName IS NULL OR a.[EntityName] = @EntityName)
      AND (@EntityId IS NULL OR a.[EntityId] = @EntityId)
      AND (@CorrelationId IS NULL OR a.[CorrelationId] = @CorrelationId)
      AND (@LegalEntityId IS NULL OR a.[LegalEntityId] = @LegalEntityId)
      AND (
          @IsGlobalAdmin = 1 
          OR a.[LegalEntityId] IS NULL 
          OR a.[LegalEntityId] IN (SELECT [Id] FROM @AllowedLegalEntities)
      );

    -- Lấy dữ liệu phân trang
    SELECT 
        a.[Id],
        a.[UserId],
        a.[UserName],
        a.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        a.[Action],
        a.[EntityName],
        a.[EntityId],
        a.[AffectedColumns],
        a.[IpAddress],
        a.[UserAgent],
        a.[CorrelationId],
        a.[CreatedAtUtc]
    FROM [dbo].[Audit_SystemLogs] a
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = a.[LegalEntityId]
    WHERE (@FromDateUtc IS NULL OR a.[CreatedAtUtc] >= @FromDateUtc)
      AND (@ToDateUtc IS NULL OR a.[CreatedAtUtc] <= @ToDateUtc)
      AND (@UserId IS NULL OR a.[UserId] = @UserId)
      AND (@Action IS NULL OR a.[Action] = @Action)
      AND (@EntityName IS NULL OR a.[EntityName] = @EntityName)
      AND (@EntityId IS NULL OR a.[EntityId] = @EntityId)
      AND (@CorrelationId IS NULL OR a.[CorrelationId] = @CorrelationId)
      AND (@LegalEntityId IS NULL OR a.[LegalEntityId] = @LegalEntityId)
      AND (
          @IsGlobalAdmin = 1 
          OR a.[LegalEntityId] IS NULL 
          OR a.[LegalEntityId] IN (SELECT [Id] FROM @AllowedLegalEntities)
      )
    ORDER BY a.[CreatedAtUtc] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 9. Stored Procedure: Xem chi tiết một bản ghi Audit Log (Before/After snapshot)
CREATE OR ALTER PROCEDURE [dbo].[sp_Audit_SystemLog_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra phân quyền truy cập
    DECLARE @LogLegalEntityId UNIQUEIDENTIFIER;
    SELECT @LogLegalEntityId = [LegalEntityId] FROM [dbo].[Audit_SystemLogs] WHERE [Id] = @Id;

    DECLARE @CanAccess BIT = 0;
    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
    )
    BEGIN
        SET @CanAccess = 1;
    END
    ELSE IF @LogLegalEntityId IS NULL
    BEGIN
        SET @CanAccess = 1;
    END
    ELSE IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @CurrentUserId 
          AND ug.[IsActive] = 1 
          AND p.[Code] = 'identity.audit.view'
          AND (ug.[ScopeType] = 'Global' OR ugm.[ScopeLegalEntityId] = @LogLegalEntityId)
    )
    BEGIN
        SET @CanAccess = 1;
    END;

    IF @CanAccess = 0
    BEGIN
        RETURN;
    END;

    SELECT 
        a.[Id],
        a.[UserId],
        a.[UserName],
        a.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        a.[Action],
        a.[EntityName],
        a.[EntityId],
        a.[OldValues],
        a.[NewValues],
        a.[AffectedColumns],
        a.[IpAddress],
        a.[UserAgent],
        a.[CorrelationId],
        a.[CreatedAtUtc]
    FROM [dbo].[Audit_SystemLogs] a
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = a.[LegalEntityId]
    WHERE a.[Id] = @Id;
END;
GO

