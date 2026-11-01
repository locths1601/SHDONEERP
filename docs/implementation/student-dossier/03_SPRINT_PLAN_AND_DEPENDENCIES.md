# SHD OneERP — Sprint Plan & Dependency Matrix

**Release:** Student Dossier Operational Readiness  
**Method:** Incremental vertical slices; one active story at a time; PO acceptance gate.

## 1. Nguyên tắc

- Không mặc định Sprint dài 2 tuần; capacity và estimate xác định sau repository audit.
- Sprint gom mục tiêu, không có nghĩa code tất cả story đồng thời.
- Agent A và B có thể làm song song phần không xung đột trong cùng story.
- Không mở story tiếp theo nếu chưa có quyết định PO.
- Security/audit/permission là yêu cầu xuyên suốt, không trì hoãn đến cuối Sprint.

## 2. GATE-00 — Repository Baseline Audit

**Mục tiêu:** Không code mới trước khi biết code hiện hữu.

**Công việc**
1. Đọc `.cursor/rules/*.mdc` thực tế.
2. Kiểm tra STU-01, ADM-01, Party360, Documents, Workflow, IdentityAccess, Organization.
3. Tìm Reference Data/Lookup/Dictionary/System Configuration đã tồn tại.
4. Kiểm tra schema, SQL migrations, Stored Procedures, APIs, UI, tests, logs.
5. Phân loại mỗi story: IMPLEMENTED_VERIFIED / PARTIAL / MISSING / BLOCKED.
6. Lập Rule Compliance Matrix và danh sách PO decisions.
7. Đề xuất contract cho SYS-REF-01.

**Files**
- `reports/GATE-00/REPOSITORY_BASELINE_AUDIT.md`
- `reports/GATE-00/RULE_COMPLIANCE_MATRIX.md`
- `reports/GATE-00/SYS-REF-01_CONTRACT_PROPOSAL.md`

**Exit:** PO duyệt baseline và cho phép mở story.

## 3. Sprint 0 — System Reference Data

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | SYS-REF-01 Catalog groups | P0 | GATE-00 |
| 2 | SYS-REF-02 Catalog values | P0 | SYS-REF-01 |
| 3 | SYS-REF-04 Permissions/governance | P0 | SYS-REF-01/02 |
| 4 | SYS-REF-03 Geography hierarchy | P0 | SYS-REF-01/02, PO-005 |
| 5 | SYS-REF-06 Status/Workflow | P0 | SYS-REF-02/04, Workflow |
| 6 | SYS-REF-05 Import/Export | P1 | SYS-REF-02/04 |

**Gate R0:** Admin tạo catalog/value qua UI; modules đọc động; quyền/audit/scope đạt; không cần seed/redeploy. Bảo mật SYS-REF-04 phải có ngay từ SYS-REF-01/02.

## 4. Sprint 1 — Dossier Operational Control

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | US-KR-14 Tách trạng thái | P0 | SYS-REF-06 |
| 2 | US-KR-13 Phân công/deadline | P0 | SYS-REF-02, Organization |
| 3 | US-KR-03 Checklist 3 phase | P0 | SYS-REF, Workflow, Documents |
| 4 | US-KR-05 Four-eyes | P0 | US-KR-13, US-KR-03 |

**Gate R1:** Mỗi case có trạng thái, người phụ trách, checklist, deadline và kiểm tra chéo; chuyển bước bị chặn khi chưa đủ điều kiện.

## 5. Sprint 2 — Academic & Financial Profile

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | US-KR-01 Học vấn | P1 | Ownership decision |
| 2 | US-KR-02 Sponsor/financial | P1 | Party, security policy |

**Gate:** Academic profile, sponsor relationships, financial evidence có quyền và audit.

## 6. Sprint 3 — Document Processing

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | US-KR-06 Translation | P1 | US-KR-03/05 |
| 2 | US-KR-07 Notary/legalization | P1 | US-KR-06 or eligible docs |
| 3 | US-KR-04 Naming/ZIP | P1 | US-KR-03, Documents |

**Gate:** Theo dõi chứng từ từ nhận, xử lý, kiểm tra đến sẵn sàng nộp.

## 7. Sprint 4 — School & Finance Coordination

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | US-KR-08 Multi-school/interview | P1 | School/Intake, PO-006 |
| 2 | US-KR-09 School invoice | P1 | US-KR-08, Finance contract |

**Gate:** Quản lý attempts, kết quả trường, invoice và trạng thái thanh toán có nguồn.

## 8. Sprint 5 — Visa & Departure

| Order | Story | Priority | Dependencies |
|---|---|---|---|
| 1 | US-KR-10 Consular requirements | P1 | US-KR-02/03, approved policy |
| 2 | US-KR-11 Visa Case/Attempts | P1 | US-KR-10, Workflow |
| 3 | US-KR-12 Departure/handover | P2 | US-KR-11, OverseasCare |

**Gate R3:** Visa history, supplementary tasks, departure/handover và arrival evidence được UAT.

## 9. Test Matrix

| Layer | Minimum evidence |
|---|---|
| Unit | Validation, guards, business calculations |
| SQL | Migration apply, SP execute, EF writes on test SQL Server |
| API | Contract, success/error, authorization |
| Security | Direct GBAC, Data Scope, cross-LegalEntity |
| Concurrency | RowVersion/stale write, retry |
| Audit | Actor, action, timestamp, changes |
| Frontend | Loading/empty/error, permissions, responsive |
| Regression | STU-01, ADM-01, Foundation |
| UAT | Realistic synthetic SHD Korea scenarios |

## 10. Status Tracker

Allowed statuses:
`BACKLOG → REFINEMENT → READY → IN_IMPLEMENTATION → IN_QA → WAITING_PO → ACCEPTED`

Exception states:
`BLOCKED`, `REWORK`, `REJECTED`, `CONDITIONAL`.

| Story | Status | PO Verdict | Report Folder |
|---|---|---|---|
| GATE-00 | NOT_STARTED | — | reports/GATE-00 |
| SYS-REF-01 | BACKLOG | — | reports/SYS-REF-01 |
| SYS-REF-02 | BACKLOG | — | reports/SYS-REF-02 |
| SYS-REF-03 | BACKLOG | — | reports/SYS-REF-03 |
| SYS-REF-04 | BACKLOG | — | reports/SYS-REF-04 |
| SYS-REF-05 | BACKLOG | — | reports/SYS-REF-05 |
| SYS-REF-06 | BACKLOG | — | reports/SYS-REF-06 |
| US-KR-01..14 | BACKLOG | — | reports/{STORY_ID} |

Master updates status/evidence; only PO approves verdict.
