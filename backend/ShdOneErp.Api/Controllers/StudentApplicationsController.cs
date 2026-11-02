using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/admissions/applications")]
[Authorize]
public class StudentApplicationsController : ApiControllerBase
{
    private readonly IStudentApplicationReadService _readService;
    private readonly IStudentApplicationWriteService _writeService;
    private readonly ICurrentUser _currentUser;

    public StudentApplicationsController(
        IStudentApplicationReadService readService,
        IStudentApplicationWriteService writeService,
        ICurrentUser currentUser)
    {
        _readService = readService;
        _writeService = writeService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Lấy danh sách hồ sơ tuyển sinh / du học phân trang qua Stored Procedure
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "Permission:admission.application.view")]
    public async Task<IActionResult> GetPaged([FromQuery] StudentApplicationFilterQuery query, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _readService.GetApplicationsPagedAsync(query, currentUserId, cancellationToken);
        return ApiOk(result);
    }

    /// <summary>
    /// Lấy chi tiết hồ sơ tuyển sinh / du học và danh mục checklist tài liệu đính kèm
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:admission.application.view")]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var application = await _readService.GetApplicationDetailAsync(id, currentUserId, cancellationToken);
        if (application == null)
        {
            return ApiError("NOT_FOUND", $"Không tìm thấy hồ sơ tuyển sinh với ID '{id}'.", StatusCodes.Status404NotFound);
        }

        return ApiOk(application);
    }

    /// <summary>
    /// Lấy danh sách hồ sơ tuyển sinh theo ID học viên (1 học viên có thể có nhiều hồ sơ)
    /// </summary>
    [HttpGet("by-student/{studentPartyId:guid}")]
    [Authorize(Policy = "Permission:admission.application.view")]
    public async Task<IActionResult> GetByStudentPartyId([FromRoute] Guid studentPartyId, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var list = await _readService.GetApplicationsByStudentPartyIdAsync(studentPartyId, currentUserId, cancellationToken);
        return ApiOk(list);
    }

    /// <summary>
    /// Tạo mới một hồ sơ tuyển sinh / du học (tự động khởi tạo danh mục checklist tiêu chuẩn)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "Permission:admission.application.create")]
    public async Task<IActionResult> Create([FromBody] CreateStudentApplicationRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.CreateApplicationAsync(request, currentUserId, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/admissions/applications/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Cập nhật thông tin mục tiêu/kỳ tuyển sinh/chương trình của hồ sơ
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:admission.application.edit")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateStudentApplicationRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.UpdateApplicationAsync(id, request, currentUserId, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Cập nhật trạng thái quy trình hồ sơ tuyển sinh (Draft -> Submitted -> UnderReview -> Accepted / Rejected / Withdrawn)
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = "Permission:admission.application.edit")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] UpdateStudentApplicationStatusRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.UpdateStatusAsync(id, request, currentUserId, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Xóa mềm một hồ sơ tuyển sinh
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:admission.application.delete")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId ?? Guid.Empty;
        var result = await _writeService.DeleteApplicationAsync(id, currentUserId, cancellationToken);
        return FromResult(result);
    }
}

