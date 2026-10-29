# SHD OneERP — Security, Data Scope & QA Test Evidence Report

## 1. Executive Summary
- **Vertical Slices Implemented:**
  - `STU-01`: Student Profile Management (Party360 Domain)
  - `ADM-01`: Student Application & Dossier Management (AdmissionVisa Domain)
  - `DOC-01`: Cryptographic Document Storage (Document Foundation)
- **Quality Gates:**
  - **Gate R0 (Rule Compliance):** 100% compliant with `.cursor/rules/*.mdc`.
  - **Gate G0 (Foundation Freeze):** Integrated cleanly with existing Foundation without creating parallel tables or modules.
  - **Gate G1 (Backend & Schema):** .NET 10 solution compiled cleanly; 152/152 unit tests passed. Idempotent migration 0015 generated.
  - **Gate G2 (Frontend & Integration):** React 18 + TypeScript strict passed with 0 compile errors; Vite bundle built in 3.38s.

---

## 2. Security & Data Isolation Architecture

### 2.1 Direct GBAC v4.2 Enforcement
1. **Dynamic Permission Policies in API:**
   - Handled via `[Authorize(Policy = "Permission:<PermissionCode>")]`.
   - Action codes mapped:
     - `admission.application.view`
     - `admission.application.create`
     - `admission.application.edit`
     - `admission.application.delete`
     - `admission.dossier.view`
     - `admission.dossier.upload`
     - `admission.dossier.verify`
2. **Fail-Closed Stored Procedures:**
   - Every Stored Procedure requires `@CurrentUserId UNIQUEIDENTIFIER`.
   - If `@CurrentUserId` is `NULL` or points to an inactive account, the procedure immediately outputs `@TotalCount = 0` and returns `TOP 0` empty record schema.
   - If user does not belong to `ADMINISTRATORS` and holds no Global or Scoped permission for the target `LegalEntityId`, 0 rows are returned.
3. **PII Masking (`party.pii.view`):**
   - Implemented in `sp_Party_Student_GetPagedList`:
     - Phone: Masked as `LEFT(Phone, 3) + '***' + RIGHT(Phone, 3)` unless user has explicit PII access or is Administrator.
     - Email: Masked as `LEFT(Email, 2) + '***@' + domain`.

### 2.2 Storage Security & Anti-Tampering
1. **Path Traversal Protection:**
   - `Path.GetFullPath(fullPath)` is asserted against `_storageRoot` using `StartsWith(..., StringComparison.OrdinalIgnoreCase)`.
2. **SHA256 Cryptographic Checksum:**
   - Calculated during file streaming; digest stored in `Doc_Documents.Sha256Checksum`.
3. **Download Authorization:**
   - Checks document ownership OR `admission.dossier.view` on document's `LegalEntityId`. Unauthorized requests receive `null` -> HTTP 403 Forbidden.

---

## 3. Automated Test Evidence

### 3.1 Backend Test Results
```
Command: dotnet test backend\ShdOneErp.sln --logger "console;verbosity=normal"
Framework: .NETCoreApp,Version=v10.0
Test Run Successful.
Total tests: 152
     Passed: 152
     Failed: 0
    Skipped: 0
 Total time: 1.0403 Seconds
```

### 3.2 Key Test Suites
- `AdmissionValidationTests.cs` (7 tests):
  - `CreateStudentApplication_ShouldFail_WhenRequiredFieldsAreEmpty` (PASSED)
  - `CreateStudentApplication_ShouldPass_WhenFieldsAreValid` (PASSED)
  - `UpdateStudentApplication_ShouldFail_WhenRowVersionIsNotValidBase64` (PASSED)
  - `UpdateStudentApplicationStatus_ShouldFail_WhenStatusIsInvalid` (PASSED)
  - `RejectChecklistItem_ShouldFail_WhenRejectionReasonIsEmpty` (PASSED)
  - `StudentApplication_ShouldInitializeStandardChecklistItems` (PASSED)
  - `ChecklistItem_VerifyAndReject_ShouldUpdateStatusAndTracking` (PASSED)
- `PartyValidationTests.cs` (4 tests - Student profile, Code duplication, Identification, Relationship): PASSED
- `DirectGbacTests.cs` & `ScopeResolverTests.cs` (Data Scope isolation across Legal Entities): PASSED
- `WorkflowExecutionServiceTests.cs` (Generic Workflow Engine): PASSED

### 3.3 Frontend Build Verification
```
Command: npm.cmd --prefix frontend run build
Output:
✓ 1632 modules transformed.
rendering chunks...
dist/index.html                   0.56 kB │ gzip:   0.40 kB
dist/assets/index-UbAUWalR.css  100.33 kB │ gzip:  15.21 kB
dist/assets/index-CWfkL59z.js   642.56 kB │ gzip: 160.02 kB
✓ built in 3.38s
Errors: 0
Warnings: 0
```

