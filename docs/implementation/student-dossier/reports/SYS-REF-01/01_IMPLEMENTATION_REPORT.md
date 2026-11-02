# SHD OneERP — SYS-REF-01 IMPLEMENTATION REPORT

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Epic:** `SYS-REF` — Cấu hình hệ thống & Dữ liệu nguồn  
**Ngày thực hiện:** 02/11/2026  
**Master Agent:** Master AI Agent Orchestrator  
**Sub-Agents phối hợp:** Database Agent, Backend Agent, Frontend Agent, QA Agent  

---

## 1. TỔNG QUAN & BASELINE AUDIT

- **Baseline trạng thái:** `PARTIAL` (Bảng `System_MasterDataCatalogs` và thực thể `MasterDataCatalog` đã tồn tại từ migration `0010`, nhưng thiếu các thuộc tính phân hệ, kiểm soát đồng thời và Stored Procedures).
- **Mục tiêu hoàn thành:** Xây dựng giải pháp toàn diện End-to-End từ CSDL, Backend CQRS (EF Core Write + Stored Procedures Read), Direct GBAC v4.2, đến giao diện React 18 với đầy đủ 6 trạng thái UI theo Rule 25.
- **Ranh giới nghiệp vụ (Strict Scope Isolation):** Chỉ quản lý các nhóm danh mục (Catalogs). Không triển khai CRUD giá trị con (Items) thuộc về `SYS-REF-02`.

---

## 2. QUYẾT ĐỊNH CỦA PRODUCT OWNER ĐƯỢC ÁP DỤNG

1. **PO-MIG (Migration Remediation):** Phục hồi CSDL DEV `ShdOneErpDb` qua Fresh Database Rehearsal (15/15 migrations thành công). Áp dụng handwritten migration `20261102_0016` có cơ chế Distributed App Lock (`sp_getapplock`).
2. **PO-001 & PO-002 (Single Source of Truth & Scope):**
   - Hợp nhất trạng thái hoạt động vào trường boolean `IsActive` (`ACTIVE` / `INACTIVE`).
   - Hợp nhất chế độ quản trị vào trường boolean `IsSystem` (`SYSTEM_CONTROLLED` / `ADMIN_MANAGED`).
   - Phạm vi dữ liệu `ScopePolicy = 'GLOBAL'` áp dụng toàn hệ sinh thái doanh nghiệp.
   - Nhóm danh mục `SYSTEM_CONTROLLED` bị khóa hoàn toàn chức năng đổi mã hoặc ngừng sử dụng qua UI để bảo vệ luồng nghiệp vụ cốt lõi.

---

## 3. THAY ĐỔI KIẾN TRÚC & PHẦN TỬ CÔNG NGHỆ

- **Database:**
  - Bổ sung các cột: `OwnerModule` (NVARCHAR(50)), `ScopePolicy` (NVARCHAR(30)), `IsActive` (BIT), `UpdatedAtUtc` (DATETIME2(7)), `RowVersion` (ROWVERSION).
  - Ràng buộc Unique Index: `UQ_System_MasterDataCatalogs_Code` trên cột `Code`.
  - CQRS Read Stored Procedures: `sp_System_MasterData_Catalog_GetPagedList` (Whitelist Sort, xử lý empty set & page out-of-bounds) và `sp_System_MasterData_Catalog_GetById`.
  - Direct GBAC: Mã quyền `system.reference_data.view`, `system.reference_data.manage`, `system.reference_data.system_admin` cấp cho nhóm `ADMINISTRATORS`.
- **Backend:**
  - Domain Entity [`MasterDataCatalog`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs) bổ sung invariants, phương thức `UpdateDetails`, `Deactivate`, `Activate`.
  - Infrastructure Configuration [`PlatformConfigurations.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/Configurations/PlatformConfigurations.cs) cấu hình Fluent EF Core với `IsRowVersion()`.
  - Read Service [`MasterDataCatalogReadService.Sp.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/StoredProcedures/ReadServices/MasterDataCatalogReadService.Sp.cs) thực thi Stored Procedure qua `ISpExecutor` (Dapper).
  - Write Service [`MasterDataCatalogWriteService.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Services/MasterDataCatalogWriteService.cs) kiểm soát quyền Direct GBAC, chống trùng lặp mã và xử lý xung đột đồng thời `DbUpdateConcurrencyException`.
  - Controller [`MasterDataCatalogsController.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Api/Controllers/MasterDataCatalogsController.cs) với route `/api/v1/system/reference-data/catalogs` và `[Authorize(Policy = "Permission:...")]`.
- **Frontend:**
  - Feature module `frontend/src/features/system-reference-data/`.
  - Hooks TanStack Query `useCatalogs`, `useCreateCatalog`, `useUpdateCatalog`, `useDeactivateCatalog`, `useActivateCatalog`.
  - UI 6 trạng thái: Skeleton loading, EmptyState, DataGrid bảng dữ liệu, Error banner, ConfirmDialog, CatalogConflictModal (409).
  - Routing: `/admin/reference-data` tích hợp trên `Sidebar.tsx` và `App.tsx`.

---

## 4. BẢNG ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

| AC | Nội dung tiêu chí | Kết quả | Đường dẫn bằng chứng kiểm thử | Ghi chú kỹ thuật |
|:---:|---|:---:|---|---|
| **AC01** | Admin có quyền tạo nhóm danh mục hợp lệ, lưu trữ CSDL và ghi nhận đầy đủ | **PASS** | `scratch/verify_live_db_sys_ref_01.ps1`<br>`CatalogWriteServiceTests.cs` | Insert thành công vào SQL Server `ShdOneErpDb`, sinh mã RowVersion hợp lệ |
| **AC02** | Chặn mã code trùng trong hệ thống, trả về mã lỗi validation rõ ràng | **PASS** | `CatalogWriteServiceTests.CreateAsync_DuplicateCode`<br>`verify_live_db_sys_ref_01.ps1` | Chặn cả ở Application level (`DUPLICATE_CODE`) và CSDL Level (`UQ_System_MasterDataCatalogs_Code`) |
| **AC03** | Khóa mã `Code` (bất biến), cấm xóa cứng, cấm ngừng dùng danh mục hệ thống | **PASS** | `CatalogWriteServiceTests.DeactivateAsync_SystemControlledCatalog`<br>`MasterDataCatalogDomainTests.cs` | Entity ném `CANNOT_DEACTIVATE_SYSTEM_CATALOG`. UI disable ô nhập mã Code |
| **AC04** | Người dùng không có quyền hoặc token không hợp lệ bị từ chối truy cập | **PASS** | `CatalogWriteServiceTests.CreateAsync_WhenUserLacksPermission`<br>`MasterDataCatalogsController.cs` | Áp dụng chính sách Fail-Closed Direct GBAC v4.2 `PermissionAuthorizationHandler` |
| **AC05** | Nhóm danh mục mới kích hoạt xuất hiện ngay trên UI không cần deploy lại | **PASS** | `verify_live_db_sys_ref_01.ps1` mục 4 | Stored Procedure `sp_System_MasterData_Catalog_GetPagedList` đọc trực tiếp từ SQL Server |

---

## 5. CÔNG VIỆC CHƯA HOÀN THÀNH & KẾT LUẬN KỸ THUẬT

- **Công việc tồn đọng:** 0 (Không còn công việc tồn đọng cho story SYS-REF-01).
- **Chuyển giao tiếp theo:** Chuẩn bị sẵn sàng cho `SYS-REF-02` (Quản lý giá trị danh mục con - Items).
- **Kết luận:** Story `SYS-REF-01` đã được hoàn tất toàn diện 100%, đáp ứng đầy đủ quy chuẩn kiến trúc và tiêu chuẩn chất lượng khắt khe nhất của SHD OneERP.

