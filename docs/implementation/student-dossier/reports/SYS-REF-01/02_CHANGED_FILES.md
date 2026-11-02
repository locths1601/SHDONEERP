# SHD OneERP — SYS-REF-01 CHANGED FILES

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Ngày thực hiện:** 02/11/2026  

---

## 1. DANH SÁCH TỆP THAY ĐỔI THEO PHÂN HỆ

| Đường dẫn tệp | Loại thay đổi | Mô tả lý do thay đổi | Agent phụ trách |
|---|:---:|---|:---:|
| `database/migrations/20261102_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql` | **NEW** | Handwritten SQL migration bổ sung cột, Unique Index, Stored Procedures, Permissions, Features và gán quyền Administrator | Database Agent |
| `backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs` | **MODIFIED** | Nâng cấp Domain Entity `MasterDataCatalog`: bổ sung OwnerModule, ScopePolicy, IsActive, RowVersion, UpdatedAtUtc và các domain methods | Backend Agent |
| `backend/ShdOneErp.Infrastructure/Persistence/Configurations/PlatformConfigurations.cs` | **MODIFIED** | Cấu hình EF Core Fluent API mapping cho các thuộc tính mới của `MasterDataCatalog` và `IsRowVersion()` | Backend Agent |
| `backend/ShdOneErp.Application/Modules/SystemReferenceData/DTOs/CatalogDtos.cs` | **NEW** | Khai báo các DTOs cho Catalog: `CatalogDto`, `CatalogFilterQuery`, `CreateCatalogRequest`, `UpdateCatalogRequest`, `ChangeCatalogStatusRequest` | Backend Agent |
| `backend/ShdOneErp.Application/Modules/SystemReferenceData/Interfaces/IMasterDataCatalogServices.cs` | **NEW** | Giao diện hợp đồng CQRS Read & Write: `IMasterDataCatalogReadService`, `IMasterDataCatalogWriteService` | Backend Agent |
| `backend/ShdOneErp.Application/Modules/SystemReferenceData/Validators/CatalogValidators.cs` | **NEW** | FluentValidation kiểm tra hợp lệ cho tạo mới, cập nhật và đổi trạng thái (chống rỗng, độ dài, regex format, bắt buộc RowVersion) | Backend Agent |
| `backend/ShdOneErp.Application/Modules/SystemReferenceData/Services/MasterDataCatalogWriteService.cs` | **NEW** | Cài đặt nghiệp vụ ghi: Direct GBAC v4.2 fail-closed, kiểm tra trùng lặp code, kiểm soát optimistic concurrency token | Backend Agent |
| `backend/ShdOneErp.Infrastructure/Persistence/StoredProcedures/ReadServices/MasterDataCatalogReadService.Sp.cs` | **NEW** | Cài đặt nghiệp vụ đọc CQRS: thực thi Stored Procedure `sp_System_MasterData_Catalog_GetPagedList` và `GetById` qua Dapper | Backend Agent |
| `backend/ShdOneErp.Api/Controllers/MasterDataCatalogsController.cs` | **NEW** | RESTful API Controller `/api/v1/system/reference-data/catalogs` với bảo mật Direct GBAC fail-closed `[Authorize(Policy = "...")]` | Backend Agent |
| `backend/ShdOneErp.Infrastructure/DependencyInjection.cs` | **MODIFIED** | Đăng ký dịch vụ DI cho Read/Write Catalog, kích hoạt Module Registry, Workflow và Outbox Platform | Master Agent |
| `backend/ShdOneErp.Tests/Domain/MasterDataCatalogDomainTests.cs` | **NEW** | Kiểm thử đơn vị Domain Invariants: kiểm tra validation đầu vào, cập nhật thông tin, kích hoạt và cấm vô hiệu hóa danh mục hệ thống | QA Agent |
| `backend/ShdOneErp.Tests/Application/CatalogValidationTests.cs` | **NEW** | Kiểm thử đơn vị FluentValidation: kiểm tra format mã code, độ dài tên, bắt buộc RowVersion | QA Agent |
| `backend/ShdOneErp.Tests/Application/CatalogWriteServiceTests.cs` | **NEW** | Kiểm thử đơn vị Application Write Service: kiểm tra phân quyền Direct GBAC, chống trùng mã, xử lý xung đột đồng thời 409 | QA Agent |
| `frontend/src/features/system-reference-data/types/referenceData.ts` | **NEW** | Khai báo kiểu dữ liệu TypeScript contracts cho module Dữ liệu nguồn | Frontend Agent |
| `frontend/src/features/system-reference-data/services/referenceDataService.ts` | **NEW** | Axios/Fetch API client gọi các endpoints `/api/v1/system/reference-data/catalogs` | Frontend Agent |
| `frontend/src/features/system-reference-data/hooks/useCatalogs.ts` | **NEW** | TanStack Query hooks cho truy vấn và mutations (kèm invalidate cache tự động và toast thông báo) | Frontend Agent |
| `frontend/src/features/system-reference-data/components/CatalogConflictModal.tsx` | **NEW** | Hộp thoại cảnh báo xung đột đồng thời 409 (Optimistic Concurrency Conflict Dialog) | Frontend Agent |
| `frontend/src/features/system-reference-data/components/CatalogDrawerForm.tsx` | **NEW** | Form SideDrawer thêm mới / chỉnh sửa nhóm danh mục (khóa mã code khi sửa, validate form trực quan) | Frontend Agent |
| `frontend/src/features/system-reference-data/pages/MasterDataCatalogListPage.tsx` | **NEW** | Trang quản trị nhóm danh mục chuẩn Enterprise với đầy đủ 6 trạng thái UI (Skeleton, Empty, Error, Success DataGrid, 403, 409) | Frontend Agent |
| `frontend/src/features/system-reference-data/index.ts` | **NEW** | Barrel export cho feature system-reference-data | Frontend Agent |
| `frontend/src/App.tsx` | **MODIFIED** | Đăng ký route `/admin/reference-data` kèm guard quyền `system.reference_data.view` | Frontend Agent |
| `frontend/src/components/layout/Sidebar.tsx` | **MODIFIED** | Bổ sung mục điều hướng `Dữ liệu nguồn (Master Data)` trong nhóm menu Quản trị | Frontend Agent |

---

## 2. CÁC TỆP SỬA LỖI TRONG GATE-00C (PHỤC HỒI CƠ SỞ DỮ LIỆU)

| Đường dẫn tệp | Loại thay đổi | Mô tả lý do |
|---|:---:|---|
| `database/scripts/run-migrations.ps1` | **MODIFIED** | Chuyển checksum mismatch từ Warning thành Blocking Error (`exit 1`), lưu định dạng UTF-8 with BOM |
| `database/migrations/20261025_0006_SeedFoundationData.sql` | **MODIFIED** | Thêm điều kiện `IF NOT EXISTS` cho bản ghi thành viên `Identity_UserGroupMembers` |
| `database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql` | **MODIFIED** | Chuẩn hóa GUID của phân hệ thành chuỗi hex hợp lệ (`A1000000-...`) |
| `database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql` | **MODIFIED** | Chuẩn hóa GUID quy trình và bổ sung kiểm tra tồn tại `IF NOT EXISTS` |
| `database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` | **MODIFIED** | Khắc phục NEWSEQUENTIALID() trong INSERT, bổ sung PermissionCode trong MERGE, chuẩn hóa cột FromPartyId/ToPartyId và sửa scope check |

