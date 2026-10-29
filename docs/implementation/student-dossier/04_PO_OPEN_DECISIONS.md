# PO Open Decisions & Policy Registry (Student & Dossier)

| ID | Domain | Topic | Current State | Proposed Option | Pending Decision Required From PO |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POD-STU-01** | Admission | National Visa Policy & Auto-approval | `PROPOSED` | Do NOT hardcode country-specific embassy approval rules in code. Use human review (`UnderReview` -> `Accepted` / `Rejected`) with mandatory reason. | Confirm whether embassy policy changes should remain configuration-driven or purely human-verified. |
| **POD-STU-02** | Admission | Automatic Dossier Creation from Commercial Contract | `PROPOSED` | Keep decoupled. When a Contract reaches `Active` state with a service obligation, counselor/officer manually reviews and creates `StudentApplication`. | Confirm whether Contract activation should automatically generate a Draft `StudentApplication`. |
| **POD-STU-03** | Documents | Digital Signature vs Scan SHA256 | `PROPOSED` | Use physical signed scan uploaded via multipart form, with SHA256 checksum recorded in `Doc_Documents`. No legal e-sign PKI assumption. | Confirm when SHD will integrate certified CA digital signatures (VNPT/Viettel CA). |
| **POD-STU-04** | Admission | Soft Delete Retention for Applications | `PROPOSED` | Soft delete retains records in database (`IsDeleted = 1`, `DeletedAtUtc = UTC`). Physical deletion is prohibited. | Confirm data retention period (e.g., 5 years / 10 years per education regulations). |
| **POD-STU-05** | Party360 | Duplicate Detection Threshold | `PROPOSED` | Exact match on `CitizenId` (CCCD) and `Passport` number within the same Party type; warning on Phone/Email match. | Confirm whether multi-entity registration by the same person should trigger a merge recommendation. |

