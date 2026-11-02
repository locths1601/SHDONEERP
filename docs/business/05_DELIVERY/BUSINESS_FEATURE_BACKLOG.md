# BACKLOG TÍNH NĂNG DOANH NGHIỆP — PHÂN HỆ CRM & THƯƠNG MẠI (BUSINESS BACKLOG)
Mã tài liệu: `BUS-DOC-05-01` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Cấu trúc: **Epics $\rightarrow$ Features $\rightarrow$ User Stories (Sẵn sàng cho AI Coding Agent)**

---

## 1. TỔNG QUAN PHÂN BỔ EPIC & CÂU CHUYỆN NGƯỜI DÙNG (BACKLOG SUMMARY)

| Mã Epic | Tên Epic Nghiệp Vụ | Số User Stories | Domain Sở Hữu | Độ Ưu Tiên | Giai Đoạn |
|---|---|:---:|:---:|:---:|:---:|
| **EPIC-01** | Quản lý Nguồn Tiếp thị & Thu thập Lead Đa kênh | 4 Stories | `CRM` | P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-02** | Phân bổ Tư vấn Tự động & Giám sát SLA | 4 Stories | `CRM` | P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-03** | Nhật ký Tư vấn Tuyển sinh & Đánh giá Nhu cầu | 3 Stories | `CRM` | P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-04** | Quản lý Phễu Cơ hội Kinh doanh (Opportunity Kanban) | 4 Stories | `CRM` | P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-05** | Quản trị Danh mục Sản phẩm, Dịch vụ & Bảng giá | 4 Stories | `COMMERCIAL`| P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-06** | Quản lý Báo giá & Quy trình Duyệt Giảm giá | 4 Stories | `COMMERCIAL`| P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-07** | Quản trị Hợp đồng Dịch vụ Đa Pháp nhân | 5 Stories | `COMMERCIAL`| P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-08** | Bàn giao Dịch vụ & Đồng bộ Party 360 | 4 Stories | `CROSS` | P1 (Khẩn cấp) | **MVP Phase 1** |
| **EPIC-09** | Tích hợp Tổng đài VoIP & Ký số Điện tử Từ xa | 4 Stories | `ENHANCE` | P2 (Mở rộng) | Phase 2 |

---

## 2. CHI TIẾT USER STORIES SẴN SÀNG TRIỂN KHAI THEO TỪNG VERTICAL SLICE

---

### EPIC-01: QUẢN LÝ NGUỒN TIẾP THỊ & THU THẬP LEAD ĐA KÊNH

#### US-CRM-01: Tiếp nhận Lead từ Webhook & Tự động Chuẩn hóa Số Điện Thoại
- **Mô tả:** Là một Chuyên viên Marketing, tôi muốn hệ thống tự động tiếp nhận dữ liệu từ Landing page và Facebook Ads qua Webhook và chuẩn hóa số điện thoại về chuẩn E.164, để dữ liệu khách hàng được ghi nhận tức thì mà không cần nhập tay.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - Gửi request JSON hợp lệ tới `POST /api/v1/crm/leads/webhook` $\rightarrow$ Trả về mã HTTP 201 Created.
  - Số điện thoại đầu vào dạng `0912 345 678` hoặc `+84912345678` được lưu thống nhất thành `+84912345678`.
  - Tự động tạo bản ghi `Crm_LeadTouchpoints` lưu vết `utm_source`, `utm_medium` và payload form gốc.
  - Story Points: **5 SP** | Ưu tiên: **P1**

#### US-CRM-02: Kiểm soát Trùng lặp Lead trong Cửa sổ 60 Ngày (BR-CRM-001)
- **Mô tả:** Là một Trưởng phòng Tuyển sinh, tôi muốn hệ thống tự động nhận diện số điện thoại đã tồn tại trong vòng 60 ngày để ngăn chặn việc tạo trùng Lead và tránh xung đột hoa hồng giữa các nhân viên tư vấn.
- **Tiêu chí chấp nhận:**
  - Nếu số điện thoại đã có trong `Crm_Leads` và lần tương tác cuối $\le 60$ ngày, không tạo bản ghi Lead mới.
  - Tự động tăng `TouchpointCount` thêm 1 và gửi notification cho nhân viên đang phụ trách Lead cũ.
  - Nếu lần tương tác cuối $> 60$ ngày hoặc Lead cũ đã `Lost`, cho phép mở chu kỳ Lead mới (`IsRecycled = true`).
  - Story Points: **5 SP** | Ưu tiên: **P1**

#### US-CRM-03: Nhập Dữ liệu Lead Hàng Loạt từ File Excel Sự Kiện
- **Mô tả:** Là một Chuyên viên Tuyển sinh, tôi muốn upload file Excel danh sách học viên thu thập được từ các buổi hội thảo tại trường THPT, để nhập hàng loạt vào hệ thống nhanh chóng.
- **Tiêu chí chấp nhận:**
  - Cung cấp file Excel mẫu (.xlsx) có sẵn các cột bắt buộc: Họ tên, Số điện thoại, Tỉnh thành, Năm tốt nghiệp.
  - Hệ thống kiểm tra trước dữ liệu (Dry-run validation), báo cáo chi tiết các dòng bị sai định dạng số điện thoại hoặc bị trùng lặp trước khi import chính thức.
  - Story Points: **5 SP** | Ưu tiên: **P1**

---

### EPIC-02: PHÂN BỔ TƯ VẤN TỰ ĐỘNG & GIÁM SÁT SLA

#### US-CRM-04: Phân bổ Lead Xoay Vòng theo Thị trường & Chi nhánh (Round-Robin)
- **Mô tả:** Là một Trưởng nhóm Tuyển sinh, tôi muốn hệ thống tự động phân bổ Lead cho các tư vấn viên trong ca trực theo thuật toán Round-Robin căn cứ vào thị trường quan tâm và chi nhánh gần nhất, để phân chia công việc công bằng và nhanh nhất.
- **Tiêu chí chấp nhận:**
  - Khi Lead mới được tạo, hệ thống tự động gán `AssignedToUserId` cho tư vấn viên đang có ít Lead đang xử lý nhất trong ca trực.
  - Chuyển trạng thái Lead từ `New` sang `Assigned`, gửi thông báo Real-time cho tư vấn viên.
  - Story Points: **8 SP** | Ưu tiên: **P1**

#### US-CRM-05: Đồng Hồ Đếm Ngược SLA & Cảnh Báo Vi Phạm Thời Gian Phản Hồi
- **Mô tả:** Là một Chuyên viên Tư vấn, tôi muốn nhìn thấy đồng hồ đếm ngược SLA trên từng Lead (15 phút cho Lead Hot, 2 giờ cho Lead Warm), để tôi biết mức độ ưu tiên cần gọi điện ngay lập tức.
- **Tiêu chí chấp nhận:**
  - Trên bảng danh sách hiển thị badge thời gian đổi màu: Xanh ($>50\%$), Vàng ($<25\%$), Đỏ (Quá hạn).
  - Background Job quét mỗi phút, nếu quá hạn mà chưa có log cuộc gọi thì cập nhật `IsSlaBreached = true` và gửi thông báo cảnh báo cho Trưởng phòng.
  - Story Points: **5 SP** | Ưu tiên: **P1**

---

### EPIC-04: QUẢN LÝ PHỄU CƠ HỘI KINH DOANH (OPPORTUNITY KANBAN)

#### US-CRM-06: Màn hình Phễu Cơ hội Dạng Bảng Kéo Thả (Kanban Board)
- **Mô tả:** Là một Giám đốc Tuyển sinh, tôi muốn xem toàn bộ cơ hội kinh doanh trên giao diện Kanban gồm các cột Discovery, Value Proposition, Proposal Sent, Negotiation, Closed Won, để theo dõi sức khỏe phễu bán hàng theo thời gian thực.
- **Tiêu chí chấp nhận:**
  - Hỗ trợ kéo thả thẻ Opportunity giữa các cột trạng thái.
  - Khi kéo sang `ClosedLost`, bắt buộc hiển thị Popup chọn `LostReasonId` và nhập ghi chú lý do thất bại.
  - Tổng giá trị dự kiến (Estimated Value) và xác suất thành công tự động cập nhật lại ở đầu mỗi cột.
  - Story Points: **8 SP** | Ưu tiên: **P1**

---

### EPIC-06: QUẢN LÝ BÁO GIÁ & PHÊ DUYỆT CHIẾT KHẤU THƯƠNG MẠI

#### US-COM-01: Lập Báo Giá Chi Tiết từ Danh Mục Sản Phẩm (BUS-02)
- **Mô tả:** Là một Chuyên viên Tư vấn, tôi muốn chọn Gói sản phẩm từ Catalog và hệ thống tự động tính tổng tiền, thuế VAT và các khoản thu hộ trường, để tôi gửi bảng chi phí minh bạch cho phụ huynh.
- **Tiêu chí chấp nhận:**
  - Cho phép chọn gói du học trọn gói và các dịch vụ cộng thêm (Add-ons).
  - Tự động áp dụng giá niêm yết từ Bảng giá hiệu lực của Pháp nhân tương ứng.
  - Cho phép xuất file Báo giá PDF chuẩn mẫu nhận diện thương hiệu.
  - Story Points: **8 SP** | Ưu tiên: **P1**

#### US-COM-02: Kích Hoạt Luồng Workflow Phê Duyệt Giảm Giá (FND-03 Integration)
- **Mô tả:** Là một Chuyên viên Tư vấn, khi tôi áp dụng mức giảm giá vượt quá 1.000.000 VNĐ trên báo giá, tôi muốn hệ thống tự động gửi yêu cầu phê duyệt đến Trưởng phòng hoặc Giám đốc Chi nhánh, để kiểm soát chính sách giá bán.
- **Tiêu chí chấp nhận:**
  - Mức giảm $> 1.000.000$ VNĐ: Trạng thái báo giá chuyển thành `PendingApproval`.
  - Tích hợp với `Wf_Instances` trong FND-03 Workflow Engine.
  - Trưởng phòng có quyền bấm "Duyệt" hoặc "Từ chối" kèm ghi chú.
  - Story Points: **8 SP** | Ưu tiên: **P1**

---

### EPIC-07: QUẢN TRỊ HỢP ĐỒNG DỊCH VỤ ĐA PHÁP NHÂN

#### US-COM-03: Khởi Tạo Hợp Đồng Dịch Vụ từ Báo Giá Được Chấp Thuận
- **Mô tả:** Là một Cán bộ Hợp đồng, tôi muốn hệ thống tự động sao chép toàn bộ dòng sản phẩm, giá trị thanh toán từ Báo giá đã duyệt sang Hợp đồng mới, để tiết kiệm thời gian và loại trừ sai sót dữ liệu.
- **Tiêu chí chấp nhận:**
  - Hợp đồng mới được tạo ở trạng thái `Draft` với mã quy chuẩn: `HD-YYYYMM/PHAPNHAN/XXXX`.
  - Tự động gán `ContractingLegalEntityId` và `SellingBusinessUnitId`.
  - Tự động sinh `Com_PaymentSchedules` chia thành các đợt nộp tiền theo chính sách sản phẩm.
  - Story Points: **8 SP** | Ưu tiên: **P1**

#### US-COM-04: Kích Hoạt Hợp Đồng & Bàn Giao Dịch Vụ khi Kế Toán Thu Tiền Đợt 1
- **Mô tả:** Là một Kế toán Thu công nợ, khi tôi xác nhận Phiếu thu tiền Đợt 1 thành công trên hệ thống, tôi muốn Hợp đồng tự động chuyển sang trạng thái `Active` và mở khóa các nghĩa vụ đào tạo, để các bộ phận bắt đầu phục vụ học viên.
- **Tiêu chí chấp nhận:**
  - Khi `PaymentSchedule` Đợt 1 được đánh dấu `FullyPaid`, hợp đồng chuyển từ `Signed` sang `Active`.
  - Bắn sự kiện miền `ContractActivatedDomainEvent` vào `System_OutboxMessages`.
  - Nghĩa vụ đào tạo ngoại ngữ và xử lý hồ sơ chuyển sang trạng thái `ReadyForHandover`.
  - Story Points: **5 SP** | Ưu tiên: **P1**

---

### EPIC-08: BÀN GIAO DỊCH VỤ & ĐỒNG BỘ ĐỊNH DANH PARTY 360

#### US-CROSS-01: Tự Động Định Danh Khách Hàng vào Party 360 Lõi
- **Mô tả:** Là một Quản trị viên Doanh nghiệp, tôi muốn khi cơ hội tuyển sinh thành công, hồ sơ học viên được tự động đồng bộ vào `Party_Parties` với Role `Student` và thông tin CCCD được lưu trữ an toàn, để các phân hệ Đào tạo và Hồ sơ cùng khai thác một mã định danh duy nhất.
- **Tiêu chí chấp nhận:**
  - Tự động tạo bản ghi `Party_Parties`, `Party_Persons`, `Party_PartyIdentifications` và `Party_PartyRoles`.
  - Kiểm tra chống trùng lặp theo số CCCD.
  - Dữ liệu CCCD được phân loại `Restricted` và tự động che giấu trên màn hình xem chung.
  - Story Points: **5 SP** | Ưu tiên: **P1**

