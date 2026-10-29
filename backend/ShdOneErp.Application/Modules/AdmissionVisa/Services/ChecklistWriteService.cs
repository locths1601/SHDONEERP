using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;
using ShdOneErp.Domain.Entities.AdmissionVisa;

namespace ShdOneErp.Application.Modules.AdmissionVisa.Services;

public class ChecklistWriteService : IChecklistWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public ChecklistWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> AddChecklistItemAsync(
        Guid applicationId,
        AddChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.StudentApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId && !a.IsDeleted, cancellationToken);

        if (application == null)
        {
            return Result<Guid>.Fail("APPLICATION_NOT_FOUND", "Không tìm thấy hồ sơ tuyển sinh.");
        }

        if (!await HasPermissionAsync("admission.dossier.upload", application.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền quản lý danh mục tài liệu của hồ sơ này.");
        }

        var normalizedCode = request.ItemCode.Trim().ToUpperInvariant();
        var exists = await _context.ChecklistItems
            .AnyAsync(c => c.StudentApplicationId == applicationId && c.ItemCode == normalizedCode, cancellationToken);

        if (exists)
        {
            return Result<Guid>.Fail("DUPLICATE_CHECKLIST_ITEM", $"Hạng mục tài liệu '{normalizedCode}' đã tồn tại trong hồ sơ này.");
        }

        var item = new ChecklistItem(
            applicationId,
            normalizedCode,
            request.ItemName,
            request.Category,
            request.IsRequired,
            request.Notes);

        _context.ChecklistItems.Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(item.Id, "Thêm hạng mục tài liệu thành công.");
    }

    public async Task<Result> VerifyChecklistItemAsync(
        Guid checklistItemId,
        VerifyChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var item = await _context.ChecklistItems
            .Include(c => c.StudentApplication)
            .FirstOrDefaultAsync(c => c.Id == checklistItemId, cancellationToken);

        if (item == null || item.StudentApplication == null || item.StudentApplication.IsDeleted)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hạng mục tài liệu.");
        }

        if (!await HasPermissionAsync("admission.dossier.verify", item.StudentApplication.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền thẩm định tài liệu tại pháp nhân này.");
        }

        if (!VerifyRowVersion(item.RowVersion, request.RowVersion))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hạng mục đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        item.Verify(currentUserId, request.Notes);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Thẩm định tài liệu thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hạng mục đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> RejectChecklistItemAsync(
        Guid checklistItemId,
        RejectChecklistItemRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var item = await _context.ChecklistItems
            .Include(c => c.StudentApplication)
            .FirstOrDefaultAsync(c => c.Id == checklistItemId, cancellationToken);

        if (item == null || item.StudentApplication == null || item.StudentApplication.IsDeleted)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hạng mục tài liệu.");
        }

        if (!await HasPermissionAsync("admission.dossier.verify", item.StudentApplication.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền thẩm định/từ chối tài liệu tại pháp nhân này.");
        }

        if (!VerifyRowVersion(item.RowVersion, request.RowVersion))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hạng mục đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        item.Reject(currentUserId, request.RejectionReason);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Từ chối hạng mục tài liệu thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hạng mục đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> ResetChecklistItemAsync(
        Guid checklistItemId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var item = await _context.ChecklistItems
            .Include(c => c.StudentApplication)
            .FirstOrDefaultAsync(c => c.Id == checklistItemId, cancellationToken);

        if (item == null || item.StudentApplication == null || item.StudentApplication.IsDeleted)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hạng mục tài liệu.");
        }

        if (!await HasPermissionAsync("admission.dossier.upload", item.StudentApplication.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền thay đổi trạng thái hạng mục tài liệu này.");
        }

        item.ResetToPending();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Đặt lại trạng thái hạng mục về 'Chờ bổ sung' thành công.");
    }

    public async Task<Result<Guid>> LinkDocumentAsync(
        Guid checklistItemId,
        Guid documentId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var item = await _context.ChecklistItems
            .Include(c => c.StudentApplication)
            .FirstOrDefaultAsync(c => c.Id == checklistItemId, cancellationToken);

        if (item == null || item.StudentApplication == null || item.StudentApplication.IsDeleted)
        {
            return Result<Guid>.Fail("NOT_FOUND", "Không tìm thấy hạng mục tài liệu.");
        }

        if (!await HasPermissionAsync("admission.dossier.upload", item.StudentApplication.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tải lên/liên kết tài liệu cho hồ sơ này.");
        }

        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsDeleted, cancellationToken);

        if (document == null)
        {
            return Result<Guid>.Fail("DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu lưu trữ chỉ định.");
        }

        var link = item.LinkDocument(documentId, currentUserId);
        _context.ApplicationDocumentLinks.Add(link);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(link.Id, "Đính kèm tài liệu vào hạng mục thành công.");
    }

    private async Task<bool> HasPermissionAsync(string permissionCode, Guid legalEntityId, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return false;

        return await _permissionResolver.HasPermissionAsync(
            userId.Value,
            permissionCode,
            legalEntityId,
            cancellationToken: cancellationToken);
    }

    private static bool VerifyRowVersion(byte[] currentRowVersion, string requestRowVersionBase64)
    {
        if (currentRowVersion == null || currentRowVersion.Length == 0) return true;
        if (string.IsNullOrWhiteSpace(requestRowVersionBase64)) return false;

        try
        {
            var requestBytes = Convert.FromBase64String(requestRowVersionBase64);
            return currentRowVersion.SequenceEqual(requestBytes);
        }
        catch
        {
            return false;
        }
    }
}

