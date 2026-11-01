# SHD OneERP — MIGRATION REMEDIATION PATCH PROPOSAL
## GATE-00C: Đề xuất Bản vá Chuẩn hóa Migration SQL & Xử lý Lệch pha Cấu trúc

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày lập:** 2026-11-01  
**Tác giả:** Master AI Agent Orchestrator  
**Trạng thái đề xuất:** `PROPOSED_PATCH` (Chờ Product Owner phê duyệt trước khi áp dụng)  
**Tài liệu liên quan:** `docs/implementation/student-dossier/`  

---

## 1. NGUYÊN TẮC CHUẨN HÓA BẢN VÁ (PATCH PRINCIPLES)

1. **Tuân thủ Quyết định của PO:**
   - Giữ nguyên cơ chế **Handwritten SQL migrations** + **PowerShell migration runner (`run-migrations.ps1`)** + **EF Core (Write)** + **Stored Procedures (Business GET)**.
   - Tuyệt đối không sử dụng EF Core Migrations.
   - Nguyên nhân `__DbMigrationHistory` có 0 dòng đã được PO xác nhận là do developer trước đây chạy script thủ công ngoài runner. Không điều tra lại nguyên nhân này.
2. **Nguyên tắc An toàn & Toàn vẹn (Zero Destructive Impact):**
   - Không xóa, không drop bảng hoặc làm mất dữ liệu hiện hữu.
   - Sử dụng định dạng chuỗi GUID chuẩn thập lục phân (`0-9`, `A-F`), ổn định và mang tính tất định (deterministic).
   - Đảm bảo 100% câu lệnh `INSERT` hạt giống (seed) phải có mệnh đề kiểm tra tồn tại độc lập (`IF NOT EXISTS` hoặc `MERGE`).
   - Mọi migration sau khi vá phải có khả năng chạy lại nhiều lần (idempotent) mà không gây lỗi trùng khóa chính (PK violation).
3. **Kiểm soát Checksum:**
   - Do chưa có môi trường nào ghi nhận SHA256 checksum vào `__DbMigrationHistory`, việc vá lỗi trên các tệp migration này sẽ thiết lập **Checksum Baseline chuẩn** cho toàn bộ hệ thống kể từ GATE-00C.

---

## 2. CHI TIẾT BẢN VÁ TỪNG TỆP MIGRATION

---

### Patch 1: `20261025_0006_SeedFoundationData.sql`

#### Hiện tượng & Rủi ro:
- Tại dòng 101–108, câu lệnh gán user `admin@shdcorp.vn` vào nhóm `ADMINISTRATORS`:
  ```sql
  INSERT INTO [dbo].[Identity_UserGroupMembers] ([Id], [UserId], [UserGroupId], [ScopeLegalEntityId], [AssignedAtUtc])
  VALUES (NEWID(), 'B0000000-0000-0000-0000-000000000001', 'A0000000-0000-0000-0000-000000000001', NULL, SYSUTCDATETIME());
  ```
  Câu lệnh này nằm trong khối `IF NOT EXISTS (SELECT 1 FROM Identity_Users WHERE Email = 'admin@shdcorp.vn')`. Nếu user đã tồn tại nhưng membership chưa có (hoặc ngược lại), hoặc khi chạy trên database đã có membership, có nguy cơ vi phạm ràng buộc dữ liệu.
- Tại dòng 71–77, lệnh gán quyền cho nhóm `ADMINISTRATORS` cần đảm bảo `Id` của `Identity_UserGroupPermissions` được cấp phát an toàn nếu bảng yêu cầu PK.

#### Nội dung bản vá đề xuất (Proposed Patch):
Bổ sung kiểm tra `IF NOT EXISTS` độc lập cho từng bản ghi quan hệ thành viên:

```sql
-- VÁ DÒNG 100-109 TRONG 20261025_0006_SeedFoundationData.sql:
-- Gán user admin vào nhóm ADMINISTRATORS với phạm vi Global (Bảo đảm Idempotent)
IF NOT EXISTS (
    SELECT 1 FROM [dbo].[Identity_UserGroupMembers] 
    WHERE [UserId] = 'B0000000-0000-0000-0000-000000000001' 
      AND [UserGroupId] = 'A0000000-0000-0000-0000-000000000001'
)
BEGIN
    INSERT INTO [dbo].[Identity_UserGroupMembers] ([Id], [UserId], [UserGroupId], [ScopeLegalEntityId], [AssignedAtUtc])
    VALUES (
        NEWSEQUENTIALID(),
        'B0000000-0000-0000-0000-000000000001',
        'A0000000-0000-0000-0000-000000000001',
        NULL,
        SYSUTCDATETIME()
    );
END;
```

---

### Patch 2: `20261027_0012_ModuleAndFeatureRegistryPlatform.sql`

#### Hiện tượng & Rủi ro:
- Dòng 231–238: Định nghĩa Module IDs bằng các chuỗi bắt đầu bằng ký tự `'M'`:
  `'M1000000-0000-0000-0000-000000000001'` đến `'M1000000-0000-0000-0000-000000000008'`.
- Trong SQL Server, `'M'` không phải là ký tự hex (`0-9`, `A-F`). Thao tác ép kiểu sang `UNIQUEIDENTIFIER` ném lỗi `Msg 8114: Error converting data type varchar to uniqueidentifier`.
- **Hậu quả thực tế:** Khối seed của `0012` đã thất bại khi chạy thủ công trước đây, khiến 8 module nền tảng (`IDENTITY`, `ORGANIZATION`, `PARTY360`, `SYSTEM`, `AUDIT`, `DOCUMENTS`, `MASTERDATA`, `WORKFLOW`) và toàn bộ các Features, Dependencies tương ứng hoàn toàn vắng bóng trong `System_Modules` và `System_Features` của CSDL hiện tại.

#### Nội dung bản vá đề xuất (Proposed Patch):
1. **Chuẩn hóa Module IDs sang chuỗi Hex hợp lệ & Tất định:**
   Sử dụng dải mã định danh tiền tố `'A1000000-...'` (hoàn toàn tương thích hex và đồng bộ với dải `'F1000000-...'` của Features và `'C1000000-...'` của CRM/Commercial):

| Module Code | Tên Phân Hệ | GUID Cũ (Lỗi) | GUID Mới Đề Xuất (Hex Chuẩn) |
|---|---|---|---|
| `IDENTITY` | Định danh & Phân quyền GBAC | `M1000000-0000-0000-0000-000000000001` | **`A1000000-0000-0000-0000-000000000001`** |
| `ORGANIZATION` | Cấu trúc Tổ chức Đa Pháp nhân | `M1000000-0000-0000-0000-000000000002` | **`A1000000-0000-0000-0000-000000000002`** |
| `PARTY360` | Quản trị Chủ thể Party 360 | `M1000000-0000-0000-0000-000000000003` | **`A1000000-0000-0000-0000-000000000003`** |
| `SYSTEM` | Nền tảng Quản trị Hệ thống | `M1000000-0000-0000-0000-000000000004` | **`A1000000-0000-0000-0000-000000000004`** |
| `AUDIT` | Nhật ký Kiểm toán Hệ thống | `M1000000-0000-0000-0000-000000000005` | **`A1000000-0000-0000-0000-000000000005`** |
| `DOCUMENTS` | Quản lý Hồ sơ & Phân loại | `M1000000-0000-0000-0000-000000000006` | **`A1000000-0000-0000-0000-000000000006`** |
| `MASTERDATA` | Danh mục Dữ liệu Dùng chung | `M1000000-0000-0000-0000-000000000007` | **`A1000000-0000-0000-0000-000000000007`** |
| `WORKFLOW` | Quy trình Phê duyệt Doanh nghiệp | `M1000000-0000-0000-0000-000000000008` | **`A1000000-0000-0000-0000-000000000008`** |

2. **Cập nhật mã nguồn SQL `0012`:**
   Thay thế chính xác 8 dòng từ 231 đến 238 trong `20261027_0012_ModuleAndFeatureRegistryPlatform.sql`. Khối lệnh `MERGE` phía sau tự động map `Code` và `ParentCode` để cập nhật bảng `System_Modules` mà không cần sửa đổi thêm bất kỳ logic nào.
3. **Tác động đến migration `0014`:**
   - Trong `0014`, câu lệnh merge `System_ModuleDependencies` (dòng 87–99) sử dụng `JOIN [dbo].[System_Modules] m ON m.[Code] = d.[DependsOnCode]`. Vì `0014` join theo `Code`, việc sửa ID trong `0012` sẽ giúp các ràng buộc phụ thuộc (`CRM` phụ thuộc `IDENTITY`, `ORGANIZATION`, `PARTY360`) tự động được liên kết thành công 100% mà **không cần chỉnh sửa tệp `0014`**!

---

### Patch 3: `20261027_0013_WorkflowEngineAndOutboxEnhancement.sql`

#### Hiện tượng & Rủi ro:
- Khối seed workflow generic `GENERIC_DOCUMENT_APPROVAL` ở dòng 393–419 sử dụng `@GenericDefId = NEWID()`.
- Nếu bảng `Wf_Definitions` đã có bản ghi nhưng `Wf_DefinitionVersions` bị thiếu hoặc ngược lại, việc chạy lại có thể gây lỗi hoặc tạo duplicate versions không kiểm soát.

#### Nội dung bản vá đề xuất (Proposed Patch):
Đặt GUID cố định tất định cho Workflow Definition và kiểm tra tồn tại độc lập cho cả Definition lẫn DefinitionVersion:

```sql
-- VÁ DÒNG 370-420 TRONG 20261027_0013_WorkflowEngineAndOutboxEnhancement.sql:
DECLARE @GenericDefId UNIQUEIDENTIFIER = 'D1000000-0000-0000-0000-000000000001';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Wf_Definitions] WHERE [Code] = 'GENERIC_DOCUMENT_APPROVAL')
BEGIN
    INSERT INTO [dbo].[Wf_Definitions] (
        [Id], [Code], [Name], [Description], [EntityType], [Version], [InitialState], [DefinitionJson], [IsActive], [CreatedAtUtc]
    ) VALUES (
        @GenericDefId,
        'GENERIC_DOCUMENT_APPROVAL',
        N'Quy trình Phê duyệt Văn bản Dùng chung',
        N'Quy trình luân chuyển phê duyệt chứng từ & văn bản mẫu dùng chung cho toàn hệ thống ERP',
        'GenericDocument',
        1,
        'Draft',
        @GenericSchemaJson,
        1,
        SYSUTCDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Wf_DefinitionVersions] WHERE [DefinitionId] = @GenericDefId AND [Version] = 1)
BEGIN
    INSERT INTO [dbo].[Wf_DefinitionVersions] (
        [Id], [DefinitionId], [Version], [InitialState], [DefinitionJson], [Status], [PublishedAtUtc]
    ) VALUES (
        NEWSEQUENTIALID(),
        @GenericDefId,
        1,
        'Draft',
        @GenericSchemaJson,
        'Published',
        SYSUTCDATETIME()
    );
END;
```

---

### Patch 4: `20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql`

#### 4.1. Sửa lỗi GUID Module `ADMISSIONVISA` (Dòng 28)
- Thay thế `'M1000000-0000-0000-0000-000000000003'` bằng GUID hex hợp lệ và duy nhất:
  **`'A1000000-0000-0000-0000-000000000009'`**.
  *(Loại bỏ hoàn toàn sự trùng lặp với `PARTY360` và chấm dứt lỗi Msg 8114)*.

#### 4.2. Xử lý Lệch pha `PartyRelationship` vs SQL Schema & Tách Người Bảo Lãnh

**Hiện trạng đối chiếu:**
- **Entity C# (`PartyEntities.cs`) & EF Mapping (`PartyRelationshipConfiguration.cs`):**
  - Thực thể `PartyRelationship` thuộc phân hệ **Party360**.
  - Mô hình Graph Party-to-Party chuẩn: `FromPartyId`, `ToPartyId`, `RelationshipType` (`Parent`, `Guardian`, `Sponsor`, `Spouse`), `IsActive`, `CreatedAtUtc`.
  - Nghiệp vụ ghi `PartyWriteService.AddRelationshipAsync` ghi vào hai cột `FromPartyId` và `ToPartyId`.
- **SQL Migration `0015` hiện tại:**
  - Định nghĩa bảng `Party_PartyRelationships` với các cột: `PartyId`, `RelatedPartyId`, kèm 8 cột denormalized: `RelatedPersonName`, `PhoneNumber`, `Email`, `NationalId`, `Occupation`, `Address`, `IsEmergencyContact`, `IsLegalGuardian`, `IsFinancialSponsor`, `Notes`.
  - Tên cột khóa ngoại `PartyId` / `RelatedPartyId` lệch pha trực tiếp với EF Core (`FromPartyId` / `ToPartyId`), khiến EF Core lập tức ném lỗi `Invalid column name 'FromPartyId'` khi chạy trên SQL Server thật!

**Phương án Kiến trúc Tách bạch (Architectural Separation Proposal) trình PO phê duyệt:**

Theo định hướng của PO: **Tách riêng Mối quan hệ thân nhân (Party-level Relationship) và Dữ liệu người bảo lãnh theo hồ sơ (Dossier-level Sponsorship)**:

```
[Phân hệ Party360]                                  [Phân hệ AdmissionVisa]
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     Party_PartyRelationships    │                 │      Adm_StudentApplications    │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ Id (PK)                         │                 │ Id (PK)                         │
│ FromPartyId (FK -> Party)       │◄────────┐       │ StudentPartyId (FK -> Party)    │
│ ToPartyId (FK -> Party, Nullable│         │       │ ApplicationCode                 │
│ RelatedPersonName (NVARCHAR)    │         │       │ IntakeTerm, TargetMarket...     │
│ PhoneNumber, Email, NationalId  │         │       └────────────────┬────────────────┘
│ RelationshipType (Cha/Mẹ/Vợ...) │         │                        │ 1
│ IsActive, CreatedAtUtc          │         │                        │
└─────────────────────────────────┘         │                        │ N
                                            │       ┌────────────────┴────────────────┐
                                            │       │     Adm_ApplicationSponsors     │
                                            │       ├─────────────────────────────────┤
                                            │       │ Id (PK)                         │
                                            │       │ ApplicationId (FK -> App)       │
                                            └───────┤ PartyRelationshipId (FK, Null)  │
                                                    │ SponsorPartyId (FK -> Party)    │
                                                    │ IsFinancialSponsor (BIT)        │
                                                    │ IsLegalGuardian (BIT)           │
                                                    │ IsEmergencyContact (BIT)        │
                                                    │ FinancialCapacityVnd (DECIMAL)  │
                                                    │ ProofDocumentsSummary (NVARCHAR)│
                                                    │ Notes (NVARCHAR)                │
                                                    └─────────────────────────────────┘
```

**Chi tiết 2 phương án trình PO lựa chọn:**

- **Phương án A (Khuyến nghị Enterprise Clean Architecture):**
  1. **Trong Party360 (`0015` patch):** Bảng `Party_PartyRelationships` chuẩn hóa tên cột theo đúng C# Entity: `FromPartyId`, `ToPartyId` (cho phép NULL nếu người thân chưa tạo Party), bổ sung các trường thông tin cơ bản của người thân (`RelatedPersonName`, `PhoneNumber`, `Email`, `NationalId`, `Occupation`, `Address`, `RelationshipType`). Đồng bộ lại C# Entity `PartyRelationship` để ánh xạ đúng các trường thông tin này.
  2. **Trong AdmissionVisa (`0015` patch hoặc story US-KR-02):** Bổ sung bảng `Adm_ApplicationSponsors` lưu trữ thông tin bảo lãnh tài chính gắn liền với từng kỳ hồ sơ cụ thể (`IsFinancialSponsor`, `IsLegalGuardian`, `IsEmergencyContact`, hạn mức chứng minh tài chính).
  3. **Lợi ích:** Một người học viên có thể nộp 2 kỳ hồ sơ hoặc chuyển trường, thông tin thân nhân không bị duplicate ở Party360, còn cam kết bảo lãnh tài chính gắn chặt với từng bộ hồ sơ cụ thể.

- **Phương án B (Tối thiểu hóa sửa đổi cho GATE-00C / STU-01):**
  1. Giữ nguyên cấu trúc bảng `Party_PartyRelationships` trong `0015` (có cả cột bảo lãnh), nhưng **sửa tên cột** `PartyId` -> `FromPartyId` và `RelatedPartyId` -> `ToPartyId` để khớp 100% với EF Core `PartyRelationshipConfiguration`.
  2. Cập nhật bổ sung các property tương ứng vào Entity `PartyRelationship` trong C# để EF Core nhận diện đủ các cột.

> [!TIP]
> **Khuyến nghị của Master Agent:** Áp dụng **Phương án A**. Trong phạm vi bản vá `0015` cho GATE-00C, chúng ta sẽ chuẩn hóa tên cột bảng `Party_PartyRelationships` thành `FromPartyId` và `ToPartyId` để EF Core và SQL Server đồng nhất tuyệt đối, đồng thời giữ các cột thông tin thân nhân cần thiết cho màn hình STU-01. Phần mở rộng `Adm_ApplicationSponsors` sẽ được đưa vào User Story `US-KR-02 — Quản lý người bảo lãnh du học Hàn Quốc` theo đúng Sprint Plan.

---

## 3. TỔNG HỢP DANH MỤC THAY ĐỔI CỦA BẢN VÁ

| Tệp Migration | Vị trí thay đổi | Loại thay đổi | Chi tiết tác động |
|---|---|:---:|---|
| [`20261025_0006`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261025_0006_SeedFoundationData.sql) | Dòng 101–108 | Bổ sung Guard | Thêm `IF NOT EXISTS` cho lệnh gán nhóm `ADMINISTRATORS` |
| [`20261027_0012`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql) | Dòng 231–238 | Sửa Lỗi Cú pháp | Đổi `M1000000...` thành `A1000000...` (Hex chuẩn). Seed lại 8 module nền tảng |
| [`20261027_0013`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql) | Dòng 372, 409 | Chuẩn hóa Idempotent | Dùng GUID tất định `D1000000...`, kiểm tra độc lập Definition & Version |
| [`20261029_0015`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql) | Dòng 28 | Sửa Lỗi Cú pháp | Đổi Module ID sang `A1000000-0000-0000-0000-000000000009` |
| [`20261029_0015`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql) | Dòng 212–213, 230–235, 632–647 | Đồng bộ Khóa ngoại | Đổi `PartyId` -> `FromPartyId`, `RelatedPartyId` -> `ToPartyId` khớp với EF Core |

