using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class ModuleRegistryReadService : IModuleRegistryReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly string _connectionString;

    public ModuleRegistryReadService(ISpExecutor spExecutor, IConfiguration configuration)
    {
        _spExecutor = spExecutor;
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
    }

    public Task<PagedResult<ModuleDto>> GetPagedAsync(ModuleFilterQuery query, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<ModuleDto>(
            "sp_System_Module_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.SearchTerm,
                query.Status,
                query.IsActive
            },
            cancellationToken: cancellationToken);
    }

    public async Task<ModuleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var command = new CommandDefinition(
            "sp_System_Module_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);
        var module = await multi.ReadFirstOrDefaultAsync<ModuleDetailDto>();
        if (module is null) return null;

        var dependencies = (await multi.ReadAsync<ModuleDependencyDto>()).ToList();
        var childModules = (await multi.ReadAsync<ModuleHierarchyDto>()).ToList();

        module.Dependencies = dependencies;
        module.ChildModules = childModules;

        return module;
    }

    public async Task<IReadOnlyList<ModuleHierarchyDto>> GetHierarchyAsync(CancellationToken cancellationToken = default)
    {
        var flatList = await _spExecutor.ExecuteStoredProcedureListAsync<ModuleHierarchyDto>(
            "sp_System_Module_GetHierarchy",
            cancellationToken: cancellationToken);

        var lookup = flatList.ToDictionary(m => m.Id);
        var rootNodes = new List<ModuleHierarchyDto>();

        foreach (var item in flatList)
        {
            if (item.ParentModuleId.HasValue && lookup.TryGetValue(item.ParentModuleId.Value, out var parent))
            {
                parent.Children.Add(item);
            }
            else
            {
                rootNodes.Add(item);
            }
        }

        return rootNodes;
    }

    public Task<IReadOnlyList<ModuleDependencyDto>> GetDependenciesAsync(Guid moduleId, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureListAsync<ModuleDependencyDto>(
            "sp_System_Module_GetDependencies",
            new { ModuleId = moduleId },
            cancellationToken: cancellationToken);
    }
}
