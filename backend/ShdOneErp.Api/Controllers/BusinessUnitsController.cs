using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/organization/business-units")]
[Authorize]
public class BusinessUnitsController : ApiControllerBase
{
    private readonly IBusinessUnitReadService _readService;
    private readonly IBusinessUnitWriteService _writeService;

    public BusinessUnitsController(IBusinessUnitReadService readService, IBusinessUnitWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:org.business_unit.view")]
    public async Task<IActionResult> GetPaged([FromQuery] BusinessUnitFilterQuery query, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPagedAsync(query, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:org.business_unit.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var unit = await _readService.GetByIdAsync(id, cancellationToken);
        return unit is null
            ? ApiError("NOT_FOUND", "Không tìm thấy đơn vị kinh doanh.", StatusCodes.Status404NotFound)
            : ApiOk(unit);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:org.business_unit.create")]
    public async Task<IActionResult> Create(CreateBusinessUnitRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/organization/business-units/{result.Data}", new { id = result.Data }, result.Message);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:org.business_unit.edit")]
    public async Task<IActionResult> Update(Guid id, UpdateBusinessUnitRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:org.business_unit.delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.DeleteAsync(id, cancellationToken));
    }
}
