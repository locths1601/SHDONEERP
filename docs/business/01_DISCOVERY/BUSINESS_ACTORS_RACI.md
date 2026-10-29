# MA TRẬN PHÂN ĐỊNH TRÁCH NHIỆM DOANH NGHIỆP (BUSINESS ACTORS & RACI MATRIX)
Mã tài liệu: `BUS-DOC-01-03` | Phiên bản: `2.0.0` (Reconciled) | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tương thích: **Direct GBAC v4.2 & Data Scope Foundation**  
Trạng thái: `PROPOSED` (Đã rà soát và chuẩn hóa 100% Accountable theo chuẩn Enterprise Governance)

---

## 1. DANH MỤC CÁC CHỦ THỂ & VAI TRÒ HỆ THỐNG (14 BUSINESS ACTORS)

Hệ thống SHD OneERP phục vụ mạng lưới 14 nhóm tác nhân vận hành xuyên suốt chuỗi giá trị:

| Mã Actor | Tên Vai Trò / Chức Danh | Phạm vi Vận hành | Trách nhiệm Nghiệp vụ Cốt lõi | Tương ứng GBAC Group / Scope |
|---|---|---|---|---|
| **ACT-01** | **Chuyên viên Marketing (Marketing Specialist)** | Toàn tập đoàn / Khối BU | Triển khai chiến dịch truyền thông, quản lý nguồn Lead, tối ưu chuyển đổi chiến dịch, import danh sách data sự kiện. | `MarketingStaff` (BU Scope) |
| **ACT-02** | **Trưởng nhóm / Trưởng phòng Tuyển sinh (Sales Leader)** | Chi nhánh / Khối BU | Giám sát KPI tuyển sinh, điều phối phân bổ Lead cho tư vấn viên, phê duyệt chuyển người phụ trách, duyệt chiết khấu sơ bộ. | `SalesManager` (Branch / BU Scope) |
| **ACT-03** | **Chuyên viên Tư vấn Tuyển sinh (Admissions Counselor)** | Cơ sở / Chi nhánh | Tiếp nhận Lead, liên hệ tư vấn lộ trình du học/đào tạo, cập nhật hồ sơ khách hàng, tạo cơ hội kinh doanh và báo giá. | `SalesStaff` (Branch Scope / Self Data) |
| **ACT-04** | **Cộng tác viên Tuyển sinh (Referral / Agent)** | Bên ngoài hệ thống | Giới thiệu ứng viên tiềm năng, theo dõi tiến độ hợp đồng của ứng viên được giới thiệu và nhận hoa hồng. | `Party_PartyRoles` (`Agent`, `Partner`) |
| **ACT-05** | **Chuyên viên Hợp đồng & Pháp chế (Contract Specialist)** | Pháp nhân / Tập đoàn | Soạn thảo mẫu hợp đồng, thẩm tra tính pháp lý của điều khoản đặc biệt, rà soát phụ lục hợp đồng, kiểm soát rủi ro pháp lý. | `ContractOfficer` (Legal Entity Scope) |
| **ACT-06** | **Giám đốc Chi nhánh / Giám đốc BU (Branch / BU Director)** | Chi nhánh / Khối BU | Chịu trách nhiệm toàn diện doanh số, phê duyệt các báo giá/hợp đồng có mức giảm giá cao, phê duyệt kế hoạch tuyển sinh. | `BranchDirector` (Branch Scope) / `BuHead` |
| **ACT-07** | **Giám đốc Pháp nhân (Legal Entity Managing Director)** | Pháp nhân độc lập | Đại diện theo pháp luật ký kết hợp đồng dịch vụ du học, phê duyệt các trường hợp bồi thường, hoàn phí lớn, thanh lý hợp đồng. | `LegalEntityDirector` (Legal Entity Scope) |
| **ACT-08** | **Kế toán Thu công nợ / Thủ quỹ (Billing Accountant)** | Pháp nhân / Chi nhánh | Lập phiếu thu, xác nhận học viên đã nộp tiền đợt 1, theo dõi lịch trình thanh toán các đợt tiếp theo, quản lý công nợ hợp đồng. | `Accountant` (Legal Entity / Branch Scope) |
| **ACT-09** | **Trưởng phòng Đào tạo / Giáo vụ (Academic Registrar)** | Cơ sở đào tạo | Tiếp nhận học viên sau ký hợp đồng, xếp lớp học tiếng Topik/JLPT, quản lý thời khóa biểu, điểm danh và ghi nhận điểm số. | `AcademicStaff` (Branch Scope) |
| **ACT-10** | **Chuyên viên Xử lý Hồ sơ & Visa (Dossier Specialist)** | Khối Nghiệp vụ Visa | Tiếp nhận hồ sơ gốc từ tư vấn viên, dịch thuật công chứng, hoàn thiện form xin thư mời trường, nộp và luyện phỏng vấn visa. | `VisaSpecialist` (BU / Legal Entity Scope) |
| **ACT-11** | **Điều phối viên Đối tác Nước ngoài (International Placement)** | Khối Quan hệ Quốc tế | Quản lý danh mục trường liên kết (Partner Schools), cập nhật chỉ tiêu tuyển sinh, học phí, điều kiện học bổng của trường đối tác. | `PlacementOfficer` (Global Scope) |
| **ACT-12** | **Cán bộ Hỗ trợ Hải ngoại (Overseas Care Officer)** | Chi nhánh nước ngoài | Tiếp nhận lịch bay, đón học viên tại sân bay quốc tế, đưa về chỗ ở, hỗ trợ thủ tục làm thẻ ARC và việc làm thêm tại nước ngoài. | `OverseasStaff` (Overseas Branch Scope) |
| **ACT-13** | **Khách hàng: Học viên & Phụ huynh (Student & Guardian)** | Bên ngoài hệ thống | Cung cấp thông tin hồ sơ, ký kết hợp đồng dịch vụ, thanh toán học phí theo tiến độ, tham gia học tập và phỏng vấn. | `Party_Parties` (Role `Student`/`Parent`) |
| **ACT-14** | **Quản trị viên Hệ thống (System Administrator)** | Toàn hệ thống | Quản trị cấu hình hệ thống, phân quyền người dùng, giám sát audit log, quản lý phiên bản module và cấu hình workflow. | `AdminGroup` (Global Scope) |

---

## 2. MA TRẬN RACI CHUẨN HÓA TOÀN DIỆN (FULL 14-ACTOR RACI MATRIX)

**Nguyên tắc Quản trị RACI Bắt buộc:**
- Mỗi công đoạn **DUY NHẤT 01 Tác nhân chịu trách nhiệm giải trình cuối cùng (Chữ A)**.
- Khách hàng bên ngoài (`ACT-13`) và Đối tác bên ngoài (`ACT-04`) chỉ có thể là `R` (người thực hiện nghĩa vụ cá nhân), `C` (tham vấn) hoặc `I` (nhận thông báo); tuyệt đối **không đóng vai trò Accountable (A)** đối với quy trình quản trị nội bộ của SHD Corp.

| STT | Công Đoạn / Quy Trình Nghiệp Vụ | ACT-01 MKT | ACT-02 S-Lead | ACT-03 Tư Vấn | ACT-04 CTV | ACT-05 Pháp Chế | ACT-06 GD CN/BU | ACT-07 GD Pháp Nhân | ACT-08 Kế Toán | ACT-09 Đào Tạo | ACT-10 Hồ Sơ | ACT-11 Đối Tác | ACT-12 Hải Ngoại | ACT-13 Khách Hàng | ACT-14 Admin |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | Thu hút & Thu thập Lead từ các kênh tiếp thị | **A** | C | I | R | - | I | - | - | - | - | - | - | - | I |
| **2** | Kiểm tra trùng lặp Lead & Gắn nguồn gốc Marketing | C | **A** | I | I | - | - | - | - | - | - | - | - | - | I |
| **3** | Phân bổ Lead theo ca trực & thị trường (Round-robin)| I | **A** | R | I | - | I | - | - | - | - | - | - | - | I |
| **4** | Tiếp nhận & Thực hiện cuộc gọi đầu tiên theo SLA | - | A | **R** | I | - | - | - | - | - | - | - | - | C | - |
| **5** | Khảo sát học bạ, tài chính & Ghi log tư vấn | - | C | **A** | - | - | - | - | - | - | - | - | - | R | - |
| **6** | Định hướng chương trình (Hàn D4/D2, Đức, Nhật) | - | C | **A** | - | - | I | - | - | C | C | C | - | R | - |
| **7** | Khởi tạo Opportunity & Định danh Party 360 | - | I | **A** | - | - | - | - | - | - | - | - | - | I | I |
| **8** | Lập Báo giá chuẩn từ Product Catalog | - | I | **A** | - | - | I | - | - | - | - | - | - | I | - |
| **9** | Phê duyệt Chiết khấu / Học bổng vượt thẩm quyền | - | R | I | - | - | **A** | C | - | - | - | - | - | I | - |
| **10** | Soạn thảo & Thẩm định Hợp đồng Dịch vụ Du học | - | - | R | - | **A** | I | C | C | - | - | - | - | C | - |
| **11** | Ký kết Hợp đồng Dịch vụ (Trực tiếp hoặc E-Sign) | - | I | R | - | C | I | **A** | I | - | - | - | - | R | I |
| **12** | Thu tiền Đợt 1 (Mở hồ sơ/Học phí) & Xuất Phiếu thu | - | I | I | - | - | I | - | **A** | I | - | - | - | R | - |
| **13** | Kích hoạt Hợp đồng & Bàn giao Nghĩa vụ Đào tạo | - | I | R | - | - | I | - | C | **A** | - | - | - | I | - |
| **14** | Bàn giao Hồ sơ gốc & Thẩm thực pháp lý | - | I | R | - | - | - | - | C | - | **A** | - | - | R | - |
| **15** | Đào tạo tiếng Topik/JLPT & Theo dõi chuyên cần | - | - | I | - | - | - | - | - | **A** | C | - | - | R | - |
| **16** | Nộp hồ sơ xin Thư mời trường (CoA / Admission) | - | - | I | - | - | - | - | - | - | R | **A** | - | C | - |
| **17** | Thu học phí trường nước ngoài theo Invoice trường | - | - | I | - | - | I | - | **A** | - | C | - | - | R | - |
| **18** | Luyện phỏng vấn & Nộp hồ sơ xin Visa Đại sứ quán | - | - | I | - | - | - | - | - | - | **A** | C | - | R | - |
| **19** | Xử lý sự cố trượt Visa hoặc Rút hồ sơ hoàn tiền | - | C | C | - | C | C | **A** | R | - | R | - | - | C | - |
| **20** | Xuất cảnh, Bàn giao Hải ngoại & Nghiệm thu Dịch vụ | - | I | I | - | - | C | I | C | - | I | - | **A** | R | - |

---

## 3. NGUYÊN TẮC BÀN GIAO TRÁCH NHIỆM LIÊN PHÒNG BAN (HANDOFF PRINCIPLES)

1. **Handoff Tuyển sinh $\rightarrow$ Kế toán (Sale to Billing):**
   - Chuyên viên tư vấn không được trực tiếp cầm tiền mặt của khách hàng mà không lập phiếu thu tạm hoặc chuyển thẳng cho Kế toán.
   - Hợp đồng chỉ được kích hoạt sang trạng thái `Active` khi Kế toán (`ACT-08`) xác nhận chứng từ giao dịch thực tế vào tài khoản pháp nhân.
2. **Handoff Tuyển sinh $\rightarrow$ Xử lý Hồ sơ (Sale to Visa):**
   - Chuyên viên tư vấn (`ACT-03`) bàn giao hồ sơ gốc cho Chuyên viên Hồ sơ (`ACT-10`) kèm Biên bản giao nhận và ghi chú đầy đủ về nguyện vọng, gia cảnh trên Opportunity.
3. **Handoff Hồ sơ $\rightarrow$ Hợp tác Quốc tế (Visa to Placement):**
   - Chuyên viên Hồ sơ (`ACT-10`) phối hợp với Điều phối viên Đối tác Nước ngoài (`ACT-11`) để nộp đơn đúng chỉ tiêu và kỳ tuyển sinh của trường đối tác.
4. **Handoff Hồ sơ $\rightarrow$ Hỗ trợ Hải ngoại (Visa to Overseas Care):**
   - Khi có visa, phòng Hồ sơ cập nhật mã visa; Cán bộ Hải ngoại (`ACT-12`) chịu trách nhiệm giải trình (`A`) cho toàn bộ công tác đón sân bay, bố trí ký túc xá và thủ tục cư trú nước ngoài.
