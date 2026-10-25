# 09 — HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY (SETUP & RUN)

## 1. Yêu cầu môi trường (Prerequisites)
- **.NET SDK**: Phiên bản 10.0 (hoặc .NET 8/9 LTS tương thích).
- **Node.js**: Phiên bản 18 LTS hoặc 20 LTS.
- **Package Manager**: npm hoặc pnpm.
- **Database**: Microsoft SQL Server 2019/2022 hoặc Azure SQL Database (hoặc chạy qua Docker).

## 2. Khởi động Cơ sở dữ liệu qua Docker (Tùy chọn)
Nếu chưa có sẵn SQL Server cục bộ, có thể khởi động nhanh bằng Docker Compose:
```bash
docker-compose up -d
```
Cơ sở dữ liệu sẽ chạy tại cổng `1433`, mật khẩu `sa`: `YourStrong@Passw0rd!`.

## 3. Chạy Migration SQL viết tay (Database Setup)
Các file migration nằm trong thư mục `database/migrations/`:
1. `20261025_0001_InitialMigrationHistory.sql`
2. `20261025_0002_IdentityAndAuthorizationSchema.sql`
3. `20261025_0003_OrganizationSchema.sql`
4. `20261025_0004_Party360Schema.sql`
5. `20261025_0005_StoredProcedures_Organization.sql`
6. `20261025_0006_SeedFoundationData.sql`

Có thể chạy script bằng:
- Sử dụng Migration Runner tích hợp trong `database/scripts/run-migrations.ps1`
- Hoặc mở SSMS / Azure Data Studio và thực thi tuần tự các file trên vào database `ShdOneErpDb`.

## 4. Khởi chạy Backend API (.NET)
```bash
cd backend/ShdOneErp.Api
dotnet restore
dotnet run
```
API sẽ lắng nghe tại:
- HTTP: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Health check: `http://localhost:5000/health`

## 5. Khởi chạy Frontend React (Vite)
```bash
cd frontend
npm install
npm run dev
```
Giao diện người dùng sẽ chạy tại: `http://localhost:5173`.
Tài khoản quản trị mặc định ban đầu (sau khi chạy seed):
- Tên đăng nhập / Email: `admin@shdcorp.vn`
- Mật khẩu: `ChangeMeOnFirstLogin@2026!` (Yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên).
