using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Audit.DTOs;
using ShdOneErp.Application.Modules.Audit.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class AuditLogReadService : IAuditLogReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;

    public AuditLogReadService(ISpExecutor spExecutor, ICurrentUser currentUser)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
    }

    public Task<PagedResult<AuditLogSummaryDto>> GetPagedAsync(
        AuditLogFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<AuditLogSummaryDto>(
            "sp_Audit_SystemLog_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.FromDateUtc,
                query.ToDateUtc,
                query.UserId,
                query.Action,
                query.EntityName,
                query.EntityId,
                query.CorrelationId,
                query.LegalEntityId,
                CurrentUserId = _currentUser.UserId
            },
            cancellationToken: cancellationToken);
    }

    public Task<AuditLogDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<AuditLogDetailDto>(
            "sp_Audit_SystemLog_GetById",
            new { Id = id, CurrentUserId = _currentUser.UserId },
            cancellationToken);
    }
}

