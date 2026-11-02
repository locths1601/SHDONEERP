# SHD OneERP — SYS-REF-02 IMPLEMENTATION STATUS REPORT

**Story ID:** `SYS-REF-02`  
**Story Title:** Quản lý giá trị danh mục dùng chung (System Reference Data Items)  
**Epic:** `SYS-REF` — Cấu hình hệ thống & Dữ liệu nguồn  
**Ngày thực hiện:** 02/11/2026  
**Chế độ thực thi:** `FAST EXECUTION — MINIMAL OVERHEAD`  
**Master AI Agent:** Master AI Agent Orchestrator  
**Sub-Agents phối hợp:** Database Agent, Backend Agent, Frontend Agent, QA Agent  
**Trạng thái kỹ thuật:** **`DONE / READY_FOR_PO`**  

---

## 1. TỔNG QUAN & KẾT QUẢ THỰC THI

- **Mục tiêu hoàn thành:** Xây dựng giải pháp End-to-End toàn diện cho `SYS-REF-02` — Quản lý giá trị danh mục dùng chung (`MasterDataItem`), cho phép quản lý chi tiết các giá trị danh mục bên trong từng nhóm danh mục (`MasterDataCatalog`).
- **Phục vụ các phân hệ:** Chuẩn hóa dữ liệu tham chiếu nền tảng cho Hồ sơ học viên Hàn Quốc (`STU-01`, `US-KR-01..14`), Tuyển sinh du học (`ADM-01`), Tài chính, Đào tạo (Quốc tịch, Trình độ học vấn, Quan hệ nhân thân, Tình trạng hồ sơ, Loại giấy tờ, v.v.).
- **Tiêu chuẩn kiến trúc tuân thủ nghiêm ngặt:**
  - .NET 10 Modular Monolith, SQL Server, EF Core Write-side, Stored Procedures (`ISpExecutor` / Dapper) Read-side.
  - Kiểm soát đồng thời lạc quan (Optimistic Concurrency) với `RowVersion` (Base64 token) trả về HTTP 409 Conflict.
  - Kiểm soát phân quyền Direct GBAC v4.2 fail-closed (`system.reference_data.view`, `system.reference_data.manage`, `system.reference_data.system_admin`).
  - Migration viết tay thuần túy (`database/migrations/20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql`) chạy qua `run-migrations.ps1`, có Distributed Lock `sp_getapplock` và kiểm soát tính toàn vẹn Checksum SHA-256.
  - Giao diện React 18 / TypeScript / Vite / TailwindCSS hai cấp (Catalog List -> Items Drill-down) với đầy đủ 6 trạng thái UI theo Rule 25.
  - Tuyệt đối không tự ý seed dữ liệu danh mục khi chưa có quyết định phê duyệt của Product Owner.

---

## 2. QUYẾT ĐỊNH CỦA PRODUCT OWNER & RANH GIỚI NGHIỆP VỤ

1. **PO-MIG:** Duy trì cơ chế handwritten SQL migrations qua PowerShell runner `run-migrations.ps1`. Không dùng EF Core migrations (`dotnet ef migrations add`, `Database.Migrate()`).
2. **BR01 — Scoped Code Uniqueness:** Mã giá trị (`Code`) duy nhất trong phạm vi từng nhóm danh mục (`CatalogId, Code`). Cùng một mã có thể xuất hiện độc lập ở 2 nhóm danh mục khác nhau (ví dụ `OTHER` ở Quốc tịch và `OTHER` ở Loại trường học).
3. **BR02 & BR03 — Code Immutability & Soft Deactivation:** Mã `Code` là bất biến sau khi tạo. Không hỗ trợ xóa vật lý (Hard Delete); thay vào đó dùng cơ chế kích hoạt / ngừng kích hoạt mềm (`IsActive = 1` hoặc `0`).
4. **BR04 — System Catalog Protection:** Khi nhóm danh mục thuộc loại `IsSystem = 1` (`SYSTEM_CONTROLLED`), chỉ người dùng có quyền quản trị tối cao `system.reference_data.system_admin` mới được tạo, sửa hoặc đổi trạng thái các giá trị con.
5. **BR06 — Hierarchy Loop Prevention:** Ràng buộc tự làm cha bị chặn ở tầng CSDL (`CHECK (ParentItemId IS NULL OR ParentItemId <> Id)`). Vòng lặp quan hệ phân cấp nhiều tầng (A -> B -> C -> A) được chặn ở tầng Application logic.
6. **BR09 — Business Lookup Segregation:** Endpoint tra cứu nghiệp vụ `/api/v1/system/reference-data/lookup/{catalogCode}` chỉ trả về các mục đang hoạt động (`Catalog.IsActive = 1 AND Item.IsActive = 1`), sắp xếp theo `DisplayOrder ASC, Name ASC`.

---

## 3. CHI TIẾT TRIỂN KHAI CƠ SỞ DỮ LIỆU (DATABASE AGENT)

### 3.1. Handwritten Migration: `20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql`
- **File:** `database/migrations/20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql` (UTF-8 with BOM).
- **Thực thi:** Áp dụng thành công vào CSDL `ShdOneErpDb` qua `run-migrations.ps1 -Database ShdOneErpDb`.
- **Idempotency:** Đã kiểm thử chạy lại 2 lần: 0 applied, 17 skipped (0 ms) — Đảm bảo 100% idempotent.

### 3.2. Thay đổi Schema & Ràng buộc
- **Thêm cột mới:**
  - `UpdatedAtUtc DATETIME2(7) NULL`: Ghi nhận thời điểm cập nhật bản ghi.
  - `RowVersion ROWVERSION NOT NULL`: Concurrency token tự động tăng của SQL Server.
- **Ràng buộc toàn vẹn:**
  - `CK_System_MasterDataItems_NoSelfParent`: `CHECK (ParentItemId IS NULL OR ParentItemId <> Id)` — Chặn tự làm cha chính nó.
- **Tối ưu hóa chỉ mục (Indexes):**
  - `UQ_System_MasterDataItems_Code` trên `(CatalogId, Code)`: Duy trì tính duy nhất cục bộ theo nhóm.
  - `IX_System_MasterDataItems_Catalog_IsActive_DisplayOrder` trên `(CatalogId, IsActive, DisplayOrder)`: Tối ưu truy vấn phân trang danh sách.
  - `IX_System_MasterDataItems_ParentItemId` trên `(ParentItemId)` (WHERE `ParentItemId IS NOT NULL`): Tối ưu truy vấn cây phân cấp.

### 3.3. Bộ 3 Stored Procedures CQRS (Read-side)
1. **`sp_System_MasterData_Item_GetPagedList`:**
   - Hỗ trợ tìm kiếm theo từ khóa (`@SearchTerm`), lọc theo trạng thái (`@IsActive`), lọc theo mục cha (`@ParentItemId`).
   - Tham số phân trang `@PageNumber`, `@PageSize`, trả về `@TotalCount OUTPUT`.
   - Whitelist Sort an toàn: `DisplayOrder`, `Code`, `Name`, `CreatedAtUtc` (chống SQL Injection).
   - LEFT JOIN để lấy `ParentItemCode` và `ParentItemName`.
   - Xử lý mượt mà trang vượt giới hạn (out-of-bounds page) và catalog rỗng mà không lỗi.
2. **`sp_System_MasterData_Item_GetById`:**
   - Trả về thông tin chi tiết một mục kèm `CatalogCode`, `CatalogName`, `ParentItemCode`, `ParentItemName`.
3. **`sp_System_MasterData_Item_GetByCatalogCode`:**
   - Dành riêng cho tra cứu nghiệp vụ dropdown (Lookup).
   - Lọc bắt buộc: `c.IsActive = 1 AND i.IsActive = 1`.
   - Sắp xếp cố định: `i.DisplayOrder ASC, i.Name ASC`.

---

## 4. CHI TIẾT TRIỂN KHAI BACKEND API (BACKEND AGENT)

### 4.1. Domain Layer (`ShdOneErp.Domain`)
- **File:** [`MasterDataEntities.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs)
- Cập nhật entity [`MasterDataItem`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs#L87-L140) với thuộc tính `UpdatedAtUtc`, `byte[] RowVersion`.
- Bổ sung các phương thức nghiệp vụ đóng gói: `UpdateDetails()`, `Deactivate()`, `Activate()`, `SetActive()`, `SetRowVersion()`.

### 4.2. Infrastructure Persistence Layer (`ShdOneErp.Infrastructure`)
- **EF Mapping:** [`PlatformConfigurations.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/Configurations/PlatformConfigurations.cs#L182-L216) ánh xạ `IsRowVersion()` cho thuộc tính `RowVersion`.
- **Read Service:** [`MasterDataItemReadService.Sp.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/StoredProcedures/ReadServices/MasterDataItemReadService.Sp.cs) thực thi 3 Stored Procedures qua `ISpExecutor` (Dapper).
- **Platform Lookup Service:** [`MasterDataService.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Services/MasterDataService.cs) cài đặt `IMasterDataService` cung cấp phương thức dùng chung `GetItemsByCatalogAsync(string catalogCode)`.

### 4.3. Application Layer (`ShdOneErp.Application`)
- **DTOs:** [`ItemDtos.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/DTOs/ItemDtos.cs) (`ItemDto`, `ItemFilterQuery`, `CreateItemRequest`, `UpdateItemRequest`, `ChangeItemStatusRequest`, `ItemLookupDto`).
- **Validators:** [`ItemValidators.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Validators/ItemValidators.cs) kiểm tra định dạng Code (chữ in hoa, số, gạch dưới, tối đa 50 ký tự), Name (tối đa 200 ký tự), DisplayOrder >= 0, MetadataJson hợp lệ cú pháp JSON RFC 8259.
- **Write Service:** [`MasterDataItemWriteService.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Services/MasterDataItemWriteService.cs) hiện thực hóa toàn bộ các quy tắc BR01-BR10:
  - Kiểm tra nhóm catalog tồn tại và đang hoạt động khi thêm item (BR01, BR07).
  - Kiểm tra quyền `system.reference_data.system_admin` nếu Catalog là `IsSystem = 1` (BR04).
  - Kiểm tra trùng mã trong Catalog (BR02).
  - Kiểm tra quan hệ phân cấp, ngăn chặn tự làm cha và ngăn chặn chu trình khép kín A -> B -> C -> A (BR06).
  - Xử lý xung đột đồng thời `DbUpdateConcurrencyException` trả về HTTP 409 Conflict (BR08).
  - Tích hợp ghi nhật ký kiểm toán hệ thống qua `IAuditLogService` (BR10).

### 4.4. Presentation Layer (`ShdOneErp.Api`)
- **Controller:** [`MasterDataItemsController.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Api/Controllers/MasterDataItemsController.cs)
  - `GET /api/v1/system/reference-data/catalogs/{catalogId}/items` (`system.reference_data.view`)
  - `GET /api/v1/system/reference-data/catalogs/{catalogId}/items/{id}` (`system.reference_data.view`)
  - `POST /api/v1/system/reference-data/catalogs/{catalogId}/items` (`system.reference_data.manage`)
  - `PUT /api/v1/system/reference-data/catalogs/{catalogId}/items/{id}` (`system.reference_data.manage`)
  - `PUT /api/v1/system/reference-data/catalogs/{catalogId}/items/{id}/activate` (`system.reference_data.manage`)
  - `PUT /api/v1/system/reference-data/catalogs/{catalogId}/items/{id}/deactivate` (`system.reference_data.manage`)
  - `GET /api/v1/system/reference-data/lookup/{catalogCode}` (`system.reference_data.view`)

---

## 5. CHI TIẾT TRIỂN KHAI FRONTEND UI (FRONTEND AGENT)

### 5.1. Types & Services
- **Types:** [`referenceData.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/types/referenceData.ts) bổ sung đầy đủ interface `ReferenceDataItem`, `ItemFilter`, `PagedItemResult`, `CreateItemPayload`, `UpdateItemPayload`, `ChangeItemStatusPayload`, `ItemLookup`.
- **API Service:** [`referenceDataService.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/services/referenceDataService.ts) kết nối các endpoint API của Items.
- **TanStack Query Hooks:** [`useItems.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/hooks/useItems.ts) quản lý query cache, mutation tự động làm mới danh sách `items`, `catalogs` và `lookup`.

### 5.2. UI Components & Trải nghiệm người dùng
- **Form Drawer (`ItemDrawerForm.tsx`):**
  - SideDrawer trượt mượt mà từ bên phải.
  - Khóa ô nhập `Code` khi chỉnh sửa (bảo vệ tính bất biến).
  - Chọn mục cha (`ParentItem`) có lọc bỏ chính nó để chống chọn nhầm cha là chính mình.
  - Ô nhập `MetadataJson` có kiểm tra tính hợp lệ của cú pháp JSON thời gian thực.
  - Hiển thị cảnh báo màu vàng khi nhóm danh mục là `SYSTEM_CONTROLLED`.
- **Giao diện quản lý Items (`CatalogItemsView.tsx`):**
  - Tích hợp Breadcrumb: `Quản lý nhóm danh mục / [Tên nhóm]`.
  - Nút quay lại (Back to Catalogs) thuận tiện.
  - Context Banner hiển thị tóm tắt thông tin nhóm (Mã, Tên, Module, Phân loại Hệ thống/Người dùng, Trạng thái).
  - Thanh công cụ tìm kiếm theo tên/mã, bộ lọc trạng thái (Tất cả / Đang sử dụng / Ngừng sử dụng).
  - Bảng dữ liệu `DataGrid` với các cột: Thứ tự (`DisplayOrder`), Mã giá trị (`Code`), Tên hiển thị (`Name`), Giá trị quy đổi (`Value`), Mục cha (`Parent`), Trạng thái (`Badge`), Thao tác (`Actions`).
  - Đầy đủ 6 trạng thái UI theo Rule 25: Loading Skeleton, EmptyState, Bảng dữ liệu có kết quả, Thông báo lỗi, Hộp thoại xác nhận chuyển trạng thái (`ConfirmDialog`), và Hộp thoại cảnh báo xung đột dữ liệu đồng thời HTTP 409 (`CatalogConflictModal`).
- **Tích hợp hai cấp (`MasterDataCatalogListPage.tsx`):**
  - Cột "Số giá trị" hiển thị huy hiệu (pill) có thể click trực tiếp để chuyển nhanh sang xem danh sách Items của nhóm đó.
  - Thao tác dòng có nút icon `ListOrdered` để mở danh sách giá trị.
  - Chuyển đổi trạng thái giữa Master List và Sub-View mượt mà không cần tải lại toàn trang.

---

## 6. MA TRẬN ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

| Mã AC | Tiêu chí nghiệm thu (Acceptance Criteria) | Hiện thực hóa kỹ thuật | Kết quả kiểm thử | Trạng thái |
|:---:|---|---|:---:|:---:|
| **AC01** | Tạo mới giá trị danh mục hợp lệ trong nhóm danh mục đang hoạt động | `MasterDataItemWriteService.CreateAsync` + SQL INSERT + SP Read | Tested live in SQL Server & In-Memory | **PASS** |
| **AC02** | Chặn mã code trùng trong cùng một nhóm danh mục | Unique Index `UQ_System_MasterDataItems_Code` trên `(CatalogId, Code)` + Validator | Tested live in SQL Server & Unit test | **PASS** |
| **AC03** | Cho phép trùng mã code nếu thuộc 2 nhóm danh mục khác nhau | Unique constraint scoped theo `CatalogId` | Tested live in SQL Server | **PASS** |
| **AC04** | Mã `Code` là bất biến khi cập nhật | DTO `UpdateItemRequest` không có trường `Code`, Drawer Form disable ô Code | Unit test & Code inspection | **PASS** |
| **AC05** | Nhóm danh mục `SYSTEM_CONTROLLED` yêu cầu quyền `system.reference_data.system_admin` | Kiểm tra `IsSystem` và claim `system.reference_data.system_admin` trong WriteService | Unit test `CreateAsync_SystemControlledCatalog` | **PASS** |
| **AC06** | Ngăn chặn tạo giá trị con trong nhóm danh mục đang bị vô hiệu hóa (`IsActive = 0`) | Kiểm tra `catalog.IsActive` trước khi tạo | Unit test `CreateAsync_InactiveCatalog_ReturnsFailure` | **PASS** |
| **AC07** | Ngăn chặn vòng lặp phân cấp quan hệ cha - con | Constraint `CK_System_MasterDataItems_NoSelfParent` + Duyệt đệ quy vòng lặp trong WriteService | Tested live in SQL Server & Unit test | **PASS** |
| **AC08** | Cập nhật thông tin và xử lý xung đột đồng thời Concurrency Token (HTTP 409) | `RowVersion` ánh xạ EF Core `IsRowVersion()`, bắt `DbUpdateConcurrencyException` trả về 409 | Unit test `UpdateAsync_MismatchedRowVersion` | **PASS** |
| **AC09** | Endpoint Lookup chỉ trả về các mục đang hoạt động của nhóm đang hoạt động | Stored Procedure `sp_System_MasterData_Item_GetByCatalogCode` với điều kiện `c.IsActive=1 AND i.IsActive=1` | Tested live in SQL Server | **PASS** |
| **AC10** | Ngừng kích hoạt mềm (Deactivate) và Kích hoạt lại (Activate) | `DeactivateAsync` / `ActivateAsync`, kiểm tra `RowVersion` | Unit tests & Live DB | **PASS** |
| **AC11** | Kiểm tra cú pháp `MetadataJson` hợp lệ khi tạo / sửa | `ItemValidators.cs` sử dụng `JsonDocument.Parse` | Unit tests validation | **PASS** |
| **AC12** | Phân trang danh sách an toàn khi trang out-of-bounds hoặc catalog rỗng | SP `sp_System_MasterData_Item_GetPagedList` xử lý OFFSET/FETCH và trả `@TotalCount` | Tested live in SQL Server | **PASS** |

---

## 7. BẰNG CHỨNG KIỂM THỬ (TEST EVIDENCE)

### 7.1. Kiểm thử trực tiếp trên CSDL SQL Server DEV (`ShdOneErpDb`)
```text
=== LIVE DATABASE END-TO-END VERIFICATION: SYS-REF-02 ===

1. System_MasterDataItems Columns:
   - Id (uniqueidentifier) Nullable=NO
   - CatalogId (uniqueidentifier) Nullable=NO
   - Code (nvarchar) Nullable=NO
   - Name (nvarchar) Nullable=NO
   - Value (nvarchar) Nullable=YES
   - DisplayOrder (int) Nullable=NO
   - IsActive (bit) Nullable=NO
   - ParentItemId (uniqueidentifier) Nullable=YES
   - MetadataJson (nvarchar) Nullable=YES
   - CreatedAtUtc (datetime2) Nullable=NO
   - UpdatedAtUtc (datetime2) Nullable=YES
   - RowVersion (timestamp) Nullable=NO

2. Unique Indexes on System_MasterDataItems:
   - PK_System_MasterDataItems (Col #1: Id)
   - UQ_System_MasterDataItems_Code (Col #1: CatalogId)
   - UQ_System_MasterDataItems_Code (Col #2: Code)

3. Creating 2 test catalogs: TEST_CAT_A and TEST_CAT_B...
   [OK] Test catalogs created.

4. Testing AC01 & AC03: Creating code 'VAL_01' in both Catalog A and Catalog B...
   [PASS] AC01 & AC03: Scoped code uniqueness passed. Code 'VAL_01' exists independently in both catalogs.

5. Testing AC02: Trying to create duplicate 'VAL_01' in Catalog A...
   [PASS] AC02: Duplicate code rejected by unique index constraint.

6. Testing AC07: Trying to insert self-parent (ParentItemId = Id)...
   [PASS] AC07: Self-parent rejected by CHECK constraint CK_System_MasterDataItems_NoSelfParent.
   [OK] Valid child item VAL_02 created under VAL_01.

7. Testing SP sp_System_MasterData_Item_GetPagedList on Catalog A...
   - Item: [VAL_01] Value 1 Catalog A | ParentCode= | Order=1 | RowVersion=AAAAAAAAB+Q=
   - Item: [VAL_02] Child of VAL_01 | ParentCode=VAL_01 | Order=2 | RowVersion=AAAAAAAAB+g=
   TotalCount Output: 2

8. Testing AC12: Out-of-bounds page (Page 999)...
   Rows returned for Page 999: 0
   TotalCount preserved: 2

9. Testing AC09: Lookup only returns active items...
   - Active Item in Lookup: [VAL_02] Child of VAL_01 (Catalog: TEST_CAT_A)
   [PASS] AC09: Inactive item VAL_01 excluded from lookup. Active items count: 1

10. Cleaning up test data...
   [OK] Test records completely cleaned up.

=== LIVE DATABASE VERIFICATION COMPLETED WITH 100% SUCCESS ===
```

### 7.2. Kiểm thử tự động Backend (`dotnet test`)
```text
Test run for F:\MyProjectSHD\SHDONEERP\backend\ShdOneErp.Tests\bin\Debug\net10.0\ShdOneErp.Tests.dll (.NETCoreApp,Version=v10.0)
A total of 1 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:   217, Skipped:     0, Total:   217, Duration: 617 ms - ShdOneErp.Tests.dll (net10.0)
```
- **Tổng số bài test:** 217 bài kiểm thử đơn vị & tích hợp.
- **Tỷ lệ đạt:** 100% (217 passed, 0 failed, 0 skipped).
- **Các test suite mới của SYS-REF-02:**
  - `MasterDataItemDomainTests.cs` (8 tests): Kiểm tra khởi tạo, bất biến, cập nhật, kích hoạt/ngừng kích hoạt, `RowVersion`.
  - `ItemValidationTests.cs` (7 tests): Kiểm tra validation mã Code, DisplayOrder, cú pháp JSON.
  - `ItemWriteServiceTests.cs` (12 tests): Kiểm tra đầy đủ BR01 - BR10 bao gồm xung đột đồng thời HTTP 409, phân quyền hệ thống, và phát hiện vòng lặp phân cấp.

### 7.3. Biên dịch Frontend (`npm run build`)
```text
> shd-oneerp-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1642 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.56 kB │ gzip:   0.40 kB
dist/assets/index-fwyaktRP.css  100.78 kB │ gzip:  15.27 kB
dist/assets/index-BHtdL_sH.js   680.82 kB │ gzip: 167.79 kB
✓ built in 2.86s
```
- **Kết quả:** 0 lỗi TypeScript, 0 lỗi Vite bundling.

---

## 8. DANH SÁCH TẬP TIN THỰC HIỆN (CHANGELOG)

### CSDL (Database)
- [`database/migrations/20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261102_0017_EnhanceMasterDataItemsSchemaAndSp.sql) — Migration schema, indexes, check constraint, và 3 CQRS Stored Procedures.

### Backend (.NET 10)
- [`backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs) — Cập nhật thực thể `MasterDataItem`.
- [`backend/ShdOneErp.Infrastructure/Persistence/Configurations/PlatformConfigurations.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/Configurations/PlatformConfigurations.cs) — Ánh xạ EF Core `IsRowVersion()`.
- [`backend/ShdOneErp.Application/Modules/SystemReferenceData/DTOs/ItemDtos.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/DTOs/ItemDtos.cs) — DTOs cho các tác vụ Item.
- [`backend/ShdOneErp.Application/Modules/SystemReferenceData/Validators/ItemValidators.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Validators/ItemValidators.cs) — FluentValidators cho Item requests.
- [`backend/ShdOneErp.Application/Modules/SystemReferenceData/Interfaces/IMasterDataItemServices.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Interfaces/IMasterDataItemServices.cs) — Interfaces Read/Write services.
- [`backend/ShdOneErp.Infrastructure/Persistence/StoredProcedures/ReadServices/MasterDataItemReadService.Sp.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/StoredProcedures/ReadServices/MasterDataItemReadService.Sp.cs) — Read service gọi Stored Procedures qua `ISpExecutor`.
- [`backend/ShdOneErp.Application/Modules/SystemReferenceData/Services/MasterDataItemWriteService.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/SystemReferenceData/Services/MasterDataItemWriteService.cs) — Write service xử lý nghiệp vụ ghi BR01-BR10.
- [`backend/ShdOneErp.Infrastructure/Services/MasterDataService.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Services/MasterDataService.cs) — Dịch vụ nền tảng dùng chung `IMasterDataService`.
- [`backend/ShdOneErp.Api/Controllers/MasterDataItemsController.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Api/Controllers/MasterDataItemsController.cs) — REST API Controller cho Items và Lookup.
- [`backend/ShdOneErp.Infrastructure/DependencyInjection.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/DependencyInjection.cs) — Đăng ký IoC Container.
- [`backend/ShdOneErp.Tests/Domain/MasterDataItemDomainTests.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Domain/MasterDataItemDomainTests.cs) — Unit tests cho Domain Entity.
- [`backend/ShdOneErp.Tests/Application/ItemValidationTests.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Application/ItemValidationTests.cs) — Unit tests cho Validators.
- [`backend/ShdOneErp.Tests/Application/ItemWriteServiceTests.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Application/ItemWriteServiceTests.cs) — Unit tests cho Write Service.

### Frontend (React 18 / TypeScript / Vite)
- [`frontend/src/features/system-reference-data/types/referenceData.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/types/referenceData.ts) — TypeScript type definitions cho Items.
- [`frontend/src/features/system-reference-data/services/referenceDataService.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/services/referenceDataService.ts) — API Client methods.
- [`frontend/src/features/system-reference-data/hooks/useItems.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/hooks/useItems.ts) — TanStack Query hooks.
- [`frontend/src/features/system-reference-data/components/ItemDrawerForm.tsx`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/components/ItemDrawerForm.tsx) — Form SideDrawer tạo & sửa giá trị danh mục.
- [`frontend/src/features/system-reference-data/components/CatalogItemsView.tsx`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/components/CatalogItemsView.tsx) — Màn hình quản lý danh sách giá trị danh mục với 6 UI states.
- [`frontend/src/features/system-reference-data/pages/MasterDataCatalogListPage.tsx`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/pages/MasterDataCatalogListPage.tsx) — Tích hợp điều hướng hai cấp và pill đếm số giá trị.
- [`frontend/src/features/system-reference-data/index.ts`](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/system-reference-data/index.ts) — Cập nhật barrel exports.

---

## 9. VẤN ĐỀ TỒN ĐỌNG & ĐÁNH GIÁ RỦI RO (OPEN ISSUES & RISKS)

- **Vấn đề tồn đọng mức độ P0 / P1:** **0** (Không có vấn đề chặn tiến độ).
- **Rủi ro Dữ liệu rác (Data Pollution):** Được kiểm soát tuyệt đối bằng nguyên tắc không tự ý seed dữ liệu master data nghiệp vụ khi PO chưa phê duyệt danh sách chính thức.
- **Tuân thủ quy tắc Git:** Không tạo branch mới, không commit, không push, không reset — Toàn bộ source code sẵn sàng trên local workspace theo đúng chỉ thị của PO.

---

## 10. KẾT LUẬN & KIẾN NGHỊ BƯỚC TIẾP THEO

- **Kết luận:** Story **`SYS-REF-02` (Quản lý giá trị danh mục dùng chung)** đã hoàn thành End-to-End với chất lượng tối đa theo chế độ `FAST EXECUTION — MINIMAL OVERHEAD`.
- **Trạng thái:** **`DONE / READY_FOR_PO`**.
- **Kiến nghị bước tiếp theo theo Kế hoạch Sprint:**
  - Chuyển sang triển khai **`Student Directory & Student Dossier (Hồ sơ học viên du học Hàn Quốc - US-KR-01 đến US-KR-14)`**.
  - Các module du học có thể trực tiếp sử dụng API Lookup `/api/v1/system/reference-data/lookup/{catalogCode}` và service `IMasterDataService` để lấy dữ liệu tham chiếu chuẩn hóa.

