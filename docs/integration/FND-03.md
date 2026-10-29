# YÊU CẦU TÍCH HỢP HỆ THỐNG: FND-03 — WORKFLOW ENGINE & EVENT FOUNDATION

**Dành cho:** Tech Lead, Principal Integration Architect, và các AI Agent đồng thời (GroupUser Authorization, Module Registry, Organization).

---

## 1. Tổng quan Tích hợp

Phân hệ **FND-03 (Workflow Engine & Event Foundation)** đã được triển khai hoàn chỉnh độc lập theo chuẩn Clean Architecture (.NET 10). Toàn bộ mã nguồn tuân thủ nguyên tắc cách ly:
- Triển khai trên branch riêng `feature/fnd03-workflow-foundation`.
- Không can thiệp hoặc sửa đổi các file của Agent khác (UserGroup, Identity, Authorization, Audit Log).
- Không sửa hoặc xóa bất kỳ migration nào đã có (`20261025_*`, `20261026_*`).
- Không tự ý merge vào main hoặc deploy production.
- Chuẩn bị đầy đủ các Extension Methods và tài liệu tích hợp để Core Platform gộp mã nguồn an toàn khi hoàn thành chu kỳ song song.

---

## 2. Đăng ký Dependency Injection

Toàn bộ dịch vụ của FND-03 được đóng gói trong Extension Method độc lập:
`ShdOneErp.Infrastructure.Extensions.WorkflowAndEventServiceExtensions`.

### 2.1. Tích hợp vào `Program.cs` hoặc `DependencyInjection.cs`

Khi tiến hành merge branch, chỉ cần thêm 2 dòng gọi extension method vào Service Collection:

```csharp
using ShdOneErp.Infrastructure.Extensions;

// 1. Đăng ký Workflow Engine Services (Parser, Execution Service, CQRS Read Service, v.v.)
builder.Services.AddWorkflowEngineServices();

// 2. Đăng ký Transactional Outbox Platform (Idempotency Store, Event Dispatcher, Outbox Processor)
builder.Services.AddTransactionalOutboxPlatform();
```

### 2.2. Danh mục Service & Interface được đăng ký

| Interface | Implementation | Vòng đời (Lifetime) | Mục đích |
| :--- | :--- | :--- | :--- |
| `IWorkflowExecutionService` | `WorkflowExecutionService` | `Scoped` | Điều phối khởi tạo quy trình, chuyển trạng thái, kiểm tra quyền & concurrency |
| `IWorkflowReadService` | `WorkflowReadService` | `Scoped` | Đọc dữ liệu CQRS thông qua Stored Procedures tối ưu hiệu năng cao |
| `IWorkflowEngine` | `WorkflowEngine` | `Scoped` | Hiện thực Interface nền tảng trong `IPlatformServices` |
| `IIdempotencyStore` | `MemoryIdempotencyStore` | `Singleton` | Đảm bảo tính Idempotent, chống xử lý trùng lặp domain event |
| `IEventDispatcher` | `EventDispatcher` | `Scoped` | Phân phối domain event đến các `IEventHandler<T>` tương ứng |
| `IOutboxProcessor` | `OutboxProcessor` | `Scoped` | Quét batch pending outbox messages, xử lý và cập nhật trạng thái |
| `IEventHandler<...>` | `WorkflowAuditEventHandler` | `Scoped` | Lắng nghe các Workflow Domain Events và ghi vết kiểm toán tự động |

---

## 3. Cấu hình Background Worker cho Outbox Processor (Tùy chọn)

Để Outbox Processor tự động quét và phân phối domain events dưới nền (Background Job / Hosted Service), thêm một `BackgroundService` như sau trong tầng `Infrastructure` hoặc `Api`:

```csharp
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ShdOneErp.Application.Common.Events;

public class OutboxBackgroundWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxBackgroundWorker> _logger;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(5);

    public OutboxBackgroundWorker(IServiceProvider serviceProvider, ILogger<OutboxBackgroundWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Background Worker has started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IOutboxProcessor>();
                var processedCount = await processor.ProcessPendingMessagesAsync(50, stoppingToken);

                if (processedCount > 0)
                {
                    _logger.LogInformation("Outbox Worker dispatched {Count} domain events.", processedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing Outbox Processor.");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }
    }
}
```

Đăng ký Hosted Service trong `Program.cs`:
```csharp
builder.Services.AddHostedService<OutboxBackgroundWorker>();
```

---

## 4. Áp dụng Database Migration & Stored Procedures

File migration đã được biên soạn thủ công (hand-written) tuân thủ quy chuẩn SQL Server của dự án:
`database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql`.

### 4.1. Nội dung Migration
1. **Nâng cấp bảng `Wf_Definitions`:** Thêm cột `Version` (INT, default 1), `Description` (NVARCHAR(500)).
2. **Tạo bảng `Wf_DefinitionVersions`:** Quản lý các phiên bản State Machine Schema bất biến (`DefinitionId`, `Version`, `InitialState`, `DefinitionJson`, `Status`, `PublishedAtUtc`).
3. **Nâng cấp bảng `Wf_Instances`:** Thêm cột `RowVersion` (ROWVERSION - Optimistic Concurrency Control), `DefinitionVersion` (INT), `BusinessUnitId` (UNIQUEIDENTIFIER FK tới `Org_BusinessUnits`), `PayloadJson` (NVARCHAR(MAX)).
4. **Nâng cấp bảng `Wf_History`:** Thêm cột `PayloadJson` (NVARCHAR(MAX)) lưu snapshot payload tại từng bước.
5. **Nâng cấp bảng `System_OutboxMessages`:** Thêm các trường Enterprise Event Envelope (`AggregateType`, `AggregateId`, `CorrelationId`, `CausationId`, `UserId`, `Status`). Tạo Non-Clustered Index `IX_System_OutboxMessages_Status` tối ưu quét pending messages.
6. **Tạo bảng `System_OutboxProcessingHistory`:** Ghi vết bất biến mọi lần dispatch thông điệp (`MessageId`, `ConsumerName`, `AttemptNumber`, `Status`, `ErrorMessage`, `DurationMs`, `ProcessedAtUtc`).
7. **Cài đặt 5 Stored Procedures:**
   - `sp_Workflow_Instance_GetPaged`: Phân trang danh sách workflow instance có lọc theo LegalEntity, BusinessUnit, Status.
   - `sp_Workflow_Instance_GetById`: Lấy chi tiết instance, thông tin đơn vị và schema định nghĩa.
   - `sp_Workflow_Instance_GetHistory`: Truy vấn nhật ký chuyển trạng thái bất biến (Immutable History).
   - `sp_Workflow_Definition_GetByCode`: Lấy định nghĩa quy trình và schema active mới nhất.
   - `sp_System_Outbox_GetPending`: Lấy batch message đang chờ xử lý với khóa chống tranh chấp (`UPDLOCK, READPAST`).
8. **Dữ liệu mầm (Seed Data):**
   - Seed quy trình văn bản dùng chung nền tảng: `GENERIC_DOCUMENT_APPROVAL` (Draft -> PendingReview -> Approved / Rejected / Cancelled).
   - Không chứa bất kỳ quy trình nghiệp vụ chuyên ngành nào (CRM, Tuyển sinh, Visa, Tài chính đều được giữ ở trạng thái TBD).

### 4.2. Lệnh thực thi Migration (khi sẵn sàng gộp DB)
```powershell
# Chạy migration thông qua run-migrations runner nội bộ hoặc sqlcmd
sqlcmd -S localhost -d SHDONEERP_DEV -U sa -P "YourPassword" -i database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql
```

---

## 5. Danh mục Quyền Truy cập (Permissions & GBAC Seed)

Phân hệ Workflow sử dụng cơ chế Direct GBAC thông qua mã quyền dạng `module.action`. Cần đảm bảo các mã quyền sau tồn tại trong bảng `Adm_Permissions`:

| Mã Quyền (PermissionCode) | Tên Quyền | Phân loại | Mục đích |
| :--- | :--- | :--- | :--- |
| `workflow.view` | Xem danh sách & tiến trình Workflow | Foundation | Truy cập trang danh sách và chi tiết instance |
| `workflow.start` | Khởi tạo tiến trình Workflow | Foundation | Tạo mới workflow instance cho entity |
| `workflow.action` | Thực hiện hành động chuyển trạng thái | Foundation | Duyệt, từ chối, yêu cầu bổ sung |
| `workflow.cancel` | Hủy bỏ tiến trình Workflow | Foundation | Hủy luồng công việc đang xử lý |
| `outbox.manage` | Quản trị Outbox Messages | Foundation | Trigger xử lý batch outbox hoặc reprocess failed messages |

---

## 6. Danh mục REST API Endpoints Mới

Các endpoints đã được tích hợp đầy đủ Authorize policy và routing chuẩn mực:

### 6.1. Workflows Controller (`/api/v1/workflows`)
- `POST /api/v1/workflows/instances`: Khởi tạo luồng (Yêu cầu quyền `workflow.start`).
- `POST /api/v1/workflows/instances/{id}/actions`: Thực thi hành động chuyển bước (Kiểm tra quyền cấu hình tại từng transition qua `IPermissionResolver` + quyền `workflow.action`).
- `POST /api/v1/workflows/instances/{id}/cancel`: Hủy tiến trình (Yêu cầu quyền `workflow.cancel`).
- `GET /api/v1/workflows/instances`: Danh sách instance phân trang (Yêu cầu quyền `workflow.view`, tự động giới hạn scope theo `IScopeResolver`).
- `GET /api/v1/workflows/instances/{id}`: Chi tiết instance và các transition hợp lệ hiện tại (Yêu cầu quyền `workflow.view`).
- `GET /api/v1/workflows/instances/{id}/history`: Lịch sử vết chuyển trạng thái bất biến (Yêu cầu quyền `workflow.view`).
- `GET /api/v1/workflows/instances/{id}/available-actions`: Lấy danh sách các nút hành động khả thi dựa trên quyền của người dùng hiện tại.

### 6.2. Outbox Controller (`/api/v1/system/outbox`)
- `POST /api/v1/system/outbox/process`: Trigger xử lý batch pending messages (Yêu cầu quyền `outbox.manage` hoặc `identity.audit.view`).
- `POST /api/v1/system/outbox/reprocess-failed`: Đưa các tin nhắn lỗi về pending để thử lại (Yêu cầu quyền `outbox.manage` hoặc `identity.audit.view`).
