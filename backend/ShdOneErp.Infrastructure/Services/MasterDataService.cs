using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

namespace ShdOneErp.Infrastructure.Services;

public class MasterDataService : IMasterDataService
{
    private readonly IMasterDataItemReadService _itemReadService;

    public MasterDataService(IMasterDataItemReadService itemReadService)
    {
        _itemReadService = itemReadService;
    }

    public async Task<IReadOnlyList<MasterDataItemDto>> GetItemsByCatalogAsync(string catalogCode, CancellationToken cancellationToken = default)
    {
        var items = await _itemReadService.GetLookupByCatalogCodeAsync(catalogCode, cancellationToken);
        return items.Select(i => new MasterDataItemDto
        {
            Id = i.Id,
            CatalogCode = i.CatalogCode,
            Code = i.Code,
            Name = i.Name,
            Value = i.Value,
            DisplayOrder = i.DisplayOrder,
            ParentItemId = i.ParentItemId,
            MetadataJson = i.MetadataJson
        }).ToList();
    }
}

