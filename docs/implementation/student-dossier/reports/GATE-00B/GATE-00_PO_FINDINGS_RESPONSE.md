# SHD OneERP — PO FINDINGS RESPONSE & REMEDIATION MATRIX
## GATE-00B: Phản hồi & Đề xuất Khắc phục 10 Phát hiện Kiểm toán của Product Owner

**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Phiên bản:** 1.0  
**Ngày thực hiện:** 2026-10-30  
**Người thực hiện:** Master AI Agent Orchestrator  
**Trạng thái xử lý:** Đã hoàn thiện phương án cho toàn bộ F-01 đến F-10, chờ phê duyệt của PO  

---

## 1. BẢNG TỔNG HỢP PHẢN HỒI 10 PHÁT HIỆN CỦA PO (F-01 ĐẾN F-10)

| Mã | Phát hiện của PO (Finding) | Mức độ | Nguyên nhân gốc rễ (Root Cause) | Đề xuất khắc phục (Corrective Proposal) | Bằng chứng (Evidence) | Trạng thái | Quyết định PO cần thiết |
|:---:|---|:---:|---|---|:---:|:---:|:---:|
| **F-01** | Bảng `__DbMigrationHistory` có 0 dòng trong khi CSDL đã có 48 bảng | **P0** | Các migration từ 0001 đến 0014 được chạy thủ công qua tool SQL thay vì qua `run-migrations.ps1`. Bản thân file `.sql` không tự ghi lịch sử. | Thực hiện quy trình Recovery Plan 6 bước: backup, tạo DB test, dry-run, rồi backfill lịch sử có đối soát SHA256. | `DATABASE_DRIFT...md` mục 2 & 3 | **RESOLVED** (Phương án đã sẵn sàng) | Phê duyệt thực hiện Recovery Plan |
| **F-02** | Migration `0015` (STU-01, ADM-01) chưa được áp dụng vào SQL Server | **P0** | Migration được viết trên đĩa nhưng chưa từng chạy trên CSDL thật. Script chứa lỗi ép kiểu GUID `M1000...` nên không chạy được. | Sửa lỗi GUID và cấu trúc, sau đó áp dụng vào CSDL thật trong quy trình Migration Recovery. | `DATABASE_DRIFT...md` mục 3.3 | **RESOLVED** (Phương án đã sẵn sàng) | Cho phép apply 0015 sau khi fix |
| **F-03** | Lỗi chuỗi GUID không hợp lệ (`M1000000...`) trong migration `0012` và `0015` | **P0** | Tác giả gõ nhầm tiền tố `M` (không thuộc hệ hex `0-9, A-F`), khiến lệnh ép kiểu sang `UNIQUEIDENTIFIER` bị lỗi Msg 8114. | Thay thế tiền tố `M` bằng ký tự hex hợp lệ (vd `E1000000...`) hoặc sử dụng `NEWID()`. | `test_guid.ps1`, `check_invalid_guids.ps1` | **RESOLVED** (Đã phát hiện 100%) | Chấp thuận sửa script migration |
| **F-04** | Lệnh `INSERT` không idempotent trong migration `0006`, `0013` gây lỗi PK | **P1** | Các câu lệnh insert vào `Identity_UserGroupMembers`, `Wf_Definitions` thiếu mệnh đề `IF NOT EXISTS`, khiến runner bị crash khi chạy lại. | Bổ sung mệnh đề `IF NOT EXISTS` cho các lệnh insert dữ liệu hạt giống. | `check_inserts.ps1` kết quả log | **RESOLVED** (Phương án đã sẵn sàng) | Chấp thuận chuẩn hóa tính idempotent |
| **F-05** | Sai lệch cấu trúc giữa Entity `PartyRelationship` (C#) và SQL schema `0015` | **P0** | SQL dùng `PartyId`/`RelatedPartyId` kèm 8 cột người bảo lãnh; trong khi C# và EF Core dùng `FromPartyId`/`ToPartyId`. | Trình PO lựa chọn: Giữ mô hình Graph Party thuần túy hay mở rộng Entity C# để chứa thông tin người bảo lãnh thân nhân. | `PartyEntities.cs` vs `0015.sql:210-232` | **OPEN** | **PO-011: Chốt mô hình dữ liệu người bảo lãnh** |
| **F-06** | 152 Unit Tests PASS bị hiểu nhầm là hệ thống đã sẵn sàng trên SQL Server | **P1** | 100% tests hiện tại là Unit/Mock tests trên RAM; không có bài test nào kết nối vào SQL Server `ShdOneErpDb` thật. | Phân loại rõ `EXEC_VERIFIED` (in-memory) vs `NOT_VERIFIED` (SQL Server) trong toàn bộ báo cáo; xây dựng SQL integration tests. | `GATE-00_EVIDENCE_INDEX.md` | **RESOLVED** (Đã minh bạch hóa) | Ghi nhận sự khác biệt giữa Unit test và DB test |
| **F-07** | Thiết kế Reference Data thừa cột, thiếu Một nguồn sự thật (`Status`/`IsActive`, `ManagementMode`/`IsSystem`) | **P1** | Đề xuất cũ tạo thêm cột `Status` và `ManagementMode` song song với `IsActive` và `IsSystem` đã có trong CSDL. | Hợp nhất một nguồn sự thật: dùng `IsActive` (bool) cho trạng thái, `IsSystem` (bool) cho chế độ quản trị; DTO ánh xạ ra nhãn. | `SYS-REF-01_REVISED_CONTRACT.md` mục 2 | **RESOLVED** (Đã hiệu đính) | Phê duyệt hợp nhất nguồn sự thật |
| **F-08** | Lẫn lộn phạm vi giữa Quản lý Nhóm danh mục (SYS-REF-01) và Giá trị con (SYS-REF-02) | **P1** | Đề xuất cũ đề cập đến CRUD Items trong khi phạm vi câu chuyện SYS-REF-01 chỉ quản lý Catalogs. | Cô lập tuyệt đối: SYS-REF-01 chỉ làm nhóm danh mục; toàn bộ CRUD Items chuyển sang câu chuyện SYS-REF-02. | `SYS-REF-01_REVISED_CONTRACT.md` mục 1 | **RESOLVED** (Đã cô lập phạm vi) | Xác nhận ranh giới story |
| **F-09** | Cơ chế phân quyền Direct GBAC chưa chặt chẽ cho danh mục `SYSTEM_CONTROLLED` | **P1** | Chưa có cơ chế bảo vệ danh mục hệ thống cốt lõi và chưa phân tích rõ Data Scope cho danh mục `GLOBAL`. | Khóa đổi mã/xóa nhóm đối với `IsSystem = 1`; cấp quyền xem toàn cục `GLOBAL`, quyền sửa yêu cầu membership cấp Global. | `SYS-REF-01_REVISED_CONTRACT.md` mục 5 | **RESOLVED** (Đã đặc tả bảo mật) | **PO-001, PO-002: Xác nhận quyền & Scope** |
| **F-10** | Stored Procedure thiếu xử lý các tình huống biên (Empty list, Page out-of-bounds) | **P2** | SP thiết kế trước đây chưa tính đến trường hợp tìm kiếm không ra kết quả hoặc số trang vượt quá tổng trang. | Bổ sung xử lý chuẩn hóa tham số phân trang, whitelist sort, và tính `TotalCount` độc lập để client phân trang mượt mà. | `SYS-REF-01_REVISED_CONTRACT.md` mục 4 | **RESOLVED** (Đã hiệu đính SP) | Chấp thuận hợp đồng SP mới |

---

## 2. CHI TIẾT GIẢI PHÁP CHO CÁC PHÁT HIỆN TRỌNG YẾU (P0)

### 2.1. Giải pháp cho F-01 & F-02 (Database Drift & Migration 0015)
- **Vấn đề:** CSDL thật đã có bảng từ 0001-0014 nhưng thiếu lịch sử; migration 0015 chưa được chạy.
- **Kế hoạch hành động:**
  1. Master Agent **KHÔNG CAN THIỆP GHI TRỰC TIẾP** trên CSDL `ShdOneErpDb` trong giai đoạn audit.
  2. Tạo bản sao lưu đầy đủ `ShdOneErpDb_PreRecovery_20261030.bak`.
  3. Sử dụng database thử nghiệm `ShdOneErpDb_Test` để dry-run script `run-migrations.ps1` sau khi đã forward-fix các lỗi cú pháp.
  4. Thực hiện backfill an toàn lịch sử migrations vào bảng `__DbMigrationHistory` trên database chính sau khi có lệnh của PO.

### 2.2. Giải pháp cho F-03 (Invalid GUID Literals `M1000...`)
- **Vấn đề:** Ký tự `M` trong chuỗi GUID `'M1000000-0000-0000-0000-000000000001'` gây sập lệnh INSERT vào `System_Modules`.
- **Hành động khắc phục:** Sửa toàn bộ 8 GUID trong file `0012` và 1 GUID trong file `0015` thành định dạng hợp lệ (thay `M` bằng `E` hoặc `NEWSEQUENTIALID()`), đảm bảo script hoàn toàn chạy thông suốt.

### 2.3. Giải pháp cho F-05 (Divergence `PartyRelationship`)
- **Vấn đề:** Bảng SQL migration `0015` tạo các cột `RelatedPersonName`, `PhoneNumber`, `IsFinancialSponsor`... trong khi C# Entity `PartyRelationship` chỉ có `FromPartyId` và `ToPartyId`.
- **Đề xuất trình PO lựa chọn:**
  - *Phương án A (Khuyến nghị):* Mở rộng Domain Entity `PartyRelationship` trong C# để chứa các trường thông tin thân nhân/người bảo lãnh tài chính du học Hàn Quốc (khớp hoàn toàn với nghiệp vụ thực tế của SHD Korea).
  - *Phương án B:* Giữ Entity C# thuần túy Graph edge, sửa script SQL `0015` để bỏ các cột denormalized.

---

## 3. CÁC QUYẾT ĐỊNH CẦN PRODUCT OWNER PHÊ CHUẨN ĐỂ MỞ KHÓA SYS-REF-01

Để đưa trạng thái của **SYS-REF-01 Readiness** từ `BLOCKED` sang `READY`, Master Agent kính trình Product Owner phê duyệt 3 quyết định mấu chốt:

1. **Phê duyệt Phương án Phục hồi Migration (Recovery Plan):** Cho phép Master Agent tiến hành sao lưu, dry-run trên database test và chuẩn hóa các tệp migration `0006`, `0012`, `0013`, `0015`.
2. **Quyết định PO-001 & PO-002 (Phân quyền & Scope Danh mục):** Phê duyệt quyền `system.reference_data.manage` quản lý các danh mục `ADMIN_MANAGED`, khóa danh mục `SYSTEM_CONTROLLED` và áp dụng `ScopePolicy = GLOBAL`.
3. **Quyết định PO-011 (Mô hình Người bảo lãnh PartyRelationship):** Chốt Phương án A (mở rộng C# Entity) để phục vụ nghiệp vụ hồ sơ du học Hàn Quốc.

---

> [!NOTE]
> **KẾT LUẬN:** Toàn bộ 10 phát hiện kiểm toán của Product Owner đã được mổ xẻ tận gốc rễ kỹ thuật và có phương án khắc phục triệt để. Master Agent đã dừng mọi thao tác và sẵn sàng thực thi khi nhận được lệnh phê duyệt.

