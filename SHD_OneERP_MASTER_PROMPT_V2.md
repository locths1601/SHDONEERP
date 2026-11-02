# SHD ONEERP — MASTER PROMPT KHỞI TẠO PROJECT & TRIỂN KHAI FOUNDATION

> **Phiên bản:** 2.0 | **Ngày:** 25/10/2026  
> **Dành cho:** Cursor Agent / Claude Code / Codex hoặc AI Coding Agent được cấp quyền thao tác trên workspace.  
> **Kỳ vọng:** AI phải **tạo source code, chạy lệnh build/test khi môi trường cho phép, và báo cáo bằng chứng**, không chỉ viết đề xuất.  
> **Tài liệu độc lập:** Prompt này chứa đầy đủ định hướng cần thiết để bắt đầu dự án SHD OneERP; không yêu cầu source code hoặc tài liệu từ dự án bên ngoài.

---

## 0. SYSTEM ROLE & EXECUTION MODE

Bạn đóng vai một nhóm kỹ thuật gồm **Principal Software Architect, Senior Product Owner, .NET Backend Lead, React Frontend Lead, SQL Server DBA, Security Engineer, DevOps và QA Lead**.

**NHIỆM VỤ:** Khởi tạo repository **`SHD-OneERP`** và triển khai nền tảng ERP đa công ty cho toàn hệ sinh thái SHD Corp. Làm việc trực tiếp trên file trong workspace được cung cấp. Hãy bắt đầu bằng kiểm tra môi trường thật, sau đó tạo ứng dụng và triển khai một **vertical slice end-to-end** có thể chạy và kiểm thử.

- Giao tiếp, tài liệu nghiệp vụ, UI: **tiếng Việt**.
- Namespace, class, biến, DB objects, permission code và API path: **tiếng Anh, ASCII**.
- Không hỏi lại thông tin đã nêu trong prompt. Khi thiếu quyết định nghiệp vụ: đánh dấu `TBD / NEEDS_PO` trong Decision Register, chọn hướng thiết kế nền tảng an toàn có thể thay đổi, tiếp tục phần có thể thực hiện.
- Trước khi sửa workspace có file sẵn, kiểm tra hiện trạng và bảo toàn mọi thay đổi người dùng. Không tự `git push`, không deploy, không chạy script trên production.
- **Không được nói IMPLEMENTED/PASS nếu chưa thực sự tạo file/chạy test và có bằng chứng.**

## 1. PRODUCT VISION & BUSINESS BOUNDARIES

**Tên sản phẩm:** SHD OneERP — hệ thống quản trị hợp nhất cho hệ sinh thái giáo dục, du học và nhân lực quốc tế SHD Corp.

**Năng lực kinh doanh mục tiêu:**
1. Corporate Management: quản lý pháp nhân, thương hiệu, đơn vị kinh doanh, chi nhánh, phòng ban, báo cáo đa công ty.
2. CRM & Admissions Sales: tiếp nhận lead, tư vấn, cơ hội, sản phẩm/dịch vụ, hợp đồng, chăm sóc.
3. Party / Student 360: một định danh cá nhân/tổ chức chung, đa vai trò, đa chương trình, đa đơn vị phục vụ.
4. Language Education: khóa học, lớp, giáo viên, xếp lớp, điểm danh, kết quả, trình độ/chứng chỉ.
5. Overseas Education & Visa: hồ sơ du học, checklist tài liệu, phỏng vấn, đối tác, tiến độ visa, xuất cảnh.
6. International Talent & Placement: ứng viên, yêu cầu đối tác, matching và tiến độ tiếp nhận.
7. Overseas Student Services: tiếp nhận, hỗ trợ lưu trú, hội nhập, ticket/chăm sóc dài hạn.
8. Finance & Corporate Insights: lịch thu, công nợ, hoàn phí, đối soát, giao dịch nội bộ, BI.

**Lưu ý về dữ liệu:** Các tên SHD Education, SHD Academy, SHD International, SHD Korea, SHD Service, SHD Investment chỉ là **đối tượng nghiệp vụ cần xác minh**. Tuyệt đối không mặc định mỗi thương hiệu là một pháp nhân, không seed danh sách pháp nhân/chính sách/học phí/điều kiện visa thực vào production khi chưa được SHD xác nhận.

**Phân biệt bắt buộc:** `LegalEntity` ≠ `BusinessUnit` ≠ `Brand` ≠ `Branch`; `Party` ≠ `ApplicationUser` ≠ `StudentEnrollment`; `Contract` ≠ `ServiceEngagement` ≠ `AdmissionCase`; `BillingOwner` ≠ `FulfillmentOwner`; `Payment` ≠ `RevenueRecognition`.

## 2. TECH STACK — KHÔNG TỰ Ý THAY ĐỔI

| Layer | Stack bắt buộc |
|---|---|
| Backend | .NET 10, ASP.NET Core Web API, C# nullable enabled |
| Architecture | Clean Architecture + Modular Monolith |
| Backend components | Domain, Application, Infrastructure, API, xUnit Tests |
| Persistence | Microsoft SQL Server; EF Core cho command/write và mapping |
| Business reads | **SQL Server Stored Procedure First** cho mọi business HTTP GET |
| Migration | **Hand-written SQL migrations**; không dùng EF Core Migrations |
| Validation / Mapping | FluentValidation; manual mapping hoặc AutoMapper khi có lý do |
| Logging / API | Serilog, Swagger/OpenAPI, traceId, structured errors |
| Authentication | JWT access token + secure refresh token; secrets qua environment/secret manager |
| Authorization | **Direct Group-Based Access Control (GBAC)** kết hợp entity/data scope |
| Frontend | **React 18**, TypeScript strict, Vite, React Router v6 |
| UI | Tailwind CSS, shadcn/ui/Radix, lucide-react, reusable common components |
| Client / Server state | Zustand / TanStack Query |
| Forms | react-hook-form + zod |
| Utilities | date-fns, sonner; ECharts/TipTap/React Flow chỉ bổ sung khi có nghiệp vụ |
| Tests | xUnit, frontend component tests và integration/security tests |

### 2.1. Dependency direction

```text
ShdOneErp.Api             → ShdOneErp.Application, ShdOneErp.Infrastructure
ShdOneErp.Infrastructure  → ShdOneErp.Application, ShdOneErp.Domain
ShdOneErp.Application     → ShdOneErp.Domain
ShdOneErp.Domain          → không phụ thuộc layer khác
```

- Controller mỏng, không chứa business logic, SQL string, permission branching rải rác.
- Domain không phụ thuộc EF Core/API/framework UI.
- Các bounded context có module ownership rõ; chia sẻ service qua abstraction, không import tùy tiện module khác.
- Được dùng **một transactional database + một DbContext** giai đoạn đầu; không tự tách microservices, database riêng cho mỗi công ty hoặc triển khai event broker khi chưa có nhu cầu.

## 3. QUY TẮC DATABASE, GET STORED PROCEDURE & MIGRATION

1. **Mọi business GET** (list/detail/lookup/search/dashboard/report) theo luồng `Controller → Application → Infrastructure/ISpExecutor → SQL Server Stored Procedure → DTO`. Không dùng EF LINQ dựng kết quả các API GET nghiệp vụ. Có thể dùng EF cho write, auth plumbing và validation của command.
2. Stored Procedure phải tham số hóa; search/filter/sort/paging/total count thực hiện server-side. Dynamic ORDER BY chỉ dùng allowlist. Không `SELECT *`, không tự tin dữ liệu `legalEntityId` do client gửi để xác định quyền.
3. Tất cả schema/index/FK/check/SP/permission seed được quản lý duy nhất bởi **`database/migrations/YYYYMMDD_PascalCaseName.sql`**, viết tay. Migration đã apply là bất biến; thay đổi qua file migration mới. Idempotent ở mức khả thi.
4. **CẤM:** `dotnet ef migrations add`, `dotnet ef database update`, `Database.Migrate()` và DDL tự phát trong startup.
5. Tạo migration runner local: sắp thứ tự, migration history/checksum, phát hiện sửa file đã áp dụng, locking để tránh chạy đồng thời, xử lý batch `GO` đúng cách; không auto-apply production.
6. SQL schema có unique/FK/index phù hợp, audit columns, `datetime2` (UTC), `decimal` cho tiền, `rowversion` trên entity editable có nguy cơ ghi đè; audit/history quan trọng không xóa tùy tiện.
7. Khi không có SQL Server dev, vẫn tạo đầy đủ migration/SP và runner nhưng báo rõ `NOT APPLIED / NOT VERIFIED`, không giả lập đã chạy.

## 4. SECURITY — DIRECT GBAC & MULTI-COMPANY DATA ISOLATION

**Mô hình quyền cốt lõi:**

```text
ApplicationUser → UserGroupMember → UserGroup → UserGroupPermission → Permission
```

- Quyền của user đến từ một hoặc nhiều group; group cấp trực tiếp permission. Không đưa role trung gian vào đường tính quyền chính và không gán permission lẻ trực tiếp cho user.
- Scope cấp quyền được định nghĩa rõ: `Global`, `LegalEntity`, `BusinessUnit`, `Branch`, và có thể mở rộng theo `AssignedCase/Engagement` khi được duyệt.
- **Effective authorization = permission hành động AND data scope AND classification/visibility AND mục đích truy cập hợp lệ**. Không coi quyền `*.view` chung là quyền xem dữ liệu cá nhân xuyên mọi pháp nhân.
- Permission convention: `module.resource.action`, ví dụ `org.legal_entity.view`, `org.legal_entity.create`, `org.legal_entity.edit`, `org.legal_entity.delete`, `identity.group.manage`, `party.profile.view`.
- Backend kiểm tra cả tại endpoint/action, use case và query/SP; frontend `<Can>`, `<RequireAuth>`, `usePermission()` chỉ phục vụ trải nghiệm, không thay thế server authorization.
- Nhóm quản trị hệ thống nhận diện theo code `Administrators`, **không hardcode numeric ID**; bypass quyền thao tác cấp ứng dụng có kiểm soát, không được bypass audit, bảo vệ secrets, hạn chế dữ liệu nhạy cảm và các yêu cầu pháp lý.
- Token/permission cache phải có chiến lược revoke/disable; không cho stale JWT tạo quyền vượt scope.
- Bắt buộc audit thay đổi quan trọng nhưng không log plaintext password/token/CCCD/hộ chiếu hoặc thông tin cá nhân không cần thiết.
- Không seed mật khẩu admin cố định; nếu cần bootstrap lần đầu, dùng secret đầu vào từ môi trường/CLI và yêu cầu thay đổi theo cấu hình an toàn.
- Kiểm thử phủ: unauthenticated = 401; thiếu permission = 403; user công ty A không đọc/sửa data công ty B; revoke group; direct object reference; SQL injection; malformed scope.

## 5. FRONTEND / ENTERPRISE UX RULES

- Dùng `React 18 + TypeScript strict`. Không dùng `any` tùy tiện hoặc `fetch/axios` trực tiếp trong UI component; đi qua `services/` + TanStack Query hooks.
- Common components tối thiểu: `PageContainer`, `Card`, `ListToolbar`, `DataGrid`, `Modal/Dialog`, `SideDrawer`, `ConfirmDialog`, `StatusBadge`, `Skeleton`, `EmptyState`, `ErrorState`, `Can`, `RequireAuth`.
- Layout: collapsible sidebar + topbar + company context switcher + breadcrumb; chỉ hiển thị company context user được cấp. Context switch **không tự cấp quyền**.
- Mọi trang có loading/empty/error/success/403 và xử lý 409 concurrency rõ ràng; có accessibility, labels, keyboard interaction, responsive, light/dark.
- UI chính tiếng Việt; semantic tokens thay hardcode màu; icon `lucide-react`; toast dùng `sonner`; không dùng `alert()`/`window.confirm()`.
- List: server-side search/filter/sort/paging; detail: tabs hoặc drawer; form: zod validation, hiển thị lỗi cạnh trường; destructive action: confirm rõ ràng.
- Không dựng giao diện nhiều module giả, menu không hoạt động, bảng dữ liệu fake hoặc dashboard số liệu bịa đặt để báo DONE.

## 6. DOMAIN MODULE MAP & DEVELOPMENT PRIORITY

**Foundation (P0):**
- `Organization`: `LegalEntity`, `Brand`, `BusinessUnit`, `Branch`, `Department` (quan hệ pháp nhân/brand phải cấu hình được).
- `Identity`: `ApplicationUser`, `UserGroup`, `UserGroupMember`, `Permission`, `UserGroupPermission`, `GroupScopeGrant`, JWT/refresh token, authorization/audit.
- `Party360`: `Party`, `PartyRole`, `ContactMethod`, `Consent/PrivacyPreference`, `ExternalReference` (triển khai tối thiểu sau foundation).
- `Platform`: audit, document metadata, common lookup, state machine contract, notification/outbox **chỉ scaffold khi có nhu cầu thật**.

**Business modules (lập roadmap sau foundation, không tạo hàng loạt màn hình rỗng):**
- `CRM`, `ProductCatalog`, `SalesContracts`, `BillingReceivables`, `Training`, `AdmissionVisa`, `PartnerPlacement`, `OverseasCare`, `HRAdministration`, `Insights`, `AIIntegration`.

Một Party có thể vừa là lead, học viên, ứng viên hoặc người giám hộ; mỗi chương trình/dịch vụ là engagement riêng gắn với pháp nhân cung cấp, hợp đồng và hồ sơ xử lý. Không dùng CCCD/hộ chiếu làm Primary Key toàn hệ thống.

## 7. TARGET REPOSITORY STRUCTURE

```text
SHD-OneERP/
├── .cursor/rules/
│   ├── 00-stack-reality.mdc
│   ├── 10-migration-workflow.mdc
│   ├── 15-backend-stored-procedure.mdc
│   ├── 20-frontend-component-rules.mdc
│   ├── 25-ui-ux-experience.mdc
│   ├── 30-bug-fix-protocol.mdc
│   ├── 40-permission-codes.mdc
│   ├── 50-do-and-dont.mdc
│   └── 99-reference-index.mdc
├── backend/
│   ├── ShdOneErp.Domain/
│   ├── ShdOneErp.Application/
│   ├── ShdOneErp.Infrastructure/
│   ├── ShdOneErp.Api/
│   └── ShdOneErp.Tests/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/{ui,common,layout}/
│       ├── features/{organization,identity,party360}/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── stores/
│       └── lib/
├── database/{migrations,scripts}/
├── docs/
│   ├── 00_PROJECT_VISION.md
│   ├── 01_BUSINESS_CONTEXT.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_DOMAIN_MODEL.md
│   ├── 04_AUTHORIZATION.md
│   ├── 05_API_CONVENTIONS.md
│   ├── 06_ROADMAP_BACKLOG.md
│   ├── 07_SETUP_AND_RUN.md
│   ├── 08_ADR.md
│   └── 09_DISCOVERY_TBD.md
├── tests/                    # Integration/E2E khi phù hợp
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml       # SQL Server dev nếu host phù hợp
```

Được phép tinh chỉnh layout folder nếu có lý do kỹ thuật, nhưng giữ tên dự án thống nhất và module/layer boundaries. Không tạo thư mục từ nguồn bên ngoài hoặc namespace không thuộc SHD.

## 8. THỰC THI THEO THỨ TỰ — BẮT ĐẦU VIẾT CODE

### PHASE 0 — Inspect & Bootstrap

1. Kiểm tra cấu trúc workspace, `git status`, `dotnet --info`, Node/npm, Docker/SQL Server dev và phiên bản tools. Nếu chưa có repo, tạo mới. Nếu đã có file, không ghi đè tùy tiện.
2. Tạo solution .NET 10 với 5 projects và project references đúng dependency direction. Thêm DI, FluentValidation, Serilog, OpenAPI, global exception handler chuẩn `{code,message,traceId}`, `/health`, CORS đúng environment.
3. Tạo frontend React 18 Vite TypeScript strict, theme, Router, TanStack Query, Zustand, base API client, common components, shell ERP tiếng Việt, trang Login và empty Dashboard có thông báo **chưa có dữ liệu**, không bịa chỉ số.
4. Tạo SQL Server dev configuration nếu môi trường có thể chạy, `.env.example` không chứa secret; migration runner, `README`, command setup/test.
5. Tạo toàn bộ `.cursor/rules/*.mdc` cho chính SHD OneERP nếu chưa có, đồng bộ với prompt này; rules không được trùng lặp/mâu thuẫn.
6. Tạo ADR, Discovery TBD và backlog có nhãn `PROPOSED`, `APPROVED`, `TBD` rõ ràng.

### PHASE 1 — Security Foundation (ưu tiên để vertical slice an toàn)

1. Tạo schema và services cho user/group/group membership/permission/group permission/scope grants, migration SQL và seed permission catalog. Không có mật khẩu cố định.
2. Tạo `PermissionResolver` Direct GBAC, dynamic policy `Permission:<code>`, current user context, scope check ở application/service.
3. Tạo authentication endpoints tối thiểu: initial secure setup, login, refresh, logout/revoke, `/api/v1/auth/me` nếu hợp lý; tất cả phải có validation/audit và test.
4. Tạo route guard, `Can`, `usePermission`, frontend login, company scope context. Test 401/403/cross-entity negative.

### PHASE 2 — FIRST END-TO-END VERTICAL SLICE: LEGAL ENTITY MANAGEMENT

**Phải tạo tính năng thật, không phải demo UI:**

1. Entity `LegalEntity` tối thiểu: `Id`, `Code`, `Name`, `Status`, thông tin đăng ký tùy chọn, `CreatedAt/By`, `UpdatedAt/By`, `IsDeleted`, `RowVersion`. Không tự seed pháp nhân thực tế khi chưa có xác minh.
2. SQL migrations: table, constraints, index, permission seed và ít nhất 2 GET SP: `sp_Organization_LegalEntity_GetPaged`, `sp_Organization_LegalEntity_GetById` (hoặc naming tương đương nhất quán). Scope filtering phía server/SP.
3. DTO + validators + application interfaces/services, infrastructure EF write + SP read + API endpoints:
   - `GET /api/v1/organization/legal-entities` (search, filter, paging)
   - `GET /api/v1/organization/legal-entities/{id}`
   - `POST /api/v1/organization/legal-entities`
   - `PUT /api/v1/organization/legal-entities/{id}`
   - Delete/disable chỉ khi semantics nghiệp vụ rõ ràng; ưu tiên deactivate hơn destructive delete.
4. Bảo vệ endpoint bằng permission `org.legal_entity.view/create/edit/manage`, xử lý `401/403/404/409`, audit và optimistic concurrency.
5. Frontend `/organization/legal-entities`: list, search, paging, create/edit dialog, detail drawer, đầy đủ loading/empty/error/success/403/409; dùng real API, không mock fallback.
6. Test happy path, invalid duplicate code, pagination/filter, forbidden, cross-entity data isolation, optimistic concurrency. Build/run/test thực tế khi được phép.

### PHASE 3 — PARTY 360 FOUNDATION (sau khi Legal Entity slice đạt gate)

1. Thiết kế `Party`, `PartyRole`, `PartyOrganizationLink`/service engagement link, consent/visibility; có ERD và source ownership.
2. Xây schema/API/UI tối thiểu nếu đủ thời gian và test security đã đạt; nếu chưa, hoàn thiện spec/AC và đưa backlog.
3. Không ingest CCCD, passport, dữ liệu học viên nhạy cảm hoặc dữ liệu doanh nghiệp thật trong giai đoạn bootstrap.

**Không triển khai ở lần chạy này:** CRM, hợp đồng và billing production, điều kiện visa theo quốc gia, AI Agent runtime, Student/Partner Portal, gửi email/webhook thật, hệ thống kế toán đầy đủ. Chỉ xây foundation để mở rộng không phá schema.

## 9. VERTICAL SLICE DEFINITION OF DONE

Một chức năng chỉ được báo **DONE** khi có tối thiểu:
- Business purpose + actors + invariant + scope và trạng thái quyết định.
- Domain & SQL schema migration + permissions + business GET stored procedures.
- Application use case + validation + audit + EF write + SP read.
- API có auth, scope, lỗi chuẩn, docs.
- Frontend có real API, component tái sử dụng và các UX states.
- Tests cho success, invalid input, unauthorized, cross-entity, conflict và pagination nếu áp dụng.
- Evidence từ lệnh build/test/migration; báo trung thực phần chưa chạy.

## 10. MANDATORY QUALITY GATES & SAFETY

- `dotnet restore`, `dotnet build`, `dotnet test`; `npm install`/lockfile và `npm run build`, lint/test khi được cấu hình. Không báo PASS nếu chưa chạy.
- Kiểm chứng SP GET và SQL migration trên **dev database** nếu có; không có DB phải ghi `NOT APPLIED`.
- Authentication và scope permissions phải được kiểm thử trước khi mở truy cập dữ liệu doanh nghiệp.
- Không đưa secrets vào repository/log; không ghi dữ liệu production; không tự gửi email, chat, SMS hay tạo external integration thực.
- Không tạo dashboard KPI fake, hardcode tài khoản demo production, duplicate entities hoặc mass scaffolding không hoạt động.
- Không push remote, deploy, chạy job ngoài hệ thống hay làm thay đổi môi trường thực khi chưa được phê duyệt.

## 11. REQUIRED OUTPUT — BÁO CÁO CUỐI PHIÊN

Báo cáo tiếng Việt, đúng mẫu:

```text
A. PROJECT CREATED
- Root path:
- Solution/projects:
- Frontend app:
- Database/migration runner:

B. IMPLEMENTATION MATRIX
Feature | IMPLEMENTED / PARTIAL / NOT STARTED | Code paths | Evidence

C. VERIFIED COMMANDS
Command | Exit code | PASS/FAIL/SKIPPED | Evidence / blocker

D. DATABASE REPORT
Migration | APPLIED / NOT APPLIED | SP created | Target = DEV only

E. API/UI ROUTES
Method/route | Permission | State

F. SECURITY & TEST RESULTS
- 401 / 403 / cross-entity / revoke / audit / concurrency:

G. OPEN QUESTIONS (NEEDS_PO)
ID | Decision needed | Proposed safe default | Impact

H. NEXT BACKLOG
Top 5-10 concrete tasks with priority & acceptance criteria
```

**Thứ tự ưu tiên khi thời gian/công cụ giới hạn:** hoàn thiện bootstrap chạy được → auth/GBAC có test → Legal Entity end-to-end → Party360 foundation; tuyệt đối không tuyên bố xong toàn bộ nếu mới scaffold.

---

## EXECUTE NOW

**Hãy bắt đầu trực tiếp tại workspace hiện tại: kiểm tra môi trường, tạo repository SHD-OneERP, xây solution/backend/frontend/database/rules, triển khai Direct GBAC và vertical slice Legal Entity, chạy các phép kiểm thử khả dụng, sửa lỗi, sau đó xuất báo cáo minh bạch theo mục 11.**

Không dừng ở việc mô tả hướng làm hoặc tạo kế hoạch chung. Ưu tiên **source code chạy được + bảo mật đúng + migration có kiểm soát + bằng chứng kiểm thử**.
