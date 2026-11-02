# SHD OneERP — Per-Story Reports & PO Acceptance

**Scope:** SYS-REF-01..06 and US-KR-01..14  
**Report root:** docs/implementation/student-dossier/reports/{STORY_ID}/  
**Author:** Master Agent  
**Acceptance authority:** Product Owner

## 1. Required Files

Each story MUST produce exactly these eight mandatory reports, plus supporting evidence/logs where needed.

### 01_IMPLEMENTATION_REPORT.md

Required:
- Story ID, title, date, agents.
- Baseline: EXISTING/PARTIAL/MISSING.
- Scope implemented and reused.
- Approved PO decisions.
- Architecture changes.
- AC result table.
- Unfinished work and technical conclusion.

| AC | PASS/FAIL/BLOCKED | Evidence path | Notes |
|---|---|---|---|
| AC01 | ... | ... | ... |
| AC02 | ... | ... | ... |

Do not mark PASS if code exists but relevant verification did not run.

### 02_CHANGED_FILES.md

| File path | NEW/MODIFIED | Reason | Agent |
|---|---|---|---|
| ... | ... | ... | A/B/Master |

List migrations, SPs, entities, APIs, frontend, tests and shared integration files. Explain any out-of-scope changes.

### 03_TEST_EVIDENCE.md

| Test | Actual command | PASS/FAIL/NOT_RUN | Log/Evidence |
|---|---|---|---|
| Backend build | ... | ... | ... |
| Frontend build | ... | ... | ... |
| Unit tests | ... | ... | ... |
| SQL migration | ... | ... | ... |
| Stored Procedure execution | ... | ... | ... |
| EF write integration | ... | ... | ... |
| API integration | ... | ... | ... |
| GBAC and Data Scope | ... | ... | ... |
| Concurrency | ... | ... | ... |
| Audit | ... | ... | ... |
| Regression | ... | ... | ... |
| E2E/UAT automation | ... | ... | ... |

Each test must include environment, timestamp, actual command, exit code, pass/fail/skip counts, evidence path and limitations.

No secrets, tokens, connection strings or real PII in logs. Mock database tests are not SQL Server integration evidence.

### 04_RULE_COMPLIANCE.md

| Rule | Applicable | PASS/FAIL/CONFLICT/MISSING | Evidence |
|---|---|---|---|
| 00-stack-reality | ... | ... | ... |
| 10-migration-workflow | ... | ... | ... |
| 15-backend-stored-procedure | ... | ... | ... |
| 20-frontend-component-rules | ... | ... | ... |
| 25-ui-ux-experience | ... | ... | ... |
| 30-bug-fix-protocol | ... | ... | ... |
| 40-permission-codes | ... | ... | ... |
| 50-do-and-dont | ... | ... | ... |
| 99-reference-index | ... | ... | ... |
| 60-shdoneerp-student-dossier-compliance (if present) | ... | ... | ... |

Report ezHR/OneHR-specific conflicts instead of copying unrelated IDs/schema.

### 05_API_DB_CONTRACT.md

**Database**
- Tables, PK/FK, unique constraints, indexes, RowVersion.
- Migration file, order, apply result.
- Backfill/data migration, rollback or forward-fix.

**Stored Procedures**
- Names, parameters, result columns.
- Filtering, paging, scope and errors.

**API**
| Method | Endpoint | Permission | Request | Response |
|---|---|---|---|---|
| GET | ... | ... | ... | ... |
| POST | ... | ... | ... | ... |

**Frontend**
- Routes, components, API clients, TypeScript contracts.
- Permission guards, cache invalidation.

**Architecture**
- Domain owner, integration contracts/events, no duplicate master entity.

### 06_UAT_GUIDE.md

Must contain:
- Role/persona.
- Preconditions.
- Synthetic test data.
- Step-by-step UI actions.
- Expected results.
- Negative scenario.
- Permission scenario.
- Historical/concurrency scenario.
- Screenshots/evidence links when available.

Template:
- UAT-01 Happy Path: Given / When / Then.
- UAT-02 Validation Failure: Given / When / Then.
- UAT-03 Permission Denied: Given / When / Then.
- UAT-04 Historical/Concurrency: Given / When / Then.

### 07_OPEN_ISSUES.md

| ID | P0/P1/P2/P3 | Description | Impact | Action | Owner |
|---|---|---|---|---|---|
| ISSUE-001 | ... | ... | ... | ... | ... |

Include blockers, debt, missing decisions, test limitations and regression risks. Do not claim no issues when critical tests are NOT_RUN.

### 08_PO_HANDOFF.md

Story ID:  
Story Name:  
Implementation: COMPLETE/PARTIAL/BLOCKED  
AC Passed: x/y  
Build: PASS/FAIL/NOT_RUN  
SQL Integration: PASS/FAIL/NOT_RUN  
Security: PASS/FAIL/NOT_RUN  
UAT: READY/NOT_READY  
Open P0/P1:  
Known Limitations:  
Report Folder:  
PO Decisions Needed:  
Recommended Technical Status: READY_FOR_PO/BLOCKED

Agent declaration:
I have reported actual changes, tests executed/not executed, known issues and limitations. I do not declare PO acceptance.

## 2. PO Acceptance Scorecard

| Dimension | Required |
|---|---|
| Business | All mandatory AC met |
| Architecture | Correct domain ownership, no duplicates |
| Database | SQL migration, SP, EF verified |
| Security | GBAC, scope, PII, audit verified |
| Frontend | Correct UI, validation, errors |
| Quality | Unit, integration, regression evidence |
| Reporting | All eight reports and logs |
| UAT | Business representative confirmation when required |

No average score may override a blocking security, data-integrity or mandatory AC failure.

## 3. Verdicts

**ACCEPTED:** All mandatory AC met, evidence adequate, no open P0/P1, UAT completed where required.

**CONDITIONAL:** Core implementation acceptable but minor non-blocking conditions remain. Conditions, owner and deadline must be explicit; not release-complete until resolved.

**REJECTED:** Mandatory AC failed, serious defect, architecture violation or missing essential evidence.

**BLOCKED:** Cannot decide due to business decision, dependency, environment or unavailable evidence.

Only PO can assign acceptance verdict.

## 4. PO Review Template

Story: `{STORY_ID}`  
Verdict: ACCEPTED/CONDITIONAL/REJECTED/BLOCKED

Business AC:  
Architecture:  
Security:  
Database/API:  
Frontend:  
Test Evidence:  
UAT:

| Finding ID | Severity | Description | Required Action |
|---|---|---|---|
| ... | P0/P1/P2/P3 | ... | ... |

Required Rework:  
Conditions for Acceptance:  
Next Authorized Story:

## 5. ChatGPT PO Review Prompt

Bạn là Senior Product Owner của SHD OneERP.

Tôi gửi kết quả `{STORY_ID}` gồm 8 file report từ Master AI Agent.

Hãy:
1. Đối chiếu từng Acceptance Criteria với evidence.
2. Kiểm tra architecture/domain ownership.
3. Kiểm tra SQL migrations, SP, EF writes, API, UI, GBAC, Data Scope, audit, concurrency.
4. Phân biệt Agent-reported với independently verified.
5. Phát hiện hardcoded master data, policy chưa xác minh, duplicate entity hoặc security flaws.
6. Lập Findings P0–P3 và yêu cầu rework cụ thể.
7. Kết luận ACCEPTED/CONDITIONAL/REJECTED/BLOCKED.
8. Nếu chưa đạt, tạo rework prompt cho Master Agent.
9. Nếu đạt, đề xuất story tiếp theo theo Sprint Plan.

Không coi 152 unit tests PASS là SQL/E2E verified khi thiếu log/môi trường.

## 6. Workflow

- ACCEPTED → PO may authorize next story.
- CONDITIONAL → resolve conditions or explicit PO exception.
- REJECTED → Agent fixes, reruns tests and resubmits eight reports.
- BLOCKED → wait for decision/dependency/evidence.
