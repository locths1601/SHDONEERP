# SHD OneERP — 02. STUDENT DOSSIER IMPLEMENTATION LOG
## STU-01 + ADM-01 Execution & Work Package Tracker

**Ngày bắt đầu:** 2026-10-29  
**Branch:** Hiện tại (`feature/fnd03-workflow-foundation`)  
**Quy tắc:** Không commit/push/branch. Thực thi tuần tự theo Execution Graph và kiểm soát qua Quality Gates G0, G1, G2.

---

### 1. BẢNG TIẾN ĐỘ WORK PACKAGES

| Gói công việc | Chủ thể | File sở hữu chính | Trạng thái | Ghi chú & Blockers |
|---|---|---|---|---|
| **SA-00: Platform Inventory & Contract Audit** | Master & SA-00 | `00A_RULE_COMPLIANCE_MATRIX.md`, `00_FOUNDATION_INVENTORY.md` | `DONE` | Hoàn thành khảo sát toàn bộ source code, DB và rules. |
| **Gate G0: Contract Freeze** | Master | `01_INTEGRATION_CONTRACT_FREEZE.md` | `DONE` | Đóng băng toàn bộ API, DTO, mã quyền và Stored Procedures. |
| **SA-01: STU-01 Party360 / Student Profile Backend** | SA-01 | `PartyEntities.cs`, `PartyWriteService.cs`, `PartyReadService.Sp.cs`, `PartiesController.cs`, `SA01_PARTY360_CONTRACT.md` | `IN_PROGRESS` | Mở rộng định danh CCCD/Hộ chiếu, quan hệ phụ huynh, SP tra cứu học viên fail-closed và PII masking. |
| **SA-02: ADM-01 Admission Application Backend** | SA-02 | `backend/ShdOneErp.Domain/Entities/AdmissionVisa/`, `Application/Modules/AdmissionVisa/`, `SA02_ADMISSION_CONTRACT.md` | `PENDING` | Thực thể `StudentApplication`, DTOs, Validators, Write Service, SP `sp_Admission_Application_GetPagedList`. |
| **SA-03: Dossier Checklist & Documents Integration** | SA-03 | `ChecklistItem.cs`, `ApplicationDocumentLink.cs`, `LocalFileSystemDocumentStorageService.cs`, `SA03_DOCUMENT_CONTRACT.md` | `PENDING` | Hiện thực hóa lưu trữ file an toàn, kiểm tra SHA256 checksum, checklist APIs. |
| **SA-04: Student Workspace React Frontend** | SA-04 | `frontend/src/features/studentWorkspace/`, `pages/studentWorkspace/`, `SA04_FRONTEND_CONTRACT.md` | `PENDING` | Student Directory, Student 360 Detail Drawer/Page, Applications Tab, Checklist Dossier Tab. |
| **MASTER: Shared Integration & Migration** | Master | `20261029_0015_...sql`, `ShdOneErpDbContext.cs`, `DependencyInjection.cs`, `App.tsx`, `Sidebar.tsx` | `PENDING` | Migration handwritten versioned, đăng ký DI, menu sidebar và router. |
| **SA-05: QA, Security & Regression Test** | SA-05 | `03_SECURITY_AND_QA_EVIDENCE.md`, `ShdOneErp.Tests/...` | `PENDING` | Test multi-company isolation, PII masking, optimistic concurrency 409, build validation. |

