using System.Text.Json;
using ShdOneErp.Application.Modules.Workflow.Exceptions;
using ShdOneErp.Domain.Entities.Workflow;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Workflow.Services;

public static class WorkflowStateMachineParser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static WorkflowSchema ParseAndValidate(string definitionJson)
    {
        if (string.IsNullOrWhiteSpace(definitionJson))
            throw new WorkflowException("INVALID_WORKFLOW_SCHEMA", "Định nghĩa quy trình công việc (JSON) không được để trống.");

        WorkflowSchema? schema;
        try
        {
            schema = JsonSerializer.Deserialize<WorkflowSchema>(definitionJson, JsonOptions);
        }
        catch (Exception ex)
        {
            throw new WorkflowException("INVALID_WORKFLOW_SCHEMA_JSON", $"Lỗi cú pháp JSON định nghĩa quy trình: {ex.Message}");
        }

        if (schema == null)
            throw new WorkflowException("INVALID_WORKFLOW_SCHEMA", "Không thể giải mã cấu trúc quy trình công việc.");

        if (string.IsNullOrWhiteSpace(schema.InitialState))
            throw new WorkflowException("MISSING_INITIAL_STATE", "Quy trình công việc bắt buộc phải có trạng thái khởi tạo (InitialState).");

        if (schema.States == null || schema.States.Count == 0)
            throw new WorkflowException("MISSING_STATES", "Quy trình công việc phải chứa ít nhất một trạng thái hợp lệ.");

        var stateCodes = new HashSet<string>(schema.States.Select(s => s.Code.ToUpperInvariant()));

        if (!stateCodes.Contains(schema.InitialState.ToUpperInvariant()))
            throw new WorkflowException("INITIAL_STATE_NOT_FOUND", $"Trạng thái khởi tạo '{schema.InitialState}' không tồn tại trong danh mục trạng thái.");

        if (schema.Transitions == null || schema.Transitions.Count == 0)
            throw new WorkflowException("MISSING_TRANSITIONS", "Quy trình công việc phải có ít nhất một bước chuyển trạng thái (Transition).");

        foreach (var t in schema.Transitions)
        {
            if (string.IsNullOrWhiteSpace(t.Action))
                throw new WorkflowException("MISSING_TRANSITION_ACTION", "Hành động chuyển trạng thái (Action) không được để trống.");

            if (!stateCodes.Contains(t.FromState.ToUpperInvariant()))
                throw new WorkflowException("TRANSITION_FROM_STATE_INVALID", $"Trạng thái nguồn '{t.FromState}' không tồn tại trong danh mục trạng thái.");

            if (!stateCodes.Contains(t.ToState.ToUpperInvariant()))
                throw new WorkflowException("TRANSITION_TO_STATE_INVALID", $"Trạng thái đích '{t.ToState}' không tồn tại trong danh mục trạng thái.");
        }

        var hasTerminalState = schema.States.Any(s =>
            s.StateType is WorkflowStateType.TerminalApproved
            or WorkflowStateType.TerminalRejected
            or WorkflowStateType.TerminalCancelled);

        if (!hasTerminalState)
            throw new WorkflowException("MISSING_TERMINAL_STATE", "Quy trình công việc bắt buộc phải có ít nhất một trạng thái kết thúc (Terminal State).");

        return schema;
    }
}

