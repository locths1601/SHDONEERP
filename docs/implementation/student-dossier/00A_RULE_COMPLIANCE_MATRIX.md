# SHD OneERP — 00A. RULE COMPLIANCE MATRIX
## STU-01 Student Profile Management & ADM-01 Student Application & Dossier

**Ngày lập:** 2026-10-29  
**Người phụ trách:** Master Orchestrator & All Sub-Agents (SA-00 to SA-05)  
**Trạng thái Gate R0:** `RULES_ACKNOWLEDGED` — Toàn bộ quy tắc trong repository đã được kiểm tra thực tế.

---

### 1. BẢNG INVENTORY VÀ ĐỐI CHIẾU QUY TẮC (.cursor/rules/*.mdc)

| File `.cursor/rules/` | Globs | Trạng thái | Agent bắt buộc | Kiểm soát cốt lõi & Cách kiểm chứng |
|---|---|---|---|---|
| [`00-stack-reality.mdc`](file:///.cursor/rules/00-stack-reality.mdc) | `**/*` | `PASS` | Master, SA-00..05 | Backend .NET 10 Web API, Clean Architecture, Write-side EF Core, Read-side Stored Procedures qua `ISpExecutor`. Frontend React 18, TypeScript strict, Vite, Tailwind CSS, TanStack Query, Zustand. |
| [`10-migration-workflow.mdc`](file:///.cursor/rules/10-migration-workflow.mdc) | `database/**/*`, `backend/**/*.sql` | `PASS` | Master, SA-01..03, SA-05 | 100% SQL migration viết tay trong `database/migrations/`. Đặt tên chuẩn `YYYYMMDD_HHMM_*.sql`. Tuyệt đối không dùng `Database.Migrate()` hay EF Migrations. Tính idempotent (`IF NOT EXISTS`). Bảng lịch sử `__DbMigrationHistory`. |
| [`15-backend-stored-procedure.mdc`](file:///.cursor/rules/15-backend-stored-procedure.mdc) | `backend/**/*.cs`, `database/**/*.sql` | `PASS` | Master, SA-01..03, SA-05 | Toàn bộ API GET nghiệp vụ bắt buộc dùng Stored Procedure (`sp_{Module}_{Resource}_{Action}`). Phân trang, lọc, sắp xếp tại SQL. Parametric an toàn, không Dynamic SQL ghép chuỗi. Tham số `@CurrentUserId` bắt buộc để kiểm soát Data Scope fail-closed. |
| [`20-frontend-component-rules.mdc`](file:///.cursor/rules/20-frontend-component-rules.mdc) | `frontend/**/*` | `PASS` | Master, SA-04, SA-05 | Tái sử dụng components chung tại `frontend/src/components/common/` (`Button`, `Card`, `PageContainer`, `ListToolbar`, `DataGrid`, `Modal`, `SideDrawer`, `ConfirmDialog`, `Skeleton`, `EmptyState`, `ErrorBoundary`, `Can`, `RequireAuth`). Module-first directory `frontend/src/features/{module}/`. |
| [`25-ui-ux-experience.mdc`](file:///.cursor/rules/25-ui-ux-experience.mdc) | `frontend/**/*` | `PASS` | Master, SA-04, SA-05 | Đầy đủ 6 trạng thái UI: Loading, Empty, Error, Success/Data, Forbidden (403), Conflict (409). Giữ trạng thái bộ lọc/tìm kiếm. Không dùng `alert()`/`confirm()`, dùng `ConfirmDialog`. Hỗ trợ Dark/Light mode, tiếng Việt. |
| [`30-bug-fix-protocol.mdc`](file:///.cursor/rules/30-bug-fix-protocol.mdc) | `**/*` | `PASS` | Tất cả | Quy trình Root Cause Analysis (RCA), kiểm thử hồi quy trước khi bàn giao. Zero compiler errors/warnings nghiêm trọng. TypeScript strict clean. Migration tuần tự an toàn. |
| [`40-permission-codes.mdc`](file:///.cursor/rules/40-permission-codes.mdc) | `**/*` | `PASS` | Master, SA-01..05 | Chuẩn mã quyền Direct GBAC v4.2: `{module}.{resource}.{action}`. Cấp quyền đa chiều theo Scope (Global, LegalEntity, BusinessUnit, Branch). Deny-by-default tại Backend Controller/Action. |
| [`50-do-and-dont.mdc`](file:///.cursor/rules/50-do-and-dont.mdc) | `**/*` | `PASS` | Tất cả | DO: persistent CQRS split, Clean Architecture, authorization backend, rowversion concurrency 409, traceId format, TBD status. DON'T: business logic in controller, EF LINQ on GET, EF migrations, hardcoded IDs, data leak cross-LE, fake runtime mock DONE. |
| [`60-shdoneerp-student-dossier-compliance.mdc`](file:///.cursor/rules/60-shdoneerp-student-dossier-compliance.mdc) | `backend/**`, `database/**`, `frontend/src/**` | `PASS` | Master, SA-00..05 | Quy tắc đặc thù STU-01/ADM-01: Không tạo module `STUDENT` trùng Party360. 1 người = 1 PartyId toàn hệ thống; 1 Party có nhiều StudentApplication. Phân quyền và Data Scope fail-closed. Không hardcode approval visa. |
| [`99-reference-index.mdc`](file:///.cursor/rules/99-reference-index.mdc) | `**/*` | `PASS` | Master, SA-00..05 | Chỉ mục tham chiếu tài liệu nguồn `docs/00_PROJECT_VISION.md` đến `docs/21_MODULE_AND_FEATURE_REGISTRY_FOUNDATION.md`. |

---

### 2. PHÂN TÍCH XUNG ĐỘT QUY TẮC & MÃ DỰ ÁN KHÁC (ezHR / OneHR)

| Điểm nghi vấn | Thực tế trong repository SHDONEERP | Quyết định xử lý |
|---|---|---|
| Thư mục `frontend/src/components/common/common/` chứa các file từ ezHR (`AuthBootstrap`, `ViewProjectButton`, `@dnd-kit`, `usePermission`). | Không có file nào trong hệ thống SHD OneERP import từ thư mục này. Các common components chính thức nằm ngay tại `frontend/src/components/common/`. | Loại bỏ khỏi phạm vi compile (`tsconfig.json exclude`), không sử dụng các file ezHR này. |
| Tham số phân quyền `UserGroupId = 4` hoặc hardcoded Role. | Mô hình Direct GBAC v4.2 của SHD: `User -> UserGroupMember -> UserGroup -> UserGroupPermission -> Permission`, nhóm Admin nhận diện bằng mã `ADMINISTRATORS`. | Tuyệt đối tuân thủ mô hình GBAC v4.2 của SHD. Không dùng ID cứng. |
| Tra cứu lookup không kiểm tra Data Scope. | Quy tắc SHD OneERP yêu cầu deny-by-default và kiểm tra quyền kèm Scope tại backend. | Áp dụng Stored Procedure với `@CurrentUserId` kiểm tra quyền theo pháp nhân và nhóm người dùng. |

---

### 3. MA TRẬN PHÂN CÔNG VÀ CHỈ TIÊU TUÂN THỦ CHO SUB-AGENTS

| Sub-Agent | Work Package | Rules bắt buộc | Tiêu chí nghiệm thu tuân thủ | Trạng thái |
|---|---|---|---|---|
| **SA-00** | Architecture Inventory & API Contract Auditor | `00-stack`, `10-migration`, `15-SP`, `40-permission`, `60-compliance`, `99-reference` | Khảo sát 100% mã nguồn, DB migrations, DTOs, interface, xác nhận gap thực tế. Không sửa code nghiệp vụ. | `PASS` |
| **SA-01** | STU-01 Party360 / Student Profile Backend | `00-stack`, `10-migration`, `15-SP`, `40-permission`, `50-do-dont`, `60-compliance` | Tái sử dụng `Party`, `Person`, `PartyRole`, `PartyContactMethod`. Bổ sung `PartyIdentification`, SP `sp_Party_Student_GetPagedList` & PII masking, validator, test pass. | `IN_PROGRESS` |
| **SA-02** | ADM-01 Student Application Backend | `00-stack`, `10-migration`, `15-SP`, `40-permission`, `50-do-dont`, `60-compliance` | Domain `StudentApplication` thuộc `AdmissionVisa`. 1 Party - N Applications. SP `sp_Admission_Application_GetPagedList`. Optimistic Concurrency 409. | `PENDING` |
| **SA-03** | Checklist & Documents Integration | `00-stack`, `10-migration`, `15-SP`, `40-permission`, `50-do-dont`, `60-compliance` | Domain `ChecklistItem`, `ApplicationDocumentLink`. Hiện thực hóa `IDocumentStorageService` an toàn (SHA256, path traversal protection). | `PENDING` |
| **SA-04** | Student Workspace React Frontend | `00-stack`, `20-frontend`, `25-ui-ux`, `50-do-dont`, `60-compliance` | Thư mục `features/studentWorkspace/`. Sử dụng `common/*`. Đủ 6 trạng thái UI. Nối API thật, TanStack Query, form Zod. | `PENDING` |
| **SA-05** | Security & E2E QA | `30-bug-fix`, `40-permission`, `50-do-dont`, `60-compliance` | Kiểm thử multi-company isolation, PII masking, fail-closed security, concurrency, automated test suite pass 100%. | `PENDING` |
| **MASTER** | Integration & Release Coordinator | Toàn bộ rules | Kiểm soát shared files (`DbContext`, `Program.cs`, routing, migrations `0015_...`). Đảm bảo `dotnet build` 0 error, tests pass, FE build pass. | `IN_PROGRESS` |

