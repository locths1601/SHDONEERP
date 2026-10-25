-- =========================================================================
-- Migration: 20261025_0004_Party360Schema.sql
-- Description: Schema nền tảng định danh khách hàng chung (Party 360 Foundation)
-- =========================================================================

-- 1. Bảng gốc Parties
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_Parties')
BEGIN
    CREATE TABLE [dbo].[Party_Parties] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Party_Parties_Id DEFAULT NEWSEQUENTIALID(),
        [PartyType] NVARCHAR(20) NOT NULL, -- Person, Organization
        [Code] NVARCHAR(50) NOT NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Party_Parties_Status DEFAULT 'Active',
        [IsDeleted] BIT NOT NULL CONSTRAINT DF_Party_Parties_IsDeleted DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Party_Parties_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Party_Parties] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Party_Parties_Code] ON [dbo].[Party_Parties] ([Code]) WHERE [IsDeleted] = 0;
END;
GO

-- 2. Bảng Persons (Cá nhân / Học viên / Phụ huynh)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_Persons')
BEGIN
    CREATE TABLE [dbo].[Party_Persons] (
        [PartyId] UNIQUEIDENTIFIER NOT NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [DateOfBirth] DATE NULL,
        [Gender] NVARCHAR(10) NULL, -- Male, Female, Other
        [Nationality] NVARCHAR(50) NULL,
        CONSTRAINT [PK_Party_Persons] PRIMARY KEY CLUSTERED ([PartyId] ASC),
        CONSTRAINT [FK_Persons_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id]) ON DELETE CASCADE
    );
END;
GO

-- 3. Bảng OrganizationParties (Tổ chức / Trường đối tác / Doanh nghiệp tuyển dụng)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_OrganizationParties')
BEGIN
    CREATE TABLE [dbo].[Party_OrganizationParties] (
        [PartyId] UNIQUEIDENTIFIER NOT NULL,
        [CompanyName] NVARCHAR(200) NOT NULL,
        [TradingName] NVARCHAR(200) NULL,
        [TaxId] NVARCHAR(50) NULL,
        [RegistrationNumber] NVARCHAR(50) NULL,
        CONSTRAINT [PK_Party_OrganizationParties] PRIMARY KEY CLUSTERED ([PartyId] ASC),
        CONSTRAINT [FK_OrganizationParties_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id]) ON DELETE CASCADE
    );
END;
GO

-- 4. Bảng PartyRoles (Vai trò của Party)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_PartyRoles')
BEGIN
    CREATE TABLE [dbo].[Party_PartyRoles] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Party_PartyRoles_Id DEFAULT NEWSEQUENTIALID(),
        [PartyId] UNIQUEIDENTIFIER NOT NULL,
        [RoleType] NVARCHAR(50) NOT NULL, -- Student, Parent, PartnerSchool, Agency, Vendor
        [LegalEntityId] UNIQUEIDENTIFIER NULL,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Party_PartyRoles_IsActive DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Party_PartyRoles_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Party_PartyRoles] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_PartyRoles_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PartyRoles_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [dbo].[Org_LegalEntities] ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_PartyRoles_PartyId] ON [dbo].[Party_PartyRoles] ([PartyId]);
    CREATE NONCLUSTERED INDEX [IX_PartyRoles_RoleType] ON [dbo].[Party_PartyRoles] ([RoleType]);
END;
GO

-- 5. Bảng PartyContactMethods (Phương thức liên hệ)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_PartyContactMethods')
BEGIN
    CREATE TABLE [dbo].[Party_PartyContactMethods] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Party_PartyContactMethods_Id DEFAULT NEWSEQUENTIALID(),
        [PartyId] UNIQUEIDENTIFIER NOT NULL,
        [ContactType] NVARCHAR(30) NOT NULL, -- Email, Phone, Address, Zalo
        [Value] NVARCHAR(250) NOT NULL,
        [IsPrimary] BIT NOT NULL CONSTRAINT DF_Party_PartyContactMethods_IsPrimary DEFAULT 0,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Party_PartyContactMethods_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Party_PartyContactMethods] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_PartyContactMethods_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_PartyContactMethods_PartyId] ON [dbo].[Party_PartyContactMethods] ([PartyId]);
    CREATE NONCLUSTERED INDEX [IX_PartyContactMethods_Value] ON [dbo].[Party_PartyContactMethods] ([Value]);
END;
GO

-- 6. Bảng PartyIdentifications (Định danh CCCD/Hộ chiếu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Party_PartyIdentifications')
BEGIN
    CREATE TABLE [dbo].[Party_PartyIdentifications] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Party_PartyIdentifications_Id DEFAULT NEWSEQUENTIALID(),
        [PartyId] UNIQUEIDENTIFIER NOT NULL,
        [IdentificationType] NVARCHAR(50) NOT NULL, -- CitizenId, Passport
        [IdentificationNumber] NVARCHAR(100) NOT NULL,
        [IssueDate] DATE NULL,
        [ExpiryDate] DATE NULL,
        [IssuingAuthority] NVARCHAR(200) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Party_PartyIdentifications_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Party_PartyIdentifications] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_PartyIdentifications_Party] FOREIGN KEY ([PartyId]) REFERENCES [dbo].[Party_Parties] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_PartyIdentifications_PartyId] ON [dbo].[Party_PartyIdentifications] ([PartyId]);
    CREATE NONCLUSTERED INDEX [IX_PartyIdentifications_Number] ON [dbo].[Party_PartyIdentifications] ([IdentificationNumber]);
END;
GO
