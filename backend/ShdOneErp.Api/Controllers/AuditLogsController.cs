using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Audit.DTOs;
using ShdOneErp.Application.Modules.Audit.Interfaces;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/identity/audit-logs")]
[Authorize]
public class AuditLogsController : ApiControllerBase
{
    private readonly IAuditLogReadService _readService;

    public AuditLogsController(IAuditLogReadService readService)
    {
        _readService = readService;
    }

    [HttpGet]
    [Authorize(Policy = "Permission:identity.audit.view")]
    public async Task<IActionResult> GetPaged([FromQuery] AuditLogFilterQuery query, CancellationToken cancellationToken)
    {
        return ApiOk(await _readService.GetPagedAsync(query, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:identity.audit.view")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var log = await _readService.GetByIdAsync(id, cancellationToken);
        return log is null
            ? ApiError("NOT_FOUND", "Không tìm thấy bản ghi nhật ký kiểm toán hoặc bạn không có quyền truy cập phạm vi này.", StatusCodes.Status404NotFound)
            : ApiOk(log);
    }
}

