# SHD OneERP — SYS-REF-01 TEST EVIDENCE

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Ngày thực hiện:** 02/11/2026  
**Môi trường thử nghiệm:** Windows OS, SQL Server 2022 Localhost, .NET 10.0, Node.js 20.x, React 18 / Vite  

---

## 1. BẢNG TỔNG HỢP KIỂM THỬ THỰC TẾ (TEST EXECUTION MATRIX)

| Loại kiểm thử | Lệnh thực thi thực tế | Kết quả | Chi tiết kết quả & Bằng chứng |
|---|---|:---:|---|
| **Backend Solution Build** | `dotnet build backend/ShdOneErp.sln` | **PASS** | Exit code: 0, 0 Error(s), 28 Warning(s) (vulnerability warnings từ thư viện ngoài) |
| **Frontend Production Build** | `cd frontend && npm run build` | **PASS** | Exit code: 0, `tsc && vite build`, dist/index-lO_Ye05i.js (661 kB), build hoàn tất trong 4.20s |
| **Unit & Application Tests** | `dotnet test backend/ShdOneErp.sln` | **PASS** | Exit code: 0, Passed: 185, Failed: 0, Skipped: 0, Duration: 601 ms |
| **Fresh Database Rehearsal** | `powershell -NoProfile -File scratch/run_fresh_rehearsal.ps1` | **PASS** | Exit code: 0, 15/15 migrations apply thành công trên CSDL trắng `ShdOneErp_FreshValidation` |
| **Idempotency Runner Test** | `powershell -NoProfile -File database/scripts/run-migrations.ps1 ...` | **PASS** | Exit code: 0, Báo cáo: "Đã áp dụng: 0 \| Bỏ qua (đã chạy): 16" |
| **SQL Migration 0016** | `run-migrations.ps1 -Database ShdOneErpDb` | **PASS** | Exit code: 0, Migration `20261102_0016` hoàn tất trong 37 ms, ghi checksum SHA256 vào `__DbMigrationHistory` |
| **Stored Procedure Execution** | `scratch/verify_live_db_sys_ref_01.ps1` | **PASS** | `sp_System_MasterData_Catalog_GetPagedList` trả về bản ghi chính xác, ItemCount = 0, RowVersion Base64 chuẩn |
| **EF Write Integration** | `CatalogWriteServiceTests.CreateAsync_ValidRequest` | **PASS** | Tạo entity qua DbContext, sinh GUID Id và lưu thành công |
| **Duplicate Code Constraint** | `verify_live_db_sys_ref_01.ps1` (Test #5) | **PASS** | SQL Server chặn mã trùng: `Violation of UNIQUE KEY constraint 'UQ_System_MasterDataCatalogs_Code'` |
| **Direct GBAC Fail-Closed** | `CatalogWriteServiceTests.CreateAsync_WhenUserLacksPermission` | **PASS** | Trả về `FORBIDDEN` khi người dùng thiếu quyền `system.reference_data.manage` |
| **System Admin Restriction** | `CatalogWriteServiceTests.CreateAsync_SystemCatalogWithoutSystemAdminPermission` | **PASS** | Trả về `FORBIDDEN` với thông báo yêu cầu quyền quản trị cấp cao khi tạo nhóm `IsSystem = 1` |
| **Optimistic Concurrency (409)** | `CatalogWriteServiceTests.UpdateAsync_MismatchedRowVersion` | **PASS** | Ném `DbUpdateConcurrencyException`, Write Service chuyển đổi thành mã `CONCURRENCY_CONFLICT` |
| **Immutable Code & Deactivate** | `CatalogWriteServiceTests.DeactivateAsync_SystemControlledCatalog` | **PASS** | Cấm ngừng sử dụng danh mục hệ thống: trả lỗi `CANNOT_DEACTIVATE_SYSTEM_CATALOG` |

---

## 2. TRÍCH XUẤT NHẬT KÝ THỰC THI (VERIFIED EXECUTION LOGS)

### 2.1. Kết quả kiểm thử tự động toàn hệ thống (`dotnet test backend/ShdOneErp.sln`)
```
Test run for F:\MyProjectSHD\SHDONEERP\backend\ShdOneErp.Tests\bin\Debug\net10.0\ShdOneErp.Tests.dll (.NETCoreApp,Version=v10.0)
A total of 1 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:   185, Skipped:     0, Total:   185, Duration: 601 ms - ShdOneErp.Tests.dll (net10.0)
```

### 2.2. Kết quả kiểm thử build frontend (`npm run build`)
```
> shd-oneerp-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1639 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.56 kB │ gzip:   0.40 kB
dist/assets/index-BCTrDGiX.css  100.42 kB │ gzip:  15.23 kB
dist/assets/index-lO_Ye05i.js   661.10 kB │ gzip: 164.37 kB
✓ built in 4.20s
```

### 2.3. Bằng chứng kiểm thử trực tiếp trên CSDL thật (`verify_live_db_sys_ref_01.ps1`)
```
=== LIVE DATABASE END-TO-END VERIFICATION: SYS-REF-01 ===

1. System_MasterDataCatalogs Columns in Live Database:
   - Id (uniqueidentifier) Nullable=NO Default=(newsequentialid())
   - Code (nvarchar) Nullable=NO Default=
   - Name (nvarchar) Nullable=NO Default=
   - Description (nvarchar) Nullable=YES Default=
   - IsSystem (bit) Nullable=NO Default=((1))
   - CreatedAtUtc (datetime2) Nullable=NO Default=(sysutcdatetime())
   - OwnerModule (nvarchar) Nullable=NO Default=('SYSTEM')
   - ScopePolicy (nvarchar) Nullable=NO Default=('GLOBAL')
   - IsActive (bit) Nullable=NO Default=((1))
   - UpdatedAtUtc (datetime2) Nullable=YES Default=
   - RowVersion (timestamp) Nullable=NO Default=

2. Unique Indexes on System_MasterDataCatalogs:
   - PK_System_MasterDataCatalogs (Unique=True) on Column: Id
   - UQ_System_MasterDataCatalogs_Code (Unique=True) on Column: Code

3. Inserted Test Catalog: KR_INTAKE_TEST (ID: 71cd1902-3bce-47dc-a957-e26f5aef5d1e)

4. SP sp_System_MasterData_Catalog_GetPagedList Output:
   - Found Catalog: Code=KR_INTAKE_TEST | Name=Kỳ tuyển sinh Hàn Quốc Test | Module=ADMISSION | Active=True | ItemCount=0 | RowVersionBase64=AAAAAAAAB90=
   TotalCount: 1

5. Testing Duplicate Code Rejection on SQL Server:
   [PASS] SQL Server rejected duplicate code with error: Exception calling "ExecuteNonQuery" with "0" argument(s): "Violation of UNIQUE KEY constraint 'UQ_System_MasterDataCatalogs_Code'. Cannot insert duplicate key in object 'dbo.System_MasterDataCatalogs'. The duplicate key value is (KR_INTAKE_TEST)."

6. System Feature & Permission Mappings for SYS-REF-01:
   - Feature: system.reference_data | Action: view -> Permission: system.reference_data.view (Xem danh mục dữ liệu nguồn)
   - Feature: system.reference_data | Action: manage -> Permission: system.reference_data.manage (Quản trị nhóm danh mục dữ liệu nguồn)
   - Feature: system.reference_data | Action: system_admin -> Permission: system.reference_data.system_admin (Quản trị danh mục hệ thống cốt lõi)

7. Permissions Granted to ADMINISTRATORS:
   - Group: ADMINISTRATORS -> Permission: system.reference_data.system_admin
   - Group: ADMINISTRATORS -> Permission: system.reference_data.view
   - Group: ADMINISTRATORS -> Permission: system.reference_data.manage

8. Cleaned up test record 71cd1902-3bce-47dc-a957-e26f5aef5d1e.

=== LIVE DATABASE VERIFICATION COMPLETED WITH 100% SUCCESS ===
```

