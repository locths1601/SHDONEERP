using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.System;

public class OutboxProcessingHistory
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid MessageId { get; private set; }
    public OutboxMessage? Message { get; private set; }
    public string ConsumerName { get; private set; } = string.Empty;
    public int AttemptNumber { get; private set; }
    public OutboxMessageStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; }
    public long DurationMs { get; private set; }
    public DateTime ProcessedAtUtc { get; private set; } = DateTime.UtcNow;

    private OutboxProcessingHistory() { }

    public OutboxProcessingHistory(
        Guid messageId,
        string consumerName,
        int attemptNumber,
        OutboxMessageStatus status,
        string? errorMessage = null,
        long durationMs = 0)
    {
        MessageId = messageId;
        ConsumerName = consumerName;
        AttemptNumber = attemptNumber;
        Status = status;
        ErrorMessage = errorMessage;
        DurationMs = durationMs;
        ProcessedAtUtc = DateTime.UtcNow;
    }
}
