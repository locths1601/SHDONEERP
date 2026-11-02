# DANH MỤC ĐẶC TẢ TÍNH NĂNG CHI TIẾT — PHÂN HỆ CRM (CRM FEATURE CATALOG)
Mã tài liệu: `BUS-DOC-02-03` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tiêu chuẩn cấu trúc: **Đặc tả 22 điểm chuẩn mực Enterprise ERP Specification**

---

## TỔNG HỢP DANH MỤC TÍNH NĂNG CRM (BUS-01)

| Feature Code | Tên Tính Năng Nghiệp Vụ | Phân Loại | ModuleCode | Data Scope Áp Dụng | Mức Độ Ưu Tiên |
|---|---|:---:|:---:|:---:|:---:|
| `CRM-FEAT-01` | Quản lý Nguồn Tiếp thị & Chiến dịch Marketing | Screen / API | `CRM` | Global / BU | Cao (P1 - MVP) |
| `CRM-FEAT-02` | Tiếp nhận Lead Đa Kênh & Chống Trùng lặp | Service / API | `CRM` | BU / Branch | Cao (P1 - MVP) |
| `CRM-FEAT-03` | Nhập Dữ liệu Lead Hàng Loạt từ Excel | Screen / Service | `CRM` | Branch / BU | Cao (P1 - MVP) |
| `CRM-FEAT-04` | Chấm điểm & Phân loại Tiềm năng (Scoring) | Business Process | `CRM` | BU / Branch | Trung bình (P2 - MVP) |
| `CRM-FEAT-05` | Phân bổ Tư vấn Tự động & Giám sát SLA | Service / Job | `CRM` | Branch / BU | Cao (P1 - MVP) |
| `CRM-FEAT-06` | Nhật ký Cuộc gọi & Khảo sát Nhu cầu Học viên | Screen / API | `CRM` | Branch / Self | Cao (P1 - MVP) |
| `CRM-FEAT-07` | Lịch hẹn Tư vấn & Cảnh báo Tái tương tác | Screen / Service | `CRM` | Self / Branch | Trung bình (P2 - MVP) |
| `CRM-FEAT-08` | Quản lý Phễu Cơ hội Kinh doanh (Opportunity Kanban) | Screen / API | `CRM` | Branch / BU | Cao (P1 - MVP) |
| `CRM-FEAT-09` | Phân tích Nguyên nhân Mất Cơ hội (Lost Reasons) | Screen / Report | `CRM` | BU / Global | Trung bình (P2 - MVP) |
| `CRM-FEAT-10` | Chuyển đổi Khách hàng & Đồng bộ Party 360 | Business Process | `CRM` | BU / Branch | Cao (P1 - MVP) |
| `CRM-FEAT-11` | Dashboard Phễu Tuyển sinh & Báo cáo Hiệu suất | Screen / Report | `CRM` | Branch / BU / Global | Cao (P1 - MVP) |

---

## ĐẶC TẢ CHI TIẾT TỪNG TÍNH NĂNG THEO TIÊU CHUẨN

---

### FEATURE: CRM-FEAT-02 — TIẾP NHẬN LEAD ĐA KÊNH & PHÁT HIỆN TRÙNG LẶP

#### 1. Feature ID / Code
`CRM-FEAT-02` | Mã hệ thống: `crm.leads.ingest`

#### 2. Feature Name
Tiếp nhận Khách hàng Tiềm năng Đa kênh & Kiểm soát Trùng lặp Thông minh (Lead Ingestion & Deduplication Engine).

#### 3. Business Objective
Tập trung toàn bộ khách hàng quan tâm đến các chương trình du học, đào tạo vào một đầu mối duy nhất; tự động phát hiện số điện thoại đã tồn tại trong vòng 60 ngày để bảo vệ quyền lợi hoa hồng và tránh làm phiền khách hàng.

#### 4. Business Context
SHD Corp chạy quảng cáo đồng thời trên nhiều fanpage và website của các thương hiệu SHD Korea, SHD Education. Nếu không có bộ lọc trùng, cùng một khách hàng để lại thông tin ở 2 trang sẽ bị 2 tư vấn viên khác nhau gọi điện chào mời, gây mất uy tín thương hiệu.

#### 5. Actors & Responsibilities
- **Khách hàng vãng lai (Candidate/Parent):** Điền thông tin vào form đăng ký.
- **Hệ thống Ingestion Worker:** Tiếp nhận webhook, chuẩn hóa số điện thoại, kiểm tra trùng lặp và lưu trữ.
- **Tư vấn viên (Admissions Counselor):** Nhận thông báo khi có tương tác mới từ khách hàng cũ đang phụ trách.

#### 6. Preconditions
- Kênh Marketing Source và Campaign đã được kích hoạt trong hệ thống.
- Webhook API endpoint sẵn sàng nhận dữ liệu JSON payload.

#### 7. Trigger
- Khách hàng submit form trên Landing Page / Facebook Lead Ads / Zalo Form.

#### 8. Main Flow (Luồng chính - Lead Mới Hoàn Toàn)
1. Hệ thống tiếp nhận payload chứa: Họ tên, Số điện thoại, Email, Tỉnh thành, Chương trình quan tâm, UTM tags.
2. Chuẩn hóa số điện thoại về định dạng chuẩn quốc tế E.164 (`+84xxxxxxxxx`).
3. Truy vấn bảng `Crm_Leads` kiểm tra số điện thoại.
4. Xác nhận số điện thoại chưa từng tồn tại trong hệ thống.
5. Tạo bản ghi mới trong `Crm_Leads` với trạng thái `New`, cấp mã `LeadCode` dạng `LD-YYYYMM-XXXXX`.
6. Lưu vết nguồn gốc tiếp nhận vào bảng `Crm_LeadTouchpoints` (First-touch).
7. Phát sinh sự kiện miền `LeadIngestedEvent` qua Transactional Outbox.
8. Chuyển tiếp bản ghi sang tiến trình Phân bổ tự động (`CRM-FEAT-05`).

#### 9. Alternative Flows (Luồng thay thế - Trùng lặp trong cửa sổ 60 ngày)
- **3a. Số điện thoại đã tồn tại trong database:**
  1. Kiểm tra ngày tương tác gần nhất (`LastInteractedAtUtc`).
  2. Nếu khoảng cách $\le 60$ ngày và Lead cũ đang ở trạng thái `New`, `Assigned`, `Contacted` hoặc `Qualified`:
     - Không tạo Lead mới.
     - Tạo thêm 1 bản ghi trong `Crm_LeadTouchpoints` ghi nhận nguồn chiến dịch mới.
     - Cập nhật `LastInteractedAtUtc = SYSUTCDATETIME()`.
     - Gửi thông báo hệ thống đến tư vấn viên đang phụ trách Lead cũ: *"Khách hàng của bạn vừa đăng ký lại từ chiến dịch [Tên Campaign]"*.

#### 10. Exception Flows (Luồng ngoại lệ)
- **E1. Số điện thoại sai định dạng (không đủ 10 số hoặc chứa ký tự đặc biệt không hợp lệ):** Trả về lỗi `VALIDATION_FAILED` (HTTP 422), ghi nhận vào bảng log lỗi tích hợp `Crm_FailedIngestionLogs` để Marketing rà soát.
- **E2. Trùng lặp sau 60 ngày hoặc Lead cũ đã ở trạng thái Lost:** Khởi tạo chu kỳ mới (Recycled Lead), gắn cờ `IsRecycled = true`, lưu vết tham chiếu `OriginalLeadId`.

#### 11. Business Rules
- `BR-CRM-001`: Cửa sổ kiểm tra trùng lặp số điện thoại cố định là **60 ngày**.
- `BR-CRM-002`: Số điện thoại là khóa duy nhất đại diện cho khách hàng tiềm năng ở tầng Lead; số CCCD chỉ bắt buộc khi ký hợp đồng.
- `BR-CRM-003`: Lead đến từ mạng lưới Cộng tác viên (Referral) có gắn mã CTV hợp lệ luôn được ưu tiên giữ quyền chăm sóc và tính hoa hồng.

#### 12. State Machine
Trạng thái Lead sau khi Ingest thành công là `New`. Nếu là Lead trùng lặp trong 60 ngày, trạng thái giữ nguyên trạng thái hiện tại của Lead cũ.

#### 13. Input / Output
- **Input:**
  ```json
  {
    "fullName": "Nguyễn Văn An",
    "phoneNumber": "0987654321",
    "email": "an.nguyen@gmail.com",
    "provinceCode": "HN",
    "programOfInterest": "DU_HOC_HAN_QUOC_D4",
    "campaignCode": "CAMP_KOREA_FALL_2026",
    "utmSource": "facebook",
    "utmMedium": "cpc",
    "referralCode": null
  }
  ```
- **Output:**
  ```json
  {
    "leadId": "a1b2c3d4-...",
    "leadCode": "LD-202610-00125",
    "status": "New",
    "isDuplicate": false,
    "assignedToUserId": null,
    "createdAtUtc": "2026-10-28T14:30:00Z"
  }
  ```

#### 14. Data Entities
- Bảng chính: `Crm_Leads`, `Crm_LeadTouchpoints`, `Crm_Campaigns`, `Crm_MarketingSources`.

#### 15. Permission & Data Scope
- Endpoint Ingestion công khai qua API Gateway có xác thực API Key / Webhook Secret.
- Quyền tra cứu danh sách Lead: `crm.lead.view` kèm Data Scope `Branch` hoặc `BusinessUnit`.

#### 16. UI/UX Requirements
- Trên màn hình danh sách Lead: Có badge hiển thị số lần tương tác lặp lại (ví dụ: `2 lần chạm`).
- Khi mở chi tiết Lead: Tab "Lịch sử nguồn tiếp thị" liệt kê đầy đủ các form và chiến dịch khách hàng đã từng điền kèm mốc thời gian.

#### 17. API Contract Proposal
- `POST /api/v1/crm/leads/ingest`
- `POST /api/v1/crm/leads/webhook/facebook`

#### 18. Integration & Events
- Phát sinh Domain Event: `Crm.LeadCreatedDomainEvent` và ghi vào `System_OutboxMessages`.

#### 19. Audit Requirements
- Ghi vết kiểm toán tự động qua `Audit_SystemLogs` với Action `CREATE_LEAD`.

#### 20. Acceptance Criteria (Given - When - Then)
- **Kịch bản 1: Nhận Lead mới hợp lệ**
  - *Given:* Số điện thoại `0912345678` chưa từng có trong hệ thống.
  - *When:* Webhook gửi yêu cầu ingest với số điện thoại trên.
  - *Then:* Hệ thống tạo bản ghi `Crm_Leads` mới, trả về HTTP 201 Created, LeadCode hợp lệ và bắn sự kiện Outbox.
- **Kịch bản 2: Nhận Lead trùng trong 60 ngày**
  - *Given:* Lead với số điện thoại `0912345678` đã được tạo ngày hôm qua và đang gán cho nhân viên A.
  - *When:* Webhook gửi lại số điện thoại này từ một chiến dịch khác.
  - *Then:* Hệ thống không tạo bản ghi `Crm_Leads` mới, tạo thêm 1 bản ghi `Crm_LeadTouchpoints`, trả về HTTP 200 OK kèm cờ `isDuplicate: true`, và gửi thông báo cho nhân viên A.

#### 21. Dependencies
- Phụ thuộc: `System_Modules` (CRM), `System_MasterData` (Danh mục Tỉnh/Thành, Danh mục Chương trình).

#### 22. Open Questions / TBD
- `TBD-CRM-01`: Cần xác nhận với Marketing danh sách tài khoản Facebook Ads / Webhook Secret chính thức để cấu hình Production.

---

### FEATURE: CRM-FEAT-05 — PHÂN BỔ LEAD TỰ ĐỘNG & GIÁM SÁT SLA

#### 1. Feature ID / Code
`CRM-FEAT-05` | Mã hệ thống: `crm.leads.routing_sla`

#### 2. Feature Name
Phân bổ Tư vấn Tuyển sinh Tự động & Giám sát Vi phạm SLA (Smart Lead Routing & SLA Escalation).

#### 3. Business Objective
Đảm bảo khách hàng được tiếp cận trong thời gian vàng (15 phút cho Lead Hot); phân bổ lượng khách hàng công bằng giữa các tư vấn viên trong ca trực; tự động thu hồi khách hàng nếu nhân viên chậm trễ.

#### 4. Business Context
Tỷ lệ chuyển đổi khách hàng du học giảm 50% nếu cuộc gọi đầu tiên bị trễ quá 1 giờ. Cần cơ chế tự động hóa phân bổ thay vì Trưởng nhóm phải ngồi chia tay thủ công.

#### 5. Actors & Responsibilities
- **Tư vấn viên (Counselor):** Nhận Lead, thực hiện cuộc gọi và ghi nhận kết quả.
- **Trưởng nhóm Tuyển sinh (Sales Leader):** Thiết lập ca trực, cấu hình tỷ lệ phân bổ, nhận thông báo vi phạm SLA.
- **Hệ thống Routing Worker:** Phân bổ xoay vòng và kiểm soát đồng hồ SLA.

#### 6. Preconditions
- Lead ở trạng thái `New` hoặc `Recycled`.
- Đã cấu hình danh sách tư vấn viên trong ca trực (`Crm_SalesShiftMembers`).

#### 7. Trigger
- Ngay sau khi Lead được tạo thành công từ `CRM-FEAT-02` hoặc khi có yêu cầu chuyển người phụ trách thủ công.

#### 8. Main Flow
1. Lấy thông tin Thị trường quan tâm (Hàn/Đức/Nhật) và Tỉnh/Thành phố của Lead.
2. Xác định Chi nhánh phục vụ phù hợp nhất (Chi nhánh Hà Nội cho miền Bắc/Trung, Chi nhánh TP.HCM cho miền Nam).
3. Lấy danh sách nhân viên tư vấn đang ở trạng thái `Active` và có ca trực hợp lệ tại chi nhánh đó.
4. Áp dụng thuật toán Round-Robin: Chọn nhân viên có số lượng Lead đang xử lý trong ngày thấp nhất.
5. Cập nhật `AssignedToUserId`, `AssignedAtUtc = SYSUTCDATETIME()`, chuyển trạng thái Lead từ `New` sang `Assigned`.
6. Căn cứ vào phân hạng Lead (`Hot`, `Warm`, `Cold`), tính toán thời hạn phản hồi `SlaDeadlineUtc`:
   - `Hot`: `AssignedAtUtc + 15 phút`.
   - `Warm`: `AssignedAtUtc + 120 phút`.
   - `Cold`: `AssignedAtUtc + 1440 phút (24 giờ)`.
7. Gửi thông báo đẩy qua hệ thống cho Tư vấn viên.
8. Bắt đầu đếm ngược thời gian SLA.

#### 9. Alternative Flows (Tái phân bổ do vi phạm SLA)
- **6a. Quá hạn SLA mà Tư vấn viên chưa ghi nhận bất kỳ cuộc gọi nào:**
  1. Background Job quét mỗi phút phát hiện bản ghi quá hạn `SlaDeadlineUtc` và chưa có `FirstContactedAtUtc`.
  2. Bật cờ `IsSlaBreached = true`, lưu vết vi phạm vào hồ sơ nhân viên.
  3. Gửi thông báo khẩn tới Trưởng phòng Tuyển sinh.
  4. Nếu quá hạn thêm 60 phút: Tự động thu hồi Lead (Hủy gán `AssignedToUserId`), chuyển Lead về Hàng đợi để phân bổ ngay cho nhân viên tiếp theo trong danh sách.

#### 10. Exception Flows
- **E1. Không có nhân viên nào trong ca trực (ngoài giờ làm việc ban đêm):** Chuyển Lead vào hàng đợi chờ duyệt `Lead Pool`, đồng hồ SLA chỉ bắt đầu tính từ 08h00 sáng ngày làm việc kế tiếp (`BR-CRM-005`).

#### 11. Business Rules
- `BR-CRM-004`: Tư vấn viên vi phạm quá 3 lần SLA trong tuần sẽ tạm dừng nhận Lead tự động trong 24 giờ.
- `BR-CRM-005`: Khung giờ tính SLA là giờ hành chính (08:00 - 18:00 thứ Hai đến thứ Bảy).

#### 12. State Machine
Trạng thái chuyển dịch: `New` $\rightarrow$ `Assigned`. Khi tư vấn viên bấm gọi hoặc ghi log: `Assigned` $\rightarrow$ `Contacted`.

#### 13. Input / Output
- **Input:** `leadId`, `assignedByUserId` (nếu phân bổ thủ công).
- **Output:** `leadId`, `assignedToUserId`, `slaDeadlineUtc`, `status: Assigned`.

#### 14. Data Entities
- Bảng: `Crm_Leads`, `Crm_SalesShifts`, `Crm_SalesShiftMembers`, `Crm_SlaViolations`.

#### 15. Permission & Data Scope
- Tự động: System Background Service.
- Phân bổ thủ công: Quyền `crm.lead.assign` với Scope `Branch` hoặc `BusinessUnit`.

#### 16. UI/UX Requirements
- Trên danh sách Lead: Đồng hồ đếm ngược SLA có đổi màu trực quan:
  - Màu xanh lá: Còn $> 50\%$ thời gian.
  - Màu vàng cam: Còn $< 25\%$ thời gian.
  - Màu đỏ nhấp nháy: Đã quá hạn SLA (`BREACHED`).
- Nút bấm "Thu hồi & Phân bổ lại" dành cho Trưởng phòng tuyển sinh.

#### 17. API Contract Proposal
- `POST /api/v1/crm/leads/{id}/assign`
- `POST /api/v1/crm/leads/{id}/reclaim`

#### 18. Integration & Events
- Bắn sự kiện `Crm.LeadAssignedDomainEvent`, `Crm.LeadSlaBreachedDomainEvent`.

#### 19. Audit Requirements
- Ghi vết kiểm toán ai phân bổ, phân bổ cho ai, thời điểm phân bổ.

#### 20. Acceptance Criteria (Given - When - Then)
- **Kịch bản 1: Phân bổ xoay vòng chính xác**
  - *Given:* Chi nhánh Hà Nội có 2 tư vấn viên A (đã nhận 3 Lead) và B (đã nhận 1 Lead).
  - *When:* Một Lead mới thuộc địa bàn Hà Nội được ingest vào hệ thống.
  - *Then:* Lead được phân bổ tự động cho tư vấn viên B; trạng thái chuyển thành `Assigned`.
- **Kịch bản 2: Báo động vi phạm SLA**
  - *Given:* Lead Hot được phân bổ cho tư vấn viên A lúc 09:00 (SLA Deadline là 09:15).
  - *When:* Đến 09:16 mà nhân viên A chưa có thao tác cập nhật nhật ký cuộc gọi.
  - *Then:* Hệ thống đánh dấu cờ `IsSlaBreached = true` và gửi thông báo cảnh báo tới Trưởng phòng.

#### 21. Dependencies
- Phụ thuộc: `Identity_Users`, `Org_Branches`, `Org_BusinessUnits`.

#### 22. Open Questions / TBD
- `TBD-CRM-02`: Cần xác nhận khung giờ làm việc chính xác của từng chi nhánh để cài đặt logic SLA ban đêm và ngày nghỉ lễ.

---

### FEATURE: CRM-FEAT-10 — CHUYỂN ĐỔI KHÁCH HÀNG & LIÊN KẾT PARTY 360

#### 1. Feature ID / Code
`CRM-FEAT-10` | Mã hệ thống: `crm.opportunity.convert_to_party360`

#### 2. Feature Name
Chuyển đổi Cơ hội Tuyển sinh & Đồng bộ Định danh Party 360 (Customer Conversion & Party 360 Integration).

#### 3. Business Objective
Chuyển đổi khách hàng từ giai đoạn tư vấn tiềm năng sang giai đoạn ký kết hợp đồng thương mại; khởi tạo hoặc liên kết mã định danh Party duy nhất để sử dụng xuyên suốt toàn bộ vòng đời dịch vụ.

#### 4. Business Context
Đây là điểm giao thoa tối quan trọng giữa BUS-01 (Tuyển sinh) và BUS-02 (Hợp đồng). Thông tin cá nhân của học viên phải được đồng bộ chính xác vào lõi Party 360 để các phân hệ Đào tạo, Hồ sơ Visa và Kế toán cùng dùng chung một nguồn dữ liệu gốc (Single Source of Truth).

#### 5. Actors & Responsibilities
- **Tư vấn viên Tuyển sinh:** Xác nhận cơ hội thành công (Closed Won) và kích hoạt lệnh chuyển đổi.
- **Hệ thống Party 360 Integration Service:** Thực hiện mapping dữ liệu và tạo Party Master.

#### 6. Preconditions
- Opportunity ở giai đoạn thương lượng thành công và sẵn sàng lập hợp đồng.
- Bắt buộc có thông tin tối thiểu: Họ tên, Ngày tháng năm sinh, Giới tính, Số điện thoại, Địa chỉ thường trú.

#### 7. Trigger
- Người dùng bấm nút *"Tạo Hợp đồng Dịch vụ"* trên màn hình chi tiết Cơ hội kinh doanh.

#### 8. Main Flow
1. Người dùng nhập/kiểm tra thông tin pháp lý của học viên (CCCD, Ngày sinh, Tỉnh thành) và thông tin người bảo lãnh (Bố/Mẹ).
2. Hệ thống kiểm tra trong `Party_Parties` và `Party_PartyIdentifications` xem số CCCD hoặc Số điện thoại đã tồn tại Party nào chưa.
3. Nếu chưa tồn tại:
   - Tạo bản ghi mới trong `Party_Parties` (Type: `Person`).
   - Tạo bản ghi chi tiết `Party_Persons` (Họ, Tên, Ngày sinh, Giới tính, Quốc tịch Việt Nam).
   - Tạo `Party_PartyContactMethods` (Số điện thoại, Địa chỉ thường trú).
   - Tạo `Party_PartyIdentifications` (Loại: CCCD, Số thẻ, Ngày cấp, Nơi cấp).
   - Gán vai trò trong `Party_PartyRoles`: RoleType = `Student`, gán mã pháp nhân dự kiến ký kết.
4. Nếu có người bảo lãnh (Phụ huynh): Tạo bản ghi Party cho phụ huynh và thiết lập quan hệ `Party_PartyRelationships` (Type: `ParentChild`).
5. Cập nhật `PartyId` vừa tạo vào bản ghi `Crm_Opportunities` và `Crm_Leads`.
6. Chuyển trạng thái Opportunity sang `ClosedWon`.
7. Khởi tạo bản ghi Hợp đồng nháp `Com_Contracts` bên phân hệ BUS-02 mang theo đầy đủ thông tin `PartyId`, gói sản phẩm đã chọn và chiết khấu đã được duyệt.
8. Trả về mã Hợp đồng mới và chuyển hướng người dùng sang phân hệ Quản lý Hợp đồng.

#### 9. Alternative Flows
- **3a. Học viên đã từng tồn tại trong hệ thống (Ví dụ: đã từng học một khóa tiếng ngắn hạn trước đây):**
  1. Hệ thống tái sử dụng `PartyId` hiện có.
  2. Bổ sung thêm Role `Student` của Pháp nhân mới nếu chưa có.
  3. Không tạo Party mới để tránh phân mảnh định danh.

#### 10. Exception Flows
- **E1. Số CCCD bị trùng với một người khác nhưng sai lệch họ tên:** Hệ thống cảnh báo xung đột định danh nghiêm trọng (`IDENTITY_CONFLICT`), chặn tiến trình và yêu cầu Trưởng phòng xác minh bản scan CCCD gốc.

#### 11. Business Rules
- `BR-CRM-013`: Điều kiện tiên quyết chuyển đổi sang Hợp đồng Thương mại (Won Gate). Chỉ có Opportunity ở trạng thái `ProposalSent` hoặc `Negotiation` đã có Báo giá `Approved` mới được phép kích hoạt chuyển đổi.
- `BR-CRM-014`: Tính duy nhất của định danh Party 360 cho học viên. Một cá nhân chỉ có duy nhất một `PartyId` toàn hệ thống SHD Corp, dùng chung cho nhiều Hợp đồng và đợt tuyển sinh.

#### 12. State Machine
- Lead chuyển sang `Converted`.
- Opportunity chuyển sang `ClosedWon`.
- Party được kích hoạt trạng thái `Active`.
- Hợp đồng mới được sinh ra ở trạng thái `Draft`.

#### 13. Input / Output
- **Input:** `opportunityId`, `studentProfile` (CCCD, ngày sinh, nơi cấp, thông tin phụ huynh).
- **Output:** `partyId`, `contractId`, `contractCode`.

#### 14. Data Entities
- Bảng liên quan: `Crm_Opportunities`, `Party_Parties`, `Party_Persons`, `Party_PartyRoles`, `Party_PartyRelationships`, `Com_Contracts`.

#### 15. Permission & Data Scope
- Yêu cầu quyền: `crm.opportunity.convert` và `contract.create`.
- Data Scope: Áp dụng phạm vi `Branch` của cơ hội kinh doanh.

#### 16. UI/UX Requirements
- Modal chuyển đổi thông minh:
  - Cột trái: Tóm tắt thông tin tư vấn và gói sản phẩm đã chốt.
  - Cột phải: Form nhập thông tin CCCD và người bảo lãnh, có tính năng gợi ý auto-complete nếu số điện thoại đã có trong Party 360.
  - Nút bấm xác nhận: *"Xác nhận & Khởi tạo Hợp đồng Dịch vụ"*.

#### 17. API Contract Proposal
- `POST /api/v1/crm/opportunities/{id}/convert-to-contract`

#### 18. Integration & Events
- Bắn sự kiện: `Crm.OpportunityConvertedDomainEvent` và `Party.StudentEnrolledDomainEvent`.

#### 19. Audit Requirements
- Lưu vết kiểm toán hành vi liên kết Party và khởi tạo Hợp đồng với đầy đủ `CorrelationId`.

#### 20. Acceptance Criteria (Given - When - Then)
- **Kịch bản 1: Chuyển đổi thành công học viên mới**
  - *Given:* Opportunity hợp lệ đang ở giai đoạn `Negotiation`.
  - *When:* Tư vấn viên gửi thông tin CCCD mới chưa có trong hệ thống và bấm chuyển đổi.
  - *Then:* Hệ thống sinh mới 1 `PartyId`, gán Role `Student`, đóng Opportunity thành `ClosedWon`, tạo Hợp đồng nháp bên BUS-02 và chuyển hướng màn hình.
- **Kịch bản 2: Bắt lỗi thiếu thông tin CCCD**
  - *Given:* Tư vấn viên bấm chuyển đổi nhưng để trống trường CCCD của học viên.
  - *When:* Hệ thống kiểm tra validation.
  - *Then:* Báo lỗi yêu cầu bổ sung số CCCD để đảm bảo tính pháp lý trước khi sinh hợp đồng.

#### 21. Dependencies
- Phụ thuộc: `Party_Parties` (FND-04), `Com_Contracts` (BUS-02).

#### 22. Open Questions / TBD
- `TBD-CRM-03`: Trong trường hợp học viên chưa đủ tuổi làm CCCD (dưới 14 tuổi tham gia trại hè), xác nhận loại giấy tờ thay thế (Giấy khai sinh / Hộ chiếu).



---

### FEATURE: CRM-FEAT-01 — QUẢN LÝ NGUỒN TIẾP THỊ & CHIẾN DỊCH MARKETING

#### 1. Feature ID / Code
`CRM-FEAT-01` | Mã hệ thống: `crm.campaigns.manage`

#### 2. Feature Name
Quản lý Nguồn Tiếp thị Phân cấp & Chiến dịch Tuyển sinh (Marketing Sources & Campaigns Catalog).

#### 3. Business Objective
Thiết lập danh mục nguồn tiếp thị phân cấp và các chiến dịch tuyển sinh theo mùa; gắn mã UTM, ngân sách và thời hạn hiệu lực để phục vụ đo lường ROI và chi phí trên mỗi Lead (CPL).

#### 4. Business Context
SHD Corp vận hành nhiều kênh tiếp thị số (Facebook Ads, Google Search, TikTok Live) và kênh sự kiện offline (Hội thảo trường THPT). Cần quản lý tập trung danh mục này để gán nguồn gốc Lead và báo cáo hiệu quả.

#### 5. Actors & Responsibilities
- **Chuyên viên Marketing (`ACT-01`):** Tạo và cấu hình chiến dịch, nhập ngân sách, tạo mã UTM.
- **Trưởng phòng Marketing / Giám đốc BU (`ACT-06`):** Phê duyệt ngân sách và mục tiêu chiến dịch.

#### 6. Preconditions
- Phân hệ CRM đã được kích hoạt trong `System_Modules`.
- Người dùng có quyền `crm.campaign.manage`.

#### 7. Trigger
- Khi bắt đầu một kỳ tuyển sinh mới hoặc chuẩn bị chạy một chiến dịch quảng cáo mới.

#### 8. Main Flow
1. Người dùng truy cập danh mục Chiến dịch Marketing.
2. Bấm "Thêm mới Chiến dịch", nhập Mã chiến dịch, Tên chiến dịch, Nguồn gốc cấp 1 (Digital/Offline), Thị trường mục tiêu (Korea/Germany/Japan), Ngân sách dự kiến và Ngày bắt đầu/kết thúc.
3. Hệ thống sinh mã UTM Campaign và webhook integration key.
4. Trạng thái chiến dịch chuyển sang `Active`.

#### 9. Alternative Flows
- **3a. Tạm dừng chiến dịch:** Khi hết ngân sách hoặc dừng chương trình, đổi trạng thái sang `Paused`.

#### 10. Exception Flows
- **E1. Trùng mã Code chiến dịch:** Hệ thống báo lỗi `CAMPAIGN_CODE_ALREADY_EXISTS`.

#### 11. Business Rules
- `BR-CRM-001`: Mọi chiến dịch phải gắn với một `SourceId` hợp lệ.
- `BR-CRM-003`: Lead đăng ký qua URL có UTM của chiến dịch nào sẽ được gắn First-touch với chiến dịch đó.

#### 12. State Machine
Trạng thái Chiến dịch: `Draft` $\rightarrow$ `Active` $\rightarrow$ `Paused` $\rightarrow$ `Completed`.

#### 13. Input / Output
- **Input:** Code, Name, SourceId, TargetMarket, BudgetAmount, StartDateUtc, EndDateUtc.
- **Output:** CampaignId, WebhookUrl, TrackingUrl.

#### 14. Data Entities
- Bảng: `Crm_MarketingSources`, `Crm_Campaigns`.

#### 15. Permission & Data Scope
- Quyền: `crm.campaign.manage` kèm Data Scope `BusinessUnit` hoặc `Global`.

#### 16. UI/UX Requirements
- Màn hình quản lý danh sách Campaign, hiển thị thanh tiến độ thời gian và tổng số Lead đã thu về.

#### 17. API Contract Proposal
- `GET /api/v1/crm/campaigns`
- `POST /api/v1/crm/campaigns`
- `PUT /api/v1/crm/campaigns/{id}`

#### 18. Integration & Events
- Bắn sự kiện `Crm.CampaignActivatedEvent`.

#### 19. Audit Requirements
- Ghi vết `CREATE_CAMPAIGN`, `UPDATE_CAMPAIGN` trong `Audit_SystemLogs`.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Chuyên viên Marketing có quyền `crm.campaign.manage`.
- *When:* Nhập thông tin chiến dịch mới với mã `CAMP_KR_2026_FALL` và bấm Lưu.
- *Then:* Hệ thống lưu thành công vào `Crm_Campaigns`, trả về HTTP 201 Created.

#### 21. Dependencies
- Phụ thuộc: `Crm_MarketingSources`, `Org_BusinessUnits`.

#### 22. Open Questions / TBD
- `TBD-CRM-04`: Cơ chế tự động đồng bộ chi phí thực tế (Actual Spend) qua Facebook Marketing API (Dự kiến Phase 2).

---

### FEATURE: CRM-FEAT-03 — NHẬP DỮ LIỆU LEAD HÀNG LOẠT TỪ EXCEL

#### 1. Feature ID / Code
`CRM-FEAT-03` | Mã hệ thống: `crm.leads.import_excel`

#### 2. Feature Name
Nhập Dữ liệu Khách hàng Tiềm năng Hàng loạt từ File Excel (Batch Lead Import & Validation).

#### 3. Business Objective
Hỗ trợ nhân viên tuyển sinh nhập hàng trăm hồ sơ học viên thu thập từ các ngày hội tư vấn tuyển sinh tại trường cấp 3 hoặc sự kiện offline; tự động phát hiện lỗi định dạng và trùng lặp trước khi commit vào database.

#### 4. Business Context
Mỗi đợt hội thảo tại các trường THPT có thể thu về 200 - 500 phiếu đăng ký tư vấn. Nếu nhập tay từng phiếu sẽ tốn nhiều ngày công và dễ nhầm lẫn.

#### 5. Actors & Responsibilities
- **Chuyên viên Tuyển sinh / Marketing (`ACT-01`, `ACT-03`):** Chuẩn bị file Excel theo mẫu và thực hiện import.

#### 6. Preconditions
- Người dùng có quyền `crm.lead.create`. File Excel đúng định dạng `.xlsx` theo biểu mẫu quy chuẩn.

#### 7. Trigger
- Người dùng bấm nút "Nhập từ Excel" trên màn hình Lead Management Workspace.

#### 8. Main Flow
1. Người dùng chọn file Excel và chọn Chiến dịch Marketing nguồn.
2. Hệ thống thực hiện kiểm tra trước (Dry-run Validation):
   - Đọc từng dòng, kiểm tra số điện thoại, họ tên, GPA, năm tốt nghiệp.
   - Đối chiếu số điện thoại với `Crm_Leads` theo quy tắc chống trùng 60 ngày (`BR-CRM-001`).
3. Hệ thống trả về bảng xem trước (Preview): Tổng số dòng, Số dòng hợp lệ, Số dòng lỗi, Số dòng trùng lặp.
4. Người dùng xác nhận "Tiến hành Nhập".
5. Hệ thống ghi nhận các dòng hợp lệ vào `Crm_Leads`, tạo bản ghi Touchpoint và chuyển tiếp sang hàng đợi phân bổ.

#### 9. Alternative Flows
- **3a. File có dòng lỗi:** Hệ thống cho phép tải về file Excel báo cáo lỗi (Error Report) đính kèm cột ghi chú lý do lỗi từng dòng.

#### 10. Exception Flows
- **E1. File không đúng định dạng cột chuẩn:** Báo lỗi `INVALID_EXCEL_TEMPLATE` và dừng toàn bộ tiến trình.

#### 11. Business Rules
- `BR-CRM-001`: Các dòng trùng số điện thoại trong 60 ngày sẽ không tạo Lead mới mà chỉ cập nhật Touchpoint.
- `BR-CRM-002`: Số điện thoại phải chuẩn hóa về E.164.

#### 12. State Machine
Các Lead hợp lệ sau khi import được khởi tạo ở trạng thái `New`.

#### 13. Input / Output
- **Input:** File `.xlsx` (Cột: Họ tên, SĐT, Email, Tỉnh thành, GPA, Năm tốt nghiệp, Chương trình quan tâm).
- **Output:** JSON summary `{ totalRows: 100, imported: 95, duplicates: 3, failed: 2 }`.

#### 14. Data Entities
- Bảng: `Crm_Leads`, `Crm_LeadTouchpoints`.

#### 15. Permission & Data Scope
- Quyền: `crm.lead.create` kèm Data Scope `Branch` hoặc `BusinessUnit`.

#### 16. UI/UX Requirements
- Modal Upload 3 bước: 1. Tải template & Chọn file $\rightarrow$ 2. Xem kết quả thẩm định sơ bộ $\rightarrow$ 3. Hoàn tất & Tải báo cáo lỗi nếu có.

#### 17. API Contract Proposal
- `POST /api/v1/crm/leads/import/validate`
- `POST /api/v1/crm/leads/import/commit`

#### 18. Integration & Events
- Bắn sự kiện `Crm.BatchLeadImportedEvent`.

#### 19. Audit Requirements
- Lưu vết `IMPORT_LEADS_BATCH` kèm số lượng bản ghi thành công và tên file.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* File Excel có 10 dòng, trong đó 8 dòng hợp lệ và 2 dòng sai số điện thoại.
- *When:* Thực hiện validate file qua hệ thống.
- *Then:* Hệ thống thông báo rõ 8 dòng hợp lệ, 2 dòng lỗi và cho phép chỉ commit 8 dòng hợp lệ.

#### 21. Dependencies
- Thư viện đọc Excel (ClosedXML hoặc MiniExcel).

#### 22. Open Questions / TBD
- Không có (Đã chuẩn hóa kỹ thuật).

---

### FEATURE: CRM-FEAT-04 — CHẤM ĐIỂM & PHÂN LOẠI TIỀM NĂNG (SCORING)

#### 1. Feature ID / Code
`CRM-FEAT-04` | Mã hệ thống: `crm.leads.score`

#### 2. Feature Name
Động cơ Chấm điểm & Phân hạng Ưu tiên Khách hàng Tiềm năng (Rule-based Lead Scoring).

#### 3. Business Objective
Tự động tính toán điểm tiềm năng ($0 - 100$ điểm) và phân loại Lead thành `Hot`, `Warm`, `Cold` nhằm giúp tư vấn viên tập trung nguồn lực vào nhóm khách hàng có khả năng đi du học cao nhất.

#### 4. Business Context
Điều kiện xét visa du học Hàn Quốc, Đức và Nhật phụ thuộc chặt chẽ vào điểm học bạ THPT (GPA) và số năm trống tốt nghiệp. Nếu phân loại sớm, tư vấn viên sẽ tư vấn đúng lộ trình ngay từ cuộc gọi đầu tiên.

#### 5. Actors & Responsibilities
- **Hệ thống Scoring Worker:** Tự động tính điểm khi Lead được tạo hoặc cập nhật học bạ.
- **Tư vấn viên (`ACT-03`):** Nhận diện phân hạng để áp dụng kịch bản tư vấn phù hợp.

#### 6. Preconditions
- Lead có thông tin sơ bộ về GPA, Năm tốt nghiệp hoặc Ngân sách dự kiến.

#### 7. Trigger
- Khi Lead mới được tạo hoặc khi Tư vấn viên cập nhật thông tin học bạ trong buổi tư vấn.

#### 8. Main Flow
1. Hệ thống áp dụng ma trận chấm điểm:
   - Điểm GPA THPT: $\ge 7.5$ (+35đ); $6.5 - 7.4$ (+25đ); $< 6.5$ (+10đ).
   - Năm trống tốt nghiệp: $\le 1$ năm (+25đ); $2 - 3$ năm (+15đ); $> 3$ năm (+5đ).
   - Nhu cầu kỳ bay: Kỳ gần nhất trong 6 tháng (+20đ); Trên 6 tháng (+10đ).
   - Khả năng tài chính gia đình sơ bộ: Sẵn sàng sổ tiết kiệm (+20đ).
2. Tổng hợp `LeadScore` ($0 - 100$).
3. Phân hạng:
   - $\ge 70$ điểm: `PriorityTier = Hot`.
   - $40 - 69$ điểm: `PriorityTier = Warm`.
   - $< 40$ điểm: `PriorityTier = Cold`.
4. Cập nhật trường `LeadScore` và `PriorityTier` vào bản ghi `Crm_Leads`.

#### 9. Alternative Flows
- **3a. Thiếu dữ liệu học bạ:** Hệ thống tạm tính điểm mặc định 50 (`Warm`) cho đến khi có dữ liệu cuộc gọi đầu tiên.

#### 10. Exception Flows
- Không có.

#### 11. Business Rules
- `BR-CRM-004`: Phân hạng `Hot` quyết định thời hạn phản hồi SLA là 15 phút.

#### 12. State Machine
- Cập nhật thuộc tính phân loại, không làm thay đổi trạng thái vòng đời Lead.

#### 13. Input / Output
- **Input:** HighSchoolGpa, GraduationYear, TargetIntake, FinancialReadiness.
- **Output:** LeadScore (int), PriorityTier (`Hot` | `Warm` | `Cold`).

#### 14. Data Entities
- Bảng: `Crm_Leads`.

#### 15. Permission & Data Scope
- Tự động thực thi bởi hệ thống hoặc quyền `crm.lead.edit`.

#### 16. UI/UX Requirements
- Badge hiển thị màu sắc trực quan trên danh sách Lead: Hot (Đỏ/Cam), Warm (Vàng), Cold (Xanh xám).

#### 17. API Contract Proposal
- `POST /api/v1/crm/leads/{id}/re-score`

#### 18. Integration & Events
- Bắn sự kiện `Crm.LeadScoredEvent`.

#### 19. Audit Requirements
- Ghi nhận vào `OldValues` / `NewValues` của `Crm_Leads`.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Lead có GPA 8.0, vừa tốt nghiệp 2026, muốn đi kỳ tháng 9/2026.
- *When:* Hệ thống tính điểm.
- *Then:* LeadScore đạt $\ge 80$ điểm và PriorityTier là `Hot`.

#### 21. Dependencies
- Không phụ thuộc bên ngoài.

#### 22. Open Questions / TBD
- Không có.

---

### FEATURE: CRM-FEAT-06 — NHẬT KÝ CUỘC GỌI & KHẢO SÁT NHU CẦU HỌC VIÊN

#### 1. Feature ID / Code
`CRM-FEAT-06` | Mã hệ thống: `crm.consultations.log`

#### 2. Feature Name
Nhật ký Tương tác Tuyển sinh & Khảo sát Nhu cầu Học viên (Consultation Logs & Profiling Workspace).

#### 3. Business Objective
Ghi nhận toàn bộ lịch sử các cuộc gọi, tin nhắn Zalo, buổi gặp trực tiếp giữa tư vấn viên và phụ huynh/học viên; lưu trữ bảng câu hỏi khảo sát chi tiết nguyện vọng trường và rào cản tài chính.

#### 4. Business Context
Quy trình tư vấn du học kéo dài qua nhiều cuộc gọi. Nếu không ghi log chi tiết, khi đổi tư vấn viên hoặc khi phụ huynh gọi lại, tư vấn viên mới sẽ không nắm được hoàn cảnh gia đình học viên.

#### 5. Actors & Responsibilities
- **Chuyên viên Tư vấn (`ACT-03`):** Thực hiện tương tác và nhập biên bản tóm tắt nội dung.

#### 6. Preconditions
- Lead đã được phân bổ cho chuyên viên (`AssignedToUserId` là người đang thao tác).

#### 7. Trigger
- Sau khi thực hiện xong một cuộc gọi điện thoại hoặc buổi gặp tư vấn trực tiếp.

#### 8. Main Flow
1. Tư vấn viên mở Slide-over Drawer `SCR-CRM-03`.
2. Chọn kết quả tương tác (`CallOutcome`): `Connected_Interested`, `Busy_CallLater`, `NoAnswer`, `WrongNumber`, `NotInterested`.
3. Nhập thời lượng cuộc gọi và ghi chú nội dung chính (nguyện vọng trường, khả năng tài chính, thắc mắc của phụ huynh).
4. Nhập ngày hẹn liên hệ lại (`FollowUpDateUtc`).
5. Bấm "Lưu Nhật Ký".
6. Hệ thống tạo bản ghi `Crm_ConsultationLogs`, cập nhật `LastInteractedAtUtc`, dừng đồng hồ SLA (nếu là tương tác đầu tiên) và chuyển trạng thái Lead sang `Contacted`.

#### 9. Alternative Flows
- **6a. Khách hàng quan tâm và đủ điều kiện:** Chọn chuyển trạng thái Lead sang `Qualified`.

#### 10. Exception Flows
- **E1. Không nhập ghi chú nội dung:** Hệ thống chặn lưu và yêu cầu nhập tối thiểu 10 ký tự.

#### 11. Business Rules
- `BR-CRM-008`: Bắt buộc ghi nhận kết quả tương tác khi chuyển trạng thái Lead.
- `BR-CRM-009`: Bắt buộc nhập `FollowUpDateUtc` khi kết quả là `Connected_Interested` hoặc `Busy_CallLater`.

#### 12. State Machine
Trạng thái Lead chuyển từ `Assigned` sang `Contacted` hoặc `Qualified`.

#### 13. Input / Output
- **Input:** LeadId, ContactMethod, CallOutcome, DurationSeconds, Notes, FollowUpDateUtc, NextAction.
- **Output:** LogId, CreatedAtUtc.

#### 14. Data Entities
- Bảng: `Crm_ConsultationLogs`, `Crm_Leads`.

#### 15. Permission & Data Scope
- Quyền: `crm.consultation.create` kèm Data Scope `Self` hoặc `Branch`.

#### 16. UI/UX Requirements
- Form ghi nhanh cuộc gọi trong Slide-over Drawer, có phím tắt `Ctrl + Enter` để lưu nhanh.

#### 17. API Contract Proposal
- `POST /api/v1/crm/leads/{id}/consultations`
- `GET /api/v1/crm/leads/{id}/consultations`

#### 18. Integration & Events
- Bắn sự kiện `Crm.ConsultationLoggedEvent`.

#### 19. Audit Requirements
- Lưu vết kiểm toán tự động qua `Audit_SystemLogs`.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Lead đang ở trạng thái `Assigned`.
- *When:* Tư vấn viên lưu log cuộc gọi với kết quả `Connected_Interested`.
- *Then:* Hệ thống lưu thành công, Lead chuyển sang `Contacted`, đồng hồ SLA dừng đếm ngược.

#### 21. Dependencies
- Phụ thuộc: `Crm_Leads`.

#### 22. Open Questions / TBD
- Không có.

---

### FEATURE: CRM-FEAT-07 — LỊCH HẸN TƯ VẤN & CẢNH BÁO TÁI TƯƠNG TÁC

#### 1. Feature ID / Code
`CRM-FEAT-07` | Mã hệ thống: `crm.consultations.reminders`

#### 2. Feature Name
Quản lý Lịch hẹn & Hệ thống Cảnh báo Tái Tương tác (Follow-up Reminders & Schedule Manager).

#### 3. Business Objective
Tự động nhắc nhở tư vấn viên danh sách học viên cần gọi lại trong ngày; gửi thông báo nhắc hẹn trước 30 phút để không bỏ sót khách hàng tiềm năng.

#### 4. Business Context
Tư vấn viên quản lý 30 - 50 khách hàng cùng lúc. Nếu không có lịch hẹn tự động nhắc nhở, tư vấn viên rất dễ quên ngày gọi lại cho phụ huynh đúng như đã hứa.

#### 5. Actors & Responsibilities
- **Chuyên viên Tư vấn (`ACT-03`):** Xem danh sách công việc cần làm trong ngày và thực hiện cuộc gọi.

#### 6. Preconditions
- Có ít nhất một bản ghi hẹn gọi lại (`FollowUpDateUtc`) trong `Crm_ConsultationLogs`.

#### 7. Trigger
- Định kỳ đầu ngày làm việc (08:00) hoặc trước giờ hẹn 30 phút.

#### 8. Main Flow
1. Background Job quét các lịch hẹn có `FollowUpDateUtc` trong ngày hôm nay.
2. Đẩy danh sách nhiệm vụ lên widget "Khách hàng cần liên hệ hôm nay" trên Dashboard của tư vấn viên.
3. Gửi thông báo Notification trên giao diện Web ERP.
4. Tư vấn viên bấm vào thông báo $\rightarrow$ Hệ thống mở trực tiếp Slide-over Drawer hồ sơ học viên đó.

#### 9. Alternative Flows
- **3a. Khách hàng xin đổi giờ hẹn:** Tư vấn viên bấm "Đổi lịch hẹn" và chọn giờ mới.

#### 10. Exception Flows
- Không có.

#### 11. Business Rules
- `BR-CRM-009`: Ngày hẹn gọi lại không được quá 14 ngày.

#### 12. State Machine
Quản lý trạng thái lịch hẹn: `Scheduled` $\rightarrow$ `Completed` / `Rescheduled` / `Cancelled`.

#### 13. Input / Output
- **Output:** Danh sách các đầu mối cần liên hệ trong ngày kèm thông tin tóm tắt lần gọi trước.

#### 14. Data Entities
- Bảng: `Crm_ConsultationLogs`.

#### 15. Permission & Data Scope
- Quyền: `crm.consultation.view` với Scope `Self`.

#### 16. UI/UX Requirements
- Widget lịch làm việc hiển thị trên Dashboard kèm số lượng khách hàng quá hạn hẹn gọi.

#### 17. API Contract Proposal
- `GET /api/v1/crm/consultations/today-reminders`

#### 18. Integration & Events
- Phát sinh thông báo qua Webhook / SignalR Notification.

#### 19. Audit Requirements
- Ghi nhận trạng thái hoàn thành lịch hẹn.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Tư vấn viên có 3 lịch hẹn gọi lại trong ngày 2026-10-29.
- *When:* Đăng nhập vào hệ thống lúc 08:30 ngày 2026-10-29.
- *Then:* Widget Dashboard hiển thị danh sách 3 khách hàng cần gọi.

#### 21. Dependencies
- Phụ thuộc: Dashboard Notification Engine.

#### 22. Open Questions / TBD
- Không có.

---

### FEATURE: CRM-FEAT-08 — QUẢN LÝ PHỄU CƠ HỘI KINH DOANH (OPPORTUNITY KANBAN)

#### 1. Feature ID / Code
`CRM-FEAT-08` | Mã hệ thống: `crm.opportunities.pipeline`

#### 2. Feature Name
Quản lý Phễu Cơ hội Kinh doanh Dạng Bảng Trực quan (Opportunity Kanban Pipeline).

#### 3. Business Objective
Trực quan hóa toàn bộ các thương vụ tuyển sinh theo 5 giai đoạn phễu; hỗ trợ thao tác kéo thả (Drag-and-Drop) để cập nhật tiến độ; tính toán dự báo doanh thu trọng số theo xác suất thành công.

#### 4. Business Context
Cấp quản lý (Trưởng phòng, Giám đốc Chi nhánh) cần cái nhìn tổng thể về số lượng học viên đang ở giai đoạn nào để dự báo doanh số kỳ tuyển sinh tới và can thiệp kịp thời vào các thương vụ bị tắc nghẽn.

#### 5. Actors & Responsibilities
- **Chuyên viên Tư vấn (`ACT-03`):** Cập nhật tiến độ cơ hội, kéo thẻ sang giai đoạn tiếp theo.
- **Trưởng nhóm Tuyển sinh (`ACT-02`):** Giám sát giá trị phễu và tỷ lệ chuyển đổi giữa các cột.

#### 6. Preconditions
- Lead đã được chuyển đổi thành Opportunity.
- Người dùng có quyền `crm.opportunity.view`.

#### 7. Trigger
- Người dùng truy cập màn hình Opportunity Pipeline.

#### 8. Main Flow
1. Hệ thống hiển thị 5 cột Kanban: `Discovery` (10%) $\rightarrow$ `ValueProposition` (25%) $\rightarrow$ `ProposalSent` (50%) $\rightarrow$ `Negotiation` (75%) $\rightarrow$ `ClosedWon` / `ClosedLost`.
2. Mỗi thẻ hiển thị: Tên học viên, Chương trình du học, Giá trị dự kiến, Tên tư vấn viên và Avatar.
3. Đầu mỗi cột hiển thị: Tổng số thẻ và Tổng giá trị dự kiến của cột đó.
4. Khi tư vấn viên kéo thẻ từ cột này sang cột khác: Hệ thống kiểm tra điều kiện chuyển cột (Guards), cập nhật `Stage`, tính lại `ProbabilityPercent` và lưu vào database.

#### 9. Alternative Flows
- **4a. Kéo thẻ sang ClosedLost:** Hệ thống hiển thị Modal bắt buộc chọn lý do thất bại (`LostReasonId`) và ghi chú giải trình (`BR-CRM-012`).
- **4b. Kéo thẻ sang ClosedWon:** Hệ thống kích hoạt Modal chuyển đổi sang Hợp đồng (`CRM-FEAT-10`).

#### 10. Exception Flows
- **E1. Xung đột đồng thời (Concurrency Conflict):** Nếu có người khác đã di chuyển thẻ trước đó, hệ thống báo lỗi HTTP 409 Conflict và tải lại vị trí thẻ mới nhất.

#### 11. Business Rules
- `BR-CRM-010`: Chỉ Lead đã được xác thực nhu cầu mới được chuyển thành Opportunity.
- `BR-CRM-011`: Bắt buộc gắn sản phẩm và giá trị dự kiến khi chuyển sang `ValueProposition`.
- `BR-CRM-012`: Bắt buộc nhập lý do thất bại khi đóng cơ hội.

#### 12. State Machine
Vòng đời Opportunity: `Discovery` $\rightarrow$ `ValueProposition` $\rightarrow$ `ProposalSent` $\rightarrow$ `Negotiation` $\rightarrow$ `ClosedWon` / `ClosedLost`.

#### 13. Input / Output
- **Input:** OpportunityId, TargetStage, RowVersionBase64.
- **Output:** Cập nhật thành công, tổng giá trị phễu được cập nhật lại.

#### 14. Data Entities
- Bảng: `Crm_Opportunities`, `Crm_OpportunityItems`, `Crm_LostReasons`.

#### 15. Permission & Data Scope
- Quyền: `crm.opportunity.view`, `crm.opportunity.manage` với Data Scope `Branch` hoặc `BusinessUnit`.

#### 16. UI/UX Requirements
- Giao diện Kanban kéo thả mượt mà sử dụng thư viện kéo thả hiện đại (dnd-kit hoặc react-beautiful-dnd).

#### 17. API Contract Proposal
- `GET /api/v1/crm/opportunities/pipeline`
- `PUT /api/v1/crm/opportunities/{id}/stage`

#### 18. Integration & Events
- Bắn sự kiện `Crm.OpportunityStageChangedEvent`.

#### 19. Audit Requirements
- Lưu vết `CHANGE_OPPORTUNITY_STAGE` kèm trạng thái trước và sau.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Cơ hội đang ở cột `ProposalSent`.
- *When:* Kéo sang cột `Negotiation`.
- *Then:* Cột `Negotiation` tăng 1 thẻ, giá trị dự kiến cập nhật đúng, hệ thống lưu `Stage = Negotiation`.

#### 21. Dependencies
- Phụ thuộc: `Crm_Opportunities`, `Com_Products`.

#### 22. Open Questions / TBD
- Không có.

---

### FEATURE: CRM-FEAT-09 — PHÂN TÍCH NGUYÊN NHÂN MẤT CƠ HỘI (LOST REASONS)

#### 1. Feature ID / Code
`CRM-FEAT-09` | Mã hệ thống: `crm.opportunities.lost_analysis`

#### 2. Feature Name
Phân tích Nguyên nhân Thất bại & Quản lý Danh mục Lý do Mất Khách hàng (Lost Reasons Analytics).

#### 3. Business Objective
Chuẩn hóa danh mục lý do thất bại và phân tích số liệu thống kê nguyên nhân mất khách hàng (do giá cao, do điều kiện visa khó khăn, hay do chọn đối thủ cạnh tranh), phục vụ cải tiến chính sách sản phẩm.

#### 4. Business Context
Nếu không phân tích lý do trượt khách hàng, công ty sẽ tiếp tục đổ tiền vào quảng cáo nhưng tỷ lệ chuyển đổi không cải thiện. Dữ liệu này giúp Ban Lãnh đạo biết nguyên nhân thực sự đến từ đâu.

#### 5. Actors & Responsibilities
- **Tư vấn viên (`ACT-03`):** Cung cấp trung thực lý do khách hàng từ chối khi đóng thương vụ.
- **Giám đốc Tuyển sinh / Marketing (`ACT-01`, `ACT-06`):** Xem báo cáo phân tích biểu đồ nguyên nhân thất bại.

#### 6. Preconditions
- Có danh mục lý do thất bại chuẩn (`Crm_LostReasons`).

#### 7. Trigger
- Khi một Opportunity bị chuyển sang `ClosedLost`.

#### 8. Main Flow
1. Khi bấm đóng thất bại, hệ thống hiển thị Dropdown danh mục lý do:
   - `HIGH_PRICE`: Chi phí chương trình cao hơn khả năng chi trả.
   - `FINANCIAL_DEFICIT`: Gia đình không đủ điều kiện mở sổ tiết kiệm chứng minh tài chính.
   - `COMPETITOR_CHOSEN`: Khách hàng chọn trung tâm du học khác (bắt buộc nhập tên đối thủ).
   - `FAMILY_CANCELLED`: Gia đình đổi kế hoạch, học viên chọn học đại học trong nước.
   - `ACADEMIC_UNQUALIFIED`: Trượt điều kiện học bạ THPT hoặc không học được tiếng.
2. Nhập ghi chú diễn giải chi tiết (tối thiểu 20 ký tự).
3. Bấm xác nhận $\rightarrow$ Opportunity đóng lại với `Stage = ClosedLost`.

#### 9. Alternative Flows
- Không có.

#### 10. Exception Flows
- **E1. Không chọn lý do hoặc ghi chú dưới 20 ký tự:** Báo lỗi validation và chặn thao tác đóng.

#### 11. Business Rules
- `BR-CRM-012`: Bắt buộc chọn mã lý do và nhập diễn giải khi đóng thất bại.

#### 12. State Machine
Opportunity chuyển sang trạng thái kết thúc `ClosedLost`.

#### 13. Input / Output
- **Input:** OpportunityId, LostReasonId, LostReasonNotes.
- **Output:** Status: ClosedLost, ClosedAtUtc.

#### 14. Data Entities
- Bảng: `Crm_LostReasons`, `Crm_Opportunities`.

#### 15. Permission & Data Scope
- Quyền: `crm.opportunity.manage` với Scope sở hữu.

#### 16. UI/UX Requirements
- Modal xác nhận đóng thất bại có trường Textarea bắt buộc nhập nội dung.

#### 17. API Contract Proposal
- `POST /api/v1/crm/opportunities/{id}/close-lost`

#### 18. Integration & Events
- Bắn sự kiện `Crm.OpportunityClosedLostEvent`.

#### 19. Audit Requirements
- Lưu vết lý do thất bại vào `Audit_SystemLogs`.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Opportunity đang ở giai đoạn bất kỳ.
- *When:* Bấm đóng thất bại nhưng không chọn mã lý do.
- *Then:* Hệ thống báo lỗi và giữ nguyên trạng thái cũ.

#### 21. Dependencies
- Phụ thuộc: `Crm_LostReasons`.

#### 22. Open Questions / TBD
- Không có.

---

### FEATURE: CRM-FEAT-11 — DASHBOARD PHỄU TUYỂN SINH & BÁO CÁO HIỆU SUẤT

#### 1. Feature ID / Code
`CRM-FEAT-11` | Mã hệ thống: `crm.analytics.dashboard`

#### 2. Feature Name
Bảng Điều khiển Quản trị Phễu Tuyển sinh & Báo cáo Hiệu suất Tư vấn (Admissions Funnel Dashboard).

#### 3. Business Objective
Cung cấp bức tranh toàn cảnh về tiến độ tuyển sinh theo thời gian thực: Tỷ lệ chuyển đổi qua các bước phễu, Tỷ lệ vi phạm SLA, Doanh số theo chi nhánh và hiệu quả theo từng tư vấn viên.

#### 4. Business Context
Ban Lãnh đạo và Trưởng phòng tuyển sinh cần số liệu cập nhật từng phút để điều hành công việc hàng ngày mà không phải đợi báo cáo tuần/tháng.

#### 5. Actors & Responsibilities
- **Ban Giám đốc & Trưởng phòng Tuyển sinh (`ACT-02`, `ACT-06`, `ACT-07`):** Theo dõi số liệu toàn diện.
- **Tư vấn viên (`ACT-03`):** Theo dõi KPI cá nhân trong tháng.

#### 6. Preconditions
- Người dùng có quyền `crm.analytics.view`.

#### 7. Trigger
- Người dùng truy cập trang chủ phân hệ Tuyển sinh (`/crm/dashboard`).

#### 8. Main Flow
1. Hệ thống gọi Stored Procedure tổng hợp dữ liệu theo Data Scope của người dùng:
   - Thẻ thống kê (KPI Cards): Tổng Lead trong tháng, Số Lead mới hôm nay, Số vi phạm SLA, Tỷ lệ chốt đơn thành công.
   - Biểu đồ Phễu chuyển đổi (Conversion Funnel Chart): $Lead \rightarrow Contacted \rightarrow Qualified \rightarrow Opportunity \rightarrow Closed Won$.
   - Bảng xếp hạng tư vấn viên xuất sắc (Leaderboard): Doanh số và số lượng hợp đồng đã ký.
   - Biểu đồ tròn cơ cấu thị trường: Tỷ lệ học viên quan tâm Hàn Quốc, Đức, Nhật.
2. Dữ liệu tự động cập nhật lại mỗi 5 phút hoặc khi người dùng bấm "Làm mới".

#### 9. Alternative Flows
- **1a. Bộ lọc thời gian:** Cho phép lọc theo Hôm nay, Tuần này, Tháng này, Quý này hoặc Khoảng ngày tùy chọn.

#### 10. Exception Flows
- Không có.

#### 11. Business Rules
- Báo cáo phải tuân thủ nghiêm ngặt Data Scope: Trưởng phòng Chi nhánh Hà Nội chỉ nhìn thấy số liệu của Hà Nội; Ban Giám đốc tập đoàn nhìn thấy số liệu toàn quốc.

#### 12. State Machine
- Không áp dụng (Read-only Report).

#### 13. Input / Output
- **Input:** DateRange, BranchId, BusinessUnitId.
- **Output:** JSON tập hợp các chỉ số KPI và dữ liệu biểu đồ.

#### 14. Data Entities
- Truy vấn từ `Crm_Leads`, `Crm_Opportunities`, `Com_Contracts`.

#### 15. Permission & Data Scope
- Quyền: `crm.analytics.view` với Scope tương ứng cấp bậc.

#### 16. UI/UX Requirements
- Dashboard hiện đại, responsive, trực quan hóa bằng biểu đồ Recharts hoặc Chart.js.

#### 17. API Contract Proposal
- `GET /api/v1/crm/analytics/dashboard-summary`
- `GET /api/v1/crm/analytics/funnel-metrics`

#### 18. Integration & Events
- Không phát sinh sự kiện ghi.

#### 19. Audit Requirements
- Ghi nhận lịch sử truy cập báo cáo quản trị.

#### 20. Acceptance Criteria (Given - When - Then)
- *Given:* Trưởng phòng Chi nhánh TP.HCM đăng nhập.
- *When:* Mở Dashboard tuyển sinh.
- *Then:* Toàn bộ số liệu Lead, Cơ hội và Doanh số chỉ bao gồm dữ liệu của Chi nhánh TP.HCM.

#### 21. Dependencies
- Phụ thuộc: CQRS Read Stored Procedures.

#### 22. Open Questions / TBD
- Không có.
