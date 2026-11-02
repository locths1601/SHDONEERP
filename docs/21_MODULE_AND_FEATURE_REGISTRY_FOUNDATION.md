# SHD ONEERP — FND-04: MODULE & FEATURE REGISTRY FOUNDATION SPECIFICATION

## 1. Mục đích & Tầm nhìn
Phân hệ **Module & Feature Registry** đóng vai trò danh mục metadata nghiệp vụ tập trung của toàn bộ hệ sinh thái SHD OneERP. Phân hệ cung cấp cơ chế đăng ký, kiểm soát phiên bản, phân cấp chức năng, và quản lý liên kết ánh xạ `Module → Feature → Action → PermissionCode` làm nền tảng cho việc mở rộng hàng chục phân hệ nghiệp vụ mà không bị phân mảnh hay hardcode.

---

## 2. Mô hình Thực thể & Metadata (Data Catalog)

### 2.1. Phân hệ Nghiệp vụ (`System_Modules`)
- `Id`: Định danh duy nhất (UUID).
- `Code`: Mã định danh ổn định viết hoa (ví dụ: `SYSTEM`, `ORGANIZATION`, `PARTY360`, `IDENTITY`, `AUDIT`, `DOCUMENTS`, `MASTERDATA`, `WORKFLOW`).
- `Name`: Tên phân hệ nghiệp vụ.
- `Description`: Mô tả phạm vi nghiệp vụ của phân hệ.
- `ParentModuleId`: Khóa ngoại trỏ đến phân hệ cha (hỗ trợ phân cấp nhóm phân hệ).
- `Version`: Phiên bản SemVer (`Major.Minor.Patch`).
- `DisplayOrder`: Thứ tự sắp xếp trên thanh điều hướng và báo cáo.
- `Icon`: Biểu tượng hiển thị (tương thích Lucide Icons).
- `Status`: Vòng đời phân hệ (`Active`, `Beta`, `Deprecated`, `Inactive`).
- `EffectiveFromUtc` / `EffectiveToUtc`: Khoảng thời gian hiệu lực phát hành.

### 2.2. Phụ thuộc Phân hệ (`System_ModuleDependencies`)
- `ModuleId`: Phân hệ phụ thuộc.
- `DependsOnModuleId`: Phân hệ được phụ thuộc.
- `DependencyType`:
  - `Required`: Bắt buộc phải có để hệ thống hoạt động.
  - `Optional`: Tính năng mở rộng, có thể hoạt động độc lập.
  - `Extension`: Plugin / Add-on mở rộng hành vi.
- `MinVersion`: Phiên bản tối thiểu của module được phụ thuộc.

### 2.3. Tính năng Hệ thống (`System_Features`)
- `Id`: Định danh duy nhất (UUID).
- `ModuleId`: Khóa ngoại trỏ đến phân hệ sở hữu.
- `Code`: Mã tính năng duy nhất toàn hệ thống (ví dụ: `system.modules`, `system.features`, `system.permission_map`).
- `Name`: Tên hiển thị của tính năng.
- `FeatureType`:
  - `Screen`: Màn hình giao diện người dùng.
  - `Api`: API dịch vụ hoặc endpoint dữ liệu.
  - `BusinessProcess`: Luồng xử lý nghiệp vụ liên phân hệ.
  - `Report`: Báo cáo quản trị / thống kê.
  - `Component`: Thành phần giao diện nhúng tái sử dụng.
  - `Service`: Dịch vụ chạy nền hoặc tích hợp.
- `ParentFeatureId`: Khóa ngoại phân cấp tính năng cha - con.
- `RoutePath`: Đường dẫn frontend route (URL).
- `ApiEndpoint`: Đường dẫn backend API endpoint.
- `ComponentKey`: Khóa định danh component frontend.
- `SupportedActions`: Danh sách hành động hỗ trợ (`view`, `create`, `edit`, `delete`, `export`, `approve`, `assign`).
- `Status`: Trạng thái (`Active`, `Beta`, `Disabled`, `Deprecated`).
- `DataClassification`: Mức độ bảo mật (`Public`, `Internal`, `Confidential`, `Restricted`).
- `OwnerTeam`: Đội ngũ kỹ thuật chịu trách nhiệm (Code Ownership).
- `IsEnabledGlobal`: Cờ kích hoạt toàn hệ thống (System-level Toggle).

### 2.4. Ánh xạ Hành động & Quyền (`System_FeatureActionPermissions`)
- `Id`: Định danh duy nhất (UUID).
- `FeatureId`: Khóa ngoại trỏ đến tính năng.
- `ActionCode`: Mã thao tác nghiệp vụ chuẩn hóa (`view`, `create`, `edit`, `delete`, `export`, `approve`, `assign`).
- `ActionName`: Tên hiển thị tiếng Việt của thao tác.
- `PermissionCode`: Mã quyền GBAC kiểm soát truy cập (ví dụ: `system.module.view`, `system.module.manage`).
- `PermissionId`: Khóa ngoại mềm trỏ tới `Identity_Permissions` khi mã quyền đã được phê duyệt trong catalog.
- `IsDefault`: Cờ quyền mặc định (được kích hoạt tự động khi truy cập tính năng).

---

## 3. Kiến trúc Đọc / Ghi (CQRS Pattern)

- **Write Side (Domain Invariants & Concurrency):**
  - Thực thi qua EF Core `ShdOneErpDbContext`.
  - Validate mã không trùng lặp, ràng buộc Semantic Versioning, phát hiện phụ thuộc vòng (Circular Dependency Detection).
  - Tự động tra cứu `Identity_Permissions` để liên kết `PermissionId` khi tạo Action Mapping.
- **Read Side (High Performance Stored Procedures):**
  - Tất cả các truy vấn GET phân trang, chi tiết, cây phân cấp đều được thực thi qua SQL Server Stored Procedures đã biên dịch sẵn:
    - `sp_System_Module_GetPaged`
    - `sp_System_Module_GetById`
    - `sp_System_Module_GetHierarchy`
    - `sp_System_Feature_GetPaged`
    - `sp_System_Feature_GetById`
    - `sp_System_Feature_GetHierarchy`
    - `sp_System_PermissionMapping_GetAll`
  - Giảm thiểu độ trễ, tối ưu hóa chỉ mục SQL, bảo vệ chống N+1 queries.

---

## 4. Tích hợp Bảo mật GBAC (Granular Business Access Control)

Các quyền hạn quản trị được định nghĩa và bảo vệ bằng Dynamic Policy:

| Mã quyền (PermissionCode) | Tên quyền | Phân hệ | Mục đích |
| :--- | :--- | :--- | :--- |
| `system.module.view` | Tra cứu danh mục phân hệ | SYSTEM | Xem danh sách, chi tiết và cây phân hệ |
| `system.module.manage` | Quản trị danh mục phân hệ | SYSTEM | Tạo, sửa, xóa phân hệ và quản lý dependencies |
| `system.feature.view` | Tra cứu danh mục tính năng | SYSTEM | Xem danh sách, chi tiết và cây phân cấp tính năng |
| `system.feature.manage` | Quản trị danh mục tính năng | SYSTEM | Tạo, sửa, xóa tính năng và cấu hình hành động |
| `system.permission_map.view` | Tra cứu bản đồ ánh xạ quyền | SYSTEM | Xem ma trận Module → Feature → Action → Permission |
| `system.permission_map.manage`| Quản trị ánh xạ quyền | SYSTEM | Gán và cập nhật mã quyền cho hành động |

---

## 5. Danh mục Giao diện Quản trị (UI Architecture)

Module quản trị được xây dựng trên React 18, TypeScript strict, TanStack Query, Tailwind CSS và shadcn/ui:
1. **Module List & Details:** DataGrid phân trang, tìm kiếm mã/tên, lọc trạng thái, SideDrawer xem chi tiết kèm phân hệ phụ thuộc, Modal thêm/gỡ quan hệ phụ thuộc.
2. **Feature List & Details:** DataGrid hiển thị thông tin kỹ thuật (Route, API Endpoint), loại tính năng, phân loại dữ liệu, SideDrawer xem chi tiết kèm danh sách hành động và mã quyền GBAC.
3. **Feature Hierarchy Tree:** Giao diện cây thư mục mở rộng/thu gọn đa cấp, lọc nhanh theo phân hệ và tìm kiếm đệ quy, nút thêm tính năng con trực tiếp trên từng nhánh.
4. **Action / Permission Mapping Viewer:** Bản đồ ma trận toàn diện thể hiện dòng chảy `Module → Feature → Action → PermissionCode`, chỉ báo xác minh liên kết tới Identity Permission Catalog, nút sao chép mã quyền một chạm.
