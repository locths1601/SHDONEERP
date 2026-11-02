# SHD OneERP — SYS-REF-01 REVISED CONTRACT & TECHNICAL DESIGN
## User Story: Quản lý nhóm danh mục (System Reference Data Catalogs) — Hiệu đính GATE-00B

**Mã Story:** `SYS-REF-01`  
**Thuộc Epic:** `SYS-REF` — Cấu hình hệ thống & Dữ liệu nguồn  
**Mức độ ưu tiên:** P0  
**Tác giả:** Master AI Agent Orchestrator  
**Trạng thái đề xuất:** `REVISED_PROPOSAL` (Đã tiếp thu và chỉnh sửa toàn diện theo phán quyết của PO)  
**Phụ thuộc:** GATE-00B hoàn tất, Phê duyệt Phục hồi Migration, Quyết định PO-001, PO-002  

---

## 1. MÔ TẢ NGHIỆP VỤ & PHẠM VI (BUSINESS SCOPE BOUNDARIES)

### 1.1. User Story
> **Là** Quản trị viên cấu hình hệ thống (System Config Admin),  
> **Tôi muốn** tạo và quản lý các nhóm danh mục dùng chung (Catalogs) qua giao diện web trực quan,  
> **Để** các phân hệ nghiệp vụ (Hồ sơ học viên Hàn Quốc, Tuyển sinh, Địa lý, Phân loại hồ sơ) có thể tham chiếu dữ liệu chuẩn hóa mà không phải sửa code, viết SQL seed hoặc triển khai lại hệ thống.

### 1.2. Ranh giới Phân định Nghiệp vụ (Strict Scope Separation)
Theo chỉ thị của PO, ranh giới giữa `SYS-REF-01` và `SYS-REF-02` được thiết lập tường minh:
- **`SYS-REF-01` (Story này):** **CHỈ QUẢN LÝ NHÓM DANH MỤC (CATALOGS)**. Bao gồm: Xem danh sách nhóm, tạo nhóm mới, sửa thông tin mô tả/tên nhóm, kích hoạt/ngừng sử dụng nhóm danh mục.
- **`SYS-REF-02` (Story tiếp theo):** **QUẢN LÝ GIÁ TRỊ DANH MỤC (ITEMS)**. Toàn bộ thao tác thêm, sửa, xóa, sắp xếp giá trị con (Items) thuộc về SYS-REF-02. Tuyệt đối không mở rộng giao diện hoặc API của SYS-REF-01 sang CRUD Items.
- **Không hardcode danh mục nghiệp vụ:** Hệ thống cung cấp nền tảng quản trị danh mục rỗng (Platform Engine). Mọi danh mục nghiệp vụ cụ thể (Visa Hàn Quốc, Kỳ tuyển sinh, Loại giấy tờ) sẽ do Admin cấu hình qua UI/API, không hardcode vào mã nguồn hay migration seed.

---

## 2. KIẾN TRÚC DOMAIN LAYER & MỘT NGUỒN SỰ THẬT DUY NHẤT (SINGLE SOURCE OF TRUTH)

### 2.1. Tái sử dụng Thực thể Hiện hữu (`MasterDataEntities.cs`)
Tuyệt đối không tạo mới thực thể trùng lặp (`ReferenceDataCatalog`). Codebase hiện đã có thực thể [`MasterDataCatalog`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs#L3-L23) trong phân hệ `ShdOneErp.Domain.Entities.System`.

### 2.2. Hợp nhất "Một Nguồn Sự Thật" (Single Source of Truth)

Trong thiết kế trước, việc đề xuất đồng thời `Status` / `IsActive` và `ManagementMode` / `IsSystem` gây ra nguy cơ lệch pha trạng thái. Trong bản hiệu đính này, chúng tôi quy định một nguồn sự thật duy nhất:

1. **Về Trạng thái Vòng đời (Lifecycle Status):**
   - **Nguồn sự thật CSDL & Entity:** Cột boolean `IsActive` (`BIT` trong SQL Server, `bool` trong C#).
   - `IsActive = true`: Đang hoạt động (`ACTIVE`).
   - `IsActive = false`: Ngừng sử dụng (`INACTIVE`).
   - DTOs và Frontend hiển thị nhãn `ACTIVE` / `INACTIVE` dựa trên ánh xạ từ trường boolean `IsActive`. Không tạo cột `Status` riêng biệt trong CSDL.
2. **Về Chế độ Quản trị (Management Mode):**
   - **Nguồn sự thật CSDL & Entity:** Cột boolean `IsSystem` (`BIT` trong SQL Server, `bool` trong C#).
   - `IsSystem = true`: Nhóm do hệ thống kiểm soát (`SYSTEM_CONTROLLED`). Gắn liền với logic cốt lõi. Khóa hoàn toàn chức năng đổi `Code` hoặc xóa nhóm qua UI.
   - `IsSystem = false`: Nhóm do quản trị viên định nghĩa (`ADMIN_MANAGED`). Cho phép người dùng có quyền quản lý toàn diện.
   - DTOs và Frontend hiển thị nhãn `SYSTEM_CONTROLLED` / `ADMIN_MANAGED` dựa trên ánh xạ từ trường boolean `IsSystem`.
3. **Bảo toàn Tương thích Ngược (Backward Compatibility):**
   - Bảng `System_MasterDataCatalogs` hiện hữu trong CSDL đã có sẵn cột `IsSystem` và `CreatedAtUtc`. Do đó, quy ước này hoàn toàn tương thích 100% với schema hiện tại mà không phải đổi tên cột hay sinh cột trùng lặp.

### 2.3. Quy tắc Bất biến Domain (Domain Invariants)
Trong lớp Domain Entity `MasterDataCatalog`:
```csharp
namespace ShdOneErp.Domain.Entities.System;

public class MasterDataCatalog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string OwnerModule { get; private set; } = "SYSTEM";
    public string ScopePolicy { get; private set; } = "GLOBAL";
    public bool IsSystem { get; private set; } = false;
    public bool IsActive { get; private set; } = true;
    public byte[] RowVersion { get; private set; } = [];
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }

    // Navigation property - được nạp khi cần nhưng không xử lý CRUD trong SYS-REF-01
    public ICollection<MasterDataItem> Items { get; private set; } = new List<MasterDataItem>();

    private MasterDataCatalog() { }

    public MasterDataCatalog(string code, string name, string? description, string ownerModule, bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_CODE", "Mã danh mục không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên danh mục không được để trống.");

        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        OwnerModule = string.IsNullOrWhiteSpace(ownerModule) ? "SYSTEM" : ownerModule.Trim().ToUpperInvariant();
        ScopePolicy = "GLOBAL"; // Phase 1 bắt buộc GLOBAL
        IsSystem = isSystem;
        IsActive = true;
    }

    public void UpdateDetails(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên danh mục không được để trống.");

        Name = name.Trim();
        Description = description?.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        if (IsSystem)
            throw new BusinessRuleViolationException("CANNOT_DEACTIVATE_SYSTEM_CATALOG", "Không thể ngừng sử dụng nhóm danh mục hệ thống cốt lõi.");

        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
```

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU & MIGRATION CONTRACT

### 3.1. Kế hoạch Migration Viết tay Bổ sung
- **Tên tệp migration:** `20261030_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql`
- **Thứ tự thực thi:** Chạy sau khi migration `0015` được phục hồi hoàn tất.
- **Tính chất Idempotent:** Sử dụng kiểm tra tồn tại cột trước khi thêm mới.

### 3.2. Script DDL Chi tiết (Bổ sung Cột & RowVersion)
```sql
-- 1. Bổ sung các cột mở rộng cho System_MasterDataCatalogs
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'OwnerModule')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [OwnerModule] NVARCHAR(50) NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_OwnerModule DEFAULT 'SYSTEM';
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'ScopePolicy')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [ScopePolicy] NVARCHAR(30) NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_ScopePolicy DEFAULT 'GLOBAL';
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'IsActive')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [IsActive] BIT NOT NULL CONSTRAINT DF_System_MasterDataCatalogs_IsActive DEFAULT 1;
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'UpdatedAtUtc')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [UpdatedAtUtc] DATETIME2(7) NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'RowVersion')
BEGIN
    ALTER TABLE [dbo].[System_MasterDataCatalogs]
    ADD [RowVersion] ROWVERSION NOT NULL;
END;

-- 2. Đảm bảo Index Unique trên Code để chống race condition
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.System_MasterDataCatalogs') AND name = 'UQ_System_MasterDataCatalogs_Code')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_System_MasterDataCatalogs_Code] ON [dbo].[System_MasterDataCatalogs] ([Code] ASC);
END;
```

---

## 4. STORED PROCEDURES CONTRACT (READ-SIDE PERSISTENCE CQRS)

Tuân thủ nghiêm ngặt rule [`15-backend-stored-procedure.mdc`](file:///.cursor/rules/15-backend-stored-procedure.mdc). Mọi truy vấn GET nghiệp vụ đều qua Stored Procedure.

### 4.1. Stored Procedure: Phân trang & Tìm kiếm Danh mục
**Tên SP:** `[dbo].[sp_System_MasterData_Catalog_GetPagedList]`

**Xử lý các tình huống biên (Edge Cases):**
1. **Danh sách rỗng (Empty Set):** Trả về 0 dòng, `@TotalCount = 0`, không báo lỗi.
2. **Số trang vượt giới hạn (`PageNumber` vượt quá `TotalPages`):** Trả về danh sách rỗng, `@TotalCount` vẫn phản ánh tổng số bản ghi thực tế để client hiển thị phân trang đúng.
3. **Whitelist sắp xếp an toàn:** Chỉ chấp nhận `Code`, `Name`, `OwnerModule`, `CreatedAtUtc`. Nếu truyền sai, fallback về `Code ASC`.

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Catalog_GetPagedList]
    @SearchTerm NVARCHAR(100) = NULL,
    @OwnerModule NVARCHAR(50) = NULL,
    @IsActive BIT = NULL,
    @IsSystem BIT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(50) = 'Code',
    @SortOrder NVARCHAR(4) = 'ASC',
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa tham số phân trang
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;

    -- Tính tổng số bản ghi
    SELECT @TotalCount = COUNT(1)
    FROM [dbo].[System_MasterDataCatalogs] c
    WHERE (@SearchTerm IS NULL OR c.[Code] LIKE '%' + @SearchTerm + '%' OR c.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@OwnerModule IS NULL OR c.[OwnerModule] = @OwnerModule)
      AND (@IsActive IS NULL OR c.[IsActive] = @IsActive)
      AND (@IsSystem IS NULL OR c.[IsSystem] = @IsSystem);

    -- Lấy dữ liệu phân trang có Whitelist Sort
    SELECT 
        c.[Id],
        c.[Code],
        c.[Name],
        c.[Description],
        c.[OwnerModule],
        c.[ScopePolicy],
        c.[IsSystem],
        c.[IsActive],
        c.[RowVersion],
        c.[CreatedAtUtc],
        c.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_MasterDataItems] i WHERE i.[CatalogId] = c.[Id]) AS [ItemCount]
    FROM [dbo].[System_MasterDataCatalogs] c
    WHERE (@SearchTerm IS NULL OR c.[Code] LIKE '%' + @SearchTerm + '%' OR c.[Name] LIKE '%' + @SearchTerm + '%')
      AND (@OwnerModule IS NULL OR c.[OwnerModule] = @OwnerModule)
      AND (@IsActive IS NULL OR c.[IsActive] = @IsActive)
      AND (@IsSystem IS NULL OR c.[IsSystem] = @IsSystem)
    ORDER BY
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'ASC' THEN c.[Code] END ASC,
        CASE WHEN @SortBy = 'Code' AND @SortOrder = 'DESC' THEN c.[Code] END DESC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'ASC' THEN c.[Name] END ASC,
        CASE WHEN @SortBy = 'Name' AND @SortOrder = 'DESC' THEN c.[Name] END DESC,
        CASE WHEN @SortBy = 'OwnerModule' AND @SortOrder = 'ASC' THEN c.[OwnerModule] END ASC,
        CASE WHEN @SortBy = 'OwnerModule' AND @SortOrder = 'DESC' THEN c.[OwnerModule] END DESC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'ASC' THEN c.[CreatedAtUtc] END ASC,
        CASE WHEN @SortBy = 'CreatedAtUtc' AND @SortOrder = 'DESC' THEN c.[CreatedAtUtc] END DESC,
        c.[Code] ASC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
```

### 4.2. Stored Procedure: Chi tiết Danh mục theo ID
**Tên SP:** `[dbo].[sp_System_MasterData_Catalog_GetById]`
```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_System_MasterData_Catalog_GetById]
    @CatalogId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.[Id],
        c.[Code],
        c.[Name],
        c.[Description],
        c.[OwnerModule],
        c.[ScopePolicy],
        c.[IsSystem],
        c.[IsActive],
        c.[RowVersion],
        c.[CreatedAtUtc],
        c.[UpdatedAtUtc],
        (SELECT COUNT(1) FROM [dbo].[System_MasterDataItems] i WHERE i.[CatalogId] = c.[Id]) AS [ItemCount]
    FROM [dbo].[System_MasterDataCatalogs] c
    WHERE c.[Id] = @CatalogId;
END;
GO
```

---

## 5. BẢO MẬT DIRECT GBAC V4.2, QUYỀN VÀ DATA SCOPE

### 5.1. Phân loại Mã quyền (Permission Registry)
Tuân thủ rule [`40-permission-codes.mdc`](file:///.cursor/rules/40-permission-codes.mdc):
1. `system.reference_data.view`: Quyền xem danh sách, chi tiết và tra cứu nhóm danh mục.
2. `system.reference_data.manage`: Quyền tạo mới, chỉnh sửa thông tin và kích hoạt/ngừng dùng các danh mục `ADMIN_MANAGED` (`IsSystem = 0`).
3. `system.reference_data.system_admin`: Quyền đặc biệt chỉ dành riêng cho Quản trị viên cấp cao nhất khi cần chỉnh sửa tên/mô tả của danh mục hệ thống `SYSTEM_CONTROLLED` (`IsSystem = 1`).

### 5.2. Chính sách Fail-Closed & Data Scope cho GLOBAL Catalogs
- **Fail-Closed:** Bất kỳ truy vấn nào không có token hợp lệ hoặc user không có quyền tương ứng trong membership của mình đều bị từ chối ngay tại Controller bằng HTTP 401 Unauthorized hoặc 403 Forbidden.
- **Data Scope cho GLOBAL:** Vì toàn bộ Catalogs trong Phase 1 có `ScopePolicy = GLOBAL`, mọi người dùng có quyền `system.reference_data.view` thuộc bất kỳ LegalEntity nào đều có thể xem danh mục. Tuy nhiên, quyền ghi (`manage`) chỉ được kích hoạt nếu user thuộc nhóm có Scope quản trị toàn cục (`Global Scope`).

### 5.3. Nhật ký Kiểm toán (Audit Logging)
Mọi thao tác ghi (Tạo, Sửa, Đổi trạng thái) đều được ghi nhận vào bảng `Audit_SystemLogs` với các trường:
- `UserId`, `UserName`, `Action` (`CreateCatalog`, `UpdateCatalog`, `DeactivateCatalog`), `EntityName` (`MasterDataCatalog`), `EntityId`, `OldValues`, `NewValues`, `TimestampUtc`, `TraceId`.

---

## 6. THIẾT KẾ BACKEND API & XỬ LÝ CONCURRENCY

### 6.1. RESTful API Endpoints Contract
**Controller:** `MasterDataCatalogsController`  
**Route cơ sở:** `/api/v1/system/reference-data/catalogs`

| Method | Endpoint | Quyền yêu cầu | Mô tả | Mã phản hồi |
|---|---|---|---|:---:|
| `GET` | `/` | `system.reference_data.view` | Lấy danh sách nhóm phân trang, lọc | 200 OK |
| `GET` | `/{id}` | `system.reference_data.view` | Xem chi tiết 1 nhóm | 200 OK, 404 |
| `POST` | `/` | `system.reference_data.manage` | Tạo mới nhóm danh mục | 201 Created, 400 |
| `PUT` | `/{id}` | `system.reference_data.manage` | Sửa tên/mô tả (yêu cầu RowVersion) | 200 OK, 400, 404, 409 |
| `PUT` | `/{id}/deactivate` | `system.reference_data.manage` | Ngừng sử dụng nhóm | 200 OK, 400, 409 |
| `PUT` | `/{id}/activate` | `system.reference_data.manage` | Kích hoạt lại nhóm | 200 OK, 400, 409 |

### 6.2. Kiểm soát Xung đột Đồng thời (Optimistic Concurrency — HTTP 409)
- Request `PUT` cập nhật bắt buộc phải gửi kèm chuỗi `rowVersion` (Base64).
- Khi ghi vào CSDL, EF Core so khớp `RowVersion`. Nếu phát hiện bản ghi đã bị sửa đổi bởi người khác, EF Core ném `DbUpdateConcurrencyException`.
- Middleware chuyển đổi thành HTTP 409 Conflict với payload chuẩn:
  ```json
  {
    "code": "CONCURRENCY_CONFLICT",
    "message": "Dữ liệu nhóm danh mục đã bị thay đổi bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất.",
    "traceId": "00-84a1e9c20..."
  }
  ```

---

## 7. THIẾT KẾ FRONTEND (REACT 18 + TYPESCRIPT + ENTERPRISE UX)

### 7.1. Định tuyến & Menu
- **Đường dẫn hiển thị:** `Cấu hình hệ thống → Dữ liệu nguồn`
- **Route URL:** `/admin/reference-data`
- **Component chính:** `MasterDataCatalogListPage.tsx` đặt tại `frontend/src/features/system-reference-data/`.

### 7.2. 6 Trạng thái UI Chuẩn Enterprise (Rule 25)
1. **Loading State:** Sử dụng component `Skeleton` hiển thị 5 dòng bảng mô phỏng.
2. **Empty State:** Hiển thị `EmptyState` khi chưa có dữ liệu hoặc không tìm thấy kết quả tìm kiếm, kèm nút "Tạo nhóm danh mục".
3. **Error State:** Hiển thị hộp thông báo lỗi màu đỏ kèm nút "Thử lại".
4. **Success State:** Hiển thị bảng `DataGrid` với các cột: Mã nhóm, Tên nhóm, Phân hệ sở hữu, Chế độ quản trị, Số giá trị con (`ItemCount`), Trạng thái (`ACTIVE`/`INACTIVE`), Thao tác.
5. **Forbidden State (403):** Ẩn/hiện nút hành động qua component `<Can permission="...">`. Nếu truy cập URL không có quyền, hiển thị trang 403 Forbidden.
6. **Conflict State (409):** Hộp thoại cảnh báo đụng độ dữ liệu, cung cấp nút "Tải lại trang".

---

## 8. MA TRẬN ÁNH XẠ ACCEPTANCE CRITERIA (AC TRACEABILITY MATRIX)

| Mã AC | Tiêu chí nghiệm thu | Bằng chứng Thiết kế Kỹ thuật | Trạng thái Dự kiến |
|---|---|---|:---:|
| **AC01** | Tạo nhóm danh mục hợp lệ khi có quyền | API `POST /catalogs`, EF Write, ghi `Audit_SystemLogs`, trả 201 Created | READY_FOR_DEV |
| **AC02** | Chặn mã code trùng trong hệ thống | Unique Index `UQ_System_MasterDataCatalogs_Code` + FluentValidation, trả 400 Bad Request | READY_FOR_DEV |
| **AC03** | Chặn xóa/sửa code khi đã có tham chiếu | Code là bất biến (immutable), không có API hard-delete, chỉ hỗ trợ Deactivate | READY_FOR_DEV |
| **AC04** | Chặn truy cập khi user không có quyền | Direct GBAC middleware kiểm tra `system.reference_data.manage`, trả 403 Forbidden | READY_FOR_DEV |
| **AC05** | Nhóm mới hiển thị ngay lập tức qua UI | SP `sp_System_MasterData_Catalog_GetPagedList` đọc trực tiếp từ CSDL, không cache tĩnh | READY_FOR_DEV |

---

## 9. KẾT LUẬN & ĐÁNH GIÁ SẴN SÀNG

Hợp đồng kỹ thuật cho `SYS-REF-01` đã được hiệu đính toàn diện:
1. Đã giải quyết triệt để vấn đề "Một nguồn sự thật" (`IsActive`, `IsSystem`).
2. Tái sử dụng 100% entity `MasterDataCatalog` và cấu hình EF hiện hữu.
3. Cô lập hoàn toàn phạm vi nhóm danh mục, không lẫn lộn với quản lý giá trị danh mục (SYS-REF-02).
4. Thiết kế SP an toàn trước các edge cases (empty results, out-of-bounds pagination).
5. Đầy đủ hàng rào Direct GBAC fail-closed, Audit log và Optimistic Concurrency 409.

