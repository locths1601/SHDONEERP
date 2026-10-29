using Microsoft.Extensions.DependencyInjection;
using ShdOneErp.Application.Common.Events;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.Workflow.EventHandlers;
using ShdOneErp.Application.Modules.Workflow.Interfaces;
using ShdOneErp.Application.Modules.Workflow.Services;
using ShdOneErp.Domain.Events;
using ShdOneErp.Infrastructure.Events;
using ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

namespace ShdOneErp.Infrastructure.Extensions;

public static class WorkflowAndEventServiceExtensions
{
    public static IServiceCollection AddWorkflowEngineServices(this IServiceCollection services)
    {
        // 1. Workflow Execution & Read Services
        services.AddScoped<IWorkflowExecutionService, WorkflowExecutionService>();
        services.AddScoped<IWorkflowReadService, WorkflowReadService>();
        services.AddScoped<IWorkflowEngine, WorkflowEngine>();

        // 2. Event Handlers
        services.AddScoped<WorkflowAuditEventHandler>();
        services.AddScoped<IEventHandler<WorkflowStartedDomainEvent>>(sp => sp.GetRequiredService<WorkflowAuditEventHandler>());
        services.AddScoped<IEventHandler<WorkflowTransitionedDomainEvent>>(sp => sp.GetRequiredService<WorkflowAuditEventHandler>());
        services.AddScoped<IEventHandler<WorkflowCompletedDomainEvent>>(sp => sp.GetRequiredService<WorkflowAuditEventHandler>());
        services.AddScoped<IEventHandler<WorkflowCancelledDomainEvent>>(sp => sp.GetRequiredService<WorkflowAuditEventHandler>());

        return services;
    }

    public static IServiceCollection AddTransactionalOutboxPlatform(this IServiceCollection services)
    {
        // 3. Outbox & Event Platform
        services.AddSingleton<IIdempotencyStore, MemoryIdempotencyStore>();
        services.AddScoped<IEventDispatcher, EventDispatcher>();
        services.AddScoped<IOutboxProcessor, OutboxProcessor>();

        return services;
    }
}

