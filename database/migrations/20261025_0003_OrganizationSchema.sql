-- =========================================================================
-- Migration: 20261025_0003_OrganizationSchema.sql
-- Description: Schema quản lý cơ cấu tổ chức (Legal Entities, Business Units, Branches)
-- =========================================================================

-- 1. Bảng LegalEntities (Pháp nhân)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Org_LegalEntities')
BEGIN
    CREATE TABLE [dbo].[Org_LegalEntities] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Org_LegalEntities_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [TradingName] NVARCHAR(200) NULL,
        [TaxCode] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [PhoneNumber] NVARCHAR(50) NULL,
        [Email] NVARCHAR(100) NULL,
        [Website] NVARCHAR(150) NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Org_LegalEntities_Status DEFAULT 'Active', -- Active, Inactive, UnderLiquidation
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Org_LegalEntities_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Org_LegalEntities_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Org_LegalEntities] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Org_LegalEntities_Code] ON [dbo].[Org_LegalEntities] ([Code]) WHERE [IsDeleted] = 0;
    CREATE NONCLUSTERED INDEX [IX_Org_LegalEntities_Status] ON [dbo].[Org_LegalEntities] ([Status]) WHERE [IsDeleted] = 0;
END;
GO

-- 2. Bảng BusinessUnits (Đơn vị kinh doanh)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Org_BusinessUnits')
BEGIN
    CREATE TABLE [dbo].[Org_BusinessUnits] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Org_BusinessUnits_Id DEFAULT NEWSEQUENTIALID(),
        [LegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Org_BusinessUnits_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Org_BusinessUnits_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Org_BusinessUnits_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Org_BusinessUnits] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_BusinessUnits_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id])
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Org_BusinessUnits_Code_Entity] ON [dbo].[Org_BusinessUnits] ([LegalEntityId], [Code]) WHERE [IsDeleted] = 0;
    CREATE NONCLUSTERED INDEX [IX_Org_BusinessUnits_LegalEntityId] ON [dbo].[Org_BusinessUnits] ([LegalEntityId]);
END;
GO

-- 3. Bảng Branches (Chi nhánh / Cơ sở đào tạo)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Org_Branches')
BEGIN
    CREATE TABLE [dbo].[Org_Branches] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Org_Branches_Id DEFAULT NEWSEQUENTIALID(),
        [LegalEntityId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessUnitId] UNIQUEIDENTIFIER NULL,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Address] NVARCHAR(500) NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Org_Branches_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Org_Branches_IsDeleted DEFAULT 0,
        [DeletedAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Org_Branches_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Org_Branches] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Branches_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id]),
        CONSTRAINT [FK_Branches_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id])
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Org_Branches_Code_Entity] ON [dbo].[Org_Branches] ([LegalEntityId], [Code]) WHERE [IsDeleted] = 0;
    CREATE NONCLUSTERED INDEX [IX_Org_Branches_LegalEntityId] ON [dbo].[Org_Branches] ([LegalEntityId]);
    CREATE NONCLUSTERED INDEX [IX_Org_Branches_BusinessUnitId] ON [dbo].[Org_Branches] ([BusinessUnitId]);
END;
GO
