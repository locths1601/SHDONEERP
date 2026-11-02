# SHD OneERP — GATE-00 EVIDENCE INDEX & VERIFICATION LEDGER
## GATE-00B: Sổ cái Bằng chứng Kiểm toán Hiện trạng Toàn diện

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày thực hiện:** 2026-10-30  
**Người thực hiện:** Master AI Agent Orchestrator  
**Môi trường kiểm toán:** Windows OS, Local Microsoft SQL Server `localhost` (`ShdOneErpDb`), .NET 10 SDK, Node.js v20+ / Vite  

---

## 1. HỆ THỐNG PHÂN LOẠI BẰNG CHỨNG (4-TIER VERIFICATION TAXONOMY)

Để đảm bảo tính minh bạch tối đa và loại bỏ hoàn toàn các báo cáo "ảo" (fake pass), mọi phát hiện trong GATE-00 và GATE-00B đều được phân loại nghiêm ngặt theo 4 cấp độ:

| Cấp độ Phân loại | Mã ký hiệu | Ý nghĩa & Điều kiện công nhận |
|---|:---:|---|
| **Verified by Actual Execution** | `EXEC_VERIFIED` | Đã thực thi lệnh thực tế trên máy, có exit code, log output và kiểm chứng trực tiếp trên tiến trình/CSDL. |
| **Code Inspection Only** | `CODE_INSPECT` | Đã đọc trực tiếp từng dòng mã nguồn, tệp migration hoặc cấu hình trong repository; chưa chạy runtime. |
| **Agent Assumption** | `AGENT_ASSUMP` | Suy luận logic của Agent từ bối cảnh; **CẦN PO XÁC NHẬN CHÍNH THỨC**, không được coi là sự thật hiển nhiên. |
| **Not Verified** | `NOT_VERIFIED` | Chưa thể kiểm chứng do thiếu môi trường, thiếu dữ liệu thử nghiệm hoặc vi phạm lệnh cấm can thiệp CSDL. |

---

## 2. SỔ CÁI BẰNG CHỨNG KIỂM TOÁN TỔNG HỢP (COMPREHENSIVE EVIDENCE INDEX)

### 2.1. Kiểm toán Biên dịch & Bộ Kiểm thử Tự động (Build & Tests)

| Mục kiểm toán | Lệnh thực thi thực tế | Exit Code | Kết quả | Cấp độ | Giới hạn kỹ thuật của bằng chứng |
|---|---|:---:|:---:|:---:|---|
| **Backend Build** | `dotnet build backend/ShdOneErp.sln` | 0 | **0 Errors, 0 Warnings** | `EXEC_VERIFIED` | Chỉ kiểm tra tính đúng đắn của cú pháp C# và tham chiếu DLL. |
| **Frontend Build** | `npm run build` (trong `frontend/`) | 0 | **0 TS Errors, Vite Bundle OK** | `EXEC_VERIFIED` | Chỉ kiểm tra tính hợp lệ của TypeScript và bundle assets. |
| **Unit Test Suite** | `dotnet test backend/ShdOneErp.sln` | 0 | **152/152 PASS (100%)** | `EXEC_VERIFIED` | **GIỚI HẠN:** 100% tests chạy trên EF Core InMemory Provider và Moq; **KHÔNG PHẢI** là kiểm thử trên SQL Server thật hay E2E UI. |

### 2.2. Kiểm toán Cơ sở Dữ liệu SQL Server Thật (`localhost` / `ShdOneErpDb`)

| Đối tượng kiểm tra | Truy vấn kiểm chứng thực tế | Kết quả thực tế trên CSDL | Cấp độ | Ý nghĩa đối soát |
|---|---|---|:---:|---|
| **Số lượng bảng thực tế** | `SELECT COUNT(1) FROM sys.tables` | **48 bảng** | `EXEC_VERIFIED` | Toàn bộ các bảng từ 0001 đến 0014 đã tồn tại. |
| **Số lượng Stored Procedures** | `SELECT COUNT(1) FROM sys.procedures WHERE is_ms_shipped = 0` | **35 procedures** | `EXEC_VERIFIED` | Các SP từ 0001 đến 0014 đã tồn tại. |
| **Lịch sử Migration** | `SELECT COUNT(1) FROM [dbo].[__DbMigrationHistory]` | **0 dòng dữ liệu** | `EXEC_VERIFIED` | **DATABASE DRIFT CỐT LÕI**: Chưa từng có migration nào được áp dụng qua runner chính thức. |
| **Bảng phân hệ Tuyển sinh** | `SELECT COUNT(1) FROM sys.tables WHERE name LIKE 'Adm_%'` | **0 bảng** | `EXEC_VERIFIED` | Migration `0015` chưa hề được chạy trên SQL Server. |
| **Bảng quan hệ Party** | `SELECT 1 FROM sys.tables WHERE name = 'Party_PartyRelationships'` | **Không tồn tại** | `EXEC_VERIFIED` | Bảng này trong migration `0015` chưa được tạo. |
| **Bảng Master Data** | `SELECT COUNT(1) FROM dbo.System_MasterDataCatalogs` | **0 dòng (bảng đã tồn tại)** | `EXEC_VERIFIED` | Bảng đã được tạo từ 0010 nhưng rỗng dữ liệu. |
| **Module Registry** | `SELECT Code FROM dbo.System_Modules` | **Chỉ có 2 dòng: `CRM`, `COMMERCIAL`** | `EXEC_VERIFIED` | Các module nền tảng (`IDENTITY`, `SYSTEM`,...) bị lỗi khi seed tại `0012`. |
| **Module Dependencies** | `SELECT COUNT(1) FROM dbo.System_ModuleDependencies` | **1 dòng (`COMMERCIAL` -> `CRM`)** | `EXEC_VERIFIED` | Các phụ thuộc vào module nền tảng bị bỏ qua do module gốc chưa có. |

### 2.3. Bằng chứng Lỗi Kỹ thuật Tiềm ẩn trong Tệp SQL Migration (Code Inspection)

| Hiện tượng lỗi | Tệp và dòng phát hiện | Đoạn mã vi phạm thực tế | Cấp độ | Hậu quả kỹ thuật |
|---|---|---|:---:|---|
| **Lỗi GUID Hex không hợp lệ** | [`20261027_0012_...sql:231-238`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261027_0012_ModuleAndFeatureRegistryPlatform.sql#L231-L238) | `'M1000000-0000-0000-0000-000000000001'` | `EXEC_VERIFIED` (qua `TRY_CAST`) | Chuyển đổi sang `UNIQUEIDENTIFIER` trả về `NULL`, gây lỗi Msg 8114 khi INSERT. |
| **Lỗi GUID Hex không hợp lệ** | [`20261029_0015_...sql:28`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L28) | `'M1000000-0000-0000-0000-000000000003'` | `EXEC_VERIFIED` | Gây sập tiến trình áp dụng migration `0015` ngay tại dòng 28. |
| **Lỗi Vi phạm Khóa chính (Duplicate Key)** | [`20261025_0006_...sql:101`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261025_0006_SeedFoundationData.sql#L101) | `INSERT INTO [dbo].[Identity_UserGroupMembers] ([Id], [UserId],...)` | `CODE_INSPECT` | Không có `IF NOT EXISTS`, nếu chạy lại migration sẽ lập tức ném lỗi trùng khóa chính. |
| **Lỗi Vi phạm Khóa chính Workflow** | [`20261027_0013_...sql:393,409`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261027_0013_WorkflowEngineAndOutboxEnhancement.sql#L393) | `INSERT INTO [dbo].[Wf_Definitions]` | `CODE_INSPECT` | Lệnh chèn dữ liệu không guard, sẽ gây lỗi Duplicate Key nếu chạy lại. |
| **Lệch pha Schema Entity PartyRelationship** | [`0015_...sql:210-232`](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L210-L232) vs [`PartyEntities.cs:304-331`](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L304-L331) | SQL dùng `PartyId`/`RelatedPartyId` + 8 cột người bảo lãnh; C# dùng `FromPartyId`/`ToPartyId` | `CODE_INSPECT` | EF Core sẽ ném `Invalid column name 'FromPartyId'` khi chạy trên SQL Server thật. |

---

## 3. CHỨNG CHỈ LOẠI TRỪ DỮ LIỆU NHẠY CẢM (ZERO PII & SECRETS SANITIZATION)

Master Agent xác nhận tuân thủ tuyệt đối quy định an toàn thông tin:
1. **Không chứa Mật khẩu / Secret:** Mọi chuỗi kết nối và tài khoản trong báo cáo đều được tham chiếu theo định dạng chuẩn local dev (`localhost`), không chứa khóa bảo mật sản xuất.
2. **Không chứa Dữ liệu Định danh Thật (Zero Real PII):** Không có họ tên, số điện thoại, căn cước công dân hoặc hồ sơ học viên thật nào xuất hiện trong các tệp bằng chứng. Dữ liệu khảo sát hoàn toàn là metadata cấu trúc hệ thống.

