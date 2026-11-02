using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Organization.Services;

public class BranchWriteService : IBranchWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public BranchWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> CreateAsync(CreateBranchRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasScopeAsync("org.branch.create", request.LegalEntityId, request.BusinessUnitId, cancellationToken: cancellationToken))
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo chi nhánh/cơ sở trong phạm vi này.");

        var legalEntityExists = await _context.LegalEntities
            .AnyAsync(x => x.Id == request.LegalEntityId && x.Status == EntityStatus.Active, cancellationToken);
        if (!legalEntityExists)
            return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân đang hoạt động.");

        if (request.BusinessUnitId.HasValue)
        {
            var businessUnit = await _context.BusinessUnits
                .FirstOrDefaultAsync(x => x.Id == request.BusinessUnitId.Value && x.Status == EntityStatus.Active, cancellationToken);
            if (businessUnit is null)
                return Result<Guid>.Fail("BUSINESS_UNIT_NOT_FOUND", "Không tìm thấy đơn vị kinh doanh trực thuộc đang hoạt động.");

            if (businessUnit.LegalEntityId != request.LegalEntityId)
                return Result<Guid>.Fail("CROSS_ENTITY_MISMATCH", "Đơn vị kinh doanh được chọn không thuộc pháp nhân này.");
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Branches
            .AnyAsync(x => x.LegalEntityId == request.LegalEntityId && x.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã cơ sở '{code}' đã được sử dụng trong pháp nhân này.");

        var branch = new Branch(
            request.LegalEntityId,
            code,
            request.Name,
            request.BusinessUnitId,
            request.Address,
            request.Status);

        _context.Branches.Add(branch);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            if (await _context.Branches.AnyAsync(
                    x => x.LegalEntityId == request.LegalEntityId && x.Code == code,
                    cancellationToken))
            {
                return Result<Guid>.Fail("DUPLICATE_CODE", $"Mã cơ sở '{code}' đã được sử dụng trong pháp nhân này.");
            }

            throw;
        }

        return Result<Guid>.Ok(branch.Id, "Tạo chi nhánh/cơ sở thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateBranchRequest request, CancellationToken cancellationToken = default)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy chi nhánh/cơ sở.");

        if (!await HasScopeAsync("org.branch.edit", branch.LegalEntityId, branch.BusinessUnitId, branch.Id, cancellationToken))
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền chỉnh sửa chi nhánh/cơ sở này.");

        if (!Convert.TryFromBase64String(request.RowVersionBase64, new byte[8], out var bytesWritten)
            || bytesWritten != 8)
        {
            return Result.Fail("INVALID_ROW_VERSION", "RowVersion không hợp lệ. Vui lòng tải lại dữ liệu.");
        }

        var requestedVersion = Convert.FromBase64String(request.RowVersionBase64);
        if (!requestedVersion.SequenceEqual(branch.RowVersion))
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật bởi phiên làm việc khác. Vui lòng tải lại trước khi sửa.");

        if (request.BusinessUnitId.HasValue)
        {
            var businessUnit = await _context.BusinessUnits
                .FirstOrDefaultAsync(x => x.Id == request.BusinessUnitId.Value && x.Status == EntityStatus.Active, cancellationToken);
            if (businessUnit is null)
                return Result.Fail("BUSINESS_UNIT_NOT_FOUND", "Không tìm thấy đơn vị kinh doanh trực thuộc đang hoạt động.");

            if (businessUnit.LegalEntityId != branch.LegalEntityId)
                return Result.Fail("CROSS_ENTITY_MISMATCH", "Đơn vị kinh doanh được chọn không thuộc pháp nhân của cơ sở này.");
        }

        branch.Update(request.Name, request.BusinessUnitId, request.Address, request.Status);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật chi nhánh/cơ sở thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật bởi phiên làm việc khác. Vui lòng tải lại trước khi sửa.");
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy chi nhánh/cơ sở.");

        if (!await HasScopeAsync("org.branch.delete", branch.LegalEntityId, branch.BusinessUnitId, branch.Id, cancellationToken))
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền ngừng hoạt động chi nhánh/cơ sở này.");

        branch.SoftDelete();

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Đã ngừng hoạt động chi nhánh/cơ sở.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu đã được cập nhật bởi phiên làm việc khác. Vui lòng tải lại trước khi xóa.");
        }
    }

    private async Task<bool> HasScopeAsync(
        string permission,
        Guid legalEntityId,
        Guid? businessUnitId = null,
        Guid? branchId = null,
        CancellationToken cancellationToken = default)
    {
        return _currentUser.UserId.HasValue
            && await _permissionResolver.HasPermissionAsync(
                _currentUser.UserId.Value,
                permission,
                legalEntityId,
                businessUnitId,
                branchId,
                cancellationToken: cancellationToken);
    }
}

