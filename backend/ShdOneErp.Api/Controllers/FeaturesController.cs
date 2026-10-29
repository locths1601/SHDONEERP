using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/features")]
[Authorize]
public class FeaturesController : ApiControllerBase
{
    private readonly IFeatureRegistryReadService _readService;
    private readonly IFeatureRegistryWriteService _writeService;

    public FeaturesController(
        IFeatureRegistryReadService readService,
        IFeatureRegistryWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:system.feature.view")]
    public async Task<IActionResult> GetPaged([FromQuery] FeatureFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("hierarchy")]
    [Authorize(Policy = "Permission:system.feature.view")]
    public async Task<IActionResult> GetHierarchy([FromQuery] Guid? moduleId, CancellationToken cancellationToken)
    {
        var result = await _readService.GetHierarchyAsync(moduleId, cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:system.feature.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var feature = await _readService.GetByIdAsync(id, cancellationToken);
        return feature is null
            ? ApiError("NOT_FOUND", "Không tìm thấy thông tin tính năng.", StatusCodes.Status404NotFound)
            : ApiOk(feature);
    }

    [HttpGet("{id:guid}/actions")]
    [Authorize(Policy = "Permission:system.feature.view")]
    public async Task<IActionResult> GetActions(Guid id, CancellationToken cancellationToken)
    {
        var result = await _readService.GetActionsAsync(id, cancellationToken);
        return ApiOk(result);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:system.feature.manage")]
    public async Task<IActionResult> Create([FromBody] CreateFeatureRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:system.feature.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFeatureRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:system.feature.manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _writeService.DeleteAsync(id, cancellationToken);
        return FromResult(result);
    }

    [HttpPost("{id:guid}/actions")]
    [Authorize(Policy = "Permission:system.permission_map.manage")]
    public async Task<IActionResult> AddAction(Guid id, [FromBody] CreateFeatureActionRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddActionMappingAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("actions/{actionMappingId:guid}")]
    [Authorize(Policy = "Permission:system.permission_map.manage")]
    public async Task<IActionResult> UpdateAction(Guid actionMappingId, [FromBody] UpdateFeatureActionRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateActionMappingAsync(actionMappingId, request, cancellationToken);
        return FromResult(result);
    }

    [HttpDelete("actions/{actionMappingId:guid}")]
    [Authorize(Policy = "Permission:system.permission_map.manage")]
    public async Task<IActionResult> RemoveAction(Guid actionMappingId, CancellationToken cancellationToken)
    {
        var result = await _writeService.RemoveActionMappingAsync(actionMappingId, cancellationToken);
        return FromResult(result);
    }
}
