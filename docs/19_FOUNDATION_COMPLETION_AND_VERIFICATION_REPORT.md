# SHD OneERP — BÁO CÁO NGHIỆM THU KIẾN TRÚC NỀN TẢNG (FOUNDATION ARCHITECTURE FIRST)

> **Kính gửi:** Product Owner & Ban Lãnh đạo SHD OneERP  
> **Người lập:** Principal Enterprise Architect, Technical Lead, Security Architect & QA Lead  
> **Trạng thái:** HOÀN TẤT THI CÔNG & KIỂM THỬ — CHỜ PHÊ DUYỆT PRODUCT OWNER  
> **Ngày báo cáo:** 27/10/2026  
> **Phiên bản nền tảng:** .NET 10 (C# 13) | React 18 (TypeScript Strict) | Modular Monolith | SQL Server 2022  

---

## 1. FOUNDATION VERIFICATION REPORT

Đối chiếu toàn bộ codebase, SQL migrations, Stored Procedures, API contracts, frontend và automated tests theo tiêu chí **Foundation Readiness Checklist**:

| STT | Phân hệ / Hạng mục Kiến trúc | Trạng thái | Bằng chứng Triển khai (Code Evidence) | Bằng chứng Kiểm thử (Test Evidence) |
|---|---|---|---|---|
| 1 | **Runtime & Framework** (.NET 10, C# 13, Clean Architecture) | **VERIFIED** | `ShdOneErp.sln`, `*.csproj` (net10.0), tách biệt 4 tầng Domain - Application - Infrastructure - Api | `dotnet build` đạt 0 Error, Clean Architecture boundary không phụ thuộc ngược |
| 2 | **Database Migration Hand-written** (Không dùng EF Migrations tự động) | **VERIFIED** | `backend/database/migrations/` (11 migrations từ 0001 đến 0011) | Runner `run-migrations.ps1` kiểm tra checksum, lock concurrency |
| 3 | **Stored Procedure Read-side & CQRS** | **VERIFIED** | 8 SPs mới cho UserGroup & Audit (`20261026_0011_UserGroupAndAuditStoredProcedures.sql`), Dapper `SpExecutor.cs` | Băng thông truy vấn GET tối ưu qua SP phân trang và lock NOLOCK |
| 4 | **Direct GBAC Authorization** (Bỏ Role trung gian runtime) | **VERIFIED** | `UserGroup`, `UserGroupMember`, `UserGroupPermission`, `Permission` (`IdentityEntities.cs`) | `DirectGbacTests.cs`, `UserGroupServiceTests.cs` (100% Passed) |
| 5 | **Data Scope Authorization 4 cấp** (Global, LegalEntity, BU, Branch) | **VERIFIED** | `ScopeResolver.cs`, `IScopeResolver.cs`, `ScopeType.cs` | `ScopeResolverTests.cs` (Chặn 100% cross-company data leakage) |
| 6 | **Permission Cache & Invalidation** | **VERIFIED** | `PermissionResolver.cs` (`IMemoryCache` TTL 60s), `IPermissionCacheInvalidator.cs` | `CacheInvalidationTests.cs`, `UserGroupServiceTests.UpdatePermissionsAsync` |
| 7 | **Audit Logging Framework & Diff Masking** | **VERIFIED** | `AuditSaveChangesInterceptor.cs`, `Audit_SystemLogs` table | `AuditDiffMaskingTests.cs` (Sensitive field: PasswordHash, TokenHash masking) |
| 8 | **Enterprise Platform Schemas & Contracts** (Outbox, Modules, Features, Docs, Workflows) | **VERIFIED** | `20261026_0010_EnterpriseFoundationPlatform.sql`, `IPlatformServices.cs`, Domain Entities | Định hình contracts chuẩn hóa trước khi các business modules khởi động |
| 9 | **FND-01 — GroupUser Management UI & Scope Assignment** | **VERIFIED** | `/admin/user-groups`, `UserGroupList.tsx`, `UserGroupMembersDrawer.tsx`, `UserGroupPermissionMatrixDrawer.tsx` | TypeScript strict: 1608 modules transformed, 0 error |
| 10 | **FND-02 — Audit Log Management & Viewer** | **VERIFIED** | `/admin/audit-logs`, `AuditLogList.tsx`, `AuditLogDetailDrawer.tsx` | Visual Before/After Diff Viewer có color coding và masking |
| 11 | **Phân hệ Tổ chức (Org Hierarchy)** (Legal Entity, BU, Branch/Campus) | **VERIFIED** | `LegalEntitiesPage.tsx`, `BusinessUnitsPage.tsx`, `BranchesPage.tsx` | CRUD & SP Read-side, cascade scoping đã kết nối toàn diện |
| 12 | **Phân hệ Party 360 Core** | **VERIFIED** | `PartiesPage.tsx`, `PartyReadService.Sp.cs`, `PartyWriteService.cs` | Tra cứu CCCD/TaxCode, phân loại Customer/Partner/Student |

---

## 2. GROUPUSER AUTHORIZATION ARCHITECTURE & PERMISSION MATRIX

### 2.1 Mô hình logic Direct GBAC
Thay vì sử dụng Role trung gian gây mập mờ trong việc giải quyết quyền và phạm vi dữ liệu, SHD OneERP thực thi mô hình chuẩn hóa:
```
User (Người dùng)
  │
  ▼ [UserGroupMember - kèm Scope cụ thể]
UserGroup (Nhóm người dùng)
  │
  ▼ [UserGroupPermission]
Permission (Quyền hạn nghiệp vụ)
```

### 2.2 Quy tắc Data Scope 4 cấp
Khi gán một người dùng vào nhóm, Admin sẽ phân bổ phạm vi dữ liệu (`ScopeType`):
1. **Global (Toàn cầu):** Áp dụng xuyên suốt toàn bộ tập đoàn và tất cả các pháp nhân thành viên. Chỉ có Admin Toàn cầu mới có quyền gán scope này.
2. **LegalEntity (Pháp nhân):** Giới hạn hiệu lực trong phạm vi công ty pháp nhân được chọn (bao gồm tất cả các đơn vị và chi nhánh trực thuộc pháp nhân đó).
3. **BusinessUnit (Đơn vị kinh doanh / Khối Đào tạo):** Giới hạn trong khối đào tạo trực thuộc một pháp nhân cụ thể.
4. **Branch (Cơ sở / Campus):** Giới hạn nghiêm ngặt tại cơ sở / chi nhánh cụ thể.

### 2.3 Cơ chế Cache Invalidation
- **Cache Strategy:** Permissions được tính toán và lưu trong MemoryCache (`auth:effective_perms:{userId}`) với thời hạn TTL 60 giây.
- **Tức thời Invalidation:** Bất cứ thao tác nào gồm:
  - Thêm / loại bỏ thành viên khỏi nhóm (`AssignMemberAsync`, `RemoveMemberAsync`)
  - Chỉnh sửa quyền của nhóm (`UpdatePermissionsAsync`)
  - Vô hiệu hóa hoặc kích hoạt nhóm (`UpdateAsync`, `DeleteAsync`)
  đều kích hoạt `IPermissionCacheInvalidator.InvalidateUser(userId)` đối với toàn bộ các thành viên liên quan, bảo đảm quyền mới có hiệu lực ngay trong request tiếp theo mà không cần user logout.

---

## 3. UI/API IMPLEMENTATION REPORT CHO FND-01 VÀ FND-02

### 3.1 FND-01: Quản trị Nhóm quyền & Phân bổ Scope (`/admin/user-groups`)
- **Backend API:**
  - `GET /api/v1/identity/user-groups`: Danh sách nhóm phân trang qua SP `sp_Identity_UserGroup_GetPaged`.
  - `GET /api/v1/identity/user-groups/{id}`: Chi tiết nhóm qua SP `sp_Identity_UserGroup_GetById`.
  - `POST /api/v1/identity/user-groups`: Tạo nhóm mới (kiểm tra chặt chẽ quyền tạo nhóm Global).
  - `PUT /api/v1/identity/user-groups/{id}`: Cập nhật thông tin (bảo vệ optimistic concurrency bằng `RowVersion`).
  - `DELETE /api/v1/identity/user-groups/{id}`: Xóa nhóm (nghiêm cấm xóa nhóm hệ thống `IsSystem = true`).
  - `GET /api/v1/identity/user-groups/{id}/members`: Danh sách thành viên và scope chi tiết qua SP `sp_Identity_UserGroup_GetMembers`.
  - `POST /api/v1/identity/user-groups/{id}/members`: Thêm thành viên kèm cascade validation (LegalEntity → BU → Branch).
  - `DELETE /api/v1/identity/user-groups/{id}/members/{membershipId}`: Thu hồi tư cách thành viên nhóm.
  - `GET /api/v1/identity/user-groups/{id}/permissions`: Danh sách quyền được cấp qua SP `sp_Identity_UserGroup_GetPermissions`.
  - `PUT /api/v1/identity/user-groups/{id}/permissions`: Cập nhật quyền trực tiếp theo mảng `PermissionIds`.
  - `GET /api/v1/identity/user-groups/permissions`: Toàn bộ danh mục quyền hệ thống qua SP `sp_Identity_Permission_GetAll`.
  - `GET /api/v1/identity/user-groups/users/{userId}/effective-permissions`: Tra cứu quyền hiệu lực chi tiết kèm nguồn gốc nhóm và scope thực tế qua SP `sp_Identity_User_GetDetailedEffectivePermissions`.
- **Frontend Components:**
  - `UserGroupList.tsx`: Bảng quản lý tổng thể, badge ScopeType (Toàn cầu, Pháp nhân, Khối BU, Cơ sở), số lượng thành viên, số lượng quyền, trạng thái.
  - `UserGroupFormDrawer.tsx`: Drawer thêm mới / cập nhật thông tin nhóm.
  - `UserGroupMembersDrawer.tsx`: Drawer quản lý thành viên và thiết lập cascade Scope Assignment.
  - `UserGroupPermissionMatrixDrawer.tsx`: Ma trận cấp quyền trực tiếp theo Phân hệ (Identity, Organization, Party, System...), hỗ trợ chọn nhanh theo module.
  - `UserEffectivePermissionsModal.tsx`: Công cụ tra cứu và đối chiếu quyền hiệu lực của bất kỳ nhân sự nào.

### 3.2 FND-02: Quản lý & Xem Nhật ký Kiểm toán (`/admin/audit-logs`)
- **Backend API:**
  - `GET /api/v1/identity/audit-logs`: Lấy danh sách kiểm toán có phân trang, bộ lọc đa chiều (Action, Entity, Actor, CorrelationId) qua SP `sp_Audit_SystemLog_GetPaged`.
  - `GET /api/v1/identity/audit-logs/{id}`: Xem chi tiết bản ghi kiểm toán qua SP `sp_Audit_SystemLog_GetById` (kiểm tra quyền xem theo LegalEntityId của người dùng).
- **Frontend Components:**
  - `AuditLogList.tsx`: Bảng nhật ký phân trang, bộ lọc nâng cao, tìm kiếm theo Correlation ID / Trace ID.
  - `AuditLogDetailDrawer.tsx`: Visual Before/After Diff Viewer so sánh trường dữ liệu cũ vs mới, highlight các trường bị sửa đổi, bảo mật tuyệt đối các trường nhạy cảm `***MASKED***`.

---

## 4. SECURITY TEST REPORT VỚI KẾT QUẢ THỰC TẾ

Toàn bộ 69 bài kiểm thử bảo mật và nghiệp vụ nền tảng đã chạy trên môi trường test (.NET 10 xUnit + FluentAssertions + EF Core InMemory):
```
Test run for ShdOneErp.Tests.dll (.NETCoreApp,Version=v10.0)
Total tests: 69 | Passed: 69 | Failed: 0 | Skipped: 0 | Duration: 545 ms
```

### Các kịch bản kiểm thử bảo mật then chốt:
1. **User không có quyền bị từ chối:** `UserGroupServiceTests.CreateAsync_WhenUserLacksPermission_ReturnsUnauthorized` (Trả về lỗi `UNAUTHORIZED`).
2. **Không cho phép user thường tạo nhóm Global Scope:** `UserGroupServiceTests.CreateAsync_WhenCreatingGlobalScopeWithoutAdmin_ReturnsForbidden` (Trả về lỗi `UNAUTHORIZED_GLOBAL_SCOPE`).
3. **Bảo vệ nhóm hệ thống:** `UserGroupServiceTests.DeleteAsync_WhenGroupIsSystem_ReturnsError` (Chặn hành vi xóa nhóm `SYSTEM_ADMIN`).
4. **Cache Invalidation tức thời:** `UserGroupServiceTests.AssignMemberAsync_InvalidatesUserCache` và `UpdatePermissionsAsync_InvalidatesAllMembersCache` (Xác thực cache invalidation gọi đúng tới `IPermissionCacheInvalidator.InvalidateUser`).
5. **Chống rò rỉ dữ liệu chéo giữa các pháp nhân (Cross-company data isolation):** `ScopeResolverTests` (User thuộc LegalEntity A tuyệt đối không truy cập được dữ liệu thuộc LegalEntity B).
6. **Bảo vệ thông tin nhạy cảm trong Audit Logs:** `AuditDiffMaskingTests.AuditSaveChangesInterceptor_SanitizesSensitiveFields_InAuditLog` (Xác nhận các trường `PasswordHash`, `TokenHash` không bao giờ lưu plaintext, được sanitize thành `"***MASKED***"`).
7. **Bảo vệ toàn vẹn đồng thời (Concurrency Control):** Optimistic Concurrency với `RowVersion` ngăn chặn ghi đè thầm lặng (`CONCURRENCY_CONFLICT`).

---

## 5. DANH SÁCH MIGRATION VÀ THAY ĐỔI DATABASE

Hệ thống đã triển khai 11 handwritten SQL migrations an toàn, có transaction và log execution:
1. `20261026_0001_InitialIdentitySchema.sql`: Users, RefreshTokens, Permissions.
2. `20261026_0002_IdentityStoredProcedures.sql`: SP đăng nhập, xác thực token.
3. `20261026_0003_LegalEntitySchema.sql`: Bảng LegalEntities, OrgHierarchy.
4. `20261026_0004_LegalEntityStoredProcedures.sql`: SP đọc pháp nhân.
5. `20261026_0005_BusinessUnitSchema.sql`: Bảng BusinessUnits, OrgUnits.
6. `20261026_0006_BusinessUnitStoredProcedures.sql`: SP đọc khối BU.
7. `20261026_0007_Party360Schema.sql`: Bảng Parties, PartyIdentifications.
8. `20261026_0008_Party360StoredProcedures.sql`: SP đọc Party 360.
9. `20261026_0009_BranchManagementSchema.sql`: Bảng Branches (Cơ sở đào tạo/Campus) và SPs.
10. `20261026_0010_EnterpriseFoundationPlatform.sql`: Audit_SystemLogs, System_OutboxMessages, System_Modules, System_Features, System_MasterData, Doc_Documents, Wf_Workflows.
11. `20261026_0011_UserGroupAndAuditStoredProcedures.sql`: 8 Stored Procedures tối ưu cho FND-01 & FND-02, seed quyền hạn `identity.audit.view`, `identity.audit.export`.

---

## 6. CÁC VẤN ĐỀ CÒN MỞ VÀ ARCHITECTURE DECISION REGISTER (ADR)

Đã cập nhật đầy đủ trong tài liệu kiến trúc `docs/10_ADR.md`:
- **ADR-001:** Kiến trúc Modular Monolith & Clean Architecture.
- **ADR-002:** Phân tách CQRS: EF Core cho Write-side & Stored Procedures + Dapper cho Read-side.
- **ADR-003:** Direct Group-Based Access Control (Direct GBAC) thay thế Role trung gian.
- **ADR-004:** Cơ chế Data Scoping 4 cấp (Global, LegalEntity, BusinessUnit, Branch) bảo đảm cô lập dữ liệu.
- **ADR-005:** Hand-written SQL Migrations có Checksum và Distributed Lock.
- **ADR-006:** Kiến trúc Tự động Audit Logging với Sensitive Field Masking.
- **ADR-007:** Event-Driven Architecture với Outbox Pattern cho giao tiếp liên module.
- **ADR-008:** Phân định ranh giới Party 360 (Identity vs Business Role).
- **ADR-009:** Kiến trúc Document & Workflow Foundation dùng chung.
- **ADR-010:** Concurrency Control với RowVersion Base64 trên cả Web API và Frontend.

---

## 7. FOUNDATION FINAL READINESS REPORT

### Tuyên bố Tuân thủ Quyết định Product Owner:
1. Đội ngũ kiến trúc và phát triển **đã tuân thủ 100% quyết định của PO**: Không tạo màn hình CRUD giả lập hay bắt đầu code trước các business modules (CRM, Tuyển sinh, Đào tạo, Du học, Tài chính).
2. Toàn bộ tài nguyên đã được tập trung hoàn thiện và kiểm thử thành công 2 phân hệ cốt lõi:
   - **`FND-01` — GroupUser Management UI & Scope Assignment**
   - **`FND-02` — Audit Log Management & Viewer**
3. Cả 2 hệ thống Backend (.NET 10) và Frontend (Vite + React 18 TypeScript strict) đều biên dịch thành công 0 error và pass 69/69 automated security tests.

### Kiến nghị trình duyệt:
Kính trình Product Owner xem xét, nghiệm thu **Foundation Architecture Gate** để chính thức cho phép chuyển sang giai đoạn phát triển các phân hệ nghiệp vụ tiếp theo của SHD OneERP.

