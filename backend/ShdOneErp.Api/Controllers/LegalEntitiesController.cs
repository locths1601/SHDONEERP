using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/organization/legal-entities")]
[Authorize]
public class LegalEntitiesController : ApiControllerBase
{
    private readonly ILegalEntityReadService _readService;
    private readonly ILegalEntityWriteService _writeService;

    public LegalEntitiesController(
        ILegalEntityReadService readService,
        ILegalEntityWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    /// <summary>
    /// Lấy danh sách pháp nhân phân trang qua Stored Procedure
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "Permission:org.legal_entity.view")]
    public async Task<IActionResult> GetPaged([FromQuery] LegalEntityFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    /// <summary>
    /// Lấy danh sách pháp nhân rút gọn phục vụ chọn lựa (Dropdown Lookup)
    /// </summary>
    [HttpGet("lookup")]
    [Authorize(Policy = "Permission:org.legal_entity.view")]
    public async Task<IActionResult> GetLookup(CancellationToken cancellationToken)
    {
        var result = await _readService.GetLookupAsync(cancellationToken);
        return ApiOk(result);
    }

    /// <summary>
    /// Lấy chi tiết thông tin pháp nhân theo ID qua Stored Procedure
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:org.legal_entity.view")]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var entity = await _readService.GetByIdAsync(id, cancellationToken);
        if (entity == null)
            return ApiError("NOT_FOUND", $"Không tìm thấy pháp nhân với ID '{id}'.", StatusCodes.Status404NotFound);

        return ApiOk(entity);
    }

    /// <summary>
    /// Tạo mới một pháp nhân trong hệ sinh thái
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "Permission:org.legal_entity.create")]
    public async Task<IActionResult> Create([FromBody] CreateLegalEntityRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/organization/legal-entities/{result.Data}", new { id = result.Data }, result.Message);
    }

    /// <summary>
    /// Cập nhật thông tin pháp nhân (có kiểm soát Optimistic Concurrency qua RowVersion)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:org.legal_entity.edit")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateLegalEntityRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Xóa mềm một pháp nhân (chỉ cho phép khi không có đơn vị kinh doanh liên đới)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:org.legal_entity.delete")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _writeService.DeleteAsync(id, cancellationToken);
        return FromResult(result);
    }
}
