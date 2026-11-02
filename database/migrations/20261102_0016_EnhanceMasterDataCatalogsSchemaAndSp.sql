-- =========================================================================
-- Migration: 20261102_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql
-- Description: SYS-REF-01 System Reference Data Catalogs Foundation
--   1. Schema Enhancements: System_MasterDataCatalogs (OwnerModule, ScopePolicy, IsActive, RowVersion, UpdatedAtUtc)
--   2. Unique Constraints & Indexes on Catalog Code
--   3. CQRS Stored Procedures: sp_System_MasterData_Catalog_GetPagedList, sp_System_MasterData_Catalog_GetById
--   4. Seed Permissions, Feature Registry & Feature Action Mappings
--   5. Grant Permissions to ADMINISTRATORS Group
-- =========================================================================

-- =========================================================================
-- PHẦN I: DDL NÂNG CẤP BẢNG System_MasterDataCatalogs
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'OwnerModule')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [OwnerModule] NVARCHAR(50) NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_OwnerModule DEFAULT 'SYSTEM';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'ScopePolicy')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [ScopePolicy] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_ScopePolicy DEFAULT 'GLOBAL';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'IsActive')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [IsActive] BIT NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_IsActive DEFAULT 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'UpdatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [UpdatedAtUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'RowVersion')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [RowVersion] ROWVERSION NOT NULL;
END;
GO

-- Đảm bảo Unique Index trên Code
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'UQ_System_MasterDataCatalogs_Code')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_System_MasterDataCatalogs_Code] 
    ON [dbo].[System_MasterDataCatalogs] ([Code] ASC);
END;
GO

-- =========================================================================
-- PHẦN II: STORED PROCEDURES (CQRS READ-SIDE)
-- =========================================================================

-- 1. SP: sp_System_MasterData_Catalog_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Catalog_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @OwnerModule NVARCHAR(50) = NULL,
    @IsActive BIT = NULL,
    @IsSystem BIT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(50) = 'Code',
    @SortOrder NVARCHAR(4) = 'ASC',
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa tham số phân trang
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');
    SET @OwnerModule = NULLIF(LTRIM(RTRIM(@OwnerModule)), '');

    -- Whitelist Sort
    DECLARE @SafeSortBy NVARCHAR(50);
    SET @SafeSortBy = CASE LOWER(@SortBy)
        WHEN 'code' THEN 'Code'
        WHEN 'name' THEN 'Name'
        WHEN 'ownermodule' THEN 'OwnerModule'
        WHEN 'createdatutc' THEN 'CreatedAtUtc'
        ELSE 'Code'
    END;

    DECLARE @SafeSortOrder NVARCHAR(4);
    SET @SafeSortOrder = CASE UPPER(@SortOrder)
        WHEN 'DESC' THEN 'DESC'
        ELSE 'ASC'
    END;

    -- Tính tổng số bản ghi
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[System_MasterDataCatalogs] c WITH (NOLOCK)
    WHERE (@SearchTerm IS NULL OR c.[Code] LIKE '%' + @SearchTerm + '%' OR c.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@OwnerModule IS NULL OR c.[OwnerModule] = @OwnerModule)
      AND (@IsActive IS NULL OR c.[IsActive] = @IsActive)
      AND (@IsSystem IS NULL OR c.[IsSystem] = @IsSystem);

    -- Lấy dữ liệu phân trang
    SELECT 
        c.[Id],
        c.[Code],
        c.[Name],
        c.[Description],
        c.[OwnerModule],
        c.[ScopePolicy],
        c.[IsSystem],
        c.[IsActive],
        c.[RowVersion],
        c.[CreatedAtUtc],
        c.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK) WHERE i.[CatalogId] = c.[Id]) AS [ItemCount]
    FROM [dbo].[System_MasterDataCatalogs] c WITH (NOLOCK)
    WHERE (@SearchTerm IS NULL OR c.[Code] LIKE '%' + @SearchTerm + '%' OR c.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@OwnerModule IS NULL OR c.[OwnerModule] = @OwnerModule)
      AND (@IsActive IS NULL OR c.[IsActive] = @IsActive)
      AND (@IsSystem IS NULL OR c.[IsSystem] = @IsSystem)
    ORDER BY
        CASE WHEN @SafeSortBy = 'Code' AND @SafeSortOrder = 'ASC' THEN c.[Code] END ASC,
        CASE WHEN @SafeSortBy = 'Code' AND @SafeSortOrder = 'DESC' THEN c.[Code] END DESC,
        CASE WHEN @SafeSortBy = 'Name' AND @SafeSortOrder = 'ASC' THEN c.[Name] END ASC,
        CASE WHEN @SafeSortBy = 'Name' AND @SafeSortOrder = 'DESC' THEN c.[Name] END DESC,
        CASE WHEN @SafeSortBy = 'OwnerModule' AND @SafeSortOrder = 'ASC' THEN c.[OwnerModule] END ASC,
        CASE WHEN @SafeSortBy = 'OwnerModule' AND @SafeSortOrder = 'DESC' THEN c.[OwnerModule] END DESC,
        CASE WHEN @SafeSortBy = 'CreatedAtUtc' AND @SafeSortOrder = 'ASC' THEN c.[CreatedAtUtc] END ASC,
        CASE WHEN @SafeSortBy = 'CreatedAtUtc' AND @SafeSortOrder = 'DESC' THEN c.[CreatedAtUtc] END DESC,
        c.[Code] ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. SP: sp_System_MasterData_Catalog_GetById
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Catalog_GetById]
    @CatalogId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.[Id],
        c.[Code],
        c.[Name],
        c.[Description],
        c.[OwnerModule],
        c.[ScopePolicy],
        c.[IsSystem],
        c.[IsActive],
        c.[RowVersion],
        c.[CreatedAtUtc],
        c.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_MasterDataItems] i WITH (NOLOCK) WHERE i.[CatalogId] = c.[Id]) AS [ItemCount]
    FROM [dbo].[System_MasterDataCatalogs] c WITH (NOLOCK)
    WHERE c.[Id] = @CatalogId;
END;
GO

-- =========================================================================
-- PHẦN III: SEED PERMISSIONS, FEATURE REGISTRY & ACTION MAPPINGS
-- =========================================================================

-- 1. SEED PERMISSIONS
DECLARE @RefDataPermissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(200),
    [Description] NVARCHAR(500),
    [Module] NVARCHAR(50)
);

INSERT INTO @RefDataPermissions VALUES
('system.reference_data.view', N'Xem danh mục dữ liệu nguồn', N'Quyền tra cứu danh sách và chi tiết nhóm danh mục tham chiếu', 'SYSTEM'),
('system.reference_data.manage', N'Quản trị nhóm danh mục dữ liệu nguồn', N'Quyền tạo mới, sửa tên/mô tả và kích hoạt/ngừng dùng nhóm danh mục quản trị', 'SYSTEM'),
('system.reference_data.system_admin', N'Quản trị danh mục hệ thống cốt lõi', N'Quyền đặc biệt chỉnh sửa nhóm danh mục hệ thống (SYSTEM_CONTROLLED)', 'SYSTEM');

MERGE [dbo].[Identity_Permissions] AS target
USING @RefDataPermissions AS src
ON target.[Code] = src.[Code]
WHEN MATCHED THEN
    UPDATE SET 
        target.[Name] = src.[Name],
        target.[Description] = src.[Description],
        target.[Module] = src.[Module]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Description], [Module], [CreatedAtUtc])
    VALUES (NEWID(), src.[Code], src.[Name], src.[Description], src.[Module], SYSUTCDATETIME());
GO

-- 2. SEED FEATURE REGISTRY
DECLARE @SystemModuleId UNIQUEIDENTIFIER;
SELECT @SystemModuleId = [Id] FROM [dbo].[System_Modules] WHERE [Code] = 'SYSTEM';

IF @SystemModuleId IS NOT NULL
BEGIN
    DECLARE @FeatureId UNIQUEIDENTIFIER = 'F1000000-0000-0000-0000-000000000034';
    IF NOT EXISTS (SELECT 1 FROM [dbo].[System_Features] WHERE [Code] = 'system.reference_data')
    BEGIN
        INSERT INTO [dbo].[System_Features] (
            [Id], [ModuleId], [Code], [Name], [Description], 
            [FeatureType], [RoutePath], [Icon], [OrderIndex], [Status], 
            [IsEnabledGlobal], [CreatedAtUtc]
        ) VALUES (
            @FeatureId,
            @SystemModuleId,
            'system.reference_data',
            N'Dữ liệu nguồn & Danh mục dùng chung',
            N'Quản lý nhóm danh mục và giá trị danh mục dùng chung toàn ERP',
            'STANDARD',
            '/admin/reference-data',
            'Database',
            4,
            'ACTIVE',
            1,
            SYSUTCDATETIME()
        );
    END;
END;
GO

-- 3. SEED FEATURE ACTION MAPPINGS
DECLARE @RefActionMappings TABLE (
    [FeatureCode] NVARCHAR(100),
    [ActionCode] NVARCHAR(50),
    [ActionName] NVARCHAR(100),
    [PermissionCode] NVARCHAR(100),
    [Description] NVARCHAR(500)
);

INSERT INTO @RefActionMappings VALUES
('system.reference_data', 'view', N'Xem danh mục', 'system.reference_data.view', N'Xem danh sách và chi tiết nhóm danh mục'),
('system.reference_data', 'manage', N'Quản trị danh mục', 'system.reference_data.manage', N'Tạo mới, sửa và đổi trạng thái nhóm danh mục'),
('system.reference_data', 'system_admin', N'Quản trị hệ thống', 'system.reference_data.system_admin', N'Quản trị nhóm danh mục hệ thống cốt lõi');

MERGE [dbo].[System_FeatureActionPermissions] AS target
USING (
    SELECT 
        m.[ActionCode],
        m.[ActionName],
        m.[PermissionCode],
        m.[Description],
        f.[Id] AS [FeatureId],
        p.[Id] AS [PermissionId]
    FROM @RefActionMappings m
    JOIN [dbo].[System_Features] f ON f.[Code] = m.[FeatureCode]
    JOIN [dbo].[Identity_Permissions] p ON p.[Code] = m.[PermissionCode]
) AS src
ON (target.[FeatureId] = src.[FeatureId] AND target.[ActionCode] = src.[ActionCode])
WHEN MATCHED THEN
    UPDATE SET 
        target.[ActionName] = src.[ActionName],
        target.[PermissionCode] = src.[PermissionCode],
        target.[PermissionId] = src.[PermissionId],
        target.[Description] = src.[Description]
WHEN NOT MATCHED THEN
    INSERT ([FeatureId], [ActionCode], [ActionName], [PermissionCode], [PermissionId], [Description], [IsDefault], [CreatedAtUtc])
    VALUES (src.[FeatureId], src.[ActionCode], src.[ActionName], src.[PermissionCode], src.[PermissionId], src.[Description], 1, SYSUTCDATETIME());
GO

-- =========================================================================
-- PHẦN IV: CẤP QUYỀN TOÀN QUYỀN CHO NHÓM ADMINISTRATORS
-- =========================================================================

DECLARE @AdminGroupId UNIQUEIDENTIFIER;
SELECT @AdminGroupId = [Id] FROM [dbo].[Identity_UserGroups] WHERE [Code] = 'ADMINISTRATORS';

IF @AdminGroupId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[Identity_UserGroupPermissions] ([UserGroupId], [PermissionId], [GrantedAtUtc])
    SELECT @AdminGroupId, p.[Id], SYSUTCDATETIME()
    FROM [dbo].[Identity_Permissions] p
    WHERE p.[Code] IN ('system.reference_data.view', 'system.reference_data.manage', 'system.reference_data.system_admin')
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[Identity_UserGroupPermissions] existing
          WHERE existing.[UserGroupId] = @AdminGroupId AND existing.[PermissionId] = p.[Id]
      );
END;
GO

