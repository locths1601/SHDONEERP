# SHD OneERP — RULE COMPLIANCE MATRIX
## GATE-00: Khảo sát Quy tắc Kỹ thuật & Đối chiếu Tuân thủ Hệ thống

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày thực hiện:** 2026-10-30  
**Người thực hiện:** Master AI Agent Orchestrator  
**Trạng thái cổng:** `GATE-00` — Baseline Audit  
**Tài liệu tham chiếu:** `.cursor/rules/*.mdc`, `docs/implementation/student-dossier/*`

---

## 1. TỔNG QUAN KHẢO SÁT QUY TẮC (.cursor/rules/)

Toàn bộ thư mục `.cursor/rules/` trong repository đã được quét, đọc và kiểm toán trực tiếp từng dòng. Kết quả xác nhận **10/10 file quy tắc tồn tại thực tế**, không có file nào bị thiếu trong danh mục quy chuẩn.

### Bảng kiểm kê hiện trạng tệp quy tắc

| STT | Tên tệp quy tắc | Mô tả chính thức | Globs | alwaysApply | Trạng thái Repo |
|:---:|---|---|---|:---:|:---:|
| 1 | [`00-stack-reality.mdc`](file:///.cursor/rules/00-stack-reality.mdc) | Quy định về công nghệ, kiến trúc và giới hạn hệ thống SHD OneERP | `**/*` | Default (true) | **TỒN TẠI (27 dòng)** |
| 2 | [`10-migration-workflow.mdc`](file:///.cursor/rules/10-migration-workflow.mdc) | Quy chuẩn quản lý Database Migrations viết tay và Migration Runner | `database/**/*`, `backend/**/*.sql` | Default (true) | **TỒN TẠI (20 dòng)** |
| 3 | [`15-backend-stored-procedure.mdc`](file:///.cursor/rules/15-backend-stored-procedure.mdc) | Quy định viết và thực thi Stored Procedure cho Read-side | `backend/**/*.cs`, `database/**/*.sql` | Default (true) | **TỒN TẠI (17 dòng)** |
| 4 | [`20-frontend-component-rules.mdc`](file:///.cursor/rules/20-frontend-component-rules.mdc) | Quy định cấu trúc components và reusable patterns ở Frontend | `frontend/**/*` | Default (true) | **TỒN TẠI (21 dòng)** |
| 5 | [`25-ui-ux-experience.mdc`](file:///.cursor/rules/25-ui-ux-experience.mdc) | Tiêu chuẩn trải nghiệm người dùng enterprise và quản lý trạng thái UI | `frontend/**/*` | Default (true) | **TỒN TẠI (24 dòng)** |
| 6 | [`30-bug-fix-protocol.mdc`](file:///.cursor/rules/30-bug-fix-protocol.mdc) | Quy trình kiểm tra, sửa lỗi và đảm bảo chất lượng code | `**/*` | Default (true) | **TỒN TẠI (17 dòng)** |
| 7 | [`40-permission-codes.mdc`](file:///.cursor/rules/40-permission-codes.mdc) | Quy chuẩn định nghĩa và quản lý mã quyền và Direct GBAC | `**/*` | Default (true) | **TỒN TẠI (31 dòng)** |
| 8 | [`50-do-and-dont.mdc`](file:///.cursor/rules/50-do-and-dont.mdc) | Các nguyên tắc Bắt buộc Làm (DO) và Tuyệt đối Cấm (DON'T) | `**/*` | Default (true) | **TỒN TẠI (24 dòng)** |
| 9 | [`60-shdoneerp-student-dossier-compliance.mdc`](file:///.cursor/rules/60-shdoneerp-student-dossier-compliance.mdc) | Bắt buộc tuân thủ rule hiện hữu, bảo vệ domain ownership, GBAC, SP GET, UX, evidence | `backend/**`, `database/**`, `frontend/src/**`, `docs/**` | `false` | **TỒN TẠI (48 dòng)** |
| 10 | [`99-reference-index.mdc`](file:///.cursor/rules/99-reference-index.mdc) | Chỉ mục tham chiếu toàn bộ bộ quy tắc và tiêu chuẩn kỹ thuật | `**/*` | Default (true) | **TỒN TẠI (37 dòng)** |

---

## 2. MA TRẬN ĐỐI CHIẾU TUÂN THỦ QUY TẮC (COMPLIANCE MATRIX)

Bảng dưới đây đánh giá tính tuân thủ của codebase hiện tại đối với từng quy tắc và xác định cách thức áp dụng bắt buộc cho User Story đầu tiên: `SYS-REF-01 — Quản lý nhóm danh mục`.

| Quy tắc | Áp dụng cho SYS-REF-01? | Trạng thái Hiện trạng Repo | Phân tích Tuân thủ & Bằng chứng Baseline | Kế hoạch Thực thi bắt buộc cho SYS-REF-01 |
|---|:---:|:---:|---|---|
| **00-stack-reality** | **BẮT BUỘC** | **COMPLIANT** | Backend là .NET 10, Clean Architecture. Frontend là React 18, Vite, Tailwind. CQRS split: Write qua EF, Query qua SP. Đã biên dịch pass cả 2 phía. | - Domain: entity `ReferenceDataCatalog` trong `ShdOneErp.Domain`.<br>- App: CQRS commands/queries trong `ShdOneErp.Application`.<br>- Infra: `ISpExecutor` cho GET, EF Core cho Write.<br>- Api: Controller chuẩn REST trong `ShdOneErp.Api`. |
| **10-migration-workflow** | **BẮT BUỘC** | **PARTIAL / DRIFT** | Migration viết tay trong `database/migrations/`. Runner `run-migrations.ps1` tồn tại. Bảng `__DbMigrationHistory` đã có. Tuy nhiên, migration `0015` chưa được áp dụng vào SQL Server thật. | - Tạo migration mới `20261030_0016_ReferenceDataCatalogSchemaAndSp.sql`.<br>- Tuyệt đối không dùng `dotnet ef migrations`.<br>- Script phải idempotent (`IF NOT EXISTS...`).<br>- Chạy qua `run-migrations.ps1` và kiểm chứng trên SQL Server thật trước khi báo DONE. |
| **15-backend-stored-procedure** | **BẮT BUỘC** | **COMPLIANT (Quy chuẩn)** | Các API GET hiện hữu đều có SP (vd `sp_Party_Student_GetPagedList`). Tuyệt đối không dùng LINQ to Entities cho business GET. | - Viết SP: `sp_System_ReferenceData_Catalog_GetPagedList` và `sp_System_ReferenceData_Catalog_GetById`.<br>- Tham số: `@SearchTerm`, `@Status`, `@OwnerModule`, `@PageNumber`, `@PageSize`, `@SortBy`, `@SortOrder`.<br>- Trả kèm `TotalCount` an toàn qua parameterized SQL, không ghép chuỗi SQL động. |
| **20-frontend-component-rules** | **BẮT BUỘC** | **COMPLIANT** | Có sẵn thư mục `frontend/src/components/common/` gồm `PageContainer`, `Card`, `ListToolbar`, `DataGrid`, `SideDrawer`, `ConfirmDialog`, `Can`. | - UI SYS-REF-01 phải đặt tại `frontend/src/features/system-reference-data/`.<br>- Sử dụng toàn bộ common components hiện có.<br>- Quản lý cache và server state bằng TanStack Query (`useQuery`, `useMutation`), không dùng `fetch`/`axios` trực tiếp trong component. |
| **25-ui-ux-experience** | **BẮT BUỘC** | **COMPLIANT (Quy chuẩn)** | Quy chuẩn 6 trạng thái UI: Loading (Skeleton), Empty, Error (thông điệp + retry), Success/Data, 403 Forbidden, 409 Conflict. | - Triển khai đầy đủ cả 6 trạng thái trên màn hình Danh mục.<br>- Xóa/ngừng dùng phải qua `ConfirmDialog`.<br>- Giữ filter/search khi phân trang.<br>- Hiển thị tiếng Việt chuẩn doanh nghiệp. |
| **30-bug-fix-protocol** | **BẮT BUỘC** | **COMPLIANT** | Kiểm soát build pass, test pass, không commit password/secrets. | - Mọi chức năng mới phải có Unit test cho Business Rules (AC01-AC05).<br>- Test duplicate code, test validation, test concurrency (RowVersion 409). |
| **40-permission-codes** | **BẮT BUỘC** | **COMPLIANT** | Quy chuẩn Direct GBAC v4.2 `{module}.{resource}.{action}`. Deny-by-default. | - Định nghĩa mã quyền chuẩn:<br>  + `system.reference_data.view`<br>  + `system.reference_data.manage`<br>- Gắn `[Authorize(Policy = "...")]` trên Controller.<br>- Seed quyền vào `Identity_Permissions` và gán cho nhóm `ADMINISTRATORS`. |
| **50-do-and-dont** | **BẮT BUỘC** | **COMPLIANT** | Cấm logic trong Controller; cấm LINQ cho GET; cấm hardcode Admin ID số cứng; cấm mock UI giả tạo. | - Controller mỏng, uỷ thác cho Application handlers.<br>- Có `RowVersion` kiểm tra Optimistic Concurrency.<br>- Lỗi trả về chuẩn `{ code, message, errors, traceId }`. |
| **60-shdoneerp-student-dossier-compliance** | **BẮT BUỘC** | **COMPLIANT** | Preflight bắt buộc; kiểm tra domain ownership; không tạo duplicate entity; không branch/commit/push nếu chưa có lệnh của PO. | - Tuân thủ nguyên tắc Reference Data: không hardcode dữ liệu danh mục trong mã nguồn; quản lý qua UI/API.<br>- Phân biệt rõ Reference Data với Workflow/Checklist transaction data. |
| **99-reference-index** | **THAM CHIẾU** | **COMPLIANT** | Mục lục tra cứu tài liệu và quy tắc toàn hệ thống. | - Dùng để tra cứu nhanh các ADR và API conventions chuẩn. |

---

## 3. CÔ LẬP VÀ PHÒNG NGỪA XUNG ĐỘT TỪ TÀI LIỆU CŨ (ezHR / OneHR)

Một rủi ro phổ biến khi kế thừa các tài liệu tham khảo là sự xâm nhập của các quy ước hoặc mã định danh của hệ thống cũ (ezHR / OneHR). Master Agent đã rà soát và thiết lập hàng rào ngăn ngừa tuyệt đối:

### Danh mục các điểm xung đột tiềm tàng & Biện pháp cách ly

1. **Về Mã Quyền & Nhóm Người Dùng (User Groups):**
   - *Rủi ro cũ:* Hardcode ID số cứng như `UserGroupId == 4`, `UserGroupId == 1` hoặc nhóm `HR_MANAGER`.
   - *Quy chuẩn SHD OneERP:* Tuyệt đối không dùng ID số cứng. Nhóm quản trị hệ thống được định danh duy nhất bằng Code `ADMINISTRATORS`. Phân quyền sử dụng Direct GBAC v4.2 dựa trên mã quyền chuẩn `{module}.{resource}.{action}`.
2. **Về Cấu Trúc Bảng Database:**
   - *Rủi ro cũ:* Các bảng `dbo.Permissions`, `dbo.UserRoles`, `dbo.Emp_*`, `dbo.Sys_UserGroups`, `dbo.Project*`.
   - *Quy chuẩn SHD OneERP:* Tên bảng phân hệ Identity/Access có tiền tố rõ ràng: `Identity_Users`, `Identity_UserGroups`, `Identity_UserGroupMembers`, `Identity_Permissions`, `Identity_UserGroupPermissions`. Không có bảng nào thuộc phân hệ nhân sự cũ.
3. **Về Định Tuyến Frontend:**
   - *Rủi ro cũ:* Route `/admin/permissions` hoặc `/hrm/*`.
   - *Quy chuẩn SHD OneERP:* Định tuyến chuẩn: `/admin/identity/users`, `/admin/identity/groups`, `/admin/reference-data`.
4. **Về Phạm Vi Dữ Liệu (Data Scope):**
   - *Rủi ro cũ:* Filter dữ liệu theo `ProjectId` hoặc `DepartmentId`.
   - *Quy chuẩn SHD OneERP:* Cấu trúc tổ chức 4 cấp rõ ràng: `Global` -> `LegalEntity` -> `BusinessUnit` -> `Branch`.

---

## 4. QUY TRÌNH KIỂM SOÁT THAO TÁC GIT & MÔI TRƯỜNG

Theo chỉ thị nghiêm ngặt của Product Owner và tài liệu `04_AI_AGENT_ORCHESTRATION.md`:
1. **Lệnh Cấm Thao Tác Git:**
   - Tuyệt đối **KHÔNG** tạo branch mới (`git branch`, `git checkout -b`).
   - Tuyệt đối **KHÔNG** tạo worktree (`git worktree`).
   - Tuyệt đối **KHÔNG** commit (`git commit`).
   - Tuyệt đối **KHÔNG** push hoặc pull (`git push`, `git pull`).
   - Tuyệt đối **KHÔNG** reset, clean hoặc stash (`git reset`, `git clean`, `git stash`).
   - Mọi công việc hiện tại thực hiện trực tiếp trên working directory hiện hành của repository.
2. **Quy Chuẩn Báo Cáo & Nghiệm Thu:**
   - 152 unit tests pass trên in-memory **chưa được coi là nghiệm thu**.
   - Mọi thay đổi database bắt buộc phải có SQL script kiểm chứng trên SQL Server `localhost` database `ShdOneErpDb`.
   - Nghiệm thu tính năng thuộc thẩm quyền duy nhất của Senior Product Owner qua các mốc bàn giao có bằng chứng thực tế (Test Evidence).

---

## 5. TÁC ĐỘNG CỦA CÁC QUYẾT ĐỊNH PO CHƯA CHỐT (OPEN PO DECISIONS)

Đối với `SYS-REF-01`, có 2 quyết định nghiệp vụ cần PO chính thức phê duyệt trước hoặc trong bước triển khai:

1. **PO-001 (Ai được phép tạo nhóm danh mục?):**
   - *Đề xuất mặc định:* Chỉ người dùng thuộc nhóm `ADMINISTRATORS` hoặc có quyền `system.reference_data.manage` mới được tạo/sửa nhóm danh mục. Các nhóm danh mục có cờ `ManagementMode = SYSTEM_CONTROLLED` (ảnh hưởng logic cốt lõi) sẽ bị khóa đổi mã code từ UI.
2. **PO-002 (Phạm vi Scope của danh mục?):**
   - *Đề xuất mặc định:* Giai đoạn đầu (Sprint 1), toàn bộ Catalog được thiết lập `ScopePolicy = GLOBAL` dùng chung cho toàn bộ tập đoàn và các công ty thành viên. Cấu trúc DB thiết kế sẵn trường `ScopePolicy` để mở rộng `LEGAL_ENTITY` hoặc `MARKET` khi có yêu cầu cụ thể mà không làm gãy schema.

---

## 6. KẾT LUẬN & ĐÁNH GIÁ SẴN SÀNG CỦA HÀNG RÀO QUY TẮC

- **Bộ quy tắc:** 10/10 file `.cursor/rules/*.mdc` đã được xác minh toàn vẹn và hiểu sâu sắc.
- **Hàng rào an toàn:** Đã thiết lập cơ chế chặn xung đột ezHR/OneHR, cấm EF migrations, cấm dynamic SQL, bảo vệ Direct GBAC và cấm vi phạm Git commands.
- **Trạng thái tuân thủ:** **PASSED GATE-00 RULE AUDIT** — Sẵn sàng chuyển sang đề xuất hợp đồng kỹ thuật cho `SYS-REF-01`.

