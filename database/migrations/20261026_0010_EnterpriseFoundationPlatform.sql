-- =========================================================================
-- Migration: 20261026_0010_EnterpriseFoundationPlatform.sql
-- Description: Core Enterprise Foundation Platform Schemas
--   1. Audit Logging Framework (Audit_SystemLogs)
--   2. Transactional Outbox & Event Architecture (System_OutboxMessages)
--   3. Module & Feature Registry (System_Modules, System_Features)
--   4. Common Master Data Catalog (System_MasterDataCatalogs, System_MasterDataItems)
--   5. Document Management Metadata (Doc_Documents, Doc_Attachments)
--   6. Business Workflow & Approval State Foundation (Wf_Definitions, Wf_Instances, Wf_History)
-- =========================================================================

-- 1. BẢNG NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGGING FRAMEWORK)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Audit_SystemLogs' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Audit_SystemLogs] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Audit_SystemLogs_Id DEFAULT NEWSEQUENTIALID(),
        [UserId] UNIQUEIDENTIFIER NULL,
        [UserName] NVARCHAR(100) NULL,
        [LegalEntityId] UNIQUEIDENTIFIER NULL,
        [Action] NVARCHAR(50) NOT NULL, -- Insert, Update, SoftDelete, Restore, HardDelete, SecurityOverride
        [EntityName] NVARCHAR(100) NOT NULL,
        [EntityId] NVARCHAR(100) NOT NULL,
        [OldValues] NVARCHAR(MAX) NULL,
        [NewValues] NVARCHAR(MAX) NULL,
        [AffectedColumns] NVARCHAR(MAX) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [UserAgent] NVARCHAR(500) NULL,
        [CorrelationId] NVARCHAR(100) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Audit_SystemLogs_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Audit_SystemLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_Audit_SystemLogs_Entity] ON [dbo].[Audit_SystemLogs] ([EntityName], [EntityId]);
    CREATE NONCLUSTERED INDEX [IX_Audit_SystemLogs_UserId] ON [dbo].[Audit_SystemLogs] ([UserId]);
    CREATE NONCLUSTERED INDEX [IX_Audit_SystemLogs_LegalEntityId] ON [dbo].[Audit_SystemLogs] ([LegalEntityId]);
    CREATE NONCLUSTERED INDEX [IX_Audit_SystemLogs_CreatedAtUtc] ON [dbo].[Audit_SystemLogs] ([CreatedAtUtc] DESC);
END;
GO

-- 2. TRANSACTIONAL OUTBOX & DOMAIN EVENTS (EVENT ARCHITECTURE)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_OutboxMessages' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_OutboxMessages] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_OutboxMessages_Id DEFAULT NEWSEQUENTIALID(),
        [OccurredOnUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_OutboxMessages_OccurredOnUtc DEFAULT SYSUTCDATETIME(),
        [EventType] NVARCHAR(250) NOT NULL,
        [PayloadJson] NVARCHAR(MAX) NOT NULL,
        [ProcessedOnUtc] DATETIME2(7) NULL,
        [Error] NVARCHAR(MAX) NULL,
        [RetryCount] INT NOT NULL CONSTRAINT DF_System_OutboxMessages_RetryCount DEFAULT 0,
        [LegalEntityId] UNIQUEIDENTIFIER NULL,
        [CorrelationId] NVARCHAR(100) NULL,
        CONSTRAINT [PK_System_OutboxMessages] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_System_OutboxMessages_Pending] 
        ON [dbo].[System_OutboxMessages] ([ProcessedOnUtc], [OccurredOnUtc])
        INCLUDE ([RetryCount]);
END;
GO

-- 3. MODULE & FEATURE REGISTRY
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_Modules' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_Modules] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_Modules_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [Version] NVARCHAR(30) NOT NULL,
        [OrderIndex] INT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL CONSTRAINT DF_System_Modules_IsActive DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_Modules_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_Modules] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_System_Modules_Code] UNIQUE NONCLUSTERED ([Code])
    );
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_Features' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_Features] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_Features_Id DEFAULT NEWSEQUENTIALID(),
        [ModuleId] UNIQUEIDENTIFIER NOT NULL,
        [Code] NVARCHAR(100) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsEnabledGlobal] BIT NOT NULL CONSTRAINT DF_System_Features_IsEnabledGlobal DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_Features_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_Features] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_System_Features_Module] FOREIGN KEY ([ModuleId]) REFERENCES [dbo].[System_Modules] ([Id]),
        CONSTRAINT [UQ_System_Features_Code] UNIQUE NONCLUSTERED ([Code])
    );
END;
GO

-- 4. COMMON MASTER DATA CATALOG
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_MasterDataCatalogs' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_MasterDataCatalogs] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [IsSystem] BIT NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_IsSystem DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_MasterDataCatalogs] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_System_MasterDataCatalogs_Code] UNIQUE NONCLUSTERED ([Code])
    );
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_MasterDataItems' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_MasterDataItems] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_MasterDataItems_Id DEFAULT NEWSEQUENTIALID(),
        [CatalogId] UNIQUEIDENTIFIER NOT NULL,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Value] NVARCHAR(500) NULL,
        [DisplayOrder] INT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL CONSTRAINT DF_System_MasterDataItems_IsActive DEFAULT 1,
        [ParentItemId] UNIQUEIDENTIFIER NULL,
        [MetadataJson] NVARCHAR(MAX) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_MasterDataItems_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_MasterDataItems] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_System_MasterDataItems_Catalog] FOREIGN KEY ([CatalogId]) REFERENCES [dbo].[System_MasterDataCatalogs] ([Id]),
        CONSTRAINT [FK_System_MasterDataItems_Parent] FOREIGN KEY ([ParentItemId]) REFERENCES [dbo].[System_MasterDataItems] ([Id]),
        CONSTRAINT [UQ_System_MasterDataItems_Code] UNIQUE NONCLUSTERED ([CatalogId], [Code])
    );
END;
GO

-- 5. DOCUMENT MANAGEMENT METADATA & DATA CLASSIFICATION
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Doc_Documents' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Doc_Documents] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Doc_Documents_Id DEFAULT NEWSEQUENTIALID(),
        [LegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [DocumentNumber] NVARCHAR(100) NULL,
        [Title] NVARCHAR(250) NOT NULL,
        [DocumentType] NVARCHAR(50) NOT NULL,
        [DataClassification] NVARCHAR(30) NOT NULL CONSTRAINT DF_Doc_Documents_Classification DEFAULT 'Internal', -- Public, Internal, Confidential, Restricted
        [OwnerUserId] UNIQUEIDENTIFIER NOT NULL,
        [PartyId] UNIQUEIDENTIFIER NULL,
        [StorageProvider] NVARCHAR(50) NOT NULL CONSTRAINT DF_Doc_Documents_Provider DEFAULT 'LocalFileSystem',
        [StoragePath] NVARCHAR(500) NOT NULL,
        [OriginalFileName] NVARCHAR(250) NOT NULL,
        [ContentType] NVARCHAR(100) NOT NULL,
        [FileSizeBytes] BIGINT NOT NULL,
        [Sha256Checksum] NVARCHAR(64) NOT NULL,
        [IsEncrypted] BIT NOT NULL CONSTRAINT DF_Doc_Documents_IsEncrypted DEFAULT 0,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Doc_Documents_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Doc_Documents_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Doc_Documents_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Doc_Documents] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Doc_Documents_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Doc_Documents_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Doc_Documents_Owner] ON [dbo].[Doc_Documents] ([OwnerUserId]);
    CREATE NONCLUSTERED INDEX [IX_Doc_Documents_LegalEntity] ON [dbo].[Doc_Documents] ([LegalEntityId]);
    CREATE NONCLUSTERED INDEX [IX_Doc_Documents_Party] ON [dbo].[Doc_Documents] ([PartyId]) WHERE [PartyId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Doc_Documents_Classification] ON [dbo].[Doc_Documents] ([DataClassification]);
END;
GO

-- 6. BUSINESS WORKFLOW & APPROVAL STATE FOUNDATION
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Wf_Definitions' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Wf_Definitions] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Wf_Definitions_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [EntityType] NVARCHAR(100) NOT NULL,
        [InitialState] NVARCHAR(50) NOT NULL,
        [DefinitionJson] NVARCHAR(MAX) NOT NULL, -- State machine configuration & steps
        [IsActive] BIT NOT NULL CONSTRAINT DF_Wf_Definitions_IsActive DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Wf_Definitions_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Wf_Definitions] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Wf_Definitions_Code] UNIQUE NONCLUSTERED ([Code])
    );
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Wf_Instances' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Wf_Instances] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Wf_Instances_Id DEFAULT NEWSEQUENTIALID(),
        [DefinitionId] UNIQUEIDENTIFIER NOT NULL,
        [LegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [EntityId] NVARCHAR(100) NOT NULL,
        [CurrentState] NVARCHAR(50) NOT NULL,
        [RequesterUserId] UNIQUEIDENTIFIER NOT NULL,
        [AssignedUserGroupId] UNIQUEIDENTIFIER NULL,
        [AssignedUserId] UNIQUEIDENTIFIER NULL,
        [StartedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Wf_Instances_StartedAtUtc DEFAULT SYSUTCDATETIME(),
        [CompletedAtUtc] DATETIME2(7) NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Wf_Instances_Status DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
        CONSTRAINT [PK_Wf_Instances] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Wf_Instances_Definition] FOREIGN KEY ([DefinitionId]) REFERENCES [dbo].[Wf_Definitions] ([Id]),
        CONSTRAINT [FK_Wf_Instances_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Wf_Instances_Entity] ON [dbo].[Wf_Instances] ([EntityId], [DefinitionId]);
    CREATE NONCLUSTERED INDEX [IX_Wf_Instances_Status] ON [dbo].[Wf_Instances] ([Status], [LegalEntityId]);
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Wf_History' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Wf_History] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Wf_History_Id DEFAULT NEWSEQUENTIALID(),
        [InstanceId] UNIQUEIDENTIFIER NOT NULL,
        [Action] NVARCHAR(50) NOT NULL, -- Submit, Approve, Reject, Delegate, RequestChange, Cancel
        [FromState] NVARCHAR(50) NOT NULL,
        [ToState] NVARCHAR(50) NOT NULL,
        [ActorUserId] UNIQUEIDENTIFIER NOT NULL,
        [Comments] NVARCHAR(1000) NULL,
        [OccurredAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Wf_History_OccurredAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Wf_History] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Wf_History_Instance] FOREIGN KEY ([InstanceId]) REFERENCES [dbo].[Wf_Instances] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Wf_History_Instance] ON [dbo].[Wf_History] ([InstanceId], [OccurredAtUtc]);
END;
GO

