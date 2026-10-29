using ShdOneErp.Domain.Common;

namespace ShdOneErp.Application.Common.Events;

public interface IEventEnvelope
{
    Guid EventId { get; }
    string EventType { get; }
    DateTime OccurredOnUtc { get; }
    string? AggregateId { get; }
    string? AggregateType { get; }
    string? CorrelationId { get; }
    string? CausationId { get; }
    Guid? UserId { get; }
    Guid? LegalEntityId { get; }
}

public class EventEnvelope<TEvent> : IEventEnvelope where TEvent : IDomainEvent
{
    public Guid EventId => Payload.EventId;
    public string EventType { get; set; } = typeof(TEvent).FullName ?? typeof(TEvent).Name;
    public DateTime OccurredOnUtc => Payload.OccurredOnUtc;
    public string? AggregateId { get; set; }
    public string? AggregateType { get; set; }
    public string? CorrelationId { get; set; }
    public string? CausationId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? LegalEntityId { get; set; }
    public TEvent Payload { get; set; }

    public EventEnvelope(
        TEvent payload,
        string? aggregateId = null,
        string? aggregateType = null,
        string? correlationId = null,
        string? causationId = null,
        Guid? userId = null,
        Guid? legalEntityId = null)
    {
        Payload = payload;
        AggregateId = aggregateId;
        AggregateType = aggregateType;
        CorrelationId = correlationId;
        CausationId = causationId;
        UserId = userId;
        LegalEntityId = legalEntityId;
    }
}

