using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.Workflow.DTOs;
using ShdOneErp.Application.Modules.Workflow.Interfaces;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Workflow.Services;

public class WorkflowEngine : IWorkflowEngine
{
    private readonly IWorkflowExecutionService _executionService;
    private readonly IShdOneErpDbContext _context;

    public WorkflowEngine(IWorkflowExecutionService executionService, IShdOneErpDbContext context)
    {
        _executionService = executionService;
        _context = context;
    }

    public async Task<WorkflowTransitionResult> SubmitAsync(
        string workflowCode,
        Guid legalEntityId,
        string entityId,
        Guid requesterUserId,
        object? payload = null,
        CancellationToken cancellationToken = default)
    {
        var payloadJson = payload != null ? JsonSerializer.Serialize(payload) : null;

        var request = new StartWorkflowRequest
        {
            WorkflowCode = workflowCode,
            LegalEntityId = legalEntityId,
            EntityType = "Generic",
            EntityId = entityId,
            PayloadJson = payloadJson
        };

        var result = await _executionService.StartAsync(request, cancellationToken);
        if (!result.Success)
        {
            return new WorkflowTransitionResult
            {
                Success = false,
                Message = result.Message ?? "Không thể khởi tạo quy trình."
            };
        }

        var instance = await _context.WorkflowInstances
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == result.Data, cancellationToken);

        return new WorkflowTransitionResult
        {
            Success = true,
            CurrentState = instance?.CurrentState ?? "Initial",
            Status = instance?.Status ?? WorkflowStatus.Pending,
            Message = result.Message ?? "Khởi tạo thành công"
        };
    }

    public async Task<WorkflowTransitionResult> ExecuteActionAsync(
        Guid instanceId,
        string action,
        Guid actorUserId,
        string? comments = null,
        CancellationToken cancellationToken = default)
    {
        var request = new ExecuteWorkflowActionRequest
        {
            Action = action,
            Comments = comments
        };

        var result = await _executionService.ExecuteActionAsync(instanceId, request, cancellationToken);
        if (!result.Success)
        {
            return new WorkflowTransitionResult
            {
                Success = false,
                Message = result.Message ?? "Chuyển trạng thái thất bại."
            };
        }

        var instance = await _context.WorkflowInstances
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == instanceId, cancellationToken);

        return new WorkflowTransitionResult
        {
            Success = true,
            CurrentState = instance?.CurrentState ?? string.Empty,
            Status = instance?.Status ?? WorkflowStatus.Pending,
            Message = result.Message ?? "Thao tác thành công",
            NextAssignedUserId = instance?.AssignedUserId
        };
    }
}

