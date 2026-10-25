-- =========================================================================
-- Migration: 20261025_0002_IdentityAndAuthorizationSchema.sql
-- Description: Direct GBAC v4.2 và Identity Access Management Schema
-- =========================================================================

-- 1. Bảng Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_Users')
BEGIN
    CREATE TABLE [dbo].[Identity_Users] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Identity_Users_Id DEFAULT NEWSEQUENTIALID(),
        [Username] NVARCHAR(50) NOT NULL,
        [Email] NVARCHAR(100) NOT NULL,
        [PasswordHash] NVARCHAR(256) NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [PhoneNumber] NVARCHAR(20) NULL,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Identity_Users_IsActive DEFAULT 1,
        [MustChangePassword] BIT NOT NULL CONSTRAINT DF_Identity_Users_MustChange DEFAULT 0,
        [LastLoginAtUtc] DATETIME2(7) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_Users_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Identity_Users] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Identity_Users_Username] ON [dbo].[Identity_Users] ([Username]);
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Identity_Users_Email] ON [dbo].[Identity_Users] ([Email]);
END;
GO

-- 2. Bảng UserGroups
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_UserGroups')
BEGIN
    CREATE TABLE [dbo].[Identity_UserGroups] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Identity_UserGroups_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(250) NULL,
        [ScopeType] NVARCHAR(20) NOT NULL CONSTRAINT DF_Identity_UserGroups_ScopeType DEFAULT 'Global', -- Global, LegalEntity, BusinessUnit, Branch
        [IsSystem] BIT NOT NULL CONSTRAINT DF_Identity_UserGroups_IsSystem DEFAULT 0,
        [IsActive] BIT NOT NULL CONSTRAINT DF_Identity_UserGroups_IsActive DEFAULT 1,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_UserGroups_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(7) NULL,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [PK_Identity_UserGroups] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Identity_UserGroups_Code] ON [dbo].[Identity_UserGroups] ([Code]);
END;
GO

-- 3. Bảng Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_Permissions')
BEGIN
    CREATE TABLE [dbo].[Identity_Permissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Identity_Permissions_Id DEFAULT NEWSEQUENTIALID(),
        [Code] NVARCHAR(100) NOT NULL, -- canonical: module.resource.action
        [Name] NVARCHAR(150) NOT NULL,
        [Module] NVARCHAR(50) NOT NULL,
        [Description] NVARCHAR(250) NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_Permissions_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Identity_Permissions] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Identity_Permissions_Code] ON [dbo].[Identity_Permissions] ([Code]);
END;
GO

-- 4. Bảng UserGroupPermissions (Gán quyền cho nhóm)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_UserGroupPermissions')
BEGIN
    CREATE TABLE [dbo].[Identity_UserGroupPermissions] (
        [UserGroupId] UNIQUEIDENTIFIER NOT NULL,
        [PermissionId] UNIQUEIDENTIFIER NOT NULL,
        [GrantedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_UserGroupPermissions_GrantedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Identity_UserGroupPermissions] PRIMARY KEY CLUSTERED ([UserGroupId] ASC, [PermissionId] ASC),
        CONSTRAINT [FK_UserGroupPermissions_UserGroup] FOREIGN KEY ([UserGroupId]) REFERENCES [dbo].[Identity_UserGroups] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserGroupPermissions_Permission] FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Identity_Permissions] ([Id]) ON DELETE CASCADE
    );
END;
GO

-- 5. Bảng UserGroupMembers (Gán người dùng vào nhóm kèm phạm vi dữ liệu)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_UserGroupMembers')
BEGIN
    CREATE TABLE [dbo].[Identity_UserGroupMembers] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Identity_UserGroupMembers_Id DEFAULT NEWSEQUENTIALID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [UserGroupId] UNIQUEIDENTIFIER NOT NULL,
        [ScopeLegalEntityId] UNIQUEIDENTIFIER NULL,
        [ScopeBusinessUnitId] UNIQUEIDENTIFIER NULL,
        [ScopeBranchId] UNIQUEIDENTIFIER NULL,
        [AssignedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_UserGroupMembers_AssignedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_Identity_UserGroupMembers] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_UserGroupMembers_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Identity_Users] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserGroupMembers_UserGroup] FOREIGN KEY ([UserGroupId]) REFERENCES [dbo].[Identity_UserGroups] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_UserGroupMembers_UserId] ON [dbo].[Identity_UserGroupMembers] ([UserId]);
    CREATE NONCLUSTERED INDEX [IX_UserGroupMembers_UserGroupId] ON [dbo].[Identity_UserGroupMembers] ([UserGroupId]);
    CREATE NONCLUSTERED INDEX [IX_UserGroupMembers_Scope] ON [dbo].[Identity_UserGroupMembers] ([ScopeLegalEntityId], [ScopeBusinessUnitId], [ScopeBranchId]);
END;
GO

-- 6. Bảng RefreshTokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Identity_RefreshTokens')
BEGIN
    CREATE TABLE [dbo].[Identity_RefreshTokens] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Identity_RefreshTokens_Id DEFAULT NEWSEQUENTIALID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [TokenHash] NVARCHAR(256) NOT NULL,
        [ExpiresAtUtc] DATETIME2(7) NOT NULL,
        [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Identity_RefreshTokens_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
        [RevokedAtUtc] DATETIME2(7) NULL,
        [ReplacedByTokenHash] NVARCHAR(256) NULL,
        CONSTRAINT [PK_Identity_RefreshTokens] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_RefreshTokens_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Identity_Users] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_RefreshTokens_UserId] ON [dbo].[Identity_RefreshTokens] ([UserId]);
    CREATE NONCLUSTERED INDEX [IX_RefreshTokens_TokenHash] ON [dbo].[Identity_RefreshTokens] ([TokenHash]);
END;
GO
