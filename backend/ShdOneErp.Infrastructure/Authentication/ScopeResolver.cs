using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Infrastructure.Authentication;

public class ScopeResolver : IScopeResolver
{
    private readonly IPermissionResolver _permissionResolver;

    public ScopeResolver(IPermissionResolver permissionResolver)
    {
        _permissionResolver = permissionResolver;
    }

    public async Task<DataScopeResolution> ResolveScopeAsync(
        Guid userId,
        string permissionCode,
        CancellationToken cancellationToken = default)
    {
        var grants = await _permissionResolver.GetUserPermissionsAsync(userId, cancellationToken);
        var normalized = permissionCode.Trim().ToLowerInvariant();

        var matchingGrants = grants
            .Where(g => string.Equals(g.PermissionCode, normalized, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var resolution = new DataScopeResolution();

        if (matchingGrants.Any(g => string.Equals(g.ScopeType, "Global", StringComparison.OrdinalIgnoreCase)))
        {
            resolution.IsGlobal = true;
            return resolution;
        }

        var legalEntityIds = new HashSet<Guid>();
        var businessUnitIds = new HashSet<Guid>();
        var branchIds = new HashSet<Guid>();

        foreach (var grant in matchingGrants)
        {
            if (string.Equals(grant.ScopeType, "LegalEntity", StringComparison.OrdinalIgnoreCase) && grant.ScopeLegalEntityId.HasValue)
            {
                legalEntityIds.Add(grant.ScopeLegalEntityId.Value);
            }
            else if (string.Equals(grant.ScopeType, "BusinessUnit", StringComparison.OrdinalIgnoreCase) && grant.ScopeBusinessUnitId.HasValue)
            {
                businessUnitIds.Add(grant.ScopeBusinessUnitId.Value);
            }
            else if (string.Equals(grant.ScopeType, "Branch", StringComparison.OrdinalIgnoreCase) && grant.ScopeBranchId.HasValue)
            {
                branchIds.Add(grant.ScopeBranchId.Value);
            }
        }

        resolution.AllowedLegalEntityIds = legalEntityIds.ToList();
        resolution.AllowedBusinessUnitIds = businessUnitIds.ToList();
        resolution.AllowedBranchIds = branchIds.ToList();

        return resolution;
    }

    public async Task<bool> HasScopeAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid? targetBusinessUnitId = null,
        Guid? targetBranchId = null,
        CancellationToken cancellationToken = default)
    {
        return await _permissionResolver.HasPermissionAsync(
            userId,
            permissionCode,
            targetLegalEntityId,
            targetBusinessUnitId,
            targetBranchId,
            cancellationToken);
    }

    public async Task<bool> HasResourceAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid resourceOwnerUserId,
        DataClassification classification,
        CancellationToken cancellationToken = default)
    {
        // 1. Kiểm tra quyền truy cập phạm vi pháp nhân trước (chống cross-company leakage)
        var hasScope = await HasScopeAccessAsync(userId, permissionCode, targetLegalEntityId, cancellationToken: cancellationToken);
        if (!hasScope)
            return false;

        // 2. Nếu là dữ liệu công khai (Public) hoặc nội bộ (Internal) trong phạm vi pháp nhân -> cho phép
        if (classification is DataClassification.Public or DataClassification.Internal)
            return true;

        // 3. Nếu là dữ liệu bảo mật (Confidential) hoặc hạn chế tối mật (Restricted):
        // Bắt buộc người truy cập phải là chính chủ sở hữu tài nguyên (Resource Owner)
        // hoặc người dùng có quyền Global Admin
        if (userId == resourceOwnerUserId)
            return true;

        var isGlobalAdmin = await _permissionResolver.HasGlobalPermissionAsync(userId, permissionCode, cancellationToken);
        return isGlobalAdmin;
    }
}

