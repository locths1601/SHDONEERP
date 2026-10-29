using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Workflow.DTOs;
using ShdOneErp.Application.Modules.Workflow.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/workflows")]
[Authorize]
public class WorkflowsController : ApiControllerBase
{
    private readonly IWorkflowExecutionService _executionService;
    private readonly IWorkflowReadService _readService;

    public WorkflowsController(
        IWorkflowExecutionService executionService,
        IWorkflowReadService readService)
    {
        _executionService = executionService;
        _readService = readService;
    }

    [HttpGet("instances")]
    public async Task<IActionResult> GetPaged([FromQuery] WorkflowInstanceFilterQuery query, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPagedAsync(query, cancellationToken));
    }

    [HttpGet("instances/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var instance = await _readService.GetByIdAsync(id, cancellationToken);
        return instance is null
            ? ApiError("NOT_FOUND", "Không tìm thấy phiên bản quy trình công việc.", StatusCodes.Status404NotFound)
            : ApiOk(instance);
    }

    [HttpGet("instances/{id:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid id, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetHistoryAsync(id, cancellationToken));
    }

    [HttpGet("instances/{id:guid}/available-actions")]
    public async Task<IActionResult> GetAvailableActions(Guid id, CancellationToken cancellationToken)
    {
        return ApiOk(await _executionService.GetAvailableTransitionsAsync(id, cancellationToken));
    }

    [HttpPost("instances")]
    public async Task<IActionResult> Start([FromBody] StartWorkflowRequest request, CancellationToken cancellationToken)
    {
        var result = await _executionService.StartAsync(request, cancellationToken);
        if (!result.Success)
            return FromResult(result);

        return ApiCreated($"/api/v1/workflows/instances/{result.Data}", new { id = result.Data }, result.Message);
    }

    [HttpPost("instances/{id:guid}/actions")]
    public async Task<IActionResult> ExecuteAction(Guid id, [FromBody] ExecuteWorkflowActionRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _executionService.ExecuteActionAsync(id, request, cancellationToken));
    }

    [HttpPost("instances/{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelWorkflowRequest request, CancellationToken cancellationToken)
    {
        return FromResult(await _executionService.CancelAsync(id, request, cancellationToken));
    }
}

