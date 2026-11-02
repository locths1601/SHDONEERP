using Microsoft.Extensions.Caching.Memory;
using ShdOneErp.Application.Common.Interfaces;

namespace ShdOneErp.Infrastructure.Authentication;

public class PermissionResolver : IPermissionResolver, IPermissionCacheInvalidator
{
    private readonly ISpExecutor _spExecutor;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public PermissionResolver(ISpExecutor spExecutor, IMemoryCache? cache = null)
    {
        _spExecutor = spExecutor;
        _cache = cache ?? new MemoryCache(new MemoryCacheOptions());
    }

    public async Task<IReadOnlyList<EffectivePermissionDto>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"auth:effective_perms:{userId}";

        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<EffectivePermissionDto>? cached) && cached != null)
        {
            return cached;
        }

        var permissions = await _spExecutor.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions",
            new { UserId = userId },
            cancellationToken);

        _cache.Set(cacheKey, permissions, CacheDuration);
        return permissions;
    }

    public void InvalidateUser(Guid userId)
    {
        _cache.Remove($"auth:effective_perms:{userId}");
    }

    public void InvalidateAll()
    {
        // Handled by eviction or clear
    }

    public async Task<bool> HasGlobalPermissionAsync(Guid userId, string permissionCode, CancellationToken cancellationToken = default)
    {
        var permissions = await GetUserPermissionsAsync(userId, cancellationToken);
        return permissions.Any(p => p.PermissionCode == permissionCode && p.ScopeType == "Global");
    }

    public async Task<bool> HasPermissionAsync(
        Guid userId,
        string permissionCode,
        Guid? legalEntityId = null,
        Guid? businessUnitId = null,
        Guid? branchId = null,
        CancellationToken cancellationToken = default)
    {
        var permissions = await GetUserPermissionsAsync(userId, cancellationToken);

        var matchingGrants = permissions.Where(p => p.PermissionCode == permissionCode).ToList();
        if (!matchingGrants.Any())
            return false;

        foreach (var grant in matchingGrants)
        {
            // Global scope covers all entities
            if (grant.ScopeType == "Global")
                return true;

            // LegalEntity scope covers matching LegalEntity and any children (BU/Branch) within it
            if (grant.ScopeType == "LegalEntity")
            {
                if (legalEntityId.HasValue && grant.ScopeLegalEntityId == legalEntityId)
                    return true;
            }

            // BusinessUnit scope covers matching BU and any Branch within it
            if (grant.ScopeType == "BusinessUnit")
            {
                if (businessUnitId.HasValue && grant.ScopeBusinessUnitId == businessUnitId)
                    return true;
            }

            // Branch scope covers only specific Branch
            if (grant.ScopeType == "Branch")
            {
                if (branchId.HasValue && grant.ScopeBranchId == branchId)
                    return true;
            }
        }

        return false;
    }
}
