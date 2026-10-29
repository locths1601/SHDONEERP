# 18 — BẢNG KIỂM TRA SẴN SÀNG NGHIỆM THU NỀN TẢNG (FOUNDATION READINESS CHECKLIST)

---

### 1. Mục đích & Nguyên tắc Nghiệm thu
Bảng kiểm tra này là căn cứ pháp lý kỹ thuật duy nhất để Product Owner (PO) và Technical Lead đánh giá mức độ sẵn sàng của **Enterprise Foundation Architecture** trước khi cho phép kích hoạt phát triển bất kỳ phân hệ nghiệp vụ chi tiết nào (CRM, Tuyển sinh, Đào tạo, Du học, Tài chính).

---

### 2. Danh mục Tiêu chí Nghiệm thu Kiến trúc Nền tảng (Readiness Checklist)

| Nhóm Tiêu chí | Mã Tiêu chí | Nội dung Kiểm tra Chi tiết | Bằng chứng Kỹ thuật | Trạng thái Đạt |
|---|---|---|---|:---:|
| **1. Hạ tầng & Môi trường** | `ENV-01` | Dự án xây dựng trên nền tảng .NET 10 SDK chính thức (v10.0.403). Toàn bộ 5 projects backend cấu hình mục tiêu `net10.0`. | `dotnet --list-sdks`, `*.csproj` | **PASS** |
| | `ENV-02` | Migration Runner quản lý 100% bằng handwritten SQL, có khóa phiên phân tán `sp_getapplock` chống xung đột. | `run-migrations.ps1` (0 parse errors) | **PASS** |
| | `ENV-03` | Frontend React 18, TypeScript strict mode, Vite build thành công không có lỗi biên dịch. | `npm run build` (1,594 modules, 0 errors) | **PASS** |
| **2. Cơ cấu Tổ chức** | `ORG-01` | Phân cấp LegalEntity (Pháp nhân) hoàn chỉnh: CRUD, Stored Procedure phân trang, Concurrency RowVersion 409, UI. | Migration 0003, 0005, 0007, Tests | **PASS** |
| | `ORG-02` | Phân cấp BusinessUnit (Đơn vị kinh doanh) hoàn chỉnh: RBAC/GBAC Scoped reads, Unique code per Entity, UI. | Migration 0007, BU Controller, Tests | **PASS** |
| | `ORG-03` | Phân cấp Branch / Campus (Cơ sở đào tạo) hoàn chỉnh: Direct GBAC filtering, Cascade selects, UI. | Migration 0009, Branch Controller, Tests | **PASS** |
| **3. Bảo mật & GBAC** | `SEC-01` | Triển khai mô hình Direct GBAC v4.2: Phân giải quyền trực tiếp từ nhóm, không dùng Role trung gian thời gian thực. | `sp_Identity_User_GetEffectivePermissions` | **PASS** |
| | `SEC-02` | Kiểm soát 4 cấp độ Scope: `Global`, `LegalEntity`, `BusinessUnit`, `Branch` tại backend và Stored Procedures. | `ScopeResolver`, Unit Tests | **PASS** |
| | `SEC-03` | Cơ chế chống rò rỉ dữ liệu chéo pháp nhân (Cross-company data leakage prevention) được kiểm thử tự động. | `ScopeResolverTests.HasResourceAccessAsync` | **PASS** |
| | `SEC-04` | Hỗ trợ Caching quyền hiệu lực với cơ chế Invalidation tức thời khi nhóm/thành viên thay đổi. | `CacheInvalidationTests` | **PASS** |
| | `SEC-05` | Phân loại dữ liệu 4 cấp độ (`Public`, `Internal`, `Confidential`, `Restricted`) kết hợp kiểm tra Resource Ownership. | `ScopeResolver.HasResourceAccessAsync` | **PASS** |
| **4. Nền tảng Dùng chung** | `PLT-01` | Hệ thống Audit Logging tự động ghi nhận biến động dữ liệu CUD qua `AuditSaveChangesInterceptor` vào `Audit_SystemLogs`. | Migration 0010, `AuditSaveChangesInterceptor` | **PASS** |
| | `PLT-02` | Kiến trúc Transactional Outbox Pattern cho Domain Events sẵn sàng trong `System_OutboxMessages`. | Migration 0010, `OutboxMessage` | **PASS** |
| | `PLT-03` | Schema và Hợp đồng dịch vụ Quản lý Tài liệu số hóa (`Doc_Documents`, `IDocumentStorageService`, SHA256 checksum). | Migration 0010, `DocumentEntities.cs` | **PASS** |
| | `PLT-04` | Schema và Hợp đồng dịch vụ Quy trình Phê duyệt Đa cấp (`Wf_Definitions`, `Wf_Instances`, `IWorkflowEngine`). | Migration 0010, `WorkflowEntities.cs` | **PASS** |
| | `PLT-05` | Schema và Hợp đồng dịch vụ Danh mục Dữ liệu dùng chung (`System_MasterDataCatalogs`, `IMasterDataService`). | Migration 0010, `MasterDataEntities.cs` | **PASS** |
| | `PLT-06` | Schema Đăng ký Module & Feature Registry (`System_Modules`, `System_Features`, `IFeatureRegistryService`). | Migration 0010, `ModuleRegistryEntities.cs` | **PASS** |
| **5. Party 360 Core** | `PTY-01` | Nền tảng định danh Khách hàng, Học viên, Đối tác độc lập: DDD Entities, Stored Procedures, 360 View Drawer. | Migration 0004, 0008, Party Controller, Tests | **PASS** |
| **6. Kiểm thử Tự động** | `TST-01` | 100% Unit Tests & Security Tests chạy thành công, không có bài test nào bị bỏ qua hoặc thất bại. | `dotnet test` (63/63 PASS, 0 Failed) | **PASS** |

---

### 3. Kết luận Đánh giá Mức độ Sẵn sàng (Readiness Verdict)

- **Tổng số tiêu chí đánh giá**: 18 / 18 tiêu chí kỹ thuật.
- **Số tiêu chí đạt**: **18 / 18 (100% PASS)**.
- **Kết luận**:
  **HỆ THỐNG ĐÃ HOÀN TẤT VÀ ĐẠT TOÀN BỘ CÁC TIÊU CHÍ KIẾN TRÚC NỀN TẢNG (ENTERPRISE FOUNDATION ARCHITECTURE READY).**
  Nền tảng đã sẵn sàng bảo đảm cho việc triển khai các module nghiệp vụ chuyên sâu theo đúng quy chuẩn kiến trúc thống nhất sau khi được Product Owner phê duyệt.

