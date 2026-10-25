# SHD OneERP — Enterprise Resource Planning System

> Nền tảng quản trị tổng thể doanh nghiệp đa công ty cho toàn bộ hệ sinh thái **SHD Corp**.

---

## 1. Tổng quan Kiến trúc Kỹ thuật
- **Backend**: .NET 10 (C# 13) / ASP.NET Core Web API
- **Kiến trúc**: Clean Architecture + Modular Monolith
- **Cơ sở dữ liệu**: Microsoft SQL Server
- **Write-side**: Entity Framework Core (Unit of Work, Mapping, Change Tracker, Concurrency rowversion)
- **Read-side**: SQL Server Stored Procedures (`sp_*`) qua `ISpExecutor` cho 100% API GET nghiệp vụ
- **Migrations**: SQL viết tay versioned (`database/migrations/`), idempotent, có bảng quản lý lịch sử `__DbMigrationHistory`
- **Frontend**: React 18, TypeScript strict, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide React
- **Phân quyền**: Direct GBAC v4.2 (`User` -> `UserGroupMember` -> `UserGroup` -> `UserGroupPermission` -> `Permission`) kết hợp phạm vi dữ liệu (`Global`, `LegalEntity`, `BusinessUnit`, `Branch`)
- **Kiểm thử**: xUnit, FluentAssertions, Moq

---

## 2. Cấu trúc Thư mục

```text
SHD-OneERP/
├── .cursor/rules/             # 8 quy chuẩn kỹ thuật độc lập cho SHD
├── backend/                   # Clean Architecture .NET Solution
│   ├── ShdOneErp.sln
│   ├── ShdOneErp.Domain/      # Entities, Enums, Value Objects, Domain Exceptions
│   ├── ShdOneErp.Application/ # DTOs, Handlers, Interfaces, FluentValidation
│   ├── ShdOneErp.Infrastructure/# EF Core DbContext, Stored Proc Executor, Auth
│   ├── ShdOneErp.Api/         # Controllers, Middlewares, Swagger, DI
│   └── ShdOneErp.Tests/       # Unit & Security Tests
├── frontend/                  # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── components/common/ # Reusable enterprise components
│   │   ├── features/          # Module slices: organization, identity, party360
│   │   ├── hooks/             # TanStack Query & custom hooks
│   │   ├── services/          # API client services
│   │   ├── stores/            # Zustand client state
│   │   └── types/             # Shared TypeScript interfaces
├── database/                  # Quản lý Database & Migrations
│   ├── migrations/            # Handwritten SQL migrations (Single source of truth)
│   ├── scripts/               # PowerShell migration runner
│   └── README.md
├── docs/                      # Bộ tài liệu kiến trúc & nghiệp vụ hoàn chỉnh (00-11)
├── docker-compose.yml         # Local SQL Server 2022
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Khởi chạy nhanh (Quick Start)

### 3.1. Khởi động SQL Server
```bash
docker-compose up -d
```

### 3.2. Chạy Database Migrations
Mở PowerShell tại thư mục gốc:
```powershell
./database/scripts/run-migrations.ps1 -Server "localhost" -Database "ShdOneErpDb" -User "sa" -Password "YourStrong@Passw0rd!"
```

### 3.3. Chạy Backend API
```bash
cd backend/ShdOneErp.Api
dotnet run
```
Truy cập Swagger tại: `http://localhost:5000/swagger`

### 3.4. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:5173`

---

## 4. Tài liệu tham khảo chi tiết
- [Tầm nhìn & Mục tiêu](docs/00_PROJECT_VISION.md)
- [Bối cảnh nghiệp vụ](docs/01_BUSINESS_CONTEXT.md)
- [Kiến trúc kỹ thuật](docs/02_ARCHITECTURE.md)
- [Mô hình dữ liệu](docs/04_DATA_MODEL.md)
- [Phân quyền Direct GBAC](docs/05_AUTHORIZATION.md)
- [Chuẩn API](docs/06_API_CONVENTIONS.md)
- [Tiêu chuẩn UI/UX](docs/07_UI_UX_STANDARDS.md)
- [Lộ trình & Backlog](docs/08_ROADMAP_BACKLOG.md)
- [Hướng dẫn cài đặt](docs/09_SETUP_AND_RUN.md)
- [Architectural Decision Records](docs/10_ADR.md)
- [Discovery Decisions & TBD](docs/11_DISCOVERY_DECISIONS.md)
