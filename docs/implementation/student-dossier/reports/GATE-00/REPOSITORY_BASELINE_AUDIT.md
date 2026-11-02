# SHD OneERP — REPOSITORY BASELINE AUDIT
## GATE-00: Khảo sát Hiện trạng & Đối chiếu Kiến trúc Nền tảng

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản kiểm toán:** 1.0  
**Ngày thực hiện:** 2026-10-30  
**Người thực hiện:** Master AI Agent Orchestrator  
**Trạng thái cổng:** `GATE-00` — Baseline Audit (Chưa lập trình chức năng mới)  
**Mục tiêu:** Rà soát thực tế toàn bộ repository, xác minh tính xác thực của mã nguồn, database schema, Stored Procedures, API, frontend và test suites trước khi mở User Story đầu tiên `SYS-REF-01`.

---

## 1. TỔNG QUAN REPOSITORY & STACK THỰC TẾ

### 1.1. Hạ tầng công nghệ
- **Backend:** .NET 10 (C# 13), ASP.NET Core Web API, Kiến trúc Clean Architecture + Modular Monolith.
  - Solution: [ShdOneErp.sln](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.sln).
  - Projects:
    - `ShdOneErp.Domain` (.NET 10): Pure domain entities, base classes, exceptions, enums. Zero external dependencies.
    - `ShdOneErp.Application` (.NET 10): Use case interfaces, DTOs, FluentValidation, Domain Event handlers.
    - `ShdOneErp.Infrastructure` (.NET 10): EF Core DbContext, `ISpExecutor` (Dapper-based SP runner), Authentication, File Storage.
    - `ShdOneErp.Api` (.NET 10): Controllers, middleware, Direct GBAC v4.2 policies, Swagger/OpenAPI.
    - `ShdOneErp.Tests` (.NET 10): xUnit, FluentAssertions, Moq.
- **Database:** Microsoft SQL Server (localhost, database: `ShdOneErpDb`).
  - CQRS Split: Write qua EF Core; Business GET bắt buộc qua SQL Server Stored Procedures (`sp_*`).
  - Migration Mechanism: 100% Hand-written SQL migrations trong `database/migrations/`. Tuyệt đối không dùng EF Migrations. Runner phân tán: [run-migrations.ps1](file:///F:/MyProjectSHD/SHDONEERP/database/scripts/run-migrations.ps1) sử dụng `sp_getapplock` và `__DbMigrationHistory`.
- **Frontend:** React 18.3, TypeScript 5.5 (strict mode), Vite 5.4, Tailwind CSS 3.4, Lucide React, TanStack Query v5, Zustand.
  - Thư mục nguồn: `frontend/src/`.
  - Component chia sẻ: `frontend/src/components/common/` (`Button`, `Card`, `PageContainer`, `ListToolbar`, `DataGrid`, `Modal`, `SideDrawer`, `ConfirmDialog`, `Skeleton`, `EmptyState`, `Can`, `RequireAuth`).

### 1.2. Kết quả kiểm tra biên dịch tổng thể
- **Backend Build:** `dotnet build backend/ShdOneErp.sln` -> **THÀNH CÔNG (0 lỗi, 0 cảnh báo nghiêm trọng)**.
- **Frontend Build:** `npm run build` (`tsc && vite build`) trong `frontend/` -> **THÀNH CÔNG (0 lỗi TypeScript, dist/ tạo hoàn tất)**.
- **Automated Unit Tests:** `dotnet test backend/ShdOneErp.sln` -> **152/152 tests PASS (100%)**.

> [!CRITICAL]
> **CẢNH BÁO KIỂM TOÁN VỀ TEST REALITY:**  
> Báo cáo 152 tests PASS hoàn toàn là **Unit Tests** và **EF Core In-Memory / Moq tests**. Đây **KHÔNG PHẢI** là bằng chứng kiểm thử tích hợp trên cơ sở dữ liệu SQL Server thật (`ShdOneErpDb`) và **KHÔNG PHẢI** là kiểm thử E2E giao diện người dùng. Thực tế kiểm tra trực tiếp trên SQL Server bên dưới cho thấy sự khác biệt rất lớn!

---

## 2. KẾT QUẢ KIỂM TRA ĐỘC LẬP TRÊN CƠ SỞ DỮ LIỆU SQL SERVER THẬT (`ShdOneErpDb`)

Bằng cách kết nối trực tiếp vào SQL Server `localhost` database `ShdOneErpDb`, Master Agent phát hiện:

1. **Bảng `__DbMigrationHistory`:**
   - Đã được tạo nhưng hiện tại có **0 dòng dữ liệu** (chưa ghi nhận bất kỳ bản ghi migration nào được áp dụng chính thức qua `run-migrations.ps1`).
2. **Các bảng đã tồn tại thực tế trong SQL Server:**
   - `Audit_SystemLogs`, `SystemAuditLogs`
   - `Doc_Documents`
   - `Identity_Users`, `Identity_UserGroups`, `Identity_UserGroupMembers`, `Identity_UserGroupPermissions`, `Identity_Permissions`, `Identity_RefreshTokens`
   - `Org_LegalEntities`, `Org_BusinessUnits`, `Org_Branches`
   - `Party_Parties`, `Party_Persons`, `Party_OrganizationParties`, `Party_PartyRoles`, `Party_PartyContactMethods`, `Party_PartyIdentifications`
   - `System_Modules`, `System_ModuleDependencies`, `System_Features`, `System_FeatureActionPermissions`, `System_MasterDataCatalogs`, `System_MasterDataItems`, `System_OutboxMessages`, `System_OutboxProcessingHistory`
   - `Wf_Definitions`, `Wf_DefinitionVersions`, `Wf_Instances`, `Wf_History`
   - `Com_*` (Contracts, PriceLists, Quotations, Services)
   - `Crm_*` (Campaigns, Leads, Opportunities)
3. **CÁC BẢNG VÀ STORED PROCEDURES CHƯA ĐƯỢC CHẠY VÀO SQL SERVER:**
   - File migration `database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` **ĐÃ ĐƯỢC VIẾT** trên ổ đĩa, nhưng **CHƯA ĐƯỢC ÁP DỤNG (APPLY)** vào SQL Server `ShdOneErpDb`!
   - Hệ quả thực tế:
     - Bảng `Adm_StudentApplications`: **CHƯA CÓ TRONG DATABASE** (`Invalid object name 'Adm_StudentApplications'`).
     - Bảng `Adm_ChecklistItems`: **CHƯA CÓ TRONG DATABASE**.
     - Bảng `Adm_ApplicationDocumentLinks`: **CHƯA CÓ TRONG DATABASE**.
     - Bảng `Party_PartyRelationships`: **CHƯA CÓ TRONG DATABASE**.
     - Stored Procedure `sp_Party_Student_GetPagedList`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Party_Student_GetDetailById`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Admission_Application_GetPagedList`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Admission_Application_GetDetailById`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Admission_Application_GetByStudentPartyId`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Admission_Checklist_GetByApplicationId`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
     - Stored Procedure `sp_Admission_Checklist_GetById`: **CHƯA TỒN TẠI TRONG SQL SERVER**.
   - Do đó, nếu khởi động API server thực tế và truy cập vào màn hình `/students` hay `/admissions/applications`, các lệnh gọi Stored Procedure sẽ **BỊ LỖI RUNTIME SQL** (Error 2812: Could not find stored procedure).

---

## 3. RÀ SOÁT HIỆN TRẠNG 8 PHÂN HỆ NỀN TẢNG (FOUNDATION MODULES)

| Phân hệ (Module) | Domain Entities | Application Services | API Endpoints | Tables in DB | SQL Migrations | Stored Procedures | Quyền (Permissions) | Frontend UI | Đánh giá Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| **IdentityAccess / Auth** | `User`, `UserGroup`, `UserGroupMember`, `UserGroupPermission`, `Permission`, `RefreshToken` | `AuthService`, `UserGroupWriteService` | `AuthController`, `UserGroupsController` | `Identity_Users`, `Identity_UserGroups`, `Identity_UserGroupMembers`, `Identity_UserGroupPermissions`, `Identity_Permissions`, `Identity_RefreshTokens` | `20261025_0002`, `20261026_0011` | `sp_Identity_UserGroup_GetPaged`, `sp_Identity_UserGroup_GetDetailById` | `identity.user.*`, `identity.group.*`, `identity.permission.*` | `/login`, `/admin/user-groups` | `IMPLEMENTED_VERIFIED` *(Hoạt động trên SQL thật)* |
| **Organization** | `LegalEntity`, `BusinessUnit`, `Branch` | `LegalEntityWriteService`, `BusinessUnitWriteService`, `BranchWriteService` | `LegalEntitiesController`, `BusinessUnitsController`, `BranchesController` | `Org_LegalEntities`, `Org_BusinessUnits`, `Org_Branches` | `20261025_0003`, `20261025_0005`, `20261026_0007`, `20261026_0009` | `sp_Org_LegalEntity_GetPagedList`, `sp_Org_BusinessUnit_GetPagedList`, `sp_Org_Branch_GetPagedList` | `org.legal_entity.*`, `org.business_unit.*`, `org.branch.*` | `/organization/legal-entities`, `/organization/business-units`, `/organization/branches` | `IMPLEMENTED_VERIFIED` *(Hoạt động trên SQL thật)* |
| **Party360** | `Party`, `Person`, `OrganizationParty`, `PartyRole`, `PartyContactMethod`, `PartyIdentification`, `PartyRelationship` | `PartyWriteService`, `PartyReadService` | `PartiesController` | `Party_Parties`, `Party_Persons`, `Party_OrganizationParties`, `Party_PartyRoles`, `Party_PartyContactMethods`, `Party_PartyIdentifications` | `20261025_0004`, `20261026_0008` (Cũ) / `20261029_0015` (Chưa apply) | `sp_Party_Party_GetPagedList`, `sp_Party_Party_GetDetailById` (Cũ) / `sp_Party_Student_*` (Chưa apply) | `party.profile.view/create/edit`, `party.pii.view` | `/parties`, `/students` | `PARTIAL` *(Core Party đã có; phần Student & Relationship chưa apply vào DB)* |
| **AdmissionVisa** | `StudentApplication`, `ChecklistItem`, `ApplicationDocumentLink` | `StudentApplicationWriteService`, `ChecklistWriteService` | `StudentApplicationsController`, `ChecklistsController` | `Adm_StudentApplications`, `Adm_ChecklistItems`, `Adm_ApplicationDocumentLinks` (Tất cả CHƯA có trong SQL) | `20261029_0015` (Chưa apply) | `sp_Admission_Application_*`, `sp_Admission_Checklist_*` (Tất cả CHƯA có trong SQL) | `admission.application.*`, `admission.dossier.*` | Tab Checklist trong `/students/:id`, `ApplicationDetailModal.tsx` | `IMPLEMENTED_UNVERIFIED` *(Code C#/TS đã hoàn chỉnh nhưng DB schema chưa được chạy trên SQL Server)* |
| **Documents Foundation** | `Document` | `LocalFileSystemDocumentStorageService`, `IDocumentStorageService` | Tích hợp qua upload endpoint trong `ChecklistsController` | `Doc_Documents` | `20261026_0010` | Chưa có SP riêng; đọc qua EF Core | Gắn với classification `Confidential/Restricted` | Modal tải file trong Student Workspace | `PARTIAL` *(Bảng Doc_Documents đã có trên SQL; lưu file vật lý cục bộ đã có code nhưng chưa test E2E)* |
| **Workflow Foundation** | `WorkflowDefinition`, `WorkflowDefinitionVersion`, `WorkflowState`, `WorkflowTransition`, `WorkflowInstance`, `WorkflowTransitionHistory` | `WorkflowEngine`, `WorkflowExecutionService`, `WorkflowStateMachineParser` | `WorkflowsController` | `Wf_Definitions`, `Wf_DefinitionVersions`, `Wf_Instances`, `Wf_History` | `20261027_0013` | Có SP nội bộ engine | `workflow.definition.*`, `workflow.instance.*` | Chưa có Admin UI riêng | `IMPLEMENTED_VERIFIED` *(Engine đã có và test pass, nhưng CHƯA ĐƯỢC TÍCH HỢP vào StudentApplication)* |
| **Module & Feature Registry** | `SystemModule`, `SystemModuleDependency`, `SystemFeature`, `SystemFeatureActionPermission` | `ModuleRegistryWriteService`, `FeatureRegistryWriteService` | `ModulesController`, `FeaturesController`, `PermissionMappingController` | `System_Modules`, `System_ModuleDependencies`, `System_Features`, `System_FeatureActionPermissions` | `20261027_0012` | `sp_System_Module_GetPagedList`, `sp_System_Feature_GetPagedList` | `system.module.*`, `system.feature.*` | `/admin/modules` (`ModuleRegistryPage.tsx`) | `IMPLEMENTED_VERIFIED` *(Hoạt động trên SQL thật)* |
| **System Reference Data / Lookups** | `MasterDataCatalog`, `MasterDataItem` | **MISSING** (Chưa có Application Services) | **MISSING** (Chưa có Controller) | `System_MasterDataCatalogs`, `System_MasterDataItems` (Đã có bảng nhưng 0 rows) | `20261026_0010` | **MISSING** (Chưa có SP nào) | **MISSING** (Chưa có mã quyền) | **MISSING** (Chưa có UI menu Dữ liệu nguồn) | `PARTIAL` *(Đã có schema DB và Entity Domain; thiếu hoàn toàn App Service, SP, API và UI)* |

---

## 4. XÁC MINH CHI TIẾT STU-01 VÀ ADM-01

Đối chiếu với tiêu chuẩn kiểm toán tại Section 2 của User Prompt:

| Chức năng thành phần | Tình trạng mã nguồn | Tình trạng Database | Tình trạng UI Frontend | Phân loại kiểm toán | Ghi chú & Rủi ro phát hiện |
|---|---|---|---|---|---|
| **STU-01: Định danh Party Học viên** | [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L7-L83) | Đã có `Party_Parties`, `Party_Persons`, `Party_PartyRoles` trong SQL | Có [StudentCreateDrawer.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentCreateDrawer.tsx) | `IMPLEMENTED_VERIFIED` | Tái sử dụng `PartyType=Person` và Role `Student`. Không nhân bản Person. |
| **STU-01: Tra cứu danh sách học viên (SP)** | Code gọi `sp_Party_Student_GetPagedList` trong `PartyReadService.Sp.cs` | **CHƯA CÓ SP TRONG DATABASE** | Có [StudentDirectoryPage.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/pages/studentWorkspace/StudentDirectoryPage.tsx), [StudentList.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentList.tsx) | `IMPLEMENTED_UNVERIFIED` | Mã nguồn C#/TS và SQL migration script đã viết xong, nhưng chưa chạy migration 0015 vào SQL Server thật. |
| **STU-01: Quản lý giấy tờ định danh (CCCD/Hộ chiếu)** | `Party_PartyIdentifications` | Bảng đã có trong SQL | [StudentIdentificationsTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentIdentificationsTab.tsx) | `IMPLEMENTED_VERIFIED` | Hoạt động bình thường. |
| **STU-01: Thân nhân / Người bảo lãnh tài chính** | `Party_PartyRelationships` | **CHƯA CÓ BẢNG TRONG DATABASE** | [StudentOverviewTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentOverviewTab.tsx) | `IMPLEMENTED_UNVERIFIED` | Nằm trong migration 0015 chưa apply. Entity C# bị lệch pha thuộc tính so với SQL. |
| **ADM-01: Thực thể StudentApplication** | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs) | **CHƯA CÓ BẢNG TRONG DATABASE** | [StudentApplicationsTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentApplicationsTab.tsx), [ApplicationCreateDrawer.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/ApplicationCreateDrawer.tsx) | `IMPLEMENTED_UNVERIFIED` | Độc lập với PartyId (1 Party nhiều Applications). Chưa apply SQL 0015. |
| **ADM-01: Tra cứu hồ sơ tuyển sinh (SP)** | `sp_Admission_Application_GetPagedList` | **CHƯA CÓ SP TRONG DATABASE** | Bảng danh sách hồ sơ trong UI | `IMPLEMENTED_UNVERIFIED` | Cần chạy migration 0015 lên SQL Server test để xác minh query Direct GBAC fail-closed. |
| **ADM-01: Quản lý Checklist giấy tờ** | [ChecklistItem.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/ChecklistItem.cs) | **CHƯA CÓ BẢNG TRONG DATABASE** | [ApplicationDetailModal.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/ApplicationDetailModal.tsx) | `IMPLEMENTED_UNVERIFIED` | Checklist hiện đang hardcode 9 items generic, chưa phân 3 giai đoạn. Chưa apply SQL 0015. |
| **ADM-01: Số hóa chứng từ & Upload file** | `LocalFileSystemDocumentStorageService.cs` | Bảng `Doc_Documents` đã có trong SQL; bảng link `Adm_ApplicationDocumentLinks` chưa có | Nút upload trong `ApplicationDetailModal.tsx` | `PARTIAL` | Tính SHA256 và lưu file vật lý đã có code; chưa kiểm thử luồng thực tế trên SQL Server thật do thiếu bảng link. |
| **ADM-01: Thẩm định & Từ chối tài liệu** | `VerifyItem`, `RejectItem` trong `ChecklistWriteService.cs` | Chưa có bảng checklist | Modal thẩm định và từ chối kèm lý do | `IMPLEMENTED_UNVERIFIED` | Phát hiện lỗi kiểm soát nội bộ: chuyên viên tạo hồ sơ có thể tự duyệt hồ sơ của chính mình (chưa có 4-Eyes Principle check). |
| **ADM-01: Chuyển trạng thái quy trình** | Chuyển `Draft` -> `Submitted` -> `UnderReview` -> `Accepted`/`Rejected` | Chưa có bảng | Dropdown/Buttons trong modal | `PARTIAL` | Đang chuyển trạng thái qua update chuỗi trực tiếp, chưa gọi qua `IWorkflowEngine` (FND-03). |

---

## 5. ĐÁNH GIÁ NĂNG LỰC DỮ LIỆU NGUỒN HIỆN CÓ (REFERENCE DATA AUDIT)

Đáp ứng 8 câu hỏi bắt buộc theo Bước 4 của User Prompt:

1. **Đã có hệ thống Reference Data hoặc Lookup chưa?**
   - **Có một phần ở tầng Database Schema:** Trong file migration `20261026_0010_EnterpriseFoundationPlatform.sql`, đã tạo sẵn 2 bảng: `System_MasterDataCatalogs` và `System_MasterDataItems`.
   - **Có ở tầng Domain:** Lớp [MasterDataEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/System/MasterDataEntities.cs) chứa 2 thực thể `MasterDataCatalog` và `MasterDataItem`.
   - **Có ở tầng EF Core Configuration:** Lớp `PlatformConfigurations.cs` có cấu hình ánh xạ bảng `System_MasterDataCatalogs` và `System_MasterDataItems`.
   - **NHƯNG THIẾU TOÀN BỘ CÁC TẦNG TRÊN:** Chưa có Application DTOs/Services/Validators, chưa có Stored Procedures, chưa có API Controller, chưa có phân quyền và chưa có màn hình UI. Hiện tại 2 bảng này trong database SQL Server đang có **0 dòng dữ liệu**.
2. **Có màn hình quản trị nhóm danh mục chưa?**
   - **CHƯA CÓ.** Menu `Cấu hình hệ thống → Dữ liệu nguồn` hoàn toàn chưa tồn tại trên Sidebar và Router của frontend.
3. **Có màn hình quản trị giá trị danh mục chưa?**
   - **CHƯA CÓ.**
4. **Có hỗ trợ phân cấp địa lý không?**
   - Bảng `System_MasterDataItems` có cột `ParentItemId UNIQUEIDENTIFIER NULL` cho phép liên kết cha-con (Self-referencing FK), nhưng **CHƯA CÓ** logic kiểm tra chống vòng lặp (Cycle Detection), **CHƯA CÓ** bảng phân loại cấp hành chính (Country, Province, District, Ward) và **CHƯA CÓ** cơ chế quản lý lịch sử hiệu lực sáp nhập/đổi tên đơn vị hành chính theo thời gian.
5. **Có quyền quản trị, Data Scope, audit và RowVersion không?**
   - **CHƯA CÓ.**
     - Bảng `System_MasterDataCatalogs` và `System_MasterDataItems` hiện **thiếu cột `RowVersion`** (rủi ro xung đột ghi đè đồng thời).
     - Chưa có trường xác định phạm vi (`ScopePolicy` hay `LegalEntityId`).
     - Chưa đăng ký Action Permissions riêng trong `Identity_Permissions` và `System_FeatureActionPermissions`.
     - Chưa có ghi vết vào `Audit_SystemLogs`.
6. **Có hỗ trợ ngừng sử dụng nhưng bảo toàn dữ liệu lịch sử không?**
   - Cột `IsActive BIT NOT NULL DEFAULT 1` đã có trong `System_MasterDataItems`, về mặt dữ liệu có thể đánh dấu deactive (`IsActive = 0`) mà không xóa vật lý bản ghi. Tuy nhiên, chưa có logic kiểm tra ràng buộc xem giá trị đó đang được những hồ sơ nào tham chiếu trước khi cho phép deactive.
7. **Các module có đang hardcode danh mục hoặc enum nghiệp vụ không?**
   - **CÓ, ĐANG BỊ HARDCODE NẶNG NỀ Ở NHIỀU NƠI:**
     - `StudentApplication.cs`: Hardcode danh sách trạng thái hồ sơ `Draft, Submitted, UnderReview, Accepted, Rejected, Withdrawn`.
     - `StudentApplication.cs`: Hardcode 9 checklist items tiêu chuẩn (`PASSPORT, ID_CARD, BIRTH_CERT...`).
     - `ChecklistItem.cs`: Hardcode danh mục `Identity, Academic, Financial, Medical, Legal, Other`.
     - `ApplicationCreateDrawer.tsx`: Hardcode danh sách thị trường du học (`Hàn Quốc, CHLB Đức, Nhật Bản, Úc, Đài Loan, Canada`).
     - `PartyEntities.cs`: Hardcode các loại vai trò (`Student, Parent, PartnerSchool...`), loại định danh (`CitizenId, Passport`).
8. **Có thể tái sử dụng thành phần nào thay vì xây mới?**
   - **TÁI SỬ DỤNG VÀ NÂNG CẤP BẢNG CÓ SẴN:** Không tạo bảng mới có tên khác. Tái sử dụng bảng `System_MasterDataCatalogs` và `System_MasterDataItems`.
   - Nâng cấp schema thông qua một versioned migration mới: Thêm `RowVersion`, `ScopePolicy`, `OwnerModule`, `ManagementMode` vào Catalog; thêm `EffectiveFromUtc`, `EffectiveToUtc`, `RowVersion` vào Item.
   - Xây dựng tầng Application Service, Stored Procedures, API và giao diện UI theo chuẩn Clean Architecture của SHD OneERP.

### Phân định 3 khái niệm kiến trúc bắt buộc:
1. **Reference Data (Dữ liệu nguồn tham chiếu):** Do System Config Admin quản lý (Quốc gia, Tỉnh/Thành, Loại giấy tờ, Thị trường, Kỳ tuyển sinh). Thuộc sở hữu của phân hệ Cấu hình hệ thống (System Configuration).
2. **Workflow / Checklist Configuration (Cấu hình quy trình & biểu mẫu):** Gắn với từng thị trường/chương trình đào tạo, sở hữu bởi Workflow Foundation (FND-03) và AdmissionVisa. Việc thêm một giá trị trạng thái vào Reference Data KHÔNG ĐƯỢC tự động cho phép chuyển trạng thái trong Workflow.
3. **Operational Data (Dữ liệu tác nghiệp giao dịch):** Hồ sơ học viên cụ thể, từng StudentApplication, từng tệp đính kèm scan, từng lần thẩm định. Thuộc sở hữu của Party360 và AdmissionVisa.

---

## 6. MA TRẬN PHÂN LOẠI HIỆN TRẠNG TOÀN DIỆN (COMPREHENSIVE BASELINE STATUS MATRIX)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ THANG PHÂN LOẠI:                                                                                 │
│ [IMPLEMENTED_VERIFIED]   : Đã có code, DB schema trên SQL Server thật và test passed.            │
│ [IMPLEMENTED_UNVERIFIED] : Đã có code và migration script nhưng CHƯA apply lên SQL Server thật.   │
│ [PARTIAL]                : Đã có một phần (ví dụ có schema DB nhưng thiếu Service/UI).           │
│ [MISSING]                : Hoàn toàn chưa có cấu trúc code, DB hay UI.                           │
│ [BLOCKED]                : Bị chặn bởi quyết định kiến trúc hoặc nghiệp vụ từ Product Owner.     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Hạng mục chức năng | Module Owner | Trạng thái kỹ thuật | Bằng chứng kiểm tra thực tế |
|---|---|---|---|
| User Authentication & Login API | IdentityAccess | `IMPLEMENTED_VERIFIED` | Đã test đăng nhập thành công với tài khoản `admin@shdcorp.vn` |
| Direct GBAC v4.2 Permission Engine | IdentityAccess | `IMPLEMENTED_VERIFIED` | Bảng `Identity_UserGroupPermissions`, logic phân quyền trong `CustomAuthorizationHandler` |
| Quản lý Pháp nhân (LegalEntity CRUD + SP) | Organization | `IMPLEMENTED_VERIFIED` | Bảng `Org_LegalEntities`, SP `sp_Org_LegalEntity_GetPagedList` trên SQL |
| Quản lý Đơn vị kinh doanh (BusinessUnit CRUD + SP) | Organization | `IMPLEMENTED_VERIFIED` | Bảng `Org_BusinessUnits`, SP `sp_Org_BusinessUnit_GetPagedList` trên SQL |
| Quản lý Chi nhánh (Branch CRUD + SP) | Organization | `IMPLEMENTED_VERIFIED` | Bảng `Org_Branches`, SP `sp_Org_Branch_GetPagedList` trên SQL |
| Định danh Party cá nhân (Person Party360) | Party360 | `IMPLEMENTED_VERIFIED` | Bảng `Party_Parties`, `Party_Persons`, `PartiesController` |
| Danh bạ Học viên (Student Directory SP GET) | Party360 | `IMPLEMENTED_UNVERIFIED` | Migration `20261029_0015` có script SP nhưng CHƯA chạy vào SQL Server thật |
| Thân nhân / Người bảo lãnh tài chính | Party360 | `IMPLEMENTED_UNVERIFIED` | Script bảng `Party_PartyRelationships` CHƯA chạy vào SQL Server thật |
| Hồ sơ tuyển sinh du học (`StudentApplication`) | AdmissionVisa | `IMPLEMENTED_UNVERIFIED` | Script bảng `Adm_StudentApplications` CHƯA chạy vào SQL Server thật |
| Danh mục Checklist giấy tờ du học | AdmissionVisa | `IMPLEMENTED_UNVERIFIED` | Script bảng `Adm_ChecklistItems` CHƯA chạy vào SQL Server thật |
| Tra cứu hồ sơ du học qua Stored Procedure | AdmissionVisa | `IMPLEMENTED_UNVERIFIED` | Script `sp_Admission_Application_GetPagedList` CHƯA chạy vào SQL Server thật |
| Thẩm định & từ chối tài liệu checklist | AdmissionVisa | `IMPLEMENTED_UNVERIFIED` | Code C# đã có nhưng chưa chạy trên DB thật; phát hiện lỗi thiếu Four-Eyes check |
| Lưu trữ tệp số hóa vật lý (Local Document Storage) | Documents | `PARTIAL` | `Doc_Documents` đã có trong SQL; chưa test luồng upload thực tế từ UI |
| Workflow State Machine Engine (FND-03) | Workflow | `IMPLEMENTED_VERIFIED` | Bảng `Wf_Definitions` đã có trên SQL; tests engine pass, nhưng CHƯA nối vào Admission |
| Module & Feature Registry (FND-04) | System Registry | `IMPLEMENTED_VERIFIED` | Bảng `System_Modules`, UI `/admin/modules` hoạt động trên SQL thật |
| Quản lý Nhóm danh mục (SYS-REF-01) | System Config | `PARTIAL` | Đã có bảng `System_MasterDataCatalogs` và Entity Domain; thiếu App Service, SP, API, UI |
| Quản lý Giá trị danh mục (SYS-REF-02) | System Config | `PARTIAL` | Đã có bảng `System_MasterDataItems` và Entity Domain; thiếu App Service, SP, API, UI |
| Phân cấp Địa lý Quốc gia/Tỉnh/Huyện/Xã (SYS-REF-03) | System Config | `MISSING` | Chưa có phân cấp đơn vị hành chính và cơ chế chống lặp / lịch sử |
| Phân quyền & Data Scope Dữ liệu nguồn (SYS-REF-04) | System Config | `MISSING` | Chưa đăng ký mã quyền `system.reference_data.*` trong registry |
| Import/Export Dữ liệu nguồn (SYS-REF-05) | System Config | `MISSING` | Chưa có cơ chế staging/preview và batch import |
| Ánh xạ Trạng thái danh mục với Workflow (SYS-REF-06) | System Config / Wf | `MISSING` | Chưa có cơ chế mapping giữa Catalog Status và Workflow States |
| Hồ sơ học vấn chi tiết GPA & Vắng mặt (US-KR-01) | AdmissionVisa | `MISSING` | Chưa có bảng hoặc trường dữ liệu nào trong schema |
| Chi tiết tài chính bảo lãnh & Sổ đỏ (US-KR-02) | Party360 / Adm | `MISSING` | Chưa có trường thu nhập hàng tháng, số lượng sổ đỏ, tệp dựng tài chính |
| Checklist 3 giai đoạn Đầu vào-Trường-Visa (US-KR-03) | AdmissionVisa | `MISSING` | Hiện tại mới có 1 checklist phẳng 9 items hardcode |
| Chuẩn tên file Phụ lục 4A & Tải ZIP (US-KR-04) | AdmissionVisa | `MISSING` | Chưa có cơ chế tự động đổi tên file xuất và đóng gói ZIP |
| Kiểm tra chéo hồ sơ Four-Eyes Review (US-KR-05) | AdmissionVisa | `MISSING` | Chưa có chặn tự duyệt và chưa có mốc duyệt "Sẵn sàng gửi dịch" |
| Quy trình Dịch thuật đối tác An Phúc (US-KR-06) | AdmissionVisa | `MISSING` | Chưa có quản lý đợt dịch, đối tác dịch, ngày hẹn trả và file scan dịch |
| Tem vàng Sở Ngoại vụ & Tem tím Lãnh sự (US-KR-07) | AdmissionVisa | `MISSING` | Chưa có quản lý lịch hẹn tem vàng, tem tím và hạn hiệu lực 1 năm |
| Nộp nhiều trường & Invoice học phí (US-KR-08/09) | AdmissionVisa | `MISSING` | Chưa có bảng chọn trường, lịch phỏng vấn và theo dõi invoice KRW/VND |
| K-Study đóng băng & Khám lao Phước An (US-KR-10) | AdmissionVisa | `MISSING` | Chưa có trường lưu số tiền đóng băng 10M/8M won và kết quả khám lao |
| Nộp KVAC & Theo dõi kết quả 20 ngày (US-KR-11) | AdmissionVisa | `MISSING` | Chưa có mã hồ sơ KVAC, tính ngày làm việc và lưu trạng thái visa |
| Bàn giao hồ sơ sân bay & Xuất cảnh (US-KR-12) | AdmissionVisa | `MISSING` | Chưa có thông tin chuyến bay, biên bản bàn giao và xác nhận nhập học |
| Phân công kép NTV & Xử lý hồ sơ (US-KR-13) | AdmissionVisa | `MISSING` | Chỉ có 1 trường `AssignedUserId`, chưa phân định NTV và NV xử lý |
| Phân tách 3 chiều trạng thái (US-KR-14) | Cross-domain | `BLOCKED` | Chờ PO chốt danh mục phân loại trạng thái chuẩn (PO-007) |

---

## 7. RỦI RO KIẾN TRÚC & DỮ LIỆU CẦN KHẮC PHỤC TRƯỚC KHI BẮT ĐẦU SPRINT 0

1. **Rủi ro rách rời môi trường Database (Database Drift):**  
   File migration `20261029_0015` chưa được áp dụng lên SQL Server dev/test khiến toàn bộ phân hệ STU-01 và ADM-01 không thể chạy thực tế.  
   *Hành động đề xuất:* Master Agent sẽ điều phối áp dụng migration `20261029_0015` lên môi trường test SQL Server ngay khi PO phê duyệt GATE-00, ghi vết chuẩn vào `__DbMigrationHistory`.
2. **Rủi ro thiếu Concurrency Token trên Reference Data:**  
   Bảng `System_MasterDataCatalogs` và `System_MasterDataItems` hiện tại chưa có cột `RowVersion`. Nếu hai admin cùng cập nhật một danh mục, sẽ xảy ra lỗi ghi đè mất dữ liệu (Lost Update).  
   *Hành động đề xuất:* Bắt buộc bổ sung `RowVersion ROWVERSION NOT NULL` trong migration nâng cấp của `SYS-REF-01`.
3. **Rủi ro Hardcoded Master Data:**  
   Các phân hệ hiện tại đang hardcode enum và string literals khắp nơi. Cần nhanh chóng hoàn thành Sprint 0 (SYS-REF-01 đến 06) để chuyển toàn bộ dropdown và danh mục nghiệp vụ sang cơ chế đọc động từ Database.

