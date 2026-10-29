using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class FeatureRegistryReadService : IFeatureRegistryReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly string _connectionString;

    public FeatureRegistryReadService(ISpExecutor spExecutor, IConfiguration configuration)
    {
        _spExecutor = spExecutor;
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Chuỗi kết nối 'DefaultConnection' chưa được cấu hình.");
    }

    public Task<PagedResult<FeatureDto>> GetPagedAsync(FeatureFilterQuery query, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<FeatureDto>(
            "sp_System_Feature_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.ModuleId,
                query.FeatureType,
                query.Status,
                query.SearchTerm
            },
            cancellationToken: cancellationToken);
    }

    public async Task<FeatureDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        var command = new CommandDefinition(
            "sp_System_Feature_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        using var multi = await connection.QueryMultipleAsync(command);
        var feature = await multi.ReadFirstOrDefaultAsync<FeatureDetailDto>();
        if (feature is null) return null;

        var actions = (await multi.ReadAsync<FeatureActionPermissionDto>()).ToList();
        feature.Actions = actions;

        return feature;
    }

    public async Task<IReadOnlyList<FeatureHierarchyDto>> GetHierarchyAsync(Guid? moduleId = null, CancellationToken cancellationToken = default)
    {
        var flatList = await _spExecutor.ExecuteStoredProcedureListAsync<FeatureHierarchyDto>(
            "sp_System_Feature_GetHierarchy",
            new { ModuleId = moduleId },
            cancellationToken: cancellationToken);

        var lookup = flatList.ToDictionary(f => f.Id);
        var rootNodes = new List<FeatureHierarchyDto>();

        foreach (var item in flatList)
        {
            if (item.ParentFeatureId.HasValue && lookup.TryGetValue(item.ParentFeatureId.Value, out var parent))
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

    public Task<IReadOnlyList<FeatureActionPermissionDto>> GetActionsAsync(Guid featureId, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureListAsync<FeatureActionPermissionDto>(
            "sp_System_FeatureAction_GetByFeatureId",
            new { FeatureId = featureId },
            cancellationToken: cancellationToken);
    }

    public Task<IReadOnlyList<ActionPermissionMappingViewDto>> GetPermissionMappingCatalogAsync(PermissionMappingFilterQuery query, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureListAsync<ActionPermissionMappingViewDto>(
            "sp_System_PermissionMapping_GetAll",
            new
            {
                query.ModuleId,
                query.SearchTerm
            },
            cancellationToken: cancellationToken);
    }
}
