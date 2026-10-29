-- =========================================================================
-- Migration: 20261026_0008_Party360StoredProcedures.sql
-- Description: Stored Procedures phục vụ Read-side và Scope Filtering cho Party 360
-- =========================================================================

-- 1. SP: sp_Party_GetPaged
CREATE OR ALTER PROCEDURE [dbo].[sp_Party_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @PartyType NVARCHAR(20) = NULL,
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
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
    SET @PartyType = NULLIF(LTRIM(RTRIM(@PartyType)), '');
    SET @Status = NULLIF(LTRIM(RTRIM(@Status)), '');

    -- Tập hợp Party hợp lệ theo Scope của CurrentUserId
    DECLARE @VisibleParties TABLE ([Id] UNIQUEIDENTIFIER PRIMARY KEY);

    INSERT INTO @VisibleParties ([Id])
    SELECT p.[Id]
    FROM [dbo].[Party_Parties] p
    WHERE p.[IsDeleted] = 0
      AND @CurrentUserId IS NOT NULL
      AND (
          -- Quản trị viên hệ thống (Global Scope)
          EXISTS (
              SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              WHERE ugm.[UserId] = @CurrentUserId
                AND ug.[Code] = 'ADMINISTRATORS'
                AND ug.[IsActive] = 1
          )
          -- Hoặc có quyền party.profile.view với Scope phù hợp
          OR EXISTS (
              SELECT 1
              FROM [dbo].[Identity_Users] u
              JOIN [dbo].[Identity_UserGroupMembers] ugm ON ugm.[UserId] = u.[Id]
              JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
              JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
              JOIN [dbo].[Identity_Permissions] perm ON perm.[Id] = ugp.[PermissionId]
              WHERE u.[Id] = @CurrentUserId
                AND u.[IsActive] = 1
                AND ug.[IsActive] = 1
                AND perm.[Code] = 'party.profile.view'
                AND (
                    ug.[ScopeType] = 'Global'
                    OR (
                        ug.[ScopeType] = 'LegalEntity'
                        AND EXISTS (
                            SELECT 1 FROM [dbo].[Party_PartyRoles] pr
                            WHERE pr.[PartyId] = p.[Id]
                              AND pr.[LegalEntityId] = ugm.[ScopeLegalEntityId]
                              AND pr.[IsActive] = 1
                        )
                    )
                )
          )
      );

    -- Tính tổng số bản ghi
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Party_Parties] p
    JOIN @VisibleParties visible ON visible.[Id] = p.[Id]
    LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    LEFT JOIN [dbo].[Party_OrganizationParties] org ON org.[PartyId] = p.[Id]
    WHERE (@PartyType IS NULL OR p.[PartyType] = @PartyType)
      AND (@Status IS NULL OR p.[Status] = @Status)
      AND (@LegalEntityId IS NULL OR EXISTS (
          SELECT 1 FROM [dbo].[Party_PartyRoles] pr
          WHERE pr.[PartyId] = p.[Id] AND pr.[LegalEntityId] = @LegalEntityId AND pr.[IsActive] = 1
      ))
      AND (
          @SearchTerm IS NULL
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR per.[FirstName] LIKE '%' + @SearchTerm + '%'
          OR per.[LastName] LIKE '%' + @SearchTerm + '%'
          OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
          OR org.[CompanyName] LIKE '%' + @SearchTerm + '%'
          OR org.[TradingName] LIKE '%' + @SearchTerm + '%'
          OR org.[TaxId] LIKE '%' + @SearchTerm + '%'
          OR EXISTS (
              SELECT 1 FROM [dbo].[Party_PartyContactMethods] cm
              WHERE cm.[PartyId] = p.[Id] AND cm.[Value] LIKE '%' + @SearchTerm + '%'
          )
      );

    -- Trả về dữ liệu phân trang
    SELECT
        p.[Id],
        p.[PartyType],
        p.[Code],
        CASE 
            WHEN p.[PartyType] = 'Person' THEN LTRIM(RTRIM(CONCAT(per.[LastName], ' ', per.[FirstName])))
            ELSE org.[CompanyName]
        END AS [DisplayName],
        p.[Status],
        (
            SELECT TOP 1 cm.[Value]
            FROM [dbo].[Party_PartyContactMethods] cm
            WHERE cm.[PartyId] = p.[Id] AND cm.[ContactType] = 'Email'
            ORDER BY cm.[IsPrimary] DESC, cm.[CreatedAtUtc] ASC
        ) AS [PrimaryEmail],
        (
            SELECT TOP 1 cm.[Value]
            FROM [dbo].[Party_PartyContactMethods] cm
            WHERE cm.[PartyId] = p.[Id] AND cm.[ContactType] = 'Phone'
            ORDER BY cm.[IsPrimary] DESC, cm.[CreatedAtUtc] ASC
        ) AS [PrimaryPhone],
        (
            SELECT COUNT(1)
            FROM [dbo].[Party_PartyRoles] pr
            WHERE pr.[PartyId] = p.[Id] AND pr.[IsActive] = 1
        ) AS [RoleCount],
        p.[CreatedAtUtc],
        p.[UpdatedAtUtc],
        p.[RowVersion]
    FROM [dbo].[Party_Parties] p
    JOIN @VisibleParties visible ON visible.[Id] = p.[Id]
    LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    LEFT JOIN [dbo].[Party_OrganizationParties] org ON org.[PartyId] = p.[Id]
    WHERE (@PartyType IS NULL OR p.[PartyType] = @PartyType)
      AND (@Status IS NULL OR p.[Status] = @Status)
      AND (@LegalEntityId IS NULL OR EXISTS (
          SELECT 1 FROM [dbo].[Party_PartyRoles] pr
          WHERE pr.[PartyId] = p.[Id] AND pr.[LegalEntityId] = @LegalEntityId AND pr.[IsActive] = 1
      ))
      AND (
          @SearchTerm IS NULL
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR per.[FirstName] LIKE '%' + @SearchTerm + '%'
          OR per.[LastName] LIKE '%' + @SearchTerm + '%'
          OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
          OR org.[CompanyName] LIKE '%' + @SearchTerm + '%'
          OR org.[TradingName] LIKE '%' + @SearchTerm + '%'
          OR org.[TaxId] LIKE '%' + @SearchTerm + '%'
          OR EXISTS (
              SELECT 1 FROM [dbo].[Party_PartyContactMethods] cm
              WHERE cm.[PartyId] = p.[Id] AND cm.[Value] LIKE '%' + @SearchTerm + '%'
          )
      )
    ORDER BY
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN p.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN p.[Code] END DESC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'ASC' THEN p.[Status] END ASC,
        CASE WHEN @SortBy = 'Status' AND @SortOrder = 'DESC' THEN p.[Status] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN p.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN p.[CreatedAtUtc] END DESC,
        p.[CreatedAtUtc] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. SP: sp_Party_GetById
CREATE OR ALTER PROCEDURE [dbo].[sp_Party_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra quyền xem Party
    IF @CurrentUserId IS NULL
        RETURN;

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Party_Parties] p
        WHERE p.[Id] = @Id AND p.[IsDeleted] = 0
          AND (
              EXISTS (
                  SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
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
                  JOIN [dbo].[Identity_Permissions] perm ON perm.[Id] = ugp.[PermissionId]
                  WHERE u.[Id] = @CurrentUserId
                    AND u.[IsActive] = 1
                    AND ug.[IsActive] = 1
                    AND perm.[Code] = 'party.profile.view'
                    AND (
                        ug.[ScopeType] = 'Global'
                        OR (
                            ug.[ScopeType] = 'LegalEntity'
                            AND EXISTS (
                                SELECT 1 FROM [dbo].[Party_PartyRoles] pr
                                WHERE pr.[PartyId] = p.[Id]
                                  AND pr.[LegalEntityId] = ugm.[ScopeLegalEntityId]
                                  AND pr.[IsActive] = 1
                            )
                        )
                    )
              )
          )
    )
    BEGIN
        RETURN;
    END;

    -- Set 1: Thông tin chính Party & Person/Org
    SELECT
        p.[Id],
        p.[PartyType],
        p.[Code],
        p.[Status],
        p.[CreatedAtUtc],
        p.[UpdatedAtUtc],
        p.[RowVersion],
        -- Person details
        per.[FirstName],
        per.[LastName],
        per.[DateOfBirth],
        per.[Gender],
        per.[Nationality],
        -- Organization details
        org.[CompanyName],
        org.[TradingName],
        org.[TaxId],
        org.[RegistrationNumber]
    FROM [dbo].[Party_Parties] p
    LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    LEFT JOIN [dbo].[Party_OrganizationParties] org ON org.[PartyId] = p.[Id]
    WHERE p.[Id] = @Id AND p.[IsDeleted] = 0;

    -- Set 2: Danh sách Roles
    SELECT
        pr.[Id],
        pr.[PartyId],
        pr.[RoleType],
        pr.[LegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        pr.[IsActive],
        pr.[CreatedAtUtc]
    FROM [dbo].[Party_PartyRoles] pr
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = pr.[LegalEntityId]
    WHERE pr.[PartyId] = @Id
    ORDER BY pr.[CreatedAtUtc] DESC;

    -- Set 3: Phương thức liên hệ
    SELECT
        cm.[Id],
        cm.[PartyId],
        cm.[ContactType],
        cm.[Value],
        cm.[IsPrimary],
        cm.[CreatedAtUtc]
    FROM [dbo].[Party_PartyContactMethods] cm
    WHERE cm.[PartyId] = @Id
    ORDER BY cm.[IsPrimary] DESC, cm.[CreatedAtUtc] ASC;
END;
GO

