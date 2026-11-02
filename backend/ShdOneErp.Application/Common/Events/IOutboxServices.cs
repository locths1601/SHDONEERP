namespace ShdOneErp.Application.Common.Events;

public interface IIdempotencyStore
{
    Task<bool> HasBeenProcessedAsync(Guid messageId, string consumerName, CancellationToken cancellationToken = default);
    Task MarkProcessedAsync(Guid messageId, string consumerName, TimeSpan? expiry = null, CancellationToken cancellationToken = default);
}

public interface IOutboxProcessor
{
    Task<int> ProcessPendingMessagesAsync(int batchSize = 20, CancellationToken cancellationToken = default);
    Task<int> ReprocessFailedMessagesAsync(int maxRetries = 5, CancellationToken cancellationToken = default);
}

