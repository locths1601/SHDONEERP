using ShdOneErp.Domain.Common;

namespace ShdOneErp.Application.Common.Events;

public interface IEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
}

public interface IEventDispatcher
{
    Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);
    Task DispatchRawAsync(string eventTypeName, string payloadJson, CancellationToken cancellationToken = default);
}

