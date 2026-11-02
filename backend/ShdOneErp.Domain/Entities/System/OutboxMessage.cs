using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.System;

public class OutboxMessage
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public DateTime OccurredOnUtc { get; private set; } = DateTime.UtcNow;
    public string EventType { get; private set; } = string.Empty;
    public string PayloadJson { get; private set; } = string.Empty;
    public DateTime? ProcessedOnUtc { get; private set; }
    public string? Error { get; private set; }
    public int RetryCount { get; private set; } = 0;
    public Guid? LegalEntityId { get; private set; }
    public string? CorrelationId { get; private set; }
    public string? CausationId { get; private set; }
    public string? AggregateType { get; private set; }
    public string? AggregateId { get; private set; }
    public Guid? UserId { get; private set; }
    public OutboxMessageStatus Status { get; private set; } = OutboxMessageStatus.Pending;

    public ICollection<OutboxProcessingHistory> ProcessingHistories { get; private set; } = new List<OutboxProcessingHistory>();

    private OutboxMessage() { }

    public OutboxMessage(
        string eventType,
        string payloadJson,
        Guid? legalEntityId = null,
        string? correlationId = null,
        string? causationId = null,
        string? aggregateType = null,
        string? aggregateId = null,
        Guid? userId = null)
    {
        EventType = eventType;
        PayloadJson = payloadJson;
        LegalEntityId = legalEntityId;
        CorrelationId = correlationId;
        CausationId = causationId;
        AggregateType = aggregateType;
        AggregateId = aggregateId;
        UserId = userId;
        OccurredOnUtc = DateTime.UtcNow;
        Status = OutboxMessageStatus.Pending;
    }

    public void MarkProcessing()
    {
        Status = OutboxMessageStatus.Processing;
    }

    public void MarkProcessed()
    {
        ProcessedOnUtc = DateTime.UtcNow;
        Status = OutboxMessageStatus.Processed;
        Error = null;
    }

    public void RecordFailure(string error, int maxRetries = 5)
    {
        RetryCount++;
        Error = error;
        if (RetryCount >= maxRetries)
        {
            Status = OutboxMessageStatus.DeadLetter;
        }
        else
        {
            Status = OutboxMessageStatus.Failed;
        }
    }

    public void ResetForRetry()
    {
        if (Status != OutboxMessageStatus.DeadLetter)
        {
            Status = OutboxMessageStatus.Pending;
        }
    }
}
