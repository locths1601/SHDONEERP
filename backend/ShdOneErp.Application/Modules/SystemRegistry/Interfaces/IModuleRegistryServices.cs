using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;

namespace ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

public interface IModuleRegistryReadService
{
    Task<PagedResult<ModuleDto>> GetPagedAsync(ModuleFilterQuery query, CancellationToken cancellationToken = default);
    Task<ModuleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ModuleHierarchyDto>> GetHierarchyAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ModuleDependencyDto>> GetDependenciesAsync(Guid moduleId, CancellationToken cancellationToken = default);
}

public interface IModuleRegistryWriteService
{
    Task<Result<Guid>> CreateAsync(CreateModuleRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateModuleRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<Guid>> AddDependencyAsync(Guid moduleId, AddModuleDependencyRequest request, CancellationToken cancellationToken = default);
    Task<Result> RemoveDependencyAsync(Guid dependencyId, CancellationToken cancellationToken = default);
}
