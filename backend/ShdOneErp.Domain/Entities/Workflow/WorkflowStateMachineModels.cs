using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.Workflow;

public class WorkflowStateDefinition
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public WorkflowStateType StateType { get; set; } = WorkflowStateType.Normal;
    public string? Description { get; set; }
    public List<string> AllowedGroupCodes { get; set; } = new();
}

public class WorkflowTransitionDefinition
{
    public string Id { get; set; } = string.Empty;
    public string FromState { get; set; } = string.Empty;
    public string ToState { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Submit, Approve, Reject, RequestChanges, Cancel
    public string? RequiredPermission { get; set; }
    public WorkflowStatus TargetStatus { get; set; } = WorkflowStatus.Pending;
    public string? ConditionExpression { get; set; } // Biểu thức logic ví dụ: "payload.amount <= 50000000"
    public bool RequiresComment { get; set; } = false;
}

public class WorkflowSchema
{
    public int Version { get; set; } = 1;
    public string InitialState { get; set; } = string.Empty;
    public List<WorkflowStateDefinition> States { get; set; } = new();
    public List<WorkflowTransitionDefinition> Transitions { get; set; } = new();

    public WorkflowStateDefinition? GetState(string code) =>
        States.FirstOrDefault(s => string.Equals(s.Code, code, StringComparison.OrdinalIgnoreCase));

    public WorkflowTransitionDefinition? FindTransition(string fromState, string action) =>
        Transitions.FirstOrDefault(t =>
            string.Equals(t.FromState, fromState, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(t.Action, action, StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<WorkflowTransitionDefinition> GetAvailableTransitions(string fromState) =>
        Transitions.Where(t => string.Equals(t.FromState, fromState, StringComparison.OrdinalIgnoreCase)).ToList();
}

