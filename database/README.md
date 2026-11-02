# SHD OneERP Database Migrations

## Quy chuẩn
1. Toàn bộ thay đổi cơ sở dữ liệu được quản lý bằng các tệp SQL viết tay trong thư mục `database/migrations/`.
2. Định dạng đặt tên: `YYYYMMDD_HHMM_PascalCaseDescription.sql`.
3. Bảng `__DbMigrationHistory` lưu vết các migration đã chạy thành công cùng mã checksum SHA256.
4. Runner cục bộ (`database/scripts/run-migrations.ps1`) tích hợp khóa phân tán độc quyền `sp_getapplock` chống chạy đồng thời nhiều tiến trình.
5. Nghiêm cấm sử dụng Entity Framework Core Migrations (`dotnet ef migrations add`, `dotnet ef database update`).

## Danh sách Migrations:
- `20261025_0001_InitialMigrationHistory.sql`: Tạo bảng quản lý lịch sử migration.
- `20261025_0002_IdentityAndAuthorizationSchema.sql`: Schema Direct GBAC v4.2 (Users, Groups, Permissions, Members).
- `20261025_0003_OrganizationSchema.sql`: Schema Đa pháp nhân (LegalEntities, BusinessUnits, Branches).
- `20261025_0004_Party360Schema.sql`: Schema Nền tảng Định danh Khách hàng chung (Party, Person, OrganizationParty, Roles, Contact).
- `20261025_0005_StoredProcedures_Organization.sql`: Stored Procedures cho Read-side (sp_Organization_LegalEntity_GetPaged, sp_Organization_LegalEntity_GetById).
- `20261025_0006_SeedFoundationData.sql`: Dữ liệu quyền cơ bản, nhóm ADMINISTRATORS hệ thống và seed dev cũ; không áp dụng migration này lên môi trường dùng chung/production.
- `20261026_0007_BusinessUnitManagementAndScopedReads.sql`: Stored Procedures cho Business Unit và lọc Legal Entity/Business Unit theo GBAC scope; cập nhật kiểm tra trạng thái user và membership.
- `20261026_0008_Party360StoredProcedures.sql`: Stored Procedures phục vụ Read-side và Scope filtering cho Party 360 (`sp_Party_GetPaged`, `sp_Party_GetById`).
- `20261026_0009_BranchManagementAndScopedReads.sql`: Stored Procedures cho Branch / Campus Management (`sp_Organization_Branch_GetPaged`, `sp_Organization_Branch_GetById`, `sp_Organization_Branch_GetLookup`) tích hợp Direct GBAC v4.2 Scope Filtering.
- `20261026_0010_EnterpriseFoundationPlatform.sql`: Schemas nền tảng Enterprise Foundation: Audit Logging (`Audit_SystemLogs`), Transactional Outbox (`System_OutboxMessages`), Module/Feature Registry, Common Master Data, Documents số hóa và Workflow State Machine.
- `20261026_0011_UserGroupAndAuditStoredProcedures.sql`: Stored Procedures cho FND-01 (Quản lý UserGroup, Members, Ma trận Permissions, User Effective Permissions) và FND-02 (Audit Log Viewer phân trang và tra cứu Before/After diff).

> **Lưu ý bảo mật:** Hệ thống đã bổ sung endpoint `POST /api/v1/auth/bootstrap` hỗ trợ khởi tạo quản trị viên đầu tiên bằng secret bảo mật từ biến môi trường (`BOOTSTRAP_SECRET`), loại bỏ phụ thuộc vào mật khẩu hardcode ở migration 0006 trên môi trường Production/Staging.
