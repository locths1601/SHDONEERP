using Microsoft.Extensions.Caching.Memory;
using ShdOneErp.Application.Common.Events;

namespace ShdOneErp.Infrastructure.Events;

public class MemoryIdempotencyStore : IIdempotencyStore
{
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromHours(24);

    public MemoryIdempotencyStore(IMemoryCache cache)
    {
        _cache = cache;
    }

    private static string BuildKey(Guid messageId, string consumerName) => $"idempotency:{consumerName}:{messageId}";

    public Task<bool> HasBeenProcessedAsync(Guid messageId, string consumerName, CancellationToken cancellationToken = default)
    {
        var key = BuildKey(messageId, consumerName);
        var isProcessed = _cache.TryGetValue(key, out bool _);
        return Task.FromResult(isProcessed);
    }

    public Task MarkProcessedAsync(Guid messageId, string consumerName, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        var key = BuildKey(messageId, consumerName);
        _cache.Set(key, true, expiry ?? DefaultExpiry);
        return Task.CompletedTask;
    }
}

