-- =========================================================================
-- Migration: 20261027_0013_WorkflowEngineAndOutboxEnhancement.sql
-- Description: Workflow Engine & Event Foundation Enhancements (FND-03)
--   1. Schema Enhancements for Wf_Definitions (Version, Description)
--   2. Schema Table Wf_DefinitionVersions (Immutable published versions)
--   3. Schema Enhancements for Wf_Instances (DefinitionVersion, BusinessUnitId, RowVersion, PayloadJson)
--   4. Schema Enhancements for Wf_History (PayloadJson)
--   5. Schema Enhancements for System_OutboxMessages (Status, Envelope metadata)
--   6. Schema Table System_OutboxProcessingHistory (Immutable execution attempt history)
--   7. Read-side Stored Procedures for Workflow Engine & Outbox (with Scoped Reads)
--   8. Seed Core Generic Workflow Definition (GENERIC_DOCUMENT_APPROVAL)
-- =========================================================================

-- 1. NÂNG CẤP BẢNG Wf_Definitions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Definitions]') AND name = 'Version')
BEGIN
    ALTER TABLE [dbo].[Wf_Definitions] ADD [Version] INT NOT NULL CONSTRAINT DF_Wf_Definitions_Version DEFAULT 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Definitions]') AND name = 'Description')
BEGIN
    ALTER TABLE [dbo].[Wf_Definitions] ADD [Description] NVARCHAR(500) NULL;
END;
GO

-- 2. TẠO BẢNG Wf_DefinitionVersions (Quản lý phiên bản State Machine có cấu trúc)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Wf_DefinitionVersions' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Wf_DefinitionVersions] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Wf_DefinitionVersions_Id DEFAULT NEWSEQUENTIALID(),
        [DefinitionId] UNIQUEIDENTIFIER NOT NULL,
        [Version] INT NOT NULL,
        [InitialState] NVARCHAR(50) NOT NULL,
        [DefinitionJson] NVARCHAR(MAX) NOT NULL,
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_Wf_DefinitionVersions_Status DEFAULT 'Published',
        [PublishedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Wf_DefinitionVersions_PublishedAtUtc DEFAULT SYSUTCDATETIME(),
        [CreatedByUserId] UNIQUEIDENTIFIER NULL,
        CONSTRAINT [PK_Wf_DefinitionVersions] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_Wf_DefinitionVersions_Definition] FOREIGN KEY ([DefinitionId]) REFERENCES [dbo].[Wf_Definitions] ([Id]),
        CONSTRAINT [UQ_Wf_DefinitionVersions_Def_Ver] UNIQUE NONCLUSTERED ([DefinitionId], [Version])
    );

    CREATE NONCLUSTERED INDEX [IX_Wf_DefinitionVersions_Def] ON [dbo].[Wf_DefinitionVersions] ([DefinitionId], [Version] DESC);
END;
GO

-- 3. NÂNG CẤP BẢNG Wf_Instances
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'DefinitionVersion')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [DefinitionVersion] INT NOT NULL CONSTRAINT DF_Wf_Instances_DefVersion DEFAULT 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'BusinessUnitId')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [BusinessUnitId] UNIQUEIDENTIFIER NULL;
    ALTER TABLE [dbo].[Wf_Instances] ADD CONSTRAINT [FK_Wf_Instances_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [dbo].[Org_BusinessUnits] ([Id]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'EntityType')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [EntityType] NVARCHAR(100) NOT NULL CONSTRAINT DF_Wf_Instances_EntityType DEFAULT 'Generic';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'PayloadJson')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [PayloadJson] NVARCHAR(MAX) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'CreatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [CreatedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_Wf_Instances_CreatedAtUtc DEFAULT SYSUTCDATETIME();
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'UpdatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [UpdatedAtUtc] DATETIME2(7) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_Instances]') AND name = 'RowVersion')
BEGIN
    ALTER TABLE [dbo].[Wf_Instances] ADD [RowVersion] ROWVERSION NOT NULL;
END;
GO

-- 4. NÂNG CẤP BẢNG Wf_History
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Wf_History]') AND name = 'PayloadJson')
BEGIN
    ALTER TABLE [dbo].[Wf_History] ADD [PayloadJson] NVARCHAR(MAX) NULL;
END;
GO

-- 5. NÂNG CẤP BẢNG System_OutboxMessages
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[System_OutboxMessages] ADD [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_OutboxMessages_Status DEFAULT 'Pending';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]') AND name = 'CausationId')
BEGIN
    ALTER TABLE [dbo].[System_OutboxMessages] ADD [CausationId] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]') AND name = 'AggregateType')
BEGIN
    ALTER TABLE [dbo].[System_OutboxMessages] ADD [AggregateType] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]') AND name = 'AggregateId')
BEGIN
    ALTER TABLE [dbo].[System_OutboxMessages] ADD [AggregateId] NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]') AND name = 'UserId')
BEGIN
    ALTER TABLE [dbo].[System_OutboxMessages] ADD [UserId] UNIQUEIDENTIFIER NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_System_OutboxMessages_Status' AND object_id = OBJECT_ID(N'[dbo].[System_OutboxMessages]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_System_OutboxMessages_Status]
        ON [dbo].[System_OutboxMessages] ([Status], [OccurredOnUtc])
        INCLUDE ([RetryCount]);
END;
GO

-- 6. TẠO BẢNG System_OutboxProcessingHistory (Lịch sử xử lý sự kiện bất biến)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'System_OutboxProcessingHistory' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[System_OutboxProcessingHistory] (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_System_OutboxProcessingHistory_Id DEFAULT NEWSEQUENTIALID(),
        [MessageId] UNIQUEIDENTIFIER NOT NULL,
        [ConsumerName] NVARCHAR(100) NOT NULL,
        [AttemptNumber] INT NOT NULL,
        [Status] NVARCHAR(30) NOT NULL,
        [ErrorMessage] NVARCHAR(MAX) NULL,
        [DurationMs] BIGINT NOT NULL CONSTRAINT DF_System_OutboxProcessingHistory_DurationMs DEFAULT 0,
        [ProcessedAtUtc] DATETIME2(7) NOT NULL CONSTRAINT DF_System_OutboxProcessingHistory_ProcessedAtUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_System_OutboxProcessingHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_System_OutboxProcessingHistory_Message] FOREIGN KEY ([MessageId]) REFERENCES [dbo].[System_OutboxMessages] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_System_OutboxProcessingHistory_Message] 
        ON [dbo].[System_OutboxProcessingHistory] ([MessageId], [ProcessedAtUtc]);
END;
GO

-- =========================================================================
-- 7. STORED PROCEDURES CHO WORKFLOW READ-SIDE
-- =========================================================================

-- SP 1: Phân trang danh sách Workflow Instances (Hỗ trợ LegalEntity & BusinessUnit Scope)
CREATE OR ALTER PROCEDURE [dbo].[sp_Workflow_Instance_GetPaged]
    @Page INT = 1,
    @PageSize INT = 20,
    @WorkflowCode NVARCHAR(50) = NULL,
    @LegalEntityId UNIQUEIDENTIFIER = NULL,
    @BusinessUnitId UNIQUEIDENTIFIER = NULL,
    @EntityType NVARCHAR(100) = NULL,
    @EntityId NVARCHAR(100) = NULL,
    @Status NVARCHAR(30) = NULL,
    @RequesterUserId UNIQUEIDENTIFIER = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;

    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[Wf_Instances] i WITH (NOLOCK)
    INNER JOIN [dbo].[Wf_Definitions] d WITH (NOLOCK) ON i.[DefinitionId] = d.[Id]
    WHERE (@WorkflowCode IS NULL OR d.[Code] = @WorkflowCode)
      AND (@LegalEntityId IS NULL OR i.[LegalEntityId] = @LegalEntityId)
      AND (@BusinessUnitId IS NULL OR i.[BusinessUnitId] = @BusinessUnitId)
      AND (@EntityType IS NULL OR i.[EntityType] = @EntityType)
      AND (@EntityId IS NULL OR i.[EntityId] = @EntityId)
      AND (@Status IS NULL OR i.[Status] = @Status)
      AND (@RequesterUserId IS NULL OR i.[RequesterUserId] = @RequesterUserId);

    SELECT 
        i.[Id],
        i.[DefinitionId],
        d.[Code] AS [WorkflowCode],
        d.[Name] AS [WorkflowName],
        i.[DefinitionVersion],
        i.[LegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        i.[BusinessUnitId],
        bu.[Code] AS [BusinessUnitCode],
        bu.[Name] AS [BusinessUnitName],
        i.[EntityType],
        i.[EntityId],
        i.[CurrentState],
        i.[Status],
        i.[RequesterUserId],
        uReq.[FullName] AS [RequesterName],
        i.[AssignedUserGroupId],
        ug.[Name] AS [AssignedGroupName],
        i.[AssignedUserId],
        uAss.[FullName] AS [AssignedUserName],
        i.[StartedAtUtc],
        i.[CompletedAtUtc],
        i.[PayloadJson],
        i.[RowVersion]
    FROM [dbo].[Wf_Instances] i WITH (NOLOCK)
    INNER JOIN [dbo].[Wf_Definitions] d WITH (NOLOCK) ON i.[DefinitionId] = d.[Id]
    LEFT JOIN [dbo].[Org_LegalEntities] le WITH (NOLOCK) ON i.[LegalEntityId] = le.[Id]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu WITH (NOLOCK) ON i.[BusinessUnitId] = bu.[Id]
    LEFT JOIN [dbo].[Identity_Users] uReq WITH (NOLOCK) ON i.[RequesterUserId] = uReq.[Id]
    LEFT JOIN [dbo].[Identity_UserGroups] ug WITH (NOLOCK) ON i.[AssignedUserGroupId] = ug.[Id]
    LEFT JOIN [dbo].[Identity_Users] uAss WITH (NOLOCK) ON i.[AssignedUserId] = uAss.[Id]
    WHERE (@WorkflowCode IS NULL OR d.[Code] = @WorkflowCode)
      AND (@LegalEntityId IS NULL OR i.[LegalEntityId] = @LegalEntityId)
      AND (@BusinessUnitId IS NULL OR i.[BusinessUnitId] = @BusinessUnitId)
      AND (@EntityType IS NULL OR i.[EntityType] = @EntityType)
      AND (@EntityId IS NULL OR i.[EntityId] = @EntityId)
      AND (@Status IS NULL OR i.[Status] = @Status)
      AND (@RequesterUserId IS NULL OR i.[RequesterUserId] = @RequesterUserId)
    ORDER BY i.[StartedAtUtc] DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP 2: Chi tiết 1 Workflow Instance (Kèm thông tin Scopes)
CREATE OR ALTER PROCEDURE [dbo].[sp_Workflow_Instance_GetById]
    @InstanceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        i.[Id],
        i.[DefinitionId],
        d.[Code] AS [WorkflowCode],
        d.[Name] AS [WorkflowName],
        i.[DefinitionVersion],
        i.[LegalEntityId],
        le.[Code] AS [LegalEntityCode],
        le.[Name] AS [LegalEntityName],
        i.[BusinessUnitId],
        bu.[Code] AS [BusinessUnitCode],
        bu.[Name] AS [BusinessUnitName],
        i.[EntityType],
        i.[EntityId],
        i.[CurrentState],
        i.[Status],
        i.[RequesterUserId],
        uReq.[FullName] AS [RequesterName],
        i.[AssignedUserGroupId],
        ug.[Name] AS [AssignedGroupName],
        i.[AssignedUserId],
        uAss.[FullName] AS [AssignedUserName],
        i.[StartedAtUtc],
        i.[CompletedAtUtc],
        i.[PayloadJson],
        i.[RowVersion]
    FROM [dbo].[Wf_Instances] i WITH (NOLOCK)
    INNER JOIN [dbo].[Wf_Definitions] d WITH (NOLOCK) ON i.[DefinitionId] = d.[Id]
    LEFT JOIN [dbo].[Org_LegalEntities] le WITH (NOLOCK) ON i.[LegalEntityId] = le.[Id]
    LEFT JOIN [dbo].[Org_BusinessUnits] bu WITH (NOLOCK) ON i.[BusinessUnitId] = bu.[Id]
    LEFT JOIN [dbo].[Identity_Users] uReq WITH (NOLOCK) ON i.[RequesterUserId] = uReq.[Id]
    LEFT JOIN [dbo].[Identity_UserGroups] ug WITH (NOLOCK) ON i.[AssignedUserGroupId] = ug.[Id]
    LEFT JOIN [dbo].[Identity_Users] uAss WITH (NOLOCK) ON i.[AssignedUserId] = uAss.[Id]
    WHERE i.[Id] = @InstanceId;
END;
GO

-- SP 3: Lịch sử chuyển trạng thái bất biến của 1 Instance
CREATE OR ALTER PROCEDURE [dbo].[sp_Workflow_Instance_GetHistory]
    @InstanceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        h.[Id],
        h.[InstanceId],
        h.[Action],
        h.[FromState],
        h.[ToState],
        h.[ActorUserId],
        u.[FullName] AS [ActorName],
        h.[Comments],
        h.[PayloadJson],
        h.[OccurredAtUtc]
    FROM [dbo].[Wf_History] h WITH (NOLOCK)
    LEFT JOIN [dbo].[Identity_Users] u WITH (NOLOCK) ON h.[ActorUserId] = u.[Id]
    WHERE h.[InstanceId] = @InstanceId
    ORDER BY h.[OccurredAtUtc] ASC;
END;
GO

-- SP 4: Lấy Workflow Definition active mới nhất theo mã
CREATE OR ALTER PROCEDURE [dbo].[sp_Workflow_Definition_GetByCode]
    @Code NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        d.[Id],
        d.[Code],
        d.[Name],
        d.[Description],
        d.[EntityType],
        d.[Version],
        d.[InitialState],
        d.[DefinitionJson],
        d.[IsActive],
        d.[CreatedAtUtc]
    FROM [dbo].[Wf_Definitions] d WITH (NOLOCK)
    WHERE d.[Code] = @Code AND d.[IsActive] = 1
    ORDER BY d.[Version] DESC;
END;
GO

-- SP 5: Lấy Outbox messages pending an toàn (Sử dụng UPDLOCK, READPAST)
CREATE OR ALTER PROCEDURE [dbo].[sp_System_Outbox_GetPending]
    @BatchSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF @BatchSize < 1 SET @BatchSize = 1;
    IF @BatchSize > 100 SET @BatchSize = 100;

    SELECT TOP (@BatchSize)
        [Id],
        [OccurredOnUtc],
        [EventType],
        [PayloadJson],
        [ProcessedOnUtc],
        [Error],
        [RetryCount],
        [LegalEntityId],
        [CorrelationId],
        [CausationId],
        [AggregateType],
        [AggregateId],
        [UserId],
        [Status]
    FROM [dbo].[System_OutboxMessages] WITH (UPDLOCK, READPAST)
    WHERE [Status] = 'Pending' OR ([Status] = 'Failed' AND [RetryCount] < 5)
    ORDER BY [OccurredOnUtc] ASC;
END;
GO

-- =========================================================================
-- 8. SEED WORKFLOW ĐỊNH NGHĨA GENERIC NỀN TẢNG (GENERIC_DOCUMENT_APPROVAL)
-- Lưu ý: Tuyệt đối không tạo workflow cụ thể cho CRM, Tuyển sinh, Visa, Tài chính
-- khi chưa có khảo sát và phê duyệt (Các rule nghiệp vụ chuyên ngành: TBD).
-- =========================================================================

IF NOT EXISTS (SELECT 1 FROM [dbo].[Wf_Definitions] WHERE [Code] = 'GENERIC_DOCUMENT_APPROVAL')
BEGIN
    DECLARE @GenericDefId UNIQUEIDENTIFIER = 'D1000000-0000-0000-0000-000000000001';
    DECLARE @GenericSchemaJson NVARCHAR(MAX) = N'{
        "version": 1,
        "initialState": "Draft",
        "states": [
            { "code": "Draft", "name": "Bản nháp", "stateType": 1, "description": "Văn bản hoặc chứng từ mới tạo" },
            { "code": "PendingReview", "name": "Chờ thẩm định", "stateType": 2, "description": "Hồ sơ đang chờ người có thẩm quyền xem xét" },
            { "code": "Approved", "name": "Đã phê duyệt", "stateType": 3, "description": "Hồ sơ được chấp thuận chính thức" },
            { "code": "Rejected", "name": "Bị từ chối", "stateType": 4, "description": "Hồ sơ không đáp ứng tiêu chuẩn" },
            { "code": "Cancelled", "name": "Đã hủy", "stateType": 5, "description": "Quy trình đã bị hủy bỏ bởi người nộp" }
        ],
        "transitions": [
            { "id": "t1", "fromState": "Draft", "toState": "PendingReview", "action": "Submit", "targetStatus": 1, "requiresComment": false },
            { "id": "t2", "fromState": "PendingReview", "toState": "Approved", "action": "Approve", "requiredPermission": "workflow.action", "targetStatus": 2, "requiresComment": false },
            { "id": "t3", "fromState": "PendingReview", "toState": "Rejected", "action": "Reject", "requiredPermission": "workflow.action", "targetStatus": 3, "requiresComment": true },
            { "id": "t4", "fromState": "PendingReview", "toState": "Draft", "action": "RequestChanges", "requiredPermission": "workflow.action", "targetStatus": 1, "requiresComment": true },
            { "id": "t5", "fromState": "Draft", "toState": "Cancelled", "action": "Cancel", "targetStatus": 4, "requiresComment": false },
            { "id": "t6", "fromState": "PendingReview", "toState": "Cancelled", "action": "Cancel", "targetStatus": 4, "requiresComment": true }
        ]
    }';

    INSERT INTO [dbo].[Wf_Definitions] (
        [Id], [Code], [Name], [Description], [EntityType], [Version], [InitialState], [DefinitionJson], [IsActive], [CreatedAtUtc]
    ) VALUES (
        @GenericDefId,
        'GENERIC_DOCUMENT_APPROVAL',
        N'Quy trình Phê duyệt Văn bản Dùng chung',
        N'Quy trình luân chuyển phê duyệt chứng từ & văn bản mẫu dùng chung cho toàn hệ thống ERP',
        'GenericDocument',
        1,
        'Draft',
        @GenericSchemaJson,
        1,
        SYSUTCDATETIME()
    );

    -- Seed Version đầu tiên vào Wf_DefinitionVersions
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Wf_DefinitionVersions] WHERE [DefinitionId] = @GenericDefId AND [Version] = 1)
    INSERT INTO [dbo].[Wf_DefinitionVersions] (
        [Id], [DefinitionId], [Version], [InitialState], [DefinitionJson], [Status], [PublishedAtUtc]
    ) VALUES (
        NEWID(),
        @GenericDefId,
        1,
        'Draft',
        @GenericSchemaJson,
        'Published',
        SYSUTCDATETIME()
    );
END;
GO
