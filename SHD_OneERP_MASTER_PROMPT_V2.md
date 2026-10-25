# SHD OneERP — MASTER SPECIFICATION & BOOTSTRAP PROMPT V2

> Chuẩn kiến trúc, nghiệp vụ và kỹ thuật cho hệ thống SHD OneERP — Quản trị tập trung hệ sinh thái SHD Corp.

## 1. NGUYÊN TẮC CỐT LÕI
- **Backend**: .NET 10 (C# 13), ASP.NET Core Web API, Clean Architecture, Modular Monolith.
- **Database**: Microsoft SQL Server.
- **Write-side Persistence**: Entity Framework Core (Mapping, Change Tracker, Unit of Work).
- **Read-side Persistence**: Raw SQL / Stored Procedures parameterized via `ISpExecutor` cho mọi Business GET API (List, Detail, Search, Dashboard). Cấm EF Core LINQ cho business query.
- **Migrations**: SQL viết tay, versioned (`YYYYMMDD_HHMM_PascalCaseName.sql`), idempotent, migration runner tự động ghi lịch sử `__DbMigrationHistory`. Cấm `dotnet ef migrations`.
- **Frontend**: React 18 + TypeScript (strict) + Vite + Tailwind CSS + Lucide React + Zustand + TanStack Query.
- **Security & Authorization**: Direct GBAC v4.2 (`User` -> `UserGroupMember` -> `UserGroup` -> `UserGroupPermission` -> `Permission`) kết hợp Scope (`Global`, `LegalEntity`, `BusinessUnit`, `Branch`). Mặc định Deny-by-default.
- **Tên miền & Namespace**: `ShdOneErp.*`.
- **Đơn vị chưa xác nhận**: Đánh dấu `TBD`.

## 2. MODULE BOUNDARIES
1. `Foundation`: Auditing, Lookups, System Configs, Stored Procedure Executor.
2. `IdentityAccess`: User, UserGroup, Permission, GroupPermission, UserGroupMember, Authentication, JWT Token, Permission Resolver.
3. `Organization`: LegalEntity, BusinessUnit, Branch, Department, Entity Relationships.
4. `Party360`: Party, Person, OrganizationParty, PartyRole, PartyContactMethod, PartyIdentifier.
5. `CRM`: Lead, Source, Opportunity, Student Counseling (Future).
6. `Commercial`: Product/Service Catalog, Contract, Billing, Engagements (Future).
7. `Education`: Courses, Batches/Classes, Attendance, Evaluations (Future).
8. `AdmissionVisa`: Admissions, Visa Applications, Checklists (Future).
9. `Finance`: Receivables, Invoicing, Receipts, Intercompany Settlements (Future).

## 3. QUY TRÌNH PHÁT TRIỂN VERTICAL SLICE
Mỗi tính năng phải bao gồm:
1. Domain Entities & Domain Rules
2. DTOs (Request / Response) & FluentValidation
3. Application Interfaces & Command/Query Handlers
4. Infrastructure EF Mapping (Write) + Stored Procedure & Script (Read)
5. Hand-written SQL Migration
6. Authorized API Controller with Scope & Audit enforcement
7. UI components & Hooks with proper State (Loading, Error, Empty, Data, Forbidden 403, Conflict 409)
8. Unit Tests / Integration Tests
