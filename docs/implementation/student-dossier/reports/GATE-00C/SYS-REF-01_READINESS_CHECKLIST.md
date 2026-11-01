# SHD OneERP — SYS-REF-01 READINESS CHECKLIST
## GATE-00C: Bảng Kiểm định Sẵn sàng Triển khai Câu chuyện Quản lý Nhóm Danh mục

**Mã Story:** `SYS-REF-01`  
**Tên Story:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Thuộc Epic:** `SYS-REF` — Cấu hình hệ thống & Dữ liệu nguồn  
**Mức độ ưu tiên:** P0  
**Tác giả:** Master AI Agent Orchestrator  
**Trạng thái hiện tại:** `BLOCKED` (Chờ hoàn tất phục hồi CSDL GATE-00C và Product Owner phê duyệt)  
**Trạng thái mục tiêu:** `READY_FOR_DEV` (Sẵn sàng mở Sprint 1 và phân công Sub-Agents)  

---

## 1. MA TRẬN ĐÁNH GIÁ SẴN SÀNG TOÀN DIỆN (READINESS ASSESSMENT MATRIX)

| Chiều Đánh giá | Tiêu chuẩn Kiểm định | Hiện trạng & Bằng chứng Đáp ứng | Đánh giá |
|---|---|---|:---:|
| **1. Domain Architecture** | - Tái sử dụng thực thể hiện hữu `MasterDataCatalog`, không tạo trùng lặp.<br>- Hợp nhất một nguồn sự thật: `IsActive` (trạng thái) và `IsSystem` (chế độ quản trị).<br>- Mã `CatalogCode` bất biến (immutable), không cho đổi mã.<br>- Tuyệt đối không xóa cứng (hard-delete) khi đã có tham chiếu.<br>- Không hardcode/seed danh mục nghiệp vụ vào mã nguồn. | - Thực thể [`MasterDataCatalog`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs#L3-L23) đã có sẵn trong Domain.<br>- Bản thiết kế hiệu đính `SYS-REF-01_REVISED_CONTRACT.md` đã loại bỏ hoàn toàn các trường thừa `Status` và `ManagementMode`.<br>- Quy tắc Domain Invariants đã được đặc tả hoàn chỉnh. | **READY** |
| **2. Scope Boundary** | - Phân định rõ ràng: SYS-REF-01 chỉ quản lý nhóm danh mục (Catalogs).<br>- Không làm CRUD giá trị con (Items) trong story này (thuộc SYS-REF-02). | - Ranh giới story đã được cô lập 100%. Giao diện và API của SYS-REF-01 không chứa form CRUD Items. | **READY** |
| **3. Database & Schema** | - Tái sử dụng bảng `System_MasterDataCatalogs` đã có trong SQL Server.<br>- Dự thảo migration `20261102_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql` bổ sung `OwnerModule`, `ScopePolicy`, `IsActive`, `RowVersion` (concurrency token).<br>- Ràng buộc Unique Index trên `Code` chống race condition.<br>- Stored Procedures cho API GET tuân thủ CQRS. | - Bảng CSDL đã tồn tại từ migration `0010`.<br>- Tệp DDL và Stored Procedure `sp_System_MasterData_Catalog_GetPagedList` và `sp_System_MasterData_Catalog_GetById` đã được soạn thảo chi tiết.<br>- SP xử lý đầy đủ các tình huống biên (danh sách rỗng, page vượt quá giới hạn, whitelist sort an toàn). | **READY** (Chờ apply sau recovery) |
| **4. Security & Direct GBAC** | - Quyền xem: `system.reference_data.view`.<br>- Quyền quản lý: `system.reference_data.manage`.<br>- Quyền danh mục hệ thống: `system.reference_data.system_admin`.<br>- Direct GBAC fail-closed tại Controller.<br>- Phân tích Data Scope: `GLOBAL` cho toàn tập đoàn trong Phase 1.<br>- Ghi nhật ký kiểm toán đầy đủ vào `Audit_SystemLogs`. | - Mã quyền chuẩn hóa theo cú pháp rule [`40-permission-codes.mdc`](file:///.cursor/rules/40-permission-codes.mdc).<br>- Controller và Middleware đã được thiết kế cơ chế chặn deny-by-default.<br>- Thao tác CUD ghi đầy đủ OldValues, NewValues, TraceId. | **READY** |
| **5. Frontend & UX** | - Tuân thủ đầy đủ 6 trạng thái UI của rule [`25-ui-ux-experience.mdc`](file:///.cursor/rules/25-ui-ux-experience.mdc).<br>- Tái sử dụng UI components dùng chung trong `components/common/`.<br>- Xử lý xung đột đồng thời 409 bằng hộp thoại cảnh báo thân thiện.<br>- Không hardcode danh sách nhóm danh mục trên giao diện. | - Vị trí component: `frontend/src/features/system-reference-data/`.<br>- Định tuyến menu: `Cấu hình hệ thống → Dữ liệu nguồn` (`/admin/reference-data`).<br>- Sử dụng `Skeleton`, `DataGrid`, `SideDrawer`, `Can`, `ConfirmDialog`. | **READY** |
| **6. Quality & Verification** | - Toàn bộ tiêu chí nghiệm thu AC01 - AC05 có kịch bản test cụ thể.<br>- Kiểm thử Optimistic Concurrency 409.<br>- Kiểm thử validation mã trùng lặp (Duplicate Code). | - Bảng ma trận nghiệm thu AC Traceability đã sẵn sàng.<br>- Kế hoạch kiểm thử xUnit và WebApplicationFactory đã định hình. | **READY** |
| **7. Prerequisites Gate** | - CSDL chính `ShdOneErpDb` phải được phục hồi hoàn tất, migration `0001–0015` được đồng bộ vào `__DbMigrationHistory`. | - Phụ thuộc vào việc thực thi `DATABASE_RECOVERY_EXECUTION_PLAN.md`. | **BLOCKED** (Chờ PO phê duyệt thực thi) |

---

## 2. ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU (AC MAPPING FOR IMPLEMENTATION)

| Mã AC | Tiêu chí Nghiệm thu | Kịch bản Kiểm thử Dự kiến | Bằng chứng Cần thu thập |
|:---:|---|---|---|
| **AC01** | Admin có quyền `system.reference_data.manage` tạo nhóm hợp lệ | Gửi `POST /api/v1/system/reference-data/catalogs` với payload hợp lệ | - HTTP 201 Created.<br>- Bản ghi xuất hiện trong CSDL.<br>- Có bản ghi Audit log trong `Audit_SystemLogs`. |
| **AC02** | Chặn mã code trùng trong cùng scope | Gửi `POST` với mã `Code` đã tồn tại | - HTTP 400 Bad Request với mã lỗi `DUPLICATE_CODE`.<br>- Không sinh bản ghi rác trong CSDL. |
| **AC03** | Chặn xóa hoặc đổi mã khi đã có tham chiếu | Gửi yêu cầu đổi `Code` hoặc xóa nhóm đã có dữ liệu | - Backend từ chối với HTTP 400/409.<br>- Mã `Code` là bất biến (immutable). Chỉ hỗ trợ `Deactivate`. |
| **AC04** | Người dùng không có quyền bị từ chối truy cập | Gửi request khi chưa đăng nhập hoặc thiếu permission | - HTTP 401 Unauthorized hoặc 403 Forbidden (Direct GBAC fail-closed). |
| **AC05** | Nhóm mới hiển thị ngay lập tức trên UI | Sau khi tạo thành công, load lại danh sách hoặc dropdown | - Nhóm mới xuất hiện ngay qua API GET/SP mà không cần restart server hay deploy. |

---

## 3. CÁC QUYẾT ĐỊNH CỦA PRODUCT OWNER ĐỂ MỞ KHÓA TRIỂN KHAI

Để chuyển trạng thái của `SYS-REF-01` từ `BLOCKED` sang `READY_FOR_DEV`, kính trình Product Owner phê chuẩn 3 quyết định:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CÁC QUYẾT ĐỊNH CỦA PO CẦN PHÊ CHUẨN                             │
├──────────┬──────────────────────────────────────────┬──────────────────────────────────┤
│ Mã QĐ    │ Nội dung Quyết định                      │ Đề xuất của Kỹ thuật             │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ PO-MIG   │ Phê duyệt Bản vá & Kế hoạch Phục hồi     │ Đồng ý cho Master Agent thực thi │
│          │ Migration (GATE-00C Remediation Plan)    │ trên Fresh DB & Clone DB.        │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ PO-001 & │ Phân quyền Quản trị & Scope Danh mục     │ Gán quyền `manage` cho Admin,    │
│ PO-002   │ (User Story SYS-REF-01)                  │ khóa nhóm `IsSystem = 1`,        │
│          │                                          │ áp dụng `ScopePolicy = GLOBAL`.  │
├──────────┼──────────────────────────────────────────┼──────────────────────────────────┤
│ PO-011   │ Mô hình Người bảo lãnh (Sponsorship)     │ Chọn Phương án A: Tách           │
│          │ trong hồ sơ du học Hàn Quốc              │ PartyRelationship (Party360) và  │
│          │                                          │ Dossier Sponsorship (Admission). │
└──────────┴──────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 4. KẾ HOẠCH BÀN GIAO SPRINT 1 SAU KHI ĐƯỢC PHÊ DUYỆT

Ngay sau khi nhận được sự phê duyệt của Product Owner:
1. **Bước 1:** Master Agent thực thi Kế hoạch Phục hồi Migration theo 6 giai đoạn, nghiệm thu tính toàn vẹn của CSDL và runner.
2. **Bước 2:** Chuyển trạng thái `SYS-REF-01` sang `READY_FOR_DEV`.
3. **Bước 3:** Phân công nhiệm vụ song song cho các Sub-Agents theo tài liệu `04_AI_AGENT_ORCHESTRATION.md`:
   - **Agent A (Backend / Database):** Tạo migration `20261102_0016`, viết Stored Procedures, cấu hình EF Core, cài đặt Commands/Queries, Validators và API Controller.
   - **Agent B (Frontend / UI):** Xây dựng trang danh sách nhóm danh mục, Form tạo/sửa trên SideDrawer, tích hợp đầy đủ 6 trạng thái UI và component `<Can>` guard.
4. **Bước 4:** Master Agent tích hợp, kiểm thử end-to-end trên CSDL thật và xuất xưởng 8 tệp báo cáo nghiệm thu theo mẫu `05_REPORT_TEMPLATES_AND_PO_ACCEPTANCE.md`.

