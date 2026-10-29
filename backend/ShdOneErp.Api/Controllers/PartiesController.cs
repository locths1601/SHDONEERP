using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Party360.DTOs;
using ShdOneErp.Application.Modules.Party360.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/parties")]
[Authorize]
public class PartiesController : ApiControllerBase
{
    private readonly IPartyReadService _readService;
    private readonly IPartyWriteService _writeService;

    public PartiesController(
        IPartyReadService readService,
        IPartyWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    /// <summary>
    /// Lấy danh sách định danh Party (Person và Organization) phân trang qua Stored Procedure
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "Permission:party.profile.view")]
    public async Task<IActionResult> GetPaged([FromQuery] PartyFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    /// <summary>
    /// Lấy chi tiết hồ sơ Party 360 (thông tin cá nhân/tổ chức, danh sách vai trò và phương thức liên hệ)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:party.profile.view")]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var party = await _readService.GetByIdAsync(id, cancellationToken);
        if (party == null)
        {
            return ApiError("NOT_FOUND", $"Không tìm thấy hồ sơ Party với ID '{id}'.", StatusCodes.Status404NotFound);
        }

        return ApiOk(party);
    }

    /// <summary>
    /// Tạo mới một hồ sơ cá nhân (Person Party - Học viên, Phụ huynh, Ứng viên)
    /// </summary>
    [HttpPost("person")]
    [Authorize(Policy = "Permission:party.profile.create")]
    public async Task<IActionResult> CreatePerson([FromBody] CreatePersonPartyRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreatePersonAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/parties/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Tạo mới một hồ sơ tổ chức / đối tác (Organization Party - Trường đối tác, Đại lý, Doanh nghiệp)
    /// </summary>
    [HttpPost("organization")]
    [Authorize(Policy = "Permission:party.profile.create")]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationPartyRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateOrganizationAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/parties/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Cập nhật thông tin hồ sơ cá nhân
    /// </summary>
    [HttpPut("person/{id:guid}")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> UpdatePerson([FromRoute] Guid id, [FromBody] UpdatePersonPartyRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdatePersonAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Cập nhật thông tin hồ sơ tổ chức / đối tác
    /// </summary>
    [HttpPut("organization/{id:guid}")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> UpdateOrganization([FromRoute] Guid id, [FromBody] UpdateOrganizationPartyRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateOrganizationAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Thay đổi trạng thái hồ sơ Party
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] UpdatePartyStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateStatusAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Xóa mềm một hồ sơ Party
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _writeService.SoftDeleteAsync(id, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Gán thêm vai trò cho hồ sơ Party tại một pháp nhân
    /// </summary>
    [HttpPost("{id:guid}/roles")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> AddRole([FromRoute] Guid id, [FromBody] AddPartyRoleRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddRoleAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Thêm phương thức liên hệ (Email, SĐT, Zalo, Địa chỉ) cho Party
    /// </summary>
    [HttpPost("{id:guid}/contacts")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> AddContact([FromRoute] Guid id, [FromBody] AddPartyContactMethodRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddContactMethodAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Lấy danh sách học viên (Student Directory) phân trang qua Stored Procedure sp_Party_Student_GetPagedList
    /// Hỗ trợ Data Scope kiểm soát fail-closed và PII Masking
    /// </summary>
    [HttpGet("students")]
    [Authorize(Policy = "Permission:party.profile.view")]
    public async Task<IActionResult> GetStudentsPaged([FromQuery] PartyFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetStudentsPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    /// <summary>
    /// Lấy chi tiết hồ sơ học viên Student 360 (thông tin cá nhân, định danh, liên hệ, người giám hộ)
    /// </summary>
    [HttpGet("students/{id:guid}")]
    [Authorize(Policy = "Permission:party.profile.view")]
    public async Task<IActionResult> GetStudentDetail([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var student = await _readService.GetStudentDetailAsync(id, cancellationToken);
        if (student == null)
        {
            return ApiError("NOT_FOUND", $"Không tìm thấy hồ sơ học viên với ID '{id}'.", StatusCodes.Status404NotFound);
        }

        return ApiOk(student);
    }

    /// <summary>
    /// Tạo mới một hồ sơ học viên (tự động gắn vai trò Student và thông tin định danh/liên hệ)
    /// </summary>
    [HttpPost("students")]
    [Authorize(Policy = "Permission:party.profile.create")]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateStudentAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/parties/students/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Thêm thông tin giấy tờ định danh (CCCD, Hộ chiếu) cho hồ sơ Party/Học viên
    /// </summary>
    [HttpPost("{id:guid}/identifications")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> AddIdentification([FromRoute] Guid id, [FromBody] AddPartyIdentificationRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddIdentificationAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Thêm mối quan hệ phụ huynh / người giám hộ cho hồ sơ Party/Học viên
    /// </summary>
    [HttpPost("{id:guid}/relationships")]
    [Authorize(Policy = "Permission:party.profile.edit")]
    public async Task<IActionResult> AddRelationship([FromRoute] Guid id, [FromBody] AddPartyRelationshipRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddRelationshipAsync(id, request, cancellationToken);
        return FromResult(result);
    }
}

