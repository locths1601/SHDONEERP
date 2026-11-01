# SHD OneERP — SYS-REF-01 CONTRACT PROPOSAL & TECHNICAL DESIGN
## User Story: Quản lý nhóm danh mục (System Reference Data Catalogs)

**Mã Story:** `SYS-REF-01`  
**Thuộc Epic:** `SYS-REF` — Cấu hình hệ thống & Dữ liệu nguồn  
**Mức độ ưu tiên:** P0  
**Tác giả:** Master AI Agent Orchestrator  
**Trạng thái đề xuất:** `PROPOSED` (Chờ Product Owner phê chuẩn tại GATE-00)  
**Phụ thuộc nghiệp vụ:** GATE-00 hoàn tất, PO-001, PO-002  

---

## 1. MÔ TẢ NGHIỆP VỤ & ACCEPTANCE CRITERIA (AC)

### 1.1. User Story
> **Là** Quản trị viên cấu hình hệ thống (System Config Admin),  
> **Tôi muốn** tạo và quản lý các nhóm danh mục dùng chung (Catalogs) qua giao diện web trực quan,  
> **Để** các phân hệ nghiệp vụ (Hồ sơ học viên Hàn Quốc, Tuyển sinh, Địa lý, Phân loại hồ sơ) có thể tham chiếu dữ liệu chuẩn hóa mà không phải sửa code, viết SQL seed hoặc triển khai lại hệ thống.

### 1.2. Quy tắc nghiệp vụ (Business Rules)
1. **Thuộc tính nhóm:** Mỗi nhóm danh mục bao gồm `Code`, `Name`, `Description`, `OwnerModule`, `ScopePolicy`, `ManagementMode`, `Status`.
2. **Tính duy nhất (Unique Code):** `Code` phải duy nhất trong toàn hệ thống (hoặc trong cùng Scope). Không cho phép trùng mã.
3. **Chế độ quản trị (Management Mode):**
   - `SYSTEM_CONTROLLED`: Nhóm danh mục gắn liền với logic hệ thống cốt lõi. Người dùng không được phép đổi `Code` hoặc xóa nhóm. Chỉ được phép sửa `Name`, `Description`, thêm/bớt giá trị (Items).
   - `ADMIN_MANAGED`: Nhóm danh mục linh hoạt do quản trị viên tự định nghĩa cho nghiệp vụ.
4. **Bảo toàn tham chiếu:** Tuyệt đối không cho phép xóa (Hard Delete) hoặc đổi `Code` của nhóm danh mục nếu đã có giá trị (`Items`) hoặc đã được tham chiếu bởi các bản ghi nghiệp vụ (Student Dossier, Admission, Party...). Chỉ hỗ trợ chuyển trạng thái `INACTIVE` (Ngừng sử dụng).
5. **Bảo mật Fail-Closed:** Mọi truy cập API bắt buộc phải kiểm tra quyền Direct GBAC v4.2. Từ chối mặc định nếu không có quyền.

### 1.3. Tiêu chí nghiệm thu chi tiết (Acceptance Criteria)

| Mã AC | Điều kiện (Given) | Hành động (When) | Kết quả kỳ vọng (Then) |
|---|---|---|---|
| **AC01** | Admin có quyền `system.reference_data.manage` | Gửi yêu cầu tạo nhóm danh mục với dữ liệu hợp lệ | Nhóm được lưu vào CSDL, trả về mã 201 Created, hiển thị trên UI, ghi Audit log đầy đủ |
| **AC02** | Nhóm danh mục đã tồn tại với mã `DOC_TYPE` | Admin gửi yêu cầu tạo nhóm mới trùng mã `DOC_TYPE` | Backend chặn và trả lời lỗi validation 400 Bad Request `{ code: "DUPLICATE_CODE", message: "Mã nhóm danh mục đã tồn tại." }`, không tạo bản ghi rác |
| **AC03** | Nhóm danh mục đang chứa giá trị hoặc đã có dữ liệu tham chiếu | Admin yêu cầu xóa nhóm hoặc đổi mã `Code` | Backend từ chối với mã 400/409, thông báo lý do vi phạm ràng buộc toàn vẹn |
| **AC04** | Người dùng chưa đăng nhập hoặc không có quyền `system.reference_data.manage` | Gọi trực tiếp API POST/PUT/DELETE | Hệ thống từ chối với HTTP 401 Unauthorized hoặc 403 Forbidden (Direct GBAC fail-closed) |
| **AC05** | Nhóm danh mục mới được tạo và kích hoạt trạng thái `ACTIVE` | Người dùng mở màn hình quản trị danh mục hoặc dropdown | Nhóm danh mục hiển thị ngay lập tức qua API GET/SP mà không cần restart server hay deploy |

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU & MIGRATION CONTRACT

### 2.1. Tái sử dụng & Nâng cấp Bảng CSDL Hiện hữu

Qua kiểm toán GATE-00, bảng `System_MasterDataCatalogs` đã tồn tại trong SQL Server (được tạo bởi migration `0010_EnterpriseFoundationPlatform.sql`) nhưng đang thiếu các trường phục vụ concurrency và quản trị nâng cao. Chúng ta sẽ nâng cấp bảng này bằng một migration SQL viết tay bổ sung:

**Tên file migration dự kiến:**  
`database/migrations/20261030_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql`

### 2.2. Chi tiết Cột dữ liệu bảng `System_MasterDataCatalogs`

| Tên cột | Kiểu dữ liệu | Nullable | Ràng buộc / Mặc định | Ý nghĩa nghiệp vụ |
|---|---|:---:|---|---|
| `CatalogId` | `UNIQUEIDENTIFIER` | NO | PK, `DEFAULT NEWID()` | Khóa chính duy nhất của nhóm danh mục |
| `CatalogCode` | `NVARCHAR(50)` | NO | UNIQUE Index | Mã định danh chuẩn (viết hoa, gạch dưới, vd: `KOREA_VISA_TYPE`) |
| `CatalogName` | `NVARCHAR(200)` | NO | Index | Tên hiển thị tiếng Việt của nhóm danh mục |
| `Description` | `NVARCHAR(500)` | YES | NULL | Mô tả mục đích và phạm vi sử dụng của nhóm |
| `OwnerModule` | `NVARCHAR(50)` | NO | `DEFAULT 'SYSTEM'` | Phân hệ sở hữu (`ADMISSION`, `KOREA_DOSSIER`, `GEOGRAPHY`, `FINANCE`) |
| `ScopePolicy` | `NVARCHAR(30)` | NO | `DEFAULT 'GLOBAL'` | Phạm vi áp dụng (`GLOBAL`, `LEGAL_ENTITY`, `MARKET`) |
| `ManagementMode` | `NVARCHAR(30)` | NO | `DEFAULT 'ADMIN_MANAGED'` | Chế độ quản trị (`SYSTEM_CONTROLLED`, `ADMIN_MANAGED`) |
| `Status` | `NVARCHAR(30)` | NO | `DEFAULT 'ACTIVE'` | Trạng thái vòng đời (`ACTIVE`, `INACTIVE`) |
| `IsSystem` | `BIT` | NO | `DEFAULT 0` | Cờ tương thích ngược hệ thống |
| `IsActive` | `BIT` | NO | `DEFAULT 1` | Cờ tương thích ngược trạng thái |
| `RowVersion` | `ROWVERSION` / `TIMESTAMP` | NO | System auto | Concurrency token chống ghi đè đồng thời (Optimistic Concurrency) |
| `CreatedAtUtc` | `DATETIME2(7)` | NO | `DEFAULT SYSUTCDATETIME()` | Thời điểm tạo bản ghi |
| `CreatedBy` | `NVARCHAR(100)` | YES | NULL | Định danh người tạo |
| `UpdatedAtUtc` | `DATETIME2(7)` | YES | NULL | Thời điểm cập nhật gần nhất |
| `UpdatedBy` | `NVARCHAR(100)` | YES | NULL | Định danh người cập nhật |

---

## 3. THIẾT KẾ STORED PROCEDURES (READ-SIDE PERSISTENCE CQRS)

Tuân thủ nghiêm ngặt rule [`15-backend-stored-procedure.mdc`](file:///.cursor/rules/15-backend-stored-procedure.mdc): Không dùng EF Core LINQ cho API GET nghiệp vụ.

### 3.1. Stored Procedure: Phân trang & Tìm kiếm Nhóm danh mục
**Tên SP:** `[dbo].[sp_System_ReferenceData_Catalog_GetPagedList]`

**Tham số đầu vào:**
- `@SearchTerm NVARCHAR(100) = NULL`: Tìm kiếm gần đúng theo `CatalogCode` hoặc `CatalogName`.
- `@OwnerModule NVARCHAR(50) = NULL`: Lọc theo phân hệ sở hữu.
- `@Status NVARCHAR(30) = NULL`: Lọc theo trạng thái (`ACTIVE`, `INACTIVE`).
- `@ManagementMode NVARCHAR(30) = NULL`: Lọc theo chế độ quản trị.
- `@PageNumber INT = 1`: Số trang (mặc định 1).
- `@PageSize INT = 20`: Kích thước trang (1 đến 100, mặc định 20).
- `@SortBy NVARCHAR(50) = 'CatalogCode'`: Cột sắp xếp (Whitelist: `CatalogCode`, `CatalogName`, `CreatedAtUtc`, `OwnerModule`).
- `@SortOrder NVARCHAR(4) = 'ASC'`: Thứ tự sắp xếp (`ASC` hoặc `DESC`).

**Cấu trúc kết quả trả về:**
```sql
SELECT 
    c.CatalogId,
    c.CatalogCode,
    c.CatalogName,
    c.Description,
    c.OwnerModule,
    c.ScopePolicy,
    c.ManagementMode,
    c.Status,
    c.IsSystem,
    c.IsActive,
    c.RowVersion,
    c.CreatedAtUtc,
    c.CreatedBy,
    c.UpdatedAtUtc,
    c.UpdatedBy,
    (SELECT COUNT(1) FROM dbo.System_MasterDataItems i WHERE i.CatalogId = c.CatalogId) AS ItemCount,
    COUNT(1) OVER() AS TotalCount
FROM dbo.System_MasterDataCatalogs c
WHERE (@SearchTerm IS NULL OR c.CatalogCode LIKE '%' + @SearchTerm + '%' OR c.CatalogName LIKE '%' + @SearchTerm + '%')
  AND (@OwnerModule IS NULL OR c.OwnerModule = @OwnerModule)
  AND (@Status IS NULL OR c.Status = @Status)
ORDER BY ... OFFSET ... ROWS FETCH NEXT ... ROWS ONLY;
```

### 3.2. Stored Procedure: Chi tiết Nhóm danh mục theo ID
**Tên SP:** `[dbo].[sp_System_ReferenceData_Catalog_GetById]`

**Tham số đầu vào:**
- `@CatalogId UNIQUEIDENTIFIER`: Khóa chính của nhóm danh mục.

---

## 4. THIẾT KẾ BACKEND (CLEAN ARCHITECTURE & WRITE-SIDE EF CORE)

### 4.1. Domain Layer (`ShdOneErp.Domain`)
- Entity: `ReferenceDataCatalog` (kế thừa `AggregateRoot<Guid>`).
- Phương thức nghiệp vụ nội tại:
  - `Create(code, name, description, ownerModule, scopePolicy, managementMode, createdBy)`
  - `UpdateDetails(name, description, updatedBy)`
  - `Deactivate(updatedBy)` — Kiểm tra `ManagementMode == SYSTEM_CONTROLLED` có được phép ngừng dùng không.
  - `Activate(updatedBy)`

### 4.2. Application Layer (`ShdOneErp.Application`)
- **Use Cases & DTOs:**
  - `CreateCatalogCommand` & `CreateCatalogCommandValidator` (FluentValidation: Code format `^[A-Z0-9_]{3,50}$`, Name not empty <= 200 chars).
  - `UpdateCatalogCommand` & `UpdateCatalogCommandValidator` (Kiểm tra `RowVersion` truyền lên từ client).
  - `DeactivateCatalogCommand`.
  - `GetCatalogsPagedQuery` & Handler (uỷ thác qua `ISpExecutor` gọi SP).
  - `GetCatalogByIdQuery` & Handler.
- **Optimistic Concurrency:**
  - Khi `RowVersion` trong request không khớp với database, EF Core tự động ném `DbUpdateConcurrencyException`. Handler bắt ngoại lệ và trả về HTTP 409 Conflict với mã lỗi chuẩn `CONCURRENCY_CONFLICT`.

### 4.3. API Layer & Controller Contract (`ShdOneErp.Api`)
**Controller:** `ReferenceDataCatalogsController`  
**Route cơ sở:** `/api/v1/system/reference-data/catalogs`

| HTTP Method | URL Endpoint | Quyền Direct GBAC | Mô tả chức năng | Mã phản hồi |
|---|---|---|---|:---:|
| `GET` | `/api/v1/system/reference-data/catalogs` | `system.reference_data.view` | Lấy danh sách nhóm danh mục có phân trang, tìm kiếm, lọc | 200 OK |
| `GET` | `/api/v1/system/reference-data/catalogs/{id}` | `system.reference_data.view` | Xem chi tiết một nhóm danh mục theo ID | 200 OK, 404 |
| `POST` | `/api/v1/system/reference-data/catalogs` | `system.reference_data.manage` | Tạo mới một nhóm danh mục | 201 Created, 400 |
| `PUT` | `/api/v1/system/reference-data/catalogs/{id}` | `system.reference_data.manage` | Cập nhật thông tin nhóm danh mục | 200 OK, 400, 404, 409 |
| `PUT` | `/api/v1/system/reference-data/catalogs/{id}/deactivate` | `system.reference_data.manage` | Ngừng sử dụng nhóm danh mục | 200 OK, 400, 409 |
| `PUT` | `/api/v1/system/reference-data/catalogs/{id}/activate` | `system.reference_data.manage` | Kích hoạt lại nhóm danh mục | 200 OK, 400, 409 |

**Định dạng Request Body mẫu (POST):**
```json
{
  "catalogCode": "KOREA_VISA_TYPE",
  "catalogName": "Loại Visa Du học Hàn Quốc",
  "description": "Danh mục các mã visa du học Hàn Quốc (D-2-1, D-2-2, D-4-1...)",
  "ownerModule": "KOREA_DOSSIER",
  "scopePolicy": "GLOBAL",
  "managementMode": "ADMIN_MANAGED"
}
```

**Định dạng Response Payload mẫu (GET Paged):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "catalogId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "catalogCode": "KOREA_VISA_TYPE",
        "catalogName": "Loại Visa Du học Hàn Quốc",
        "description": "Danh mục các mã visa du học Hàn Quốc",
        "ownerModule": "KOREA_DOSSIER",
        "scopePolicy": "GLOBAL",
        "managementMode": "ADMIN_MANAGED",
        "status": "ACTIVE",
        "itemCount": 0,
        "rowVersion": "AAAAAAAAB9E=",
        "createdAtUtc": "2026-10-30T08:00:00Z"
      }
    ],
    "pageNumber": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  },
  "traceId": "00-84a1e9c20..."
}
```

---

## 5. THIẾT KẾ FRONTEND (REACT 18 + TYPESCRIPT + ENTERPRISE UX)

### 5.1. Cấu trúc thư mục Feature
```
frontend/src/features/system-reference-data/
├── components/
│   ├── CatalogDataGrid.tsx           # Bảng hiển thị nhóm danh mục sử dụng DataGrid common
│   ├── CatalogDrawerForm.tsx         # Drawer tạo mới/chỉnh sửa sử dụng SideDrawer common
│   ├── CatalogStatusBadge.tsx        # Huy hiệu trạng thái ACTIVE/INACTIVE/SYSTEM_CONTROLLED
│   └── CatalogFilterBar.tsx          # Thanh công cụ tìm kiếm và lọc sử dụng ListToolbar common
├── hooks/
│   ├── useCatalogs.ts                # TanStack Query hook lấy danh sách phân trang
│   ├── useCatalogMutations.ts        # TanStack Query mutations (create, update, deactivate)
├── services/
│   └── referenceDataService.ts       # API client gọi endpoint qua axios instance chuẩn
├── types.ts                          # Định nghĩa TypeScript interface đồng bộ với C# DTOs
└── pages/
    └── ReferenceDataCatalogPage.tsx  # Trang chính tích hợp PageContainer, breadcrumbs và Can guard
```

### 5.2. Tuân thủ 6 Trạng thái UI (Rule 25)
1. **Loading State:** Sử dụng component `Skeleton` hiển thị khung bảng dữ liệu 5 dòng trong lúc chờ API phản hồi. Không làm giật khung hình (no layout shift).
2. **Empty State:** Khi chưa có danh mục hoặc tìm kiếm không thấy, hiển thị `EmptyState` với icon FolderOpen, tiêu đề "Chưa có nhóm danh mục nào", kèm nút CTA "Tạo nhóm danh mục".
3. **Error State:** Hiển thị khung cảnh báo màu đỏ với thông điệp lỗi từ API kèm `traceId` và nút "Thử lại".
4. **Success State:** Hiển thị `DataGrid` với các cột: Mã nhóm, Tên nhóm, Phân hệ, Chế độ quản trị, Số lượng giá trị, Trạng thái, Thao tác.
5. **Forbidden State (403):** Bọc các nút thao tác Tạo/Sửa trong component `<Can permission="system.reference_data.manage">`. Nếu user không có quyền xem, hiển thị màn hình 403 thân thiện.
6. **Conflict State (409):** Khi gặp lỗi Optimistic Concurrency (`CONCURRENCY_CONFLICT`), hiển thị hộp thoại cảnh báo: "Dữ liệu nhóm danh mục đã được thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất."

---

## 6. KẾ HOẠCH KIỂM THỬ TOÀN DIỆN (TEST PLAN)

| Hạng mục kiểm thử | Công cụ / Phương pháp | Kịch bản kiểm thử trọng yếu | Kết quả yêu cầu |
|---|---|---|:---:|
| **Unit Test Backend** | xUnit, FluentValidation, Moq | Kiểm tra AC01, AC02 (duplicate code validation), AC03 (ngăn đổi code/xóa khi đã tham chiếu) | 100% Pass |
| **SQL Migration Test** | PowerShell + SQL Server thật | Chạy script migration `0016` trên `localhost` database `ShdOneErpDb` | MigrationId ghi nhận vào `__DbMigrationHistory` |
| **Stored Procedure Test** | T-SQL Script qua ADO.NET | Gọi `sp_System_ReferenceData_Catalog_GetPagedList` với các tham số tìm kiếm, lọc, phân trang | Trả về đúng cột, `TotalCount` chính xác |
| **Direct GBAC Integration** | WebApplicationFactory API Test | Thử nghiệm người dùng có quyền và không có quyền `system.reference_data.view/manage` | 403 Forbidden fail-closed khi thiếu quyền |
| **Optimistic Concurrency** | API Integration Test | Hai request PUT gửi cùng `RowVersion` cũ | Request 1 trả 200 OK, Request 2 trả 409 Conflict |
| **Audit Log Verification** | Kiểm tra bảng `Audit_SystemLogs` | Thực hiện tạo và sửa nhóm danh mục | Có bản ghi audit ghi nhận actor, action, timestamp |
| **Frontend TypeScript Build** | `tsc --noEmit && vite build` | Kiểm tra tính tương thích type giữa Frontend và Backend DTOs | 0 errors |

---

## 7. CÁC QUYẾT ĐỊNH CẦN PO PHÊ DUYỆT ĐỂ BẮT ĐẦU TRIỂN KHAI

Để Master Agent có thể ủy quyền cho Sub-Agents triển khai mã nguồn câu chuyện `SYS-REF-01` sau GATE-00, kính trình Product Owner phê chuẩn 2 nội dung:

1. **PO-001 (Quyền tạo nhóm danh mục):**
   - Xác nhận: Cho phép người dùng có quyền `system.reference_data.manage` tạo nhóm danh mục. Nhóm có cờ `SYSTEM_CONTROLLED` chỉ được sửa thông tin mô tả, không cho đổi mã `CatalogCode`.
2. **PO-002 (Phạm vi Scope của danh mục):**
   - Xác nhận: Áp dụng `ScopePolicy = GLOBAL` cho giai đoạn đầu, các công ty thành viên đều dùng chung bộ mã danh mục.

---

## 8. ĐÁNH GIÁ SẴN SÀNG (READINESS DECLARATION)

- **Trạng thái hợp đồng:** `READY_FOR_PO_APPROVAL`.
- **Ranh giới kiến trúc:** Tái sử dụng bảng `System_MasterDataCatalogs` hiện hữu, không sinh bảng thừa, tuân thủ Clean Architecture và CQRS Persistence Split.
- **Tiếp theo:** Dừng tại cổng GATE-00 và chờ chỉ thị chính thức của Product Owner trước khi mở Sprint triển khai.

