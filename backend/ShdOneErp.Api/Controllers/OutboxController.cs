using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Common.Events;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/system/outbox")]
[Authorize]
public class OutboxController : ApiControllerBase
{
    private readonly IOutboxProcessor _outboxProcessor;

    public OutboxController(IOutboxProcessor outboxProcessor)
    {
        _outboxProcessor = outboxProcessor;
    }

    [HttpPost("process")]
    [Authorize(Policy = "Permission:identity.audit.view")]
    public async Task<IActionResult> ProcessPending([FromQuery] int batchSize = 20, CancellationToken cancellationToken = default)
    {
        var count = await _outboxProcessor.ProcessPendingMessagesAsync(batchSize, cancellationToken);
        return ApiOk(new { processedCount = count, message = $"Đã xử lý {count} tin nhắn outbox." });
    }

    [HttpPost("reprocess-failed")]
    [Authorize(Policy = "Permission:identity.audit.view")]
    public async Task<IActionResult> ReprocessFailed([FromQuery] int maxRetries = 5, CancellationToken cancellationToken = default)
    {
        var count = await _outboxProcessor.ReprocessFailedMessagesAsync(maxRetries, cancellationToken);
        return ApiOk(new { resetCount = count, message = $"Đã khôi phục {count} tin nhắn lỗi để thử lại." });
    }
}

