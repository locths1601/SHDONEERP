using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Audit.DTOs;

namespace ShdOneErp.Application.Modules.Audit.Interfaces;

public interface IAuditLogReadService
{
    Task<PagedResult<AuditLogSummaryDto>> GetPagedAsync(AuditLogFilterQuery query, CancellationToken cancellationToken = default);
    Task<AuditLogDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

