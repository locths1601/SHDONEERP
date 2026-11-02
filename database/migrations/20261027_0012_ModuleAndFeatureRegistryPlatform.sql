-- =========================================================================
-- Migration: 20261027_0012_ModuleAndFeatureRegistryPlatform.sql
-- Description: FND-04 Module & Feature Registry Platform Schemas & Stored Procedures
--   1. Schema Enhancements: System_Modules, System_Features
--   2. New Tables: System_ModuleDependencies, System_FeatureActionPermissions
--   3. Seed Registry Permissions & Foundation Module/Feature Catalog
--   4. Stored Procedures for High-Performance CQRS Read Operations
-- =========================================================================

-- 1. NÂNG CẤP BẢNG SYSTEM_MODULES
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'ParentModuleId')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [ParentModuleId] UNIQUEIDENTIFIER NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'Icon')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [Icon] NVARCHAR(100) NULL CONSTRAINT DF_System_Modules_Icon DEFAULT 'Layers';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_Modules_Status DEFAULT 'Active';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'EffectiveFromUtc')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [EffectiveFromUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'EffectiveToUtc')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [EffectiveToUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Modules]') AND name = 'UpdatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[System_Modules] ADD [UpdatedAtUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_System_Modules_Parent]'))
BEGIN
    ALTER TABLE [dbo].[System_Modules]  WITH CHECK ADD  CONSTRAINT [FK_System_Modules_Parent] FOREIGN KEY([ParentModuleId])
    REFERENCES [dbo].[System_Modules] ([Id]);
END;
GO

-- 2. BẢNG QUẢN LÝ PHỤ THUỘC MODULE (SYSTEM_MODULEDEPENDENCIES)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_ModuleDependencies' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_ModuleDependencies] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_ModuleDependencies_Id DEFAULT NEWSEQUENTIALID(),
        [ModuleId] UNIQUEIDENTIFIER NOT NULL,
        [DependsOnModuleId] UNIQUEIDENTIFIER NOT NULL,
        [DependencyType] NVARCHAR(50) NOT NULL CONSTRAINT DF_System_ModuleDependencies_Type DEFAULT 'Required', -- Required, Optional, Extension
        [MinVersion] NVARCHAR(30) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_ModuleDependencies_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_ModuleDependencies] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_System_ModuleDependencies_Module] FOREIGN KEY ([ModuleId]) REFERENCES [dbo].[System_Modules] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_System_ModuleDependencies_DependsOn] FOREIGN KEY ([DependsOnModuleId]) REFERENCES [dbo].[System_Modules] ([Id]),
        CONSTRAINT [UQ_System_ModuleDependencies] UNIQUE NONCLUSTERED ([ModuleId], [DependsOnModuleId])
    );
END;
GO

-- 3. NÂNG CẤP BẢNG SYSTEM_FEATURES
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'FeatureType')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [FeatureType] NVARCHAR(50) NOT NULL CONSTRAINT DF_System_Features_Type DEFAULT 'Screen';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'ParentFeatureId')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [ParentFeatureId] UNIQUEIDENTIFIER NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'RoutePath')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [RoutePath] NVARCHAR(200) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'ApiEndpoint')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [ApiEndpoint] NVARCHAR(250) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'ComponentKey')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [ComponentKey] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'Icon')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [Icon] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'OrderIndex')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [OrderIndex] INT NOT NULL CONSTRAINT DF_System_Features_OrderIndex DEFAULT 0;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'SupportedActions')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [SupportedActions] NVARCHAR(500) NULL CONSTRAINT DF_System_Features_Actions DEFAULT '["view"]';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_Features_Status DEFAULT 'Active';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'OwnerTeam')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [OwnerTeam] NVARCHAR(100) NULL CONSTRAINT DF_System_Features_Owner DEFAULT 'Platform Team';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'DataClassification')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [DataClassification] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_Features_Classification DEFAULT 'Internal';
END;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_Features]') AND name = 'UpdatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[System_Features] ADD [UpdatedAtUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_System_Features_Parent]'))
BEGIN
    ALTER TABLE [dbo].[System_Features] WITH CHECK ADD CONSTRAINT [FK_System_Features_Parent] FOREIGN KEY([ParentFeatureId])
    REFERENCES [dbo].[System_Features] ([Id]);
END;
GO

-- 4. BẢNG ÁNH XẠ MODULE -> FEATURE -> ACTION -> PERMISSION
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_FeatureActionPermissions' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_FeatureActionPermissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_FeatureActionPermissions_Id DEFAULT NEWSEQUENTIALID(),
        [FeatureId] UNIQUEIDENTIFIER NOT NULL,
        [ActionCode] NVARCHAR(50) NOT NULL, -- view, create, edit, delete, export, assign, approve
        [ActionName] NVARCHAR(100) NOT NULL,
        [PermissionCode] NVARCHAR(100) NOT NULL,
        [PermissionId] UNIQUEIDENTIFIER NULL,
        [Description] NVARCHAR(500) NULL,
        [IsDefault] BIT NOT NULL CONSTRAINT DF_System_FeatureActionPermissions_IsDefault DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_FeatureActionPermissions_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_FeatureActionPermissions] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_System_FeatureActionPermissions_Feature] FOREIGN KEY ([FeatureId]) REFERENCES [dbo].[System_Features] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_System_FeatureActionPermissions_Permission] FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Identity_Permissions] ([Id]),
        CONSTRAINT [UQ_System_FeatureActionPermissions_Action] UNIQUE NONCLUSTERED ([FeatureId], [ActionCode]),
        CONSTRAINT [UQ_System_FeatureActionPermissions_Perm] UNIQUE NONCLUSTERED ([FeatureId], [PermissionCode])
    );
END;
GO

-- 5. SEED PERMISSIONS CHO MODULE & FEATURE REGISTRY
DECLARE @RegistryPermissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Module] NVARCHAR(50),
    [Description] NVARCHAR(250)
);

INSERT INTO @RegistryPermissions ([Code], [Name], [Module], [Description]) VALUES
('system.module.view', N'Xem danh mục Phân hệ (Module)', 'System', N'Cho phép tra cứu và xem danh mục phân hệ toàn hệ thống'),
('system.module.manage', N'Quản trị Phân hệ (Module)', 'System', N'Cho phép tạo mới, cập nhật cấu hình và quan hệ phụ thuộc phân hệ'),
('system.feature.view', N'Xem danh mục Tính năng (Feature)', 'System', N'Cho phép tra cứu danh mục chức năng theo phân hệ'),
('system.feature.manage', N'Quản trị Tính năng (Feature)', 'System', N'Cho phép đăng ký, sửa đổi metadata tính năng và hành động hỗ trợ'),
('system.permission_map.view', N'Xem Bản đồ ánh xạ Quyền', 'System', N'Cho phép tra cứu ma trận Module -> Feature -> Action -> Permission'),
('system.permission_map.manage', N'Quản trị Ánh xạ Quyền', 'System', N'Cho phép liên kết hành động nghiệp vụ với mã quyền định danh');

MERGE [dbo].[Identity_Permissions] AS target
USING @RegistryPermissions AS source
ON (target.[Code] = source.[Code])
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Module], [Description], [CreatedAtUtc])
    VALUES (NEWID(), source.[Code], source.[Name], source.[Module], source.[Description], SYSUTCDATETIME());
GO

-- Cập nhật quyền cho nhóm ADMINISTRATORS
DECLARE @AdminGroupId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000001';
IF EXISTS (SELECT 1 FROM [dbo].[Identity_UserGroups] WHERE [Id] = @AdminGroupId)
BEGIN
    INSERT INTO [dbo].[Identity_UserGroupPermissions] ([UserGroupId], [PermissionId], [GrantedAtUtc])
    SELECT @AdminGroupId, p.[Id], SYSUTCDATETIME()
    FROM [dbo].[Identity_Permissions] p
    WHERE p.[Code] IN (
        'system.module.view', 'system.module.manage',
        'system.feature.view', 'system.feature.manage',
        'system.permission_map.view', 'system.permission_map.manage'
    )
    AND NOT EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupPermissions] ugp
        WHERE ugp.[UserGroupId] = @AdminGroupId AND ugp.[PermissionId] = p.[Id]
    );
END;
GO

-- 6. SEED CÁC MODULE CHÍNH THỨC CỦA SHD ONEERP FOUNDATION
DECLARE @Modules TABLE (
    [Id] UNIQUEIDENTIFIER,
    [Code] NVARCHAR(50),
    [Name] NVARCHAR(150),
    [Description] NVARCHAR(500),
    [Version] NVARCHAR(30),
    [OrderIndex] INT,
    [Icon] NVARCHAR(100),
    [Status] NVARCHAR(30),
    [ParentCode] NVARCHAR(50) NULL
);

INSERT INTO @Modules ([Id], [Code], [Name], [Description], [Version], [OrderIndex], [Icon], [Status], [ParentCode]) VALUES
('A1000000-0000-0000-0000-000000000001', 'IDENTITY', N'Định danh & Phân quyền GBAC', N'Quản lý Người dùng, Nhóm quyền GBAC v4.2 và Cơ chế kiểm soát truy cập dữ liệu đa cấp', '1.0.0', 10, 'ShieldCheck', 'Active', NULL),
('A1000000-0000-0000-0000-000000000002', 'ORGANIZATION', N'Cấu trúc Tổ chức Đa Pháp nhân', N'Quản lý Tập đoàn, Pháp nhân thành viên (Legal Entity), Đơn vị kinh doanh (BU) và Cơ sở Campus', '1.0.0', 20, 'Building2', 'Active', NULL),
('A1000000-0000-0000-0000-000000000003', 'PARTY360', N'Quản trị Chủ thể Party 360', N'Hồ sơ định danh tập trung cho Học viên, Phụ huynh, Đối tác, Nhà cung cấp và Cán bộ nhân viên', '1.0.0', 30, 'Users', 'Active', NULL),
('A1000000-0000-0000-0000-000000000004', 'SYSTEM', N'Nền tảng Quản trị Hệ thống', N'Quản lý Danh mục Module, Feature, Dữ liệu dùng chung, Kiểm toán và Kiến trúc nền tảng', '1.0.0', 40, 'Layers', 'Active', NULL),
('A1000000-0000-0000-0000-000000000005', 'AUDIT', N'Nhật ký Kiểm toán Hệ thống', N'Truy vết toàn diện CUD, so sánh Before/After và che giấu dữ liệu nhạy cảm tự động', '1.0.0', 41, 'History', 'Active', 'SYSTEM'),
('A1000000-0000-0000-0000-000000000006', 'DOCUMENTS', N'Quản lý Hồ sơ & Phân loại Dữ liệu', N'Quản lý tài liệu đính kèm, phân loại dữ liệu (Public, Internal, Confidential, Restricted)', '1.0.0', 42, 'FileText', 'Active', 'SYSTEM'),
('A1000000-0000-0000-0000-000000000007', 'MASTERDATA', N'Danh mục Dữ liệu Dùng chung', N'Catalog và các mục dữ liệu tổng quát cho toàn bộ các phân hệ thành viên', '1.0.0', 43, 'Database', 'Active', 'SYSTEM'),
('A1000000-0000-0000-0000-000000000008', 'WORKFLOW', N'Quy trình Phê duyệt Doanh nghiệp', N'Động cơ luồng công việc đa cấp, State Machine và Transactional Outbox Events', '1.0.0', 44, 'GitBranch', 'Active', 'SYSTEM');

-- Merge Modules cấp 1 (Không có parent)
MERGE [dbo].[System_Modules] AS target
USING (SELECT * FROM @Modules WHERE [ParentCode] IS NULL) AS src
ON (target.[Code] = src.[Code])
WHEN MATCHED THEN
    UPDATE SET 
        target.[Name] = src.[Name],
        target.[Description] = src.[Description],
        target.[Version] = src.[Version],
        target.[OrderIndex] = src.[OrderIndex],
        target.[Icon] = src.[Icon],
        target.[Status] = src.[Status]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Description], [Version], [OrderIndex], [Icon], [Status], [IsActive], [CreatedAtUtc])
    VALUES (src.[Id], src.[Code], src.[Name], src.[Description], src.[Version], src.[OrderIndex], src.[Icon], src.[Status], 1, SYSUTCDATETIME());

-- Merge Modules cấp 2 (Có parent)
MERGE [dbo].[System_Modules] AS target
USING (
    SELECT m.*, p.[Id] AS [ResolvedParentId]
    FROM @Modules m
    JOIN [dbo].[System_Modules] p ON p.[Code] = m.[ParentCode]
    WHERE m.[ParentCode] IS NOT NULL
) AS src
ON (target.[Code] = src.[Code])
WHEN MATCHED THEN
    UPDATE SET 
        target.[Name] = src.[Name],
        target.[Description] = src.[Description],
        target.[Version] = src.[Version],
        target.[OrderIndex] = src.[OrderIndex],
        target.[Icon] = src.[Icon],
        target.[Status] = src.[Status],
        target.[ParentModuleId] = src.[ResolvedParentId]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Description], [Version], [OrderIndex], [Icon], [Status], [ParentModuleId], [IsActive], [CreatedAtUtc])
    VALUES (src.[Id], src.[Code], src.[Name], src.[Description], src.[Version], src.[OrderIndex], src.[Icon], src.[Status], src.[ResolvedParentId], 1, SYSUTCDATETIME());
GO

-- 7. SEED DEPENDENCIES GIỮA CÁC PHÂN HỆ
DECLARE @Deps TABLE (
    [ModuleCode] NVARCHAR(50),
    [DependsOnCode] NVARCHAR(50),
    [Type] NVARCHAR(50),
    [MinVersion] NVARCHAR(30)
);

INSERT INTO @Deps ([ModuleCode], [DependsOnCode], [Type], [MinVersion]) VALUES
('ORGANIZATION', 'IDENTITY', 'Required', '1.0.0'),
('PARTY360', 'ORGANIZATION', 'Required', '1.0.0'),
('SYSTEM', 'IDENTITY', 'Required', '1.0.0'),
('AUDIT', 'IDENTITY', 'Required', '1.0.0'),
('DOCUMENTS', 'ORGANIZATION', 'Required', '1.0.0'),
('WORKFLOW', 'IDENTITY', 'Required', '1.0.0');

MERGE [dbo].[System_ModuleDependencies] AS target
USING (
    SELECT d.[Type], d.[MinVersion], m1.[Id] AS [ModuleId], m2.[Id] AS [DependsOnModuleId]
    FROM @Deps d
    JOIN [dbo].[System_Modules] m1 ON m1.[Code] = d.[ModuleCode]
    JOIN [dbo].[System_Modules] m2 ON m2.[Code] = d.[DependsOnCode]
) AS src
ON (target.[ModuleId] = src.[ModuleId] AND target.[DependsOnModuleId] = src.[DependsOnModuleId])
WHEN MATCHED THEN
    UPDATE SET target.[DependencyType] = src.[Type], target.[MinVersion] = src.[MinVersion]
WHEN NOT MATCHED THEN
    INSERT ([ModuleId], [DependsOnModuleId], [DependencyType], [MinVersion], [CreatedAtUtc])
    VALUES (src.[ModuleId], src.[DependsOnModuleId], src.[Type], src.[MinVersion], SYSUTCDATETIME());
GO

-- 8. SEED CÁC TÍNH NĂNG (FEATURES)
DECLARE @Features TABLE (
    [Id] UNIQUEIDENTIFIER,
    [ModuleCode] NVARCHAR(50),
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(200),
    [Description] NVARCHAR(500),
    [FeatureType] NVARCHAR(50),
    [RoutePath] NVARCHAR(200),
    [ApiEndpoint] NVARCHAR(250),
    [ComponentKey] NVARCHAR(100),
    [Icon] NVARCHAR(100),
    [OrderIndex] INT,
    [SupportedActions] NVARCHAR(500),
    [Status] NVARCHAR(30),
    [OwnerTeam] NVARCHAR(100),
    [DataClassification] NVARCHAR(30)
);

INSERT INTO @Features ([Id], [ModuleCode], [Code], [Name], [Description], [FeatureType], [RoutePath], [ApiEndpoint], [ComponentKey], [Icon], [OrderIndex], [SupportedActions], [Status], [OwnerTeam], [DataClassification]) VALUES
-- Identity Features
('F1000000-0000-0000-0000-000000000001', 'IDENTITY', 'identity.users', N'Quản lý Người dùng & Tài khoản', N'Đăng ký, phân quyền và khóa tài khoản thành viên', 'Screen', '/admin/users', '/api/v1/identity/users', 'UsersPage', 'Users', 10, '["view", "create", "edit", "delete"]', 'Active', 'Security Team', 'Restricted'),
('F1000000-0000-0000-0000-000000000002', 'IDENTITY', 'identity.user_groups', N'Quản lý Nhóm quyền & Scope (GBAC)', N'Tạo nhóm quyền, phân bổ Data Scopes và gán ma trận quyền', 'Screen', '/admin/user-groups', '/api/v1/identity/user-groups', 'UserGroupsPage', 'ShieldCheck', 20, '["view", "create", "edit", "delete", "assign"]', 'Active', 'Security Team', 'Restricted'),
('F1000000-0000-0000-0000-000000000003', 'IDENTITY', 'identity.permissions', N'Danh mục Quyền Hệ thống', N'Tra cứu mã quyền, phân loại theo module và phân cấp bảo mật', 'Screen', '/admin/permissions', '/api/v1/identity/user-groups/permissions', 'PermissionsPage', 'Key', 30, '["view", "assign"]', 'Active', 'Security Team', 'Internal'),

-- Organization Features
('F1000000-0000-0000-0000-000000000010', 'ORGANIZATION', 'org.legal_entities', N'Quản lý Pháp nhân Thành viên', N'Thiết lập thông tin công ty thành viên, mã số thuế và cấu hình pháp nhân', 'Screen', '/organization/legal-entities', '/api/v1/organization/legal-entities', 'LegalEntitiesPage', 'Building2', 10, '["view", "create", "edit", "delete"]', 'Active', 'Enterprise Team', 'Internal'),
('F1000000-0000-0000-0000-000000000011', 'ORGANIZATION', 'org.business_units', N'Quản lý Đơn vị Kinh doanh (BU)', N'Thiết lập các Khối Đào tạo/Phòng ban trực thuộc pháp nhân', 'Screen', '/organization/business-units', '/api/v1/organization/business-units', 'BusinessUnitsPage', 'Layers', 20, '["view", "create", "edit", "delete"]', 'Active', 'Enterprise Team', 'Internal'),
('F1000000-0000-0000-0000-000000000012', 'ORGANIZATION', 'org.branches', N'Quản lý Chi nhánh & Cơ sở Đào tạo', N'Danh sách cơ sở campus, phòng học và địa điểm vận hành', 'Screen', '/organization/branches', '/api/v1/organization/branches', 'BranchesPage', 'MapPin', 30, '["view", "create", "edit", "delete"]', 'Active', 'Enterprise Team', 'Internal'),

-- Party 360 Features
('F1000000-0000-0000-0000-000000000020', 'PARTY360', 'party.profiles', N'Hồ sơ Chủ thể Party 360', N'Định danh cá nhân và tổ chức, thông tin CCCD, mã số thuế và vai trò', 'Screen', '/party-360', '/api/v1/parties', 'PartiesPage', 'Users', 10, '["view", "create", "edit"]', 'Active', 'Core CRM Team', 'Confidential'),

-- System & Platform Features
('F1000000-0000-0000-0000-000000000030', 'AUDIT', 'identity.audit_logs', N'Nhật ký Kiểm toán Hệ thống', N'Tra cứu lịch sử thao tác dữ liệu, Before/After Diff Viewer', 'Screen', '/admin/audit-logs', '/api/v1/identity/audit-logs', 'AuditLogsPage', 'History', 10, '["view", "export"]', 'Active', 'Security Team', 'Restricted'),
('F1000000-0000-0000-0000-000000000031', 'SYSTEM', 'system.modules', N'Danh mục Phân hệ (Module Registry)', N'Quản lý danh mục module, phiên bản, trạng thái hiệu lực và quan hệ phụ thuộc', 'Screen', '/admin/modules', '/api/v1/system/modules', 'ModuleRegistryPage', 'Layers', 20, '["view", "manage"]', 'Active', 'Platform Team', 'Internal'),
('F1000000-0000-0000-0000-000000000032', 'SYSTEM', 'system.features', N'Danh mục Tính năng (Feature Registry)', N'Quản lý danh mục chức năng theo module, endpoint API và hành động hỗ trợ', 'Screen', '/admin/features', '/api/v1/system/features', 'FeatureRegistryPage', 'Cpu', 30, '["view", "manage"]', 'Active', 'Platform Team', 'Internal'),
('F1000000-0000-0000-0000-000000000033', 'SYSTEM', 'system.permission_map', N'Bản đồ Ánh xạ Quyền & Actions', N'Xem và đối chiếu ma trận liên kết Module -> Feature -> Action -> PermissionCode', 'Screen', '/admin/permission-mapping', '/api/v1/system/permission-mapping', 'PermissionMappingPage', 'Share2', 40, '["view", "manage"]', 'Active', 'Security Team', 'Internal');

MERGE [dbo].[System_Features] AS target
USING (
    SELECT f.*, m.[Id] AS [ResolvedModuleId]
    FROM @Features f
    JOIN [dbo].[System_Modules] m ON m.[Code] = f.[ModuleCode]
) AS src
ON (target.[Code] = src.[Code])
WHEN MATCHED THEN
    UPDATE SET 
        target.[Name] = src.[Name],
        target.[Description] = src.[Description],
        target.[FeatureType] = src.[FeatureType],
        target.[RoutePath] = src.[RoutePath],
        target.[ApiEndpoint] = src.[ApiEndpoint],
        target.[ComponentKey] = src.[ComponentKey],
        target.[Icon] = src.[Icon],
        target.[OrderIndex] = src.[OrderIndex],
        target.[SupportedActions] = src.[SupportedActions],
        target.[Status] = src.[Status],
        target.[OwnerTeam] = src.[OwnerTeam],
        target.[DataClassification] = src.[DataClassification]
WHEN NOT MATCHED THEN
    INSERT ([Id], [ModuleId], [Code], [Name], [Description], [FeatureType], [RoutePath], [ApiEndpoint], [ComponentKey], [Icon], [OrderIndex], [SupportedActions], [Status], [OwnerTeam], [DataClassification], [IsEnabledGlobal], [CreatedAtUtc])
    VALUES (src.[Id], src.[ResolvedModuleId], src.[Code], src.[Name], src.[Description], src.[FeatureType], src.[RoutePath], src.[ApiEndpoint], src.[ComponentKey], src.[Icon], src.[OrderIndex], src.[SupportedActions], src.[Status], src.[OwnerTeam], src.[DataClassification], 1, SYSUTCDATETIME());
GO

-- 9. SEED ÁNH XẠ MODULE -> FEATURE -> ACTION -> PERMISSION
DECLARE @ActionMappings TABLE (
    [FeatureCode] NVARCHAR(100),
    [ActionCode] NVARCHAR(50),
    [ActionName] NVARCHAR(100),
    [PermissionCode] NVARCHAR(100),
    [Description] NVARCHAR(500)
);

INSERT INTO @ActionMappings ([FeatureCode], [ActionCode], [ActionName], [PermissionCode], [Description]) VALUES
-- Identity: User Groups
('identity.user_groups', 'view', N'Xem danh sách & Chi tiết nhóm', 'identity.group.view', N'Cho phép tra cứu và xem cấu hình nhóm người dùng'),
('identity.user_groups', 'create', N'Tạo nhóm người dùng mới', 'identity.group.create', N'Cho phép đăng ký nhóm quyền mới'),
('identity.user_groups', 'edit', N'Chỉnh sửa nhóm người dùng', 'identity.group.edit', N'Cho phép cập nhật thông tin và trạng thái nhóm'),
('identity.user_groups', 'delete', N'Xóa nhóm người dùng', 'identity.group.delete', N'Cho phép xóa nhóm người dùng không thuộc hệ thống'),
('identity.user_groups', 'assign', N'Gán thành viên & Cấp Scope', 'identity.group.assign', N'Cho phép phân bổ thành viên và thiết lập phạm vi dữ liệu'),

-- Identity: Users
('identity.users', 'view', N'Xem danh sách người dùng', 'identity.user.view', N'Cho phép tra cứu tài khoản nhân sự'),
('identity.users', 'create', N'Tạo người dùng mới', 'identity.user.create', N'Cho phép tạo mới tài khoản đăng nhập'),
('identity.users', 'edit', N'Chỉnh sửa người dùng', 'identity.user.edit', N'Cho phép cập nhật hồ sơ người dùng'),
('identity.users', 'delete', N'Khóa tài khoản', 'identity.user.delete', N'Cho phép khóa/vô hiệu hóa tài khoản'),

-- Identity: Permissions
('identity.permissions', 'view', N'Tra cứu danh mục quyền', 'identity.permission.view', N'Xem toàn bộ danh mục quyền trong hệ thống'),
('identity.permissions', 'assign', N'Phân bổ quyền cho nhóm', 'identity.permission.assign', N'Cấp phát quyền hạn trong ma trận nhóm'),

-- Identity: Audit Logs
('identity.audit_logs', 'view', N'Xem nhật ký kiểm toán', 'identity.audit.view', N'Xem chi tiết truy vết thay đổi dữ liệu theo scope'),
('identity.audit_logs', 'export', N'Xuất nhật ký kiểm toán', 'identity.audit.export', N'Trích xuất dữ liệu audit ra Excel/CSV'),

-- Organization: Legal Entities
('org.legal_entities', 'view', N'Xem danh sách pháp nhân', 'org.legal_entity.view', N'Tra cứu thông tin công ty thành viên'),
('org.legal_entities', 'create', N'Đăng ký pháp nhân mới', 'org.legal_entity.create', N'Thêm mới pháp nhân trong tập đoàn'),
('org.legal_entities', 'edit', N'Sửa thông tin pháp nhân', 'org.legal_entity.edit', N'Cập nhật thông tin chi tiết công ty'),
('org.legal_entities', 'delete', N'Đổi trạng thái pháp nhân', 'org.legal_entity.delete', N'Đổi trạng thái hoạt động của pháp nhân'),

-- Organization: Business Units
('org.business_units', 'view', N'Xem đơn vị kinh doanh (BU)', 'org.business_unit.view', N'Tra cứu các khối đào tạo'),
('org.business_units', 'create', N'Tạo đơn vị kinh doanh', 'org.business_unit.create', N'Thêm mới khối đào tạo thuộc pháp nhân'),
('org.business_units', 'edit', N'Sửa đơn vị kinh doanh', 'org.business_unit.edit', N'Cập nhật cấu hình khối đào tạo'),
('org.business_units', 'delete', N'Xóa đơn vị kinh doanh', 'org.business_unit.delete', N'Xóa đơn vị kinh doanh không còn hoạt động'),

-- Organization: Branches
('org.branches', 'view', N'Xem chi nhánh/campus', 'org.branch.view', N'Xem danh sách các cơ sở đào tạo'),
('org.branches', 'create', N'Tạo mới cơ sở campus', 'org.branch.create', N'Đăng ký cơ sở đào tạo mới'),
('org.branches', 'edit', N'Chỉnh sửa cơ sở campus', 'org.branch.edit', N'Cập nhật thông tin địa điểm chi nhánh'),
('org.branches', 'delete', N'Xóa chi nhánh/campus', 'org.branch.delete', N'Xóa cơ sở đào tạo'),

-- Party 360
('party.profiles', 'view', N'Xem hồ sơ chủ thể', 'party.profile.view', N'Tra cứu học viên, phụ huynh, đối tác'),
('party.profiles', 'create', N'Tạo mới chủ thể', 'party.profile.create', N'Thêm mới hồ sơ đối tượng'),
('party.profiles', 'edit', N'Sửa hồ sơ chủ thể', 'party.profile.edit', N'Cập nhật thông tin định danh và liên hệ'),

-- System: Module Registry
('system.modules', 'view', N'Xem danh mục Module', 'system.module.view', N'Xem danh sách module và cây phân cấp'),
('system.modules', 'manage', N'Quản trị Module', 'system.module.manage', N'Cấu hình module, phiên bản và quan hệ phụ thuộc'),

-- System: Feature Registry
('system.features', 'view', N'Xem danh mục Tính năng', 'system.feature.view', N'Xem danh sách tính năng theo module'),
('system.features', 'manage', N'Quản trị Tính năng', 'system.feature.manage', N'Đăng ký, cập nhật tính năng và hành động'),

-- System: Permission Mapping
('system.permission_map', 'view', N'Xem bản đồ ánh xạ quyền', 'system.permission_map.view', N'Tra cứu ma trận Module -> Feature -> Action -> Quyền'),
('system.permission_map', 'manage', N'Cấu hình ánh xạ quyền', 'system.permission_map.manage', N'Gắn kết hành động tính năng với mã quyền');

MERGE [dbo].[System_FeatureActionPermissions] AS target
USING (
    SELECT 
        am.[ActionCode], 
        am.[ActionName], 
        am.[PermissionCode], 
        am.[Description],
        f.[Id] AS [FeatureId],
        p.[Id] AS [PermissionId]
    FROM @ActionMappings am
    JOIN [dbo].[System_Features] f ON f.[Code] = am.[FeatureCode]
    LEFT JOIN [dbo].[Identity_Permissions] p ON p.[Code] = am.[PermissionCode]
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
-- 10. STORED PROCEDURES CHO MODULE & FEATURE REGISTRY (CQRS READ-SIDE)
-- =========================================================================

-- SP 1: Phân trang danh sách Modules
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Module_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @IsActive BIT = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[System_Modules] m WITH (NOLOCK)
    WHERE (@SearchTerm IS NULL OR m.[Code] LIKE '%' + @SearchTerm + '%' OR m.[Name] LIKE '%' + @SearchTerm + '%' OR m.[Description] LIKE '%' + @SearchTerm + '%')
      AND (@Status IS NULL OR m.[Status] = @Status)
      AND (@IsActive IS NULL OR m.[IsActive] = @IsActive);

    SELECT 
        m.[Id],
        m.[Code],
        m.[Name],
        m.[Description],
        m.[Version],
        m.[OrderIndex],
        m.[Icon],
        m.[Status],
        m.[IsActive],
        m.[ParentModuleId],
        p.[Name] AS [ParentModuleName],
        p.[Code] AS [ParentModuleCode],
        m.[EffectiveFromUtc],
        m.[EffectiveToUtc],
        m.[CreatedAtUtc],
        m.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_Features] f WITH (NOLOCK) WHERE f.[ModuleId] = m.[Id]) AS [FeatureCount],
        (SELECT COUNT(1) FROM [dbo].[System_ModuleDependencies] d WITH (NOLOCK) WHERE d.[ModuleId] = m.[Id]) AS [DependencyCount]
    FROM [dbo].[System_Modules] m WITH (NOLOCK)
    LEFT JOIN [dbo].[System_Modules] p WITH (NOLOCK) ON p.[Id] = m.[ParentModuleId]
    WHERE (@SearchTerm IS NULL OR m.[Code] LIKE '%' + @SearchTerm + '%' OR m.[Name] LIKE '%' + @SearchTerm + '%' OR m.[Description] LIKE '%' + @SearchTerm + '%')
      AND (@Status IS NULL OR m.[Status] = @Status)
      AND (@IsActive IS NULL OR m.[IsActive] = @IsActive)
    ORDER BY m.[OrderIndex] ASC, m.[Name] ASC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP 2: Chi tiết Module theo Id
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Module_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        m.[Id],
        m.[Code],
        m.[Name],
        m.[Description],
        m.[Version],
        m.[OrderIndex],
        m.[Icon],
        m.[Status],
        m.[IsActive],
        m.[ParentModuleId],
        p.[Name] AS [ParentModuleName],
        p.[Code] AS [ParentModuleCode],
        m.[EffectiveFromUtc],
        m.[EffectiveToUtc],
        m.[CreatedAtUtc],
        m.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_Features] f WITH (NOLOCK) WHERE f.[ModuleId] = m.[Id]) AS [FeatureCount],
        (SELECT COUNT(1) FROM [dbo].[System_ModuleDependencies] d WITH (NOLOCK) WHERE d.[ModuleId] = m.[Id]) AS [DependencyCount]
    FROM [dbo].[System_Modules] m WITH (NOLOCK)
    LEFT JOIN [dbo].[System_Modules] p WITH (NOLOCK) ON p.[Id] = m.[ParentModuleId]
    WHERE m.[Id] = @Id;

    -- Danh sách Module phụ thuộc (Dependencies)
    SELECT 
        d.[Id],
        d.[ModuleId],
        d.[DependsOnModuleId],
        m2.[Code] AS [DependsOnModuleCode],
        m2.[Name] AS [DependsOnModuleName],
        d.[DependencyType],
        d.[MinVersion],
        d.[CreatedAtUtc]
    FROM [dbo].[System_ModuleDependencies] d WITH (NOLOCK)
    JOIN [dbo].[System_Modules] m2 WITH (NOLOCK) ON m2.[Id] = d.[DependsOnModuleId]
    WHERE d.[ModuleId] = @Id;

    -- Danh sách Module con (Child Modules)
    SELECT 
        c.[Id],
        c.[Code],
        c.[Name],
        c.[Version],
        c.[OrderIndex],
        c.[Icon],
        c.[Status],
        c.[IsActive]
    FROM [dbo].[System_Modules] c WITH (NOLOCK)
    WHERE c.[ParentModuleId] = @Id
    ORDER BY c.[OrderIndex] ASC;
END;
GO

-- SP 3: Cây phân cấp Modules (Hierarchy)
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Module_GetHierarchy]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        m.[Id],
        m.[Code],
        m.[Name],
        m.[Description],
        m.[Version],
        m.[OrderIndex],
        m.[Icon],
        m.[Status],
        m.[IsActive],
        m.[ParentModuleId],
        (SELECT COUNT(1) FROM [dbo].[System_Features] f WITH (NOLOCK) WHERE f.[ModuleId] = m.[Id]) AS [FeatureCount]
    FROM [dbo].[System_Modules] m WITH (NOLOCK)
    WHERE m.[IsActive] = 1
    ORDER BY m.[OrderIndex] ASC, m.[Name] ASC;
END;
GO

-- SP 4: Phân trang danh sách Features
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Feature_GetPaged]
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @ModuleId UNIQUEIDENTIFIER = NULL,
    @FeatureType NVARCHAR(50) = NULL,
    @Status NVARCHAR(30) = NULL,
    @SearchTerm NVARCHAR(100) = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[System_Features] f WITH (NOLOCK)
    JOIN [dbo].[System_Modules] m WITH (NOLOCK) ON m.[Id] = f.[ModuleId]
    WHERE (@ModuleId IS NULL OR f.[ModuleId] = @ModuleId)
      AND (@FeatureType IS NULL OR f.[FeatureType] = @FeatureType)
      AND (@Status IS NULL OR f.[Status] = @Status)
      AND (@SearchTerm IS NULL OR f.[Code] LIKE '%' + @SearchTerm + '%' OR f.[Name] LIKE '%' + @SearchTerm + '%' OR f.[RoutePath] LIKE '%' + @SearchTerm + '%');

    SELECT 
        f.[Id],
        f.[ModuleId],
        m.[Code] AS [ModuleCode],
        m.[Name] AS [ModuleName],
        f.[Code],
        f.[Name],
        f.[Description],
        f.[FeatureType],
        f.[ParentFeatureId],
        pf.[Name] AS [ParentFeatureName],
        f.[RoutePath],
        f.[ApiEndpoint],
        f.[ComponentKey],
        f.[Icon],
        f.[OrderIndex],
        f.[SupportedActions],
        f.[Status],
        f.[OwnerTeam],
        f.[DataClassification],
        f.[IsEnabledGlobal],
        f.[CreatedAtUtc],
        f.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_FeatureActionPermissions] ap WITH (NOLOCK) WHERE ap.[FeatureId] = f.[Id]) AS [ActionCount]
    FROM [dbo].[System_Features] f WITH (NOLOCK)
    JOIN [dbo].[System_Modules] m WITH (NOLOCK) ON m.[Id] = f.[ModuleId]
    LEFT JOIN [dbo].[System_Features] pf WITH (NOLOCK) ON pf.[Id] = f.[ParentFeatureId]
    WHERE (@ModuleId IS NULL OR f.[ModuleId] = @ModuleId)
      AND (@FeatureType IS NULL OR f.[FeatureType] = @FeatureType)
      AND (@Status IS NULL OR f.[Status] = @Status)
      AND (@SearchTerm IS NULL OR f.[Code] LIKE '%' + @SearchTerm + '%' OR f.[Name] LIKE '%' + @SearchTerm + '%' OR f.[RoutePath] LIKE '%' + @SearchTerm + '%')
    ORDER BY m.[OrderIndex] ASC, f.[OrderIndex] ASC, f.[Name] ASC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP 5: Chi tiết Feature theo Id kèm Actions & Permission Mappings
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Feature_GetById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Feature info
    SELECT 
        f.[Id],
        f.[ModuleId],
        m.[Code] AS [ModuleCode],
        m.[Name] AS [ModuleName],
        f.[Code],
        f.[Name],
        f.[Description],
        f.[FeatureType],
        f.[ParentFeatureId],
        pf.[Name] AS [ParentFeatureName],
        pf.[Code] AS [ParentFeatureCode],
        f.[RoutePath],
        f.[ApiEndpoint],
        f.[ComponentKey],
        f.[Icon],
        f.[OrderIndex],
        f.[SupportedActions],
        f.[Status],
        f.[OwnerTeam],
        f.[DataClassification],
        f.[IsEnabledGlobal],
        f.[CreatedAtUtc],
        f.[UpdatedAtUtc]
    FROM [dbo].[System_Features] f WITH (NOLOCK)
    JOIN [dbo].[System_Modules] m WITH (NOLOCK) ON m.[Id] = f.[ModuleId]
    LEFT JOIN [dbo].[System_Features] pf WITH (NOLOCK) ON pf.[Id] = f.[ParentFeatureId]
    WHERE f.[Id] = @Id;

    -- Action & Permission mappings
    SELECT 
        ap.[Id],
        ap.[FeatureId],
        ap.[ActionCode],
        ap.[ActionName],
        ap.[PermissionCode],
        ap.[PermissionId],
        p.[Name] AS [PermissionName],
        p.[Module] AS [PermissionModule],
        ap.[Description],
        ap.[IsDefault],
        ap.[CreatedAtUtc]
    FROM [dbo].[System_FeatureActionPermissions] ap WITH (NOLOCK)
    LEFT JOIN [dbo].[Identity_Permissions] p WITH (NOLOCK) ON p.[Id] = ap.[PermissionId] OR p.[Code] = ap.[PermissionCode]
    WHERE ap.[FeatureId] = @Id
    ORDER BY ap.[ActionCode] ASC;
END;
GO

-- SP 6: Cây phân cấp Features theo ModuleId
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Feature_GetHierarchy]
    @ModuleId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        f.[Id],
        f.[ModuleId],
        m.[Code] AS [ModuleCode],
        m.[Name] AS [ModuleName],
        f.[Code],
        f.[Name],
        f.[FeatureType],
        f.[ParentFeatureId],
        f.[RoutePath],
        f.[Icon],
        f.[OrderIndex],
        f.[Status],
        f.[IsEnabledGlobal],
        (SELECT COUNT(1) FROM [dbo].[System_FeatureActionPermissions] ap WITH (NOLOCK) WHERE ap.[FeatureId] = f.[Id]) AS [ActionCount]
    FROM [dbo].[System_Features] f WITH (NOLOCK)
    JOIN [dbo].[System_Modules] m WITH (NOLOCK) ON m.[Id] = f.[ModuleId]
    WHERE (@ModuleId IS NULL OR f.[ModuleId] = @ModuleId)
    ORDER BY m.[OrderIndex] ASC, f.[OrderIndex] ASC;
END;
GO

-- SP 7: Toàn bộ Bản đồ Ánh xạ Quyền (Module -> Feature -> Action -> Permission)
CREATE OR ALTER PROCEDURE [dbo].[sp_System_PermissionMapping_GetAll]
    @ModuleId UNIQUEIDENTIFIER = NULL,
    @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    SELECT 
        ap.[Id] AS [MappingId],
        m.[Id] AS [ModuleId],
        m.[Code] AS [ModuleCode],
        m.[Name] AS [ModuleName],
        f.[Id] AS [FeatureId],
        f.[Code] AS [FeatureCode],
        f.[Name] AS [FeatureName],
        f.[FeatureType],
        ap.[ActionCode],
        ap.[ActionName],
        ap.[PermissionCode],
        p.[Id] AS [PermissionId],
        ISNULL(p.[Name], ap.[ActionName]) AS [PermissionName],
        p.[Description] AS [PermissionDescription],
        ap.[IsDefault],
        f.[Status] AS [FeatureStatus],
        m.[Status] AS [ModuleStatus],
        ap.[CreatedAtUtc]
    FROM [dbo].[System_FeatureActionPermissions] ap WITH (NOLOCK)
    JOIN [dbo].[System_Features] f WITH (NOLOCK) ON f.[Id] = ap.[FeatureId]
    JOIN [dbo].[System_Modules] m WITH (NOLOCK) ON m.[Id] = f.[ModuleId]
    LEFT JOIN [dbo].[Identity_Permissions] p WITH (NOLOCK) ON p.[Id] = ap.[PermissionId] OR p.[Code] = ap.[PermissionCode]
    WHERE (@ModuleId IS NULL OR m.[Id] = @ModuleId)
      AND (@SearchTerm IS NULL 
           OR m.[Code] LIKE '%' + @SearchTerm + '%'
           OR m.[Name] LIKE '%' + @SearchTerm + '%'
           OR f.[Code] LIKE '%' + @SearchTerm + '%'
           OR f.[Name] LIKE '%' + @SearchTerm + '%'
           OR ap.[ActionCode] LIKE '%' + @SearchTerm + '%'
           OR ap.[PermissionCode] LIKE '%' + @SearchTerm + '%')
    ORDER BY m.[OrderIndex] ASC, f.[OrderIndex] ASC, ap.[ActionCode] ASC;
END;
GO
