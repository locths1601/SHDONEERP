using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Workflow.DTOs;

public class WorkflowInstanceDto
{
    public Guid Id { get; set; }
    public Guid DefinitionId { get; set; }
    public string WorkflowCode { get; set; } = string.Empty;
    public string WorkflowName { get; set; } = string.Empty;
    public int DefinitionVersion { get; set; }
    public Guid LegalEntityId { get; set; }
    public string? LegalEntityCode { get; set; }
    public string? LegalEntityName { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string? BusinessUnitCode { get; set; }
    public string? BusinessUnitName { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string CurrentState { get; set; } = string.Empty;
    public string? CurrentStateName { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid RequesterUserId { get; set; }
    public string? RequesterName { get; set; }
    public Guid? AssignedUserGroupId { get; set; }
    public string? AssignedGroupName { get; set; }
    public Guid? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? PayloadJson { get; set; }
    public byte[]? RowVersion { get; set; }
    public string? RowVersionBase64 => RowVersion is null ? null : Convert.ToBase64String(RowVersion);
}

public class WorkflowHistoryDto
{
    public Guid Id { get; set; }
    public Guid InstanceId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string FromState { get; set; } = string.Empty;
    public string ToState { get; set; } = string.Empty;
    public Guid ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public string? Comments { get; set; }
    public string? PayloadJson { get; set; }
    public DateTime OccurredAtUtc { get; set; }
}

public class AvailableTransitionDto
{
    public string Action { get; set; } = string.Empty;
    public string ToState { get; set; } = string.Empty;
    public string ToStateName { get; set; } = string.Empty;
    public bool RequiresComment { get; set; }
    public string? RequiredPermission { get; set; }
}

public class StartWorkflowRequest
{
    public string WorkflowCode { get; set; } = string.Empty;
    public Guid LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }
    public Guid? AssignedUserGroupId { get; set; }
    public Guid? AssignedUserId { get; set; }
}

public class ExecuteWorkflowActionRequest
{
    public string Action { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public string? UpdatedPayloadJson { get; set; }
    public Guid? NextAssignedUserGroupId { get; set; }
    public Guid? NextAssignedUserId { get; set; }
    public string? RowVersionBase64 { get; set; }
}

public class CancelWorkflowRequest
{
    public string? Reason { get; set; }
    public string? RowVersionBase64 { get; set; }
}

public class WorkflowInstanceFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? WorkflowCode { get; set; }
    public Guid? LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Status { get; set; }
    public Guid? RequesterUserId { get; set; }
}

public class WorkflowDefinitionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int Version { get; set; }
    public string InitialState { get; set; } = string.Empty;
    public string DefinitionJson { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class WorkflowDefinitionVersionDto
{
    public Guid Id { get; set; }
    public Guid DefinitionId { get; set; }
    public int Version { get; set; }
    public string InitialState { get; set; } = string.Empty;
    public string DefinitionJson { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PublishedAtUtc { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
