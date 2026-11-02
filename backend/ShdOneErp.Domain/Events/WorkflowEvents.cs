using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Events;

public class WorkflowStartedDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;

    public Guid InstanceId { get; }
    public string WorkflowCode { get; }
    public Guid LegalEntityId { get; }
    public string EntityType { get; }
    public string EntityId { get; }
    public string InitialState { get; }
    public Guid RequesterUserId { get; }
    public string? ContextJson { get; }

    public WorkflowStartedDomainEvent(
        Guid instanceId,
        string workflowCode,
        Guid legalEntityId,
        string entityType,
        string entityId,
        string initialState,
        Guid requesterUserId,
        string? contextJson = null)
    {
        InstanceId = instanceId;
        WorkflowCode = workflowCode;
        LegalEntityId = legalEntityId;
        EntityType = entityType;
        EntityId = entityId;
        InitialState = initialState;
        RequesterUserId = requesterUserId;
        ContextJson = contextJson;
    }
}

public class WorkflowTransitionedDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;

    public Guid InstanceId { get; }
    public string WorkflowCode { get; }
    public Guid LegalEntityId { get; }
    public string EntityType { get; }
    public string EntityId { get; }
    public string FromState { get; }
    public string ToState { get; }
    public string Action { get; }
    public Guid ActorUserId { get; }
    public WorkflowStatus Status { get; }
    public string? Comments { get; }

    public WorkflowTransitionedDomainEvent(
        Guid instanceId,
        string workflowCode,
        Guid legalEntityId,
        string entityType,
        string entityId,
        string fromState,
        string toState,
        string action,
        Guid actorUserId,
        WorkflowStatus status,
        string? comments = null)
    {
        InstanceId = instanceId;
        WorkflowCode = workflowCode;
        LegalEntityId = legalEntityId;
        EntityType = entityType;
        EntityId = entityId;
        FromState = fromState;
        ToState = toState;
        Action = action;
        ActorUserId = actorUserId;
        Status = status;
        Comments = comments;
    }
}

public class WorkflowCompletedDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;

    public Guid InstanceId { get; }
    public string WorkflowCode { get; }
    public Guid LegalEntityId { get; }
    public string EntityType { get; }
    public string EntityId { get; }
    public string FinalState { get; }
    public WorkflowStatus FinalStatus { get; }
    public Guid CompletedByUserId { get; }

    public WorkflowCompletedDomainEvent(
        Guid instanceId,
        string workflowCode,
        Guid legalEntityId,
        string entityType,
        string entityId,
        string finalState,
        WorkflowStatus finalStatus,
        Guid completedByUserId)
    {
        InstanceId = instanceId;
        WorkflowCode = workflowCode;
        LegalEntityId = legalEntityId;
        EntityType = entityType;
        EntityId = entityId;
        FinalState = finalState;
        FinalStatus = finalStatus;
        CompletedByUserId = completedByUserId;
    }
}

public class WorkflowCancelledDomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;

    public Guid InstanceId { get; }
    public string WorkflowCode { get; }
    public Guid LegalEntityId { get; }
    public string EntityType { get; }
    public string EntityId { get; }
    public string CancelledAtState { get; }
    public Guid CancelledByUserId { get; }
    public string? Reason { get; }

    public WorkflowCancelledDomainEvent(
        Guid instanceId,
        string workflowCode,
        Guid legalEntityId,
        string entityType,
        string entityId,
        string cancelledAtState,
        Guid cancelledByUserId,
        string? reason = null)
    {
        InstanceId = instanceId;
        WorkflowCode = workflowCode;
        LegalEntityId = legalEntityId;
        EntityType = entityType;
        EntityId = entityId;
        CancelledAtState = cancelledAtState;
        CancelledByUserId = cancelledByUserId;
        Reason = reason;
    }
}

