using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;
using ShdOneErp.Application.Modules.SystemRegistry.Validators;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Application.Modules.SystemRegistry.Services;

public class FeatureRegistryWriteService : IFeatureRegistryWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public FeatureRegistryWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    private async Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken)
    {
        if (_currentUser.IsAdmin) return true;
        if (!_currentUser.UserId.HasValue) return false;

        var hasGlobal = await _permissionResolver.HasGlobalPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken);
        if (hasGlobal) return true;

        var effective = await _permissionResolver.GetUserPermissionsAsync(_currentUser.UserId.Value, cancellationToken);
        return effective.Any(p => p.PermissionCode == permissionCode);
    }

    public async Task<Result<Guid>> CreateAsync(CreateFeatureRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.feature.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền quản trị tính năng hệ thống (system.feature.manage).");

        var validator = new CreateFeatureRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu tính năng không hợp lệ.", errors);
        }

        var moduleExists = await _context.SystemModules.AnyAsync(m => m.Id == request.ModuleId, cancellationToken);
        if (!moduleExists)
            return Result<Guid>.Fail("MODULE_NOT_FOUND", "Không tìm thấy phân hệ chỉ định.");

        var code = request.Code.Trim().ToLowerInvariant();
        var codeExists = await _context.SystemFeatures.AnyAsync(f => f.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã tính năng '{code}' đã tồn tại trong hệ thống.");

        if (request.ParentFeatureId.HasValue)
        {
            var parentExists = await _context.SystemFeatures.AnyAsync(f => f.Id == request.ParentFeatureId.Value, cancellationToken);
            if (!parentExists)
                return Result<Guid>.Fail("PARENT_NOT_FOUND", "Không tìm thấy tính năng cha chỉ định.");
        }

        var feature = new SystemFeature(
            moduleId: request.ModuleId,
            code: code,
            name: request.Name,
            description: request.Description,
            isEnabledGlobal: request.IsEnabledGlobal,
            featureType: request.FeatureType,
            parentFeatureId: request.ParentFeatureId,
            routePath: request.RoutePath,
            apiEndpoint: request.ApiEndpoint,
            componentKey: request.ComponentKey,
            icon: request.Icon,
            orderIndex: request.OrderIndex,
            supportedActions: request.SupportedActions,
            status: request.Status,
            ownerTeam: request.OwnerTeam,
            dataClassification: request.DataClassification);

        _context.SystemFeatures.Add(feature);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(feature.Id, "Tạo mới tính năng thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateFeatureRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.feature.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền quản trị tính năng hệ thống (system.feature.manage).");

        var validator = new UpdateFeatureRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result.Fail("VALIDATION_ERROR", "Dữ liệu tính năng không hợp lệ.", errors);
        }

        var feature = await _context.SystemFeatures.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (feature is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy tính năng cần cập nhật.");

        if (request.ParentFeatureId.HasValue)
        {
            if (request.ParentFeatureId.Value == id)
                return Result.Fail("INVALID_PARENT", "Tính năng không thể tự làm tính năng cha của chính nó.");

            var parentExists = await _context.SystemFeatures.AnyAsync(f => f.Id == request.ParentFeatureId.Value, cancellationToken);
            if (!parentExists)
                return Result.Fail("PARENT_NOT_FOUND", "Không tìm thấy tính năng cha chỉ định.");

            // Kiểm tra vòng lặp cha con
            var currentParentId = request.ParentFeatureId;
            var visited = new HashSet<Guid> { id };
            while (currentParentId.HasValue)
            {
                if (visited.Contains(currentParentId.Value))
                    return Result.Fail("CIRCULAR_DEPENDENCY", "Cấu trúc tính năng cha con bị vòng lặp.");

                visited.Add(currentParentId.Value);
                var p = await _context.SystemFeatures.AsNoTracking().FirstOrDefaultAsync(x => x.Id == currentParentId.Value, cancellationToken);
                currentParentId = p?.ParentFeatureId;
            }
        }

        feature.Update(
            name: request.Name,
            description: request.Description,
            featureType: request.FeatureType,
            routePath: request.RoutePath,
            apiEndpoint: request.ApiEndpoint,
            componentKey: request.ComponentKey,
            icon: request.Icon,
            orderIndex: request.OrderIndex,
            supportedActions: request.SupportedActions,
            status: request.Status,
            ownerTeam: request.OwnerTeam,
            dataClassification: request.DataClassification,
            isEnabledGlobal: request.IsEnabledGlobal,
            parentFeatureId: request.ParentFeatureId);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Ok("Cập nhật tính năng thành công.");
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.feature.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền xóa tính năng hệ thống (system.feature.manage).");

        var feature = await _context.SystemFeatures.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (feature is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy tính năng cần xóa.");

        var hasChildFeatures = await _context.SystemFeatures.AnyAsync(f => f.ParentFeatureId == id, cancellationToken);
        if (hasChildFeatures)
            return Result.Fail("HAS_DEPENDENT_RECORDS", "Không thể xóa tính năng đang có tính năng con trực thuộc.");

        _context.SystemFeatures.Remove(feature);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Xóa tính năng thành công.");
    }

    public async Task<Result<Guid>> AddActionMappingAsync(Guid featureId, CreateFeatureActionRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.permission_map.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền quản trị ánh xạ hành động và quyền (system.permission_map.manage).");

        var validator = new CreateFeatureActionRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu hành động không hợp lệ.", errors);
        }

        var feature = await _context.SystemFeatures.Include(f => f.ActionPermissions).FirstOrDefaultAsync(f => f.Id == featureId, cancellationToken);
        if (feature is null)
            return Result<Guid>.Fail("NOT_FOUND", "Không tìm thấy tính năng chỉ định.");

        var actionCode = request.ActionCode.Trim().ToLowerInvariant();
        if (feature.ActionPermissions.Any(a => a.ActionCode == actionCode))
            return Result<Guid>.Fail("DUPLICATE_ACTION", $"Hành động '{actionCode}' đã được định nghĩa cho tính năng này.");

        var permCode = request.PermissionCode.Trim().ToLowerInvariant();
        var permission = await _context.Permissions.FirstOrDefaultAsync(p => p.Code.ToLower() == permCode, cancellationToken);

        var actionMapping = new SystemFeatureActionPermission(
            featureId: featureId,
            actionCode: actionCode,
            actionName: request.ActionName,
            permissionCode: permCode,
            permissionId: permission?.Id,
            description: request.Description,
            isDefault: request.IsDefault);

        _context.SystemFeatureActionPermissions.Add(actionMapping);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(actionMapping.Id, "Thêm ánh xạ hành động - quyền thành công.");
    }

    public async Task<Result> UpdateActionMappingAsync(Guid actionMappingId, UpdateFeatureActionRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.permission_map.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền quản trị ánh xạ hành động và quyền (system.permission_map.manage).");

        var validator = new UpdateFeatureActionRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result.Fail("VALIDATION_ERROR", "Dữ liệu hành động không hợp lệ.", errors);
        }

        var feature = await _context.SystemFeatures
            .Include(f => f.ActionPermissions)
            .FirstOrDefaultAsync(f => f.ActionPermissions.Any(a => a.Id == actionMappingId), cancellationToken);

        if (feature is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy ánh xạ hành động cần cập nhật.");

        var actionMapping = feature.ActionPermissions.FirstOrDefault(a => a.Id == actionMappingId);
        if (actionMapping is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy ánh xạ hành động.");

        var permCode = request.PermissionCode.Trim().ToLowerInvariant();
        var permission = await _context.Permissions.FirstOrDefaultAsync(p => p.Code.ToLower() == permCode, cancellationToken);

        actionMapping.Update(
            actionName: request.ActionName,
            permissionCode: permCode,
            permissionId: permission?.Id,
            description: request.Description,
            isDefault: request.IsDefault);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Ok("Cập nhật ánh xạ hành động - quyền thành công.");
    }

    public async Task<Result> RemoveActionMappingAsync(Guid actionMappingId, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.permission_map.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền xóa ánh xạ hành động và quyền (system.permission_map.manage).");

        var feature = await _context.SystemFeatures
            .Include(f => f.ActionPermissions)
            .FirstOrDefaultAsync(f => f.ActionPermissions.Any(a => a.Id == actionMappingId), cancellationToken);

        if (feature is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy ánh xạ hành động cần xóa.");

        var actionMapping = feature.ActionPermissions.FirstOrDefault(a => a.Id == actionMappingId);
        if (actionMapping is not null)
        {
            _context.SystemFeatureActionPermissions.Remove(actionMapping);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Ok("Xóa ánh xạ hành động thành công.");
    }
}
