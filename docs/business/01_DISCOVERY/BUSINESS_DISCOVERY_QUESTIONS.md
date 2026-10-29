# CÂU HỎI KHẢO SÁT NGHIỆP VỤ & LÀM RÕ QUY TRÌNH (BUSINESS DISCOVERY QUESTIONS)
Mã tài liệu: `BUS-DOC-01-04` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Đối tượng khảo sát: **Hội đồng Quản trị, Product Owner, Giám đốc Khối Kinh doanh, Kế toán trưởng, Trưởng phòng Pháp chế SHD Corp**

---

## 1. MỤC ĐÍCH & PHƯƠNG PHÁP KHẢO SÁT

Để đảm bảo các quy trình phân hệ **BUS-01 (CRM & Tuyển sinh)** và **BUS-02 (Sản phẩm, Dịch vụ & Hợp đồng)** phản ánh đúng thực tế vận hành và các quy định quản trị của SHD Corp, tài liệu này tập hợp danh mục các câu hỏi khảo sát chuyên sâu. 

Mỗi câu hỏi đều được phân tích rõ:
- **Tác động hệ thống:** Quyết định này ảnh hưởng trực tiếp đến Data Model, Workflow Engine hay Quy tắc phân quyền nào.
- **Phương án đề xuất kỹ thuật (Default Proposed Fallback):** Giải pháp tạm thời áp dụng nếu PO chưa phản hồi kịp, đảm bảo tiến độ thiết kế không bị đình trệ.

---

## 2. BỘ CÂU HỎI KHẢO SÁT CHUYÊN ĐỀ

### NHÓM 1: CƠ CẤU TỔ CHỨC, PHÁP NHÂN & THƯƠNG HIỆU

#### Câu hỏi Q-ORG-01: Danh mục Pháp nhân chính thức & Giấy phép Du học
- **Nội dung:** Danh sách các công ty pháp nhân độc lập thuộc SHD Corp tại thời điểm hiện tại gồm những đơn vị nào? Pháp nhân nào đã có Giấy phép Tư vấn Du học do Sở Giáo dục và Đào tạo cấp?
- **Tác động:** Dữ liệu khởi tạo (Seed data) cho bảng `Org_LegalEntities`, gán đúng mã số thuế, con dấu điện tử và biểu mẫu hợp đồng.
- **Đề xuất kỹ thuật:** Tạm thời sử dụng 03 pháp nhân minh họa:
  1. *Công ty Cổ phần Tập đoàn SHD (SHD Group)* - Quản trị và sở hữu thương hiệu chung.
  2. *Công ty TNHH Giáo dục Quốc tế SHD (SHD Edu)* - Pháp nhân ký hợp đồng du học và xử lý visa.
  3. *Công ty Cổ phần Học viện SHD (SHD Academy)* - Pháp nhân tổ chức đào tạo ngoại ngữ tập trung.

#### Câu hỏi Q-ORG-02: Cơ chế Phân bổ Doanh thu Liên công ty (Internal Transfer Pricing)
- **Nội dung:** Khi học viên ký hợp đồng du học trọn gói với Pháp nhân A (ví dụ: SHD Edu), nhưng việc đào tạo tiếng lại diễn ra tại Campus của Pháp nhân B (ví dụ: SHD Academy), dòng tiền thanh toán và việc ghi nhận doanh thu/chi phí giữa hai pháp nhân được xử lý thế nào?
- **Tác động:** Quan hệ giữa `Contract` $\rightarrow$ `BillingSchedule` $\rightarrow$ `FulfillmentAssignment` và các bút toán đối soát nội bộ liên công ty.
- **Đề xuất kỹ thuật:** Trong MVP Phase 1, khách hàng nộp toàn bộ tiền cho Pháp nhân ký hợp đồng. Hệ thống ghi nhận nghĩa vụ đào tạo nội bộ (Intercompany Obligation) dạng ghi chú và báo cáo nội bộ; chưa tự động sinh hóa đơn GTGT đối ứng.

---

### NHÓM 2: CRM & QUẢN TRỊ TUYỂN SINH (BUS-01)

#### Câu hỏi Q-CRM-01: Quy tắc Phát hiện & Hợp nhất Trùng lặp Lead (Duplicate Detection)
- **Nội dung:** Khi một số điện thoại được tiếp nhận từ kênh Facebook Ads của SHD Korea, nhưng số đó đã tồn tại trong hệ thống do chuyên viên tư vấn của SHD Edu chăm sóc trước đó 45 ngày thì hệ thống xử lý thế nào?
- **Tác động:** Quy tắc nghiệp vụ `BR-CRM-001`, logic State Machine của Lead, bảo vệ quyền lợi hoa hồng của nhân viên tư vấn.
- **Đề xuất kỹ thuật:** 
  - Nếu Lead cũ đang ở trạng thái `Hot/Warm` và có tương tác trong vòng **60 ngày**: Giữ nguyên người phụ trách cũ, hệ thống chỉ ghi thêm một bản ghi lịch sử tương tác (Activity log) từ nguồn mới.
  - Nếu Lead cũ ở trạng thái `Lost/Closed` hoặc không có tương tác trên **60 ngày**: Cho phép tái phân bổ Lead cho nhân viên mới và ghi nhận nguồn Marketing mới.

#### Câu hỏi Q-CRM-02: Cam kết Thời gian Liên hệ Đầu tiên (SLA Response Time)
- **Nội dung:** Thời gian tối đa cho phép chuyên viên tuyển sinh phải thực hiện cuộc gọi đầu tiên kể từ khi Lead được phân bổ là bao lâu? Nếu quá hạn thì xử lý thế nào?
- **Tác động:** Cơ chế Background Job quét cảnh báo SLA, tự động thu hồi Lead (`Auto-reclaim`) chuyển sang chuyên viên khác.
- **Đề xuất kỹ thuật:** 
  - Khung giờ hành chính (8h00 - 17h30): SLA là **15 phút** cho Lead nóng từ Ads/Web; **2 giờ** cho Lead sự kiện.
  - Sau thời gian SLA: Gửi thông báo nhắc nhở qua thông báo hệ thống/Zalo; nếu quá **2 giờ** không có log cuộc gọi, Lead tự động quay về hàng đợi (Lead Pool) để phân bổ lại.

#### Câu hỏi Q-CRM-03: Chính sách Hoa hồng & Khách hàng từ Cộng tác viên (CTV)
- **Nội dung:** Cộng tác viên tuyển sinh có được cấp tài khoản truy cập vào cổng thông tin (Portal) riêng để theo dõi tiến độ học viên của mình không? Tỷ lệ hoa hồng được chốt cố định theo gói hay tính theo tỷ lệ % giá trị hợp đồng?
- **Tác động:** Thiết kế module `PartyRole` (Agent/Partner), quyền truy cập phân hệ CTV và quy tắc tính hoa hồng sau khi học viên nộp tiền.
- **Đề xuất kỹ thuật:** Phase MVP chưa mở Portal riêng cho CTV. Nhân viên tuyển sinh nội bộ khi nhập Lead sẽ chọn trường `ReferralPartyId`. Báo cáo hoa hồng được xuất bảng tính Excel cho kế toán duyệt thủ công.

---

### NHÓM 3: SẢN PHẨM, GIÁ & CHIẾT KHẤU (BUS-02)

#### Câu hỏi Q-COM-01: Cấu trúc Gói Sản phẩm Du học (Package Bundling)
- **Nội dung:** Một gói sản phẩm du học thông thường (ví dụ: Du học Hàn Quốc D4-1) gồm những thành phần chi phí nào? Khoản nào thu hộ trường nước ngoài, khoản nào là doanh thu dịch vụ thuần túy của SHD Corp?
- **Tác động:** Thiết kế Data Model `Com_Products`, `Com_ServicePackages`, `Com_PackageComponents` và cách thức xuất hóa đơn thuế VAT.
- **Đề xuất kỹ thuật:** Bóc tách gói thành 3 nhóm cấu phần:
  1. *Phí dịch vụ tư vấn & xử lý hồ sơ di trú (Dịch vụ cốt lõi của SHD - chịu thuế VAT).*
  2. *Học phí đào tạo tiếng & Ký túc xá tại Việt Nam (Dịch vụ giáo dục).*
  3. *Khoản thu hộ chi hộ (Học phí trường Hàn Quốc, bảo hiểm, phí visa, vé máy bay).*

#### Câu hỏi Q-COM-02: Phân cấp Thẩm quyền Duyệt Giảm giá / Chiết khấu (Discount Matrix)
- **Nội dung:** Hạn mức giảm giá tối đa mà Tư vấn viên, Trưởng nhóm tuyển sinh, Giám đốc Chi nhánh và Tổng Giám đốc được phép áp dụng trên một hợp đồng là bao nhiêu?
- **Tác động:** Cấu hình Workflow State Machine của Báo giá (`Wf_QuotationApproval`), ngăn chặn việc phá giá hoặc tiêu cực.
- **Đề xuất kỹ thuật:**
  - *Tư vấn viên:* Tối đa $\le 1.000.000$ VNĐ (hoặc voucher theo chiến dịch).
  - *Trưởng phòng Tuyển sinh:* Tối đa $\le 3.000.000$ VNĐ.
  - *Giám đốc Chi nhánh:* Tối đa $\le 5.000.000$ VNĐ.
  - *Vượt trên 5.000.000 VNĐ:* Bắt buộc Tổng Giám đốc / Giám đốc BU duyệt qua hệ thống.

---

### NHÓM 4: HỢP ĐỒNG & CHÍNH SÁCH THANH TOÁN (BUS-02)

#### Câu hỏi Q-CON-01: Cơ chế Ký Hợp đồng từ xa & Giá trị Pháp lý
- **Nội dung:** Khi phụ huynh và học viên ở các tỉnh xa không thể đến trực tiếp văn phòng SHD để ký hợp đồng, SHD Corp hiện đang áp dụng hình thức nào: Gửi bưu điện 2 bản ký tươi, hay ký hợp đồng điện tử qua OTP/Chữ ký số cá nhân?
- **Tác động:** Quy trình ký số trên UI, tích hợp dịch vụ SMS Brandname/Zalo ZNS OTP hoặc cổng ký số (VNPT, Viettel).
- **Đề xuất kỹ thuật:** MVP hỗ trợ:
  1. *Ký trực tiếp:* Xuất bản in PDF theo mẫu chuẩn, ký tươi và scan upload lên hệ thống (`Doc_Documents`).
  2. *Ký từ xa:* Gửi file hợp đồng qua Zalo/Email, xác thực mã OTP qua số điện thoại phụ huynh đăng ký, đóng dấu thời gian (Timestamp) và mã băm SHA256 lưu vết kiểm toán.

#### Câu hỏi Q-CON-02: Chính sách Hoàn phí khi Trượt Visa hoặc Hủy Hợp đồng
- **Nội dung:** Trong trường hợp học viên bị Đại sứ quán từ chối visa mà không phải do lỗi làm giả hồ sơ, số tiền được hoàn trả lại cho học viên là bao nhiêu %? Thời hạn hoàn trả trong vòng bao nhiêu ngày làm việc?
- **Tác động:** Quy trình `Wf_RefundApproval`, quản lý công nợ hoàn trả, liên kết module Hợp đồng và Tài chính.
- **Đề xuất kỹ thuật:**
  - Áp dụng điều khoản chuẩn: Hoàn 100% học phí trường nước ngoài đã nộp; khấu trừ chi phí dịch thuật, công chứng và phí đào tạo tiếng thực tế đã phát sinh theo đơn giá niêm yết. Thời gian giải quyết hoàn phí trong vòng 15 - 30 ngày làm việc kể từ ngày nhận được hồ sơ thanh lý.

---

## 3. BẢNG TỔNG HỢP THEO DÕI PHẢN HỒI (DECISION TRACKER)

| Mã Câu Hỏi | Người Phụ Trách Trả Lời | Hạn Chót Phản Hồi | Mức Độ Khẩn Cấp | Trạng Thái Hiện Tại |
|---|---|---|:---:|:---:|
| `Q-ORG-01` | Product Owner & Pháp chế | 2026-11-05 | **Cao (Critical)** | `TBD — Đang chờ PO` |
| `Q-ORG-02` | Kế toán trưởng | 2026-11-07 | Trung bình | `TBD — Đang chờ Kế toán` |
| `Q-CRM-01` | Giám đốc Tuyển sinh | 2026-11-03 | **Cao (Critical)** | `PROPOSED — Áp dụng đề xuất` |
| `Q-CRM-02` | Giám đốc Tuyển sinh | 2026-11-03 | Trung bình | `PROPOSED — Áp dụng đề xuất` |
| `Q-CRM-03` | Giám đốc Tuyển sinh & MKT | 2026-11-07 | Thấp | `PROPOSED — Đưa vào Phase 2` |
| `Q-COM-01` | Product Manager | 2026-11-04 | **Cao (Critical)** | `PROPOSED — Áp dụng đề xuất` |
| `Q-COM-02` | Tổng Giám đốc | 2026-11-05 | **Cao (Critical)** | `PROPOSED — Áp dụng đề xuất` |
| `Q-CON-01` | Trưởng phòng Pháp chế | 2026-11-06 | Trung bình | `PROPOSED — Áp dụng đề xuất` |
| `Q-CON-02` | Kế toán trưởng & Pháp chế | 2026-11-06 | **Cao (Critical)** | `PROPOSED — Áp dụng đề xuất` |

