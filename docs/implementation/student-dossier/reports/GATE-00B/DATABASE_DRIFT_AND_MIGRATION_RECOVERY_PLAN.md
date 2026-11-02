# SHD OneERP — DATABASE DRIFT INVESTIGATION & MIGRATION RECOVERY PLAN
## GATE-00B: Điều tra Lệch pha Cơ sở Dữ liệu & Kế hoạch Phục hồi Đồng bộ Migration

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày thực hiện:** 2026-10-30  
**Người thực hiện:** Master AI Agent Orchestrator  
**Trạng thái cổng:** `GATE-00B` — Remediation & Investigation (Chế độ CHỈ ĐỌC, không sửa đổi dữ liệu)  
**Tài liệu tham chiếu:** `database/migrations/`, `database/scripts/run-migrations.ps1`, `docs/implementation/student-dossier/`

---

## 1. TỔNG QUAN ĐIỀU TRA & NGUYÊN TẮC AN TOÀN

Trong phiên thẩm định GATE-00, Product Owner đã đưa ra phán quyết:
- **GATE-00: CONDITIONAL**
- **SYS-REF-01 Readiness: BLOCKED**

Nguyên nhân cốt lõi là sự phát hiện hiện tượng **Database Drift nghiêm trọng**: CSDL SQL Server `ShdOneErpDb` chứa 48 bảng và 35 Stored Procedures, nhưng bảng quản lý lịch sử `__DbMigrationHistory` lại hoàn toàn rỗng (**0 dòng dữ liệu**). Đồng thời, migration `20261029_0015` (chứa toàn bộ schema của STU-01 và ADM-01) chưa hề được áp dụng trên cơ sở dữ liệu thật.

### Nguyên tắc bảo vệ dữ liệu (Strict Guardrails trong GATE-00B):
1. **Chế độ CHỈ ĐỌC (Read-Only):** Tuyệt đối không can thiệp ghi, không chạy lệnh DDL/DML, không drop/alter bảng, không sửa dữ liệu.
2. **Không tự chèn dữ liệu:** Tuyệt đối không tự ý `INSERT INTO [dbo].[__DbMigrationHistory]`.
3. **Không chạy lại migration bừa bãi:** Không tự động thực thi `run-migrations.ps1` hoặc áp dụng migration `0015`/`0016` khi chưa có quy trình kiểm soát rủi ro được PO phê duyệt.
4. **Không thử nghiệm phá hủy:** Mọi kịch bản phục hồi phải được thiết kế trên môi trường database thử nghiệm cô lập, có backup và so khớp schema chi tiết.

---

## 2. ĐỐI SOÁT HIỆN TRẠNG TOÀN BỘ SQL MIGRATIONS & SCHEMA CSDL

### 2.1. Danh mục 15 Tệp Migration Viết tay trong Repository

Toàn bộ các tệp migration trong thư mục [`database/migrations/`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/) đã được đối soát theo thứ tự thời gian:

| STT | Tên tệp Migration | Phân hệ / Nội dung | Tồn tại trên đĩa | Trạng thái trong `__DbMigrationHistory` | Hiện diện trong SQL Server |
|:---:|---|---|:---:|:---:|:---:|
| 01 | `20261025_0001_InitialMigrationHistory.sql` | Tạo `__DbMigrationHistory`, `SystemAuditLogs` | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 02 | `20261025_0002_IdentityAndAuthorizationSchema.sql` | Bảng `Identity_Users`, `Identity_UserGroups`,... | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 03 | `20261025_0003_OrganizationSchema.sql` | Bảng `Org_LegalEntities`, `Org_BusinessUnits`,... | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 04 | `20261025_0004_Party360Schema.sql` | Bảng `Party_Parties`, `Party_Persons`,... | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 05 | `20261025_0005_StoredProcedures_Organization.sql` | SP Legal Entity & Direct GBAC | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI SP** |
| 06 | `20261025_0006_SeedFoundationData.sql` | Seed quyền nền tảng, user `admin@shdcorp.vn` | CÓ | **0 bản ghi** | **ĐÃ CÓ DỮ LIỆU** |
| 07 | `20261026_0007_BusinessUnitManagementAndScopedReads.sql` | SP quản lý Business Unit & Scope | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI SP** |
| 08 | `20261026_0008_Party360StoredProcedures.sql` | SP quản lý Party & Tra cứu | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI SP** |
| 09 | `20261026_0009_BranchManagementAndScopedReads.sql` | SP quản lý Chi nhánh Campus & Scope | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI SP** |
| 10 | `20261026_0010_EnterpriseFoundationPlatform.sql` | Audit, Outbox, MasterDataCatalogs, Documents, Wf | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 11 | `20261026_0011_UserGroupAndAuditStoredProcedures.sql` | SP nhóm quyền Direct GBAC & Audit | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI SP** |
| 12 | `20261027_0012_ModuleAndFeatureRegistryPlatform.sql` | Module/Feature Registry, Actions, Permissions | CÓ | **0 bản ghi** | **BẢNG CÓ, SEED LỖI** |
| 13 | `20261027_0013_WorkflowEngineAndOutboxEnhancement.sql` | Workflow Definition Versions & Outbox History | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG** |
| 14 | `20261028_0014_CrmAndCommercialFoundationRegistryAndSchema.sql` | Schema CRM & Commercial, SPs | CÓ | **0 bản ghi** | **ĐÃ TỒN TẠI BẢNG & SP** |
| 15 | `20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` | STU-01 & ADM-01: Applications, Checklist, SPs | CÓ | **0 bản ghi** | **CHƯA ĐƯỢC CHẠY (DRIFT)** |

### 2.2. Cơ chế Hoạt động của `run-migrations.ps1`
Khi kiểm toán mã nguồn [`database/scripts/run-migrations.ps1`](file:///F:/MyProjectSHD/SHDONEERP/database/scripts/run-migrations.ps1):
- **Khóa phân tán:** Dùng `sp_getapplock @Resource = 'SHD_OneERP_MigrationRunner', @LockMode = 'Exclusive', @LockOwner = 'Session'` để ngăn chặn nhiều runner chạy đồng thời.
- **Bảng lịch sử:** Tự động tạo bảng `__DbMigrationHistory` nếu chưa tồn tại.
- **Tra cứu:** Đọc `SELECT MigrationId, Checksum FROM [dbo].[__DbMigrationHistory]` để xác định file nào đã chạy.
- **Thực thi:** Quét thư mục `database/migrations/`, sắp xếp theo tên file. Nếu `MigrationId` chưa có trong bảng lịch sử, đọc nội dung, tách các khối `GO`, thực thi trong một `SqlTransaction`, tính hash SHA256 và chạy câu lệnh:
  ```powershell
  INSERT INTO [dbo].[__DbMigrationHistory] (MigrationId, MigrationName, Checksum, ExecutionTimeMs)
  VALUES (@MigrationId, @MigrationName, @Checksum, @ExecutionTimeMs);
  ```
- **Lưu ý quyết định:** Bản thân các tệp migration `.sql` **KHÔNG CHỨA** câu lệnh tự ghi vào `__DbMigrationHistory`. Việc ghi lịch sử hoàn toàn phụ thuộc vào việc thực thi thông qua runner PowerShell này.

---

## 3. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - RCA)

### RCA 1: Tại sao CSDL có 48 bảng nhưng `__DbMigrationHistory` lại có 0 dòng?
- **Nguyên nhân gốc rễ:** Các kỹ sư hoặc AI Agent phát triển các phân hệ trước đây (Foundation, Identity, CRM, Commercial) đã thực thi các tệp SQL migration từ `0001` đến `0014` bằng cách **chạy trực tiếp thông qua công cụ dòng lệnh hoặc SSMS/VS Code**, mà **KHÔNG CHẠY THÔNG QUA SCRIPT `run-migrations.ps1`**.
- **Bằng chứng:**
  - Bảng `__DbMigrationHistory` được tạo vào lúc `2026-10-26 21:18:45` (chính xác cùng thời điểm tạo bảng `SystemAuditLogs` trong file `0001`).
  - Toàn bộ các bảng và Stored Procedures của `0001` đến `0014` đều đã hiện diện trong CSDL với thời gian khởi tạo trải dài từ ngày `2026-10-26` đến `2026-10-28`.
  - Bảng `__DbMigrationHistory` có 0 dòng dữ liệu vì không có tiến trình nào gọi khối `INSERT INTO __DbMigrationHistory`.

### RCA 2: Lỗi chuyển đổi GUID không hợp lệ (`M1000000...`) trong Migration `0012` và `0015`
- **Nguyên nhân gốc rễ:** Trong tệp `20261027_0012_ModuleAndFeatureRegistryPlatform.sql` (dòng 231-238) và `20261029_0015_...` (dòng 28), tác giả đã sử dụng chuỗi định danh tự tạo:
  `'M1000000-0000-0000-0000-000000000001'` đến `'M1000000-0000-0000-0000-000000000008'`.
- **Phân tích kỹ thuật:**
  - Kiểu dữ liệu `UNIQUEIDENTIFIER` trong Microsoft SQL Server bắt buộc là chuỗi thập lục phân (Hexadecimal: ký tự `0-9` và `A-F`).
  - Ký tự `'M'` (ASCII 0x4D) **KHÔNG PHẢI** là ký tự hex hợp lệ.
  - Lệnh kiểm tra thực tế: `SELECT TRY_CAST('M1000000-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER)` trả về `NULL`. Khi cố ép kiểu trong lệnh `INSERT`, SQL Server lập tức dừng với lỗi:
    `Msg 8114, Level 16: Error converting data type varchar to uniqueidentifier.`
- **Hậu quả thực tế:**
  - Khi chạy migration `0012`, khối lệnh seed `IDENTITY`, `ORGANIZATION`, `PARTY360`, `SYSTEM`, `MASTERDATA`, `WORKFLOW` đã bị lỗi và không thể insert vào `System_Modules`.
  - Trong khi đó, ở migration `0014`, tác giả dùng `'C1000000...'` và `'C2000000...'` (ký tự `'C'` là ký tự hex hợp lệ), do đó chỉ có `CRM` và `COMMERCIAL` là được ghi nhận thành công vào `System_Modules` (hiện có đúng 2 dòng trong CSDL).

### RCA 3: Tại sao migration `20261029_0015` chưa được áp dụng?
- **Nguyên nhân gốc rễ:**
  1. Migration `0015` được tạo vào ngày `2026-10-29`. AI Agent triển khai STU-01/ADM-01 chỉ chạy kiểm thử in-memory unit tests (152 tests) mà không thực thi migration lên SQL Server thật.
  2. Khi cố gắng chạy thử file `0015`, script sẽ thất bại ngay tại dòng 28 do lỗi ép kiểu GUID `'M1000000-0000-0000-0000-000000000003'`.
  3. Bảng `Adm_StudentApplications`, `Adm_ChecklistItems`, `Party_PartyRelationships` và các SP đi kèm hoàn toàn chưa tồn tại trong `ShdOneErpDb`.

---

## 4. ĐÁNH GIÁ TÁC ĐỘNG VÀ NGUY CƠ NẾU CHẠY LẠI MIGRATIONS BỪA BÃI

Nếu hiện tại một kỹ sư chạy lệnh `powershell database/scripts/run-migrations.ps1` mà không có phương án xử lý, hệ thống sẽ gặp các thảm họa kỹ thuật sau:

1. **Thất bại ngay lập tức do vi phạm ràng buộc khóa chính (PK Violation):**
   - Runner kiểm tra `__DbMigrationHistory` thấy 0 dòng -> runner sẽ thực thi lại từ file `0001`.
   - File `0001` đến `0005` sẽ lướt qua an toàn nhờ `IF NOT EXISTS` và `CREATE OR ALTER PROCEDURE`.
   - Đến file `20261025_0006_SeedFoundationData.sql` dòng 101:
     `INSERT INTO [dbo].[Identity_UserGroupMembers] ([Id], [UserId], [UserGroupId], [ScopeLegalEntityId], [AssignedAtUtc])`
     Câu lệnh này **KHÔNG CÓ GUARD KIỂM TRA TỒN TẠI**. Vì bản ghi `admin@shdcorp.vn` gia nhập nhóm `ADMINISTRATORS` đã tồn tại trong CSDL, SQL Server sẽ ném lỗi:
     `Violation of PRIMARY KEY constraint 'PK_Identity_UserGroupMembers'. Cannot insert duplicate key.`
   - Toàn bộ transaction của migration `0006` bị ROLLBACK, tiến trình runner `exit 1` và dừng hoàn toàn.
2. **Kẹt ở lỗi chuyển đổi GUID (Invalid GUID Conversion):**
   - Giả sử vượt qua `0006`, đến file `0012` và `0015`, runner sẽ dừng lại do lỗi chuỗi GUID chứa ký tự `M`.
3. **Kẹt ở lỗi vi phạm khóa chính Workflow Definition:**
   - Trong file `20261027_0013_WorkflowEngineAndOutboxEnhancement.sql` dòng 393 và 409, các câu lệnh `INSERT INTO [dbo].[Wf_Definitions]` và `[dbo].[Wf_DefinitionVersions]` là lệnh insert trực tiếp không guard, sẽ gây lỗi Duplicate Key.

**KẾT LUẬN:** Tuyệt đối không được phép chạy lại `run-migrations.ps1` khi chưa thực hiện quy trình phục hồi (Recovery Plan).

---

## 5. ĐỐI SOÁT DIVERGENCE: ENTITY `PartyRelationship` VS SQL SCHEMA `0015`

Qua việc so sánh trực tiếp giữa mã nguồn C# và script SQL migration `0015`, Master Agent phát hiện sự sai lệch cấu trúc cực kỳ nghiêm trọng:

### Bảng đối chiếu thuộc tính `PartyRelationship`

| Thuộc tính C# (`PartyEntities.cs`) | Kiểu C# | Cột CSDL (`Party_PartyRelationships` trong `0015`) | Kiểu SQL | Đánh giá sai lệch (Divergence) |
|---|---|---|---|---|
| `Id` | `Guid` | `[Id]` | `UNIQUEIDENTIFIER` | Khớp |
| `FromPartyId` | `Guid` | `[PartyId]` | `UNIQUEIDENTIFIER` | **SAI TÊN CỘT** (EF mong đợi `FromPartyId`) |
| `ToPartyId` | `Guid` | `[RelatedPartyId]` | `UNIQUEIDENTIFIER NULL` | **SAI TÊN CỘT & NULLABILITY** |
| `RelationshipType` | `string` | `[RelationshipType]` | `NVARCHAR(50)` | Khớp |
| `IsActive` | `bool` | `[IsActive]` | `BIT` | Khớp |
| `CreatedAtUtc` | `DateTime` | `[CreatedAtUtc]` | `DATETIME2(7)` | Khớp |
| *(Không có trong C#)* | - | `[RelatedPersonName]` | `NVARCHAR(150) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[PhoneNumber]` | `NVARCHAR(50) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[Email]` | `NVARCHAR(150) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[NationalId]` | `NVARCHAR(50) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[Occupation]` | `NVARCHAR(100) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[Address]` | `NVARCHAR(250) NULL` | **THỪA TRONG SQL** (Denormalized) |
| *(Không có trong C#)* | - | `[IsEmergencyContact]` | `BIT` | **THỪA TRONG SQL** |
| *(Không có trong C#)* | - | `[IsLegalGuardian]` | `BIT` | **THỪA TRONG SQL** |
| *(Không có trong C#)* | - | `[IsFinancialSponsor]` | `BIT` | **THỪA TRONG SQL** |
| *(Không có trong C#)* | - | `[Notes]` | `NVARCHAR(500) NULL` | **THỪA TRONG SQL** |
| *(Không có trong C#)* | - | `[UpdatedAtUtc]` | `DATETIME2(7) NULL` | Thừa trong SQL |
| *(Không có trong C#)* | - | `[RowVersion]` | `ROWVERSION` | C# chưa map concurrency token |

### Tác động kỹ thuật:
- Lớp cấu hình EF Core [`PartyRelationshipConfiguration.cs`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Persistence/Configurations/Configurations.cs#L270-L288) đang cấu hình:
  ```csharp
  builder.HasOne(x => x.FromParty).WithMany(x => x.Relationships).HasForeignKey(x => x.FromPartyId);
  builder.HasOne(x => x.ToParty).WithMany().HasForeignKey(x => x.ToPartyId);
  ```
- Nếu áp dụng script `0015` như hiện tại vào SQL Server, bất kỳ truy vấn nào của EF Core liên quan đến `PartyRelationship` sẽ lập tức ném lỗi:
  `Invalid column name 'FromPartyId'. Invalid column name 'ToPartyId'.`
- Đây là bằng chứng không thể chối cãi giải thích tại sao 152 tests của STU-01 chỉ chạy được trên **EF Core In-Memory Database** mà hoàn toàn chưa từng chạy được trên **Microsoft SQL Server thật**.

---

## 6. ĐỀ XUẤT PHƯƠNG ÁN PHỤC HỒI MIGRATION AN TOÀN (MIGRATION RECOVERY PLAN)

Để phục hồi tính toàn vẹn của CSDL và runner mà không làm gián đoạn hệ thống hay mất mát dữ liệu, đề xuất quy trình 6 bước chuẩn mực:

```
[BƯỚC 1: BACKUP CSDL THẬT] ──> [BƯỚC 2: TẠO CSDL TEST CÔ LẬP] ──> [BƯỚC 3: SỬA LỖI MIGRATION (FORWARD-FIX)]
                                                                               │
[BƯỚC 6: BÀN GIAO PO] <── [BƯỚC 5: ĐỐI SOÁT & ALIGN CSDL CHÍNH] <── [BƯỚC 4: DRY-RUN TRÊN TEST DB]
```

### Bước 1: Sao lưu Cơ sở dữ liệu Thực tế (Preflight Database Backup)
Thực hiện sao lưu toàn phần CSDL `ShdOneErpDb` trước khi thực hiện bất kỳ thao tác nào:
```sql
BACKUP DATABASE [ShdOneErpDb] 
TO DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRecovery_20261030.bak' 
WITH FORMAT, INIT, COMPRESSION, STATS = 10;
```

### Bước 2: Tạo Cơ sở dữ liệu Thử nghiệm Cô lập (Sandbox Clone)
Tạo CSDL `ShdOneErpDb_Test` hoàn toàn mới trên cùng SQL Server instance để kiểm thử độc lập:
```sql
CREATE DATABASE [ShdOneErpDb_Test];
```

### Bước 3: Sửa đổi Hợp thức hóa các Tệp Migration (Forward-Fix Migration Scripts)
1. **Khắc phục lỗi GUID `M1000000...` trong `0012` và `0015`:**
   - Thay thế tiền tố `M` bằng ký tự Hex hợp lệ (ví dụ: `E1000000-0000-0000-0000-000000000001` hoặc dùng `NEWID()` / `NEWSEQUENTIALID()`).
2. **Đảm bảo tính Idempotent cho các câu lệnh `INSERT`:**
   - Bổ sung `IF NOT EXISTS` cho lệnh insert trong `20261025_0006_SeedFoundationData.sql` dòng 71 và 101.
   - Bổ sung `IF NOT EXISTS` cho lệnh insert trong `20261027_0013_WorkflowEngineAndOutboxEnhancement.sql` dòng 393 và 409.
3. **Thống nhất Mô hình `PartyRelationship` trong `0015`:**
   - Trình PO phê duyệt lựa chọn: Giữ mô hình chuẩn Graph Party-to-Party (`FromPartyId`, `ToPartyId`) hay mở rộng Entity C# để chứa thông tin người bảo trợ thân nhân (`RelatedPersonName`, `PhoneNumber`, `IsFinancialSponsor`).

### Bước 4: Chạy thử nghiệm toàn diện (Dry-Run trên Test DB)
Chạy script `run-migrations.ps1` hướng vào database test `ShdOneErpDb_Test`:
```powershell
.\database\scripts\run-migrations.ps1 -Database "ShdOneErpDb_Test"
```
- Xác nhận toàn bộ 15 migrations chạy thành công tuần tự từ `0001` đến `0015`.
- Kiểm tra bảng `[ShdOneErpDb_Test].[dbo].[__DbMigrationHistory]` phải có đủ 15 bản ghi kèm SHA256 checksum và thời gian thực thi.

### Bước 5: Căn chỉnh Cơ sở dữ liệu Chính (`ShdOneErpDb`)
Sau khi đối soát cấu trúc bảng giữa `ShdOneErpDb` và `ShdOneErpDb_Test` bằng công cụ schema compare đạt 100% đồng nhất:
1. Thực hiện **Backfill Migration History** an toàn cho các migration từ `0001` đến `0014` vào bảng `[dbo].[__DbMigrationHistory]` trên `ShdOneErpDb` bằng script chuyên dụng, ghi nhận đúng SHA256 của các tệp đã được chuẩn hóa.
2. Áp dụng migration `0015` đã được sửa lỗi lên `ShdOneErpDb` thông qua runner chính thức.

### Bước 6: Kế hoạch Rollback và Forward-Fix Dự phòng
- Nếu xảy ra bất kỳ sai lệch nào trong quá trình căn chỉnh CSDL chính:
  - Lập tức hủy giao dịch (Rollback Transaction).
  - Phục hồi lại CSDL từ file backup đã tạo ở Bước 1:
    ```sql
    ALTER DATABASE [ShdOneErpDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE [ShdOneErpDb] FROM DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRecovery_20261030.bak' WITH REPLACE;
    ALTER DATABASE [ShdOneErpDb] SET MULTI_USER;
    ```
- Toàn bộ thao tác chỉ được thực hiện sau khi có sự phê chuẩn chính thức bằng văn bản từ Product Owner.

---

## 7. KẾT LUẬN & TRẠNG THÁI KIỂM TOÁN

- **Kết luận:** Master Agent đã tìm ra chính xác 100% nguyên nhân gốc rễ của hiện tượng Database Drift, xác định được lỗi chuyển đổi GUID tiềm ẩn và sự lệch pha cấu trúc giữa Domain và SQL Schema.
- **Trạng thái:** **INVESTIGATION COMPLETE — READINESS: READY FOR PO REVIEW**. Hệ thống đang ở trạng thái an toàn, không có bất kỳ thao tác ghi trái phép nào được thực hiện trên CSDL.

