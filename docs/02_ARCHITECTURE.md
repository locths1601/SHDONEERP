# 02 — KIẾN TRÚC KỸ THUẬT TỔNG THỂ

## 1. Clean Architecture + Modular Monolith
Hệ thống được tổ chức theo mô hình Modular Monolith kết hợp Clean Architecture, đảm bảo tính gắn kết nội bộ cao và giảm thiểu phụ thuộc lỏng lẻo giữa các module.

```
+--------------------------------------------------------------+
|                         Presentation                         |
|  - React 18 SPA (Vite + Tailwind + TanStack Query + Zustand) |
|  - ASP.NET Core Web API 10 (Controllers, Filters, OpenAPI)   |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                       Application Layer                      |
|  - Commands & Queries (CQRS light)                           |
|  - DTOs, Mappings & FluentValidation                         |
|  - Interfaces (ISpExecutor, IUnitOfWork, ICurrentUser)       |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                         Domain Layer                         |
|  - Entities, Value Objects, Domain Exceptions                |
|  - Domain Rules & Invariants (Pure C#, Zero Dependencies)    |
+--------------------------------------------------------------+
                               ^
                               |
+--------------------------------------------------------------+
|                     Infrastructure Layer                     |
|  - Write-side: Entity Framework Core DbContext               |
|  - Read-side: ISpExecutor (Direct SQL Stored Procedures)     |
|  - Auth: JWT Handler, Permission Resolver, Password Hasher   |
|  - Migration Engine: Handwritten SQL Versioned Runner        |
+--------------------------------------------------------------+
```

## 2. Đường dẫn dữ liệu (Data Access Pathways)
- **Đường Ghi (Write-path / Commands)**:
  `API Controller` -> `Application Service / Handler` -> `EF Core DbContext` -> `SQL Server Tables` (Có kiểm soát transaction, concurrency token `rowversion`, audit log).
- **Đường Đọc (Read-path / Queries)**:
  `API Controller` -> `Application Service / Handler` -> `ISpExecutor` -> `Stored Procedure (sp_*)` -> `DTOs` (Tối ưu index, không qua EF change tracker, có pagination, sorting và total count).

## 3. Quản lý Đa thực thể & Phạm vi Dữ liệu (Multi-tenancy / Data Scoping)
- Mỗi bản ghi dữ liệu nghiệp vụ gắn liền với `LegalEntityId` và/hoặc `BusinessUnitId`.
- Tất cả Stored Procedure đọc dữ liệu và DbContext SaveChanges đều tích hợp bộ lọc phạm vi quyền hạn của người dùng đang đăng nhập (`CurrentUserId`, `CurrentScopeLegalEntities`).
