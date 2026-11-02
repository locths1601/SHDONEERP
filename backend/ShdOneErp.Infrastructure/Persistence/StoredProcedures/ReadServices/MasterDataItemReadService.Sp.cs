using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class MasterDataItemReadService : IMasterDataItemReadService
{
    private readonly ISpExecutor _spExecutor;

    public MasterDataItemReadService(ISpExecutor spExecutor)
    {
        _spExecutor = spExecutor;
    }

    public Task<PagedResult<ItemDto>> GetPagedAsync(ItemFilterQuery query, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<ItemDto>(
            "sp_System_MasterData_Item_GetPagedList",
            new
            {
                CatalogId = query.CatalogId,
                SearchTerm = query.SearchTerm,
                IsActive = query.IsActive,
                ParentItemId = query.ParentItemId,
                PageNumber = query.Page,
                PageSize = query.PageSize,
                SortBy = query.SortBy,
                SortOrder = query.SortOrder
            },
            cancellationToken: cancellationToken);
    }

    public Task<ItemDto?> GetByIdAsync(Guid itemId, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<ItemDto>(
            "sp_System_MasterData_Item_GetById",
            new { ItemId = itemId },
            cancellationToken: cancellationToken);
    }

    public Task<IReadOnlyList<ItemLookupDto>> GetLookupByCatalogCodeAsync(string catalogCode, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureListAsync<ItemLookupDto>(
            "sp_System_MasterData_Item_GetByCatalogCode",
            new { CatalogCode = catalogCode },
            cancellationToken: cancellationToken);
    }
}

