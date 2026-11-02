using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.Workflow.DTOs;
using ShdOneErp.Application.Modules.Workflow.Services;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Domain.Enums;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Workflow;

public class WorkflowExecutionServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;

    private const string SampleSchemaJson = @"{
        ""version"": 1,
        ""initialState"": ""Draft"",
        ""states"": [
            { ""code"": ""Draft"", ""name"": ""Bản nháp"", ""stateType"": 1 },
            { ""code"": ""Review"", ""name"": ""Thẩm định"", ""stateType"": 2 },
            { ""code"": ""Approved"", ""name"": ""Đã duyệt"", ""stateType"": 3 },
            { ""code"": ""Rejected"", ""name"": ""Từ chối"", ""stateType"": 4 }
        ],
        ""transitions"": [
            { ""id"": ""t1"", ""fromState"": ""Draft"", ""toState"": ""Review"", ""action"": ""Submit"", ""targetStatus"": 1 },
            { ""id"": ""t2"", ""fromState"": ""Review"", ""toState"": ""Approved"", ""action"": ""Approve"", ""targetStatus"": 2, ""requiredPermission"": ""wf.test.approve"" },
            { ""id"": ""t3"", ""fromState"": ""Review"", ""toState"": ""Rejected"", ""action"": ""Reject"", ""targetStatus"": 3, ""requiresComment"": true }
        ]
    }";

    public WorkflowExecutionServiceTests()
    {
        _currentUserMock = new Mock<ICurrentUser>();
        _permissionResolverMock = new Mock<IPermissionResolver>();
    }

    private ShdOneErpDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShdOneErpDbContext(options);
    }

    private WorkflowDefinition SeedWorkflowDefinition(ShdOneErpDbContext context)
    {
        var def = new WorkflowDefinition(
            code: "SAMPLE_APPROVAL",
            name: "Quy trình thử nghiệm",
            entityType: "SampleEntity",
            initialState: "Draft",
            definitionJson: SampleSchemaJson,
            description: "Mô tả quy trình",
            version: 1);

        context.WorkflowDefinitions.Add(def);
        context.SaveChanges();
        return def;
    }

    [Fact]
    public async Task StartAsync_WhenDefinitionExists_CreatesInstanceAndHistory()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-001",
            PayloadJson = "{\"amount\": 1000}"
        };

        var result = await service.StartAsync(request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var instance = await context.WorkflowInstances.Include(i => i.History).FirstOrDefaultAsync(i => i.Id == result.Data);
        instance.Should().NotBeNull();
        instance!.CurrentState.Should().Be("Draft");
        instance.Status.Should().Be(WorkflowStatus.Pending);
        instance.RequesterUserId.Should().Be(requesterId);

        // Lịch sử khởi tạo
        var history = await context.WorkflowHistories.FirstOrDefaultAsync(h => h.InstanceId == instance.Id);
        history.Should().NotBeNull();
        history!.Action.Should().Be("Submit");
        history.ToState.Should().Be("Draft");
    }

    [Fact]
    public async Task StartAsync_WhenDuplicatePendingInstance_ReturnsFailure()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-DUPLICATE",
        };

        var firstResult = await service.StartAsync(request);
        firstResult.Success.Should().BeTrue();

        // Gửi tiếp lần 2 cùng EntityId khi instance 1 vẫn đang Pending
        var secondResult = await service.StartAsync(request);
        secondResult.Success.Should().BeFalse();
        secondResult.ErrorCode.Should().Be("WORKFLOW_ALREADY_IN_PROGRESS");
    }

    [Fact]
    public async Task ExecuteActionAsync_ValidTransition_UpdatesStateAndStatus()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        // 1. Tạo instance ở Draft
        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-100"
        });

        // 2. Chuyển sang Review
        var submitResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Submit"
        });
        submitResult.Success.Should().BeTrue();

        var instanceAfterSubmit = await context.WorkflowInstances.FindAsync(startResult.Data);
        instanceAfterSubmit!.CurrentState.Should().Be("Review");

        // 3. Phê duyệt (Action: Approve -> Approved)
        _currentUserMock.Setup(u => u.UserId).Returns(reviewerId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true); // Có quyền admin duyệt

        var approveResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Approve"
        });

        approveResult.Success.Should().BeTrue();

        var finalInstance = await context.WorkflowInstances.FindAsync(startResult.Data);
        finalInstance!.CurrentState.Should().Be("Approved");
        finalInstance.Status.Should().Be(WorkflowStatus.Approved);
        finalInstance.CompletedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteActionAsync_InvalidAction_ReturnsInvalidTransition()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-200"
        });

        // Đang ở Draft mà cố tình Approve (hành động không có trong transitions từ Draft)
        var invalidResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Approve"
        });

        invalidResult.Success.Should().BeFalse();
        invalidResult.ErrorCode.Should().Be("INVALID_TRANSITION");
    }

    [Fact]
    public async Task ExecuteActionAsync_MissingRequiredPermission_ReturnsUnauthorized()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        var unauthorizedUserId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-300"
        });

        // Chuyển sang Review
        await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest { Action = "Submit" });

        // User thường không có permission "wf.test.approve"
        _currentUserMock.Setup(u => u.UserId).Returns(unauthorizedUserId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(false);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(unauthorizedUserId, "wf.test.approve", It.IsAny<Guid?>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var approveResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Approve"
        });

        approveResult.Success.Should().BeFalse();
        approveResult.ErrorCode.Should().Be("UNAUTHORIZED_TRANSITION");
    }

    [Fact]
    public async Task ExecuteActionAsync_CommentRequired_WhenEmpty_ReturnsFailure()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-400"
        });

        // Chuyển sang Review
        await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest { Action = "Submit" });

        // Action Reject yêu cầu comment
        var rejectResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Reject",
            Comments = "   " // Rỗng
        });

        rejectResult.Success.Should().BeFalse();
        rejectResult.ErrorCode.Should().Be("COMMENT_REQUIRED");
    }

    [Fact]
    public async Task CancelAsync_ByRequester_CancelsInstance()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-500"
        });

        var cancelResult = await service.CancelAsync(startResult.Data, new CancelWorkflowRequest
        {
            Reason = "Không còn nhu cầu phê duyệt"
        });

        cancelResult.Success.Should().BeTrue();

        var instance = await context.WorkflowInstances.FindAsync(startResult.Data);
        instance!.CurrentState.Should().Be("Cancelled");
        instance.Status.Should().Be(WorkflowStatus.Cancelled);
        instance.CompletedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteActionAsync_WhenTransitionRejected_DoesNotAlterInstanceOrHistoryData()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-INVARIANT-TEST",
            PayloadJson = "{\"status\": \"original\"}"
        });

        startResult.Success.Should().BeTrue();

        var historyCountBefore = await context.WorkflowHistories.CountAsync(h => h.InstanceId == startResult.Data);
        historyCountBefore.Should().Be(1);

        // Cố tình thực thi hành động không hợp lệ từ "Draft"
        var invalidResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "InvalidAction",
            Comments = "Nên bị từ chối"
        });

        invalidResult.Success.Should().BeFalse();

        // Kiểm tra Invariant: Dữ liệu Instance và History hoàn toàn KHÔNG bị thay đổi
        var instanceAfter = await context.WorkflowInstances.FindAsync(startResult.Data);
        instanceAfter!.CurrentState.Should().Be("Draft");
        instanceAfter.Status.Should().Be(WorkflowStatus.Pending);
        instanceAfter.PayloadJson.Should().Be("{\"status\": \"original\"}");

        var historyCountAfter = await context.WorkflowHistories.CountAsync(h => h.InstanceId == startResult.Data);
        historyCountAfter.Should().Be(1, "không được ghi thêm bản ghi lịch sử khi chuyển trạng thái thất bại");
    }

    [Fact]
    public async Task ExecuteActionAsync_WithBusinessUnitScope_EnforcesScopedPermissionCheck()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();
        var legalEntityId = Guid.NewGuid();
        var businessUnitId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = legalEntityId,
            BusinessUnitId = businessUnitId,
            EntityType = "SampleEntity",
            EntityId = "ENT-SCOPE-TEST"
        });

        startResult.Success.Should().BeTrue();

        // Chuyển sang Review
        await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest { Action = "Submit" });

        // Reviewer thực hiện Approve (yêu cầu quyền wf.test.approve trong BusinessUnit cụ thể)
        _currentUserMock.Setup(u => u.UserId).Returns(reviewerId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(false);

        _permissionResolverMock.Setup(p => p.HasPermissionAsync(
                reviewerId,
                "wf.test.approve",
                legalEntityId,
                businessUnitId,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var approveResult = await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Approve"
        });

        approveResult.Success.Should().BeTrue();

        _permissionResolverMock.Verify(p => p.HasPermissionAsync(
            reviewerId,
            "wf.test.approve",
            legalEntityId,
            businessUnitId,
            null,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task WorkflowDefinition_VersionTracking_PreservedInInstance()
    {
        using var context = CreateInMemoryDbContext();
        var defV2 = new WorkflowDefinition(
            code: "VERSIONED_FLOW",
            name: "Quy trình phiên bản 2",
            entityType: "Document",
            initialState: "Draft",
            definitionJson: SampleSchemaJson,
            description: "Phiên bản nâng cấp",
            version: 2);

        context.WorkflowDefinitions.Add(defV2);
        await context.SaveChangesAsync();

        var requesterId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "VERSIONED_FLOW",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "Document",
            EntityId = "DOC-V2-001"
        });

        startResult.Success.Should().BeTrue();

        var instance = await context.WorkflowInstances.FindAsync(startResult.Data);
        instance!.DefinitionVersion.Should().Be(2);
    }

    [Fact]
    public async Task TransitionHistory_CapturesImmutableAuditTrail()
    {
        using var context = CreateInMemoryDbContext();
        var def = SeedWorkflowDefinition(context);
        var requesterId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.UserId).Returns(requesterId);

        var service = new WorkflowExecutionService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var startResult = await service.StartAsync(new StartWorkflowRequest
        {
            WorkflowCode = "SAMPLE_APPROVAL",
            LegalEntityId = Guid.NewGuid(),
            EntityType = "SampleEntity",
            EntityId = "ENT-AUDIT-TEST"
        });

        // Chuyển sang Review
        await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Submit",
            Comments = "Nộp thẩm định hồ sơ"
        });

        // Duyệt
        _currentUserMock.Setup(u => u.UserId).Returns(reviewerId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        await service.ExecuteActionAsync(startResult.Data, new ExecuteWorkflowActionRequest
        {
            Action = "Approve",
            Comments = "Hồ sơ đạt tiêu chuẩn phê duyệt"
        });

        var histories = await context.WorkflowHistories
            .Where(h => h.InstanceId == startResult.Data)
            .OrderBy(h => h.OccurredAtUtc)
            .ToListAsync();

        histories.Should().HaveCount(3);

        // Bản ghi 1: Khởi tạo
        histories[0].Action.Should().Be("Submit");
        histories[0].FromState.Should().BeEmpty();
        histories[0].ToState.Should().Be("Draft");
        histories[0].ActorUserId.Should().Be(requesterId);

        // Bản ghi 2: Nộp Review
        histories[1].Action.Should().Be("Submit");
        histories[1].FromState.Should().Be("Draft");
        histories[1].ToState.Should().Be("Review");
        histories[1].Comments.Should().Be("Nộp thẩm định hồ sơ");

        // Bản ghi 3: Phê duyệt
        histories[2].Action.Should().Be("Approve");
        histories[2].FromState.Should().Be("Review");
        histories[2].ToState.Should().Be("Approved");
        histories[2].ActorUserId.Should().Be(reviewerId);
        histories[2].Comments.Should().Be("Hồ sơ đạt tiêu chuẩn phê duyệt");
    }
}

