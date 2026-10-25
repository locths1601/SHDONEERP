using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class LegalEntityReadService : ILegalEntityReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;

    public LegalEntityReadService(ISpExecutor spExecutor, ICurrentUser currentUser)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<LegalEntityDto>> GetPagedAsync(LegalEntityFilterQuery query, CancellationToken cancellationToken = default)
    {
        var parameters = new
        {
            PageNumber = query.Page,
            PageSize = query.PageSize,
            SearchTerm = query.SearchTerm,
            Status = query.Status,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder,
            CurrentUserId = _currentUser.UserId
        };

        return await _spExecutor.ExecuteStoredProcedurePagedAsync<LegalEntityDto>(
            "sp_Organization_LegalEntity_GetPaged",
            parameters,
            totalCountParamName: "TotalCount",
            cancellationToken: cancellationToken);
    }

    public async Task<LegalEntityDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var parameters = new
        {
            Id = id,
            CurrentUserId = _currentUser.UserId
        };

        return await _spExecutor.ExecuteStoredProcedureSingleAsync<LegalEntityDetailDto>(
            "sp_Organization_LegalEntity_GetById",
            parameters,
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyList<LegalEntityLookupDto>> GetLookupAsync(CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<LegalEntityLookupDto>(
            "sp_Organization_LegalEntity_GetLookup",
            null,
            cancellationToken: cancellationToken);
    }
}
