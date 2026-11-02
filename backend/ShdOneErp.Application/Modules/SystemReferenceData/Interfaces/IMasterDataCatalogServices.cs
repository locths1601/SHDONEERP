using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

public interface IMasterDataCatalogReadService
{
    Task<PagedResult<CatalogDto>> GetPagedAsync(CatalogFilterQuery query, CancellationToken cancellationToken = default);
    Task<CatalogDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IMasterDataCatalogWriteService
{
    Task<Result<Guid>> CreateAsync(CreateCatalogRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateCatalogRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeactivateAsync(Guid id, ChangeCatalogStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result> ActivateAsync(Guid id, ChangeCatalogStatusRequest request, CancellationToken cancellationToken = default);
}

