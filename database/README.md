# SHD OneERP Database Migrations

## Quy chuẩn
1. Toàn bộ thay đổi cơ sở dữ liệu được quản lý bằng các tệp SQL viết tay trong thư mục `database/migrations/`.
2. Định dạng đặt tên: `YYYYMMDD_HHMM_PascalCaseDescription.sql`.
3. Bảng `__DbMigrationHistory` lưu vết các migration đã chạy thành công cùng mã checksum SHA256.
4. Nghiêm cấm sử dụng Entity Framework Core Migrations (`dotnet ef migrations add`, `dotnet ef database update`).

## Danh sách Migrations:
- `20261025_0001_InitialMigrationHistory.sql`: Tạo bảng quản lý lịch sử migration.
- `20261025_0002_IdentityAndAuthorizationSchema.sql`: Schema Direct GBAC v4.2 (Users, Groups, Permissions, Members).
- `20261025_0003_OrganizationSchema.sql`: Schema Đa pháp nhân (LegalEntities, BusinessUnits, Branches).
- `20261025_0004_Party360Schema.sql`: Schema Nền tảng Định danh Khách hàng chung (Party, Person, OrganizationParty, Roles, Contact).
- `20261025_0005_StoredProcedures_Organization.sql`: Stored Procedures cho Read-side (sp_Organization_LegalEntity_GetPaged, sp_Organization_LegalEntity_GetById).
- `20261025_0006_SeedFoundationData.sql`: Dữ liệu quyền cơ bản, nhóm ADMINISTRATORS hệ thống và tài khoản Admin dev.
