using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ShdOneErp.Application.Common.Events;
using ShdOneErp.Domain.Common;

namespace ShdOneErp.Infrastructure.Events;

public class EventDispatcher : IEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EventDispatcher> _logger;
    private static readonly ConcurrentDictionary<string, Type?> TypeCache = new();

    public EventDispatcher(IServiceProvider serviceProvider, ILogger<EventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        var eventType = domainEvent.GetType();
        var handlerType = typeof(IEventHandler<>).MakeGenericType(eventType);

        using var scope = _serviceProvider.CreateScope();
        var handlers = scope.ServiceProvider.GetServices(handlerType);

        foreach (var handler in handlers)
        {
            if (handler == null) continue;

            var method = handlerType.GetMethod(nameof(IEventHandler<IDomainEvent>.HandleAsync));
            if (method != null)
            {
                try
                {
                    var task = (Task?)method.Invoke(handler, new object[] { domainEvent, cancellationToken });
                    if (task != null)
                    {
                        await task;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xử lý domain event '{EventType}' bởi handler '{HandlerType}'", eventType.Name, handler.GetType().Name);
                    throw;
                }
            }
        }
    }

    public async Task DispatchRawAsync(string eventTypeName, string payloadJson, CancellationToken cancellationToken = default)
    {
        var targetType = TypeCache.GetOrAdd(eventTypeName, ResolveEventType);

        if (targetType == null)
        {
            _logger.LogWarning("Không tìm thấy Type tương ứng với tên sự kiện '{EventTypeName}'. Bỏ qua dispatch.", eventTypeName);
            return;
        }

        object? domainEvent;
        try
        {
            domainEvent = JsonSerializer.Deserialize(payloadJson, targetType, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không thể deserialize JSON của sự kiện '{EventTypeName}'", eventTypeName);
            throw;
        }

        if (domainEvent is IDomainEvent typedEvent)
        {
            await DispatchAsync(typedEvent, cancellationToken);
        }
        else
        {
            _logger.LogWarning("Event '{EventTypeName}' không kế thừa IDomainEvent.", eventTypeName);
        }
    }

    private static Type? ResolveEventType(string typeName)
    {
        // 1. Thử Type.GetType trực tiếp
        var type = Type.GetType(typeName);
        if (type != null) return type;

        // 2. Scan các assemblies đang load
        foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            type = assembly.GetType(typeName);
            if (type != null) return type;
        }

        // 3. Fallback theo tên ngắn
        var shortName = typeName.Split('.').Last();
        foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            type = assembly.GetTypes().FirstOrDefault(t => t.Name == shortName && typeof(IDomainEvent).IsAssignableFrom(t));
            if (type != null) return type;
        }

        return null;
    }
}

