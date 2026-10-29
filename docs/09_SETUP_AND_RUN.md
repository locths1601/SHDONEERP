# 09 — HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY (SETUP & RUN)

## 1. Yêu cầu môi trường (Prerequisites)
- **.NET SDK**: Phiên bản 10.0 (hoặc .NET 8/9 LTS tương thích).
- **Node.js**: Phiên bản 18+ (Đã xác minh tương thích Node v24 LTS).
- **Package Manager**: npm hoặc pnpm (npm 11+).
- **Database**: Microsoft SQL Server 2019/2022 hoặc Azure SQL Database (hoặc chạy qua Docker).

## 2. Khởi động Cơ sở dữ liệu qua Docker (Tùy chọn)
Nếu chưa có sẵn SQL Server cục bộ, có thể khởi động nhanh bằng Docker Compose:
```bash
docker-compose up -d
```
Cơ sở dữ liệu sẽ chạy tại cổng `1433`. Chỉ dùng thông tin đăng nhập được cấu hình riêng cho môi trường phát triển cục bộ; không dùng cấu hình mẫu này cho môi trường dùng chung.

## 3. Chạy Migration SQL viết tay (Database Setup)
Các file migration nằm trong thư mục `database/migrations/`:
1. `20261025_0001_InitialMigrationHistory.sql`
2. `20261025_0002_IdentityAndAuthorizationSchema.sql`
3. `20261025_0003_OrganizationSchema.sql`
4. `20261025_0004_Party360Schema.sql`
5. `20261025_0005_StoredProcedures_Organization.sql`
6. `20261025_0006_SeedFoundationData.sql`
7. `20261026_0007_BusinessUnitManagementAndScopedReads.sql`
8. `20261026_0008_Party360StoredProcedures.sql`

Thực thi migrations:
- Sử dụng Migration Runner tích hợp trong `database/scripts/run-migrations.ps1` (đã tích hợp khóa phân tán độc quyền `sp_getapplock` chống xung đột runner đồng thời).
- Hoặc mở SSMS / Azure Data Studio và thực thi tuần tự các file trên vào database `ShdOneErpDb`.

## 4. Khởi tạo Quản trị viên an toàn (Secure Bootstrap)
Khi triển khai lần đầu, gọi endpoint bootstrap để tạo tài khoản Quản trị viên tối cao với mật khẩu phức tạp:
```http
POST /api/v1/auth/bootstrap
Content-Type: application/json

{
  "adminUsername": "admin_shd",
  "adminEmail": "admin@shdcorp.vn",
  "fullName": "Quản Trị Viên Tập Đoàn SHD",
  "password": "YourStrongPassword@2026!",
  "bootstrapSecret": "SHD_OneERP_Super_Secret_Key_At_Least_32_Chars_2026!"
}
```
Tài khoản tạo mới sẽ tự động được gán nhóm `ADMINISTRATORS` và kích hoạt cờ `MustChangePassword = true`.

## 5. Khởi chạy Backend API (.NET)
```bash
cd backend/ShdOneErp.Api
dotnet restore
dotnet run
```
API sẽ lắng nghe tại:
- HTTP: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Health check: `http://localhost:5000/health`

## 6. Khởi chạy Frontend React (Vite)
```bash
cd frontend
npm install
npm run dev
```
Giao diện người dùng sẽ chạy tại: `http://localhost:5173`.
Lệnh kiểm tra build sản phẩm:
```bash
npm run build
```
