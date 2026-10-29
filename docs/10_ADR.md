# 10 — ARCHITECTURAL DECISION RECORDS (ADR)

---

## ADR-001: Lựa chọn Kiến trúc Modular Monolith thay vì Microservices ban đầu
- **Bối cảnh**: Hệ sinh thái SHD Corp bao gồm nhiều mảng nghiệp vụ (Đào tạo, Du học, Visa, Định cư, Tài chính) cần chia sẻ định danh Party 360 và thông tin tổ chức. Đội ngũ đang trong giai đoạn xây dựng và chuẩn hóa mô hình nghiệp vụ.
- **Quyết định**: Chọn kiến trúc Modular Monolith dựa trên Clean Architecture. Mã nguồn chung một repository và giải pháp triển khai thống nhất, phân tách boundary rõ ràng bằng projects/namespaces (`ShdOneErp.Domain`, `ShdOneErp.Application`, `ShdOneErp.Infrastructure`, `ShdOneErp.Api`).
- **Hệ quả**: Giảm chi phí vận hành hạ tầng, loại bỏ độ trễ và phân tán dữ liệu của distributed transactions, dễ dàng tái cấu trúc domain. Sẵn sàng tách ra Microservices trong tương lai khi có nhu cầu tải riêng biệt.

## ADR-002: Tách biệt Write-side (EF Core) và Read-side (Stored Procedures)
- **Bối cảnh**: Hệ thống ERP yêu cầu tốc độ truy vấn danh sách, tìm kiếm, phân trang và báo cáo tổng hợp cực nhanh; đồng thời cần đảm bảo tính toàn vẹn và concurrency cho các thao tác ghi dữ liệu.
- **Quyết định**:
  - Write-side: Sử dụng EF Core với Unit of Work, Change Tracking, Concurrency Token (`rowversion`), Auditing.
  - Read-side: 100% API GET nghiệp vụ bắt buộc thực thi qua SQL Server Stored Procedures (`sp_*`) thông qua `ISpExecutor`.
- **Hệ quả**: Truy vấn GET được tối ưu triệt để bằng Execution Plan của SQL Server, loại bỏ vấn đề N+1 và chi phí mapping thừa của ORM. Developer phải duy trì Stored Procedures cùng với migrations.

## ADR-003: Phân quyền Direct GBAC v4.2 kết hợp Data Scoping
- **Bối cảnh**: Hệ thống phục vụ nhiều công ty con và đơn vị kinh doanh. Một nhân viên có thể là Kế toán của Công ty A nhưng chỉ có quyền xem báo cáo tại Công ty B.
- **Quyết định**: Áp dụng mô hình Direct Group-Based Access Control kết hợp với Scope (`Global`, `LegalEntity`, `BusinessUnit`, `Branch`). Permission được định nghĩa canonical `module.action`. Kiểm tra quyền được thực thi chặt chẽ ở cả Controller Policy và SQL Query Parameters.
- **Hệ quả**: Phân quyền linh hoạt, bảo mật deny-by-default, ngăn chặn hoàn toàn việc rò rỉ dữ liệu chéo giữa các pháp nhân.

## ADR-004: Quản lý Database bằng Handwritten SQL Migrations
- **Bối cảnh**: EF Core Migrations tự động thường sinh ra code SQL khó kiểm soát, khó tối ưu index và không hỗ trợ trực tiếp quản lý version của Stored Procedures.
- **Quyết định**: Quản lý 100% schema, stored procedures, indexes và seeds thông qua các file SQL viết tay có đánh số thứ tự phiên bản theo ngày giờ (`database/migrations/YYYYMMDD_HHMM_Name.sql`). Quản lý lịch sử bằng bảng `__DbMigrationHistory`.
- **Hệ quả**: DBA kiểm soát hoàn toàn chất lượng câu lệnh SQL, migration an toàn và tương thích với CI/CD pipeline.

## ADR-005: Tự động Ghi vết Kiểm toán (Audit Logging) qua SaveChanges Interceptor
- **Bối cảnh**: Các quy định kiểm soát nội bộ và tuân thủ dữ liệu doanh nghiệp đòi hỏi mọi biến động dữ liệu quan trọng (Insert, Update, SoftDelete) phải được lưu vết đầy đủ ai sửa, sửa lúc nào, giá trị trước và sau.
- **Quyết định**: Triển khai `AuditSaveChangesInterceptor` tích hợp tự động vào EF Core `ShdOneErpDbContext`. Interceptor chụp ảnh JSON snapshot của `OldValues` và `NewValues`, ghi vào bảng `Audit_SystemLogs` trong cùng database transaction.
- **Hệ quả**: Lập trình viên không cần viết code audit thủ công trong từng service. Mọi thao tác ghi dữ liệu đều tự động được giám sát minh bạch.

## ADR-006: Áp dụng Transactional Outbox Pattern cho Sự kiện Miền (Domain Events)
- **Bối cảnh**: Khi một thực thể nghiệp vụ thay đổi trạng thái, các hệ thống vệ tinh hoặc module khác cần nhận sự kiện. Việc gọi trực tiếp event broker bên ngoài trong transaction EF Core có nguy cơ gây mất dữ liệu hoặc dual-write problem nếu mạng lỗi.
- **Quyết định**: Triển khai Transactional Outbox Pattern. Các sự kiện phát sinh từ thực thể (`BaseEntity.DomainEvents`) được `AuditSaveChangesInterceptor` bóc tách và lưu vào bảng `System_OutboxMessages` trong cùng transaction với dữ liệu nghiệp vụ. Một Background Worker sẽ định kỳ quét và phát tán sự kiện ra ngoài.
- **Hệ quả**: Đảm bảo 100% tính nhất quán (At-least-once delivery), loại bỏ hoàn toàn rủi ro mất mát sự kiện khi hệ thống gặp sự cố mạng hoặc khởi động lại.

## ADR-007: Cơ chế Caching & Active Invalidation cho Quyền Hiệu Lực GBAC
- **Bối cảnh**: Mỗi HTTP request đến API đều kích hoạt Authorization Policy để xác thực quyền hạn. Việc liên tục query Stored Procedure `sp_Identity_User_GetEffectivePermissions` vào database cho mỗi request tạo tải không cần thiết.
- **Quyết định**: Áp dụng `IMemoryCache` đệm danh sách quyền hiệu lực của người dùng theo key `auth:effective_perms:{userId}` trong 60 giây. Cung cấp cơ chế `IPermissionCacheInvalidator.InvalidateUser(userId)` để xóa cache ngay lập tức khi quản trị viên phân bổ lại nhóm quyền hoặc thay đổi thành viên.
- **Hệ quả**: Giảm 95% tải truy vấn quyền lên cơ sở dữ liệu mà vẫn đảm bảo tính cập nhật ngay lập tức khi có quyết định phân quyền mới.

## ADR-008: Chống Rò rỉ Dữ liệu Doanh nghiệp bằng Cơ chế Bảo mật 3 Lớp
- **Bối cảnh**: Môi trường đa pháp nhân có nguy cơ rò rỉ dữ liệu chéo giữa các công ty thành viên nếu chỉ kiểm tra permission thông thường. Một số hồ sơ học viên hoặc báo cáo tài chính còn có cấp độ bảo mật cao hơn dữ liệu thông thường.
- **Quyết định**: Triển khai dịch vụ `IScopeResolver` kiểm tra bảo mật 3 lớp chặt chẽ:
  1. *Lớp 1 (Permission)*: Có quyền hành động (`module.action`).
  2. *Lớp 2 (Data Scope)*: Pháp nhân/Đơn vị/Cơ sở mục tiêu phải nằm trong phạm vi được cấp của người dùng.
  3. *Lớp 3 (Classification & Resource Ownership)*: Đối với dữ liệu `Confidential` hoặc `Restricted`, chỉ cho phép chính chủ sở hữu tài nguyên hoặc Quản trị viên tối cao truy cập.
- **Hệ quả**: Chấm dứt hoàn toàn nguy cơ rò rỉ dữ liệu chéo công ty (Cross-company data leakage) và bảo vệ tuyệt đối dữ liệu nhạy cảm.

## ADR-009: Chuẩn hóa Nền tảng Quản lý Tài liệu Số (Document Management Foundation)
- **Bối cảnh**: Các phân hệ Tuyển sinh, Du học, Visa và Tài chính đều có nhu cầu lưu trữ tệp tin (CCCD, Hộ chiếu, Bằng cấp, Hợp đồng, Hóa đơn). Nếu mỗi module tự lưu trữ file sẽ gây phân mảnh và khó quản lý an toàn thông tin.
- **Quyết định**: Xây dựng nền tảng quản lý tài liệu số dùng chung (`Doc_Documents`, `IDocumentStorageService`). Mỗi tài liệu lưu vết mã băm SHA256, phân loại dữ liệu (`DataClassification`), hỗ trợ mã hóa lưu trữ và kiểm soát quyền truy cập tập trung.
- **Hệ quả**: Quản lý tập trung tài liệu toàn doanh nghiệp, chống trùng lặp, dễ dàng tích hợp dịch vụ lưu trữ đám mây (AWS S3, Azure Blob, MinIO) sau này.

## ADR-010: Nền tảng Máy trạng thái Quy trình Phê duyệt Đa cấp (Workflow State Machine)
- **Bối cảnh**: Các nghiệp vụ duyệt hồ sơ visa, duyệt hợp đồng học viên, duyệt chi ngân sách đều cần quy trình phê duyệt nhiều bước và chuyển giao trạng thái.
- **Quyết định**: Xây dựng nền tảng State Machine & Approval Foundation chung (`Wf_Definitions`, `Wf_Instances`, `Wf_History`, `IWorkflowEngine`). Định nghĩa quy trình bằng JSON Schema cấu hình được, lưu vết lịch sử mọi hành động duyệt/từ chối/yêu cầu bổ sung của từng người dùng.
- **Hệ quả**: Tái sử dụng một engine quy trình duy nhất cho toàn bộ hệ thống SHD OneERP, dễ dàng tùy biến luồng duyệt mà không cần viết lại mã nguồn.

## ADR-011: Quản lý Phiên bản Quy trình (Versioned State Machine) & Lịch sử Luân chuyển Bất biến
- **Bối cảnh**: Trong quá trình vận hành doanh nghiệp, quy trình phê duyệt và các bước thẩm định thường xuyên được sửa đổi theo chính sách mới. Các hồ sơ cũ đang luân chuyển không được phép bị đứt gãy hoặc sai lệch logic khi quy trình cập nhật version mới.
- **Quyết định**:
  1. Tách biệt `WorkflowDefinition` (header) và `WorkflowDefinitionVersion` (immutable published version chứa `Version`, `InitialState`, `DefinitionJson`, `PublishedAtUtc`).
  2. Mỗi `WorkflowInstance` khi khởi tạo lưu cố định `DefinitionVersion` tại thời điểm đó để đảm bảo tuân thủ state machine tương ứng suốt vòng đời hồ sơ.
  3. Lịch sử luân chuyển trạng thái (`Wf_History` / `WorkflowTransitionHistory`) là cấu trúc dữ liệu Append-Only bất biến (Immutable), không cung cấp API hoặc phương thức cập nhật/xóa cho nghiệp vụ thông thường.
  4. Mọi transition bị từ chối do thiếu quyền, sai trạng thái, vi phạm điều kiện logic hoặc xung đột đồng thời (`RowVersion`) đều không làm thay đổi trạng thái và không ghi thêm bản ghi lịch sử rác.
- **Hệ quả**: Đảm bảo tính toàn vẹn nghiệp vụ, kiểm soát lịch sử pháp lý tuyệt đối cho các kỳ kiểm toán nội bộ và thanh tra doanh nghiệp.

## ADR-012: Xử lý Sự kiện Miền Đáng tin cậy (Idempotent Event Dispatching & Processing History)
- **Bối cảnh**: Hệ thống xử lý sự kiện bất đồng bộ qua Transactional Outbox có nguy cơ xử lý lặp thông điệp (At-least-once delivery) khi worker thử lại (retry) hoặc khi xảy ra sự cố mạng chập chờn, dẫn đến nguy cơ cộng dồn dữ liệu hoặc gửi thông báo trùng lặp.
- **Quyết định**:
  1. Trang bị `IIdempotencyStore` (`MemoryIdempotencyStore` / Distributed Cache) lưu vết `MessageId` kèm `ConsumerName` với cửa sổ TTL (mặc định 24 giờ). Trước khi dispatch, worker kiểm tra cache idempotency; nếu đã xử lý thì bỏ qua ngay.
  2. Bảng `System_OutboxProcessingHistory` lưu vết bất biến toàn bộ các lần thử xử lý (AttemptNumber, DurationMs, Status, ErrorMessage) để phục vụ quan sát vận hành (Observability) và truy vết sự cố.
  3. Áp dụng Exponential Backoff Retry (tối đa 5 lần) và Dead-Letter Queue khi vượt quá ngưỡng thử lại, cho phép người quản trị can thiệp tái xử lý qua API sau khi khắc phục nguyên nhân gốc rễ.
- **Hệ quả**: Đảm bảo an toàn tuyệt đối chống trùng lặp sự kiện (Exactly-once semantic effect), minh bạch hóa toàn bộ quá trình phát tán sự kiện miền.
