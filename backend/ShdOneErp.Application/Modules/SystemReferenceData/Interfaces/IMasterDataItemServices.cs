using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

public interface IMasterDataItemReadService
{
    Task<PagedResult<ItemDto>> GetPagedAsync(ItemFilterQuery query, CancellationToken cancellationToken = default);
    Task<ItemDto?> GetByIdAsync(Guid itemId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ItemLookupDto>> GetLookupByCatalogCodeAsync(string catalogCode, CancellationToken cancellationToken = default);
}

public interface IMasterDataItemWriteService
{
    Task<Result<Guid>> CreateAsync(Guid catalogId, CreateItemRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid catalogId, Guid itemId, UpdateItemRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeactivateAsync(Guid catalogId, Guid itemId, ChangeItemStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result> ActivateAsync(Guid catalogId, Guid itemId, ChangeItemStatusRequest request, CancellationToken cancellationToken = default);
}
