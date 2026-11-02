using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Common.Interfaces;

public class DataScopeResolution
{
    public bool IsGlobal { get; set; }
    public IReadOnlyList<Guid> AllowedLegalEntityIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyList<Guid> AllowedBusinessUnitIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyList<Guid> AllowedBranchIds { get; set; } = Array.Empty<Guid>();
}

public interface IScopeResolver
{
    Task<DataScopeResolution> ResolveScopeAsync(
        Guid userId,
        string permissionCode,
        CancellationToken cancellationToken = default);

    Task<bool> HasScopeAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid? targetBusinessUnitId = null,
        Guid? targetBranchId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasResourceAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid resourceOwnerUserId,
        DataClassification classification,
        CancellationToken cancellationToken = default);
}

public class AuditLogEntry
{
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? AffectedColumns { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public Guid? LegalEntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
}

public interface IAuditLogService
{
    Task LogAsync(AuditLogEntry entry, CancellationToken cancellationToken = default);
}

public interface IEventPublisher
{
    Task PublishAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default) where TEvent : IDomainEvent;
    Task EnqueueOutboxAsync(IDomainEvent domainEvent, Guid? legalEntityId = null, string? correlationId = null, CancellationToken cancellationToken = default);
}

public class StoredDocumentResult
{
    public Guid DocumentId { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string Sha256Checksum { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

public interface IDocumentStorageService
{
    Task<StoredDocumentResult> StoreDocumentAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        DataClassification classification,
        Guid legalEntityId,
        Guid ownerUserId,
        CancellationToken cancellationToken = default);

    Task<Stream?> GetDocumentStreamAsync(
        Guid documentId,
        Guid requesterUserId,
        CancellationToken cancellationToken = default);
}

public class WorkflowTransitionResult
{
    public bool Success { get; set; }
    public string CurrentState { get; set; } = string.Empty;
    public WorkflowStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? NextAssignedUserId { get; set; }
}

public interface IWorkflowEngine
{
    Task<WorkflowTransitionResult> SubmitAsync(
        string workflowCode,
        Guid legalEntityId,
        string entityId,
        Guid requesterUserId,
        object? payload = null,
        CancellationToken cancellationToken = default);

    Task<WorkflowTransitionResult> ExecuteActionAsync(
        Guid instanceId,
        string action,
        Guid actorUserId,
        string? comments = null,
        CancellationToken cancellationToken = default);
}

public class MasterDataItemDto
{
    public Guid Id { get; set; }
    public string CatalogCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; }
    public Guid? ParentItemId { get; set; }
    public string? MetadataJson { get; set; }
}

public interface IMasterDataService
{
    Task<IReadOnlyList<MasterDataItemDto>> GetItemsByCatalogAsync(string catalogCode, CancellationToken cancellationToken = default);
}

public interface IFeatureRegistryService
{
    Task<bool> IsFeatureEnabledAsync(string featureCode, Guid? legalEntityId = null, CancellationToken cancellationToken = default);
}

