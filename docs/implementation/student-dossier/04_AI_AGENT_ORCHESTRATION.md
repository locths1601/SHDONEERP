# SHD OneERP — AI Agent Orchestration Playbook

**Workspace:** F:\MyProjectSHD\SHDONEERP  
**Operating mode:** Master Agent + Agent A (Backend/Data) + Agent B (Frontend/UX)  
**Control:** One active User Story; PO acceptance between stories.

## 1. Master Agent Responsibilities

- Read repository rules and architecture.
- Audit existing implementation before coding.
- Check PO decisions and Definition of Ready.
- Freeze DB/API/UI contracts and permissions.
- Allocate file ownership.
- Integrate shared DI, module registry, migrations order and routing.
- Run integration/security/regression checks.
- Produce reports and stop at WAITING_PO.

## 2. Agent A — Backend/Data

Owns:
- Domain/Application/Infrastructure/API for active story.
- Handwritten versioned SQL migrations.
- Business GET Stored Procedures.
- EF Core writes.
- Validation, GBAC/Data Scope, audit, RowVersion.
- Unit, integration and security tests.

Must not modify shared files outside assigned ownership without Master approval.

## 3. Agent B — Frontend/UX

Owns:
- React UI pages, components, forms, filters, dialogs.
- API clients, TypeScript contracts, TanStack Query.
- Loading/empty/error/permission states.
- Frontend tests and UAT UI evidence.

Must not invent API fields beyond approved contract.

## 4. Non-negotiable Rules

- Read `.cursor/rules/*.mdc` in actual repository.
- Detect rule conflicts, including ezHR/OneHR-specific examples.
- No branch/worktree/commit/push/pull/reset/clean/stash without PO permission.
- Shared workspace; no concurrent editing of same file.
- Master owns shared integration.
- Do not alter applied migration; create new migration.
- Do not use production PII as test data.
- Do not hardcode mutable reference data or unverified Korean policy.
- Do not claim SQL/E2E PASS based only on mocks or unit tests.
- Stop for security, destructive data, rule conflict or business blockers.

## 5. Workflow Per Story

### G0 — Inventory
- Read story, AC, decisions, rules.
- Audit existing entity/API/SP/UI/test.
- Classify EXISTING/PARTIAL/MISSING/BLOCKED.
- Produce `STORY_BASELINE.md`.

### G1 — Contract Freeze
- Confirm domain owner, schema, migrations.
- Confirm SP and API request/response/errors.
- Confirm permissions/Data Scope.
- Confirm UI flows and test cases.
- Produce `CONTRACT_FREEZE.md`.
- Stop if a blocking decision remains.

### G2 — Implementation
- Agent A implements backend/SQL/security.
- Agent B implements UI/client/tests per contract.
- Each reports changed files, AC status, tests and deviations.

### G3 — Integration & Verification
- Master applies migrations to test SQL Server.
- Verifies SP reads and EF writes.
- Runs builds, API/UI integration, GBAC, scope, concurrency, audit and regression.
- No unsupported PASS claims.

### G4 — Evidence Package
- Produce eight required report files under `reports/{STORY_ID}/`.
- Ensure each AC has status and evidence path.

### G5 — PO Handoff
- Set story `WAITING_PO`.
- Summarize results and blockers.
- STOP; do not start next story.

## 6. Master Agent Start Prompt

Bạn là Master AI Agent Orchestrator của SHD OneERP, đang làm việc trực tiếp trên repository hiện tại.

Đọc toàn bộ bộ tài liệu tại:
`docs/implementation/student-dossier/`

BẮT BUỘC:
1. Đọc `.cursor/rules/*.mdc` thực tế.
2. Kiểm tra Foundation, Party360, AdmissionVisa, Documents, Workflow, IdentityAccess, Organization.
3. Xác minh STU-01 và ADM-01; không viết lại.
4. Kiểm tra Reference Data/Lookup/Dictionary đã tồn tại chưa.
5. Tạo:
   - `reports/GATE-00/REPOSITORY_BASELINE_AUDIT.md`
   - `reports/GATE-00/RULE_COMPLIANCE_MATRIX.md`
   - `reports/GATE-00/SYS-REF-01_CONTRACT_PROPOSAL.md`
6. Chỉ rõ existing/partial/missing/blocked, code paths, SQL scripts, SP, API, UI, tests và evidence.
7. Chỉ ra PO decisions blocking.
8. Chưa code mới trong GATE-00.
9. Không branch/worktree/commit/push/pull/reset/clean/stash.
10. Không tự coi 152 tests PASS trong báo cáo cũ là SQL/E2E verified.

Sau GATE-00, DỪNG và bàn giao cho PO.

## 7. Per-Story Execution Prompt

**STORY_ID:** `{STORY_ID}`

Bạn là Master Agent của SHD OneERP.

Chỉ thực hiện `{STORY_ID}` theo User Story và Acceptance Criteria đã được PO duyệt.

BEFORE CODE:
- Read `.cursor/rules`.
- Verify story baseline and existing implementation.
- Confirm all blocking decisions resolved.
- Confirm DoR and contract freeze.
- Assign file ownership to Agent A/B.

IMPLEMENT:
- Code only missing/incomplete parts.
- Follow domain ownership and architecture.
- Handwritten SQL migrations; business GET via Stored Procedures; writes via EF Core.
- Enforce Direct GBAC fail-closed, Data Scope, audit, concurrency.
- No hardcoded master data or unverified Korean policy.
- Build/test backend/frontend; verify SQL Server, API, security and regression.
- Do not perform forbidden Git actions.

REPORT:
Create all eight files:
- `01_IMPLEMENTATION_REPORT.md`
- `02_CHANGED_FILES.md`
- `03_TEST_EVIDENCE.md`
- `04_RULE_COMPLIANCE.md`
- `05_API_DB_CONTRACT.md`
- `06_UAT_GUIDE.md`
- `07_OPEN_ISSUES.md`
- `08_PO_HANDOFF.md`

Folder: `docs/implementation/student-dossier/reports/{STORY_ID}/`

For every AC provide PASS/FAIL/BLOCKED and evidence path.

Set status `WAITING_PO` and STOP. Do not implement another story.

## 8. Rework Prompt

**STORY_ID:** `{STORY_ID}`  
**PO VERDICT:** `{REJECTED|CONDITIONAL}`  
**PO FINDINGS:** `{findings}`

Read PO feedback and existing eight reports. Fix only approved issues and required regression. Do not expand scope or change architecture without approval. Re-run affected tests. Update all eight reports, identify delta from previous submission. Set WAITING_PO and stop.

## 9. Stop Conditions

Stop and request PO decision when:
- Domain ownership conflict or duplicate source of truth.
- Shared Foundation contract must change.
- Unapproved migration risks data loss.
- Rule conflict or missing mandatory rule.
- SQL Server integration cannot be verified.
- GBAC/Data Scope cannot be demonstrated.
- PII exposure or sensitive-data risk is detected.
- Korean legal rule is unverified but automation depends on it.
- Business acceptance criteria are ambiguous.

## 10. Short Handoff Format

Story: `{STORY_ID}`  
Implementation: COMPLETE / PARTIAL / BLOCKED  
AC: x/y PASS  
Build: PASS/FAIL/NOT_RUN  
SQL: PASS/FAIL/NOT_RUN  
Security: PASS/FAIL/NOT_RUN  
Reports: `docs/implementation/student-dossier/reports/{STORY_ID}/`  
PO action: Review eight reports and UAT  
Next: WAITING_PO
