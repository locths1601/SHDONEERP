-- Business Unit CRUD read procedures and scope-aware organization reads.
GO
CREATE OR ALTER PROCEDURE [dbo].[sp_Identity_User_GetEffectivePermissions]
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Identity_Users]
        WHERE [Id] = @UserId AND [IsActive] = 1
    )
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @UserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SELECT
            p.[Code] AS [PermissionCode],
            'Global' AS [ScopeType],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeLegalEntityId],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBusinessUnitId],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [ScopeBranchId]
        FROM [dbo].[Identity_Permissions] p;
        RETURN;
    END;

    SELECT DISTINCT
        p.[Code] AS [PermissionCode],
        ug.[ScopeType],
        ugm.[ScopeLegalEntityId],
        ugm.[ScopeBusinessUnitId],
        ugm.[ScopeBranchId]
    FROM [dbo].[Identity_UserGroupMembers] ugm
    JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
    JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ug.[Id] = ugp.[UserGroupId]
    JOIN [dbo].[Identity_Permissions] p ON ugp.[PermissionId] = p.[Id]
    WHERE ugm.[UserId] = @UserId
      AND ug.[IsActive] = 1;
END;
GO

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
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    DECLARE @VisibleLegalEntities TABLE ([Id] UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @VisibleLegalEntities ([Id])
    SELECT le.[Id]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[IsDeleted] = 0
      AND @CurrentUserId IS NOT NULL
      AND (
          EXISTS (
              SELECT 1
              FROM [dbo].[Identity_UserGroupMembers] ugm
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              WHERE ugm.[UserId] = @CurrentUserId
                AND ug.[Code] = 'ADMINISTRATORS'
                AND ug.[IsActive] = 1
          )
          OR EXISTS (
              SELECT 1
              FROM [dbo].[Identity_Users] u
              JOIN [dbo].[Identity_UserGroupMembers] ugm ON ugm.[UserId] = u.[Id]
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
              JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
              WHERE u.[Id] = @CurrentUserId
                AND u.[IsActive] = 1
                AND ug.[IsActive] = 1
                AND p.[Code] = 'org.legal_entity.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = le.[Id])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_BusinessUnits] bu
                        WHERE bu.[LegalEntityId] = le.[Id]
                          AND bu.[Id] = ugm.[ScopeBusinessUnitId]
                          AND bu.[IsDeleted] = 0
                    ))
                    OR (ug.[ScopeType] = 'Branch' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_Branches] br
                        WHERE br.[LegalEntityId] = le.[Id]
                          AND br.[Id] = ugm.[ScopeBranchId]
                          AND br.[IsDeleted] = 0
                    ))
                )
          )
      );

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Org_LegalEntities] le
    JOIN @VisibleLegalEntities visible ON visible.[Id] = le.[Id]
    WHERE (@Status IS NULL OR le.[Status] = @Status)
      AND (@SearchTerm IS NULL OR le.[Code] LIKE '%' + @SearchTerm + '%'
        OR le.[Name] LIKE '%' + @SearchTerm + '%'
        OR le.[TaxCode] LIKE '%' + @SearchTerm + '%'
        OR le.[Email] LIKE '%' + @SearchTerm + '%');

    SELECT le.[Id], le.[Code], le.[Name], le.[TradingName], le.[TaxCode],
        le.[Address], le.[PhoneNumber], le.[Email], le.[Website], le.[Status],
        le.[CreatedAtUtc], le.[UpdatedAtUtc], le.[RowVersion]
    FROM [dbo].[Org_LegalEntities] le
    JOIN @VisibleLegalEntities visible ON visible.[Id] = le.[Id]
    WHERE (@Status IS NULL OR le.[Status] = @Status)
      AND (@SearchTerm IS NULL OR le.[Code] LIKE '%' + @SearchTerm + '%'
        OR le.[Name] LIKE '%' + @SearchTerm + '%'
        OR le.[TaxCode] LIKE '%' + @SearchTerm + '%'
        OR le.[Email] LIKE '%' + @SearchTerm + '%')
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
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_LegalEntity_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT le.[Id], le.[Code], le.[Name], le.[TradingName], le.[TaxCode],
        le.[Address], le.[PhoneNumber], le.[Email], le.[Website], le.[Status],
        le.[CreatedAtUtc], le.[UpdatedAtUtc], le.[RowVersion],
        (SELECT COUNT(1) FROM [dbo].[Org_BusinessUnits] bu WHERE bu.[LegalEntityId] = le.[Id] AND bu.[IsDeleted] = 0) AS [BusinessUnitCount],
        (SELECT COUNT(1) FROM [dbo].[Org_Branches] br WHERE br.[LegalEntityId] = le.[Id] AND br.[IsDeleted] = 0) AS [BranchCount]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[Id] = @Id
      AND le.[IsDeleted] = 0
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
                AND p.[Code] = 'org.legal_entity.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = le.[Id])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_BusinessUnits] bu WHERE bu.[LegalEntityId] = le.[Id]
                          AND bu.[Id] = ugm.[ScopeBusinessUnitId] AND bu.[IsDeleted] = 0
                    ))
                    OR (ug.[ScopeType] = 'Branch' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_Branches] br WHERE br.[LegalEntityId] = le.[Id]
                          AND br.[Id] = ugm.[ScopeBranchId] AND br.[IsDeleted] = 0
                    ))
                )
          )
      );
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_LegalEntity_GetLookup]
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT le.[Id], le.[Code], le.[Name], le.[Status]
    FROM [dbo].[Org_LegalEntities] le
    WHERE le.[IsDeleted] = 0
      AND le.[Status] = 'Active'
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
                AND p.[Code] = 'org.legal_entity.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = le.[Id])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_BusinessUnits] bu WHERE bu.[LegalEntityId] = le.[Id]
                          AND bu.[Id] = ugm.[ScopeBusinessUnitId] AND bu.[IsDeleted] = 0
                    ))
                    OR (ug.[ScopeType] = 'Branch' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_Branches] br WHERE br.[LegalEntityId] = le.[Id]
                          AND br.[Id] = ugm.[ScopeBranchId] AND br.[IsDeleted] = 0
                    ))
                )
          )
      )
    ORDER BY le.[Name] ASC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_BusinessUnit_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
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

    DECLARE @VisibleUnits TABLE ([Id] UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @VisibleUnits ([Id])
    SELECT bu.[Id]
    FROM [dbo].[Org_BusinessUnits] bu
    WHERE bu.[IsDeleted] = 0
      AND (@LegalEntityId IS NULL OR bu.[LegalEntityId] = @LegalEntityId)
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
                AND p.[Code] = 'org.business_unit.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = bu.[LegalEntityId])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND ugm.[ScopeBusinessUnitId] = bu.[Id])
                    OR (ug.[ScopeType] = 'Branch' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_Branches] br
                        WHERE br.[Id] = ugm.[ScopeBranchId] AND br.[BusinessUnitId] = bu.[Id] AND br.[IsDeleted] = 0
                    ))
                )
          )
      );

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Org_BusinessUnits] bu
    JOIN @VisibleUnits visible ON visible.[Id] = bu.[Id]
    WHERE (@Status IS NULL OR bu.[Status] = @Status)
      AND (@SearchTerm IS NULL OR bu.[Code] LIKE '%' + @SearchTerm + '%' OR bu.[Name] LIKE '%' + @SearchTerm + '%');

    SELECT bu.[Id], bu.[LegalEntityId], le.[Code] AS [LegalEntityCode], le.[Name] AS [LegalEntityName],
        bu.[Code], bu.[Name], bu.[Status], bu.[CreatedAtUtc], bu.[UpdatedAtUtc], bu.[RowVersion]
    FROM [dbo].[Org_BusinessUnits] bu
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = bu.[LegalEntityId]
    JOIN @VisibleUnits visible ON visible.[Id] = bu.[Id]
    WHERE (@Status IS NULL OR bu.[Status] = @Status)
      AND (@SearchTerm IS NULL OR bu.[Code] LIKE '%' + @SearchTerm + '%' OR bu.[Name] LIKE '%' + @SearchTerm + '%')
    ORDER BY
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN bu.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN bu.[Code] END DESC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'ASC' THEN bu.[Name] END ASC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'DESC' THEN bu.[Name] END DESC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'ASC' THEN bu.[Status] END ASC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'DESC' THEN bu.[Status] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN bu.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN bu.[CreatedAtUtc] END DESC,
        bu.[CreatedAtUtc] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Organization_BusinessUnit_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT bu.[Id], bu.[LegalEntityId], le.[Code] AS [LegalEntityCode], le.[Name] AS [LegalEntityName],
        bu.[Code], bu.[Name], bu.[Status], bu.[CreatedAtUtc], bu.[UpdatedAtUtc], bu.[RowVersion],
        (SELECT COUNT(1) FROM [dbo].[Org_Branches] br WHERE br.[BusinessUnitId] = bu.[Id] AND br.[IsDeleted] = 0) AS [BranchCount]
    FROM [dbo].[Org_BusinessUnits] bu
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = bu.[LegalEntityId]
    WHERE bu.[Id] = @Id
      AND bu.[IsDeleted] = 0
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
                AND p.[Code] = 'org.business_unit.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (ug.[ScopeType] = 'LegalEntity' AND ugm.[ScopeLegalEntityId] = bu.[LegalEntityId])
                    OR (ug.[ScopeType] = 'BusinessUnit' AND ugm.[ScopeBusinessUnitId] = bu.[Id])
                    OR (ug.[ScopeType] = 'Branch' AND EXISTS (
                        SELECT 1 FROM [dbo].[Org_Branches] br
                        WHERE br.[Id] = ugm.[ScopeBranchId] AND br.[BusinessUnitId] = bu.[Id] AND br.[IsDeleted] = 0
                    ))
                )
          )
      );
END;
GO
