using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class BusinessUnitReadService : IBusinessUnitReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;

    public BusinessUnitReadService(ISpExecutor spExecutor, ICurrentUser currentUser)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
    }

    public Task<PagedResult<BusinessUnitDto>> GetPagedAsync(
        BusinessUnitFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<BusinessUnitDto>(
            "sp_Organization_BusinessUnit_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.LegalEntityId,
                query.SearchTerm,
                query.Status,
                query.SortBy,
                query.SortOrder,
                CurrentUserId = _currentUser.UserId
            },
            cancellationToken: cancellationToken);
    }

    public Task<BusinessUnitDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<BusinessUnitDetailDto>(
            "sp_Organization_BusinessUnit_GetById",
            new { Id = id, CurrentUserId = _currentUser.UserId },
            cancellationToken);
    }
}
