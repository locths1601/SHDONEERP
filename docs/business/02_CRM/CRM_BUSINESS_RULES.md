# DANH MỤC QUY TẮC NGHIỆP VỤ — PHÂN HỆ CRM (CRM BUSINESS RULES)
Mã tài liệu: `BUS-DOC-02-04` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Mã Quy Tắc: `BR-CRM-XXX` | Trạng thái: `PROPOSED` (Chờ PO phê duyệt chính thức)

---

## BẢNG TỔNG HỢP CÁC QUY TẮC NGHIỆP VỤ CRM

| Mã Quy Tắc | Nhóm Nghiệp Vụ | Tên Quy Tắc Nghiệp Vụ | Mức Độ Thực Thi | Phân Loại |
|---|---|---|:---:|:---:|
| `BR-CRM-001` | Tiếp nhận Lead | Cửa sổ Phát hiện Trùng lặp Khách hàng Tiềm năng (60 ngày) | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-002` | Tiếp nhận Lead | Định dạng Chuẩn hóa Khóa Định danh Lead (Phone E.164) | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-003` | Tiếp nhận Lead | Ưu tiên Quyền Chăm sóc Khách hàng Giới thiệu từ CTV | Bắt buộc (Business Policy) | `PROPOSED` |
| `BR-CRM-004` | Phân bổ & SLA | Cam kết Thời gian Phản hồi Cuộc gọi Đầu tiên theo Phân hạng | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-005` | Phân bổ & SLA | Khung Giờ Tính Thời hạn Cam kết Dịch vụ (SLA Window) | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-006` | Phân bổ & SLA | Thu hồi & Phân bổ lại Tự động khi Vi phạm Quá hạn SLA | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-007` | Phân bổ & SLA | Giới hạn Số lượng Lead Đang Xử lý Đồng thời (WIP Limit) | Cảnh báo (Soft Limit) | `PROPOSED` |
| `BR-CRM-008` | Tư vấn & Log | Bắt buộc Ghi nhận Kết quả sau mỗi Hoạt động Tương tác | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-009` | Tư vấn & Log | Quy định Đặt Lịch Hẹn Tái Chăm sóc (Follow-up Date) | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-010` | Cơ hội & Phễu | Điều kiện Kích hoạt Chuyển Lead sang Cơ hội Kinh doanh | Bắt buộc (State Guard) | `PROPOSED` |
| `BR-CRM-011` | Cơ hội & Phễu | Bắt buộc Gắn Sản phẩm/Dịch vụ Mục tiêu vào Opportunity | Bắt buộc (Validation) | `PROPOSED` |
| `BR-CRM-012` | Cơ hội & Phễu | Quy định Bắt buộc Nhập Lý do Thất bại khi Đóng Cơ hội (Lost) | Bắt buộc (System Enforced) | `PROPOSED` |
| `BR-CRM-013` | Chuyển đổi Khách | Điều kiện Tiên quyết để Chuyển đổi sang Hợp đồng (Won) | Bắt buộc (Validation) | `PROPOSED` |
| `BR-CRM-014` | Chuyển đổi Khách | Tính Duy nhất của Định danh Party 360 cho Học viên | Bắt buộc (DB Constraint) | `VERIFIED` |
| `BR-CRM-015` | Bảo vệ Dữ liệu | Che giấu Thông tin Cá nhân Nhạy cảm Học viên (Masking) | Bắt buộc (Security Gate) | `PROPOSED` |

---

## NỘI DUNG CHI TIẾT TỪNG QUY TẮC NGHIỆP VỤ

### 1. NHÓM TIẾP NHẬN & PHÁT HIỆN TRÙNG LẶP LEAD

#### `BR-CRM-001`: Cửa sổ Phát hiện Trùng lặp Khách hàng Tiềm năng (Deduplication Window)
- **Mô tả:** Khi tiếp nhận một yêu cầu đăng ký tư vấn mới, hệ thống tự động kiểm tra số điện thoại đăng ký trong bảng `Crm_Leads`.
- **Logic thực thi:**
  - Nếu số điện thoại đã tồn tại và thời điểm tương tác gần nhất (`LastInteractedAtUtc`) cách thời điểm hiện tại $\le 60$ ngày:
    - *Trường hợp Lead đang hoạt động (`New`, `Assigned`, `Contacted`, `Qualified`):* Không tạo bản ghi Lead mới. Giữ nguyên nhân viên đang phụ trách. Ghi thêm 1 bản ghi `Crm_LeadTouchpoints` và gửi notification cho nhân viên đó.
    - *Trường hợp Lead đã đóng thất bại (`Disqualified`, `Lost`):* Áp dụng theo quyết định phê duyệt `DEC-01B` (`PO_DECISION_REQUIRED`):
      - **Phương án A (Reopen/Recycle):** Chuyển trạng thái Lead sang `Recycled`. Ưu tiên tái phân bổ cho nhân viên cũ nếu còn công tác; nếu nhân viên cũ đã nghỉ việc, phân bổ theo thuật toán Round-Robin.
      - **Phương án B (Tạo bản ghi mới chu kỳ mới - Khuyến nghị kỹ thuật):** Khởi tạo bản ghi `Crm_Leads` mới chu kỳ mới (`IsRecycled = true`, `OriginalLeadId = OldLeadId`) để bảo toàn dữ liệu lịch sử và tỷ lệ chuyển đổi của chu kỳ trước.
  - Nếu số điện thoại đã tồn tại nhưng lần tương tác cuối cách hiện tại $> 60$ ngày:
    - Cho phép khởi tạo một chu kỳ Lead mới. Lead cũ được lưu trữ vào lịch sử (Archived). Lead mới được cấp mã mới và phân bổ bình thường.

#### `BR-CRM-002`: Chuẩn hóa Khóa Định danh Số điện thoại E.164
- **Mô tả:** Số điện thoại là trường định danh chính duy nhất ở giai đoạn Lead tiếp thị.
- **Logic thực thi:** 
  - Mọi số điện thoại nhập từ UI hoặc Ingest qua API/Webhook đều phải được chuẩn hóa trước khi lưu trữ: Bỏ ký tự khoảng trắng, dấu gạch nối, dấu chấm, chuyển đổi đầu số `0` thành mã vùng quốc tế `+84` (với số Việt Nam).
  - Định dạng hợp lệ: Bắt buộc từ 10 đến 12 ký tự số. Các số không hợp lệ sẽ bị từ chối với mã lỗi `INVALID_PHONE_NUMBER`.

#### `BR-CRM-003`: Ưu tiên Quyền Chăm sóc Khách hàng Giới thiệu (Referral Attribution)
- **Mô tả:** Trường hợp Lead được giới thiệu bởi Cộng tác viên (CTV) hoặc Cựu học viên có đính kèm mã giới thiệu (`ReferralCode`).
- **Logic thực thi:**
  - Nếu mã giới thiệu hợp lệ và thuộc về một Chuyên viên Tuyển sinh hoặc một Đối tác cụ thể, hệ thống ghi nhận vĩnh viễn quyền hưởng hoa hồng tuyển sinh cho đối tác đó đối với Lead này, kể cả khi khách hàng để lại thông tin qua kênh Facebook Ads sau đó.

---

### 2. NHÓM PHÂN BỔ & KIỂM SOÁT THỜI GIAN PHẢN HỒI (SLA)

#### `BR-CRM-004`: Cam kết Thời gian Phản hồi Cuộc gọi Đầu tiên (First Contact SLA)
- **Mô tả:** Thời hạn tối đa nhân viên tư vấn phải thực hiện cuộc gọi đầu tiên và cập nhật log lên hệ thống kể từ khi Lead được gán.
- **Quy chuẩn SLA:**
  - **Lead Hot (Điểm $\ge 70$):** SLA phản hồi trong vòng **15 phút**.
  - **Lead Warm (Điểm 40 - 69):** SLA phản hồi trong vòng **120 phút (2 giờ)**.
  - **Lead Cold (Điểm $< 40$):** SLA phản hồi trong vòng **1440 phút (24 giờ)**.
- **Điều kiện dừng SLA:** Khi nhân viên bấm nút gọi điện hoặc tạo một bản ghi `Crm_ConsultationLogs` hợp lệ.

#### `BR-CRM-005`: Khung Giờ Tính Thời hạn Cam kết (SLA Business Hours)
- **Mô tả:** Đồng hồ SLA chỉ đếm ngược trong thời gian làm việc chính thức của chi nhánh.
- **Logic thực thi:**
  - Khung giờ làm việc: 08:00 đến 18:00 từ Thứ Hai đến Thứ Bảy.
  - Các Lead phát sinh từ 18:01 hôm trước đến 07:59 sáng hôm sau sẽ bắt đầu tính thời hạn SLA từ 08:00 sáng của ngày làm việc tiếp theo.
  - Các ngày nghỉ lễ chính thức theo quy định của SHD Corp được loại trừ khỏi thời gian đếm ngược.

#### `BR-CRM-006`: Thu hồi & Tái Phân bổ Tự động khi Vi phạm Quá hạn SLA (Auto-Reclaim)
- **Mô tả:** Cơ chế tự động giải phóng Lead khỏi nhân viên bỏ bê để chuyển cho nhân viên khác phục vụ khách hàng kịp thời.
- **Logic thực thi:**
  - Khi Lead bị quá hạn `SlaDeadlineUtc` quá **120 phút** mà không có bất kỳ tương tác nào và không có ghi chú xin gia hạn được phê duyệt:
    - Hệ thống tự động xóa `AssignedToUserId`.
    - Trả trạng thái Lead về `New` (hoặc `UnassignedPool`).
    - Ghi nhận 1 lỗi vi phạm SLA vào hồ sơ cá nhân của nhân viên cũ.
    - Kích hoạt phân bổ ngay cho tư vấn viên tiếp theo đang sẵn sàng.

#### `BR-CRM-007`: Giới hạn Số lượng Lead Đang Xử lý Đồng thời (WIP Limit)
- **Mô tả:** Kiểm soát tải công việc của tư vấn viên để bảo đảm chất lượng tương tác.
- **Logic thực thi:**
  - Mỗi tư vấn viên chỉ được phép nắm giữ tối đa **50 Lead đang hoạt động** (`Assigned`, `Contacted`, `Qualified`) cùng lúc.
  - Khi một tư vấn viên chạm ngưỡng 50 Lead, thuật toán Round-Robin sẽ tạm thời bỏ qua nhân viên này trong lượt phân bổ tự động cho đến khi nhân viên xử lý chuyển đổi hoặc đóng bớt Lead.

---

### 3. NHÓM TƯ VẤN, CƠ HỘI & CHUYỂN ĐỔI KHÁCH HÀNG

#### `BR-CRM-008`: Bắt buộc Ghi nhận Kết quả sau mỗi Hoạt động Tương tác
- **Mô tả:** Nhân viên không được phép đổi trạng thái Lead mà không để lại lịch sử tương tác.
- **Logic thực thi:** Mọi thao tác chuyển trạng thái Lead từ `Assigned` sang `Contacted`, `Qualified` hoặc `Disqualified` bắt buộc phải kèm theo ít nhất 01 bản ghi `Crm_ConsultationLogs` với trường `CallOutcome` được chọn từ danh mục chuẩn.

#### `BR-CRM-009`: Quy định Đặt Lịch Hẹn Tái Chăm sóc (Follow-up Date Requirement)
- **Mô tả:** Tránh tình trạng bỏ quên khách hàng sau các cuộc gọi chưa chốt đơn.
- **Logic thực thi:**
  - Khi lưu nhật ký cuộc gọi với kết quả `Connected_Interested` hoặc `Busy_CallLater`, trường `FollowUpDateUtc` là bắt buộc.
  - Thời gian hẹn gọi lại tối đa không quá **14 ngày** kể từ ngày tương tác hiện tại.
  - Hệ thống tự động đẩy thông báo nhắc nhở lên màn hình Dashboard cá nhân vào đầu ngày hẹn.

#### `BR-CRM-010`: Điều kiện Kích hoạt Chuyển Lead sang Cơ hội Kinh doanh (Opportunity Gate)
- **Mô tả:** Ngăn chặn việc nhân viên tạo Opportunity "ảo" làm sai lệch tỷ lệ dự báo doanh thu.
- **Logic thực thi:** Lead chỉ được phép chuyển thành Opportunity khi thỏa mãn đồng thời:
  1. Trạng thái Lead đang là `Contacted` hoặc `Qualified`.
  2. Đã có ít nhất 01 cuộc gọi kết nối thành công (`CallOutcome = Connected_Interested`).
  3. Đã xác định được Thị trường mục tiêu (Hàn Quốc, Đức, Nhật) và Năm dự kiến xuất cảnh.

#### `BR-CRM-011`: Bắt buộc Gắn Sản phẩm/Dịch vụ Mục tiêu vào Opportunity
- **Mô tả:** Đảm bảo mọi cơ hội bán hàng đều có cơ sở định giá và liên kết danh mục.
- **Logic thực thi:**
  - Khi Opportunity chuyển từ giai đoạn `Discovery` sang `ValueProposition`, bắt buộc phải gán ít nhất 01 Sản phẩm/Dịch vụ mục tiêu (`ProductId` hoặc `TargetProgram`).
  - Giá trị dự kiến `EstimatedValue` phải được tính toán dựa trên đơn giá niêm yết của sản phẩm đã chọn, không được để trống hoặc nhập giá trị 0.

#### `BR-CRM-012`: Bắt buộc Nhập Lý do Thất bại khi Đóng Cơ hội (Lost Reason Requirement)
- **Mô tả:** Thu thập dữ liệu phân tích thị trường khi không chốt được hợp đồng.
- **Logic thực thi:** Khi người dùng chuyển trạng thái Opportunity sang `ClosedLost`, hệ thống bắt buộc yêu cầu chọn 01 mã từ bảng danh mục `Crm_LostReasons` (ví dụ: *Chi phí cao, Gia đình không cho đi, Chọn trung tâm khác, Không đủ tài chính*) và nhập trường ghi chú diễn giải tối thiểu 20 ký tự.

#### `BR-CRM-013`: Điều kiện Tiên quyết Chuyển đổi sang Hợp đồng Thương mại (Won Gate)
- **Mô tả:** Ràng buộc chặt chẽ trước khi bàn giao sang BUS-02 để lập Hợp đồng chính thức.
- **Logic thực thi:**
  - Bắt buộc có thông tin nhân thân của học viên: Họ tên đầy đủ, Giới tính, Ngày tháng năm sinh, Số CMND/CCCD hoặc Hộ chiếu hợp lệ.
  - Bắt buộc có thông tin người bảo lãnh (nếu học viên dưới 18 tuổi).
  - Bắt buộc đã có Báo giá chính thức ở trạng thái `Approved` được chấp thuận.
  - Giá trị hợp đồng và chính sách giảm giá (nếu có) phải nằm trong hạn mức hoặc đã được phê duyệt qua Workflow.

#### `BR-CRM-014`: Tính Duy nhất của Định danh Party 360 cho Học viên
- **Mô tả:** Tránh phân mảnh danh tính học viên trên toàn hệ thống SHD Corp.
- **Logic thực thi:**
  - Mỗi cá nhân học viên chỉ có duy nhất **01 PartyId** trong bảng `Party_Parties`.
  - Khóa đối soát duy nhất là Số CMND/CCCD (`Party_PartyIdentifications`) và Số điện thoại chính chủ.
  - Một học viên có thể ký nhiều hợp đồng với nhiều Pháp nhân khác nhau qua các năm nhưng tất cả các Hợp đồng đó đều trỏ chung về một `StudentPartyId`.

#### `BR-CRM-015`: Bảo vệ Dữ liệu Cá nhân & Che giấu Thông tin Học viên (Data Masking)
- **Mô tả:** Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
- **Logic thực thi:**
  - Đối với các tư vấn viên không phải là người phụ trách Lead/Opportunity: Số điện thoại hiển thị trên danh sách chỉ hiển thị 4 số đầu và 3 số cuối (ví dụ: `0912***789`).
  - Số CCCD chỉ hiển thị đầy đủ cho Chuyên viên Hồ sơ và Kế toán khi hợp đồng đã được kích hoạt.
  - Mọi thao tác bấm "Xem đầy đủ" (Unmask) đều được ghi nhận vào nhật ký kiểm toán `Audit_SystemLogs`.

