-- =========================================================================
-- Migration: 20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql
-- Description: Vertical Slice Implementation:
--   STU-01: Student Profile Management (Party360 domain)
--           - Party_PartyRelationships (Family / Guardian / Sponsor)
--           - Stored Procedure sp_Party_Student_GetPagedList (Direct GBAC v4.2, PII Masking)
--           - Stored Procedure sp_Party_Student_GetDetailById
--   ADM-01: Student Application & Dossier Management (AdmissionVisa domain)
--           - Module 'ADMISSIONVISA' & Features in FND-04 Registry
--           - Action Permissions & Administrator Role Grants
--           - Schema: Adm_StudentApplications, Adm_ChecklistItems, Adm_ApplicationDocumentLinks
--           - Stored Procedure sp_Admission_Application_GetPagedList (Fail-Closed Data Scope)
--           - Stored Procedure sp_Admission_Application_GetDetailById
--           - Stored Procedure sp_Admission_Application_GetByStudentPartyId
--           - Stored Procedure sp_Admission_Checklist_GetByApplicationId
--           - Stored Procedure sp_Admission_Checklist_GetById
-- =========================================================================

-- =========================================================================
-- PHẦN I: MODULE, FEATURE VÀ PERMISSIONS REGISTRY (FND-04)
-- =========================================================================

-- 1. ĐĂNG KÝ MODULE ADMISSIONVISA
IF NOT EXISTS (SELECT 1 FROM [dbo].[System_Modules] WHERE [Code] = 'ADMISSIONVISA')
BEGIN
    INSERT INTO [dbo].[System_Modules] ([Id], [Code], [Name], [Description], [Version], [OrderIndex], [Icon], [Status], [IsActive], [CreatedAtUtc])
    VALUES (
        'A1000000-0000-0000-0000-000000000009',
        'ADMISSIONVISA',
        N'Quản lý Tuyển sinh, Hồ sơ & Visa',
        N'Phân hệ quản lý hồ sơ đăng ký du học, xét duyệt giấy tờ, checklist visa và tiến trình thụ lý lãnh sự',
        '1.0.0',
        30,
        'FileText',
        'Active',
        1,
        SYSUTCDATETIME()
    );
END
ELSE
BEGIN
    UPDATE [dbo].[System_Modules]
    SET [Name] = N'Quản lý Tuyển sinh, Hồ sơ & Visa',
        [Description] = N'Phân hệ quản lý hồ sơ đăng ký du học, xét duyệt giấy tờ, checklist visa và tiến trình thụ lý lãnh sự',
        [OrderIndex] = 30,
        [Icon] = 'FileText',
        [Status] = 'Active',
        [IsActive] = 1
    WHERE [Code] = 'ADMISSIONVISA';
END;
GO

-- 2. ĐĂNG KÝ FEATURES CỦA ADMISSIONVISA
DECLARE @AdmissionFeatures TABLE (
    [Id] UNIQUEIDENTIFIER,
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Description] NVARCHAR(500),
    [FeatureType] NVARCHAR(30),
    [RoutePath] NVARCHAR(200),
    [ApiEndpoint] NVARCHAR(200),
    [ComponentKey] NVARCHAR(100),
    [Icon] NVARCHAR(100),
    [OrderIndex] INT,
    [SupportedActions] NVARCHAR(500),
    [Status] NVARCHAR(30),
    [OwnerTeam] NVARCHAR(100),
    [DataClassification] NVARCHAR(30)
);

INSERT INTO @AdmissionFeatures VALUES
('F1000000-0000-0000-0000-000000000301', 'admission.student_application', N'Hồ sơ Đăng ký Tuyển sinh & Du học', N'Tiếp nhận, xử lý đa hồ sơ theo kỳ tuyển sinh và thị trường du học cho mỗi học viên', 'Screen', '/admissions/applications', '/api/v1/admissions/applications', 'StudentApplicationsPage', 'GraduationCap', 10, '["view", "create", "edit", "delete"]', 'Active', 'Admission Team', 'Internal'),
('F1000000-0000-0000-0000-000000000302', 'admission.document_checklist', N'Checklist Giấy tờ & Thẩm định Hồ sơ Visa', N'Số hóa chứng từ, kiểm tra tính pháp lý, đối soát SHA256 và thẩm định hồ sơ visa', 'Screen', '/admissions/checklists', '/api/v1/admissions/applications/:id/checklist', 'ApplicationChecklistPage', 'CheckSquare', 20, '["view", "upload", "verify"]', 'Active', 'Visa Operations Team', 'Confidential');

MERGE [dbo].[System_Features] AS target
USING (
    SELECT f.*, m.[Id] AS [ResolvedModuleId]
    FROM @AdmissionFeatures f
    JOIN [dbo].[System_Modules] m ON m.[Code] = 'ADMISSIONVISA'
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

-- 3. ĐĂNG KÝ PERMISSIONS
DECLARE @AdmissionPermissions TABLE (
    [Code] NVARCHAR(100),
    [Name] NVARCHAR(150),
    [Module] NVARCHAR(50),
    [Description] NVARCHAR(500)
);

INSERT INTO @AdmissionPermissions VALUES
('admission.application.view', N'Xem danh sách & chi tiết hồ sơ tuyển sinh', 'Admission', N'Quyền truy cập danh sách và chi tiết hồ sơ du học/tuyển sinh theo Data Scope'),
('admission.application.create', N'Tạo mới hồ sơ tuyển sinh', 'Admission', N'Quyền lập hồ sơ tuyển sinh mới cho học viên'),
('admission.application.edit', N'Chỉnh sửa & Cập nhật trạng thái hồ sơ', 'Admission', N'Quyền cập nhật thông tin kỳ tuyển sinh, thị trường và tiến trình hồ sơ'),
('admission.application.delete', N'Xóa hồ sơ tuyển sinh', 'Admission', N'Quyền xóa mềm hồ sơ tuyển sinh'),
('admission.dossier.view', N'Xem checklist & tài liệu đính kèm', 'Admission', N'Quyền xem danh mục tài liệu và tải về file scan chứng từ'),
('admission.dossier.upload', N'Tải lên chứng từ số hóa', 'Admission', N'Quyền đính kèm tập tin scan và tài liệu vào checklist hồ sơ'),
('admission.dossier.verify', N'Thẩm định & Phê duyệt tài liệu visa', 'Admission', N'Quyền thẩm định, chấp thuận hoặc từ chối hạng mục tài liệu hồ sơ visa');

MERGE [dbo].[Identity_Permissions] AS target
USING @AdmissionPermissions AS src
ON (target.[Code] = src.[Code])
WHEN MATCHED THEN
    UPDATE SET
        target.[Name] = src.[Name],
        target.[Module] = src.[Module],
        target.[Description] = src.[Description]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [Name], [Module], [Description], [CreatedAtUtc])
    VALUES (NEWID(), src.[Code], src.[Name], src.[Module], src.[Description], SYSUTCDATETIME());
GO

-- 4. ÁNH XẠ FEATURE -> ACTION -> PERMISSION
DECLARE @AdmActionMappings TABLE (
    [FeatureCode] NVARCHAR(100),
    [ActionCode] NVARCHAR(50),
    [ActionName] NVARCHAR(100),
    [PermissionCode] NVARCHAR(100),
    [Description] NVARCHAR(500)
);

INSERT INTO @AdmActionMappings VALUES
('admission.student_application', 'view', N'Xem hồ sơ', 'admission.application.view', N'Xem hồ sơ tuyển sinh'),
('admission.student_application', 'create', N'Tạo hồ sơ', 'admission.application.create', N'Tạo hồ sơ tuyển sinh mới'),
('admission.student_application', 'edit', N'Sửa hồ sơ', 'admission.application.edit', N'Sửa thông tin hồ sơ tuyển sinh'),
('admission.student_application', 'delete', N'Xóa hồ sơ', 'admission.application.delete', N'Xóa mềm hồ sơ tuyển sinh'),
('admission.document_checklist', 'view', N'Xem checklist', 'admission.dossier.view', N'Xem danh mục tài liệu visa'),
('admission.document_checklist', 'upload', N'Đính kèm file', 'admission.dossier.upload', N'Tải lên chứng từ checklist'),
('admission.document_checklist', 'verify', N'Thẩm định', 'admission.dossier.verify', N'Thẩm định tài liệu hồ sơ visa');

MERGE [dbo].[System_FeatureActionPermissions] AS target
USING (
    SELECT 
        m.[ActionCode],
        m.[ActionName],
        m.[PermissionCode],
        m.[Description],
        f.[Id] AS [FeatureId],
        p.[Id] AS [PermissionId]
    FROM @AdmActionMappings m
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

-- 5. CẤP QUYỀN TOÀN QUYỀN CHO NHÓM ADMINISTRATORS
DECLARE @AdminGroupId UNIQUEIDENTIFIER;
SELECT @AdminGroupId = [Id] FROM [dbo].[Identity_UserGroups] WHERE [Code] = 'ADMINISTRATORS';

IF @AdminGroupId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[Identity_UserGroupPermissions] ([UserGroupId], [PermissionId], [GrantedAtUtc])
    SELECT 
        @AdminGroupId,
        p.[Id],
        SYSUTCDATETIME()
    FROM [dbo].[Identity_Permissions] p
    WHERE p.[Code] LIKE 'admission.%'
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[Identity_UserGroupPermissions] ugp
          WHERE ugp.[UserGroupId] = @AdminGroupId
            AND ugp.[PermissionId] = p.[Id]
      );
END;
GO

-- =========================================================================
-- PHẦN II: DỮ LIỆU SCHEMA — BẢNG QUAN HỆ HỌC VIÊN & HỒ SƠ TUYỂN SINH
-- =========================================================================

-- 1. BẢNG Party_PartyRelationships (Mối quan hệ thân nhân/người giám hộ)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_PartyRelationships' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Party_PartyRelationships] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Party_PartyRelationships_Id DEFAULT NEWSEQUENTIALID(),
        [FromPartyId] UNIQUEIDENTIFIER NOT NULL,
        [ToPartyId] UNIQUEIDENTIFIER NULL,
        [RelationshipType] NVARCHAR(50) NOT NULL, -- Father, Mother, Guardian, Sponsor, Spouse, Other
        [RelatedPersonName] NVARCHAR(150) NULL,
        [PhoneNumber] NVARCHAR(50) NULL,
        [Email] NVARCHAR(150) NULL,
        [NationalId] NVARCHAR(50) NULL,
        [Occupation] NVARCHAR(100) NULL,
        [Address] NVARCHAR(250) NULL,
        [IsEmergencyContact] BIT NOT NULL CONSTRAINT DF_Party_PartyRelationships_Emergency DEFAULT 0,
        [IsLegalGuardian] BIT NOT NULL CONSTRAINT DF_Party_PartyRelationships_Guardian DEFAULT 0,
        [IsFinancialSponsor] BIT NOT NULL CONSTRAINT DF_Party_PartyRelationships_Sponsor DEFAULT 0,
        [Notes] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Party_PartyRelationships_IsActive DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Party_PartyRelationships_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Party_PartyRelationships] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Party_PartyRelationships_Party] FOREIGN KEY ([FromPartyId]) REFERENCES [dbo].[Party_Parties] ([Id]),
        CONSTRAINT [FK_Party_PartyRelationships_RelatedParty] FOREIGN KEY ([ToPartyId]) REFERENCES [dbo].[Party_Parties] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Party_PartyRelationships_FromPartyId] ON [dbo].[Party_PartyRelationships] ([FromPartyId], [IsActive]);
    CREATE NONCLUSTERED INDEX [IX_Party_PartyRelationships_ToPartyId] ON [dbo].[Party_PartyRelationships] ([ToPartyId]) WHERE [ToPartyId] IS NOT NULL;
END;
GO

-- 2. BẢNG Adm_StudentApplications (Hồ sơ đăng ký tuyển sinh / du học)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Adm_StudentApplications' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Adm_StudentApplications] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Adm_StudentApplications_Id DEFAULT NEWSEQUENTIALID(),
        [ApplicationCode] NVARCHAR(50) NOT NULL,
        [StudentPartyId] UNIQUEIDENTIFIER NOT NULL,
        [LegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessUnitId] UNIQUEIDENTIFIER NULL,
        [BranchId] UNIQUEIDENTIFIER NULL,
        [TargetMarket] NVARCHAR(100) NOT NULL,
        [IntakeTerm] NVARCHAR(50) NOT NULL,
        [ProgramName] NVARCHAR(200) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL CONSTRAINT DF_Adm_StudentApplications_Status DEFAULT 'Draft',
        [AssignedUserId] UNIQUEIDENTIFIER NULL,
        [Notes] NVARCHAR(1000) NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Adm_StudentApplications_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Adm_StudentApplications_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [UpdatedByUserId] UNIQUEIDENTIFIER NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Adm_StudentApplications] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Adm_StudentApplications_Code] UNIQUE NONCLUSTERED ([ApplicationCode] ASC),
        CONSTRAINT [FK_Adm_StudentApplications_Party] FOREIGN KEY ([StudentPartyId]) REFERENCES [dbo].[Party_Parties] ([Id]),
        CONSTRAINT [FK_Adm_StudentApplications_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Adm_StudentApplications_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]),
        CONSTRAINT [FK_Adm_StudentApplications_Branch] FOREIGN KEY ([BranchId]) REFERENCES [dbo].[Org_Branches] ([Id]),
        CONSTRAINT [FK_Adm_StudentApplications_AssignedUser] FOREIGN KEY ([AssignedUserId]) REFERENCES [dbo].[Identity_Users] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Adm_StudentApplications_Student] ON [dbo].[Adm_StudentApplications] ([StudentPartyId], [IsDeleted]);
    CREATE NONCLUSTERED INDEX [IX_Adm_StudentApplications_LegalEntity] ON [dbo].[Adm_StudentApplications] ([LegalEntityId], [Status], [IsDeleted]);
    CREATE NONCLUSTERED INDEX [IX_Adm_StudentApplications_Intake] ON [dbo].[Adm_StudentApplications] ([TargetMarket], [IntakeTerm]);
END;
GO

-- 3. BẢNG Adm_ChecklistItems (Danh mục hạng mục hồ sơ visa)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Adm_ChecklistItems' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Adm_ChecklistItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Adm_ChecklistItems_Id DEFAULT NEWSEQUENTIALID(),
        [StudentApplicationId] UNIQUEIDENTIFIER NOT NULL,
        [ItemCode] NVARCHAR(50) NOT NULL,
        [ItemName] NVARCHAR(200) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL CONSTRAINT DF_Adm_ChecklistItems_Category DEFAULT 'Other',
        [IsRequired] BIT NOT NULL CONSTRAINT DF_Adm_ChecklistItems_IsRequired DEFAULT 1,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Adm_ChecklistItems_Status DEFAULT 'Pending',
        [Notes] NVARCHAR(500) NULL,
        [RejectionReason] NVARCHAR(500) NULL,
        [VerifiedByUserId] UNIQUEIDENTIFIER NULL,
        [VerifiedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Adm_ChecklistItems_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Adm_ChecklistItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Adm_ChecklistItems_App_Item] UNIQUE NONCLUSTERED ([StudentApplicationId] ASC, [ItemCode] ASC),
        CONSTRAINT [FK_Adm_ChecklistItems_Application] FOREIGN KEY ([StudentApplicationId]) REFERENCES [dbo].[Adm_StudentApplications] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Adm_ChecklistItems_Verifier] FOREIGN KEY ([VerifiedByUserId]) REFERENCES [dbo].[Identity_Users] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Adm_ChecklistItems_AppId] ON [dbo].[Adm_ChecklistItems] ([StudentApplicationId], [Status]);
END;
GO

-- 4. BẢNG Adm_ApplicationDocumentLinks (Liên kết tập tin scan vào checklist)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Adm_ApplicationDocumentLinks' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Adm_ApplicationDocumentLinks] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Adm_ApplicationDocumentLinks_Id DEFAULT NEWSEQUENTIALID(),
        [ChecklistItemId] UNIQUEIDENTIFIER NOT NULL,
        [DocumentId] UNIQUEIDENTIFIER NOT NULL,
        [LinkedByUserId] UNIQUEIDENTIFIER NOT NULL,
        [LinkedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Adm_ApplicationDocumentLinks_LinkedAtUtc DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Adm_ApplicationDocumentLinks] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Adm_ApplicationDocumentLinks_Checklist] FOREIGN KEY ([ChecklistItemId]) REFERENCES [dbo].[Adm_ChecklistItems] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Adm_ApplicationDocumentLinks_Document] FOREIGN KEY ([DocumentId]) REFERENCES [dbo].[Doc_Documents] ([Id]),
        CONSTRAINT [FK_Adm_ApplicationDocumentLinks_User] FOREIGN KEY ([LinkedByUserId]) REFERENCES [dbo].[Identity_Users] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Adm_ApplicationDocumentLinks_Checklist] ON [dbo].[Adm_ApplicationDocumentLinks] ([ChecklistItemId]);
    CREATE NONCLUSTERED INDEX [IX_Adm_ApplicationDocumentLinks_Document] ON [dbo].[Adm_ApplicationDocumentLinks] ([DocumentId]);
END;
GO

-- =========================================================================
-- PHẦN III: STORED PROCEDURES (READ-SIDE, DIRECT GBAC V4.2, PII MASKING)
-- =========================================================================

-- 1. STORED PROCEDURE: sp_Party_Student_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Party_Student_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(50) = 'CreatedAtUtc',
    @SortOrder NVARCHAR(4) = 'DESC',
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- FAIL-CLOSED CHECK: Bắt buộc @CurrentUserId
    IF @CurrentUserId IS NULL
    BEGIN
        SET @TotalCount = 0;
        SELECT TOP 0
            CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
            CAST(NULL AS NVARCHAR(50)) AS [Code],
            CAST(NULL AS NVARCHAR(50)) AS [PartyType],
            CAST(NULL AS NVARCHAR(30)) AS [Status],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [LegalEntityId],
            CAST(NULL AS NVARCHAR(150)) AS [LegalEntityName],
            CAST(NULL AS NVARCHAR(150)) AS [FullName],
            CAST(NULL AS DATETIME2(7)) AS [DateOfBirth],
            CAST(NULL AS NVARCHAR(20)) AS [Gender],
            CAST(NULL AS NVARCHAR(50)) AS [Nationality],
            CAST(NULL AS NVARCHAR(50)) AS [PrimaryPhone],
            CAST(NULL AS NVARCHAR(150)) AS [PrimaryEmail],
            CAST(0 AS INT) AS [ApplicationCount],
            CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
            CAST(0 AS INT) AS [TotalCount];
        RETURN;
    END;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Kiểm tra quyền Admin hoặc Scope
    DECLARE @IsAdmin BIT = 0;
    DECLARE @HasGlobalScope BIT = 0;
    DECLARE @HasPiiAccess BIT = 0;

    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @CurrentUserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
        SET @HasGlobalScope = 1;
        SET @HasPiiAccess = 1;
    END;

    IF @HasGlobalScope = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
            JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
            JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
            JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
            WHERE ugm.[UserId] = @CurrentUserId
              AND p.[Code] IN ('party.profile.view', 'admission.application.view')
              AND ug.[ScopeType] = 'Global'
        )
        BEGIN
            SET @HasGlobalScope = 1;
        END;

        IF EXISTS (
            SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
            JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ugm.[UserGroupId]
            JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
            WHERE ugm.[UserId] = @CurrentUserId
              AND p.[Code] = 'party.pii.view'
        )
        BEGIN
            SET @HasPiiAccess = 1;
        END;
    END;

    -- Bảng tạm lưu phạm vi pháp nhân được cấp phép
    DECLARE @AllowedLegalEntities TABLE ([LegalEntityId] UNIQUEIDENTIFIER PRIMARY KEY);
    IF @HasGlobalScope = 0
    BEGIN
        INSERT INTO @AllowedLegalEntities ([LegalEntityId])
        SELECT DISTINCT ugm.[ScopeLegalEntityId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @CurrentUserId
          AND p.[Code] IN ('party.profile.view', 'admission.application.view')
          AND ugm.[ScopeLegalEntityId] IS NOT NULL;

        -- Fail-closed: Nếu không có scope nào, trả về rỗng
        IF NOT EXISTS (SELECT 1 FROM @AllowedLegalEntities)
        BEGIN
            SET @TotalCount = 0;
            SELECT TOP 0
                CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
                CAST(NULL AS NVARCHAR(50)) AS [Code],
                CAST(NULL AS NVARCHAR(50)) AS [PartyType],
                CAST(NULL AS NVARCHAR(30)) AS [Status],
                CAST(NULL AS UNIQUEIDENTIFIER) AS [LegalEntityId],
                CAST(NULL AS NVARCHAR(150)) AS [LegalEntityName],
                CAST(NULL AS NVARCHAR(150)) AS [FullName],
                CAST(NULL AS DATETIME2(7)) AS [DateOfBirth],
                CAST(NULL AS NVARCHAR(20)) AS [Gender],
                CAST(NULL AS NVARCHAR(50)) AS [Nationality],
                CAST(NULL AS NVARCHAR(50)) AS [PrimaryPhone],
                CAST(NULL AS NVARCHAR(150)) AS [PrimaryEmail],
                CAST(0 AS INT) AS [ApplicationCount],
                CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
                CAST(0 AS INT) AS [TotalCount];
            RETURN;
        END;
    END;

    -- Truy vấn tổng số lượng
    SELECT @TotalCount = COUNT(DISTINCT p.[Id])
    FROM [dbo].[Party_Parties] p
    JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    JOIN [dbo].[Party_PartyRoles] pr ON pr.[PartyId] = p.[Id] AND pr.[RoleType] = 'Student' AND pr.[IsActive] = 1
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = pr.[LegalEntityId]
    WHERE p.[IsDeleted] = 0
      AND (@Status IS NULL OR p.[Status] = @Status)
      AND (@LegalEntityId IS NULL OR pr.[LegalEntityId] = @LegalEntityId)
      AND (
          @HasGlobalScope = 1 
          OR pr.[LegalEntityId] IN (SELECT [LegalEntityId] FROM @AllowedLegalEntities)
      )
      AND (
          @SearchTerm IS NULL
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR per.[FirstName] LIKE '%' + @SearchTerm + '%'
          OR per.[LastName] LIKE '%' + @SearchTerm + '%'
          OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
      );

    -- Truy vấn dữ liệu phân trang kèm PII Masking
    ;WITH StudentData AS (
        SELECT 
            p.[Id],
            p.[Code],
            p.[PartyType],
            p.[Status],
            pr.[LegalEntityId],
            le.[Name] AS [LegalEntityName],
            (per.[LastName] + ' ' + per.[FirstName]) AS [FullName],
            per.[DateOfBirth],
            per.[Gender],
            per.[Nationality],
            (
                SELECT TOP 1 cm.[Value]
                FROM [dbo].[Party_PartyContactMethods] cm
                WHERE cm.[PartyId] = p.[Id] AND cm.[ContactType] = 'Phone' AND cm.[IsPrimary] = 1
            ) AS [RawPhone],
            (
                SELECT TOP 1 cm.[Value]
                FROM [dbo].[Party_PartyContactMethods] cm
                WHERE cm.[PartyId] = p.[Id] AND cm.[ContactType] = 'Email' AND cm.[IsPrimary] = 1
            ) AS [RawEmail],
            (
                SELECT COUNT(1)
                FROM [dbo].[Adm_StudentApplications] a
                WHERE a.[StudentPartyId] = p.[Id] AND a.[IsDeleted] = 0
            ) AS [ApplicationCount],
            p.[CreatedAtUtc]
        FROM [dbo].[Party_Parties] p
        JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
        JOIN [dbo].[Party_PartyRoles] pr ON pr.[PartyId] = p.[Id] AND pr.[RoleType] = 'Student' AND pr.[IsActive] = 1
        LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = pr.[LegalEntityId]
        WHERE p.[IsDeleted] = 0
          AND (@Status IS NULL OR p.[Status] = @Status)
          AND (@LegalEntityId IS NULL OR pr.[LegalEntityId] = @LegalEntityId)
          AND (
              @HasGlobalScope = 1 
              OR pr.[LegalEntityId] IN (SELECT [LegalEntityId] FROM @AllowedLegalEntities)
          )
          AND (
              @SearchTerm IS NULL
              OR p.[Code] LIKE '%' + @SearchTerm + '%'
              OR per.[FirstName] LIKE '%' + @SearchTerm + '%'
              OR per.[LastName] LIKE '%' + @SearchTerm + '%'
              OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
          )
    )
    SELECT 
        sd.[Id],
        sd.[Code],
        sd.[PartyType],
        sd.[Status],
        sd.[LegalEntityId],
        sd.[LegalEntityName],
        sd.[FullName],
        sd.[DateOfBirth],
        sd.[Gender],
        sd.[Nationality],
        CASE 
            WHEN @HasPiiAccess = 1 OR sd.[RawPhone] IS NULL THEN sd.[RawPhone]
            WHEN LEN(sd.[RawPhone]) <= 6 THEN '***' + RIGHT(sd.[RawPhone], 3)
            ELSE LEFT(sd.[RawPhone], 3) + '***' + RIGHT(sd.[RawPhone], 3)
        END AS [PrimaryPhone],
        CASE 
            WHEN @HasPiiAccess = 1 OR sd.[RawEmail] IS NULL THEN sd.[RawEmail]
            ELSE LEFT(sd.[RawEmail], 2) + '***@' + SUBSTRING(sd.[RawEmail], CHARINDEX('@', sd.[RawEmail]) + 1, 100)
        END AS [PrimaryEmail],
        sd.[ApplicationCount],
        sd.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM StudentData sd
    ORDER BY 
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN sd.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN sd.[Code] END DESC,
        CASE WHEN @SortBy = 'FullName' AND @SortOrder = 'ASC' THEN sd.[FullName] END ASC,
        CASE WHEN @SortBy = 'FullName' AND @SortOrder = 'DESC' THEN sd.[FullName] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN sd.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN sd.[CreatedAtUtc] END DESC,
        sd.[CreatedAtUtc] DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 2. STORED PROCEDURE: sp_Party_Student_GetDetailById
CREATE OR ALTER PROCEDURE [dbo].[sp_Party_Student_GetDetailById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentUserId IS NULL
    BEGIN
        SELECT TOP 0 CAST(NULL AS UNIQUEIDENTIFIER) AS [Id];
        RETURN;
    END;

    -- Result 1: Thống kê và thông tin Party / Person
    SELECT 
        p.[Id],
        p.[Code],
        p.[PartyType],
        p.[Status],
        p.[CreatedAtUtc],
        CAST(NULL AS DATETIME2(7)) AS [UpdatedAtUtc],
        CONVERT(VARCHAR(50), p.[RowVersion], 2) AS [RowVersionBase64],
        per.[FirstName],
        per.[LastName],
        (per.[LastName] + ' ' + per.[FirstName]) AS [FullName],
        per.[DateOfBirth],
        per.[Gender],
        per.[Nationality]
    FROM [dbo].[Party_Parties] p
    LEFT JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    WHERE p.[Id] = @Id AND p.[IsDeleted] = 0;

    -- Result 2: PartyRoles
    SELECT 
        pr.[Id],
        pr.[RoleType],
        pr.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        pr.[IsActive],
        CAST(NULL AS DATETIME2(7)) AS [EffectiveFromUtc],
        CAST(NULL AS DATETIME2(7)) AS [EffectiveToUtc]
    FROM [dbo].[Party_PartyRoles] pr
    LEFT JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = pr.[LegalEntityId]
    WHERE pr.[PartyId] = @Id;

    -- Result 3: Contact Methods
    SELECT 
        cm.[Id],
        cm.[ContactType],
        cm.[Value],
        cm.[IsPrimary],
        CAST(NULL AS NVARCHAR(500)) AS [Notes]
    FROM [dbo].[Party_PartyContactMethods] cm
    WHERE cm.[PartyId] = @Id;

    -- Result 4: Identifications
    SELECT 
        pi.[Id],
        pi.[IdentificationType] AS [IdType],
        pi.[IdentificationNumber] AS [IdNumber],
        pi.[IssueDate],
        pi.[ExpiryDate],
        pi.[IssuingAuthority] AS [IssuePlace],
        CAST(1 AS BIT) AS [IsPrimary]
    FROM [dbo].[Party_PartyIdentifications] pi
    WHERE pi.[PartyId] = @Id;

    -- Result 5: Relationships (Thân nhân, người giám hộ)
    SELECT 
        rel.[Id],
        rel.[FromPartyId] AS [PartyId],
        rel.[ToPartyId] AS [RelatedPartyId],
        rel.[RelationshipType],
        rel.[RelatedPersonName],
        rel.[PhoneNumber],
        rel.[Email],
        rel.[NationalId],
        rel.[Occupation],
        rel.[Address],
        rel.[IsEmergencyContact],
        rel.[IsLegalGuardian],
        rel.[IsFinancialSponsor],
        rel.[Notes],
        rel.[IsActive]
    FROM [dbo].[Party_PartyRelationships] rel
    WHERE rel.[FromPartyId] = @Id AND rel.[IsActive] = 1;
END;
GO

-- 3. STORED PROCEDURE: sp_Admission_Application_GetPagedList
CREATE OR ALTER PROCEDURE [dbo].[sp_Admission_Application_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @TargetMarket NVARCHAR(100) = NULL,
    @IntakeTerm NVARCHAR(50) = NULL,
    @Status NVARCHAR(50) = NULL,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @StudentPartyId UNIQUEIDENTIFIER = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(50) = 'CreatedAtUtc',
    @SortOrder NVARCHAR(4) = 'DESC',
    @CurrentUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- FAIL-CLOSED CHECK: Bắt buộc @CurrentUserId
    IF @CurrentUserId IS NULL
    BEGIN
        SET @TotalCount = 0;
        SELECT TOP 0
            CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
            CAST(NULL AS NVARCHAR(50)) AS [ApplicationCode],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [StudentPartyId],
            CAST(NULL AS NVARCHAR(150)) AS [StudentName],
            CAST(NULL AS NVARCHAR(50)) AS [StudentCode],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [LegalEntityId],
            CAST(NULL AS NVARCHAR(150)) AS [LegalEntityName],
            CAST(NULL AS NVARCHAR(100)) AS [TargetMarket],
            CAST(NULL AS NVARCHAR(50)) AS [IntakeTerm],
            CAST(NULL AS NVARCHAR(200)) AS [ProgramName],
            CAST(NULL AS NVARCHAR(50)) AS [Status],
            CAST(NULL AS UNIQUEIDENTIFIER) AS [AssignedUserId],
            CAST(NULL AS NVARCHAR(150)) AS [AssignedUserName],
            CAST(0 AS INT) AS [TotalChecklistItems],
            CAST(0 AS INT) AS [VerifiedChecklistItems],
            CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
            CAST(0 AS INT) AS [TotalCount];
        RETURN;
    END;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');

    -- Quyền Admin / Global
    DECLARE @IsAdmin BIT = 0;
    DECLARE @HasGlobalScope BIT = 0;

    IF EXISTS (
        SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
        WHERE ugm.[UserId] = @CurrentUserId
          AND ug.[Code] = 'ADMINISTRATORS'
          AND ug.[IsActive] = 1
    )
    BEGIN
        SET @IsAdmin = 1;
        SET @HasGlobalScope = 1;
    END;

    IF @HasGlobalScope = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM [dbo].[Identity_UserGroupMembers] ugm
            JOIN [dbo].[Identity_UserGroups] ug ON ug.[Id] = ugm.[UserGroupId]
            JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ug.[Id]
            JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
            WHERE ugm.[UserId] = @CurrentUserId
              AND p.[Code] = 'admission.application.view'
              AND ug.[ScopeType] = 'Global'
        )
        BEGIN
            SET @HasGlobalScope = 1;
        END;
    END;

    DECLARE @AllowedLegalEntities TABLE ([LegalEntityId] UNIQUEIDENTIFIER PRIMARY KEY);
    IF @HasGlobalScope = 0
    BEGIN
        INSERT INTO @AllowedLegalEntities ([LegalEntityId])
        SELECT DISTINCT ugm.[ScopeLegalEntityId]
        FROM [dbo].[Identity_UserGroupMembers] ugm
        JOIN [dbo].[Identity_UserGroupPermissions] ugp ON ugp.[UserGroupId] = ugm.[UserGroupId]
        JOIN [dbo].[Identity_Permissions] p ON p.[Id] = ugp.[PermissionId]
        WHERE ugm.[UserId] = @CurrentUserId
          AND p.[Code] = 'admission.application.view'
          AND ugm.[ScopeLegalEntityId] IS NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM @AllowedLegalEntities)
        BEGIN
            SET @TotalCount = 0;
            SELECT TOP 0
                CAST(NULL AS UNIQUEIDENTIFIER) AS [Id],
                CAST(NULL AS NVARCHAR(50)) AS [ApplicationCode],
                CAST(NULL AS UNIQUEIDENTIFIER) AS [StudentPartyId],
                CAST(NULL AS NVARCHAR(150)) AS [StudentName],
                CAST(NULL AS NVARCHAR(50)) AS [StudentCode],
                CAST(NULL AS UNIQUEIDENTIFIER) AS [LegalEntityId],
                CAST(NULL AS NVARCHAR(150)) AS [LegalEntityName],
                CAST(NULL AS NVARCHAR(100)) AS [TargetMarket],
                CAST(NULL AS NVARCHAR(50)) AS [IntakeTerm],
                CAST(NULL AS NVARCHAR(200)) AS [ProgramName],
                CAST(NULL AS NVARCHAR(50)) AS [Status],
                CAST(NULL AS UNIQUEIDENTIFIER) AS [AssignedUserId],
                CAST(NULL AS NVARCHAR(150)) AS [AssignedUserName],
                CAST(0 AS INT) AS [TotalChecklistItems],
                CAST(0 AS INT) AS [VerifiedChecklistItems],
                CAST(NULL AS DATETIME2(7)) AS [CreatedAtUtc],
                CAST(0 AS INT) AS [TotalCount];
            RETURN;
        END;
    END;

    -- Đếm tổng số lượng
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Adm_StudentApplications] a
    JOIN [dbo].[Party_Parties] p ON p.[Id] = a.[StudentPartyId]
    JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    WHERE a.[IsDeleted] = 0
      AND (@TargetMarket IS NULL OR a.[TargetMarket] = @TargetMarket)
      AND (@IntakeTerm IS NULL OR a.[IntakeTerm] = @IntakeTerm)
      AND (@Status IS NULL OR a.[Status] = @Status)
      AND (@LegalEntityId IS NULL OR a.[LegalEntityId] = @LegalEntityId)
      AND (@StudentPartyId IS NULL OR a.[StudentPartyId] = @StudentPartyId)
      AND (
          @HasGlobalScope = 1 
          OR a.[LegalEntityId] IN (SELECT [LegalEntityId] FROM @AllowedLegalEntities)
      )
      AND (
          @SearchTerm IS NULL
          OR a.[ApplicationCode] LIKE '%' + @SearchTerm + '%'
          OR a.[ProgramName] LIKE '%' + @SearchTerm + '%'
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
      );

    -- Dữ liệu phân trang
    SELECT 
        a.[Id],
        a.[ApplicationCode],
        a.[StudentPartyId],
        (per.[LastName] + ' ' + per.[FirstName]) AS [StudentName],
        p.[Code] AS [StudentCode],
        a.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        a.[TargetMarket],
        a.[IntakeTerm],
        a.[ProgramName],
        a.[Status],
        a.[AssignedUserId],
        u.[FullName] AS [AssignedUserName],
        (SELECT COUNT(1) FROM [dbo].[Adm_ChecklistItems] c WHERE c.[StudentApplicationId] = a.[Id]) AS [TotalChecklistItems],
        (SELECT COUNT(1) FROM [dbo].[Adm_ChecklistItems] c WHERE c.[StudentApplicationId] = a.[Id] AND c.[Status] = 'Verified') AS [VerifiedChecklistItems],
        a.[CreatedAtUtc],
        @TotalCount AS [TotalCount]
    FROM [dbo].[Adm_StudentApplications] a
    JOIN [dbo].[Party_Parties] p ON p.[Id] = a.[StudentPartyId]
    JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = a.[LegalEntityId]
    LEFT JOIN [dbo].[Identity_Users] u ON u.[Id] = a.[AssignedUserId]
    WHERE a.[IsDeleted] = 0
      AND (@TargetMarket IS NULL OR a.[TargetMarket] = @TargetMarket)
      AND (@IntakeTerm IS NULL OR a.[IntakeTerm] = @IntakeTerm)
      AND (@Status IS NULL OR a.[Status] = @Status)
      AND (@LegalEntityId IS NULL OR a.[LegalEntityId] = @LegalEntityId)
      AND (@StudentPartyId IS NULL OR a.[StudentPartyId] = @StudentPartyId)
      AND (
          @HasGlobalScope = 1 
          OR a.[LegalEntityId] IN (SELECT [LegalEntityId] FROM @AllowedLegalEntities)
      )
      AND (
          @SearchTerm IS NULL
          OR a.[ApplicationCode] LIKE '%' + @SearchTerm + '%'
          OR a.[ProgramName] LIKE '%' + @SearchTerm + '%'
          OR p.[Code] LIKE '%' + @SearchTerm + '%'
          OR (per.[LastName] + ' ' + per.[FirstName]) LIKE '%' + @SearchTerm + '%'
      )
    ORDER BY 
        CASE WHEN @SortBy = 'ApplicationCode' AND @SortOrder = 'ASC' THEN a.[ApplicationCode] END ASC,
        CASE WHEN @SortBy = 'ApplicationCode' AND @SortOrder = 'DESC' THEN a.[ApplicationCode] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN a.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN a.[CreatedAtUtc] END DESC,
        a.[CreatedAtUtc] DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- 4. STORED PROCEDURE: sp_Admission_Application_GetDetailById
CREATE OR ALTER PROCEDURE [dbo].[sp_Admission_Application_GetDetailById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentUserId IS NULL
    BEGIN
        SELECT TOP 0 CAST(NULL AS UNIQUEIDENTIFIER) AS [Id];
        RETURN;
    END;

    -- Result 1: Thông tin chi tiết hồ sơ
    SELECT 
        a.[Id],
        a.[ApplicationCode],
        a.[StudentPartyId],
        (per.[LastName] + ' ' + per.[FirstName]) AS [StudentName],
        p.[Code] AS [StudentCode],
        a.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        a.[BusinessUnitId],
        bu.[Name] AS [BusinessUnitName],
        a.[BranchId],
        br.[Name] AS [BranchName],
        a.[TargetMarket],
        a.[IntakeTerm],
        a.[ProgramName],
        a.[Status],
        a.[AssignedUserId],
        u.[FullName] AS [AssignedUserName],
        a.[Notes],
        CONVERT(VARCHAR(50), a.[RowVersion], 2) AS [RowVersion],
        a.[CreatedAtUtc],
        a.[UpdatedAtUtc]
    FROM [dbo].[Adm_StudentApplications] a
    JOIN [dbo].[Party_Parties] p ON p.[Id] = a.[StudentPartyId]
    JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = a.[LegalEntityId]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu ON bu.[Id] = a.[BusinessUnitId]
    LEFT JOIN [dbo].[Org_Branches] br ON br.[Id] = a.[BranchId]
    LEFT JOIN [dbo].[Identity_Users] u ON u.[Id] = a.[AssignedUserId]
    WHERE a.[Id] = @Id AND a.[IsDeleted] = 0;

    -- Result 2: Danh mục Checklist items
    SELECT 
        c.[Id],
        c.[StudentApplicationId],
        c.[ItemCode],
        c.[ItemName],
        c.[Category],
        c.[IsRequired],
        c.[Status],
        c.[Notes],
        c.[RejectionReason],
        c.[VerifiedByUserId],
        vu.[FullName] AS [VerifiedByName],
        c.[VerifiedAtUtc],
        CONVERT(VARCHAR(50), c.[RowVersion], 2) AS [RowVersion]
    FROM [dbo].[Adm_ChecklistItems] c
    LEFT JOIN [dbo].[Identity_Users] vu ON vu.[Id] = c.[VerifiedByUserId]
    WHERE c.[StudentApplicationId] = @Id
    ORDER BY c.[IsRequired] DESC, c.[Category] ASC, c.[ItemCode] ASC;

    -- Result 3: Danh sách Document links của các checklist items
    SELECT 
        l.[Id],
        l.[ChecklistItemId],
        l.[DocumentId],
        d.[Title] AS [DocumentTitle],
        d.[DocumentType],
        d.[OriginalFileName],
        d.[ContentType],
        d.[FileSizeBytes],
        d.[Sha256Checksum],
        l.[LinkedByUserId],
        lu.[FullName] AS [LinkedByName],
        l.[LinkedAtUtc]
    FROM [dbo].[Adm_ApplicationDocumentLinks] l
    JOIN [dbo].[Adm_ChecklistItems] c ON c.[Id] = l.[ChecklistItemId]
    JOIN [dbo].[Doc_Documents] d ON d.[Id] = l.[DocumentId] AND d.[IsDeleted] = 0
    LEFT JOIN [dbo].[Identity_Users] lu ON lu.[Id] = l.[LinkedByUserId]
    WHERE c.[StudentApplicationId] = @Id
    ORDER BY l.[LinkedAtUtc] DESC;
END;
GO

-- 5. STORED PROCEDURE: sp_Admission_Application_GetByStudentPartyId
CREATE OR ALTER PROCEDURE [dbo].[sp_Admission_Application_GetByStudentPartyId]
    @StudentPartyId UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentUserId IS NULL
    BEGIN
        SELECT TOP 0 CAST(NULL AS UNIQUEIDENTIFIER) AS [Id];
        RETURN;
    END;

    SELECT 
        a.[Id],
        a.[ApplicationCode],
        a.[StudentPartyId],
        (per.[LastName] + ' ' + per.[FirstName]) AS [StudentName],
        p.[Code] AS [StudentCode],
        a.[LegalEntityId],
        le.[Name] AS [LegalEntityName],
        a.[TargetMarket],
        a.[IntakeTerm],
        a.[ProgramName],
        a.[Status],
        a.[AssignedUserId],
        u.[FullName] AS [AssignedUserName],
        (SELECT COUNT(1) FROM [dbo].[Adm_ChecklistItems] c WHERE c.[StudentApplicationId] = a.[Id]) AS [TotalChecklistItems],
        (SELECT COUNT(1) FROM [dbo].[Adm_ChecklistItems] c WHERE c.[StudentApplicationId] = a.[Id] AND c.[Status] = 'Verified') AS [VerifiedChecklistItems],
        a.[CreatedAtUtc]
    FROM [dbo].[Adm_StudentApplications] a
    JOIN [dbo].[Party_Parties] p ON p.[Id] = a.[StudentPartyId]
    JOIN [dbo].[Party_Persons] per ON per.[PartyId] = p.[Id]
    JOIN [dbo].[Org_LegalEntities] le ON le.[Id] = a.[LegalEntityId]
    LEFT JOIN [dbo].[Identity_Users] u ON u.[Id] = a.[AssignedUserId]
    WHERE a.[StudentPartyId] = @StudentPartyId AND a.[IsDeleted] = 0
    ORDER BY a.[CreatedAtUtc] DESC;
END;
GO

-- 6. STORED PROCEDURE: sp_Admission_Checklist_GetByApplicationId
CREATE OR ALTER PROCEDURE [dbo].[sp_Admission_Checklist_GetByApplicationId]
    @ApplicationId UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentUserId IS NULL
    BEGIN
        SELECT TOP 0 CAST(NULL AS UNIQUEIDENTIFIER) AS [Id];
        RETURN;
    END;

    -- Result 1: Checklist items
    SELECT 
        c.[Id],
        c.[StudentApplicationId],
        c.[ItemCode],
        c.[ItemName],
        c.[Category],
        c.[IsRequired],
        c.[Status],
        c.[Notes],
        c.[RejectionReason],
        c.[VerifiedByUserId],
        vu.[FullName] AS [VerifiedByName],
        c.[VerifiedAtUtc],
        CONVERT(VARCHAR(50), c.[RowVersion], 2) AS [RowVersion]
    FROM [dbo].[Adm_ChecklistItems] c
    LEFT JOIN [dbo].[Identity_Users] vu ON vu.[Id] = c.[VerifiedByUserId]
    WHERE c.[StudentApplicationId] = @ApplicationId
    ORDER BY c.[IsRequired] DESC, c.[Category] ASC, c.[ItemCode] ASC;

    -- Result 2: Document links
    SELECT 
        l.[Id],
        l.[ChecklistItemId],
        l.[DocumentId],
        d.[Title] AS [DocumentTitle],
        d.[DocumentType],
        d.[OriginalFileName],
        d.[ContentType],
        d.[FileSizeBytes],
        d.[Sha256Checksum],
        l.[LinkedByUserId],
        lu.[FullName] AS [LinkedByName],
        l.[LinkedAtUtc]
    FROM [dbo].[Adm_ApplicationDocumentLinks] l
    JOIN [dbo].[Adm_ChecklistItems] c ON c.[Id] = l.[ChecklistItemId]
    JOIN [dbo].[Doc_Documents] d ON d.[Id] = l.[DocumentId] AND d.[IsDeleted] = 0
    LEFT JOIN [dbo].[Identity_Users] lu ON lu.[Id] = l.[LinkedByUserId]
    WHERE c.[StudentApplicationId] = @ApplicationId
    ORDER BY l.[LinkedAtUtc] DESC;
END;
GO

-- 7. STORED PROCEDURE: sp_Admission_Checklist_GetById
CREATE OR ALTER PROCEDURE [dbo].[sp_Admission_Checklist_GetById]
    @Id UNIQUEIDENTIFIER,
    @CurrentUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentUserId IS NULL
    BEGIN
        SELECT TOP 0 CAST(NULL AS UNIQUEIDENTIFIER) AS [Id];
        RETURN;
    END;

    -- Result 1: Checklist item
    SELECT 
        c.[Id],
        c.[StudentApplicationId],
        c.[ItemCode],
        c.[ItemName],
        c.[Category],
        c.[IsRequired],
        c.[Status],
        c.[Notes],
        c.[RejectionReason],
        c.[VerifiedByUserId],
        vu.[FullName] AS [VerifiedByName],
        c.[VerifiedAtUtc],
        CONVERT(VARCHAR(50), c.[RowVersion], 2) AS [RowVersion]
    FROM [dbo].[Adm_ChecklistItems] c
    LEFT JOIN [dbo].[Identity_Users] vu ON vu.[Id] = c.[VerifiedByUserId]
    WHERE c.[Id] = @Id;

    -- Result 2: Document links
    SELECT 
        l.[Id],
        l.[ChecklistItemId],
        l.[DocumentId],
        d.[Title] AS [DocumentTitle],
        d.[DocumentType],
        d.[OriginalFileName],
        d.[ContentType],
        d.[FileSizeBytes],
        d.[Sha256Checksum],
        l.[LinkedByUserId],
        lu.[FullName] AS [LinkedByName],
        l.[LinkedAtUtc]
    FROM [dbo].[Adm_ApplicationDocumentLinks] l
    JOIN [dbo].[Doc_Documents] d ON d.[Id] = l.[DocumentId] AND d.[IsDeleted] = 0
    LEFT JOIN [dbo].[Identity_Users] lu ON lu.[Id] = l.[LinkedByUserId]
    WHERE l.[ChecklistItemId] = @Id
    ORDER BY l.[LinkedAtUtc] DESC;
END;
GO

