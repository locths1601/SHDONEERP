using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;
using ShdOneErp.Application.Modules.SystemReferenceData.Validators;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Services;

public class MasterDataCatalogWriteService : IMasterDataCatalogWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public MasterDataCatalogWriteService(
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

        return await _permissionResolver.HasPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken: cancellationToken);
    }

    public async Task<Result<Guid>> CreateAsync(CreateCatalogRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền tạo nhóm danh mục dữ liệu nguồn (system.reference_data.manage).");

        if (request.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Chỉ quản trị viên hệ thống cấp cao mới được tạo nhóm danh mục hệ thống cốt lõi.");

        var validator = new CreateCatalogRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu nhóm danh mục không hợp lệ.", errors);
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.MasterDataCatalogs.AnyAsync(c => c.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã nhóm danh mục '{code}' đã tồn tại trong hệ thống.");

        try
        {
            var catalog = new MasterDataCatalog(
                code,
                request.Name,
                request.Description,
                request.OwnerModule,
                request.IsSystem);

            _context.MasterDataCatalogs.Add(catalog);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Ok(catalog.Id, "Tạo mới nhóm danh mục thành công.");
        }
        catch (DomainException ex)
        {
            return Result<Guid>.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateCatalogRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền chỉnh sửa nhóm danh mục dữ liệu nguồn (system.reference_data.manage).");

        var validator = new UpdateCatalogRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result.Fail("VALIDATION_ERROR", "Dữ liệu cập nhật nhóm danh mục không hợp lệ.", errors);
        }

        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (catalog.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result.Fail("FORBIDDEN", "Chỉ quản trị viên hệ thống cấp cao mới được chỉnh sửa nhóm danh mục hệ thống cốt lõi.");

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataCatalogs.Entry(catalog).OriginalValues[nameof(MasterDataCatalog.RowVersion)] = originalRowVersion;
            }

            catalog.UpdateDetails(request.Name, request.Description);
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Ok("Cập nhật thông tin nhóm danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu nhóm danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> DeactivateAsync(Guid id, ChangeCatalogStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền đổi trạng thái nhóm danh mục (system.reference_data.manage).");

        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (catalog.IsSystem)
            return Result.Fail("CANNOT_DEACTIVATE_SYSTEM_CATALOG", "Không thể ngừng sử dụng nhóm danh mục hệ thống cốt lõi.");

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataCatalogs.Entry(catalog).OriginalValues[nameof(MasterDataCatalog.RowVersion)] = originalRowVersion;
            }

            catalog.Deactivate();
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Ok("Đã ngừng sử dụng nhóm danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu nhóm danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> ActivateAsync(Guid id, ChangeCatalogStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền kích hoạt nhóm danh mục (system.reference_data.manage).");

        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataCatalogs.Entry(catalog).OriginalValues[nameof(MasterDataCatalog.RowVersion)] = originalRowVersion;
            }

            catalog.Activate();
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Ok("Đã kích hoạt lại nhóm danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu nhóm danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }
}

