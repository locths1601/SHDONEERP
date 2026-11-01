# SHD OneERP — DATABASE RECOVERY EXECUTION PLAN
## GATE-00C: Kế hoạch Thực thi Phục hồi & Đồng bộ Cơ sở Dữ liệu Toàn diện

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày lập:** 2026-11-01  
**Tác giả:** Master AI Agent Orchestrator  
**Trạng thái kế hoạch:** `PROPOSED_PLAN` (Chờ Product Owner phê duyệt trước khi chạy bất kỳ script nào)  
**Tài liệu liên quan:** `database/scripts/run-migrations.ps1`, `docs/implementation/student-dossier/`  

---

## 1. MỤC TIÊU & NGUYÊN TẮC CỐT LÕI (OBJECTIVES & GOVERNANCE)

1. **Mục tiêu:**
   - Đưa hệ thống cơ sở dữ liệu `ShdOneErpDb` về trạng thái chuẩn hóa, giải quyết dứt điểm hiện tượng Database Drift được xác nhận tại GATE-00/GATE-00B.
   - Bổ sung 100% các thành phần schema, Stored Procedures, Module Registry bị thiếu (đặc biệt là 8 module nền tảng và toàn bộ phân hệ Tuyển sinh / Hồ sơ học viên `Adm_*` của STU-01/ADM-01).
   - Thiết lập lịch sử migration `__DbMigrationHistory` đồng bộ, chuẩn xác với SHA256 checksum của các bản vá đã được phê chuẩn.
2. **Nguyên tắc Thực thi Bất khả xâm phạm (Execution Guardrails):**
   - **Tuyệt đối không chạy thử nghiệm phá hủy trên CSDL chính `ShdOneErpDb`:** Mọi thao tác chạy migration và sửa đổi phải được kiểm chứng độc lập trên **hai môi trường cô lập** trước khi chạm vào CSDL chính.
   - **Không tự động đánh dấu hoàn thành ồ ạt:** Phân loại chính xác từng migration đã chạy hoàn toàn, chạy một phần, hoặc chưa chạy:
     - `0001` đến `0011`: Đã thực thi hoàn toàn (bảng, SP, seed đã hiện diện).
     - `0012`: **Chạy một phần** (Schema và SP đã có, nhưng Seed Module/Feature bị thiếu do lỗi GUID `M1000...`).
     - `0013`: Đã thực thi hoàn toàn (Schema, SP, seed workflow đã hiện diện).
     - `0014`: **Chạy một phần** (Schema và SP đã có, nhưng quan hệ phụ thuộc vào các module nền tảng chưa liên kết được).
     - `0015`: **Chưa thực thi** (Toàn bộ bảng `Adm_*`, `Party_PartyRelationships` và SPs chưa tồn tại).
   - **Chỉ thực thi khi có sự cho phép bằng văn bản của PO.**

---

## 2. THIẾT KẾ HAI MÔI TRƯỜNG KIỂM THỬ CÔ LẬP (ISOLATED TEST ENVIRONMENTS)

Để đảm bảo an toàn tuyệt đối, kế hoạch thiết lập hai cơ sở dữ liệu thử nghiệm độc lập trên cùng máy chủ SQL Server:

```
                                  [MÔ HÌNH KIỂM THỬ CÔ LẬP]

   ┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
   │  Môi trường 1: Fresh Database          │       │  Môi trường 2: Restored Clone Database │
   │  Tên DB: [ShdOneErpDb_Fresh]           │       │  Tên DB: [ShdOneErpDb_Clone]           │
   ├────────────────────────────────────────┤       ├────────────────────────────────────────┤
   │ - Tạo mới từ đầu (Zero-state).         │       │ - Phục hồi từ bản sao lưu .bak của     │
   │ - Chạy tự động runner tuần tự          │       │   [ShdOneErpDb] hiện hữu.              │
   │   từ 0001 đến 0015 (đã áp dụng vá).    │       │ - Thực hiện bổ sung phần thiếu của     │
   │ - Kiểm chứng: Toàn bộ 15 scripts chạy  │       │   0012/0014 và áp dụng migration 0015. │
   │   không lỗi, ghi đủ 15 rows history.   │       │ - Reconcile bảng lịch sử migration.    │
   └───────────────────┬────────────────────┘       └───────────────────┬────────────────────┘
                       │                                                │
                       └───────────────────┬────────────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   Schema & Object Comparison Gate      │
                       │   (So sánh độ đồng nhất 100%)          │
                       └───────────────────┬────────────────────┘
                                           │ Pass (Khớp 100%)
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   Căn chỉnh CSDL chính [ShdOneErpDb]   │
                       │   (Sau khi PO chính thức phê duyệt)    │
                       └────────────────────────────────────────┘
```

---

## 3. QUY TRÌNH THỰC THI 6 GIAI ĐOẠN (6-PHASE EXECUTION PROTOCOL)

### Giai đoạn 1: Chuẩn bị Bản vá & Rà soát Mã nguồn (Patch Preparation)
1. Áp dụng các thay đổi đề xuất trong `MIGRATION_REMEDIATION_PATCH_PROPOSAL.md` vào các tệp migration:
   - `database/migrations/20261025_0006_SeedFoundationData.sql`
   - `database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql`
   - `database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql`
   - `database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql`
2. Tính toán và lưu trữ bảng mã băm SHA256 chính thức cho toàn bộ 15 tệp migration.

### Giai đoạn 2: Kiểm thử trên Fresh Database (`ShdOneErpDb_Fresh`)
1. Tạo cơ sở dữ liệu rỗng:
   ```sql
   IF DB_ID('ShdOneErpDb_Fresh') IS NOT NULL DROP DATABASE [ShdOneErpDb_Fresh];
   CREATE DATABASE [ShdOneErpDb_Fresh];
   ```
2. Thực thi toàn bộ bộ migration thông qua runner chuẩn:
   ```powershell
   .\database\scripts\run-migrations.ps1 -Database "ShdOneErpDb_Fresh"
   ```
3. Tiêu chí đánh giá Giai đoạn 2 (Pass Criteria):
   - Exit code = 0 (Thành công 100%).
   - Bảng `[ShdOneErpDb_Fresh].[dbo].[__DbMigrationHistory]` ghi nhận đúng 15 bản ghi tương ứng 15 tệp migration.
   - Bảng `System_Modules` có đủ 11 modules (`IDENTITY`, `ORGANIZATION`, `PARTY360`, `SYSTEM`, `AUDIT`, `DOCUMENTS`, `MASTERDATA`, `WORKFLOW`, `CRM`, `COMMERCIAL`, `ADMISSIONVISA`).
   - Bảng `System_Features` có đủ 29 features (12 foundation + 17 CRM/Commercial).
   - Các bảng `Adm_StudentApplications`, `Adm_ChecklistItems`, `Party_PartyRelationships` tồn tại với đúng cấu trúc.

### Giai đoạn 3: Sao lưu CSDL Hiện hữu & Tạo Restored Clone (`ShdOneErpDb_Clone`)
1. Thực hiện sao lưu toàn phần (Full Backup) CSDL `ShdOneErpDb`:
   ```sql
   BACKUP DATABASE [ShdOneErpDb]
   TO DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRemediation_20261101.bak'
   WITH FORMAT, INIT, COMPRESSION, STATS = 10;
   ```
2. Kiểm tra tính toàn vẹn của tệp backup:
   ```sql
   RESTORE VERIFYONLY FROM DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRemediation_20261101.bak';
   ```
3. Phục hồi bản sao lưu sang database `ShdOneErpDb_Clone`:
   ```sql
   IF DB_ID('ShdOneErpDb_Clone') IS NOT NULL DROP DATABASE [ShdOneErpDb_Clone];
   RESTORE DATABASE [ShdOneErpDb_Clone]
   FROM DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRemediation_20261101.bak'
   WITH MOVE 'ShdOneErpDb' TO 'F:\MyProjectSHD\SHDONEERP\database\data\ShdOneErpDb_Clone.mdf',
        MOVE 'ShdOneErpDb_log' TO 'F:\MyProjectSHD\SHDONEERP\database\data\ShdOneErpDb_Clone_log.ldf';
   ```

### Giai đoạn 4: Phục hồi Dữ liệu Thiếu & Áp dụng Migration trên Clone
Thực hiện script khắc phục có kiểm soát trên `ShdOneErpDb_Clone`:
1. **Bổ sung phần seed thiếu của `0012`:**
   Chạy khối lệnh seed `System_Modules` (với GUID `A1000...`) và `System_Features` từ tệp `0012` đã vá.
2. **Tái liên kết quan hệ phụ thuộc của `0014`:**
   Chạy khối lệnh merge `System_ModuleDependencies` từ tệp `0014` để liên kết các ràng buộc `CRM` -> `IDENTITY`, `ORGANIZATION`, `PARTY360`.
3. **Áp dụng migration `0015`:**
   Chạy tệp `20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` đã vá lên `ShdOneErpDb_Clone`.
4. **Đồng bộ hóa `__DbMigrationHistory` (Backfill Reconciliation):**
   Chèn đầy đủ 15 bản ghi lịch sử vào `[ShdOneErpDb_Clone].[dbo].[__DbMigrationHistory]` với chính xác `MigrationId`, `MigrationName`, `Checksum` (SHA256 của các tệp đã vá), `AppliedAtUtc`, `AppliedBy`.

### Giai đoạn 5: Đối soát Schema & Kiểm thử Tích hợp (Verification Gate)
1. **So sánh Schema (Schema Comparison):**
   Chạy script tự động so khớp metadata giữa `ShdOneErpDb_Fresh` và `ShdOneErpDb_Clone`:
   - Số lượng bảng: Khớp 100%.
   - Danh sách cột, kiểu dữ liệu, nullability, defaults: Khớp 100%.
   - Khóa chính, Khóa ngoại, Unique Indexes: Khớp 100%.
   - Danh sách Stored Procedures và tham số đầu vào: Khớp 100%.
2. **Kiểm thử Ứng dụng Backend (.NET 10 Tests):**
   - Chạy `dotnet test backend/ShdOneErp.sln`.
   - Chạy thử nghiệm các API đọc qua Stored Procedure: `sp_Party_Student_GetPagedList`, `sp_Admission_Application_GetPagedList` trên `ShdOneErpDb_Clone`.

### Giai đoạn 6: Triển khai Căn chỉnh trên CSDL Chính (`ShdOneErpDb`)
*Lưu ý: Chỉ thực hiện giai đoạn này khi Giai đoạn 1–5 đã hoàn tất và được PO phê duyệt.*
1. Khóa phân tán ứng dụng bằng `sp_getapplock` để đảm bảo không có truy cập đồng thời.
2. Áp dụng tuần tự các bước phục hồi tương tự như đã kiểm chứng thành công trên `ShdOneErpDb_Clone`.
3. Kiểm tra lại `SELECT COUNT(1) FROM [dbo].[__DbMigrationHistory]` (kết quả mong đợi: 15 bản ghi).
4. Xác nhận toàn bộ hệ thống sẵn sàng cho User Story tiếp theo `SYS-REF-01`.

---

## 4. KẾ HOẠCH DỰ PHÒNG & XỬ LÝ SỰ CỐ (ROLLBACK & FORWARD-FIX PROTOCOL)

1. **Nếu xảy ra lỗi trong Giai đoạn 2 hoặc 4 (trên môi trường test):**
   - Sự cố được cô lập hoàn toàn trong database test, CSDL chính `ShdOneErpDb` không bị ảnh hưởng.
   - Master Agent tiến hành phân tích log lỗi, hiệu chỉnh bản vá (forward-fix) và chạy lại thử nghiệm.
2. **Nếu xảy ra lỗi bất khả kháng trong Giai đoạn 6 (trên CSDL chính):**
   - Ngay lập tức kích hoạt giao dịch hủy bỏ (Transaction Rollback).
   - Nếu có bất kỳ nghi ngờ nào về tính toàn vẹn dữ liệu, thực hiện khôi phục khẩn cấp từ tệp backup đã tạo ở Giai đoạn 3:
     ```sql
     ALTER DATABASE [ShdOneErpDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
     RESTORE DATABASE [ShdOneErpDb] 
     FROM DISK = 'F:\MyProjectSHD\SHDONEERP\database\backups\ShdOneErpDb_PreRemediation_20261101.bak' 
     WITH REPLACE;
     ALTER DATABASE [ShdOneErpDb] SET MULTI_USER;
     ```
   - Dừng toàn bộ tiến trình và báo cáo ngay lập tức cho Product Owner.

---

## 5. BẢNG TIÊU CHÍ NGHIỆM THU PHỤC HỒI (RECOVERY ACCEPTANCE CRITERIA)

| Mã Tiêu chí | Nội dung kiểm tra | Phương pháp kiểm chứng | Kết quả yêu cầu |
|:---:|---|---|:---:|
| **REC-01** | Fresh Database khởi tạo thành công 100% | Chạy `run-migrations.ps1 -Database ShdOneErpDb_Fresh` | Exit code 0, 15 migrations applied |
| **REC-02** | Toàn bộ 11 Module nền tảng & nghiệp vụ có mặt | `SELECT Code FROM System_Modules` | Đủ 11 modules (`IDENTITY`... `ADMISSIONVISA`) |
| **REC-03** | Toàn bộ 29 Features được đăng ký đầy đủ | `SELECT COUNT(1) FROM System_Features` | Đúng 29 features |
| **REC-04** | Module Dependencies liên kết chính xác | `SELECT COUNT(1) FROM System_ModuleDependencies` | Đủ các quan hệ phụ thuộc của Foundation & CRM |
| **REC-05** | Bảng hồ sơ học viên & checklist được tạo lập | `SELECT * FROM sys.tables WHERE name LIKE 'Adm_%'` | Đủ `Adm_StudentApplications`, `Adm_ChecklistItems`... |
| **REC-06** | Schema giữa Fresh và Clone đồng nhất tuyệt đối | T-SQL metadata compare script | 0 sai lệch về bảng, cột, khóa, SPs |
| **REC-07** | Bảng lịch sử migration đồng bộ | `SELECT COUNT(1) FROM __DbMigrationHistory` | Đủ 15 bản ghi với SHA256 checksum hợp lệ |
| **REC-08** | Backend build và unit tests không bị thoái lui | `dotnet build` & `dotnet test` | Build PASS, 152/152 tests PASS |

