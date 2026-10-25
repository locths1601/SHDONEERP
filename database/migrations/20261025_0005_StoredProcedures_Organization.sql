-- =========================================================================
-- Migration: 20261025_0005_StoredProcedures_Organization.sql
-- Description: Stored Procedures phục vụ Read-side cho Organization & Identity Modules
-- =========================================================================

-- 1. SP: sp_Organization_LegalEntity_GetPaged
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_LegalEntity_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @SortBy NVARCHAR(50) = 'CreatedAtUtc',
    @SortOrder NVARCHAR(10) = 'DESC',
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra phân trang an toàn
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;

    -- Chuẩn hóa từ khóa tìm kiếm
    SET @SearchTerm = LTRIM(RTRIM(@SearchTerm));
    IF @SearchTerm = '' SET @SearchTerm = NULL;

    -- Tính tổng số bản ghi (Total Count)
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[IsDeleted] = 0
      AND (@Status IS NULL OR le.[Status] = @Status)
      AND (
          @SearchTerm IS NULL OR
          le.[Code] LIKE '%' + @SearchTerm + '%' OR
          le.[Name] LIKE '%' + @SearchTerm + '%' OR
          le.[TaxCode] LIKE '%' + @SearchTerm + '%' OR
          le.[Email] LIKE '%' + @SearchTerm + '%'
      );

    -- Lấy dữ liệu phân trang theo Sort (sử dụng logic an toàn chống SQL injection)
    SELECT
        le.[Id],
        le.[Code],
        le.[Name],
        le.[TradingName],
        le.[TaxCode],
        le.[Address],
        le.[PhoneNumber],
        le.[Email],
        le.[Website],
        le.[Status],
        le.[CreatedAtUtc],
        le.[UpdatedAtUtc],
        le.[RowVersion]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[IsDeleted] = 0
      AND (@Status IS NULL OR le.[Status] = @Status)
      AND (
          @SearchTerm IS NULL OR
          le.[Code] LIKE '%' + @SearchTerm + '%' OR
          le.[Name] LIKE '%' + @SearchTerm + '%' OR
          le.[TaxCode] LIKE '%' + @SearchTerm + '%' OR
          le.[Email] LIKE '%' + @SearchTerm + '%'
      )
    ORDER BY
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN le.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN le.[Code] END DESC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'ASC' THEN le.[Name] END ASC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'DESC' THEN le.[Name] END DESC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'ASC' THEN le.[Status] END ASC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'DESC' THEN le.[Status] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN le.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN le.[CreatedAtUtc] END DESC,
        le.[CreatedAtUtc] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. SP: sp_Organization_LegalEntity_GetById
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_LegalEntity_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        le.[Id],
        le.[Code],
        le.[Name],
        le.[TradingName],
        le.[TaxCode],
        le.[Address],
        le.[PhoneNumber],
        le.[Email],
        le.[Website],
        le.[Status],
        le.[CreatedAtUtc],
        le.[UpdatedAtUtc],
        le.[RowVersion],
        (SELECT COUNT(1) FROM [dbo].[Org_BusinessUnits] bu WHERE bu.[LegalEntityId] = le.[Id] AND bu.[IsDeleted] = 0) AS [BusinessUnitCount],
        (SELECT COUNT(1) FROM [dbo].[Org_Branches] br WHERE br.[LegalEntityId] = le.[Id] AND br.[IsDeleted] = 0) AS [BranchCount]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[Id] = @Id
      AND le.[IsDeleted] = 0;
END;
GO

-- 3. SP: sp_Organization_LegalEntity_GetLookup
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_LegalEntity_GetLookup]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        le.[Id],
        le.[Code],
        le.[Name],
        le.[Status]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[IsDeleted] = 0 AND le.[Status] = 'Active'
    ORDER BY le.[Name] ASC;
END;
GO

-- 4. SP: sp_Identity_User_GetEffectivePermissions (Direct GBAC Resolver)
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_User_GetEffectivePermissions]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra nếu người dùng thuộc nhóm ADMINISTRATORS hệ thống
    DECLARE @IsAdmin BIT = 0;
    IF EXISTS (
        SELECT 1
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ugm.[UserGroupId] = ug.[Id]
        WHERE ugm.[UserId] = @UserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
    END

    IF @IsAdmin = 1
    BEGIN
        -- Admin sở hữu toàn bộ permissions với Global Scope
        SELECT
            p.[Code] AS [PermissionCode],
            'Global' AS [ScopeType],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeLegalEntityId],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBusinessUnitId],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBranchId]
        FROM [dbo].[Identity_Permissions] p;
    END
    ELSE
    BEGIN
        -- Giải quyết quyền qua User -> UserGroupMember -> UserGroup -> UserGroupPermission -> Permission
        SELECT DISTINCT
            p.[Code] AS [PermissionCode],
            ug.[ScopeType],
            ugm.[ScopeLegalEntityId],
            ugm.[ScopeBusinessUnitId],
            ugm.[ScopeBranchId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ugm.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ug.[Id] = ugp.[UserGroupId]
        JOIN [dbo].[Identity_Permissions] p ON ugp.[PermissionId] = p.[Id]
        WHERE ugm.[UserId] = @UserId
          AND ug.[IsActive] = 1;
    END
END;
GO
