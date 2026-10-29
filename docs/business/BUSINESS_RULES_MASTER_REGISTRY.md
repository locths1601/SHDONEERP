# SỔ ĐĂNG KÝ QUY TẮC NGHIỆP VỤ TẬP TRUNG (BUSINESS RULES MASTER REGISTRY)
Mã tài liệu: `BUS-REG-2026-03` | Phiên bản: `2.0.0` (Master Authority) | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Mục đích: **Nguồn chân lý duy nhất (Single Source of Truth) về logic nghiệp vụ cho toàn bộ hệ thống**

---

## TỔNG HỢP DANH MỤC QUY TẮC TOÀN HỆ THỐNG (RULE STATISTICS)

| Phân Hệ / Miền Nghiệp Vụ | Dải Mã Quy Tắc | Số Lượng Quy Tắc | Trọng Tâm Nghiệp Vụ |
|---|:---:|:---:|---|
| **BUS-01: CRM & Tuyển Sinh** | `BR-CRM-001` $\rightarrow$ `BR-CRM-015` | **15 Quy tắc** | Ingestion, Deduplication, SLA, Routing, Opportunity Stages, Party360 Sync, Data Masking |
| **BUS-02: Commercial & Hợp Đồng** | `BR-COM-001` $\rightarrow$ `BR-COM-004`, `BR-COM-010` $\rightarrow$ `BR-COM-013`, `BR-COM-020` $\rightarrow$ `BR-COM-025` | **14 Quy tắc** | Price List Precedence, Floor Price, Immutability, Validity, Discount Matrix, Activation Gate, Handover |
| **Cross-Domain Platform Rules** | `BR-XDOM-001` $\rightarrow$ `BR-XDOM-005` | **5 Quy tắc** | Database Isolation, Transactional Outbox, Idempotency, 3-Layer Security, Append-Only Auditing |
| **TỔNG CỘNG MASTER REGISTRY** | **3 Nhóm Danh mục** | **34 Quy tắc** | **100% Khử trùng mã, tường minh điều kiện kích hoạt và tầng thực thi** |

---

## 1. PHÂN HỆ CRM & TUYỂN SINH (BUS-01 RULES: `BR-CRM-001` $\rightarrow$ `BR-CRM-015`)

### `BR-CRM-001`: Cửa sổ Kiểm tra Trùng lặp Khách hàng Tiềm năng (60-day Deduplication Window)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Toàn bộ kênh Ingestion (Webhook, Form, Excel, Manual)
- **Điều kiện kích hoạt:** Khi nhận payload chứa Số điện thoại khách hàng.
- **Quy tắc thực thi:**
  - Nếu số điện thoại đã tồn tại trong `Crm_Leads` và khoảng cách từ `LastInteractedAtUtc` đến hiện tại $\le 60$ ngày:
    - *Lead cũ đang hoạt động (`New`, `Assigned`, `Contacted`, `Qualified`):* Chặn tạo Lead mới; tạo bản ghi `Crm_LeadTouchpoints`; tăng `TouchpointCount`; cập nhật `LastInteractedAtUtc`; gửi notification cho nhân viên phụ trách hiện tại.
    - *Lead cũ đã đóng (`Disqualified`, `Lost`):* Chờ quyết định PO theo `DEC-01B` (`PO_DECISION_REQUIRED`):
      - **Phương án A (Reopen/Recycle):** Chuyển trạng thái Lead cũ sang `Recycled`; cho phép tái phân bổ chăm sóc trên chính bản ghi cũ.
      - **Phương án B (Tạo bản ghi mới chu kỳ mới - Khuyến nghị kỹ thuật):** Khởi tạo bản ghi `Crm_Leads` mới (`IsRecycled = true`, `OriginalLeadId = OldLeadId`) để bảo toàn dữ liệu lịch sử và tỷ lệ chuyển đổi của chu kỳ trước.
  - Nếu số điện thoại đã tồn tại nhưng khoảng cách $> 60$ ngày: Cho phép tạo Lead mới chu kỳ mới (`IsRecycled = true`), lưu `OriginalLeadId` để đối soát.
- **Tầng thực thi:** Domain Service (`ILeadIngestionService`) + Transaction Lock.
- **Trạng thái:** `PO_DECISION_REQUIRED` (Chờ PO ký duyệt `DEC-01` và `DEC-01B`).

### `BR-CRM-002`: Chuẩn hóa Khóa Định danh Số điện thoại E.164
- **Domain:** `CRM` | **Phạm vi áp dụng:** Mọi điểm nhập số điện thoại khách hàng.
- **Quy tắc thực thi:** Số điện thoại bắt buộc chuẩn hóa trước khi lưu trữ: loại bỏ khoảng trắng, dấu chấm, dấu gạch ngang; chuyển đầu số nội địa `0` thành mã quốc gia `+84`. Chiều dài hợp lệ từ 10 đến 12 ký tự số.
- **Mã lỗi khi vi phạm:** `INVALID_PHONE_NUMBER` (HTTP 422).
- **Tầng thực thi:** FluentValidation + DB Check Constraint.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-003`: Ưu tiên Nguồn Giới thiệu Cộng tác viên (Referral Attribution Precedence)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Lead có kèm `ReferralCode` hoặc `ReferralPartyId`.
- **Quy tắc thực thi:** Nếu khách hàng được giới thiệu bởi CTV/Cựu học viên hợp lệ, quyền ghi nhận hoa hồng và phân bổ tư vấn được gán cố định cho nhánh CTV đó, kể cả khi khách hàng điền form Facebook Ads sau đó.
- **Tầng thực thi:** Domain Service.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-004`: Cam kết Thời gian Phản hồi Cuộc gọi Đầu tiên theo Phân hạng (First-Contact SLA)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Lead ở trạng thái `Assigned`.
- **Quy tắc thực thi:** Thời hạn tối đa thực hiện cuộc gọi đầu tiên tính từ `AssignedAtUtc`:
  - **Lead Hot ($\ge 70$ điểm):** SLA là **15 phút**.
  - **Lead Warm ($40 - 69$ điểm):** SLA là **120 phút (2 giờ)**.
  - **Lead Cold ($< 40$ điểm):** SLA là **1440 phút (24 giờ)**.
- **Điều kiện dừng SLA:** Tạo bản ghi `Crm_ConsultationLogs` đầu tiên.
- **Tầng thực thi:** System Background Worker + UI Countdown Timer.
- **Trạng thái:** `PROPOSED` (Chờ PO ký duyệt `DEC-02`).

### `BR-CRM-005`: Khung Giờ Tính Thời hạn Cam kết (SLA Business Hours)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Bộ đếm thời gian SLA.
- **Quy tắc thực thi:** Đồng hồ SLA chỉ đếm ngược từ 08:00 đến 18:00 các ngày từ Thứ Hai đến Thứ Bảy. Dữ liệu tiếp nhận ban đêm hoặc Chủ nhật/Ngày lễ sẽ bắt đầu đếm ngược từ 08:00 sáng ngày làm việc tiếp theo.
- **Tầng thực thi:** Domain Service calculation helper.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-006`: Thu hồi & Tái Phân bổ Tự động khi Quá hạn SLA (Auto-Reclaim)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Lead vi phạm SLA.
- **Quy tắc thực thi:** Khi Lead quá hạn `SlaDeadlineUtc` quá **120 phút** mà không có bất kỳ tương tác nào: Hệ thống tự động hủy gán `AssignedToUserId`, trả Lead về hàng đợi phân bổ cho nhân viên tiếp theo, và ghi 1 lỗi vi phạm vào hồ sơ tư vấn viên cũ.
- **Tầng thực thi:** Hangfire / Background Scheduled Job.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-007`: Giới hạn Số lượng Lead Đang Xử lý Đồng thời (WIP Limit)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Thuật toán phân bổ Round-Robin.
- **Quy tắc thực thi:** Mỗi tư vấn viên chỉ được nắm giữ tối đa **50 Lead đang hoạt động** (`Assigned`, `Contacted`, `Qualified`). Khi chạm ngưỡng 50, hệ thống tạm thời bỏ qua nhân viên này trong lượt phân bổ tự động.
- **Tầng thực thi:** Domain Service (`LeadRoutingEngine`).
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-008`: Bắt buộc Ghi nhận Kết quả sau mỗi Hoạt động Tương tác
- **Domain:** `CRM` | **Phạm vi áp dụng:** Thao tác chuyển trạng thái Lead.
- **Quy tắc thực thi:** Chuyển trạng thái Lead từ `Assigned` sang `Contacted`, `Qualified`, `Disqualified` bắt buộc kèm ít nhất 01 bản ghi `Crm_ConsultationLogs` hợp lệ.
- **Mã lỗi khi vi phạm:** `CONSULTATION_LOG_REQUIRED` (HTTP 400).
- **Tầng thực thi:** Application Command Handler.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-009`: Quy định Đặt Lịch Hẹn Tái Chăm sóc (Follow-up Date Requirement)
- **Domain:** `CRM` | **Phạm vi áp dụng:** `Crm_ConsultationLogs`.
- **Quy tắc thực thi:** Khi kết quả cuộc gọi là `Connected_Interested` hoặc `Busy_CallLater`, bắt buộc nhập `FollowUpDateUtc`. Ngày hẹn không được quá **14 ngày** kể từ ngày hiện tại.
- **Tầng thực thi:** FluentValidation.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-010`: Điều kiện Kích hoạt Chuyển Lead sang Cơ hội Kinh doanh (Opportunity Gate)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Lệnh chuyển đổi Lead sang Opportunity.
- **Quy tắc thực thi:** Lead chỉ được chuyển thành Cơ hội khi thỏa mãn đồng thời: 1. Đang là `Contacted` hoặc `Qualified`; 2. Có ít nhất 01 cuộc gọi kết nối thành công; 3. Đã xác định Thị trường mục tiêu và Năm dự kiến xuất cảnh.
- **Tầng thực thi:** Domain State Guard.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-011`: Bắt buộc Gắn Sản phẩm/Dịch vụ Mục tiêu vào Opportunity
- **Domain:** `CRM` | **Phạm vi áp dụng:** Opportunity từ giai đoạn `Discovery` sang `ValueProposition`.
- **Quy tắc thực thi:** Bắt buộc gán ít nhất 01 Sản phẩm/Gói dịch vụ từ Catalog. `EstimatedValue` phải được tính toán dựa trên đơn giá niêm yết của sản phẩm, không được để trống hoặc bằng 0.
- **Tầng thực thi:** Domain State Guard.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-012`: Bắt buộc Nhập Lý do Thất bại khi Đóng Cơ hội (Lost Reason Requirement)
- **Domain:** `CRM` | **Phạm vi áp dụng:** Thao tác chuyển Opportunity sang `ClosedLost`.
- **Quy tắc thực thi:** Bắt buộc chọn `LostReasonId` từ bảng danh mục chuẩn và nhập ghi chú diễn giải tối thiểu 20 ký tự.
- **Mã lỗi khi vi phạm:** `LOST_REASON_MANDATORY` (HTTP 400).
- **Tầng thực thi:** Application Handler.
- **Trạng thái:** `PROPOSED`.

### `BR-CRM-013`: Điều kiện Tiên quyết Chuyển đổi sang Hợp đồng Thương mại (Won Gate)
- **Domain:** `CRM` $\rightarrow$ `COMMERCIAL` | **Phạm vi áp dụng:** Lệnh tạo Hợp đồng từ Cơ hội.
- **Quy tắc thực thi:** Bắt buộc: 1. Đầy đủ thông tin nhân thân (Họ tên, ngày sinh, CCCD/Hộ chiếu); 2. Đầy đủ thông tin người bảo lãnh (nếu học viên dưới 18 tuổi); 3. Đã có Báo giá ở trạng thái `Approved` được chấp thuận.
  - *Thời điểm chuyển Opportunity sang `ClosedWon`:* Đang chờ phê chuẩn tại `DEC-13` (`PO_DECISION_REQUIRED`):
    - **Phương án 1:** Chuyển `ClosedWon` ngay khi tạo Hợp đồng nháp `Draft`.
    - **Phương án 2 (Khuyến nghị kỹ thuật):** Chuyển `ClosedWon` khi hai bên ký Hợp đồng `Signed`.
    - **Phương án 3:** Chuyển `ClosedWon` khi Hợp đồng được Kích hoạt `Active` sau khi thu cọc Đợt 1.
- **Tầng thực thi:** Cross-domain Handoff Service.
- **Trạng thái:** `PO_DECISION_REQUIRED` (Chờ PO ký duyệt `DEC-13`).

### `BR-CRM-014`: Tính Duy nhất của Định danh Party 360 cho Học viên
- **Domain:** `Party360` / `CRM` | **Phạm vi áp dụng:** Đồng bộ dữ liệu học viên.
- **Quy tắc thực thi:** Mỗi cá nhân chỉ có duy nhất **01 PartyId** trong `Party_Parties`. Dù học viên đăng ký tư vấn nhiều lần hay ký hợp đồng với nhiều Pháp nhân khác nhau qua các năm, tất cả đều trỏ chung về một `PartyId` duy nhất.
- **Tầng thực thi:** Database Unique Index trên `Party_PartyIdentifications` (CCCD).
- **Trạng thái:** `VERIFIED` (Đã có trong Party 360 Foundation).

### `BR-CRM-015`: Bảo vệ Dữ liệu Cá nhân & Che giấu Thông tin Học viên (Data Masking)
- **Domain:** `CRM` / `Security` | **Phạm vi áp dụng:** Hiển thị danh sách khách hàng.
- **Quy tắc thực thi:** Nhân viên không phụ trách Lead/Opportunity chỉ được xem số điện thoại ở dạng che giấu: 4 số đầu và 3 số cuối (VD: `0912***789`). Mọi thao tác bấm "Xem đầy đủ" đều được ghi vào `Audit_SystemLogs`.
- **Tầng thực thi:** SQL Stored Procedure (`sp_Crm_Lead_GetPagedList`) + Audit Interceptor.
- **Trạng thái:** `PROPOSED`.

---

## 2. PHÂN HỆ SẢN PHẨM, BÁO GIÁ & HỢP ĐỒNG (BUS-02 RULES: `BR-COM-001` $\rightarrow$ `BR-COM-025`)

### `BR-COM-001`: Quy tắc Thứ tự Ưu tiên Áp dụng Bảng Giá (Price List Precedence)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Lập Báo giá và Bán hàng.
- **Quy tắc thực thi:** Tại một thời điểm, giá bán của sản phẩm được lấy theo mức ưu tiên giảm dần: `Bảng giá chiến dịch > Bảng giá khu vực > Bảng giá chuẩn niêm yết`.
- **Tầng thực thi:** Pricing Engine Service.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-002`: Ràng buộc Giá Sàn Sản phẩm (Floor Price Enforcement)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Báo giá và Bảng giá.
- **Quy tắc thực thi:** Giá sau chiết khấu trên dòng Báo giá không được thấp hơn giá sàn (`MinAllowedPrice`) quy định trong Bảng giá, trừ khi có phê duyệt đặc biệt của Ban Tổng Giám đốc.
- **Mã lỗi khi vi phạm:** `PRICE_BELOW_MIN_FLOOR` (HTTP 400).
- **Tầng thực thi:** Domain Entity Validation.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-003`: Bắt buộc Xác định Pháp nhân Sở hữu Sản phẩm (`OwningLegalEntityId`)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Catalog sản phẩm.
- **Quy tắc thực thi:** Mỗi sản phẩm thương mại bắt buộc gắn với 01 Pháp nhân pháp lý sở hữu bản quyền chương trình và có giấy phép đào tạo/du học tương ứng.
- **Tầng thực thi:** Foreign Key NOT NULL trong `Com_Products`.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-004`: Tính Bất biến & Cấm Xóa Vật lý Sản phẩm Đã Có Giao Dịch
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Danh mục sản phẩm/dịch vụ.
- **Quy tắc thực thi:** Sản phẩm hoặc Dịch vụ đã từng phát sinh Báo giá hoặc Hợp đồng tuyệt đối không được xóa vật lý khỏi cơ sở dữ liệu. Ngừng kinh doanh bằng cách chuyển `Status = 'Inactive'` hoặc `IsActive = 0`.
- **Tầng thực thi:** Application Service + Soft Delete Filter.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-010`: Thời hạn Hiệu lực Báo giá Mặc định (Quotation Validity Period)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Thực thể `Com_Quotations`.
- **Quy tắc thực thi:** Mọi báo giá bắt buộc có `ValidUntilDate`, mặc định là **15 ngày** kể từ ngày tạo nếu không có thỏa thuận khác. Quá hạn trên, báo giá tự động chuyển sang `Expired`.
- **Tầng thực thi:** Domain Validation + Background Job.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-011`: Tính Bất biến của Báo giá Đã Gửi (Quotation Immutability & Revisions)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Báo giá ở trạng thái `Sent` hoặc `Accepted`.
- **Quy tắc thực thi:** Tuyệt đối không UPDATE trực tiếp nội dung và giá của Báo giá đã gửi cho khách hàng. Nếu điều chỉnh, nhân viên bắt buộc phải tạo phiên bản mới (Revision `V2`, `V3`). Phiên bản cũ được lưu giữ nguyên trạng để kiểm toán.
- **Tầng thực thi:** Application Handler (`CreateQuotationRevisionCommand`).
- **Trạng thái:** `PROPOSED`.

### `BR-COM-012`: Ma trận Phân cấp Thẩm quyền Duyệt Giảm giá / Chiết khấu (Discount Matrix)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Phê duyệt Báo giá qua FND-03 Workflow Engine.
- **Quy tắc thực thi:** Hạn mức giảm giá tối đa trên một Báo giá/Hợp đồng:
  - $\le 1.000.000$ VNĐ: Tư vấn viên tự động áp dụng mã khuyến mại.
  - $> 1.000.000$ đến $\le 3.000.000$ VNĐ: Trưởng phòng Tuyển sinh Chi nhánh phê duyệt.
  - $> 3.000.000$ đến $\le 5.000.000$ VNĐ: Giám đốc Chi nhánh phê duyệt.
  - $> 5.000.000$ VNĐ: Giám đốc Khối BU hoặc Tổng Giám đốc Tập đoàn phê duyệt.
  - Tổng mức giảm giá không vượt quá **15% tổng giá trị hợp đồng**.
- **Tầng thực thi:** Generic Workflow Engine (`Wf_QuotationDiscountApproval`).
- **Trạng thái:** `PROPOSED` (Chờ PO ký duyệt `DEC-03`).

### `BR-COM-013`: Tự động Vô hiệu hóa các Phiên bản Báo giá Song song (Superseded Quotes)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Khi một Báo giá chuyển sang `Converted` thành Hợp đồng.
- **Quy tắc thực thi:** Khi một Báo giá được chọn để ký kết hợp đồng, toàn bộ các phiên bản Báo giá khác thuộc cùng Cơ hội đó sẽ tự động chuyển sang trạng thái `Superseded` (Bị thay thế).
- **Tầng thực thi:** Domain Service inside transaction.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-020`: Điều kiện Tiên quyết Kích hoạt Hiệu lực Hợp đồng (Activation Gate)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Chuyển Hợp đồng từ `Signed` sang `Active`.
- **Quy tắc thực thi:** Hợp đồng chỉ được kích hoạt sang trạng thái `Active` khi thỏa mãn đồng thời:
  1. Hợp đồng đã có đủ chữ ký hợp lệ của hai bên (kèm bản scan lưu mã băm SHA256 hoặc OTP).
  2. Kế toán xác nhận Phiếu thu (Payment Receipt) cho khoản tiền đặt cọc/học phí Đợt 1 theo đúng lịch trình thanh toán.
- **Tầng thực thi:** Application Command Handler + Domain Event Handler.
- **Trạng thái:** `PROPOSED` (Chờ PO ký duyệt `DEC-06`).

### `BR-COM-021`: Tính Bất biến & Cấm Xóa Hợp đồng Đã Kích hoạt
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Hợp đồng ở trạng thái `Active`, `UnderFulfillment`, `Completed`.
- **Quy tắc thực thi:** Tuyệt đối không xóa vật lý lẫn xóa mềm hợp đồng đã kích hoạt. Mọi trường hợp dừng hợp đồng đơn phương hoặc hủy bỏ đều phải lập Biên bản thanh lý và chuyển trạng thái sang `Terminated`.
- **Tầng thực thi:** EF Core Interceptor / Delete Guard.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-022`: Thẩm quyền Ký Đại diện Pháp nhân theo Data Scope
- **Domain:** `COMMERCIAL` / `Security` | **Phạm vi áp dụng:** Hành động ký hợp đồng.
- **Quy tắc thực thi:** Người ký đại diện Bên A bắt buộc phải có quyền `commercial.contract.sign` kèm Data Scope bao trùm Pháp nhân ký kết (`ContractingLegalEntityId`).
- **Tầng thực thi:** Controller Authorization Policy (`[AuthorizeScope]`).
- **Trạng thái:** `VERIFIED`.

### `BR-COM-023`: Quản lý Phụ lục Hợp đồng Độc lập (Contract Addenda Management)
- **Domain:** `COMMERCIAL` | **Phạm vi áp dụng:** Điều chỉnh kỳ bay, đổi trường, đổi giá trị hợp đồng.
- **Quy tắc thực thi:** Tuyệt đối không sửa đổi văn bản hợp đồng gốc đã ký. Mọi thay đổi bắt buộc tạo bản ghi `Com_ContractAddenda` (Phụ lục hợp đồng) có số hiệu riêng và quy trình phê duyệt pháp chế.
- **Tầng thực thi:** Domain Entity Model.
- **Trạng thái:** `PROPOSED`.

### `BR-COM-024`: Chính sách Hoàn phí theo Kết quả Visa & Giai đoạn Hồ sơ
- **Domain:** `COMMERCIAL` / `Finance` | **Phạm vi áp dụng:** Hủy hợp đồng / Trượt Visa.
- **Quy tắc thực thi:**
  - *Trường hợp trượt visa:* Hoàn trả 100% học phí trường nước ngoài đã nộp; khấu trừ chi phí dịch thuật công chứng và đào tạo tiếng thực tế đã phát sinh.
  - *Trường hợp rút hồ sơ tự nguyện:* Khấu trừ phí phạt vi phạm hợp đồng theo tỷ lệ quy định tại thời điểm rút hồ sơ. Thời hạn chi trả hoàn phí trong vòng 15 - 30 ngày làm việc.
- **Tầng thực thi:** Workflow Phê duyệt Hoàn phí (`Wf_ContractRefund`).
- **Trạng thái:** `PROPOSED` (Chờ PO ký duyệt `DEC-07`).

### `BR-COM-025`: Điều kiện Mở khóa Bàn giao Nghĩa vụ theo Tiến độ Thu tiền (Handover Gate)
- **Domain:** `COMMERCIAL` $\rightarrow$ Fulfillment Domains | **Phạm vi áp dụng:** `Com_ServiceObligations`.
- **Quy tắc thực thi:**
  - Nộp đủ tiền Đợt 1 $\rightarrow$ Mở khóa Nghĩa vụ Đào tạo tiếng và Nghĩa vụ Dịch thuật hồ sơ gốc.
  - Nộp đủ tiền Đợt 2 (Invoice trường) $\rightarrow$ Mở khóa Nghĩa vụ Xin Thư mời chính thức (CoA).
  - Nộp đủ tiền Đợt 3 (Hoàn tất phí) $\rightarrow$ Mở khóa Nghĩa vụ Mua vé máy bay và Đón sân bay hải ngoại.
- **Tầng thực thi:** Transactional Outbox Event Consumers.
- **Trạng thái:** `PROPOSED`.

---

## 3. QUY TẮC TÍCH HỢP LIÊN PHÂN HỆ (CROSS-DOMAIN RULES: `BR-XDOM-001` $\rightarrow$ `BR-XDOM-005`)

### `BR-XDOM-001`: Độc lập Phân vùng Cơ sở Dữ liệu & Cấm Cross-domain SQL Join
- Các phân hệ CRM, Commercial, Party360, Organization sở hữu schema logic riêng. Cấm thực hiện các câu lệnh `JOIN` trực tiếp giữa các bảng nghiệp vụ xuyên biên giới trong transaction ghi dữ liệu. Mọi liên kết thực hiện qua ID khóa ngoại mềm và Domain Events.

### `BR-XDOM-002`: Bắt buộc Phát tán Sự kiện qua Transactional Outbox (ADR-006)
- Mọi thay đổi trạng thái quan trọng (`LeadConverted`, `ContractSigned`, `ContractActivated`) bắt buộc ghi vào bảng `System_OutboxMessages` trong cùng Database Transaction với entity nghiệp vụ để bảo đảm 100% Eventual Consistency.

### `BR-XDOM-003`: Xử lý Sự kiện Chống Trùng lặp Idempotent (ADR-012)
- Mọi bộ lắng nghe sự kiện (Event Consumers) bắt buộc kiểm tra `MessageId` qua `IIdempotencyStore`. Thông điệp trùng lặp trong vòng 24 giờ sẽ bị bỏ qua ngay lập tức.

### `BR-XDOM-004`: Phân vùng Dữ liệu Đa tầng (3-layer Security Enforcement - ADR-008)
- 100% API đọc và ghi phải thỏa mãn đồng thời 3 lớp: 1. Có Permission; 2. Nằm trong Data Scope được cấp (`LegalEntity`, `BusinessUnit`, `Branch`); 3. Thỏa mãn phân loại bảo vệ tài nguyên (`Confidential`, `Restricted`).

### `BR-XDOM-005`: Bất biến Lịch sử Kiểm toán & Workflow (ADR-005 & ADR-011)
- Lịch sử kiểm toán `Audit_SystemLogs` và lịch sử luân chuyển trạng thái `Wf_History` là cấu trúc dữ liệu Append-Only bất biến; tuyệt đối không cung cấp API cập nhật hoặc xóa dữ liệu này.

