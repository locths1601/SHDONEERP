using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class MasterDataCatalogReadService : IMasterDataCatalogReadService
{
    private readonly ISpExecutor _spExecutor;

    public MasterDataCatalogReadService(ISpExecutor spExecutor)
    {
        _spExecutor = spExecutor;
    }

    public Task<PagedResult<CatalogDto>> GetPagedAsync(CatalogFilterQuery query, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<CatalogDto>(
            "sp_System_MasterData_Catalog_GetPagedList",
            new
            {
                SearchTerm = query.SearchTerm,
                OwnerModule = query.OwnerModule,
                IsActive = query.IsActive,
                IsSystem = query.IsSystem,
                PageNumber = query.Page,
                PageSize = query.PageSize,
                SortBy = query.SortBy,
                SortOrder = query.SortOrder
            },
            cancellationToken: cancellationToken);
    }

    public Task<CatalogDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<CatalogDto>(
            "sp_System_MasterData_Catalog_GetById",
            new { CatalogId = id },
            cancellationToken: cancellationToken);
    }
}

