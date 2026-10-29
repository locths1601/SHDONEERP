using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/organization/branches")]
[Authorize]
public class BranchesController : ApiControllerBase
{
    private readonly IBranchReadService _readService;
    private readonly IBranchWriteService _writeService;

    public BranchesController(IBranchReadService readService, IBranchWriteService writeService)
    {
        _readService = readService;
        _writeService = writeService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:org.branch.view")]
    public async Task<IActionResult> GetPaged([FromQuery] BranchFilterQuery query, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPagedAsync(query, cancellationToken));
    }

    [HttpGet("lookup")]
    [Authorize(Policy = "Permission:org.branch.view")]
    public async Task<IActionResult> GetLookup(
        [FromQuery] Guid? legalEntityId,
        [FromQuery] Guid? businessUnitId,
        CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetLookupAsync(legalEntityId, businessUnitId, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:org.branch.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var branch = await _readService.GetByIdAsync(id, cancellationToken);
        return branch is null
            ? ApiError("NOT_FOUND", "Không tìm thấy chi nhánh/cơ sở.", StatusCodes.Status404NotFound)
            : ApiOk(branch);
    }

    [HttpPost]
    [Authorize(Policy = "Permission:org.branch.create")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest request, CancellationToken cancellationToken)
    {
        var result = await _writeService.CreateAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/organization/branches/{result.Data}", new { id = result.Data }, result.Message);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:org.branch.edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:org.branch.delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        return FromResult(await _writeService.DeleteAsync(id, cancellationToken));
    }
}

