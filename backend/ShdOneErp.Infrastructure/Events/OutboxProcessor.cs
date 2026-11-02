using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShdOneErp.Application.Common.Events;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Infrastructure.Events;

public class OutboxProcessor : IOutboxProcessor
{
    private readonly IShdOneErpDbContext _context;
    private readonly IEventDispatcher _dispatcher;
    private readonly IIdempotencyStore _idempotencyStore;
    private readonly ILogger<OutboxProcessor> _logger;

    private const string OutboxConsumerName = "OutboxProcessor_Default";

    public OutboxProcessor(
        IShdOneErpDbContext context,
        IEventDispatcher dispatcher,
        IIdempotencyStore idempotencyStore,
        ILogger<OutboxProcessor> logger)
    {
        _context = context;
        _dispatcher = dispatcher;
        _idempotencyStore = idempotencyStore;
        _logger = logger;
    }

    public async Task<int> ProcessPendingMessagesAsync(int batchSize = 20, CancellationToken cancellationToken = default)
    {
        var pendingMessages = await _context.OutboxMessages
            .Where(m => m.Status == OutboxMessageStatus.Pending ||
                       (m.Status == OutboxMessageStatus.Failed && m.RetryCount < 5))
            .OrderBy(m => m.OccurredOnUtc)
            .Take(batchSize)
            .ToListAsync(cancellationToken);

        if (pendingMessages.Count == 0)
            return 0;

        int processedSuccessCount = 0;

        foreach (var message in pendingMessages)
        {
            var sw = Stopwatch.StartNew();

            // 1. Kiểm tra Idempotency
            if (await _idempotencyStore.HasBeenProcessedAsync(message.Id, OutboxConsumerName, cancellationToken))
            {
                message.MarkProcessed();
                processedSuccessCount++;

                _context.OutboxProcessingHistories.Add(new OutboxProcessingHistory(
                    message.Id,
                    OutboxConsumerName,
                    message.RetryCount + 1,
                    OutboxMessageStatus.Processed,
                    "Idempotency cache hit: message already processed",
                    sw.ElapsedMilliseconds));

                continue;
            }

            message.MarkProcessing();

            try
            {
                // 2. Dispatch event tới các handlers
                await _dispatcher.DispatchRawAsync(message.EventType, message.PayloadJson, cancellationToken);

                // 3. Đánh dấu đã xử lý thành công
                message.MarkProcessed();
                await _idempotencyStore.MarkProcessedAsync(message.Id, OutboxConsumerName, cancellationToken: cancellationToken);
                processedSuccessCount++;

                _context.OutboxProcessingHistories.Add(new OutboxProcessingHistory(
                    message.Id,
                    OutboxConsumerName,
                    message.RetryCount + 1,
                    OutboxMessageStatus.Processed,
                    null,
                    sw.ElapsedMilliseconds));

                _logger.LogInformation("Đã xử lý thành công Outbox Message {MessageId} loại {EventType}", message.Id, message.EventType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Thất bại khi xử lý Outbox Message {MessageId} loại {EventType}. Lần thử: {RetryCount}",
                    message.Id, message.EventType, message.RetryCount + 1);

                message.RecordFailure(ex.Message, maxRetries: 5);

                _context.OutboxProcessingHistories.Add(new OutboxProcessingHistory(
                    message.Id,
                    OutboxConsumerName,
                    message.RetryCount,
                    message.Status,
                    ex.Message,
                    sw.ElapsedMilliseconds));
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return processedSuccessCount;
    }

    public async Task<int> ReprocessFailedMessagesAsync(int maxRetries = 5, CancellationToken cancellationToken = default)
    {
        var failedMessages = await _context.OutboxMessages
            .Where(m => m.Status == OutboxMessageStatus.Failed && m.RetryCount < maxRetries)
            .ToListAsync(cancellationToken);

        foreach (var message in failedMessages)
        {
            message.ResetForRetry();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return failedMessages.Count;
    }
}
