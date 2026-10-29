using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/permission-mapping")]
[Authorize]
public class PermissionMappingController : ApiControllerBase
{
    private readonly IFeatureRegistryReadService _readService;

    public PermissionMappingController(IFeatureRegistryReadService readService)
    {
        _readService = readService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:system.permission_map.view")]
    public async Task<IActionResult> GetCatalog([FromQuery] PermissionMappingFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _readService.GetPermissionMappingCatalogAsync(query, cancellationToken);
        return ApiOk(result);
    }
}
