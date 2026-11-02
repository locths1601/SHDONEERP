# SHD OneERP — SYS-REF-01 API & DATABASE CONTRACT

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Ngày thực hiện:** 02/11/2026  

---

## 1. HỢP ĐỒNG CƠ SỞ DỮ LIỆU (DATABASE SCHEMA CONTRACT)

### 1.1. Bảng: `dbo.System_MasterDataCatalogs`
| Tên cột | Kiểu dữ liệu | Nullable | Ràng buộc / Mặc định | Ý nghĩa nghiệp vụ |
|---|---|:---:|---|---|
| `Id` | `UNIQUEIDENTIFIER` | NO | PK, `DEFAULT NEWSEQUENTIALID()` | Khóa chính định danh duy nhất của nhóm |
| `Code` | `NVARCHAR(50)` | NO | Unique Index `UQ_System_MasterDataCatalogs_Code` | Mã nhóm danh mục (Khóa bất biến, UPPERCASE) |
| `Name` | `NVARCHAR(150)` | NO | None | Tên hiển thị của nhóm danh mục |
| `Description` | `NVARCHAR(500)` | YES | None | Mô tả mục đích sử dụng nghiệp vụ |
| `OwnerModule` | `NVARCHAR(50)` | NO | `DEFAULT 'SYSTEM'` | Phân hệ sở hữu (`SYSTEM`, `ADMISSION`, `PARTY`, `CRM`, `ORG`) |
| `ScopePolicy` | `NVARCHAR(30)` | NO | `DEFAULT 'GLOBAL'` | Chính sách phạm vi (`GLOBAL` cho toàn tập đoàn) |
| `IsSystem` | `BIT` | NO | `DEFAULT 0` | Chế độ quản trị: 1 = `SYSTEM_CONTROLLED`, 0 = `ADMIN_MANAGED` |
| `IsActive` | `BIT` | NO | `DEFAULT 1` | Trạng thái vòng đời: 1 = `ACTIVE`, 0 = `INACTIVE` |
| `RowVersion` | `ROWVERSION` | NO | Timestamp token | Khóa kiểm soát xung đột đồng thời (Optimistic Concurrency) |
| `CreatedAtUtc` | `DATETIME2(7)` | NO | `DEFAULT SYSUTCDATETIME()` | Thời điểm tạo bản ghi UTC |
| `UpdatedAtUtc` | `DATETIME2(7)` | YES | None | Thời điểm cập nhật bản ghi UTC |

---

## 2. HỢP ĐỒNG STORED PROCEDURES (CQRS READ-SIDE)

### 2.1. `[dbo].[sp_System_MasterData_Catalog_GetPagedList]`
- **Mục đích:** Truy vấn danh sách nhóm danh mục có lọc, phân trang và sắp xếp an toàn.
- **Tham số đầu vào:**
  - `@SearchTerm NVARCHAR(100) = NULL`: Tìm kiếm theo Code hoặc Name
  - `@OwnerModule NVARCHAR(50) = NULL`: Lọc theo phân hệ sở hữu
  - `@IsActive BIT = NULL`: Lọc theo trạng thái hoạt động
  - `@IsSystem BIT = NULL`: Lọc theo chế độ quản trị
  - `@PageNumber INT = 1`: Số trang hiện tại (tối thiểu 1)
  - `@PageSize INT = 20`: Kích thước trang (tối đa 100)
  - `@SortBy NVARCHAR(50) = 'Code'`: Cột sắp xếp (Whitelist: `Code`, `Name`, `OwnerModule`, `CreatedAtUtc`)
  - `@SortOrder NVARCHAR(4) = 'ASC'`: Hướng sắp xếp (`ASC` / `DESC`)
  - `@TotalCount INT OUTPUT`: Tổng số bản ghi thỏa điều kiện lọc
- **Cấu trúc cột trả về (Result Set):**
  - `Id`, `Code`, `Name`, `Description`, `OwnerModule`, `ScopePolicy`, `IsSystem`, `IsActive`, `RowVersion`, `CreatedAtUtc`, `UpdatedAtUtc`, `ItemCount` (tính từ `System_MasterDataItems`).

### 2.2. `[dbo].[sp_System_MasterData_Catalog_GetById]`
- **Mục đích:** Tra cứu chi tiết một nhóm danh mục theo Id.
- **Tham số đầu vào:**
  - `@CatalogId UNIQUEIDENTIFIER`: Mã định danh nhóm
- **Cấu trúc cột trả về:**
  - Bản ghi đơn lẻ với đầy đủ thông tin nhóm và `ItemCount`.

---

## 3. HỢP ĐỒNG RESTFUL API (API ENDPOINTS CONTRACT)

**Base URL:** `/api/v1/system/reference-data/catalogs`

| Method | Endpoint | Quyền yêu cầu | Mô tả chức năng | Request Body | Response Format |
|---|---|---|---|---|---|
| `GET` | `/` | `system.reference_data.view` | Lấy danh sách phân trang | Query Params | `ApiResponse<PagedResult<CatalogDto>>` |
| `GET` | `/{id}` | `system.reference_data.view` | Chi tiết 1 nhóm | Không có | `ApiResponse<CatalogDto>` |
| `POST` | `/` | `system.reference_data.manage` | Tạo mới nhóm danh mục | `CreateCatalogRequest` | `ApiResponse<Guid>` (HTTP 201 Created) |
| `PUT` | `/{id}` | `system.reference_data.manage` | Cập nhật tên/mô tả | `UpdateCatalogRequest` | `ApiResponse` (HTTP 200, 409 Conflict) |
| `PUT` | `/{id}/deactivate` | `system.reference_data.manage` | Ngừng sử dụng nhóm | `ChangeCatalogStatusRequest` | `ApiResponse` (HTTP 200, 400, 409) |
| `PUT` | `/{id}/activate` | `system.reference_data.manage` | Kích hoạt lại nhóm | `ChangeCatalogStatusRequest` | `ApiResponse` (HTTP 200, 409) |

### Cấu trúc Payload Error khi xảy ra Xung đột Concurrency (HTTP 409):
```json
{
  "success": false,
  "error": {
    "code": "CONCURRENCY_CONFLICT",
    "message": "Dữ liệu nhóm danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.",
    "details": null
  },
  "traceId": "00-72a1e9c20..."
}
```

---

## 4. HỢP ĐỒNG FRONTEND & ROUTING

- **Đường dẫn Route:** `/admin/reference-data`
- **Component:** `MasterDataCatalogListPage`
- **Menu Bar:** `Cấu hình hệ thống → Dữ liệu nguồn (Master Data)`
- **Quyền Guard:** `<RequireAuth permission="system.reference_data.view">`
- **Nút hành động CUD:** Được bảo vệ trực quan bởi component `<Can permission="system.reference_data.manage">`

