using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Organization.Services;

public class BusinessUnitWriteService : IBusinessUnitWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public BusinessUnitWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> CreateAsync(CreateBusinessUnitRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasScopeAsync("org.business_unit.create", request.LegalEntityId, cancellationToken: cancellationToken))
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo đơn vị kinh doanh trong pháp nhân này.");

        var legalEntityExists = await _context.LegalEntities
            .AnyAsync(x => x.Id == request.LegalEntityId && x.Status == EntityStatus.Active, cancellationToken);
        if (!legalEntityExists)
            return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân đang hoạt động.");

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.BusinessUnits
            .AnyAsync(x => x.LegalEntityId == request.LegalEntityId && x.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã đơn vị '{code}' đã được sử dụng trong pháp nhân này.");

        var entity = new BusinessUnit(request.LegalEntityId, code, request.Name, request.Status);
        _context.BusinessUnits.Add(entity);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await _context.BusinessUnits.AnyAsync(
                    x => x.LegalEntityId == request.LegalEntityId && x.Code == code,
                    cancellationToken))
            {
                return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã đơn vị '{code}' đã được sử dụng trong pháp nhân này.");
            }

            throw;
        }

        return Result<Guid>.Ok(entity.Id, "Tạo đơn vị kinh doanh thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateBusinessUnitRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.BusinessUnits.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy đơn vị kinh doanh.");

        if (!await HasScopeAsync("org.business_unit.edit", entity.LegalEntityId, entity.Id, cancellationToken))
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền chỉnh sửa đơn vị kinh doanh này.");

        if (!Convert.TryFromBase64String(request.RowVersionBase64, new byte[8], out var bytesWritten)
            || bytesWritten != 8)
        {
            return Result.Fail("INVALID_ROW_VERSION", "RowVersion không hợp lệ. Vui lòng tải lại dữ liệu.");
        }

        var requestedVersion = Convert.FromBase64String(request.RowVersionBase64);
        if (!requestedVersion.SequenceEqual(entity.RowVersion))
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật. Vui lòng tải lại trước khi sửa.");

        entity.Update(request.Name, request.Status);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật đơn vị kinh doanh thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật. Vui lòng tải lại trước khi sửa.");
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.BusinessUnits.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy đơn vị kinh doanh.");

        if (!await HasScopeAsync("org.business_unit.delete", entity.LegalEntityId, entity.Id, cancellationToken))
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền ngừng hoạt động đơn vị kinh doanh này.");

        var hasBranches = await _context.Branches.AnyAsync(x => x.BusinessUnitId == id, cancellationToken);
        if (hasBranches)
            return Result.Fail("HAS_DEPENDENT_RECORDS", "Không thể xóa đơn vị đang có chi nhánh trực thuộc.");

        entity.SoftDelete();
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Đã ngừng hoạt động đơn vị kinh doanh.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật. Vui lòng tải lại trước khi xóa.");
        }
    }

    private async Task<bool> HasScopeAsync(
        string permission,
        Guid legalEntityId,
        Guid? businessUnitId = null,
        CancellationToken cancellationToken = default)
    {
        return _currentUser.UserId.HasValue
            && await _permissionResolver.HasPermissionAsync(
                _currentUser.UserId.Value,
                permission,
                legalEntityId,
                businessUnitId,
                cancellationToken: cancellationToken);
    }
}
