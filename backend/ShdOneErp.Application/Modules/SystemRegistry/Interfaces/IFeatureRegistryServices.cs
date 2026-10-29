using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;

namespace ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

public interface IFeatureRegistryReadService
{
    Task<PagedResult<FeatureDto>> GetPagedAsync(FeatureFilterQuery query, CancellationToken cancellationToken = default);
    Task<FeatureDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeatureHierarchyDto>> GetHierarchyAsync(Guid? moduleId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeatureActionPermissionDto>> GetActionsAsync(Guid featureId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ActionPermissionMappingViewDto>> GetPermissionMappingCatalogAsync(PermissionMappingFilterQuery query, CancellationToken cancellationToken = default);
}

public interface IFeatureRegistryWriteService
{
    Task<Result<Guid>> CreateAsync(CreateFeatureRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateFeatureRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<Guid>> AddActionMappingAsync(Guid featureId, CreateFeatureActionRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateActionMappingAsync(Guid actionMappingId, UpdateFeatureActionRequest request, CancellationToken cancellationToken = default);
    Task<Result> RemoveActionMappingAsync(Guid actionMappingId, CancellationToken cancellationToken = default);
}
