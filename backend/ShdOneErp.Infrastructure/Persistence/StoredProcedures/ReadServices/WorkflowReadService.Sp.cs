using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Workflow.DTOs;
using ShdOneErp.Application.Modules.Workflow.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class WorkflowReadService : IWorkflowReadService
{
    private readonly ISpExecutor _spExecutor;

    public WorkflowReadService(ISpExecutor spExecutor)
    {
        _spExecutor = spExecutor;
    }

    public async Task<PagedResult<WorkflowInstanceDto>> GetPagedAsync(WorkflowInstanceFilterQuery query, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedurePagedAsync<WorkflowInstanceDto>(
            "sp_Workflow_Instance_GetPaged",
            new
            {
                Page = query.Page,
                PageSize = query.PageSize,
                WorkflowCode = query.WorkflowCode,
                LegalEntityId = query.LegalEntityId,
                BusinessUnitId = query.BusinessUnitId,
                EntityType = query.EntityType,
                EntityId = query.EntityId,
                Status = query.Status,
                RequesterUserId = query.RequesterUserId
            },
            totalCountParamName: "TotalCount",
            cancellationToken: cancellationToken);
    }

    public async Task<WorkflowInstanceDto?> GetByIdAsync(Guid instanceId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureSingleAsync<WorkflowInstanceDto>(
            "sp_Workflow_Instance_GetById",
            new { InstanceId = instanceId },
            cancellationToken);
    }

    public async Task<IReadOnlyList<WorkflowHistoryDto>> GetHistoryAsync(Guid instanceId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<WorkflowHistoryDto>(
            "sp_Workflow_Instance_GetHistory",
            new { InstanceId = instanceId },
            cancellationToken);
    }
}
