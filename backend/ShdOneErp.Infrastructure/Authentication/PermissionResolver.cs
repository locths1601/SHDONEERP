using ShdOneErp.Application.Common.Interfaces;

namespace ShdOneErp.Infrastructure.Authentication;

public class PermissionResolver : IPermissionResolver
{
    private readonly ISpExecutor _spExecutor;

    public PermissionResolver(ISpExecutor spExecutor)
    {
        _spExecutor = spExecutor;
    }

    public async Task<IReadOnlyList<EffectivePermissionDto>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions",
            new { UserId = userId },
            cancellationToken);
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode, Guid? legalEntityId = null, CancellationToken cancellationToken = default)
    {
        var permissions = await GetUserPermissionsAsync(userId, cancellationToken);
        var normalizedCode = permissionCode.Trim().ToLowerInvariant();

        foreach (var grant in permissions)
        {
            if (string.Equals(grant.PermissionCode, normalizedCode, StringComparison.OrdinalIgnoreCase))
            {
                // Global scope grants access across all entities
                if (string.Equals(grant.ScopeType, "Global", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                // LegalEntity scope grants access to specified legal entity
                if (string.Equals(grant.ScopeType, "LegalEntity", StringComparison.OrdinalIgnoreCase))
                {
                    if (legalEntityId == null || grant.ScopeLegalEntityId == legalEntityId)
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
