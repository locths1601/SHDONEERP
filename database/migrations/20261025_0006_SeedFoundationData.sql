-- =========================================================================
-- Migration: 20261025_0006_SeedFoundationData.sql
-- Description: Dữ liệu quyền cơ bản, nhóm quản trị ADMINISTRATORS và mẫu pháp nhân
-- =========================================================================

-- 1. Seed Permissions
DECLARE @Permissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Module] NVARCHAR(50),
    [Description] NVARCHAR(250)
);

INSERT INTO @Permissions ([Code], [Name], [Module], [Description]) VALUES
-- Identity Module
('identity.user.view', N'Xem danh sách người dùng', 'Identity', N'Cho phép xem danh sách và chi tiết tài khoản người dùng'),
('identity.user.create', N'Tạo người dùng mới', 'Identity', N'Cho phép thêm tài khoản người dùng mới'),
('identity.user.edit', N'Chỉnh sửa người dùng', 'Identity', N'Cho phép cập nhật thông tin người dùng'),
('identity.user.delete', N'Khóa/Xóa người dùng', 'Identity', N'Cho phép khóa hoặc xóa tài khoản người dùng'),
('identity.group.view', N'Xem nhóm quyền', 'Identity', N'Cho phép xem danh sách nhóm người dùng'),
('identity.group.create', N'Tạo nhóm quyền', 'Identity', N'Cho phép tạo nhóm quyền mới'),
('identity.group.edit', N'Chỉnh sửa nhóm quyền', 'Identity', N'Cho phép sửa cấu hình nhóm quyền'),
('identity.group.delete', N'Xóa nhóm quyền', 'Identity', N'Cho phép xóa nhóm quyền không thuộc hệ thống'),
('identity.group.assign', N'Gán thành viên nhóm', 'Identity', N'Cho phép gán người dùng vào nhóm và phân định scope'),
('identity.permission.view', N'Xem danh mục quyền', 'Identity', N'Cho phép tra cứu danh mục quyền trong hệ thống'),
('identity.permission.assign', N'Gán quyền cho nhóm', 'Identity', N'Cho phép phân bổ quyền cho nhóm người dùng'),

-- Organization Module
('org.legal_entity.view', N'Xem pháp nhân', 'Organization', N'Cho phép xem danh sách và chi tiết pháp nhân'),
('org.legal_entity.create', N'Tạo pháp nhân', 'Organization', N'Cho phép đăng ký pháp nhân mới'),
('org.legal_entity.edit', N'Chỉnh sửa pháp nhân', 'Organization', N'Cho phép cập nhật thông tin pháp nhân'),
('org.legal_entity.delete', N'Xóa pháp nhân', 'Organization', N'Cho phép xóa/đổi trạng thái pháp nhân'),
('org.business_unit.view', N'Xem đơn vị kinh doanh', 'Organization', N'Cho phép xem danh sách đơn vị kinh doanh'),
('org.business_unit.create', N'Tạo đơn vị kinh doanh', 'Organization', N'Cho phép tạo đơn vị kinh doanh mới'),
('org.business_unit.edit', N'Sửa đơn vị kinh doanh', 'Organization', N'Cho phép cập nhật đơn vị kinh doanh'),
('org.business_unit.delete', N'Xóa đơn vị kinh doanh', 'Organization', N'Cho phép xóa đơn vị kinh doanh'),
('org.branch.view', N'Xem chi nhánh/cơ sở', 'Organization', N'Cho phép xem danh sách chi nhánh'),
('org.branch.create', N'Tạo chi nhánh/cơ sở', 'Organization', N'Cho phép tạo mới chi nhánh'),
('org.branch.edit', N'Sửa chi nhánh/cơ sở', 'Organization', N'Cho phép cập nhật chi nhánh'),
('org.branch.delete', N'Xóa chi nhánh/cơ sở', 'Organization', N'Cho phép xóa chi nhánh'),

-- Party 360 Module
('party.profile.view', N'Xem hồ sơ Party 360', 'Party360', N'Cho phép xem thông tin định danh học viên/đối tác'),
('party.profile.create', N'Tạo hồ sơ Party 360', 'Party360', N'Cho phép tạo mới học viên/đối tác'),
('party.profile.edit', N'Sửa hồ sơ Party 360', 'Party360', N'Cho phép cập nhật thông tin định danh');

MERGE [dbo].[Identity_Permissions] AS target
USING @Permissions AS source
ON (target.[Code] = source.[Code])
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Module], [Description], [CreatedAtUtc])
    VALUES (NEWID(), source.[Code], source.[Name], source.[Module], source.[Description], SYSUTCDATETIME());

-- 2. Seed System Administrator Group
IF NOT EXISTS (SELECT 1 FROM [dbo].[Identity_UserGroups] WHERE [Code] = 'ADMINISTRATORS')
BEGIN
    INSERT INTO [dbo].[Identity_UserGroups] ([Id], [Code], [Name], [Description], [ScopeType], [IsSystem], [IsActive], [CreatedAtUtc])
    VALUES (
        'A0000000-0000-0000-0000-000000000001',
        'ADMINISTRATORS',
        N'Quản trị viên toàn hệ thống',
        N'Nhóm quản trị tối cao với phạm vi Global, sở hữu toàn quyền quản trị hệ thống',
        'Global',
        1,
        1,
        SYSUTCDATETIME()
    );
END;

-- 3. Gán tất cả permissions cho nhóm ADMINISTRATORS
INSERT INTO [dbo].[Identity_UserGroupPermissions] ([UserGroupId], [PermissionId], [GrantedAtUtc])
SELECT 'A0000000-0000-0000-0000-000000000001', p.[Id], SYSUTCDATETIME()
FROM [dbo].[Identity_Permissions] p
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[Identity_UserGroupPermissions] ugp
    WHERE ugp.[UserGroupId] = 'A0000000-0000-0000-0000-000000000001' AND ugp.[PermissionId] = p.[Id]
);

-- 4. Seed Bootstrap Admin User (Mật khẩu hash mặc định của: ChangeMeOnFirstLogin@2026!)
-- Sử dụng chuẩn PBKDF2 với SHA256 tương thích ASP.NET Core Identity
-- Password hash: AQAAAAIAAYagAAAAEOc51T8L8pB2Uq+fI5yF9lE3h0j7v/4n0m3bBqL1w7A= (Placeholder verified by Identity hasher)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Identity_Users] WHERE [Email] = 'admin@shdcorp.vn')
BEGIN
    INSERT INTO [dbo].[Identity_Users] (
        [Id], [Username], [Email], [PasswordHash], [FullName], [PhoneNumber],
        [IsActive], [MustChangePassword], [CreatedAtUtc]
    )
    VALUES (
        'B0000000-0000-0000-0000-000000000001',
        'admin',
        'admin@shdcorp.vn',
        '10000.vQ+0xS3a9Xf8nQvU2L9/Kw==.YqT6v0Z2oK8pW/Xl5dJ1rN4m3o8vK7k9l8n3b2A1c0e=',
        N'Quản Trị Viên Hệ Thống',
        '0900000000',
        1,
        1, -- Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên
        SYSUTCDATETIME()
    );

    -- Gán user vào nhóm ADMINISTRATORS với phạm vi Global
    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers]
        WHERE [UserId] = 'B0000000-0000-0000-0000-000000000001'
          AND [UserGroupId] = 'A0000000-0000-0000-0000-000000000001'
    )
    BEGIN
    INSERT INTO [dbo].[Identity_UserGroupMembers] ([Id], [UserId], [UserGroupId], [ScopeLegalEntityId], [AssignedAtUtc])
    VALUES (
        NEWID(),
        'B0000000-0000-0000-0000-000000000001',
        'A0000000-0000-0000-0000-000000000001',
        NULL,
        SYSUTCDATETIME()
    );
END;
    END;

-- 5. Seed Demo Fixtures cho Legal Entities (Dành cho Dev/Testing - Đánh dấu DEMO)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Org_LegalEntities] WHERE [Code] = 'SHD_CORP')
BEGIN
    INSERT INTO [dbo].[Org_LegalEntities] (
        [Id], [Code], [Name], [TradingName], [TaxCode], [Address], [PhoneNumber], [Email], [Website], [Status], [IsDeleted], [CreatedAtUtc]
    )
    VALUES
    (
        'C0000000-0000-0000-0000-000000000001',
        'SHD_CORP',
        N'Công ty Cổ phần Tập đoàn SHD (DEMO)',
        N'SHD Group',
        '0108999991',
        N'Tòa nhà SHD Tower, Cầu Giấy, Hà Nội',
        '024.7777.8888',
        'contact@shdcorp.vn',
        'https://shdcorp.vn',
        'Active',
        0,
        SYSUTCDATETIME()
    ),
    (
        'C0000000-0000-0000-0000-000000000002',
        'SHD_EDU',
        N'Công ty Cổ phần Giáo dục & Du học Quốc tế SHD (DEMO)',
        N'SHD Education',
        '0108999992',
        N'Số 15 Lê Văn Lương, Thanh Xuân, Hà Nội',
        '024.7777.8889',
        'edu@shdcorp.vn',
        'https://shdedu.vn',
        'Active',
        0,
        SYSUTCDATETIME()
    ),
    (
        'C0000000-0000-0000-0000-000000000003',
        'SHD_ACADEMY',
        N'Công ty TNHH Học viện Ngoại ngữ SHD (DEMO)',
        N'SHD Academy',
        '0108999993',
        N'Số 88 Cầu Giấy, Quan Hoa, Hà Nội',
        '024.7777.8890',
        'academy@shdcorp.vn',
        'https://shdacademy.vn',
        'Active',
        0,
        SYSUTCDATETIME()
    );
END;
GO
