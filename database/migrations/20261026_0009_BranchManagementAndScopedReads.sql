-- =========================================================================
-- Migration: 20261026_0009_BranchManagementAndScopedReads.sql
-- Description: Stored Procedures for Branch/Campus Management with Direct GBAC v4.2 Scope Filtering
-- =========================================================================

-- 1. Stored Procedure: Phân trang danh sách Cơ sở / Chi nhánh (Direct GBAC Scope-aware)
GO
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_Branch_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @BusinessUnitId UNIQUEIDENTIFIER = NULL,
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @SortBy NVARCHAR(50) = 'CreatedAtUtc',
    @SortOrder NVARCHAR(10) = 'DESC',
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Direct GBAC Scope Filtering
    DECLARE @VisibleBranches TABLE ([Id] UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @VisibleBranches ([Id])
    SELECT br.[Id]
    FROM [dbo].[Org_Branches] br
    WHERE br.[IsDeleted] = 0
      AND (@LegalEntityId IS NULL OR br.[LegalEntityId] = @LegalEntityId)
      AND (@BusinessUnitId IS NULL OR br.[BusinessUnitId] = @BusinessUnitId)
      AND @CurrentUserId IS NOT NULL
      AND (
          EXISTS (
              SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
          )
          OR EXISTS (
              SELECT 1
              FROM [dbo].[Identity_Users] u
              JOIN [dbo].[Identity_UserGroupMembers] ugm ON ugm.[UserId] = u.[Id]
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
              JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
              WHERE u.[Id] = @CurrentUserId AND u.[IsActive] = 1 AND ug.[IsActive] = 1
                AND p.[Code] = 'org.branch.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = br.[LegalEntityId])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND ugm.[ScopeBusinessUnitId] = br.[BusinessUnitId])
                    OR (ug.[ScopeType] = 'Branch' AND ugm.[ScopeBranchId] = br.[Id])
                )
          )
      );

    -- Đếm tổng số bản ghi phù hợp
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Org_Branches] br
    JOIN @VisibleBranches visible ON visible.[Id] = br.[Id]
    WHERE (@Status IS NULL OR br.[Status] = @Status)
      AND (@SearchTerm IS NULL 
           OR br.[Code] LIKE '%' + @SearchTerm + '%' 
           OR br.[Name] LIKE '%' + @SearchTerm + '%'
           OR br.[Address] LIKE '%' + @SearchTerm + '%');

    -- Trả về tập dữ liệu phân trang
    SELECT 
        br.[Id],
        br.[LegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        br.[BusinessUnitId],
        bu.[Code] AS [BusinessUnitCode],
        bu.[Name] AS [BusinessUnitName],
        br.[Code],
        br.[Name],
        br.[Address],
        br.[Status],
        br.[CreatedAtUtc],
        br.[UpdatedAtUtc],
        br.[RowVersion]
    FROM [dbo].[Org_Branches] br
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = br.[LegalEntityId]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = br.[BusinessUnitId]
    JOIN @VisibleBranches visible ON visible.[Id] = br.[Id]
    WHERE (@Status IS NULL OR br.[Status] = @Status)
      AND (@SearchTerm IS NULL 
           OR br.[Code] LIKE '%' + @SearchTerm + '%' 
           OR br.[Name] LIKE '%' + @SearchTerm + '%'
           OR br.[Address] LIKE '%' + @SearchTerm + '%')
    ORDER BY
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN br.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN br.[Code] END DESC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'ASC' THEN br.[Name] END ASC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'DESC' THEN br.[Name] END DESC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'ASC' THEN br.[Status] END ASC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'DESC' THEN br.[Status] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN br.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN br.[CreatedAtUtc] END DESC,
        br.[CreatedAtUtc] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. Stored Procedure: Lấy chi tiết Cơ sở / Chi nhánh theo Id (Direct GBAC Scope-aware)
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_Branch_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        br.[Id],
        br.[LegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        br.[BusinessUnitId],
        bu.[Code] AS [BusinessUnitCode],
        bu.[Name] AS [BusinessUnitName],
        br.[Code],
        br.[Name],
        br.[Address],
        br.[Status],
        br.[CreatedAtUtc],
        br.[UpdatedAtUtc],
        br.[RowVersion]
    FROM [dbo].[Org_Branches] br
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = br.[LegalEntityId]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = br.[BusinessUnitId]
    WHERE br.[Id] = @Id
      AND br.[IsDeleted] = 0
      AND @CurrentUserId IS NOT NULL
      AND (
          EXISTS (
              SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
          )
          OR EXISTS (
              SELECT 1
              FROM [dbo].[Identity_Users] u
              JOIN [dbo].[Identity_UserGroupMembers] ugm ON ugm.[UserId] = u.[Id]
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
              JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
              WHERE u.[Id] = @CurrentUserId AND u.[IsActive] = 1 AND ug.[IsActive] = 1
                AND p.[Code] = 'org.branch.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = br.[LegalEntityId])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND ugm.[ScopeBusinessUnitId] = br.[BusinessUnitId])
                    OR (ug.[ScopeType] = 'Branch' AND ugm.[ScopeBranchId] = br.[Id])
                )
          )
      );
END;
GO

-- 3. Stored Procedure: Tra cứu danh sách nhanh (Lookup / Dropdown)
CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_Branch_GetLookup]
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @BusinessUnitId UNIQUEIDENTIFIER = NULL,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        br.[Id],
        br.[LegalEntityId],
        br.[BusinessUnitId],
        br.[Code],
        br.[Name],
        br.[Status]
    FROM [dbo].[Org_Branches] br
    WHERE br.[IsDeleted] = 0
      AND br.[Status] = 'Active'
      AND (@LegalEntityId IS NULL OR br.[LegalEntityId] = @LegalEntityId)
      AND (@BusinessUnitId IS NULL OR br.[BusinessUnitId] = @BusinessUnitId)
      AND @CurrentUserId IS NOT NULL
      AND (
          EXISTS (
              SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              WHERE ugm.[UserId] = @CurrentUserId AND ug.[Code] = 'ADMINISTRATORS' AND ug.[IsActive] = 1
          )
          OR EXISTS (
              SELECT 1
              FROM [dbo].[Identity_Users] u
              JOIN [dbo].[Identity_UserGroupMembers] ugm ON ugm.[UserId] = u.[Id]
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
              JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
              WHERE u.[Id] = @CurrentUserId AND u.[IsActive] = 1 AND ug.[IsActive] = 1
                AND p.[Code] = 'org.branch.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = br.[LegalEntityId])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND ugm.[ScopeBusinessUnitId] = br.[BusinessUnitId])
                    OR (ug.[ScopeType] = 'Branch' AND ugm.[ScopeBranchId] = br.[Id])
                )
          )
      )
    ORDER BY br.[Name] ASC;
END;
GO

