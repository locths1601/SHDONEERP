using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/reference-data/catalogs")]
[Authorize]
public class MasterDataCatalogsController : ApiControllerBase
{
    private readonly IMasterDataCatalogReadService _readService;
    private readonly IMasterDataCatalogWriteService _writeService;

    public MasterDataCatalogsController(
        IMasterDataCatalogReadService readService,
        IMasterDataCatalogWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:system.reference_data.view")]
    public async Task<IActionResult> GetPaged([FromQuery] CatalogFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:system.reference_data.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var catalog = await _readService.GetByIdAsync(id, cancellationToken);
        return catalog is null
            ? ApiError("NOT_FOUND", "Không tìm thấy thông tin nhóm danh mục.", StatusCodes.Status404NotFound)
            : ApiOk(catalog);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Create([FromBody] CreateCatalogRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        if (result.Success)
            return ApiCreated($"/api/v1/system/reference-data/catalogs/{result.Data}", result.Data, result.Message);

        return FromResult(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCatalogRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Deactivate(Guid id, [FromBody] ChangeCatalogStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.DeactivateAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{id:guid}/activate")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Activate(Guid id, [FromBody] ChangeCatalogStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.ActivateAsync(id, request, cancellationToken);
        return FromResult(result);
    }
}

