using Microsoft.Extensions.Logging;
using ShdOneErp.Application.Common.Events;
using ShdOneErp.Domain.Events;

namespace ShdOneErp.Application.Modules.Workflow.EventHandlers;

public class WorkflowAuditEventHandler :
    IEventHandler<WorkflowStartedDomainEvent>,
    IEventHandler<WorkflowTransitionedDomainEvent>,
    IEventHandler<WorkflowCompletedDomainEvent>,
    IEventHandler<WorkflowCancelledDomainEvent>
{
    private readonly ILogger<WorkflowAuditEventHandler> _logger;

    public WorkflowAuditEventHandler(ILogger<WorkflowAuditEventHandler> logger)
    {
        _logger = logger;
    }

    public Task HandleAsync(WorkflowStartedDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[WORKFLOW_EVENT] Khởi tạo Instance {InstanceId} của quy trình {WorkflowCode} cho thực thể {EntityType}:{EntityId} tại trạng thái '{InitialState}'",
            domainEvent.InstanceId, domainEvent.WorkflowCode, domainEvent.EntityType, domainEvent.EntityId, domainEvent.InitialState);
        return Task.CompletedTask;
    }

    public Task HandleAsync(WorkflowTransitionedDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[WORKFLOW_EVENT] Chuyển trạng thái Instance {InstanceId}: '{FromState}' -> '{ToState}' qua hành động '{Action}' bởi User {ActorUserId}",
            domainEvent.InstanceId, domainEvent.FromState, domainEvent.ToState, domainEvent.Action, domainEvent.ActorUserId);
        return Task.CompletedTask;
    }

    public Task HandleAsync(WorkflowCompletedDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[WORKFLOW_EVENT] Hoàn tất Instance {InstanceId} với trạng thái cuối '{FinalState}', kết quả {Status} bởi User {CompletedBy}",
            domainEvent.InstanceId, domainEvent.FinalState, domainEvent.FinalStatus, domainEvent.CompletedByUserId);
        return Task.CompletedTask;
    }

    public Task HandleAsync(WorkflowCancelledDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[WORKFLOW_EVENT] Hủy bỏ Instance {InstanceId} tại trạng thái '{CancelledAtState}' bởi User {CancelledBy}. Lý do: {Reason}",
            domainEvent.InstanceId, domainEvent.CancelledAtState, domainEvent.CancelledByUserId, domainEvent.Reason ?? "N/A");
        return Task.CompletedTask;
    }
}

