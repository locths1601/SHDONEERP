using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;
using ShdOneErp.Domain.Events;

namespace ShdOneErp.Domain.Entities.System;

public class WorkflowDefinition : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public int Version { get; private set; } = 1;
    public string InitialState { get; private set; } = string.Empty;
    public string DefinitionJson { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    public ICollection<WorkflowDefinitionVersion> Versions { get; private set; } = new List<WorkflowDefinitionVersion>();
    public ICollection<WorkflowInstance> Instances { get; private set; } = new List<WorkflowInstance>();

    private WorkflowDefinition() { }

    public WorkflowDefinition(
        string code,
        string name,
        string entityType,
        string initialState,
        string definitionJson,
        string? description = null,
        int version = 1)
    {
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        EntityType = entityType.Trim();
        InitialState = initialState.Trim();
        DefinitionJson = definitionJson;
        Description = description?.Trim();
        Version = version > 0 ? version : 1;
        IsActive = true;
    }

    public void UpdateDefinition(string name, string? description, string definitionJson, int newVersion)
    {
        Name = name.Trim();
        Description = description?.Trim();
        DefinitionJson = definitionJson;
        Version = newVersion;
        MarkUpdated();
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        MarkUpdated();
    }
}

public class WorkflowDefinitionVersion
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid DefinitionId { get; private set; }
    public WorkflowDefinition? Definition { get; private set; }

    public int Version { get; private set; } = 1;
    public string InitialState { get; private set; } = string.Empty;
    public string DefinitionJson { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Published"; // Draft, Published, Deprecated
    public DateTime PublishedAtUtc { get; private set; } = DateTime.UtcNow;
    public Guid? CreatedByUserId { get; private set; }

    private WorkflowDefinitionVersion() { }

    public WorkflowDefinitionVersion(
        Guid definitionId,
        int version,
        string initialState,
        string definitionJson,
        string status = "Published",
        Guid? createdByUserId = null)
    {
        DefinitionId = definitionId;
        Version = version > 0 ? version : 1;
        InitialState = initialState.Trim();
        DefinitionJson = definitionJson;
        Status = status;
        PublishedAtUtc = DateTime.UtcNow;
        CreatedByUserId = createdByUserId;
    }
}

public class WorkflowInstance : BaseEntity
{
    public Guid DefinitionId { get; private set; }
    public WorkflowDefinition? Definition { get; private set; }

    public int DefinitionVersion { get; private set; } = 1;
    public Guid LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }

    public Guid? BusinessUnitId { get; private set; }
    public BusinessUnit? BusinessUnit { get; private set; }

    public string EntityType { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public string CurrentState { get; private set; } = string.Empty;
    public Guid RequesterUserId { get; private set; }
    public Guid? AssignedUserGroupId { get; private set; }
    public Guid? AssignedUserId { get; private set; }

    public string? PayloadJson { get; private set; }
    public DateTime StartedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; private set; }
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Pending;

    public ICollection<WorkflowHistory> History { get; private set; } = new List<WorkflowHistory>();

    private WorkflowInstance() { }

    public WorkflowInstance(
        Guid definitionId,
        int definitionVersion,
        Guid legalEntityId,
        string entityType,
        string entityId,
        string initialState,
        Guid requesterUserId,
        string? payloadJson = null,
        Guid? assignedUserGroupId = null,
        Guid? assignedUserId = null,
        string workflowCode = "",
        Guid? businessUnitId = null)
    {
        DefinitionId = definitionId;
        DefinitionVersion = definitionVersion > 0 ? definitionVersion : 1;
        LegalEntityId = legalEntityId;
        BusinessUnitId = businessUnitId;
        EntityType = entityType.Trim();
        EntityId = entityId.Trim();
        CurrentState = initialState.Trim();
        RequesterUserId = requesterUserId;
        PayloadJson = payloadJson;
        AssignedUserGroupId = assignedUserGroupId;
        AssignedUserId = assignedUserId;
        Status = WorkflowStatus.Pending;
        StartedAtUtc = DateTime.UtcNow;

        // Bắn domain event khởi tạo instance
        AddDomainEvent(new WorkflowStartedDomainEvent(
            Id,
            workflowCode,
            legalEntityId,
            entityType,
            entityId,
            initialState,
            requesterUserId,
            payloadJson));
    }

    public void TransitionTo(
        string newState,
        WorkflowStatus status,
        Guid actorUserId,
        string action,
        Guid? nextAssignedUserGroupId = null,
        Guid? nextAssignedUserId = null,
        string? comments = null,
        string? updatedPayloadJson = null,
        string workflowCode = "")
    {
        var oldState = CurrentState;
        CurrentState = newState.Trim();
        Status = status;
        AssignedUserGroupId = nextAssignedUserGroupId;
        AssignedUserId = nextAssignedUserId;
        if (!string.IsNullOrWhiteSpace(updatedPayloadJson))
        {
            PayloadJson = updatedPayloadJson;
        }

        MarkUpdated();

        var isCompleted = status == WorkflowStatus.Approved || status == WorkflowStatus.Rejected || status == WorkflowStatus.Cancelled;
        if (isCompleted)
        {
            CompletedAtUtc = DateTime.UtcNow;
        }

        // Bắn Domain Event tương ứng
        AddDomainEvent(new WorkflowTransitionedDomainEvent(
            Id,
            workflowCode,
            LegalEntityId,
            EntityType,
            EntityId,
            oldState,
            newState,
            action,
            actorUserId,
            status,
            comments));

        if (isCompleted)
        {
            AddDomainEvent(new WorkflowCompletedDomainEvent(
                Id,
                workflowCode,
                LegalEntityId,
                EntityType,
                EntityId,
                newState,
                status,
                actorUserId));
        }
    }

    public void Cancel(Guid actorUserId, string? reason = null, string workflowCode = "")
    {
        var oldState = CurrentState;
        CurrentState = "Cancelled";
        Status = WorkflowStatus.Cancelled;
        CompletedAtUtc = DateTime.UtcNow;
        MarkUpdated();

        AddDomainEvent(new WorkflowCancelledDomainEvent(
            Id,
            workflowCode,
            LegalEntityId,
            EntityType,
            EntityId,
            oldState,
            actorUserId,
            reason));
    }
}

public class WorkflowTransitionHistory
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid InstanceId { get; private set; }
    public WorkflowInstance? Instance { get; private set; }

    public string Action { get; private set; } = string.Empty; // Submit, Approve, Reject, Delegate, Cancel
    public string FromState { get; private set; } = string.Empty;
    public string ToState { get; private set; } = string.Empty;
    public Guid ActorUserId { get; private set; }
    public string? Comments { get; private set; }
    public string? PayloadJson { get; private set; }
    public DateTime OccurredAtUtc { get; private set; } = DateTime.UtcNow;

    protected WorkflowTransitionHistory() { }

    public WorkflowTransitionHistory(
        Guid instanceId,
        string action,
        string fromState,
        string toState,
        Guid actorUserId,
        string? comments = null,
        string? payloadJson = null)
    {
        InstanceId = instanceId;
        Action = action.Trim();
        FromState = fromState.Trim();
        ToState = toState.Trim();
        ActorUserId = actorUserId;
        Comments = comments?.Trim();
        PayloadJson = payloadJson;
        OccurredAtUtc = DateTime.UtcNow;
    }
}

// Lớp tương thích ngược giữ nguyên cấu trúc Wf_History
public class WorkflowHistory : WorkflowTransitionHistory
{
    private WorkflowHistory() : base() { }

    public WorkflowHistory(
        Guid instanceId,
        string action,
        string fromState,
        string toState,
        Guid actorUserId,
        string? comments = null,
        string? payloadJson = null)
        : base(instanceId, action, fromState, toState, actorUserId, comments, payloadJson)
    {
    }
}
