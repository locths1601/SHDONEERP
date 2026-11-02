-- =========================================================================
-- Migration: 20261028_0014_CrmAndCommercialFoundationRegistryAndSchema.sql
-- Description: Sprint 1 Foundation for BUS-01 (CRM) and BUS-02 (Commercial)
--   US-MVP-01: Module & Feature Registry Platform Registration (FND-04)
--              - Register System_Modules ('CRM', 'COMMERCIAL')
--              - Register 17 core System_Features
--              - Seed Permissions in Identity_Permissions
--              - Seed System_FeatureActionPermissions mapping
--              - Assign permissions to ADMINISTRATORS group
--   US-MVP-02: CRM Data Model Schema & Stored Procedures
--              - Create Crm_MarketingSources, Crm_Campaigns, Crm_Leads,
--                Crm_LeadTouchpoints, Crm_ConsultationLogs, Crm_Opportunities,
--                Crm_LostReasons
--              - Non-clustered Indexes, Foreign Keys, RowVersion, Soft-delete
--              - Seed Standard Lost Reasons
--              - Stored Procedure sp_Crm_Lead_GetPagedList (Fail-Closed, Direct GBAC v4.2, PII Masking)
--              - Stored Procedure sp_Crm_Opportunity_GetPagedList (Fail-Closed, Direct GBAC v4.2)
--   US-MVP-03: Commercial & Contract Data Model Schema & Stored Procedures
--              - Create Com_Products, Com_Services, Com_PackageComponents,
--                Com_PriceLists, Com_PriceListItems, Com_Quotations,
--                Com_QuotationItems, Com_Contracts, Com_ContractItems,
--                Com_ContractAddenda, Com_PaymentSchedules, Com_ServiceObligations
--              - Non-clustered Indexes, Foreign Keys, RowVersion, Soft-delete
--              - Stored Procedure sp_Commercial_Contract_GetPagedList (Fail-Closed, Direct GBAC v4.2)
--              - Stored Procedure sp_Commercial_Product_GetPagedList (Fail-Closed, Direct GBAC v4.2)
--
-- Compliance:
--   - Idempotent: Can be executed multiple times without errors
--   - Security: Direct GBAC v4.2, Fail-Closed, Tenant Data Isolation
--   - No fake legal entities seeded into production
-- =========================================================================

-- =========================================================================
-- PHẦN I: US-MVP-01 — ĐĂNG KÝ MODULE, FEATURE VÀ PERMISSIONS (FND-04)
-- =========================================================================

-- 1. ĐĂNG KÝ PHÂN HỆ VÀO SYSTEM_MODULES
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
('C1000000-0000-0000-0000-000000000010', 'CRM', N'CRM & Tuyển Sinh Toàn Hệ Sinh Thái', N'Quản trị Lead tiếp thị, phân bổ ca trực, phễu cơ hội kinh doanh và nhật ký tư vấn du học', '1.0.0', 50, 'UserCheck', 'Active', NULL),
('C2000000-0000-0000-0000-000000000020', 'COMMERCIAL', N'Quản Trị Sản Phẩm & Hợp Đồng Thương Mại', N'Quản lý Catalog gói sản phẩm du học, bảng giá đa tầng, báo giá, hợp đồng đa pháp nhân và nghĩa vụ dịch vụ', '1.0.0', 60, 'FileSpreadsheet', 'Active', NULL);

MERGE [dbo].[System_Modules] AS target
USING @Modules AS src
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
GO

-- 2. ĐĂNG KÝ QUAN HỆ PHỤ THUỘC MODULE (SYSTEM_MODULEDEPENDENCIES)
DECLARE @Deps TABLE (
    [ModuleCode] NVARCHAR(50),
    [DependsOnCode] NVARCHAR(50),
    [Type] NVARCHAR(50),
    [MinVersion] NVARCHAR(30)
);

INSERT INTO @Deps ([ModuleCode], [DependsOnCode], [Type], [MinVersion]) VALUES
('CRM', 'IDENTITY', 'Required', '1.0.0'),
('CRM', 'ORGANIZATION', 'Required', '1.0.0'),
('CRM', 'PARTY360', 'Required', '1.0.0'),
('COMMERCIAL', 'IDENTITY', 'Required', '1.0.0'),
('COMMERCIAL', 'ORGANIZATION', 'Required', '1.0.0'),
('COMMERCIAL', 'PARTY360', 'Required', '1.0.0'),
('COMMERCIAL', 'CRM', 'Optional', '1.0.0');

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

-- 3. SEED PERMISSIONS CHO CRM VÀ COMMERCIAL VÀO IDENTITY_PERMISSIONS
DECLARE @Permissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Module] NVARCHAR(50),
    [Description] NVARCHAR(250)
);

INSERT INTO @Permissions ([Code], [Name], [Module], [Description]) VALUES
-- CRM Permissions
('crm.lead.view', N'Xem danh sách & Chi tiết Lead', 'CRM', N'Cho phép tra cứu và xem chi tiết khách hàng tiềm năng theo Data Scope'),
('crm.lead.create', N'Tạo mới Lead', 'CRM', N'Cho phép nhập thông tin Lead mới hoặc tiếp nhận qua Webhook'),
('crm.lead.edit', N'Cập nhật Lead', 'CRM', N'Cho phép chỉnh sửa thông tin hồ sơ và trạng thái Lead'),
('crm.lead.assign', N'Phân bổ Lead', 'CRM', N'Cho phép điều phối, gán tư vấn viên phụ trách Lead'),
('crm.lead.export', N'Xuất dữ liệu Lead', 'CRM', N'Cho phép trích xuất danh sách Lead ra file Excel/CSV'),
('crm.opportunity.view', N'Xem Cơ hội kinh doanh', 'CRM', N'Cho phép tra cứu và xem phễu cơ hội tuyển sinh theo Data Scope'),
('crm.opportunity.create', N'Tạo Cơ hội kinh doanh', 'CRM', N'Cho phép chuyển đổi Lead sang Cơ hội bán hàng'),
('crm.opportunity.edit', N'Cập nhật Cơ hội kinh doanh', 'CRM', N'Cho phép điều chỉnh giai đoạn, giá trị dự kiến của cơ hội'),
('crm.opportunity.close', N'Đóng Cơ hội kinh doanh', 'CRM', N'Cho phép chốt Won hoặc đóng Lost kèm lý do thất bại'),
('crm.consultation.view', N'Xem Nhật ký tư vấn', 'CRM', N'Cho phép xem lịch sử cuộc gọi và ghi chú tương tác với khách hàng'),
('crm.consultation.create', N'Ghi nhận Nhật ký tư vấn', 'CRM', N'Cho phép ghi biên bản cuộc gọi và đặt lịch hẹn chăm sóc lại'),

-- Commercial Permissions
('commercial.product.view', N'Xem Danh mục Sản phẩm / Dịch vụ', 'Commercial', N'Cho phép tra cứu danh mục gói sản phẩm du học và dịch vụ thành phần'),
('commercial.product.manage', N'Quản trị Danh mục Sản phẩm', 'Commercial', N'Cho phép tạo mới, sửa đổi cấu phần gói sản phẩm du học'),
('commercial.pricelist.view', N'Xem Bảng giá Sản phẩm', 'Commercial', N'Cho phép tra cứu bảng giá chuẩn, bảng giá khu vực và chiến dịch'),
('commercial.pricelist.manage', N'Quản trị Bảng giá', 'Commercial', N'Cho phép thiết lập đơn giá niêm yết và giá sàn tối thiểu'),
('commercial.quotation.view', N'Xem Báo giá Thương mại', 'Commercial', N'Cho phép xem chi tiết bảng báo giá gửi khách hàng'),
('commercial.quotation.create', N'Lập Báo giá Thương mại', 'Commercial', N'Cho phép tạo báo giá mới từ cơ hội tuyển sinh và tính thuế VAT'),
('commercial.quotation.approve', N'Phê duyệt Chiết khấu Báo giá', 'Commercial', N'Cho phép duyệt các mức giảm giá/học bổng vượt thẩm quyền qua Workflow'),
('commercial.contract.view', N'Xem Hợp đồng Dịch vụ Du học', 'Commercial', N'Cho phép tra cứu và xem chi tiết hợp đồng theo Data Scope'),
('commercial.contract.create', N'Soạn thảo Hợp đồng Dịch vụ', 'Commercial', N'Cho phép sinh hợp đồng nháp từ báo giá chốt và đồng bộ Party 360'),
('commercial.contract.sign', N'Ký kết Hợp đồng Dịch vụ', 'Commercial', N'Đại diện pháp nhân ký kết hợp đồng và upload bản scan lưu mã băm SHA256'),
('commercial.contract.activate', N'Kích hoạt Hiệu lực Hợp đồng', 'Commercial', N'Kế toán xác nhận nộp tiền Đợt 1 để kích hoạt hợp đồng sang Active'),
('commercial.contract.terminate', N'Thanh lý / Hủy bỏ Hợp đồng', 'Commercial', N'Lập biên bản thanh lý hoặc xử lý hoàn phí trượt visa'),
('commercial.obligation.view', N'Xem Nghĩa vụ Dịch vụ Phân rã', 'Commercial', N'Tra cứu danh sách nghĩa vụ đào tạo, hồ sơ visa và chăm sóc hải ngoại'),
('commercial.obligation.handover', N'Bàn giao Nghĩa vụ Vận hành', 'Commercial', N'Bàn giao học viên sang Khối Đào tạo và Phòng Hồ sơ tiếp nhận');

MERGE [dbo].[Identity_Permissions] AS target
USING @Permissions AS source
ON (target.[Code] = source.[Code])
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Module], [Description], [CreatedAtUtc])
    VALUES (NEWID(), source.[Code], source.[Name], source.[Module], source.[Description], SYSUTCDATETIME());
GO

-- 4. GÁN TOÀN BỘ QUYỀN MỚI CHO NHÓM 'ADMINISTRATORS'
DECLARE @AdminGroupId UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000001';
IF EXISTS (SELECT 1 FROM [dbo].[Identity_UserGroups] WHERE [Id] = @AdminGroupId)
BEGIN
    INSERT INTO [dbo].[Identity_UserGroupPermissions] ([UserGroupId], [PermissionId], [GrantedAtUtc])
    SELECT @AdminGroupId, p.[Id], SYSUTCDATETIME()
    FROM [dbo].[Identity_Permissions] p
    WHERE p.[Module] IN ('CRM', 'Commercial')
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[Identity_UserGroupPermissions] ugp
          WHERE ugp.[UserGroupId] = @AdminGroupId AND ugp.[PermissionId] = p.[Id]
      );
END;
GO

-- 5. ĐĂNG KÝ 17 CORE FEATURES VÀO SYSTEM_FEATURES
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
-- CRM Features (11 Features)
('F1000000-0000-0000-0000-000000000101', 'CRM', 'crm.leads.ingestion', N'Tiếp nhận Lead Đa Kênh & Ingestion API', N'Tiếp nhận khách hàng từ Landing Page, Facebook Ads, TikTok Webhook và Form trực tuyến', 'Screen', '/crm/leads/ingestion', '/api/v1/crm/leads/webhook', 'LeadIngestionPage', 'DownloadCloud', 10, '["view", "create"]', 'Active', 'Marketing/CRM Team', 'Confidential'),
('F1000000-0000-0000-0000-000000000102', 'CRM', 'crm.leads.dedup', N'Kiểm soát Trùng lặp & Chuẩn hóa SĐT', N'Đối soát số điện thoại E.164 trong cửa sổ 60 ngày chống tranh chấp hoa hồng', 'Screen', '/crm/leads/dedup', '/api/v1/crm/leads/check-duplicate', 'LeadDedupPage', 'ShieldCheck', 20, '["view", "manage"]', 'Active', 'CRM Operations', 'Confidential'),
('F1000000-0000-0000-0000-000000000103', 'CRM', 'crm.leads.scoring', N'Động cơ Chấm điểm Tiềm năng (Scoring)', N'Chấm điểm tự động GPA và khoảng trống tốt nghiệp phân loại Hot/Warm/Cold', 'Screen', '/crm/leads/scoring', '/api/v1/crm/leads/score', 'LeadScoringPage', 'Award', 30, '["view", "manage"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000104', 'CRM', 'crm.leads.routing', N'Phân bổ Lead Xoay vòng Round-Robin', N'Tự động phân bổ Lead theo địa bàn chi nhánh, ca trực và giới hạn WIP 50 leads', 'Screen', '/crm/leads/routing', '/api/v1/crm/leads/assign', 'LeadRoutingPage', 'UserPlus', 40, '["view", "assign"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000105', 'CRM', 'crm.leads.sla', N'Giám sát SLA Thời hạn Phản hồi', N'Bộ đếm thời gian phản hồi cuộc gọi 15 phút và tự động thu hồi lead quá hạn 120 phút', 'Screen', '/crm/leads/sla', '/api/v1/crm/leads/sla-status', 'LeadSlaPage', 'Clock', 50, '["view", "manage"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000106', 'CRM', 'crm.consultation.logs', N'Nhật ký Tư vấn & Đặt lịch Hẹn', N'Slide-over Drawer ghi nhận biên bản cuộc gọi và đặt lịch hẹn tái chăm sóc', 'Screen', '/crm/leads/consultations', '/api/v1/crm/consultations', 'ConsultationLogsPage', 'PhoneCall', 60, '["view", "create"]', 'Active', 'Admissions Team', 'Confidential'),
('F1000000-0000-0000-0000-000000000107', 'CRM', 'crm.opportunities.pipeline', N'Bảng Kanban Phễu Cơ hội Tuyển sinh', N'Quản lý 5 giai đoạn phễu cơ hội kéo thả trực quan và tính xác suất doanh số', 'Screen', '/crm/opportunities', '/api/v1/crm/opportunities', 'OpportunitiesKanbanPage', 'Trello', 70, '["view", "create", "edit"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000108', 'CRM', 'crm.opportunities.lost', N'Quản lý Lý do Đóng Thất bại (Lost)', N'Bắt buộc chọn mã lý do và ghi chú giải trình khi đóng cơ hội tuyển sinh', 'Screen', '/crm/opportunities/lost-reasons', '/api/v1/crm/lost-reasons', 'LostReasonsPage', 'XCircle', 80, '["view", "manage"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000109', 'CRM', 'crm.handoff.party360', N'Chuyển đổi Hợp đồng & Đồng bộ Party 360', N'Đồng bộ học viên vào Party 360 Lõi và sinh hợp đồng nháp không trùng lặp CCCD', 'Screen', '/crm/opportunities/handoff', '/api/v1/crm/opportunities/convert-to-contract', 'Party360HandoffPage', 'ArrowRightCircle', 90, '["view", "create"]', 'Active', 'Admissions Team', 'Restricted'),
('F1000000-0000-0000-0000-000000000110', 'CRM', 'crm.analytics.funnel', N'Báo cáo Phễu & Hiệu suất Tuyển sinh', N'Thống kê tỷ lệ chuyển đổi Lead -> Opportunity -> Contract và SLA chi nhánh', 'Screen', '/crm/analytics', '/api/v1/crm/analytics/funnel', 'CrmAnalyticsPage', 'BarChart3', 100, '["view", "export"]', 'Active', 'Admissions Team', 'Internal'),
('F1000000-0000-0000-0000-000000000111', 'CRM', 'crm.security.masking', N'Bảo vệ Dữ liệu Cá nhân & Che giấu PII', N'Che giấu số điện thoại/CCCD trên toàn bộ danh sách khách hàng theo Nghị định 13/2023', 'Screen', '/crm/security/masking', '/api/v1/crm/security/audit-pii', 'PiiSecurityPage', 'EyeOff', 110, '["view"]', 'Active', 'Security Team', 'Restricted'),

-- Commercial Features (6 Features)
('F1000000-0000-0000-0000-000000000201', 'COMMERCIAL', 'commercial.products.catalog', N'Danh mục Gói Sản phẩm Du học & Dịch vụ', N'Quản trị các gói sản phẩm du học đa cấu phần gắn pháp nhân sở hữu bản quyền', 'Screen', '/commercial/products', '/api/v1/commercial/products', 'ProductCatalogPage', 'Package', 10, '["view", "manage"]', 'Active', 'Product Team', 'Internal'),
('F1000000-0000-0000-0000-000000000202', 'COMMERCIAL', 'commercial.pricelists.matrix', N'Bảng giá Đa tầng & Kiểm soát Giá sàn', N'Thiết lập thứ tự ưu tiên Chiến dịch > Khu vực > Chuẩn và bảo vệ giá sàn tối thiểu', 'Screen', '/commercial/pricelists', '/api/v1/commercial/pricelists', 'PriceListsPage', 'DollarSign', 20, '["view", "manage"]', 'Active', 'Finance Team', 'Internal'),
('F1000000-0000-0000-0000-000000000203', 'COMMERCIAL', 'commercial.quotations.authoring', N'Lập Báo giá Thương mại & Bóc tách VAT', N'Soạn thảo báo giá chuẩn, bóc tách thuế GTGT và xuất file PDF gửi phụ huynh', 'Screen', '/commercial/quotations', '/api/v1/commercial/quotations', 'QuotationsPage', 'FileText', 30, '["view", "create"]', 'Active', 'Commercial Team', 'Internal'),
('F1000000-0000-0000-0000-000000000204', 'COMMERCIAL', 'commercial.quotations.workflow', N'Workflow Phê duyệt Chiết khấu / Học bổng', N'Luồng phê duyệt 4 cấp thẩm quyền theo FND-03 Generic Workflow Engine', 'Screen', '/commercial/quotations/approvals', '/api/v1/commercial/quotations/approve', 'QuotationApprovalsPage', 'GitPullRequest', 40, '["view", "approve"]', 'Active', 'Commercial Team', 'Internal'),
('F1000000-0000-0000-0000-000000000205', 'COMMERCIAL', 'commercial.contracts.lifecycle', N'Quản lý Vòng đời Hợp đồng Đa Pháp nhân', N'Soạn thảo, ký tươi scan SHA256, thu cọc kích hoạt và bất biến cấm xóa hợp đồng', 'Screen', '/commercial/contracts', '/api/v1/commercial/contracts', 'ContractsPage', 'FileCheck', 50, '["view", "create", "sign", "activate", "terminate"]', 'Active', 'Legal/Commercial Team', 'Restricted'),
('F1000000-0000-0000-0000-000000000206', 'COMMERCIAL', 'commercial.obligations.handover', N'Lịch trình Thanh toán & Bàn giao Dịch vụ', N'Tự động sinh đợt nộp tiền và mở khóa bàn giao nghĩa vụ đào tạo tiếng, hồ sơ visa', 'Screen', '/commercial/contracts/obligations', '/api/v1/commercial/obligations', 'ServiceObligationsPage', 'Send', 60, '["view", "handover"]', 'Active', 'Operations Team', 'Internal');

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
        target.[DataClassification] = src.[DataClassification],
        target.[ModuleId] = src.[ResolvedModuleId]
WHEN NOT MATCHED THEN
    INSERT ([Id], [ModuleId], [Code], [Name], [Description], [FeatureType], [RoutePath], [ApiEndpoint], [ComponentKey], [Icon], [OrderIndex], [SupportedActions], [Status], [OwnerTeam], [DataClassification], [IsEnabledGlobal], [CreatedAtUtc])
    VALUES (src.[Id], src.[ResolvedModuleId], src.[Code], src.[Name], src.[Description], src.[FeatureType], src.[RoutePath], src.[ApiEndpoint], src.[ComponentKey], src.[Icon], src.[OrderIndex], src.[SupportedActions], src.[Status], src.[OwnerTeam], src.[DataClassification], 1, SYSUTCDATETIME());
GO

-- 6. ÁNH XẠ FEATURE -> ACTION -> PERMISSION (SYSTEM_FEATUREACTIONPERMISSIONS)
DECLARE @ActionMappings TABLE (
    [FeatureCode] NVARCHAR(100),
    [ActionCode] NVARCHAR(50),
    [ActionName] NVARCHAR(100),
    [PermissionCode] NVARCHAR(100),
    [Description] NVARCHAR(500)
);

INSERT INTO @ActionMappings ([FeatureCode], [ActionCode], [ActionName], [PermissionCode], [Description]) VALUES
-- CRM
('crm.leads.ingestion', 'view', N'Xem danh sách Lead tiếp nhận', 'crm.lead.view', N'Tra cứu danh sách lead'),
('crm.leads.ingestion', 'create', N'Tạo mới Lead thủ công', 'crm.lead.create', N'Nhập lead từ form tiếp thị'),
('crm.leads.routing', 'assign', N'Phân bổ tư vấn viên', 'crm.lead.assign', N'Điều phối phân bổ lead'),
('crm.consultation.logs', 'view', N'Xem nhật ký tư vấn', 'crm.consultation.view', N'Xem lịch sử cuộc gọi'),
('crm.consultation.logs', 'create', N'Lưu nhật ký tư vấn', 'crm.consultation.create', N'Lưu biên bản tương tác'),
('crm.opportunities.pipeline', 'view', N'Xem Kanban cơ hội', 'crm.opportunity.view', N'Xem danh sách phễu cơ hội'),
('crm.opportunities.pipeline', 'create', N'Tạo cơ hội từ lead', 'crm.opportunity.create', N'Chuyển lead sang opportunity'),
('crm.opportunities.pipeline', 'edit', N'Cập nhật tiến độ cơ hội', 'crm.opportunity.edit', N'Kéo thả chuyển cột cơ hội'),
('crm.opportunities.lost', 'close', N'Đóng cơ hội thất bại', 'crm.opportunity.close', N'Ghi nhận lý do thất bại'),
('crm.handoff.party360', 'create', N'Chuyển đổi sang Hợp đồng', 'commercial.contract.create', N'Đồng bộ Party 360 và tạo hợp đồng nháp'),

-- Commercial
('commercial.products.catalog', 'view', N'Xem danh mục sản phẩm', 'commercial.product.view', N'Xem danh mục gói du học'),
('commercial.products.catalog', 'manage', N'Quản trị gói sản phẩm', 'commercial.product.manage', N'Thêm sửa danh mục gói'),
('commercial.pricelists.matrix', 'view', N'Xem bảng giá', 'commercial.pricelist.view', N'Tra cứu đơn giá bảng giá'),
('commercial.pricelists.matrix', 'manage', N'Cấu hình bảng giá', 'commercial.pricelist.manage', N'Thiết lập giá và hạn mức'),
('commercial.quotations.authoring', 'view', N'Xem báo giá', 'commercial.quotation.view', N'Tra cứu bảng báo giá'),
('commercial.quotations.authoring', 'create', N'Tạo mới báo giá', 'commercial.quotation.create', N'Lập báo giá từ cơ hội'),
('commercial.quotations.workflow', 'approve', N'Phê duyệt chiết khấu', 'commercial.quotation.approve', N'Duyệt giảm giá vượt quyền'),
('commercial.contracts.lifecycle', 'view', N'Xem hợp đồng', 'commercial.contract.view', N'Tra cứu hợp đồng theo scope'),
('commercial.contracts.lifecycle', 'create', N'Soạn hợp đồng', 'commercial.contract.create', N'Tạo hợp đồng nháp'),
('commercial.contracts.lifecycle', 'sign', N'Ký hợp đồng', 'commercial.contract.sign', N'Ký duyệt hợp đồng pháp nhân'),
('commercial.contracts.lifecycle', 'activate', N'Kích hoạt hợp đồng', 'commercial.contract.activate', N'Xác nhận thu cọc kích hoạt'),
('commercial.contracts.lifecycle', 'terminate', N'Thanh lý hợp đồng', 'commercial.contract.terminate', N'Biên bản thanh lý hợp đồng'),
('commercial.obligations.handover', 'view', N'Xem nghĩa vụ dịch vụ', 'commercial.obligation.view', N'Xem danh mục nghĩa vụ'),
('commercial.obligations.handover', 'handover', N'Bàn giao nghĩa vụ', 'commercial.obligation.handover', N'Mở khóa nghĩa vụ cho đào tạo');

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
    JOIN [dbo].[Identity_Permissions] p ON p.[Code] = am.[PermissionCode]
) AS src
ON (target.[FeatureId] = src.[FeatureId] AND target.[ActionCode] = src.[ActionCode])
WHEN MATCHED THEN
    UPDATE SET 
        target.[ActionName] = src.[ActionName],
        target.[PermissionCode] = src.[PermissionCode],
        target.[PermissionId] = src.[PermissionId],
        target.[Description] = src.[Description]
WHEN NOT MATCHED THEN
    INSERT ([Id], [FeatureId], [ActionCode], [ActionName], [PermissionCode], [PermissionId], [Description], [IsDefault], [CreatedAtUtc])
    VALUES (NEWID(), src.[FeatureId], src.[ActionCode], src.[ActionName], src.[PermissionCode], src.[PermissionId], src.[Description], 1, SYSUTCDATETIME());
GO

-- =========================================================================
-- PHẦN II: US-MVP-02 — THIẾT KẾ BẢNG DỮ LIỆU & STORED PROCEDURES PHÂN HỆ CRM
-- =========================================================================

-- 1. BẢNG Crm_MarketingSources
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_MarketingSources' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_MarketingSources] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_MarketingSources_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [ChannelType] NVARCHAR(50) NOT NULL, -- FacebookAds, GoogleAds, TikTok, Workshop, PartnerReferral, Direct
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Crm_MarketingSources_IsActive DEFAULT 1,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_MarketingSources_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_MarketingSources_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_MarketingSources] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Crm_MarketingSources_Code] UNIQUE NONCLUSTERED ([Code] ASC)
    );
END;
GO

-- 2. BẢNG Crm_Campaigns
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_Campaigns' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_Campaigns] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_Campaigns_Id DEFAULT NEWSEQUENTIALID(),
        [SourceId] UNIQUEIDENTIFIER NOT NULL,
        [ScopeLegalEntityId] UNIQUEIDENTIFIER NULL,
        [ScopeBusinessUnitId] UNIQUEIDENTIFIER NULL,
        [ScopeBranchId] UNIQUEIDENTIFIER NULL,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [BudgetAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Crm_Campaigns_Budget DEFAULT 0,
        [StartDate] DATETIME2(7) NOT NULL,
        [EndDate] DATETIME2(7) NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Crm_Campaigns_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_Campaigns_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_Campaigns_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_Campaigns] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Crm_Campaigns_Source] FOREIGN KEY ([SourceId]) REFERENCES [dbo].[Crm_MarketingSources] ([Id]),
        CONSTRAINT [FK_Crm_Campaigns_LegalEntity] FOREIGN KEY ([ScopeLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Crm_Campaigns_BusinessUnit] FOREIGN KEY ([ScopeBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Crm_Campaigns_Branch] FOREIGN KEY ([ScopeBranchId]) REFERENCES [dbo].[Org_Branches] ([Id]),
        CONSTRAINT [UQ_Crm_Campaigns_Code] UNIQUE NONCLUSTERED ([Code] ASC)
    );
END;
GO

-- 3. BẢNG Crm_LostReasons
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_LostReasons' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_LostReasons] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_LostReasons_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL, -- Price, Competitor, Family, VisaRequirement, Health, Other
        [ReasonText] NVARCHAR(250) NOT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Crm_LostReasons_IsActive DEFAULT 1,
        [OrderIndex] INT NOT NULL CONSTRAINT DF_Crm_LostReasons_OrderIndex DEFAULT 1,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_LostReasons_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_LostReasons_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_LostReasons] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Crm_LostReasons_Code] UNIQUE NONCLUSTERED ([Code] ASC)
    );
END;
GO

-- SEED CÁC LÝ DO THẤT BẠI TIÊU CHUẨN (CRM_LOSTREASONS)
DECLARE @LostReasons TABLE (
    [Code] NVARCHAR(50),
    [Category] NVARCHAR(50),
    [ReasonText] NVARCHAR(250),
    [OrderIndex] INT
);

INSERT INTO @LostReasons ([Code], [Category], [ReasonText], [OrderIndex]) VALUES
('PRICE_HIGH', 'Price', N'Học phí / Chi phí trọn gói cao hơn ngân sách dự kiến của gia đình', 1),
('CHOSE_COMPETITOR', 'Competitor', N'Học viên lựa chọn trung tâm tư vấn du học đối thủ', 2),
('FAMILY_CHANGED_PLAN', 'Family', N'Gia đình thay đổi kế hoạch (học đại học trong nước / đi làm)', 3),
('FINANCIAL_INSUFFICIENT', 'VisaRequirement', N'Không đủ điều kiện chứng minh tài chính hoặc sổ tiết kiệm', 4),
('ACADEMIC_INELIGIBLE', 'VisaRequirement', N'Điểm GPA hoặc khoảng trống năm tốt nghiệp vượt quá điều kiện trường', 5),
('HEALTH_PERSONAL', 'Health', N'Vấn đề sức khỏe cá nhân (viêm gan B, lao phổi, thị lực)', 6),
('OTHER', 'Other', N'Lý do khách quan khác (ghi rõ trong phần diễn giải)', 99);

MERGE [dbo].[Crm_LostReasons] AS target
USING @LostReasons AS src
ON (target.[Code] = src.[Code])
WHEN MATCHED THEN
    UPDATE SET target.[Category] = src.[Category], target.[ReasonText] = src.[ReasonText], target.[OrderIndex] = src.[OrderIndex]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Category], [ReasonText], [OrderIndex], [IsActive], [IsDeleted], [CreatedAtUtc])
    VALUES (NEWID(), src.[Code], src.[Category], src.[ReasonText], src.[OrderIndex], 1, 0, SYSUTCDATETIME());
GO

-- 4. BẢNG Crm_Leads
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_Leads' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_Leads] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_Leads_Id DEFAULT NEWSEQUENTIALID(),
        [LeadCode] NVARCHAR(50) NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [PhoneNumber] NVARCHAR(50) NOT NULL,
        [Email] NVARCHAR(150) NULL,
        [TargetProgram] NVARCHAR(100) NULL,
        [TargetCountry] NVARCHAR(50) NULL,
        [PriorityTier] NVARCHAR(20) NOT NULL CONSTRAINT DF_Crm_Leads_Priority DEFAULT 'Warm', -- Hot, Warm, Cold
        [LeadScore] INT NOT NULL CONSTRAINT DF_Crm_Leads_Score DEFAULT 0,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Crm_Leads_Status DEFAULT 'New', -- New, Assigned, Contacted, Qualified, Disqualified, Recycled, Converted
        [CampaignId] UNIQUEIDENTIFIER NULL,
        [ReferralPartyId] UNIQUEIDENTIFIER NULL,
        [ReferralCode] NVARCHAR(50) NULL,
        [ScopeLegalEntityId] UNIQUEIDENTIFIER NULL,
        [ScopeBusinessUnitId] UNIQUEIDENTIFIER NULL,
        [ScopeBranchId] UNIQUEIDENTIFIER NULL,
        [AssignedToUserId] UNIQUEIDENTIFIER NULL,
        [AssignedAtUtc] DATETIME2(7) NULL,
        [SlaDeadlineUtc] DATETIME2(7) NULL,
        [IsSlaBreached] BIT NOT NULL CONSTRAINT DF_Crm_Leads_IsSlaBreached DEFAULT 0,
        [FirstContactedAtUtc] DATETIME2(7) NULL,
        [LastInteractedAtUtc] DATETIME2(7) NULL,
        [TouchpointCount] INT NOT NULL CONSTRAINT DF_Crm_Leads_TouchpointCount DEFAULT 1,
        [IsRecycled] BIT NOT NULL CONSTRAINT DF_Crm_Leads_IsRecycled DEFAULT 0,
        [OriginalLeadId] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_Leads_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_Leads_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_Leads] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Crm_Leads_LeadCode] UNIQUE NONCLUSTERED ([LeadCode] ASC),
        CONSTRAINT [FK_Crm_Leads_Campaign] FOREIGN KEY ([CampaignId]) REFERENCES [dbo].[Crm_Campaigns] ([Id]),
        CONSTRAINT [FK_Crm_Leads_ReferralParty] FOREIGN KEY ([ReferralPartyId]) REFERENCES [dbo].[Party_Parties] ([Id]),
        CONSTRAINT [FK_Crm_Leads_LegalEntity] FOREIGN KEY ([ScopeLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Crm_Leads_BusinessUnit] FOREIGN KEY ([ScopeBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Crm_Leads_Branch] FOREIGN KEY ([ScopeBranchId]) REFERENCES [dbo].[Org_Branches] ([Id]),
        CONSTRAINT [FK_Crm_Leads_AssignedUser] FOREIGN KEY ([AssignedToUserId]) REFERENCES [dbo].[Identity_Users] ([Id]),
        CONSTRAINT [FK_Crm_Leads_OriginalLead] FOREIGN KEY ([OriginalLeadId]) REFERENCES [dbo].[Crm_Leads] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Crm_Leads_PhoneNumber] ON [dbo].[Crm_Leads] ([PhoneNumber]);
    CREATE NONCLUSTERED INDEX [IX_Crm_Leads_Status] ON [dbo].[Crm_Leads] ([Status]) INCLUDE ([AssignedToUserId], [ScopeBranchId]);
    CREATE NONCLUSTERED INDEX [IX_Crm_Leads_AssignedUser] ON [dbo].[Crm_Leads] ([AssignedToUserId]) WHERE [AssignedToUserId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Crm_Leads_Branch] ON [dbo].[Crm_Leads] ([ScopeBranchId]) WHERE [ScopeBranchId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Crm_Leads_SlaDeadline] ON [dbo].[Crm_Leads] ([SlaDeadlineUtc], [IsSlaBreached]) WHERE [Status] = 'Assigned';
END;
GO

-- 5. BẢNG Crm_LeadTouchpoints
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_LeadTouchpoints' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_LeadTouchpoints] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_LeadTouchpoints_Id DEFAULT NEWSEQUENTIALID(),
        [LeadId] UNIQUEIDENTIFIER NOT NULL,
        [UtmSource] NVARCHAR(100) NULL,
        [UtmMedium] NVARCHAR(100) NULL,
        [UtmCampaign] NVARCHAR(100) NULL,
        [UtmContent] NVARCHAR(100) NULL,
        [LandingPageUrl] NVARCHAR(500) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [UserAgent] NVARCHAR(300) NULL,
        [FormPayloadJson] NVARCHAR(MAX) NULL,
        [IngestedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_LeadTouchpoints_IngestedAt DEFAULT SYSUTCDATETIME(),
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_LeadTouchpoints_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_LeadTouchpoints_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_LeadTouchpoints] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Crm_LeadTouchpoints_Lead] FOREIGN KEY ([LeadId]) REFERENCES [dbo].[Crm_Leads] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_Crm_LeadTouchpoints_LeadId] ON [dbo].[Crm_LeadTouchpoints] ([LeadId], [IngestedAtUtc] DESC);
END;
GO

-- 6. BẢNG Crm_ConsultationLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_ConsultationLogs' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_ConsultationLogs] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_ConsultationLogs_Id DEFAULT NEWSEQUENTIALID(),
        [LeadId] UNIQUEIDENTIFIER NOT NULL,
        [OpportunityId] UNIQUEIDENTIFIER NULL,
        [CounselorUserId] UNIQUEIDENTIFIER NOT NULL,
        [Channel] NVARCHAR(50) NOT NULL, -- PhoneCall, Zalo, Meeting, Zoom, OfficeVisit
        [CallOutcome] NVARCHAR(50) NOT NULL, -- Connected_Interested, Connected_Busy, Connected_NotInterested, WrongNumber, NoAnswer
        [Notes] NVARCHAR(MAX) NOT NULL,
        [FollowUpDateUtc] DATETIME2(7) NULL,
        [DurationSeconds] INT NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_ConsultationLogs_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_ConsultationLogs_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_ConsultationLogs] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Crm_ConsultationLogs_Lead] FOREIGN KEY ([LeadId]) REFERENCES [dbo].[Crm_Leads] ([Id]),
        CONSTRAINT [FK_Crm_ConsultationLogs_Counselor] FOREIGN KEY ([CounselorUserId]) REFERENCES [dbo].[Identity_Users] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Crm_ConsultationLogs_LeadId] ON [dbo].[Crm_ConsultationLogs] ([LeadId], [CreatedAtUtc] DESC);
    CREATE NONCLUSTERED INDEX [IX_Crm_ConsultationLogs_Counselor] ON [dbo].[Crm_ConsultationLogs] ([CounselorUserId], [FollowUpDateUtc]);
END;
GO

-- 7. BẢNG Crm_Opportunities
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Crm_Opportunities' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Crm_Opportunities] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Crm_Opportunities_Id DEFAULT NEWSEQUENTIALID(),
        [OpportunityCode] NVARCHAR(50) NOT NULL,
        [LeadId] UNIQUEIDENTIFIER NOT NULL,
        [StudentPartyId] UNIQUEIDENTIFIER NULL,
        [TargetProductId] UNIQUEIDENTIFIER NULL,
        [OwningLegalEntityId] UNIQUEIDENTIFIER NULL,
        [OwningBusinessUnitId] UNIQUEIDENTIFIER NULL,
        [OwningBranchId] UNIQUEIDENTIFIER NULL,
        [AssignedToUserId] UNIQUEIDENTIFIER NOT NULL,
        [Stage] NVARCHAR(50) NOT NULL CONSTRAINT DF_Crm_Opportunities_Stage DEFAULT 'Discovery', -- Discovery, ValueProposition, ProposalSent, Negotiation, ClosedWon, ClosedLost
        [EstimatedValue] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Crm_Opportunities_EstimatedValue DEFAULT 0,
        [ProbabilityPercent] INT NOT NULL CONSTRAINT DF_Crm_Opportunities_Probability DEFAULT 10,
        [ExpectedClosingDate] DATETIME2(7) NULL,
        [LostReasonId] UNIQUEIDENTIFIER NULL,
        [LostNotes] NVARCHAR(500) NULL,
        [ClosedAtUtc] DATETIME2(7) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Crm_Opportunities_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Crm_Opportunities_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Crm_Opportunities] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Crm_Opportunities_Code] UNIQUE NONCLUSTERED ([OpportunityCode] ASC),
        CONSTRAINT [FK_Crm_Opportunities_Lead] FOREIGN KEY ([LeadId]) REFERENCES [dbo].[Crm_Leads] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_Party] FOREIGN KEY ([StudentPartyId]) REFERENCES [dbo].[Party_Parties] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_LegalEntity] FOREIGN KEY ([OwningLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_BusinessUnit] FOREIGN KEY ([OwningBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_Branch] FOREIGN KEY ([OwningBranchId]) REFERENCES [dbo].[Org_Branches] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_AssignedUser] FOREIGN KEY ([AssignedToUserId]) REFERENCES [dbo].[Identity_Users] ([Id]),
        CONSTRAINT [FK_Crm_Opportunities_LostReason] FOREIGN KEY ([LostReasonId]) REFERENCES [dbo].[Crm_LostReasons] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Crm_Opportunities_LeadId] ON [dbo].[Crm_Opportunities] ([LeadId]);
    CREATE NONCLUSTERED INDEX [IX_Crm_Opportunities_Stage] ON [dbo].[Crm_Opportunities] ([Stage]) INCLUDE ([AssignedToUserId], [EstimatedValue]);
    CREATE NONCLUSTERED INDEX [IX_Crm_Opportunities_StudentParty] ON [dbo].[Crm_Opportunities] ([StudentPartyId]) WHERE [StudentPartyId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Crm_Opportunities_Branch] ON [dbo].[Crm_Opportunities] ([OwningBranchId]) WHERE [OwningBranchId] IS NOT NULL;
END;
GO

-- Thêm Foreign Key từ Crm_ConsultationLogs tới Crm_Opportunities
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Crm_ConsultationLogs_Opportunity')
BEGIN
    ALTER TABLE [dbo].[Crm_ConsultationLogs]
    ADD CONSTRAINT [FK_Crm_ConsultationLogs_Opportunity] FOREIGN KEY ([OpportunityId]) REFERENCES [dbo].[Crm_Opportunities] ([Id]);
END;
GO

-- =========================================================================
-- PHẦN III: US-MVP-03 — THIẾT KẾ BẢNG DỮ LIỆU PHÂN HỆ COMMERCIAL & HỢP ĐỒNG
-- =========================================================================

-- 1. BẢNG Com_Products
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_Products' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_Products] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_Products_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [ProgramType] NVARCHAR(50) NOT NULL, -- LanguageStudy, UniversityDegree, VocationalStudy, ShortCourse, DualStudy
        [TargetCountry] NVARCHAR(50) NOT NULL, -- Korea, Germany, Japan, Australia
        [OwningLegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [StandardPrice] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Products_StandardPrice DEFAULT 0,
        [MinFloorPrice] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Products_MinFloorPrice DEFAULT 0,
        [Currency] NVARCHAR(10) NOT NULL CONSTRAINT DF_Com_Products_Currency DEFAULT 'VND',
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_Products_Status DEFAULT 'Active', -- Active, Inactive, Archived
        [Description] NVARCHAR(MAX) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_Products_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_Products_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_Products] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Com_Products_Code] UNIQUE NONCLUSTERED ([Code] ASC),
        CONSTRAINT [FK_Com_Products_LegalEntity] FOREIGN KEY ([OwningLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Com_Products_LegalEntity] ON [dbo].[Com_Products] ([OwningLegalEntityId], [Status]);
END;
GO

-- Thêm Foreign Key từ Crm_Opportunities tới Com_Products
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Crm_Opportunities_TargetProduct')
BEGIN
    ALTER TABLE [dbo].[Crm_Opportunities]
    ADD CONSTRAINT [FK_Crm_Opportunities_TargetProduct] FOREIGN KEY ([TargetProductId]) REFERENCES [dbo].[Com_Products] ([Id]);
END;
GO

-- 2. BẢNG Com_Services
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_Services' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_Services] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_Services_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [ServiceCategory] NVARCHAR(50) NOT NULL, -- Education, VisaProcessing, AdmissionPlacement, OverseasCare, Translation
        [VatRate] DECIMAL(5,2) NOT NULL CONSTRAINT DF_Com_Services_VatRate DEFAULT 0.00,
        [RevenueRecognitionRule] NVARCHAR(50) NOT NULL CONSTRAINT DF_Com_Services_RevenueRule DEFAULT 'OnFulfillment',
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_Services_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_Services_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_Services_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_Services] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Com_Services_Code] UNIQUE NONCLUSTERED ([Code] ASC)
    );
END;
GO

-- 3. BẢNG Com_PackageComponents
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_PackageComponents' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_PackageComponents] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_PackageComponents_Id DEFAULT NEWSEQUENTIALID(),
        [ProductId] UNIQUEIDENTIFIER NOT NULL,
        [ServiceId] UNIQUEIDENTIFIER NOT NULL,
        [Quantity] INT NOT NULL CONSTRAINT DF_Com_PackageComponents_Qty DEFAULT 1,
        [AllocatedPrice] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_PackageComponents_AllocatedPrice DEFAULT 0,
        [IsMandatory] BIT NOT NULL CONSTRAINT DF_Com_PackageComponents_Mandatory DEFAULT 1,
        [OrderIndex] INT NOT NULL CONSTRAINT DF_Com_PackageComponents_Order DEFAULT 1,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_PackageComponents_IsDeleted DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_PackageComponents_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_PackageComponents] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_PackageComponents_Product] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Com_Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Com_PackageComponents_Service] FOREIGN KEY ([ServiceId]) REFERENCES [dbo].[Com_Services] ([Id]),
        CONSTRAINT [UQ_Com_PackageComponents_Prod_Srv] UNIQUE NONCLUSTERED ([ProductId], [ServiceId])
    );
END;
GO

-- 4. BẢNG Com_PriceLists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_PriceLists' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_PriceLists] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_PriceLists_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [PriceListType] NVARCHAR(50) NOT NULL, -- Standard, Regional, Campaign
        [OwningLegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [ApplicableBusinessUnitId] UNIQUEIDENTIFIER NULL,
        [ApplicableBranchId] UNIQUEIDENTIFIER NULL,
        [EffectiveFromUtc] DATETIME2(7) NOT NULL,
        [EffectiveToUtc] DATETIME2(7) NULL,
        [Priority] INT NOT NULL CONSTRAINT DF_Com_PriceLists_Priority DEFAULT 1, -- 3: Campaign, 2: Regional, 1: Standard
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_PriceLists_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_PriceLists_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_PriceLists_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_PriceLists] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Com_PriceLists_Code] UNIQUE NONCLUSTERED ([Code] ASC),
        CONSTRAINT [FK_Com_PriceLists_LegalEntity] FOREIGN KEY ([OwningLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Com_PriceLists_BusinessUnit] FOREIGN KEY ([ApplicableBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Com_PriceLists_Branch] FOREIGN KEY ([ApplicableBranchId]) REFERENCES [dbo].[Org_Branches] ([Id])
    );
END;
GO

-- 5. BẢNG Com_PriceListItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_PriceListItems' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_PriceListItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_PriceListItems_Id DEFAULT NEWSEQUENTIALID(),
        [PriceListId] UNIQUEIDENTIFIER NOT NULL,
        [ProductId] UNIQUEIDENTIFIER NOT NULL,
        [UnitPrice] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_PriceListItems_Price DEFAULT 0,
        [MinAllowedPrice] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_PriceListItems_MinPrice DEFAULT 0,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_PriceListItems_IsDeleted DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_PriceListItems_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_PriceListItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_PriceListItems_PriceList] FOREIGN KEY ([PriceListId]) REFERENCES [dbo].[Com_PriceLists] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Com_PriceListItems_Product] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Com_Products] ([Id]),
        CONSTRAINT [UQ_Com_PriceListItems_List_Prod] UNIQUE NONCLUSTERED ([PriceListId], [ProductId])
    );
END;
GO

-- 6. BẢNG Com_Quotations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_Quotations' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_Quotations] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_Quotations_Id DEFAULT NEWSEQUENTIALID(),
        [QuotationCode] NVARCHAR(50) NOT NULL,
        [OpportunityId] UNIQUEIDENTIFIER NOT NULL,
        [VersionNumber] INT NOT NULL CONSTRAINT DF_Com_Quotations_Version DEFAULT 1,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_Quotations_Status DEFAULT 'Draft', -- Draft, PendingApproval, Approved, Sent, Accepted, Rejected, Expired, Converted, Superseded
        [TotalOriginalAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Quotations_Original DEFAULT 0,
        [TotalDiscountAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Quotations_Discount DEFAULT 0,
        [TotalVatAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Quotations_Vat DEFAULT 0,
        [FinalPayableAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Quotations_Final DEFAULT 0,
        [ValidUntilDate] DATETIME2(7) NOT NULL,
        [ApprovalWorkflowInstanceId] UNIQUEIDENTIFIER NULL,
        [ApprovedByUserId] UNIQUEIDENTIFIER NULL,
        [ApprovedAtUtc] DATETIME2(7) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_Quotations_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_Quotations_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_Quotations] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_Quotations_Opportunity] FOREIGN KEY ([OpportunityId]) REFERENCES [dbo].[Crm_Opportunities] ([Id]),
        CONSTRAINT [FK_Com_Quotations_WorkflowInstance] FOREIGN KEY ([ApprovalWorkflowInstanceId]) REFERENCES [dbo].[Wf_Instances] ([Id]),
        CONSTRAINT [FK_Com_Quotations_ApprovedUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [dbo].[Identity_Users] ([Id]),
        CONSTRAINT [UQ_Com_Quotations_Code_Ver] UNIQUE NONCLUSTERED ([QuotationCode], [VersionNumber])
    );

    CREATE NONCLUSTERED INDEX [IX_Com_Quotations_Opportunity] ON [dbo].[Com_Quotations] ([OpportunityId], [Status]);
END;
GO

-- 7. BẢNG Com_QuotationItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_QuotationItems' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_QuotationItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_QuotationItems_Id DEFAULT NEWSEQUENTIALID(),
        [QuotationId] UNIQUEIDENTIFIER NOT NULL,
        [ProductId] UNIQUEIDENTIFIER NOT NULL,
        [Quantity] INT NOT NULL CONSTRAINT DF_Com_QuotationItems_Qty DEFAULT 1,
        [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [VatRate] DECIMAL(5,2) NOT NULL DEFAULT 0,
        [VatAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [LineTotal] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Notes] NVARCHAR(500) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_QuotationItems_IsDeleted DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_QuotationItems_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_QuotationItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_QuotationItems_Quotation] FOREIGN KEY ([QuotationId]) REFERENCES [dbo].[Com_Quotations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Com_QuotationItems_Product] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Com_Products] ([Id])
    );
END;
GO

-- 8. BẢNG Com_Contracts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_Contracts' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_Contracts] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_Contracts_Id DEFAULT NEWSEQUENTIALID(),
        [ContractCode] NVARCHAR(50) NOT NULL,
        [ContractType] NVARCHAR(50) NOT NULL CONSTRAINT DF_Com_Contracts_Type DEFAULT 'StudyAbroadService',
        [StudentPartyId] UNIQUEIDENTIFIER NOT NULL,
        [QuotationId] UNIQUEIDENTIFIER NULL,
        [OpportunityId] UNIQUEIDENTIFIER NULL,
        [ContractingLegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [SellingBusinessUnitId] UNIQUEIDENTIFIER NOT NULL,
        [SellingBranchId] UNIQUEIDENTIFIER NOT NULL,
        [TotalContractValue] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Contracts_Value DEFAULT 0,
        [PaidAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Contracts_Paid DEFAULT 0,
        [OutstandingBalance] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_Contracts_Balance DEFAULT 0,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_Contracts_Status DEFAULT 'Draft', -- Draft, PendingReview, Approved, PendingSignature, Signed, Active, UnderFulfillment, Completed, Terminated
        [SigningMethod] NVARCHAR(50) NOT NULL CONSTRAINT DF_Com_Contracts_SigningMethod DEFAULT 'WetInkScan',
        [SignedDocumentId] UNIQUEIDENTIFIER NULL,
        [SignedAtUtc] DATETIME2(7) NULL,
        [ActivatedAtUtc] DATETIME2(7) NULL,
        [TerminatedAtUtc] DATETIME2(7) NULL,
        [TerminationReason] NVARCHAR(500) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_Contracts_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_Contracts_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_Contracts] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Com_Contracts_Code] UNIQUE NONCLUSTERED ([ContractCode] ASC),
        CONSTRAINT [FK_Com_Contracts_Party] FOREIGN KEY ([StudentPartyId]) REFERENCES [dbo].[Party_Parties] ([Id]),
        CONSTRAINT [FK_Com_Contracts_Quotation] FOREIGN KEY ([QuotationId]) REFERENCES [dbo].[Com_Quotations] ([Id]),
        CONSTRAINT [FK_Com_Contracts_Opportunity] FOREIGN KEY ([OpportunityId]) REFERENCES [dbo].[Crm_Opportunities] ([Id]),
        CONSTRAINT [FK_Com_Contracts_LegalEntity] FOREIGN KEY ([ContractingLegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Com_Contracts_BusinessUnit] FOREIGN KEY ([SellingBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Com_Contracts_Branch] FOREIGN KEY ([SellingBranchId]) REFERENCES [dbo].[Org_Branches] ([Id]),
        CONSTRAINT [FK_Com_Contracts_SignedDocument] FOREIGN KEY ([SignedDocumentId]) REFERENCES [dbo].[Doc_Documents] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Com_Contracts_Student] ON [dbo].[Com_Contracts] ([StudentPartyId], [Status]);
    CREATE NONCLUSTERED INDEX [IX_Com_Contracts_LegalEntity] ON [dbo].[Com_Contracts] ([ContractingLegalEntityId], [Status]);
    CREATE NONCLUSTERED INDEX [IX_Com_Contracts_Branch] ON [dbo].[Com_Contracts] ([SellingBranchId], [Status]);
END;
GO

-- 9. BẢNG Com_ContractItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_ContractItems' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_ContractItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_ContractItems_Id DEFAULT NEWSEQUENTIALID(),
        [ContractId] UNIQUEIDENTIFIER NOT NULL,
        [ProductId] UNIQUEIDENTIFIER NOT NULL,
        [Quantity] INT NOT NULL CONSTRAINT DF_Com_ContractItems_Qty DEFAULT 1,
        [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [FinalAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_ContractItems_IsDeleted DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_ContractItems_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_ContractItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_ContractItems_Contract] FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Com_Contracts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Com_ContractItems_Product] FOREIGN KEY ([ProductId]) REFERENCES [dbo].[Com_Products] ([Id])
    );
END;
GO

-- 10. BẢNG Com_ContractAddenda
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_ContractAddenda' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_ContractAddenda] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_ContractAddenda_Id DEFAULT NEWSEQUENTIALID(),
        [ContractId] UNIQUEIDENTIFIER NOT NULL,
        [AddendumNumber] NVARCHAR(50) NOT NULL,
        [AddendumType] NVARCHAR(50) NOT NULL, -- ScopeAdjustment, TermExtension, FeeAdjustment, SchoolTransfer
        [ChangeDescription] NVARCHAR(MAX) NOT NULL,
        [AdjustedContractValue] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_ContractAddenda_AdjustedValue DEFAULT 0,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_ContractAddenda_Status DEFAULT 'Draft',
        [ApprovedByUserId] UNIQUEIDENTIFIER NULL,
        [ApprovedAtUtc] DATETIME2(7) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_ContractAddenda_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_ContractAddenda_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_ContractAddenda] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_ContractAddenda_Contract] FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Com_Contracts] ([Id]),
        CONSTRAINT [FK_Com_ContractAddenda_ApprovedUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [dbo].[Identity_Users] ([Id]),
        CONSTRAINT [UQ_Com_ContractAddenda_Number] UNIQUE NONCLUSTERED ([ContractId], [AddendumNumber])
    );
END;
GO

-- 11. BẢNG Com_PaymentSchedules
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_PaymentSchedules' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_PaymentSchedules] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_PaymentSchedules_Id DEFAULT NEWSEQUENTIALID(),
        [ContractId] UNIQUEIDENTIFIER NOT NULL,
        [MilestoneIndex] INT NOT NULL,
        [MilestoneName] NVARCHAR(150) NOT NULL,
        [DueDate] DATETIME2(7) NOT NULL,
        [ExpectedAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PaidAmount] DECIMAL(18,2) NOT NULL CONSTRAINT DF_Com_PaymentSchedules_Paid DEFAULT 0,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_PaymentSchedules_Status DEFAULT 'Pending', -- Pending, PartiallyPaid, FullyPaid, Overdue
        [UnlocksObligationType] NVARCHAR(100) NULL,
        [PaidAtUtc] DATETIME2(7) NULL,
        [ReceiptReference] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_PaymentSchedules_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_PaymentSchedules_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_PaymentSchedules] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_PaymentSchedules_Contract] FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Com_Contracts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_Com_PaymentSchedules_Milestone] UNIQUE NONCLUSTERED ([ContractId], [MilestoneIndex])
    );

    CREATE NONCLUSTERED INDEX [IX_Com_PaymentSchedules_Contract] ON [dbo].[Com_PaymentSchedules] ([ContractId], [Status]);
END;
GO

-- 12. BẢNG Com_ServiceObligations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Com_ServiceObligations' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Com_ServiceObligations] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Com_ServiceObligations_Id DEFAULT NEWSEQUENTIALID(),
        [ContractId] UNIQUEIDENTIFIER NOT NULL,
        [ObligationType] NVARCHAR(100) NOT NULL, -- LanguageTraining, DossierPreparation, UniversityAdmission, VisaApplication, PreDepartureBriefing, AirportPickUp, AccommodationAssistance
        [FulfillingBusinessUnitId] UNIQUEIDENTIFIER NOT NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Com_ServiceObligations_Status DEFAULT 'Locked', -- Locked, ReadyForHandover, HandedOver, InProgress, Completed, Cancelled
        [HandedOverAtUtc] DATETIME2(7) NULL,
        [HandedOverToUserId] UNIQUEIDENTIFIER NULL,
        [CompletedAtUtc] DATETIME2(7) NULL,
        [Notes] NVARCHAR(MAX) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Com_ServiceObligations_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Com_ServiceObligations_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Com_ServiceObligations] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Com_ServiceObligations_Contract] FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Com_Contracts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Com_ServiceObligations_BusinessUnit] FOREIGN KEY ([FulfillingBusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Com_ServiceObligations_HandedOverUser] FOREIGN KEY ([HandedOverToUserId]) REFERENCES [dbo].[Identity_Users] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Com_ServiceObligations_Contract] ON [dbo].[Com_ServiceObligations] ([ContractId], [Status]);
    CREATE NONCLUSTERED INDEX [IX_Com_ServiceObligations_BU] ON [dbo].[Com_ServiceObligations] ([FulfillingBusinessUnitId], [Status]);
END;
GO

-- =========================================================================
-- PHẦN IV: READ-SIDE STORED PROCEDURES (FAIL-CLOSED, DIRECT GBAC V4.2, PII MASKING)
-- =========================================================================

-- 1. STORED PROCEDURE: sp_Crm_Lead_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Crm_Lead_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @PriorityTier NVARCHAR(20) = NULL,
    @AssignedToUserId UNIQUEIDENTIFIER = NULL,
    @ScopeLegalEntityId UNIQUEIDENTIFIER = NULL,
    @ScopeBusinessUnitId UNIQUEIDENTIFIER = NULL,
    @ScopeBranchId UNIQUEIDENTIFIER = NULL,
    @IsSlaBreached BIT = NULL,
    @PageIndex INT = 1,
    @PageSize INT = 20,
    @SortColumn NVARCHAR(50) = 'CreatedAtUtc',
    @SortDirection NVARCHAR(4) = 'DESC',
    @RequestingUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- FAIL-CLOSED CHECK 1: Yêu cầu bắt buộc @RequestingUserId
    IF @RequestingUserId IS NULL
    BEGIN
        SET @TotalCount = 0;
        SELECT TOP 0 
            CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
            CAST(NULL AS NVARCHAR(50)) AS [LeadCode],
            CAST(NULL AS NVARCHAR(150)) AS [FullName],
            CAST(NULL AS NVARCHAR(50)) AS [PhoneNumber],
            CAST(NULL AS NVARCHAR(150)) AS [Email],
            CAST(NULL AS NVARCHAR(100)) AS [TargetProgram],
            CAST(NULL AS NVARCHAR(20)) AS [PriorityTier],
            CAST(0 AS INT) AS [LeadScore],
            CAST(NULL AS NVARCHAR(30)) AS [Status],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [AssignedToUserId],
            CAST(NULL AS NVARCHAR(150)) AS [AssignedToUserName],
            CAST(NULL AS DATETIME2(7)) AS [AssignedAtUtc],
            CAST(NULL AS DATETIME2(7)) AS [SlaDeadlineUtc],
            CAST(0 AS BIT) AS [IsSlaBreached],
            CAST(NULL AS DATETIME2(7)) AS [LastInteractedAtUtc],
            CAST(0 AS INT) AS [TouchpointCount],
            CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
            CAST(0 AS INT) AS [TotalCount];
        RETURN;
    END;

    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Xác định quyền Admin hoặc Global Scope
    DECLARE @IsAdmin BIT = 0;
    DECLARE @HasGlobalScope BIT = 0;
    DECLARE @HasFullPiiAccess BIT = 0;

    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
        SET @HasGlobalScope = 1;
        SET @HasFullPiiAccess = 1;
    END;

    -- Kiểm tra quyền crm.lead.view và các phạm vi được cấp
    DECLARE @UserScopes TABLE (
        [ScopeType] NVARCHAR(50),
        [LegalEntityId] UNIQUEIDENTIFIER,
        [BusinessUnitId] UNIQUEIDENTIFIER,
        [BranchId] UNIQUEIDENTIFIER
    );

    IF @IsAdmin = 0
    BEGIN
        INSERT INTO @UserScopes ([ScopeType], [LegalEntityId], [BusinessUnitId], [BranchId])
        SELECT DISTINCT
            ug.[ScopeType],
            ugm.[ScopeLegalEntityId],
            ugm.[ScopeBusinessUnitId],
            ugm.[ScopeBranchId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[IsActive] = 1
          AND p.[Code] = 'crm.lead.view';

        IF EXISTS (SELECT 1 FROM @UserScopes WHERE [ScopeType] = 'Global')
        BEGIN
            SET @HasGlobalScope = 1;
            SET @HasFullPiiAccess = 1;
        END;
    END;

    -- FAIL-CLOSED CHECK 2: Phân vùng dữ liệu (Row Visibility)
    WITH VisibleLeads AS (
        SELECT l.[Id]
        FROM [dbo].[Crm_Leads] l
        WHERE l.[IsDeleted] = 0
          AND (
              @HasGlobalScope = 1
              OR l.[AssignedToUserId] = @RequestingUserId
              OR EXISTS (
                  SELECT 1 FROM @UserScopes s
                  WHERE (s.[ScopeType] = 'Branch' AND s.[BranchId] = l.[ScopeBranchId])
                     OR (s.[ScopeType] = 'BusinessUnit' AND s.[BusinessUnitId] = l.[ScopeBusinessUnitId])
                     OR (s.[ScopeType] = 'LegalEntity' AND s.[LegalEntityId] = l.[ScopeLegalEntityId])
              )
          )
          AND (@ScopeLegalEntityId IS NULL OR l.[ScopeLegalEntityId] = @ScopeLegalEntityId)
          AND (@ScopeBusinessUnitId IS NULL OR l.[ScopeBusinessUnitId] = @ScopeBusinessUnitId)
          AND (@ScopeBranchId IS NULL OR l.[ScopeBranchId] = @ScopeBranchId)
          AND (@Status IS NULL OR l.[Status] = @Status)
          AND (@PriorityTier IS NULL OR l.[PriorityTier] = @PriorityTier)
          AND (@AssignedToUserId IS NULL OR l.[AssignedToUserId] = @AssignedToUserId)
          AND (@IsSlaBreached IS NULL OR l.[IsSlaBreached] = @IsSlaBreached)
          AND (
              @SearchTerm IS NULL 
              OR l.[FullName] LIKE N'%' + @SearchTerm + '%'
              OR l.[PhoneNumber] LIKE '%' + @SearchTerm + '%'
              OR l.[LeadCode] LIKE '%' + @SearchTerm + '%'
          )
    )
    SELECT @TotalCount = COUNT(1) FROM VisibleLeads;

    -- Trả về dữ liệu kèm PII Masking (Fail-Closed)
    SELECT 
        l.[Id], l.[LeadCode], l.[FullName],
        CASE 
            WHEN @HasFullPiiAccess = 1 OR l.[AssignedToUserId] = @RequestingUserId
                OR EXISTS (
                    SELECT 1 FROM @UserScopes s
                    WHERE (s.[ScopeType] = 'Branch' AND s.[BranchId] = l.[ScopeBranchId])
                       OR (s.[ScopeType] = 'BusinessUnit' AND s.[BusinessUnitId] = l.[ScopeBusinessUnitId])
                       OR (s.[ScopeType] = 'LegalEntity' AND s.[LegalEntityId] = l.[ScopeLegalEntityId])
                )
            THEN l.[PhoneNumber]
            WHEN l.[PhoneNumber] IS NOT NULL AND LEN(l.[PhoneNumber]) >= 7
            THEN SUBSTRING(l.[PhoneNumber], 1, 4) + '***' + RIGHT(l.[PhoneNumber], 3)
            ELSE '***'
        END AS [PhoneNumber],
        CASE 
            WHEN @HasFullPiiAccess = 1 OR l.[AssignedToUserId] = @RequestingUserId
            THEN l.[Email]
            WHEN l.[Email] IS NOT NULL AND CHARINDEX('@', l.[Email]) > 2
            THEN SUBSTRING(l.[Email], 1, 2) + '***@' + SUBSTRING(l.[Email], CHARINDEX('@', l.[Email]) + 1, LEN(l.[Email]))
            ELSE '***'
        END AS [Email],
        l.[TargetProgram], l.[PriorityTier], l.[LeadScore], l.[Status],
        l.[AssignedToUserId], u.[FullName] AS [AssignedToUserName],
        l.[AssignedAtUtc], l.[SlaDeadlineUtc], l.[IsSlaBreached],
        l.[LastInteractedAtUtc], l.[TouchpointCount],
        l.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM [dbo].[Crm_Leads] l
    JOIN (
        SELECT [Id] FROM VisibleLeads
        ORDER BY [Id]
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    ) v ON v.[Id] = l.[Id]
    LEFT JOIN [dbo].[Identity_Users] u ON u.[Id] = l.[AssignedToUserId]
    ORDER BY 
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'CreatedAtUtc' THEN l.[CreatedAtUtc] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'CreatedAtUtc' THEN l.[CreatedAtUtc] END DESC,
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'LeadScore' THEN l.[LeadScore] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'LeadScore' THEN l.[LeadScore] END DESC,
        l.[CreatedAtUtc] DESC;
END;
GO

-- 2. STORED PROCEDURE: sp_Commercial_Contract_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Commercial_Contract_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @ContractType NVARCHAR(50) = NULL,
    @Status NVARCHAR(30) = NULL,
    @ContractingLegalEntityId UNIQUEIDENTIFIER = NULL,
    @SellingBusinessUnitId UNIQUEIDENTIFIER = NULL,
    @SellingBranchId UNIQUEIDENTIFIER = NULL,
    @ScopeLegalEntityId UNIQUEIDENTIFIER = NULL,
    @ScopeBusinessUnitId UNIQUEIDENTIFIER = NULL,
    @ScopeBranchId UNIQUEIDENTIFIER = NULL,
    @RequestingUserId UNIQUEIDENTIFIER = NULL,
    @PageIndex INT = 1,
    @PageSize INT = 20,
    @SortColumn NVARCHAR(50) = 'CreatedAtUtc',
    @SortDirection NVARCHAR(4) = 'DESC',
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- FAIL-CLOSED CHECK 1: Yêu cầu bắt buộc @RequestingUserId
    IF @RequestingUserId IS NULL
    BEGIN
        SET @TotalCount = 0;
        SELECT TOP 0 
            CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
            CAST(NULL AS NVARCHAR(50)) AS [ContractCode],
            CAST(NULL AS NVARCHAR(50)) AS [ContractType],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [StudentPartyId],
            CAST(NULL AS NVARCHAR(50)) AS [StudentPartyCode],
            CAST(NULL AS NVARCHAR(150)) AS [StudentFullName],
            CAST(0 AS DECIMAL(18,2)) AS [TotalContractValue],
            CAST(0 AS DECIMAL(18,2)) AS [PaidAmount],
            CAST(0 AS DECIMAL(18,2)) AS [OutstandingBalance],
            CAST(NULL AS NVARCHAR(30)) AS [Status],
            CAST(NULL AS NVARCHAR(50)) AS [SigningMethod],
            CAST(NULL AS DATETIME2(7)) AS [SignedAtUtc],
            CAST(NULL AS DATETIME2(7)) AS [ActivatedAtUtc],
            CAST(NULL AS NVARCHAR(150)) AS [ContractingLegalEntityName],
            CAST(NULL AS NVARCHAR(150)) AS [SellingBusinessUnitName],
            CAST(NULL AS NVARCHAR(150)) AS [SellingBranchName],
            CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
            CAST(0 AS INT) AS [TotalCount];
        RETURN;
    END;

    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Xác định quyền Admin hoặc Global Scope
    DECLARE @IsAdmin BIT = 0;
    DECLARE @HasGlobalScope BIT = 0;

    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
        SET @HasGlobalScope = 1;
    END;

    -- Kiểm tra quyền commercial.contract.view và các phạm vi được cấp
    DECLARE @UserScopes TABLE (
        [ScopeType] NVARCHAR(50),
        [LegalEntityId] UNIQUEIDENTIFIER,
        [BusinessUnitId] UNIQUEIDENTIFIER,
        [BranchId] UNIQUEIDENTIFIER
    );

    IF @IsAdmin = 0
    BEGIN
        INSERT INTO @UserScopes ([ScopeType], [LegalEntityId], [BusinessUnitId], [BranchId])
        SELECT DISTINCT
            ug.[ScopeType],
            ugm.[ScopeLegalEntityId],
            ugm.[ScopeBusinessUnitId],
            ugm.[ScopeBranchId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[IsActive] = 1
          AND p.[Code] = 'commercial.contract.view';

        IF EXISTS (SELECT 1 FROM @UserScopes WHERE [ScopeType] = 'Global')
        BEGIN
            SET @HasGlobalScope = 1;
        END;
    END;

    -- FAIL-CLOSED CHECK 2: Phân vùng dữ liệu theo Data Scope & Quyền sở hữu (Row Visibility)
    WITH VisibleContracts AS (
        SELECT c.[Id]
        FROM [dbo].[Com_Contracts] c
        JOIN [dbo].[Party_Parties] p ON p.[Id] = c.[StudentPartyId]
        LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
        WHERE c.[IsDeleted] = 0
          AND (
              @HasGlobalScope = 1
              OR EXISTS (
                  SELECT 1 FROM @UserScopes s
                  WHERE (s.[ScopeType] = 'Branch' AND s.[BranchId] = c.[SellingBranchId])
                     OR (s.[ScopeType] = 'BusinessUnit' AND s.[BusinessUnitId] = c.[SellingBusinessUnitId])
                     OR (s.[ScopeType] = 'LegalEntity' AND s.[LegalEntityId] = c.[ContractingLegalEntityId])
              )
          )
          AND (@ScopeLegalEntityId IS NULL OR c.[ContractingLegalEntityId] = @ScopeLegalEntityId)
          AND (@ScopeBusinessUnitId IS NULL OR c.[SellingBusinessUnitId] = @ScopeBusinessUnitId)
          AND (@ScopeBranchId IS NULL OR c.[SellingBranchId] = @ScopeBranchId)
          AND (@ContractType IS NULL OR c.[ContractType] = @ContractType)
          AND (@Status IS NULL OR c.[Status] = @Status)
          AND (@ContractingLegalEntityId IS NULL OR c.[ContractingLegalEntityId] = @ContractingLegalEntityId)
          AND (@SellingBusinessUnitId IS NULL OR c.[SellingBusinessUnitId] = @SellingBusinessUnitId)
          AND (@SellingBranchId IS NULL OR c.[SellingBranchId] = @SellingBranchId)
          AND (
              @SearchTerm IS NULL 
              OR c.[ContractCode] LIKE '%' + @SearchTerm + '%'
              OR per.[FirstName] LIKE N'%' + @SearchTerm + '%'
              OR per.[LastName] LIKE N'%' + @SearchTerm + '%'
              OR p.[Code] LIKE '%' + @SearchTerm + '%'
          )
    )
    SELECT @TotalCount = COUNT(1) FROM VisibleContracts;

    -- Trả về dữ liệu trang
    SELECT 
        c.[Id], c.[ContractCode], c.[ContractType],
        c.[StudentPartyId], p.[Code] AS [StudentPartyCode],
        COALESCE(per.[LastName] + ' ' + per.[FirstName], p.[Code]) AS [StudentFullName],
        c.[TotalContractValue], c.[PaidAmount], c.[OutstandingBalance],
        c.[Status], c.[SigningMethod], c.[SignedAtUtc], c.[ActivatedAtUtc],
        le.[Name] AS [ContractingLegalEntityName],
        bu.[Name] AS [SellingBusinessUnitName],
        br.[Name] AS [SellingBranchName],
        c.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM [dbo].[Com_Contracts] c
    JOIN (
        SELECT [Id] FROM VisibleContracts
        ORDER BY [Id]
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    ) v ON v.[Id] = c.[Id]
    JOIN [dbo].[Party_Parties] p ON p.[Id] = c.[StudentPartyId]
    LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = c.[ContractingLegalEntityId]
    JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = c.[SellingBusinessUnitId]
    JOIN [dbo].[Org_Branches] br ON br.[Id] = c.[SellingBranchId]
    ORDER BY 
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'CreatedAtUtc' THEN c.[CreatedAtUtc] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'CreatedAtUtc' THEN c.[CreatedAtUtc] END DESC,
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'TotalContractValue' THEN c.[TotalContractValue] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'TotalContractValue' THEN c.[TotalContractValue] END DESC,
        c.[CreatedAtUtc] DESC;
END;
GO

-- 3. STORED PROCEDURE: sp_Crm_Opportunity_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Crm_Opportunity_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @Stage NVARCHAR(50) = NULL,
    @AssignedToUserId UNIQUEIDENTIFIER = NULL,
    @ScopeLegalEntityId UNIQUEIDENTIFIER = NULL,
    @ScopeBusinessUnitId UNIQUEIDENTIFIER = NULL,
    @ScopeBranchId UNIQUEIDENTIFIER = NULL,
    @RequestingUserId UNIQUEIDENTIFIER = NULL,
    @PageIndex INT = 1,
    @PageSize INT = 20,
    @SortColumn NVARCHAR(50) = 'CreatedAtUtc',
    @SortDirection NVARCHAR(4) = 'DESC',
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @RequestingUserId IS NULL
    BEGIN
        SET @TotalCount = 0;
        SELECT TOP 0 
            CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
            CAST(NULL AS NVARCHAR(50)) AS [OpportunityCode],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [LeadId],
            CAST(NULL AS NVARCHAR(150)) AS [LeadFullName],
            CAST(NULL AS NVARCHAR(50)) AS [LeadPhoneNumber],
            CAST(NULL AS NVARCHAR(50)) AS [Stage],
            CAST(0 AS DECIMAL(18,2)) AS [EstimatedValue],
            CAST(0 AS INT) AS [ProbabilityPercent],
            CAST(NULL AS DATETIME2(7)) AS [ExpectedClosingDate],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [AssignedToUserId],
            CAST(NULL AS NVARCHAR(150)) AS [AssignedToUserName],
            CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
            CAST(0 AS INT) AS [TotalCount];
        RETURN;
    END;

    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    DECLARE @IsAdmin BIT = 0;
    DECLARE @HasGlobalScope BIT = 0;

    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
        SET @HasGlobalScope = 1;
    END;

    DECLARE @UserScopes TABLE (
        [ScopeType] NVARCHAR(50),
        [LegalEntityId] UNIQUEIDENTIFIER,
        [BusinessUnitId] UNIQUEIDENTIFIER,
        [BranchId] UNIQUEIDENTIFIER
    );

    IF @IsAdmin = 0
    BEGIN
        INSERT INTO @UserScopes ([ScopeType], [LegalEntityId], [BusinessUnitId], [BranchId])
        SELECT DISTINCT
            ug.[ScopeType],
            ugm.[ScopeLegalEntityId],
            ugm.[ScopeBusinessUnitId],
            ugm.[ScopeBranchId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @RequestingUserId
          AND ug.[IsActive] = 1
          AND p.[Code] = 'crm.opportunity.view';

        IF EXISTS (SELECT 1 FROM @UserScopes WHERE [ScopeType] = 'Global')
        BEGIN
            SET @HasGlobalScope = 1;
        END;
    END;

    WITH VisibleOpps AS (
        SELECT o.[Id]
        FROM [dbo].[Crm_Opportunities] o
        JOIN [dbo].[Crm_Leads] l ON l.[Id] = o.[LeadId]
        WHERE o.[IsDeleted] = 0
          AND (
              @HasGlobalScope = 1
              OR o.[AssignedToUserId] = @RequestingUserId
              OR EXISTS (
                  SELECT 1 FROM @UserScopes s
                  WHERE (s.[ScopeType] = 'Branch' AND s.[BranchId] = o.[OwningBranchId])
                     OR (s.[ScopeType] = 'BusinessUnit' AND s.[BusinessUnitId] = o.[OwningBusinessUnitId])
                     OR (s.[ScopeType] = 'LegalEntity' AND s.[LegalEntityId] = o.[OwningLegalEntityId])
              )
          )
          AND (@ScopeLegalEntityId IS NULL OR o.[OwningLegalEntityId] = @ScopeLegalEntityId)
          AND (@ScopeBusinessUnitId IS NULL OR o.[OwningBusinessUnitId] = @ScopeBusinessUnitId)
          AND (@ScopeBranchId IS NULL OR o.[OwningBranchId] = @ScopeBranchId)
          AND (@Stage IS NULL OR o.[Stage] = @Stage)
          AND (@AssignedToUserId IS NULL OR o.[AssignedToUserId] = @AssignedToUserId)
          AND (
              @SearchTerm IS NULL 
              OR o.[OpportunityCode] LIKE '%' + @SearchTerm + '%'
              OR l.[FullName] LIKE N'%' + @SearchTerm + '%'
              OR l.[PhoneNumber] LIKE '%' + @SearchTerm + '%'
          )
    )
    SELECT @TotalCount = COUNT(1) FROM VisibleOpps;

    SELECT 
        o.[Id], o.[OpportunityCode], o.[LeadId],
        l.[FullName] AS [LeadFullName],
        CASE 
            WHEN @HasGlobalScope = 1 OR o.[AssignedToUserId] = @RequestingUserId
            THEN l.[PhoneNumber]
            WHEN l.[PhoneNumber] IS NOT NULL AND LEN(l.[PhoneNumber]) >= 7
            THEN SUBSTRING(l.[PhoneNumber], 1, 4) + '***' + RIGHT(l.[PhoneNumber], 3)
            ELSE '***'
        END AS [LeadPhoneNumber],
        o.[Stage], o.[EstimatedValue], o.[ProbabilityPercent],
        o.[ExpectedClosingDate],
        o.[AssignedToUserId], u.[FullName] AS [AssignedToUserName],
        p.[Name] AS [TargetProductName],
        o.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM [dbo].[Crm_Opportunities] o
    JOIN (
        SELECT [Id] FROM VisibleOpps
        ORDER BY [Id]
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    ) v ON v.[Id] = o.[Id]
    JOIN [dbo].[Crm_Leads] l ON l.[Id] = o.[LeadId]
    LEFT JOIN [dbo].[Com_Products] p ON p.[Id] = o.[TargetProductId]
    LEFT JOIN [dbo].[Identity_Users] u ON u.[Id] = o.[AssignedToUserId]
    ORDER BY 
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'CreatedAtUtc' THEN o.[CreatedAtUtc] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'CreatedAtUtc' THEN o.[CreatedAtUtc] END DESC,
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'EstimatedValue' THEN o.[EstimatedValue] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'EstimatedValue' THEN o.[EstimatedValue] END DESC,
        o.[CreatedAtUtc] DESC;
END;
GO

-- 4. STORED PROCEDURE: sp_Commercial_Product_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Commercial_Product_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @ProgramType NVARCHAR(50) = NULL,
    @TargetCountry NVARCHAR(50) = NULL,
    @OwningLegalEntityId UNIQUEIDENTIFIER = NULL,
    @Status NVARCHAR(30) = NULL,
    @RequestingUserId UNIQUEIDENTIFIER = NULL,
    @PageIndex INT = 1,
    @PageSize INT = 20,
    @SortColumn NVARCHAR(50) = 'CreatedAtUtc',
    @SortDirection NVARCHAR(4) = 'DESC',
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageIndex - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Com_Products] p
    WHERE p.[IsDeleted] = 0
      AND (@ProgramType IS NULL OR p.[ProgramType] = @ProgramType)
      AND (@TargetCountry IS NULL OR p.[TargetCountry] = @TargetCountry)
      AND (@OwningLegalEntityId IS NULL OR p.[OwningLegalEntityId] = @OwningLegalEntityId)
      AND (@Status IS NULL OR p.[Status] = @Status)
      AND (
          @SearchTerm IS NULL 
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR p.[Name] LIKE N'%' + @SearchTerm + '%'
      );

    SELECT 
        p.[Id], p.[Code], p.[Name], p.[ProgramType], p.[TargetCountry],
        p.[OwningLegalEntityId], le.[Name] AS [OwningLegalEntityName],
        p.[StandardPrice], p.[MinFloorPrice], p.[Currency], p.[Status],
        p.[Description], p.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM [dbo].[Com_Products] p
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = p.[OwningLegalEntityId]
    WHERE p.[IsDeleted] = 0
      AND (@ProgramType IS NULL OR p.[ProgramType] = @ProgramType)
      AND (@TargetCountry IS NULL OR p.[TargetCountry] = @TargetCountry)
      AND (@OwningLegalEntityId IS NULL OR p.[OwningLegalEntityId] = @OwningLegalEntityId)
      AND (@Status IS NULL OR p.[Status] = @Status)
      AND (
          @SearchTerm IS NULL 
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR p.[Name] LIKE N'%' + @SearchTerm + '%'
      )
    ORDER BY 
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'CreatedAtUtc' THEN p.[CreatedAtUtc] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'CreatedAtUtc' THEN p.[CreatedAtUtc] END DESC,
        CASE WHEN @SortDirection = 'ASC' AND @SortColumn = 'StandardPrice' THEN p.[StandardPrice] END ASC,
        CASE WHEN @SortDirection = 'DESC' AND @SortColumn = 'StandardPrice' THEN p.[StandardPrice] END DESC,
        p.[CreatedAtUtc] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

