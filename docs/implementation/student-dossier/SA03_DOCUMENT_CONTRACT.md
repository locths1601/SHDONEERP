# SA-03: Document Storage & Security Contract

## 1. Component Overview
- **Interface:** `IDocumentStorageService` (defined in `ShdOneErp.Application.Common.Interfaces.IPlatformServices`)
- **Implementation:** `LocalFileSystemDocumentStorageService` (located in `ShdOneErp.Infrastructure.Services.DocumentStorage`)
- **Metadata Storage:** `Doc_Documents` table (Domain entity `ShdOneErp.Domain.Entities.System.Document`)
- **Physical Storage:** Configurable root path (default: `<AppDir>/storage/documents/{yyyy}/{MM}/{dd}/`)

## 2. Security & Compliance Features
1. **Path Traversal Protection:**
   - Evaluates `Path.GetFullPath(fullPath)` and strictly asserts `StartsWith(_storageRoot, StringComparison.OrdinalIgnoreCase)`.
   - Strips directory names using `Path.GetFileName(fileName)`.
2. **Cryptographic Integrity:**
   - Computes SHA256 checksum in real-time as bytes are streamed to disk.
   - Stores hex digest in `Doc_Documents.Sha256Checksum` for downstream tampering detection.
3. **Data Classification:**
   - Supports `DataClassification` levels (`Public`, `Internal`, `Confidential`, `Restricted`).
   - Admission checklist documents are flagged as `Confidential`.
4. **Authorized Streaming / Download:**
   - `GetDocumentStreamAsync` verifies that the requesting user is the document owner OR holds `admission.dossier.view` scoped to the document's legal entity or global scope.
   - Unauthenticated or unauthorized callers receive `null` -> HTTP 403 Forbidden.

## 3. Storage API Endpoints

| Endpoint | Method | Permission | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/admissions/applications/{appId}/checklist/{itemId}/upload` | POST (multipart) | `admission.dossier.upload` | Stores physical file, registers Document, links to ChecklistItem |
| `/api/v1/admissions/documents/{documentId}/download` | GET | `admission.dossier.view` | Streams file with MIME type and original filename header |

