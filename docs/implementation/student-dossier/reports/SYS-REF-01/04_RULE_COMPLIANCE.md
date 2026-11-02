# SHD OneERP — SYS-REF-01 RULE COMPLIANCE MATRIX

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Ngày thực hiện:** 02/11/2026  

---

## 1. MA TRẬN ĐỐI CHIẾU QUY TẮC PHÁT TRIỂN (.CURSOR/RULES/)

| Quy tắc (.cursor/rules/) | Mức độ áp dụng | Trạng thái tuân thủ | Bằng chứng kiểm tra thực tế |
|---|:---:|:---:|---|
| **00-stack-reality.mdc** | Bắt buộc | **PASS** | Sử dụng đúng .NET 10 Modular Monolith, SQL Server, EF Core Write, Stored Procedures Read, React 18 / TypeScript / Vite. Tuyệt đối không import stack lạ. |
| **10-migration-workflow.mdc** | Bắt buộc | **PASS** | Sử dụng handwritten SQL migration `20261102_0016_EnhanceMasterDataCatalogsSchemaAndSp.sql`. Thực thi qua `run-migrations.ps1` có `sp_getapplock`. Tuyệt đối không dùng `dotnet ef migrations add` hay `Database.Migrate()`. Đảm bảo tính Idempotent 100%. |
| **15-backend-stored-procedure.mdc** | Bắt buộc | **PASS** | Nghiệp vụ GET phân trang và chi tiết được thực hiện 100% qua Stored Procedures (`sp_System_MasterData_Catalog_GetPagedList` và `sp_System_MasterData_Catalog_GetById`). Xử lý an toàn whitelist sort, empty set, out-of-bounds pagination. |
| **20-frontend-component-rules.mdc** | Bắt buộc | **PASS** | Tái sử dụng triệt để components hiện hữu trong `components/common/`: `PageContainer`, `DataGrid`, `SideDrawer`, `ConfirmDialog`, `Button`, `Skeleton`. |
| **25-ui-ux-experience.mdc** | Bắt buộc | **PASS** | Cài đặt đầy đủ 6 trạng thái UI: 1. Loading (Skeleton), 2. Empty (EmptyState), 3. Error (Error Banner), 4. Success (DataGrid), 5. Forbidden (<Can>), 6. Conflict (CatalogConflictModal 409). |
| **30-bug-fix-protocol.mdc** | Bắt buộc | **PASS** | Khắc phục triệt để các lỗi migration cũ trong GATE-00C (NEWSEQUENTIALID, GUID invalid, missing PermissionCode, Scope checks) mà không tạo phá vỡ tương thích. |
| **40-permission-codes.mdc** | Bắt buộc | **PASS** | Đăng ký chuẩn cú pháp permission: `system.reference_data.view`, `system.reference_data.manage`, `system.reference_data.system_admin` tại `Identity_Permissions` và ánh xạ qua `System_FeatureActionPermissions`. |
| **50-do-and-dont.mdc** | Bắt buộc | **PASS** | Không hardcode danh mục nghiệp vụ vào mã nguồn; không tạo thực thể duplicate; khóa mã `Code` bất biến; không dùng Git commit/push trái thẩm quyền. |
| **99-reference-index.mdc** | Bắt buộc | **PASS** | Tuân thủ các nguyên tắc phân loại và chỉ mục tài liệu. |

---

## 2. ĐÁNH GIÁ XUNG ĐỘT HỆ THỐNG CŨ (LEGACY PLATFORM CONFLICTS)

- Không có xung đột với ezHR/OneHR do toàn bộ các mã quyền, thực thể và bảng cơ sở dữ liệu đã được cô lập trong namespace `system.reference_data` và bảng `System_MasterDataCatalogs`.
- Không có hiện tượng rò rỉ dữ liệu hoặc sai lệch schema.

