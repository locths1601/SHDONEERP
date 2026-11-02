# YÊU CẦU TÍCH HỢP HỆ THỐNG: FND-04 — MODULE & FEATURE REGISTRY

**Dành cho:** Tech Lead, Principal Solution Architect, và các AI Agent đồng thời (Agent 01 - Workflow & Event Foundation, Identity Agent, Organization Agent).

---

## 1. Tổng quan Tích hợp & Nguyên tắc An toàn (Safety Guarantees)

Phân hệ **FND-04: Module & Feature Registry** đã được xây dựng hoàn chỉnh theo kiến trúc Clean Architecture (.NET 10, Modular Monolith) và React 18 (TypeScript Strict, TanStack Query, shadcn/ui).

### 1.1. Cam kết Độc lập & Không Xung đột (Collaboration Rule F)
- **Không can thiệp vào các phân hệ khác:** Không chỉnh sửa Workflow, Outbox, Domain Events, GroupUser, hoặc Audit Log files.
- **Không tự áp dụng migration lên live DB:** File migration được viết thủ công bằng T-SQL thuần túy tại `database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql`, an toàn để chạy độc lập hoặc tuần tự sau khi các Agent đồng thuận.
- **Tách biệt Service Registration:** Toàn bộ DI services được gom vào extension method độc lập: `ShdOneErp.Infrastructure.Extensions.ModuleRegistryServiceCollectionExtensions`.
- **Bảo toàn cơ chế phân quyền (GBAC):** Phân hệ không tạo Permission Engine mới, không tự cấp quyền runtime cho user, mà chỉ đóng vai trò **Danh mục Metadata nghiệp vụ tập trung** liên kết trực tiếp `Module → Feature → Action → PermissionCode` tới `Identity_Permissions`.

---

## 2. Đăng ký Dependency Injection (Backend)

### 2.1. Tích hợp vào `Program.cs` hoặc `DependencyInjection.cs`

Thêm dòng lệnh sau vào pipeline cấu hình Service Collection:

```csharp
using ShdOneErp.Infrastructure.Extensions;

// Đăng ký Module & Feature Registry (Write Services, CQRS Stored Procedure Read Services, Validators)
builder.Services.AddModuleRegistryServices();
```

### 2.2. Chi tiết các Services được đăng ký trong Extension

| Interface | Implementation | Vòng đời (Lifetime) | Mục đích |
| :--- | :--- | :--- | :--- |
| `IModuleRegistryWriteService` | `ModuleRegistryWriteService` | `Scoped` | Điều phối nghiệp vụ tạo, cập nhật, xóa Module và quản lý quan hệ phụ thuộc |
| `IFeatureRegistryWriteService` | `FeatureRegistryWriteService` | `Scoped` | Điều phối tạo, sửa, xóa Feature và ánh xạ Action/Permission |
| `IModuleRegistryReadService` | `ModuleRegistryReadService` | `Scoped` | Truy vấn CQRS đọc Module qua Stored Procedures (`sp_System_Module_*`) |
| `IFeatureRegistryReadService` | `FeatureRegistryReadService` | `Scoped` | Truy vấn CQRS đọc Feature qua Stored Procedures (`sp_System_Feature_*`, `sp_System_PermissionMapping_*`) |

### 2.3. Cấu hình DbContext (`ShdOneErpDbContext.cs`)

Đảm bảo `IShdOneErpDbContext` và `ShdOneErpDbContext` phơi bày các `DbSet` sau:

```csharp
public DbSet<SystemModule> SystemModules => Set<SystemModule>();
public DbSet<SystemModuleDependency> SystemModuleDependencies => Set<SystemModuleDependency>();
public DbSet<SystemFeature> SystemFeatures => Set<SystemFeature>();
public DbSet<SystemFeatureActionPermission> SystemFeatureActionPermissions => Set<SystemFeatureActionPermission>();
```

Và trong `OnModelCreating`, áp dụng các cấu hình Entity Framework:

```csharp
modelBuilder.ApplyConfiguration(new SystemModuleConfiguration());
modelBuilder.ApplyConfiguration(new SystemModuleDependencyConfiguration());
modelBuilder.ApplyConfiguration(new SystemFeatureConfiguration());
modelBuilder.ApplyConfiguration(new SystemFeatureActionPermissionConfiguration());
```

*(Lưu ý: Các cấu hình trên đã được cấu hình sẵn trong `PlatformConfigurations.cs` và `ShdOneErpDbContext.cs`).*

---

## 3. Database Migration & Stored Procedures

Tệp migration: `database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql`.

### 3.1. Cấu trúc Bảng
1. `System_Modules`: Quản lý phân hệ, cha-con (`ParentModuleId`), phiên bản (`Version`), thứ tự (`DisplayOrder`), biểu tượng (`Icon`), trạng thái (`Status`), ngày hiệu lực (`EffectiveFromUtc`, `EffectiveToUtc`).
2. `System_ModuleDependencies`: Quản lý quan hệ phụ thuộc giữa các phân hệ (`DependsOnModuleId`, `DependencyType`: Required / Optional / Extension, `MinVersion`).
3. `System_Features`: Quản lý tính năng nghiệp vụ theo module (`ModuleId`, `FeatureType`: Screen / Api / BusinessProcess / Report / Component / Service, `ParentFeatureId`, `RoutePath`, `ApiEndpoint`, `ComponentKey`, `SupportedActions`, `DataClassification`, `OwnerTeam`).
4. `System_FeatureActionPermissions`: Bảng nối trực tiếp `Module → Feature → Action → PermissionCode`, liên kết mềm tới `Identity_Permissions` (`PermissionId`).

### 3.2. Stored Procedures Tối ưu hóa CQRS Read-Side
- `sp_System_Module_GetPaged`: Phân trang, tìm kiếm mã/tên, lọc trạng thái, đếm số feature và số dependency đi kèm.
- `sp_System_Module_GetById`: Đọc chi tiết phân hệ kèm danh sách dependencies và child modules.
- `sp_System_Module_GetHierarchy`: Xuất toàn bộ cây phân cấp phân hệ cha-con.
- `sp_System_Feature_GetPaged`: Phân trang, tìm kiếm mã/tên, lọc theo phân hệ, loại tính năng, trạng thái.
- `sp_System_Feature_GetById`: Đọc chi tiết tính năng kèm toàn bộ actions và mã quyền GBAC ánh xạ.
- `sp_System_Feature_GetHierarchy`: Xuất cây phân cấp tính năng lồng nhau đa cấp.
- `sp_System_PermissionMapping_GetAll`: Ma trận ánh xạ toàn diện phân hệ - tính năng - hành động - mã quyền, tự động kiểm tra sự tồn tại trong `Identity_Permissions`.

### 3.3. Dữ liệu Seed chuẩn hóa
Đã seed đầy đủ các module nền tảng được phê duyệt:
- `IDENTITY`: Phân hệ Định danh & Quản trị Truy cập (GBAC)
- `ORGANIZATION`: Phân hệ Quản trị Cơ cấu Tổ chức Đa Pháp nhân & Campus
- `PARTY360`: Phân hệ Hồ sơ Chủ thể & Danh tính Tập trung
- `SYSTEM`: Phân hệ Quản trị Metadata Nền tảng (Module & Feature Registry)
- `AUDIT`: Phân hệ Nhật ký Kiểm toán & Giám sát Hệ thống
- `DOCUMENTS`: Phân hệ Quản trị Hồ sơ & Chứng từ Số
- `MASTERDATA`: Phân hệ Quản trị Danh mục Tham chiếu Chung
- `WORKFLOW`: Phân hệ Quản trị Quy trình & Máy trạng thái

---

## 4. Danh mục API Endpoints & Phân quyền GBAC

Tất cả các API được bảo vệ bằng Policy Dynamic GBAC (`[Authorize(Policy = "Permission:...")]`):

### 4.1. Module Registry APIs (`/api/v1/system/modules`)
- `GET /api/v1/system/modules`: Lấy danh sách phân trang (`Permission:system.module.view`).
- `GET /api/v1/system/modules/hierarchy`: Lấy cây phân hệ (`Permission:system.module.view`).
- `GET /api/v1/system/modules/{id}`: Chi tiết phân hệ (`Permission:system.module.view`).
- `POST /api/v1/system/modules`: Tạo mới phân hệ (`Permission:system.module.manage`).
- `PUT /api/v1/system/modules/{id}`: Cập nhật phân hệ (`Permission:system.module.manage`).
- `DELETE /api/v1/system/modules/{id}`: Xóa phân hệ (`Permission:system.module.manage`).
- `POST /api/v1/system/modules/{moduleId}/dependencies`: Thêm quan hệ phụ thuộc (`Permission:system.module.manage`).
- `DELETE /api/v1/system/modules/dependencies/{dependencyId}`: Gỡ quan hệ phụ thuộc (`Permission:system.module.manage`).

### 4.2. Feature Registry APIs (`/api/v1/system/features`)
- `GET /api/v1/system/features`: Lấy danh sách phân trang (`Permission:system.feature.view`).
- `GET /api/v1/system/features/hierarchy`: Lấy cây tính năng (`Permission:system.feature.view`).
- `GET /api/v1/system/features/{id}`: Chi tiết tính năng (`Permission:system.feature.view`).
- `POST /api/v1/system/features`: Tạo mới tính năng (`Permission:system.feature.manage`).
- `PUT /api/v1/system/features/{id}`: Cập nhật tính năng (`Permission:system.feature.manage`).
- `DELETE /api/v1/system/features/{id}`: Xóa tính năng (`Permission:system.feature.manage`).
- `POST /api/v1/system/features/{featureId}/actions`: Thêm hành động & mã quyền (`Permission:system.feature.manage`).
- `PUT /api/v1/system/features/actions/{actionMappingId}`: Sửa hành động & mã quyền (`Permission:system.feature.manage`).
- `DELETE /api/v1/system/features/actions/{actionMappingId}`: Xóa hành động & mã quyền (`Permission:system.feature.manage`).

### 4.3. Action/Permission Mapping APIs (`/api/v1/system/permission-mapping`)
- `GET /api/v1/system/permission-mapping`: Xem toàn bộ bản đồ ánh xạ quyền (`Permission:system.permission_map.view`).

---

## 5. Tích hợp Giao diện Quản trị (Frontend UI)

### 5.1. Cấu trúc Module Frontend (`frontend/src/features/moduleRegistry/`)
```
frontend/src/features/moduleRegistry/
├── types/
│   └── moduleRegistry.ts          # Type definitions chặt chẽ
├── services/
│   └── moduleRegistryService.ts   # Axios API client gọi backend thật
├── hooks/
│   └── useModuleRegistry.ts       # TanStack Query Hooks (Cache & Invalidation)
├── components/
│   ├── ModuleList.tsx             # Danh sách phân hệ & bộ lọc
│   ├── ModuleDetailDrawer.tsx     # Drawer xem chi tiết phân hệ & dependencies
│   ├── ModuleFormDrawer.tsx       # Drawer tạo/sửa phân hệ
│   ├── ModuleDependencyModal.tsx  # Modal quản lý module dependencies
│   ├── FeatureList.tsx            # DataGrid danh sách tính năng
│   ├── FeatureDetailDrawer.tsx    # Drawer xem chi tiết tính năng & bảng actions
│   ├── FeatureFormDrawer.tsx      # Drawer tạo/sửa tính năng
│   ├── ActionMappingDrawer.tsx    # Drawer gán hành động và mã quyền
│   ├── FeatureHierarchyTree.tsx   # Cây phân cấp tính năng trực quan
│   └── ActionPermissionMappingViewer.tsx # Bản đồ ma trận Module → Feature → Action → PermissionCode
└── index.ts
```

### 5.2. Đường dẫn Routes trong `App.tsx`
- `/admin/registry`: Trang trung tâm gồm 4 tabs (Modules, Features, Hierarchy, Mappings).
- `/admin/modules`: Tab danh mục phân hệ.
- `/admin/features`: Tab danh mục tính năng.
- `/admin/permission-mapping`: Tab bản đồ ánh xạ quyền.

### 5.3. Điều hướng Sidebar trong `Sidebar.tsx`
Đã tích hợp 2 mục menu vào khối **Nền tảng Quản trị & Bảo mật**:
1. **Danh mục Phân hệ & Tính năng** (`/admin/registry`) — Bảo vệ bằng quyền `system.module.view`.
2. **Bản đồ Ánh xạ Quyền** (`/admin/permission-mapping`) — Bảo vệ bằng quyền `system.permission_map.view`.

---

## 6. Kết quả Kiểm thử & Đảm bảo Chất lượng

- **Backend Unit & Domain Tests:** 135/135 tests PASSED (0 failed).
- **TypeScript Strict Build:** `npm run build` PASSED (0 errors, 1621 modules transformed).
- **Code Coverage FND-04:**
  - `ModuleRegistryDomainTests.cs`: Kiểm tra tính toàn vẹn entity, mã phân hệ, validation domain.
  - `ModuleRegistryValidationTests.cs`: Kiểm tra validation FluentValidation cho Create/Update requests.
  - `FeatureRegistryValidationTests.cs`: Kiểm tra validation định dạng FeatureCode, SupportedActions, RoutePath.
  - `ModuleRegistryServiceTests.cs`: Kiểm tra nghiệp vụ trùng mã, quan hệ phụ thuộc trùng lặp, chu kỳ phụ thuộc.
  - `FeatureRegistryServiceTests.cs`: Kiểm tra tạo tính năng, tự động tra cứu mã quyền trong catalog, phân cấp cha-con.
