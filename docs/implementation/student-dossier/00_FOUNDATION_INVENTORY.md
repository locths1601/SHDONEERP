# SHD OneERP — 00. FOUNDATION ARCHITECTURE & CONTRACT INVENTORY
## SA-00 Architecture Inventory & API Contract Auditor Report

**Ngày khảo sát:** 2026-10-29  
**Người thực hiện:** SA-00 / Master Orchestrator  
**Phạm vi:** Kiểm tra thực tế toàn bộ source code, database migrations, DI, Stored Procedures và UI components của SHD OneERP.

---

### 1. TỔNG QUAN HIỆN TRẠNG KỸ THUẬT (STACK REALITY)

| Thành phần | Hiện trạng trong Codebase | Đánh giá |
|---|---|---|
| **Backend Framework** | .NET 10 (`net10.0`), ASP.NET Core Web API, C# 12/13. | `EXISTS_VERIFIED` |
| **Kiến trúc** | Clean Architecture + Modular Monolith (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`). | `EXISTS_VERIFIED` |
| **Command / Write Side** | Entity Framework Core 8.0 với SQL Server Provider, Audit Interceptor tự động. | `EXISTS_VERIFIED` |
| **Query / Read Side** | Dapper + `ISpExecutor` (`SpExecutor.cs`), gọi Stored Procedures trả về paged list và detail. | `EXISTS_VERIFIED` |
| **Database Migrations** | SQL scripts viết tay trong `database/migrations/`, runner `database/scripts/run-migrations.ps1` có `sp_getapplock` và `__DbMigrationHistory`. | `EXISTS_VERIFIED` |
| **Frontend Framework** | React 18.2, TypeScript strict, Vite 5.1. | `EXISTS_VERIFIED` |
| **Frontend State & UI** | Tailwind CSS, Lucide React, TanStack Query 5, Zustand 4.5. | `EXISTS_VERIFIED` |
| **Common UI Components** | Đã có sẵn tại `frontend/src/components/common/`: `Button`, `Card`, `DataGrid`, `EmptyState`, `ErrorBoundary`, `ListToolbar`, `Modal`, `PageContainer`, `Skeleton`, `AuthGuards` (`Can`, `RequireAuth`). | `EXISTS_VERIFIED` |

---

### 2. HIỆN TRẠNG PHÂN HỆ PARTY 360 (STU-01 FOUNDATION)

#### 2.1. Thực thể dữ liệu & Bảng cơ sở dữ liệu
- Bảng DB đã tạo qua migration `20261025_0004_Party360Schema.sql`:
  - `Party_Parties` (Id, PartyType, Code, Status, IsDeleted, CreatedAtUtc, RowVersion)
  - `Party_Persons` (PartyId PK/FK, FirstName, LastName, DateOfBirth, Gender, Nationality)
  - `Party_OrganizationParties` (PartyId PK/FK, CompanyName, TradingName, TaxId, RegistrationNumber)
  - `Party_PartyRoles` (Id, PartyId, RoleType, LegalEntityId, IsActive, CreatedAtUtc)
  - `Party_PartyContactMethods` (Id, PartyId, ContactType, Value, IsPrimary, CreatedAtUtc)
  - `Party_PartyIdentifications` (Id, PartyId, IdentificationType, IdentificationNumber, IssueDate, ExpiryDate, IssuingAuthority)
- Đăng ký EF Core trong `ShdOneErpDbContext.cs`: Đã đăng ký đầy đủ 6 DbSets và Configurations.

#### 2.2. Điểm thiếu hụt (Gaps) cần bổ sung trong Party 360
1. **Domain Entity `Party.cs`**:
   - Có `ICollection<PartyIdentification> Identifications`, nhưng **chưa có phương thức nghiệp vụ** `AddIdentification(...)` hoặc `UpdateIdentification(...)`.
2. **Read Service & Stored Procedure**:
   - `sp_Party_GetById` (`20261026_0008_Party360StoredProcedures.sql`) chỉ trả về Set 1 (Party/Person/Org), Set 2 (Roles), Set 3 (ContactMethods). **Chưa trả về Set 4 (Identifications)**.
   - Chưa có Stored Procedure riêng cho Học viên: `sp_Party_Student_GetPagedList` hỗ trợ lọc theo vai trò `RoleType = 'Student'`, lọc theo LegalEntityId, tìm kiếm và **che giấu thông tin định danh (PII Masking)** cho người dùng không có quyền quản trị cao cấp.
3. **Application Write Service (`PartyWriteService.cs`)**:
   - Chưa có phương thức `AddIdentificationAsync(...)`.
4. **Quan hệ Người giám hộ / Phụ huynh (`PartyRelationship`)**:
   - Bảng `Party_PartyRelationships` chưa có trong schema database. Cần tạo migration và domain model để lưu mối quan hệ `Student -> Parent/Guardian`.

---

### 3. HIỆN TRẠNG PHÂN HỆ ADMISSION & VISA (ADM-01 FOUNDATION)

#### 3.1. Thực tế trong Codebase
- **Chưa tồn tại bất kỳ bảng hay mã nguồn nào** thuộc phân hệ `AdmissionVisa`.
- Tài liệu định nghĩa domain `AdmissionVisa` nằm ở `docs/03_DOMAIN_MAP.md` và `docs/15_MODULE_ARCHITECTURE_AND_DEPENDENCY_MAP.md`.
- Yêu cầu kiến trúc:
  - Domain Owner: `AdmissionVisa`.
  - Phải liên kết tới `StudentPartyId` thông qua ID/contract, không gộp thông tin cá nhân vào hồ sơ tuyển sinh.
  - Một học viên (`PartyId`) có thể mở **nhiều hồ sơ du học** (`StudentApplication`) theo từng kỳ tuyển sinh, thị trường hoặc chương trình.
  - Không được ghi trực tiếp vào `DbSet<Party>` từ Application Service của `AdmissionVisa`.

#### 3.2. Thành phần cần xây dựng mới cho ADM-01
1. **Schema & Migration SQL**:
   - Migration `20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql`.
   - Bảng `Adm_StudentApplications`:
     - `Id` (UNIQUEIDENTIFIER, PK)
     - `ApplicationCode` (NVARCHAR(50), UNIQUE)
     - `StudentPartyId` (UNIQUEIDENTIFIER, FK -> `Party_Parties(Id)`)
     - `LegalEntityId` (UNIQUEIDENTIFIER, FK -> `Org_LegalEntities(Id)`)
     - `BusinessUnitId` (UNIQUEIDENTIFIER, NULL)
     - `BranchId` (UNIQUEIDENTIFIER, NULL)
     - `TargetMarket` (NVARCHAR(50), e.g. 'Korea', 'Japan', 'Germany', 'Australia')
     - `IntakeTerm` (NVARCHAR(50), e.g. '2027-Spring', '2026-Fall')
     - `ProgramName` (NVARCHAR(200))
     - `Status` (NVARCHAR(30) - 'Draft', 'Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn')
     - `AssignedUserId` (UNIQUEIDENTIFIER, NULL)
     - `Notes` (NVARCHAR(1000), NULL)
     - `IsDeleted` (BIT, Default 0)
     - `CreatedAtUtc`, `UpdatedAtUtc`, `RowVersion`
   - Bảng `Adm_ChecklistItems`:
     - `Id` (UNIQUEIDENTIFIER, PK)
     - `StudentApplicationId` (UNIQUEIDENTIFIER, FK -> `Adm_StudentApplications(Id)`)
     - `ItemCode` (NVARCHAR(50))
     - `ItemName` (NVARCHAR(200))
     - `Category` (NVARCHAR(50))
     - `IsRequired` (BIT, Default 1)
     - `Status` (NVARCHAR(30) - 'Pending', 'Uploaded', 'Verified', 'Rejected')
     - `Notes` (NVARCHAR(500), NULL)
     - `VerifiedByUserId` (UNIQUEIDENTIFIER, NULL)
     - `VerifiedAtUtc` (DATETIME2(7), NULL)
     - `RowVersion`
   - Bảng `Adm_ApplicationDocumentLinks`:
     - `Id` (UNIQUEIDENTIFIER, PK)
     - `ChecklistItemId` (UNIQUEIDENTIFIER, FK -> `Adm_ChecklistItems(Id)`)
     - `DocumentId` (UNIQUEIDENTIFIER, FK -> `Doc_Documents(Id)`)
     - `LinkedByUserId` (UNIQUEIDENTIFIER)
     - `LinkedAtUtc` (DATETIME2(7))

---

### 4. HIỆN TRẠNG FOUNDATION DOCUMENTS & STORAGE

- Bảng `Doc_Documents` đã tồn tại trong database (`20261026_0010_EnterpriseFoundationPlatform.sql`) và domain entity `Document.cs` đã có trong `ShdOneErp.Domain.Entities.System`.
- Interface `IDocumentStorageService` đã được định nghĩa tại `ShdOneErp.Application.Common.Interfaces.IPlatformServices.cs`:
  - `StoreDocumentAsync(Stream fileStream, string fileName, string contentType, DataClassification classification, Guid legalEntityId, Guid ownerUserId, CancellationToken cancellationToken)`
  - `GetDocumentStreamAsync(Guid documentId, Guid requesterUserId, CancellationToken cancellationToken)`
- **Hiện trạng triển khai:** `IDocumentStorageService` **chưa có class hiện thực (implementation class)** trong `Infrastructure`.
- **Giải pháp theo chỉ thị SA-03/Master:** Xây dựng `LocalFileSystemDocumentStorageService` trong `ShdOneErp.Infrastructure/Services/DocumentStorage/`:
  - Lưu file trên thư mục cục bộ bảo mật (`storage/documents/`).
  - Tự động tính SHA256 checksum chống giả mạo.
  - Chống lỗ hổng Path Traversal (`Path.GetFileName`, whitelist extension).
  - Kiểm tra quyền và phân loại dữ liệu (`DataClassification`) khi tải xuống, trả về Stream bảo vệ, không công khai static URL.

---

### 5. HIỆN TRẠNG WORKFLOW ENGINE (FND-03)

- Bảng `Wf_Definitions`, `Wf_Instances`, `Wf_History` đã được tạo trong `20261026_0010`.
- Các services `WorkflowEngine.cs`, `WorkflowExecutionService.cs` đã có trong `ShdOneErp.Application/Modules/Workflow/`.
- Phù hợp để gắn State Machine cho `StudentApplication` khi có BRD quy trình visa được PO phê duyệt chính thức.
- **Quyết định cho vòng này:** Hỗ trợ trạng thái hồ sơ chuẩn ('Draft', 'Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn') với State Transition an toàn, không seed quy trình giả định chưa được PO duyệt.

---

### 6. BẢNG TỔNG KẾT KHẢO SÁT THEO 3 TRẠNG THÁI

| Thành phần | Trạng thái | Bằng chứng mã nguồn / DB | Ghi chú |
|---|---|---|---|
| `Party`, `Person`, `PartyRole`, `ContactMethod` | `EXISTS_VERIFIED` | `20261025_0004`, `PartyEntities.cs`, `PartyWriteService.cs` | Tái sử dụng nguyên vẹn. |
| `PartyIdentification` | `EXISTS_VERIFIED` | `20261025_0004`, `PartyEntities.cs` | Cần mở rộng domain method & SP detail. |
| `PartyRelationship` (Người giám hộ) | `MISSING` | Chưa có trong schema DB | Bổ sung migration & model quan hệ. |
| `sp_Party_Student_GetPagedList` | `MISSING` | Chưa có trong DB | Bổ sung SP với PII masking & Scope filter. |
| `Adm_StudentApplications` | `MISSING` | Chưa có trong codebase | Tạo mới trong domain `AdmissionVisa`. |
| `Adm_ChecklistItems`, `Adm_DocLinks` | `MISSING` | Chưa có trong codebase | Tạo mới trong domain `AdmissionVisa`. |
| `Doc_Documents` metadata entity | `EXISTS_VERIFIED` | `20261026_0010`, `DocumentEntities.cs` | Sẵn sàng liên kết. |
| `IDocumentStorageService` impl | `MISSING` | Chỉ có interface trong `IPlatformServices.cs` | Cần triển khai `LocalFileSystemDocumentStorageService`. |
| Direct GBAC Permission Engine | `EXISTS_VERIFIED` | `PermissionResolver.cs`, `ScopeResolver.cs` | Tái sử dụng kiểm tra quyền & phạm vi. |
| Frontend Common Components | `EXISTS_VERIFIED` | `frontend/src/components/common/` | Đủ 10 components chuẩn. |
| Student Workspace UI | `MISSING` | Chưa có trong `features/` | Cần xây dựng `features/studentWorkspace/`. |

