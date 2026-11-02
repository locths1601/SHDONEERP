using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Workflow.DTOs;

namespace ShdOneErp.Application.Modules.Workflow.Interfaces;

public interface IWorkflowExecutionService
{
    Task<Result<Guid>> StartAsync(StartWorkflowRequest request, CancellationToken cancellationToken = default);
    Task<Result> ExecuteActionAsync(Guid instanceId, ExecuteWorkflowActionRequest request, CancellationToken cancellationToken = default);
    Task<Result> CancelAsync(Guid instanceId, CancelWorkflowRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AvailableTransitionDto>> GetAvailableTransitionsAsync(Guid instanceId, CancellationToken cancellationToken = default);
}

public interface IWorkflowReadService
{
    Task<PagedResult<WorkflowInstanceDto>> GetPagedAsync(WorkflowInstanceFilterQuery query, CancellationToken cancellationToken = default);
    Task<WorkflowInstanceDto?> GetByIdAsync(Guid instanceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WorkflowHistoryDto>> GetHistoryAsync(Guid instanceId, CancellationToken cancellationToken = default);
}

