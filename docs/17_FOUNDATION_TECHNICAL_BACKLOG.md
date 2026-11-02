# 17 — BACKLOG KỸ THUẬT NỀN TẢNG (FOUNDATION TECHNICAL BACKLOG)

---

### 1. Nguyên tắc Ưu tiên Backlog
Toàn bộ các mục trong Backlog này đều tập trung phục vụ việc gia cố, hoàn thiện và kiểm thử **Enterprise Foundation Architecture**. Không bao gồm các tính năng nghiệp vụ CRM, Tuyển sinh hay Du học.

---

### 2. Danh sách Hạng mục Kỹ thuật Nền tảng (Prioritized Foundation Backlog)

| Mã ID | Tên Hạng Mục Kỹ Thuật | Phân Vùng | Mức Độ | Trạng thái |
|---|---|---|---|---|
| **[FND-01]** | Hoàn thiện Màn hình UI Quản trị Nhóm quyền Direct GBAC (`/admin/user-groups`) cho phép gán quyền và chỉ định Data Scope trực quan. | Identity & GBAC | **P0 (Critical)** | `READY_FOR_DEV` |
| **[FND-02]** | Xây dựng API và Màn hình Tra cứu Nhật ký Kiểm toán (`/admin/audit-logs`) phục vụ Ban Kiểm soát và IT Admin. | Audit Logging | **P0 (Critical)** | `READY_FOR_DEV` |
| **[FND-03]** | Triển khai Background Worker (.NET IHostedService / Quartz.NET) xử lý quét bảng `System_OutboxMessages` phát tán sự kiện. | Event & Outbox | **P1 (High)** | `READY_FOR_DEV` |
| **[FND-04]** | Hiện thực hóa dịch vụ lưu trữ tài liệu tệp tin vật lý (`LocalFileSystemStorageService`) triển khai `IDocumentStorageService` kèm kiểm tra mã băm SHA256. | Document Platform | **P1 (High)** | `READY_FOR_DEV` |
| **[FND-05]** | Xây dựng API CRUD và Màn hình Quản trị Danh mục Master Data dùng chung (`/admin/master-data`). | Master Data | **P1 (High)** | `READY_FOR_DEV` |
| **[FND-06]** | Hiện thực hóa `WorkflowEngine` cơ bản xử lý chuyển trạng thái State Machine theo cấu hình JSON của `Wf_Definitions`. | Workflow Platform | **P2 (Medium)** | `PLANNED` |
| **[FND-07]** | Thiết lập Performance Benchmark cho Stored Procedures khi volume dữ liệu lớn (> 500,000 bản ghi Party và Branch). | Performance & Scale | **P2 (Medium)** | `PLANNED` |
| **[FND-08]** | Cấu hình GitHub Actions CI Pipeline tự động thực thi `dotnet test` và `npm run build` kiểm tra chất lượng mỗi Pull Request. | CI/CD & DevOps | **P2 (Medium)** | `PLANNED` |
| **[FND-09]** | Bổ sung Distributed Cache Redis Provider thay thế in-memory cache cho môi trường triển khai multi-instance. | Caching & Scale | **P3 (Low)** | `PLANNED` |

---

### 3. Kế hoạch Triển khai Hạng mục Kế tiếp
Sau khi Product Owner phê duyệt bộ hồ sơ kiến trúc nền tảng, hạng mục **`[FND-01]` (Màn hình Quản trị Nhóm quyền Direct GBAC & Gán Scope)** và **`[FND-02]` (Giao diện Tra cứu Nhật ký Kiểm toán Audit Logs)** sẽ được kích hoạt thực hiện đầu tiên để ban quản trị có công cụ trực quan phân bổ nhân sự vào các Pháp nhân và Cơ sở đào tạo.

