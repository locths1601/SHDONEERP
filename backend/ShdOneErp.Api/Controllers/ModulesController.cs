using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/modules")]
[Authorize]
public class ModulesController : ApiControllerBase
{
    private readonly IModuleRegistryReadService _readService;
    private readonly IModuleRegistryWriteService _writeService;

    public ModulesController(
        IModuleRegistryReadService readService,
        IModuleRegistryWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:system.module.view")]
    public async Task<IActionResult> GetPaged([FromQuery] ModuleFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPagedAsync(query, cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("hierarchy")]
    [Authorize(Policy = "Permission:system.module.view")]
    public async Task<IActionResult> GetHierarchy(CancellationToken cancellationToken)
    {
        var result = await _readService.GetHierarchyAsync(cancellationToken);
        return ApiOk(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:system.module.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var module = await _readService.GetByIdAsync(id, cancellationToken);
        return module is null
            ? ApiError("NOT_FOUND", "Không tìm thấy thông tin phân hệ.", StatusCodes.Status404NotFound)
            : ApiOk(module);
    }

    [HttpGet("{id:guid}/dependencies")]
    [Authorize(Policy = "Permission:system.module.view")]
    public async Task<IActionResult> GetDependencies(Guid id, CancellationToken cancellationToken)
    {
        var result = await _readService.GetDependenciesAsync(id, cancellationToken);
        return ApiOk(result);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:system.module.manage")]
    public async Task<IActionResult> Create([FromBody] CreateModuleRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        return FromResult(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:system.module.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateModuleRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.UpdateAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:system.module.manage")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _writeService.DeleteAsync(id, cancellationToken);
        return FromResult(result);
    }

    [HttpPost("{id:guid}/dependencies")]
    [Authorize(Policy = "Permission:system.module.manage")]
    public async Task<IActionResult> AddDependency(Guid id, [FromBody] AddModuleDependencyRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.AddDependencyAsync(id, request, cancellationToken);
        return FromResult(result);
    }

    [HttpDelete("dependencies/{dependencyId:guid}")]
    [Authorize(Policy = "Permission:system.module.manage")]
    public async Task<IActionResult> RemoveDependency(Guid dependencyId, CancellationToken cancellationToken)
    {
        var result = await _writeService.RemoveDependencyAsync(dependencyId, cancellationToken);
        return FromResult(result);
    }
}
