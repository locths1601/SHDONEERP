namespace ShdOneErp.Domain.Enums;

public enum WorkflowStateType
{
    Initial = 1,
    Normal = 2,
    TerminalApproved = 3,
    TerminalRejected = 4,
    TerminalCancelled = 5
}

public enum WorkflowActionType
{
    Submit = 1,
    Approve = 2,
    Reject = 3,
    RequestChanges = 4,
    Delegate = 5,
    Cancel = 6
}

