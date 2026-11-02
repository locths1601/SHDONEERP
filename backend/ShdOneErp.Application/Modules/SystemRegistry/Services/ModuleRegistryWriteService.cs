using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;
using ShdOneErp.Application.Modules.SystemRegistry.Validators;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Application.Modules.SystemRegistry.Services;

public class ModuleRegistryWriteService : IModuleRegistryWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public ModuleRegistryWriteService(
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

    public async Task<Result<Guid>> CreateAsync(CreateModuleRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.module.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền quản trị phân hệ hệ thống (system.module.manage).");

        var validator = new CreateModuleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu phân hệ không hợp lệ.", errors);
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.SystemModules.AnyAsync(m => m.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã phân hệ '{code}' đã tồn tại trong hệ thống.");

        if (request.ParentModuleId.HasValue)
        {
            var parentExists = await _context.SystemModules.AnyAsync(m => m.Id == request.ParentModuleId.Value, cancellationToken);
            if (!parentExists)
                return Result<Guid>.Fail("PARENT_NOT_FOUND", "Không tìm thấy phân hệ cha được chỉ định.");
        }

        var module = new SystemModule(
            code: code,
            name: request.Name,
            description: request.Description,
            version: request.Version,
            orderIndex: request.OrderIndex,
            icon: request.Icon,
            status: request.Status,
            parentModuleId: request.ParentModuleId,
            effectiveFromUtc: request.EffectiveFromUtc,
            effectiveToUtc: request.EffectiveToUtc);

        _context.SystemModules.Add(module);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(module.Id, "Tạo mới phân hệ thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateModuleRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.module.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền quản trị phân hệ hệ thống (system.module.manage).");

        var validator = new UpdateModuleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result.Fail("VALIDATION_ERROR", "Dữ liệu phân hệ không hợp lệ.", errors);
        }

        var module = await _context.SystemModules.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (module is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy phân hệ cần cập nhật.");

        if (request.ParentModuleId.HasValue)
        {
            if (request.ParentModuleId.Value == id)
                return Result.Fail("INVALID_PARENT", "Phân hệ không thể tự làm phân hệ cha của chính nó.");

            var parentExists = await _context.SystemModules.AnyAsync(m => m.Id == request.ParentModuleId.Value, cancellationToken);
            if (!parentExists)
                return Result.Fail("PARENT_NOT_FOUND", "Không tìm thấy phân hệ cha được chỉ định.");

            // Kiểm tra vòng lặp cha con (Circular reference check)
            var currentParentId = request.ParentModuleId;
            var visited = new HashSet<Guid> { id };
            while (currentParentId.HasValue)
            {
                if (visited.Contains(currentParentId.Value))
                    return Result.Fail("CIRCULAR_DEPENDENCY", "Cấu trúc phân hệ cha con bị vòng lặp phân cấp.");

                visited.Add(currentParentId.Value);
                var p = await _context.SystemModules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == currentParentId.Value, cancellationToken);
                currentParentId = p?.ParentModuleId;
            }
        }

        module.Update(
            name: request.Name,
            description: request.Description,
            version: request.Version,
            orderIndex: request.OrderIndex,
            icon: request.Icon,
            status: request.Status,
            parentModuleId: request.ParentModuleId,
            effectiveFromUtc: request.EffectiveFromUtc,
            effectiveToUtc: request.EffectiveToUtc);

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Ok("Cập nhật phân hệ thành công.");
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.module.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền xóa phân hệ hệ thống (system.module.manage).");

        var module = await _context.SystemModules.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (module is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy phân hệ cần xóa.");

        var hasFeatures = await _context.SystemFeatures.AnyAsync(f => f.ModuleId == id, cancellationToken);
        if (hasFeatures)
            return Result.Fail("HAS_DEPENDENT_RECORDS", "Không thể xóa phân hệ đang chứa các tính năng nghiệp vụ. Hãy xóa hoặc di chuyển tính năng trước.");

        var hasChildModules = await _context.SystemModules.AnyAsync(m => m.ParentModuleId == id, cancellationToken);
        if (hasChildModules)
            return Result.Fail("HAS_DEPENDENT_RECORDS", "Không thể xóa phân hệ đang có phân hệ con trực thuộc.");

        _context.SystemModules.Remove(module);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Xóa phân hệ thành công.");
    }

    public async Task<Result<Guid>> AddDependencyAsync(Guid moduleId, AddModuleDependencyRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.module.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền quản trị quan hệ phụ thuộc phân hệ.");

        var validator = new AddModuleDependencyRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu quan hệ phụ thuộc không hợp lệ.", errors);
        }

        if (moduleId == request.DependsOnModuleId)
            return Result<Guid>.Fail("SELF_DEPENDENCY", "Phân hệ không thể tự phụ thuộc vào chính nó.");

        var module = await _context.SystemModules.Include(m => m.Dependencies).FirstOrDefaultAsync(m => m.Id == moduleId, cancellationToken);
        if (module is null)
            return Result<Guid>.Fail("NOT_FOUND", "Không tìm thấy phân hệ nguồn.");

        var targetModule = await _context.SystemModules.FirstOrDefaultAsync(m => m.Id == request.DependsOnModuleId, cancellationToken);
        if (targetModule is null)
            return Result<Guid>.Fail("DEPENDENCY_NOT_FOUND", "Không tìm thấy phân hệ mục tiêu phụ thuộc.");

        var alreadyDepends = module.Dependencies.Any(d => d.DependsOnModuleId == request.DependsOnModuleId);
        if (alreadyDepends)
            return Result<Guid>.Fail("DUPLICATE_DEPENDENCY", "Quan hệ phụ thuộc này đã tồn tại.");

        var dependency = new SystemModuleDependency(
            moduleId: moduleId,
            dependsOnModuleId: request.DependsOnModuleId,
            dependencyType: request.DependencyType,
            minVersion: request.MinVersion);

        _context.SystemModuleDependencies.Add(dependency);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(dependency.Id, "Thêm quan hệ phụ thuộc phân hệ thành công.");
    }

    public async Task<Result> RemoveDependencyAsync(Guid dependencyId, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.module.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền xóa quan hệ phụ thuộc phân hệ.");

        var module = await _context.SystemModules
            .Include(m => m.Dependencies)
            .FirstOrDefaultAsync(m => m.Dependencies.Any(d => d.Id == dependencyId), cancellationToken);

        if (module is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy quan hệ phụ thuộc cần xóa.");

        var dep = module.Dependencies.FirstOrDefault(d => d.Id == dependencyId);
        if (dep is not null)
        {
            _context.SystemModuleDependencies.Remove(dep);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Ok("Xóa quan hệ phụ thuộc thành công.");
    }
}
