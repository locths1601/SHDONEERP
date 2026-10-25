-- =========================================================================
-- Migration: 20261025_0001_InitialMigrationHistory.sql
-- Description: Tạo bảng theo dõi lịch sử migration và các bảng hệ thống cơ bản
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__DbMigrationHistory' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[__DbMigrationHistory] (
        [MigrationId] NVARCHAR(150) NOT NULL,
        [MigrationName] NVARCHAR(250) NOT NULL,
        [AppliedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_DbMigrationHistory_AppliedAtUtc DEFAULT SYSUTCDATETIME(),
        [Checksum] NVARCHAR(64) NOT NULL,
        [ExecutionTimeMs] INT NOT NULL,
        [AppliedBy] NVARCHAR(100) NOT NULL CONSTRAINT DF_DbMigrationHistory_AppliedBy DEFAULT SUSER_SNAME(),
        CONSTRAINT [PK___DbMigrationHistory] PRIMARY KEY CLUSTERED ([MigrationId] ASC)
    );
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemAuditLogs' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[SystemAuditLogs] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_SystemAuditLogs_Id DEFAULT NEWSEQUENTIALID(),
        [UserId] UNIQUEIDENTIFIER NULL,
        [UserName] NVARCHAR(100) NULL,
        [Action] NVARCHAR(100) NOT NULL,
        [Resource] NVARCHAR(100) NOT NULL,
        [EntityId] NVARCHAR(100) NULL,
        [ScopeLegalEntityId] UNIQUEIDENTIFIER NULL,
        [OldValues] NVARCHAR(MAX) NULL,
        [NewValues] NVARCHAR(MAX) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [UserAgent] NVARCHAR(250) NULL,
        [TraceId] NVARCHAR(100) NULL,
        [TimestampUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_SystemAuditLogs_Timestamp DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_SystemAuditLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_SystemAuditLogs_Timestamp] ON [dbo].[SystemAuditLogs] ([TimestampUtc] DESC);
    CREATE NONCLUSTERED INDEX [IX_SystemAuditLogs_Resource_EntityId] ON [dbo].[SystemAuditLogs] ([Resource], [EntityId]);
    CREATE NONCLUSTERED INDEX [IX_SystemAuditLogs_UserId] ON [dbo].[SystemAuditLogs] ([UserId]);
END;
GO
