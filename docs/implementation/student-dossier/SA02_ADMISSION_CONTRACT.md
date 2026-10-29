# SA-02: ADM-01 Admission & Visa Application Contract

## 1. Domain Ownership
- **Domain:** `AdmissionVisa`
- **Module Code:** `ADMISSIONVISA` (Registered in `System_Modules`, Id: `M1000000-0000-0000-0000-000000000003`)
- **Core Entities:** `Adm_StudentApplications`, `Adm_ChecklistItems`, `Adm_ApplicationDocumentLinks`
- **Domain Boundary:** Does NOT write directly to `Party_Parties` or `Party_Persons`. Connects strictly via `StudentPartyId` foreign key.

## 2. Cardinality & Business Rules
- **1 Human = 1 `PartyId`:** A student is represented by a single Party with Role `Student`.
- **1 Student = N `StudentApplication` records:** A student may have multiple applications across different intake terms (e.g. 2026-Fall, 2027-Spring) and target markets (Korea, Germany, Japan, Australia).
- **Checklist Initialization:** Upon creation of an application, standard checklist items are automatically seeded:
  - `PASSPORT`: Hộ chiếu (Identity, Required)
  - `ID_CARD`: Căn cước công dân (Identity, Required)
  - `BIRTH_CERT`: Giấy khai sinh (Identity, Required)
  - `ACADEMIC_TRANSCRIPT`: Học bạ / Bảng điểm (Academic, Required)
  - `GRADUATION_CERT`: Bằng tốt nghiệp (Academic, Required)
  - `FINANCIAL_PROOF`: Sổ tiết kiệm & Xác nhận số dư (Financial, Required)
  - `HEALTH_CERT`: Giấy khám sức khỏe (Medical, Required)
  - `PHOTO_PORTRAIT`: Ảnh thẻ 3.5x4.5 (Identity, Required)
  - `CRIMINAL_RECORD`: Phiếu lý lịch tư pháp số 2 (Legal, Optional)

## 3. Endpoints & Authorization Contracts

| Endpoint | Method | Permission | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admissions/applications` | GET | `admission.application.view` | Paged query via SP `sp_Admission_Application_GetPagedList` |
| `/api/v1/admissions/applications/{id}` | GET | `admission.application.view` | Application detail + checklist via `sp_Admission_Application_GetDetailById` |
| `/api/v1/admissions/applications/by-student/{studentPartyId}` | GET | `admission.application.view` | Multi-application list for a specific student |
| `/api/v1/admissions/applications` | POST | `admission.application.create` | Create application & auto-seed standard checklist |
| `/api/v1/admissions/applications/{id}` | PUT | `admission.application.edit` | Update application info (concurrency safe via RowVersion) |
| `/api/v1/admissions/applications/{id}/status` | PUT | `admission.application.edit` | Update workflow status (Draft -> Submitted -> UnderReview -> Accepted/Rejected/Withdrawn) |
| `/api/v1/admissions/applications/{id}` | DELETE | `admission.application.delete` | Soft delete application |
| `/api/v1/admissions/applications/{id}/checklist` | GET | `admission.dossier.view` | List checklist items for application |
| `/api/v1/admissions/applications/{id}/checklist` | POST | `admission.dossier.upload` | Add custom checklist item |
| `/api/v1/admissions/applications/{id}/checklist/{itemId}/verify` | POST | `admission.dossier.verify` | Verify checklist item (sets status 'Verified', tracks verifier & timestamp) |
| `/api/v1/admissions/applications/{id}/checklist/{itemId}/reject` | POST | `admission.dossier.verify` | Reject checklist item with reason (status 'Rejected') |
| `/api/v1/admissions/applications/{id}/checklist/{itemId}/reset` | POST | `admission.dossier.upload` | Reset item to 'Pending' |
| `/api/v1/admissions/applications/{id}/checklist/{itemId}/upload` | POST | `admission.dossier.upload` | Upload & link document |

## 4. Security & Data Scope Fail-Closed
- All read operations run via Stored Procedures requiring `@CurrentUserId`. If NULL or if the user has no scope on the LegalEntity, 0 rows are returned immediately.
- Writes verify caller permissions via `IPermissionResolver` against the target `LegalEntityId`.

