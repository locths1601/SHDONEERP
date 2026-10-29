namespace ShdOneErp.Application.Modules.Workflow.Exceptions;

public class WorkflowException : Exception
{
    public string ErrorCode { get; }

    public WorkflowException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class WorkflowDefinitionNotFoundException : WorkflowException
{
    public WorkflowDefinitionNotFoundException(string code)
        : base("WORKFLOW_DEFINITION_NOT_FOUND", $"Không tìm thấy định nghĩa quy trình công việc có mã '{code}'.") { }
}

public class WorkflowInstanceNotFoundException : WorkflowException
{
    public WorkflowInstanceNotFoundException(Guid id)
        : base("WORKFLOW_INSTANCE_NOT_FOUND", $"Không tìm thấy phiên bản quy trình công việc có ID '{id}'.") { }
}

public class InvalidWorkflowTransitionException : WorkflowException
{
    public string CurrentState { get; }
    public string AttemptedAction { get; }

    public InvalidWorkflowTransitionException(string currentState, string attemptedAction, string message)
        : base("INVALID_WORKFLOW_TRANSITION", message)
    {
        CurrentState = currentState;
        AttemptedAction = attemptedAction;
    }
}

public class WorkflowAuthorizationException : WorkflowException
{
    public WorkflowAuthorizationException(string message)
        : base("WORKFLOW_UNAUTHORIZED", message) { }
}

public class WorkflowConditionEvaluationException : WorkflowException
{
    public WorkflowConditionEvaluationException(string condition, string message)
        : base("WORKFLOW_CONDITION_FAILED", $"Điều kiện chuyển bước '{condition}' không thỏa mãn: {message}") { }
}

public class WorkflowConcurrencyConflictException : WorkflowException
{
    public WorkflowConcurrencyConflictException()
        : base("CONCURRENCY_CONFLICT", "Dữ liệu quy trình công việc đã bị thay đổi bởi người khác hoặc phiên xử lý đồng thời. Hãy tải lại và thử lại.") { }
}

