using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class BranchReadService : IBranchReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;

    public BranchReadService(ISpExecutor spExecutor, ICurrentUser currentUser)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
    }

    public Task<PagedResult<BranchDto>> GetPagedAsync(
        BranchFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<BranchDto>(
            "sp_Organization_Branch_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.LegalEntityId,
                query.BusinessUnitId,
                query.SearchTerm,
                query.Status,
                query.SortBy,
                query.SortOrder,
                CurrentUserId = _currentUser.UserId
            },
            cancellationToken: cancellationToken);
    }

    public Task<BranchDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<BranchDetailDto>(
            "sp_Organization_Branch_GetById",
            new { Id = id, CurrentUserId = _currentUser.UserId },
            cancellationToken);
    }

    public async Task<IReadOnlyList<BranchLookupDto>> GetLookupAsync(
        Guid? legalEntityId,
        Guid? businessUnitId,
        CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<BranchLookupDto>(
            "sp_Organization_Branch_GetLookup",
            new
            {
                LegalEntityId = legalEntityId,
                BusinessUnitId = businessUnitId,
                CurrentUserId = _currentUser.UserId
            },
            cancellationToken);
    }
}

