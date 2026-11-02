using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Api.Controllers;

[ApiController]
[Authorize]
public class ChecklistsController : ApiControllerBase
{
    private readonly IChecklistReadService _readService;
    private readonly IChecklistWriteService _writeService;
    private readonly IDocumentStorageService _documentStorageService;
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ChecklistsController(
        IChecklistReadService readService,
        IChecklistWriteService writeService,
        IDocumentStorageService documentStorageService,
        IShdOneErpDbContext context,
        ICurrentUser currentUser)
    {
        _readService = readService;
        _writeService = writeService;
        _documentStorageService = documentStorageService;
        _context = context;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Lấy danh sách hạng mục checklist tài liệu của hồ sơ tuyển sinh
    /// </summary>
    [HttpGet("api/v1/admissions/applications/{applicationId:guid}/checklist")]
    [Authorize(Policy = "Permission:admission.dossier.view")]
    public async Task<IActionResult> GetChecklist([FromRoute] Guid applicationId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var items = await _readService.GetChecklistByApplicationIdAsync(applicationId, currentUserId, cancellationToken);
        return ApiOk(items);
    }

    /// <summary>
    /// Thêm một hạng mục tài liệu tùy chỉnh vào hồ sơ tuyển sinh
    /// </summary>
    [HttpPost("api/v1/admissions/applications/{applicationId:guid}/checklist")]
    [Authorize(Policy = "Permission:admission.dossier.upload")]
    public async Task<IActionResult> AddChecklistItem(
        [FromRoute] Guid applicationId,
        [FromBody] AddChecklistItemRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.AddChecklistItemAsync(applicationId, request, currentUserId, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/admissions/applications/{applicationId}/checklist/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Thẩm định và xác nhận hợp lệ hạng mục tài liệu (Verified)
    /// </summary>
    [HttpPost("api/v1/admissions/applications/{applicationId:guid}/checklist/{itemId:guid}/verify")]
    [Authorize(Policy = "Permission:admission.dossier.verify")]
    public async Task<IActionResult> VerifyItem(
        [FromRoute] Guid applicationId,
        [FromRoute] Guid itemId,
        [FromBody] VerifyChecklistItemRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.VerifyChecklistItemAsync(itemId, request, currentUserId, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Thẩm định và từ chối hạng mục tài liệu (kèm lý do bổ sung/sửa đổi)
    /// </summary>
    [HttpPost("api/v1/admissions/applications/{applicationId:guid}/checklist/{itemId:guid}/reject")]
    [Authorize(Policy = "Permission:admission.dossier.verify")]
    public async Task<IActionResult> RejectItem(
        [FromRoute] Guid applicationId,
        [FromRoute] Guid itemId,
        [FromBody] RejectChecklistItemRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.RejectChecklistItemAsync(itemId, request, currentUserId, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Đặt lại trạng thái hạng mục tài liệu về Chờ bổ sung (Pending)
    /// </summary>
    [HttpPost("api/v1/admissions/applications/{applicationId:guid}/checklist/{itemId:guid}/reset")]
    [Authorize(Policy = "Permission:admission.dossier.upload")]
    public async Task<IActionResult> ResetItem(
        [FromRoute] Guid applicationId,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.ResetChecklistItemAsync(itemId, currentUserId, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Tải lên tập tin tài liệu số hóa và gắn vào hạng mục hồ sơ tuyển sinh
    /// </summary>
    [HttpPost("api/v1/admissions/applications/{applicationId:guid}/checklist/{itemId:guid}/upload")]
    [Authorize(Policy = "Permission:admission.dossier.upload")]
    [RequestSizeLimit(52428800)] // 50 MB
    public async Task<IActionResult> UploadDocument(
        [FromRoute] Guid applicationId,
        [FromRoute] Guid itemId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return ApiError("EMPTY_FILE", "Vui lòng chọn tập tin hợp lệ.", StatusCodes.Status400BadRequest);
        }

        var application = await _context.StudentApplications
            .FirstOrDefaultAsync(a => a.Id == applicationId && !a.IsDeleted, cancellationToken);

        if (application == null)
        {
            return ApiError("APPLICATION_NOT_FOUND", "Không tìm thấy hồ sơ tuyển sinh.", StatusCodes.Status404NotFound);
        }

        var currentUserId = _currentUser.UserId ?? Guid.Empty;

        using var stream = file.OpenReadStream();
        var stored = await _documentStorageService.StoreDocumentAsync(
            stream,
            file.FileName,
            file.ContentType,
            DataClassification.Confidential,
            application.LegalEntityId,
            currentUserId,
            cancellationToken);

        var linkResult = await _writeService.LinkDocumentAsync(itemId, stored.DocumentId, currentUserId, cancellationToken);
        if (!linkResult.Success)
            return FromResult(linkResult);

        return ApiCreated($"/api/v1/admissions/documents/{stored.DocumentId}/download", new
        {
            documentId = stored.DocumentId,
            linkId = linkResult.Data,
            fileName = file.FileName,
            fileSize = stored.FileSizeBytes,
            sha256 = stored.Sha256Checksum
        }, "Tải lên và đính kèm tài liệu thành công.");
    }

    /// <summary>
    /// Tải xuống tập tin tài liệu đã được cấp quyền bảo mật
    /// </summary>
    [HttpGet("api/v1/admissions/documents/{documentId:guid}/download")]
    [Authorize(Policy = "Permission:admission.dossier.view")]
    public async Task<IActionResult> DownloadDocument([FromRoute] Guid documentId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var document = await _context.Documents
            .FirstOrDefaultAsync(d => d.Id == documentId && !d.IsDeleted, cancellationToken);

        if (document == null)
        {
            return ApiError("NOT_FOUND", "Không tìm thấy tài liệu.", StatusCodes.Status404NotFound);
        }

        var stream = await _documentStorageService.GetDocumentStreamAsync(documentId, currentUserId, cancellationToken);
        if (stream == null)
        {
            return ApiError("ACCESS_DENIED", "Bạn không có quyền truy cập hoặc tập tin không tồn tại.", StatusCodes.Status403Forbidden);
        }

        return File(stream, document.ContentType, document.OriginalFileName);
    }
}

