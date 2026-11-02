using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;
using ShdOneErp.Application.Modules.SystemReferenceData.Validators;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Services;

public class MasterDataItemWriteService : IMasterDataItemWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;
    private readonly IAuditLogService? _auditLogService;

    public MasterDataItemWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver,
        IAuditLogService? auditLogService = null)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
        _auditLogService = auditLogService;
    }

    private async Task<bool> HasPermissionAsync(string permissionCode, CancellationToken cancellationToken)
    {
        if (_currentUser.IsAdmin) return true;
        if (!_currentUser.UserId.HasValue) return false;

        return await _permissionResolver.HasPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken: cancellationToken);
    }

    private async Task LogAuditAsync(string action, MasterDataItem item, string? oldValues, string? newValues, CancellationToken cancellationToken)
    {
        if (_auditLogService is null) return;

        try
        {
            await _auditLogService.LogAsync(new AuditLogEntry
            {
                Action = action,
                EntityName = nameof(MasterDataItem),
                EntityId = item.Id.ToString(),
                OldValues = oldValues,
                NewValues = newValues,
                UserId = _currentUser.UserId,
                UserName = _currentUser.Username
            }, cancellationToken);
        }
        catch
        {
            // Không làm gián đoạn luồng nghiệp vụ chính nếu ghi audit gặp sự cố
        }
    }

    public async Task<Result<Guid>> CreateAsync(Guid catalogId, CreateItemRequest request, CancellationToken cancellationToken = default)
    {
        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == catalogId, cancellationToken);
        if (catalog is null)
            return Result<Guid>.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (!catalog.IsActive)
            return Result<Guid>.Fail("CATALOG_INACTIVE", "Không thể tạo giá trị mới trong nhóm danh mục đang ngừng hoạt động.");

        if (catalog.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Nhóm danh mục hệ thống cốt lõi chỉ cho phép quản trị viên hệ thống (system_admin) thao tác.");

        if (!catalog.IsSystem && !await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result<Guid>.Fail("FORBIDDEN", "Bạn không có quyền tạo giá trị danh mục (system.reference_data.manage).");

        var validator = new CreateItemRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result<Guid>.Fail("VALIDATION_ERROR", "Dữ liệu giá trị danh mục không hợp lệ.", errors);
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.MasterDataItems.AnyAsync(i => i.CatalogId == catalogId && i.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã giá trị '{code}' đã tồn tại trong nhóm danh mục này.");

        if (request.ParentItemId.HasValue)
        {
            var parentExists = await _context.MasterDataItems.AnyAsync(i => i.Id == request.ParentItemId.Value && i.CatalogId == catalogId, cancellationToken);
            if (!parentExists)
                return Result<Guid>.Fail("INVALID_PARENT_ITEM", "Giá trị cha phải thuộc cùng nhóm danh mục.");
        }

        try
        {
            var item = new MasterDataItem(
                catalogId,
                code,
                request.Name,
                request.Value,
                request.DisplayOrder,
                request.ParentItemId,
                request.MetadataJson);

            _context.MasterDataItems.Add(item);
            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync("CREATE", item, null, System.Text.Json.JsonSerializer.Serialize(new
            {
                item.Id,
                item.CatalogId,
                item.Code,
                item.Name,
                item.Value,
                item.DisplayOrder,
                item.ParentItemId
            }), cancellationToken);

            return Result<Guid>.Ok(item.Id, "Tạo mới giá trị danh mục thành công.");
        }
        catch (DomainException ex)
        {
            return Result<Guid>.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> UpdateAsync(Guid catalogId, Guid itemId, UpdateItemRequest request, CancellationToken cancellationToken = default)
    {
        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == catalogId, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (!catalog.IsActive)
            return Result.Fail("CATALOG_INACTIVE", "Không thể chỉnh sửa giá trị trong nhóm danh mục đang ngừng hoạt động.");

        if (catalog.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result.Fail("FORBIDDEN", "Nhóm danh mục hệ thống cốt lõi chỉ cho phép quản trị viên hệ thống (system_admin) thao tác.");

        if (!catalog.IsSystem && !await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền chỉnh sửa giá trị danh mục (system.reference_data.manage).");

        var validator = new UpdateItemRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => new ErrorDetail(e.PropertyName, e.ErrorMessage)).ToList();
            return Result.Fail("VALIDATION_ERROR", "Dữ liệu cập nhật giá trị danh mục không hợp lệ.", errors);
        }

        var item = await _context.MasterDataItems.FirstOrDefaultAsync(i => i.Id == itemId && i.CatalogId == catalogId, cancellationToken);
        if (item is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy giá trị danh mục trong nhóm này.");

        if (request.ParentItemId.HasValue)
        {
            if (request.ParentItemId.Value == itemId)
                return Result.Fail("CANNOT_PARENT_SELF", "Giá trị danh mục không thể làm cha chính nó.");

            var parentExists = await _context.MasterDataItems.AnyAsync(i => i.Id == request.ParentItemId.Value && i.CatalogId == catalogId, cancellationToken);
            if (!parentExists)
                return Result.Fail("INVALID_PARENT_ITEM", "Giá trị cha phải thuộc cùng nhóm danh mục.");

            // Kiểm tra vòng lặp phân cấp (cyclic hierarchy)
            var currentParentId = (Guid?)request.ParentItemId.Value;
            var visited = new HashSet<Guid> { itemId };
            while (currentParentId.HasValue)
            {
                if (visited.Contains(currentParentId.Value))
                    return Result.Fail("CYCLIC_HIERARCHY", "Phát hiện quan hệ phân cấp tạo thành vòng lặp không hợp lệ.");

                visited.Add(currentParentId.Value);
                var ancestor = await _context.MasterDataItems.AsNoTracking().FirstOrDefaultAsync(i => i.Id == currentParentId.Value, cancellationToken);
                currentParentId = ancestor?.ParentItemId;
            }
        }

        var oldValuesJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            item.Name,
            item.Value,
            item.DisplayOrder,
            item.ParentItemId,
            item.MetadataJson
        });

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataItems.Entry(item).OriginalValues[nameof(MasterDataItem.RowVersion)] = originalRowVersion;
            }

            item.UpdateDetails(
                request.Name,
                request.Value,
                request.DisplayOrder,
                request.ParentItemId,
                request.MetadataJson);

            await _context.SaveChangesAsync(cancellationToken);

            var newValuesJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                item.Name,
                item.Value,
                item.DisplayOrder,
                item.ParentItemId,
                item.MetadataJson
            });

            await LogAuditAsync("UPDATE", item, oldValuesJson, newValuesJson, cancellationToken);

            return Result.Ok("Cập nhật giá trị danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu giá trị danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> DeactivateAsync(Guid catalogId, Guid itemId, ChangeItemStatusRequest request, CancellationToken cancellationToken = default)
    {
        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == catalogId, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (!catalog.IsActive)
            return Result.Fail("CATALOG_INACTIVE", "Không thể thao tác trên nhóm danh mục đang ngừng hoạt động.");

        if (catalog.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result.Fail("FORBIDDEN", "Nhóm danh mục hệ thống cốt lõi chỉ cho phép quản trị viên hệ thống (system_admin) thao tác.");

        if (!catalog.IsSystem && !await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền vô hiệu hóa giá trị danh mục (system.reference_data.manage).");

        var item = await _context.MasterDataItems.FirstOrDefaultAsync(i => i.Id == itemId && i.CatalogId == catalogId, cancellationToken);
        if (item is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy giá trị danh mục.");

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataItems.Entry(item).OriginalValues[nameof(MasterDataItem.RowVersion)] = originalRowVersion;
            }

            item.Deactivate();
            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync("DEACTIVATE", item, null, null, cancellationToken);

            return Result.Ok("Đã vô hiệu hóa giá trị danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu giá trị danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }

    public async Task<Result> ActivateAsync(Guid catalogId, Guid itemId, ChangeItemStatusRequest request, CancellationToken cancellationToken = default)
    {
        var catalog = await _context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == catalogId, cancellationToken);
        if (catalog is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm danh mục.");

        if (!catalog.IsActive)
            return Result.Fail("CATALOG_INACTIVE", "Không thể kích hoạt giá trị thuộc nhóm danh mục đang ngừng hoạt động.");

        if (catalog.IsSystem && !await HasPermissionAsync("system.reference_data.system_admin", cancellationToken))
            return Result.Fail("FORBIDDEN", "Nhóm danh mục hệ thống cốt lõi chỉ cho phép quản trị viên hệ thống (system_admin) thao tác.");

        if (!catalog.IsSystem && !await HasPermissionAsync("system.reference_data.manage", cancellationToken))
            return Result.Fail("FORBIDDEN", "Bạn không có quyền kích hoạt giá trị danh mục (system.reference_data.manage).");

        var item = await _context.MasterDataItems.FirstOrDefaultAsync(i => i.Id == itemId && i.CatalogId == catalogId, cancellationToken);
        if (item is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy giá trị danh mục.");

        try
        {
            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                var originalRowVersion = Convert.FromBase64String(request.RowVersion);
                _context.MasterDataItems.Entry(item).OriginalValues[nameof(MasterDataItem.RowVersion)] = originalRowVersion;
            }

            item.Activate();
            await _context.SaveChangesAsync(cancellationToken);

            await LogAuditAsync("ACTIVATE", item, null, null, cancellationToken);

            return Result.Ok("Đã kích hoạt lại giá trị danh mục thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu giá trị danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.");
        }
        catch (DomainException ex)
        {
            return Result.Fail(ex.Code, ex.Message);
        }
    }
}

