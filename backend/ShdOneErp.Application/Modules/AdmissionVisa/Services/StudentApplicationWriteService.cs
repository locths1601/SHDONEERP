using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;
using ShdOneErp.Domain.Entities.AdmissionVisa;

namespace ShdOneErp.Application.Modules.AdmissionVisa.Services;

public class StudentApplicationWriteService : IStudentApplicationWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;

    public StudentApplicationWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
    }

    public async Task<Result<Guid>> CreateApplicationAsync(
        CreateStudentApplicationRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        if (!await HasPermissionAsync("admission.application.create", request.LegalEntityId, cancellationToken))
        {
            return Result<Guid>.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền tạo hồ sơ tuyển sinh tại pháp nhân này.");
        }

        var studentExists = await _context.Parties.AnyAsync(p => p.Id == request.StudentPartyId && !p.IsDeleted, cancellationToken);
        if (!studentExists)
        {
            return Result<Guid>.Fail("STUDENT_NOT_FOUND", "Không tìm thấy hồ sơ học viên chỉ định.");
        }

        var legalEntityExists = await _context.LegalEntities.AnyAsync(le => le.Id == request.LegalEntityId && !le.IsDeleted, cancellationToken);
        if (!legalEntityExists)
        {
            return Result<Guid>.Fail("LEGAL_ENTITY_NOT_FOUND", "Không tìm thấy pháp nhân tiếp nhận chỉ định.");
        }

        string applicationCode = request.ApplicationCode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(applicationCode))
        {
            applicationCode = $"APP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        }
        else
        {
            var codeExists = await _context.StudentApplications.AnyAsync(a => a.ApplicationCode == applicationCode && !a.IsDeleted, cancellationToken);
            if (codeExists)
            {
                return Result<Guid>.Fail("DUPLICATE_APPLICATION_CODE", $"Mã hồ sơ '{applicationCode}' đã tồn tại.");
            }
        }

        var application = new StudentApplication(
            applicationCode,
            request.StudentPartyId,
            request.LegalEntityId,
            request.TargetMarket,
            request.IntakeTerm,
            request.ProgramName,
            request.BusinessUnitId,
            request.BranchId,
            request.AssignedUserId,
            request.Notes);

        application.InitializeStandardChecklist();

        _context.StudentApplications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(application.Id, "Tạo hồ sơ tuyển sinh/du học thành công.");
    }

    public async Task<Result> UpdateApplicationAsync(
        Guid id,
        UpdateStudentApplicationRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.StudentApplications
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken);

        if (application == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ tuyển sinh.");
        }

        if (!await HasPermissionAsync("admission.application.edit", application.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền chỉnh sửa hồ sơ tuyển sinh này.");
        }

        if (!VerifyRowVersion(application.RowVersion, request.RowVersion))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        application.Update(request.TargetMarket, request.IntakeTerm, request.ProgramName, request.Notes);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật thông tin hồ sơ tuyển sinh thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> UpdateStatusAsync(
        Guid id,
        UpdateStudentApplicationStatusRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.StudentApplications
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken);

        if (application == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ tuyển sinh.");
        }

        if (!await HasPermissionAsync("admission.application.edit", application.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền cập nhật trạng thái hồ sơ tuyển sinh này.");
        }

        if (!VerifyRowVersion(application.RowVersion, request.RowVersion))
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại.");
        }

        application.UpdateStatus(request.Status, request.Notes);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Ok("Cập nhật trạng thái hồ sơ thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác.");
        }
    }

    public async Task<Result> DeleteApplicationAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var application = await _context.StudentApplications
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken);

        if (application == null)
        {
            return Result.Fail("NOT_FOUND", "Không tìm thấy hồ sơ tuyển sinh.");
        }

        if (!await HasPermissionAsync("admission.application.delete", application.LegalEntityId, cancellationToken))
        {
            return Result.Fail("UNAUTHORIZED_SCOPE", "Bạn không có quyền xóa hồ sơ tuyển sinh này.");
        }

        application.SoftDelete();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Xóa hồ sơ tuyển sinh thành công.");
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

