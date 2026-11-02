using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/reference-data/catalogs/{catalogId:guid}/items")]
[Authorize]
public class MasterDataItemsController : ApiControllerBase
{
    private readonly IMasterDataItemReadService _readService;
    private readonly IMasterDataItemWriteService _writeService;

    public MasterDataItemsController(
        IMasterDataItemReadService readService,
        IMasterDataItemWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:system.reference_data.view")]
    public async Task<IActionResult> GetPaged(
        [FromRoute] Guid catalogId,
        [FromQuery] ItemFilterQuery query,
        CancellationToken cancellationToken)
    {
        query.CatalogId = catalogId;
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("{itemId:guid}")]
    [Authorize(Policy = "Permission:system.reference_data.view")]
    public async Task<IActionResult> GetById(
        [FromRoute] Guid catalogId,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken)
    {
        var item = await _readService.GetByIdAsync(itemId, cancellationToken);
        if (item is null || item.CatalogId != catalogId)
            return ApiError("NOT_FOUND", "Không tìm thấy thông tin giá trị danh mục trong nhóm này.", StatusCodes.Status404NotFound);

        return ApiOk(item);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Create(
        [FromRoute] Guid catalogId,
        [FromBody] CreateItemRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(catalogId, request, cancellationToken);
        if (result.Success)
            return ApiCreated($"/api/v1/system/reference-data/catalogs/{catalogId}/items/{result.Data}", result.Data, result.Message);

        return FromResult(result);
    }

    [HttpPut("{itemId:guid}")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Update(
        [FromRoute] Guid catalogId,
        [FromRoute] Guid itemId,
        [FromBody] UpdateItemRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateAsync(catalogId, itemId, request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{itemId:guid}/activate")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Activate(
        [FromRoute] Guid catalogId,
        [FromRoute] Guid itemId,
        [FromBody] ChangeItemStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _writeService.ActivateAsync(catalogId, itemId, request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{itemId:guid}/deactivate")]
    [Authorize(Policy = "Permission:system.reference_data.manage")]
    public async Task<IActionResult> Deactivate(
        [FromRoute] Guid catalogId,
        [FromRoute] Guid itemId,
        [FromBody] ChangeItemStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _writeService.DeactivateAsync(catalogId, itemId, request, cancellationToken);
        return FromResult(result);
    }

    [HttpGet("/api/v1/system/reference-data/lookup/{catalogCode}")]
    [Authorize(Policy = "Permission:system.reference_data.view")]
    public async Task<IActionResult> GetLookup(
        [FromRoute] string catalogCode,
        CancellationToken cancellationToken)
    {
        var items = await _readService.GetLookupByCatalogCodeAsync(catalogCode, cancellationToken);
        return ApiOk(items);
    }
}

