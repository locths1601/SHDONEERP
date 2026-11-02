# 16 — HỢP ĐỒNG DỊCH VỤ NỀN TẢNG (PLATFORM SERVICES CONTRACTS)

---

### 1. Tổng quan Hợp đồng Dịch vụ Nền tảng (Platform Architecture Contracts)

Nhằm đảm bảo các phân hệ tương lai (CRM, Tuyển sinh, Đào tạo, Visa, Tài chính) không tự ý viết các framework trùng lặp, toàn bộ các chức năng xuyên suốt (cross-cutting concerns) được chuẩn hóa thành các hợp đồng dịch vụ (Platform Interfaces & DTOs) trong `ShdOneErp.Application.Common.Interfaces`.

---

### 2. Chi tiết Đặc tả Các Hợp đồng Dịch vụ Cốt lõi

#### 2.1. Hợp đồng Kiểm soát Phạm vi Dữ liệu & Phân loại (`IScopeResolver`)

```csharp
public class DataScopeResolution
{
    public bool IsGlobal { get; set; }
    public IReadOnlyList<Guid> AllowedLegalEntityIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyList<Guid> AllowedBusinessUnitIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyList<Guid> AllowedBranchIds { get; set; } = Array.Empty<Guid>();
}

public interface IScopeResolver
{
    // Phân giải toàn bộ phạm vi dữ liệu được phép của người dùng theo mã quyền
    Task<DataScopeResolution> ResolveScopeAsync(
        Guid userId,
        string permissionCode,
        CancellationToken cancellationToken = default);

    // Kiểm tra nhanh người dùng có quyền can thiệp vào pháp nhân / đơn vị / cơ sở cụ thể hay không
    Task<bool> HasScopeAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid? targetBusinessUnitId = null,
        Guid? targetBranchId = null,
        CancellationToken cancellationToken = default);

    // Kiểm tra quyền truy cập tài nguyên bảo mật 3 lớp (Scope + Classification + Resource Ownership)
    Task<bool> HasResourceAccessAsync(
        Guid userId,
        string permissionCode,
        Guid targetLegalEntityId,
        Guid resourceOwnerUserId,
        DataClassification classification,
        CancellationToken cancellationToken = default);
}
```

#### 2.2. Hợp đồng Ghi vết Kiểm toán Tự động (`IAuditLogService`)

```csharp
public class AuditLogEntry
{
    public string Action { get; set; } = string.Empty; // Insert, Update, SoftDelete, Restore, HardDelete, SecurityOverride
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValues { get; set; } // JSON snapshot trạng thái trước khi thay đổi
    public string? NewValues { get; set; } // JSON snapshot trạng thái sau khi thay đổi
    public string? AffectedColumns { get; set; } // Danh sách cột bị biến động
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
```

#### 2.3. Hợp đồng Phát hành Sự kiện Miền & Outbox Pattern (`IEventPublisher`)

```csharp
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredOnUtc { get; }
}

public interface IEventPublisher
{
    // Phát hành sự kiện nội bộ trong cùng tiến trình (In-process Event Bus)
    Task PublishAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default) 
        where TEvent : IDomainEvent;

    // Ghi nhận sự kiện vào Outbox Table đảm bảo tính nhất quán (Transactional Outbox)
    Task EnqueueOutboxAsync(
        IDomainEvent domainEvent, 
        Guid? legalEntityId = null, 
        string? correlationId = null, 
        CancellationToken cancellationToken = default);
}
```

#### 2.4. Hợp đồng Quản lý Tài liệu & Lưu trữ Số hóa (`IDocumentStorageService`)

```csharp
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
```

#### 2.5. Hợp đồng Quy trình Phê duyệt & Máy trạng thái Nghiệp vụ (`IWorkflowEngine`)

```csharp
public class WorkflowTransitionResult
{
    public bool Success { get; set; }
    public string CurrentState { get; set; } = string.Empty;
    public WorkflowStatus Status { get; set; } // Pending, Approved, Rejected, Cancelled
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
```

#### 2.6. Hợp đồng Danh mục Dữ liệu Dùng chung (`IMasterDataService`)

```csharp
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
    Task<IReadOnlyList<MasterDataItemDto>> GetItemsByCatalogAsync(
        string catalogCode, 
        CancellationToken cancellationToken = default);
}
```

