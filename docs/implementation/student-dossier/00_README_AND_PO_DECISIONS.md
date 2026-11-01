# SHD OneERP — README & PO Decision Register

**Version:** 1.0  
**Date:** 2026-10-29  
**Status:** PROPOSED — pending repository verification and PO approval  
**Owner:** Senior Product Owner  
**Path:** docs/implementation/student-dossier/

## 1. Mục tiêu

Hoàn thiện hệ thống quản lý học viên và hồ sơ du học SHD Korea bằng cách phát triển bổ sung trên nền STU-01 (Party360 Student Profile) và ADM-01 (AdmissionVisa Application/Dossier) đã được AI Agent báo cáo hoàn thành.

Không viết lại các chức năng đã có nếu chưa chứng minh chúng không đáp ứng Acceptance Criteria. Báo cáo hoàn thành của Agent chưa đồng nghĩa với kiểm chứng độc lập trên source code, SQL Server và UAT.

Xây dựng năng lực **Cấu hình hệ thống → Dữ liệu nguồn**, cho phép quản trị viên tạo nhóm danh mục, giá trị, cấu trúc phân cấp và quản lý vòng đời dữ liệu qua UI. Thay đổi danh mục nghiệp vụ không yêu cầu sửa code, seed data hoặc deploy lại.

## 2. Bộ tài liệu

1. `00_README_AND_PO_DECISIONS.md` — mục tiêu, nguyên tắc và quyết định PO.
2. `01_SYSTEM_REFERENCE_DATA_USER_STORIES.md` — 6 stories SYS-REF.
3. `02_KOREA_DOSSIER_USER_STORIES.md` — 14 stories US-KR.
4. `03_SPRINT_PLAN_AND_DEPENDENCIES.md` — dependencies, Sprint và release gates.
5. `04_AI_AGENT_ORCHESTRATION.md` — Master Agent, Agent A/B, prompts và quy trình.
6. `05_REPORT_TEMPLATES_AND_PO_ACCEPTANCE.md` — 8 báo cáo/story và tiêu chí nghiệm thu.

Kết quả thực thi: `docs/implementation/student-dossier/reports/{STORY_ID}/`.

## 3. Architecture Invariants

- Party360 sở hữu Party/Person và định danh gốc. Một người thật tương ứng một PartyId.
- AdmissionVisa sở hữu StudentApplication, Dossier, Checklist, School Submission và Visa Case.
- Documents Foundation sở hữu file số, metadata và cơ chế truy cập tài liệu.
- Workflow Foundation sở hữu state machine, transition, guards và workflow version.
- IdentityAccess/Organization sở hữu Direct GBAC, roles và Data Scope.
- Training/Education sở hữu enrollment và trạng thái đào tạo.
- Finance sở hữu kế toán và xác nhận thanh toán; AdmissionVisa có thể theo dõi invoice trường bằng contract.
- System Reference Data sở hữu danh mục tham chiếu; không thay thế các bảng giao dịch của domain.

Không tạo Student/Party/Document trùng lặp hoặc generic EAV để thay thế domain model.

## 4. Reference Data Principles

- Dữ liệu danh mục do người có quyền quản trị qua UI/API.
- Mã danh mục ổn định, unique theo namespace/scope.
- Đổi nhãn không làm đổi ý nghĩa hoặc mã của dữ liệu lịch sử.
- Không hard-delete dữ liệu đang được tham chiếu; hỗ trợ ngừng sử dụng.
- Có audit, concurrency, scope và quyền cho mọi thao tác.
- Có hiệu lực/phiên bản đối với danh mục hoặc chính sách cần lịch sử.
- Trạng thái danh mục không tự động cho phép Workflow transition.
- Bootstrap schema và permission kỹ thuật có thể dùng migration; seed không phải cơ chế vận hành danh mục.
- Danh mục có logic đặc thù phải có contract và governance, không tùy tiện cho người dùng tạo cấu trúc phá vỡ domain.

## 5. Technical Standards

- Đọc `.cursor/rules/*.mdc` thực tế trong repository trước khi code.
- .NET 10, React 18, TypeScript strict, SQL Server theo stack hiện hữu.
- Handwritten, versioned SQL migration.
- Business GET qua SQL Server Stored Procedures.
- Writes qua EF Core.
- Direct GBAC fail-closed, Data Scope, RowVersion, audit.
- Test migration trên SQL Server thật; unit tests không thay thế integration/E2E.
- Không dùng PII thật trong fixtures/logs.
- Không branch, worktree, commit, push, pull, reset, clean hoặc stash nếu PO chưa cho phép.
- Không sao chép các ID/path/table thuộc ezHR/OneHR từ ví dụ trong rules vào SHD.

## 6. PO Decision Register

| ID | Vấn đề | Đề xuất mặc định | Blocking | Trạng thái |
|---|---|---|---|---|
| PO-001 | Ai được tạo nhóm danh mục? | System Config Admin; nhóm ảnh hưởng logic cần approval | Có cho SYS-REF-01 | OPEN |
| PO-002 | Scope của danh mục? | Global trước; LegalEntity/Market khi có use case | Có khi cần scoped catalogs | OPEN |
| PO-003 | Đổi code sau khi tham chiếu? | Không cho phép | Không | PROPOSED |
| PO-004 | Xóa giá trị đã sử dụng? | Không; deactivation | Không | PROPOSED |
| PO-005 | Nguồn và phiên bản địa giới? | Nguồn chính thức được phê duyệt | Có cho SYS-REF-03 | OPEN |
| PO-006 | Grain StudentApplication? | Một hồ sơ dịch vụ/kỳ, nhiều School Submissions | Có cho US-KR-08 | OPEN |
| PO-007 | Owner trạng thái đào tạo? | Training/Education | Có cho US-KR-14 | OPEN |
| PO-008 | Ai được four-eyes review? | Reviewer độc lập, đúng quyền/scope | Có cho US-KR-05 | OPEN |
| PO-009 | Override four-eyes? | Không bypass thông thường; ngoại lệ riêng | Có cho US-KR-05 | OPEN |
| PO-010 | Checklist applicability/version? | Market/program/school/intake/phase/effective date | Có cho US-KR-03 | OPEN |
| PO-011 | Sponsor/financial data ownership? | Quan hệ Party; bằng chứng tài chính theo case | Có cho US-KR-02 | OPEN |
| PO-012 | Owner xác nhận học phí? | Finance/nguồn có thẩm quyền | Có cho US-KR-09 | OPEN |
| PO-013 | Quy định visa Hàn Quốc? | Chỉ dùng policy có nguồn và hiệu lực được duyệt | Có cho US-KR-10/11 | OPEN |
| PO-014 | Import Excel lịch sử? | Staging/preview/validation/approval | Khi triển khai import | OPEN |
| PO-015 | PII, retention, masking? | Least privilege, audit, policy được duyệt | Có cho tài chính/hộ chiếu | OPEN |

`PROPOSED` không phải `APPROVED`. Master phải ghi nhận quyết định cần thiết trước khi bắt đầu story.

## 7. Definition of Ready

- Story và AC được PO xác nhận.
- Đã audit source hiện hữu và phân loại EXISTING/PARTIAL/MISSING.
- Không có PO decision BLOCKING.
- Đã xác định data owner, API/DB/UI contract.
- Có permission matrix, scope, migration/test plan và file ownership.
- Có kế hoạch rollback hoặc forward-fix phù hợp.

## 8. Definition of Done

- Toàn bộ AC bắt buộc có evidence PASS.
- Backend/frontend build và tests đạt.
- Migration được áp dụng trên SQL Server test.
- Business GET Stored Procedures và EF writes được kiểm chứng.
- GBAC/Data Scope, audit, concurrency và regression đạt.
- UI có loading/empty/error/validation/permission states.
- Không có lỗi P0/P1 chưa xử lý.
- Đủ 8 file report và UAT guide.
- PO quyết định `ACCEPTED`; Agent không tự nghiệm thu.

## 9. Quy trình

1. Copy bộ tài liệu vào repository.
2. Chạy GATE-00 — Repository Baseline Audit, chưa code.
3. PO duyệt baseline và chốt quyết định của story.
4. Master mở một story, giao Agent A/B.
5. Master kiểm tra, tạo 8 file report, dừng `WAITING_PO`.
6. Người dùng gửi report cho ChatGPT để PO review.
7. Chỉ triển khai story tiếp theo khi PO cho phép.

**Story dự kiến đầu tiên:** SYS-REF-01, sau GATE-00.
