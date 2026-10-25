using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;

namespace ShdOneErp.Application.Modules.Organization.Services;

public class LegalEntityWriteService : ILegalEntityWriteService
{
    private readonly IShdOneErpDbContext _context;

    public LegalEntityWriteService(IShdOneErpDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> CreateAsync(CreateLegalEntityRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        // Kiểm tra trùng lặp mã pháp nhân
        var codeExists = await _context.LegalEntities
            .AnyAsync(x => x.Code == normalizedCode && !x.IsDeleted, cancellationToken);

        if (codeExists)
        {
            return Result<Guid>.Fail(
                "DUPLICATE_CODE",
                $"Mã pháp nhân '{normalizedCode}' đã tồn tại trong hệ thống.",
                new List<ErrorDetail> { new("Code", "Mã pháp nhân đã được sử dụng.") });
        }

        var entity = new LegalEntity(
            normalizedCode,
            request.Name,
            request.TradingName,
            request.TaxCode,
            request.Address,
            request.PhoneNumber,
            request.Email,
            request.Website,
            request.Status);

        _context.LegalEntities.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(entity.Id, "Tạo pháp nhân mới thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateLegalEntityRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LegalEntities
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (entity == null)
        {
            return Result.Fail("NOT_FOUND", $"Không tìm thấy pháp nhân có ID '{id}'.");
        }

        // Kiểm tra đụng độ phiên bản (Optimistic Concurrency Control)
        if (!string.IsNullOrEmpty(request.RowVersionBase64) && entity.RowVersion != null && entity.RowVersion.Length > 0)
        {
            var requestRowVersion = Convert.FromBase64String(request.RowVersionBase64);
            if (!requestRowVersion.SequenceEqual(entity.RowVersion))
            {
                return Result.Fail(
                    "CONCURRENCY_CONFLICT",
                    "Dữ liệu pháp nhân đã được chỉnh sửa bởi người dùng khác. Vui lòng tải lại và thử lại.");
            }
        }

        entity.Update(
            request.Name,
            request.TradingName,
            request.TaxCode,
            request.Address,
            request.PhoneNumber,
            request.Email,
            request.Website,
            request.Status);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật thông tin pháp nhân thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail(
                "CONCURRENCY_CONFLICT",
                "Dữ liệu pháp nhân đã được cập nhật bởi một phiên làm việc khác.");
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LegalEntities
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (entity == null)
        {
            return Result.Fail("NOT_FOUND", $"Không tìm thấy pháp nhân có ID '{id}'.");
        }

        // Kiểm tra ràng buộc: Có BusinessUnit hoặc Branch đang hoạt động không
        var hasActiveUnits = await _context.BusinessUnits
            .AnyAsync(x => x.LegalEntityId == id && !x.IsDeleted, cancellationToken);

        if (hasActiveUnits)
        {
            return Result.Fail(
                "HAS_DEPENDENT_RECORDS",
                "Không thể xóa pháp nhân đang có đơn vị kinh doanh trực thuộc. Vui lòng gỡ bỏ các đơn vị liên quan trước.");
        }

        entity.SoftDelete();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Xóa pháp nhân thành công.");
    }
}
