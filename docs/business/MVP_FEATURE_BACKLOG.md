# BACKLOG TÍNH NĂNG MVP GIAI ĐOẠN 1 (MVP FEATURE BACKLOG)
Mã tài liệu: `BUS-BACKLOG-2026-05` | Phiên bản: `2.0.0` (Reconciled) | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Mục tiêu: **Bộ yêu cầu kỹ thuật chi tiết theo lát cắt dọc (Vertical Slice) sẵn sàng giao cho AI Coding Agent**

---

## 1. TỔNG QUAN CÁC SPRINT PHÁT TRIỂN MVP PHASE 1

Lộ trình MVP Phase 1 được chia thành **6 Sprints tuần tự** bảo đảm tính toàn vẹn end-to-end:

```
[ SPRINT 1: SCHEMA & REGISTRY ] ──► [ SPRINT 2: CORE CRM ] ──► [ SPRINT 3: OPPORTUNITY & CATALOG ]
                                                                             │
[ SPRINT 6: HANDOVER & E2E ] ◄── [ SPRINT 5: CONTRACT & PARTY360 ] ◄─────────┴──► [ SPRINT 4: QUOTATION & WF ]
```

| Sprint | Trọng Tâm Nghiệp Vụ | Epics Thực Hiện | Số User Stories | Tổng Story Points |
|:---:|---|---|:---:|:---:|
| **Sprint 1** | Cấu trúc Dữ liệu & Đăng ký Module Registry | `EPIC-01`, `EPIC-05` (Phần DB/Seed) | 3 Stories | **15 SP** |
| **Sprint 2** | Tiếp nhận Lead, Chống Trùng lặp & Giám sát SLA | `EPIC-01`, `EPIC-02`, `EPIC-03` | 6 Stories | **32 SP** |
| **Sprint 3** | Quản lý Phễu Cơ hội & Danh mục Sản phẩm | `EPIC-04`, `EPIC-05` | 5 Stories | **28 SP** |
| **Sprint 4** | Lập Báo giá & Tích hợp Workflow Duyệt Chiết khấu | `EPIC-06` | 4 Stories | **26 SP** |
| **Sprint 5** | Đồng bộ Party 360 & Soạn thảo Hợp đồng Đa Pháp nhân | `EPIC-07`, `EPIC-08` | 4 Stories | **23 SP** |
| **Sprint 6** | Kích hoạt Hợp đồng sau Nộp cọc & Bàn giao Nghĩa vụ | `EPIC-07`, `EPIC-08` (E2E Integration) | 4 Stories | **20 SP** |
| **TỔNG CỘNG**| **Toàn bộ Lát cắt Dọc MVP Phase 1** | **8 Epics Nòng cốt** | **26 Stories** | **144 SP** |

---

## 2. CHI TIẾT USER STORIES THEO TỪNG VERTICAL SLICE

---

### SPRINT 1: CƠ SỞ DỮ LIỆU, REGISTRY & STORED PROCEDURES

#### US-01: Đăng ký Phân hệ & Tính năng vào Registry Foundation (FND-04)
- **Mã User Story:** `US-MVP-01` | **Phân hệ:** `Platform` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Kỹ sư Phát triển Hệ thống, tôi muốn đăng ký Module `CRM` và `COMMERCIAL` cùng danh mục 17 Features nòng cốt vào bảng `System_Modules` và `System_Features`, để hệ thống nhận diện và phân quyền GBAC.
- **Quy tắc liên quan:** Tuân thủ chuẩn FND-04 Migration `0012`.
- **Tiêu chí chấp nhận (Given - When - Then):**
  - *Given:* Cơ sở dữ liệu đã chạy migration FND-04.
  - *When:* Chạy script migration SQL đăng ký module mới.
  - *Then:* Bảng `System_Modules` có 2 bản ghi `CRM` và `COMMERCIAL`; bảng `System_Features` có đủ các tính năng `crm.*` và `commercial.*`; bảng `System_FeatureActionPermissions` map đúng các mã quyền canonical.

#### US-02: Thiết kế & Khởi tạo Bảng Dữ liệu Phân hệ CRM (EF Core + SQL Migration)
- **Mã User Story:** `US-MVP-02` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Developer, tôi muốn khởi tạo cấu trúc bảng dữ liệu `Crm_MarketingSources`, `Crm_Campaigns`, `Crm_Leads`, `Crm_LeadTouchpoints`, `Crm_ConsultationLogs`, `Crm_Opportunities`, `Crm_LostReasons` kèm `RowVersion` và `IsDeleted`.
- **Tiêu chí chấp nhận:**
  - Script SQL tạo bảng có đủ khóa chính GUID, foreign keys tới `Org_*`, `Party_*`, `Identity_*`.
  - Cột `PhoneNumber` trong `Crm_Leads` có non-clustered index phục vụ truy vấn chống trùng nhanh.
  - EF Core Entity classes kế thừa `BaseEntity` và cấu hình qua Fluent API `PlatformConfigurations.cs`.

#### US-03: Thiết kế & Khởi tạo Bảng Dữ liệu Phân hệ Commercial & Hợp đồng
- **Mã User Story:** `US-MVP-03` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Developer, tôi muốn khởi tạo cấu trúc bảng dữ liệu `Com_Products`, `Com_Services`, `Com_PackageComponents`, `Com_PriceLists`, `Com_PriceListItems`, `Com_Quotations`, `Com_QuotationItems`, `Com_Contracts`, `Com_ContractItems`, `Com_ContractAddenda`, `Com_PaymentSchedules`, `Com_ServiceObligations`.
- **Tiêu chí chấp nhận:**
  - Bảng `Com_Contracts` có đủ 3 trường phân quyền: `ContractingLegalEntityId`, `SellingBusinessUnitId`, `SellingBranchId`.
  - Bảng `Com_Quotations` có `ApprovalWorkflowInstanceId` trỏ tới `Wf_Instances`.
  - Script migration được lưu vào `database/migrations/YYYYMMDD_HHMM_CrmAndCommercialSchema.sql`.

---

### SPRINT 2: TIẾP NHẬN LEAD, CHỐNG TRÙNG LẶP & GIÁM SÁT SLA

#### US-04: Tiếp nhận Lead Đa Kênh qua Webhook API & Chuẩn hóa Số Điện Thoại
- **Mã User Story:** `US-MVP-04` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Chuyên viên Marketing, tôi muốn hệ thống tự động tiếp nhận dữ liệu từ Landing page qua Webhook API và tự động chuẩn hóa số điện thoại về chuẩn E.164.
- **Quy tắc liên quan:** `BR-CRM-002`.
- **API Endpoint:** `POST /api/v1/crm/leads/webhook`
- **Tiêu chí chấp nhận:**
  - Payload JSON có `phoneNumber = "0987 654 321"` được chuẩn hóa thành `"+84987654321"`.
  - Tự động tạo bản ghi `Crm_LeadTouchpoints` lưu vết `utm_source`, `utm_medium`, `IpAddress`.
  - Bắn sự kiện miền `LeadIngestedEvent` qua `System_OutboxMessages`.

#### US-05: Kiểm Soát & Ngăn Chặn Trùng Lặp Lead trong Cửa Sổ 60 Ngày
- **Mã User Story:** `US-MVP-05` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Trưởng phòng Tuyển sinh, tôi muốn hệ thống tự động kiểm soát trùng lặp khi số điện thoại đã tồn tại trong vòng 60 ngày để bảo đảm phân bổ công bằng và tránh tranh chấp hoa hồng.
- **Quy tắc liên quan:** `BR-CRM-001`, `BR-CRM-003`, `DEC-01`, `DEC-01B`.
- **Tiêu chí chấp nhận:**
  - Nếu số điện thoại đã có trong `Crm_Leads` và `LastInteractedAtUtc` cách hiện tại $\le 60$ ngày:
    - *Lead cũ đang hoạt động (`New`, `Assigned`, `Contacted`, `Qualified`):* Không tạo thêm bản ghi `Crm_Leads`; tạo thêm 1 bản ghi `Crm_LeadTouchpoints`, tăng `TouchpointCount`, cập nhật `LastInteractedAtUtc`; gửi SignalR notification cho tư vấn viên đang phụ trách: *"Khách hàng của bạn vừa đăng ký lại từ chiến dịch X"*.
    - *Lead cũ đã đóng (`Disqualified`, `Lost`):* Áp dụng theo quyết định phê duyệt `DEC-01B` (`PO_DECISION_REQUIRED`):
      - **Phương án A (Reopen/Recycle):** Cập nhật Lead cũ sang `Status = 'Recycled'`, ghi nhận Touchpoint mới, cho phép phân bổ lại trong cùng bản ghi `Id`.
      - **Phương án B (New Record with Linkage - Đề xuất kỹ thuật):** Khởi tạo bản ghi `Crm_Leads` mới chu kỳ mới (`IsRecycled = true`, `OriginalLeadId = OldLeadId`), lưu giữ nguyên trạng lịch sử Lead cũ để phục vụ báo cáo tỷ lệ chuyển đổi chu kỳ độc lập.
  - Nếu đã qua 60 ngày: Tạo Lead chu kỳ mới (`IsRecycled = true`, lưu `OriginalLeadId`).

#### US-06: Động Cơ Chấm Điểm Tiềm Năng Tự Động (Rule-based Scoring)
- **Mã User Story:** `US-MVP-06` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P2 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, tôi muốn hệ thống tự động chấm điểm GPA và khoảng trống tốt nghiệp để phân hạng Hot/Warm/Cold, giúp tôi ưu tiên gọi điện khách hàng tiềm năng trước.
- **Quy tắc liên quan:** `BR-CRM-004`.
- **Tiêu chí chấp nhận:**
  - GPA $\ge 7.5$ (+35đ), Tốt nghiệp $\le 1$ năm (+25đ), Kỳ bay trong 6 tháng (+20đ), Tài chính sẵn sàng (+20đ) $\rightarrow$ Điểm $\ge 70$ gán nhãn `Hot`.
  - Cập nhật trường `PriorityTier` trên Lead.

#### US-07: Phân Bổ Lead Xoay Vòng Round-Robin theo Chi Nhánh & Ca Trực
- **Mã User Story:** `US-MVP-07` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 8 SP
- **Câu chuyện người dùng:** Là một Trưởng nhóm Tuyển sinh, tôi muốn hệ thống tự động phân bổ Lead cho các tư vấn viên trong ca trực theo thuật toán Round-Robin dựa trên địa bàn chi nhánh.
- **Quy tắc liên quan:** `BR-CRM-007` (WIP limit 50 leads).
- **Tiêu chí chấp nhận:**
  - Tìm tư vấn viên online/trong ca trực có số Lead đang xử lý ít nhất tại chi nhánh tương ứng.
  - Cập nhật `AssignedToUserId`, `AssignedAtUtc = SYSUTCDATETIME()`, chuyển trạng thái `Assigned`.
  - Bỏ qua nhân viên đã đạt giới hạn 50 Lead đang hoạt động (`BR-CRM-007`).

#### US-08: Giám Sát SLA Thời Gian Phản Hồi & Tự Động Thu Hồi Lead Quá Hạn
- **Mã User Story:** `US-MVP-08` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Giám đốc Tuyển sinh, tôi muốn đồng hồ SLA đếm ngược 15 phút cho Lead Hot và hệ thống tự động thu hồi Lead chuyển cho người khác nếu quá hạn 120 phút.
- **Quy tắc liên quan:** `BR-CRM-004`, `BR-CRM-005`, `BR-CRM-006`.
- **Tiêu chí chấp nhận:**
  - Background Job quét mỗi phút: nếu quá `SlaDeadlineUtc` mà chưa có tương tác thì bật cờ `IsSlaBreached = true` và cảnh báo Trưởng phòng.
  - Quá 120 phút: Xóa `AssignedToUserId`, trả Lead về hàng đợi và phân bổ lại ngay cho người khác.

#### US-09: Ghi Nhận Nhật Ký Tư Vấn & Đặt Lịch Hẹn Gọi Lại
- **Mã User Story:** `US-MVP-09` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 4 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, tôi muốn mở Slide-over Drawer trên giao diện để ghi nhanh biên bản cuộc gọi và đặt lịch hẹn gọi lại.
- **Quy tắc liên quan:** `BR-CRM-008`, `BR-CRM-009`.
- **Tiêu chí chấp nhận:**
  - Bắt buộc chọn `CallOutcome` và nhập nội dung $\ge 10$ ký tự.
  - Khi lưu, chuyển trạng thái Lead sang `Contacted`, dừng đồng hồ SLA đếm ngược.
  - Lưu bản ghi `Crm_ConsultationLogs` thành công.

---

### SPRINT 3: PHỄU CƠ HỘI KINHOANH & DANH MỤC SẢN PHẨM

#### US-10: Chuyển Lead Thành Cơ Hội Kinh Doanh (Opportunity Gate)
- **Mã User Story:** `US-MVP-10` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, khi khách hàng đồng ý nghe lộ trình chuyên sâu, tôi muốn chuyển Lead thành Opportunity để quản lý theo phễu bán hàng.
- **Quy tắc liên quan:** `BR-CRM-010`.
- **Tiêu chí chấp nhận:**
  - Chỉ cho phép chuyển đổi khi Lead ở trạng thái `Contacted` hoặc `Qualified` và đã có kết nối thành công.
  - Khởi tạo bản ghi `Crm_Opportunities` ở giai đoạn `Discovery` (10% xác suất).

#### US-11: Bảng Kanban Phễu Cơ Hội Kéo Thả Trực Quan
- **Mã User Story:** `US-MVP-11` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 8 SP
- **Câu chuyện người dùng:** Là một Giám đốc Chi nhánh, tôi muốn xem toàn bộ cơ hội tuyển sinh trên giao diện Kanban kéo thả qua 5 giai đoạn phễu.
- **Tiêu chí chấp nhận:**
  - Kéo thả mượt mà qua các cột: `Discovery` $\rightarrow$ `ValueProposition` $\rightarrow$ `ProposalSent` $\rightarrow$ `Negotiation` $\rightarrow$ `ClosedWon / ClosedLost`.
  - Cập nhật tức thì `ProbabilityPercent` và tổng doanh số dự kiến ở đầu mỗi cột.
  - Hỗ trợ khóa lạc quan `RowVersionBase64`, tránh xung đột khi 2 người cùng sửa 1 cơ hội.

#### US-12: Bắt Buộc Ghi Nhận Lý Do Thất Bại khi Đóng Cơ Hội (Lost Reason)
- **Mã User Story:** `US-MVP-12` | **Phân hệ:** `CRM` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Giám đốc Marketing, tôi muốn khi nhân viên kéo thẻ sang `ClosedLost`, hệ thống bắt buộc phải chọn mã lý do và ghi chú giải trình để phục vụ cải tiến sản phẩm.
- **Quy tắc liên quan:** `BR-CRM-012`.
- **Tiêu chí chấp nhận:**
  - Hiển thị Modal bắt buộc chọn `LostReasonId` (Giá cao, Gia đình đổi kế hoạch, Chọn đối thủ...) và nhập ghi chú $\ge 20$ ký tự. Chặn đóng cơ hội nếu thiếu thông tin.

#### US-13: Quản Trị Danh Mục Gói Sản Phẩm Du Học & Bảng Giá Đa Tầng
- **Mã User Story:** `US-MVP-13` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Product Manager, tôi muốn định nghĩa các Gói sản phẩm du học đa cấu phần và thiết lập Bảng giá chuẩn kèm Bảng giá khu vực cho từng Pháp nhân.
- **Quy tắc liên quan:** `BR-COM-001`, `BR-COM-002`, `BR-COM-003`, `BR-COM-004`.
- **Tiêu chí chấp nhận:**
  - CRUD Gói sản phẩm trong `Com_Products`, bóc tách các dịch vụ thành phần trong `Com_PackageComponents`.
  - Gán đúng `OwningLegalEntityId`. Cấm xóa vật lý sản phẩm đã có dữ liệu giao dịch (`BR-COM-004`).

#### US-14: Tra Cứu Danh Mục Sản Phẩm & Giá Bán Theo Hiệu Lực Ưu Tiên
- **Mã User Story:** `US-MVP-14` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, tôi muốn hệ thống tự động trả về mức giá bán chính xác theo thứ tự ưu tiên: Chiến dịch > Khu vực > Chuẩn khi tôi chọn gói sản phẩm.
- **Quy tắc liên quan:** `BR-COM-001`.
- **Tiêu chí chấp nhận:**
  - Gọi Service định giá lấy ra đơn giá niêm yết và giá sàn (`MinAllowedPrice`) hiệu lực tại thời điểm hiện tại.

---

### SPRINT 4: BÁO GIÁ THƯƠNG MẠI & TÍCH HỢP WORKFLOW DUYỆT CHIẾT KHẤU

#### US-15: Lập Báo Giá Thương Mại & Bóc Tách Thuế VAT Tự Động
- **Mã User Story:** `US-MVP-15` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 8 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, tôi muốn tạo Báo giá từ Opportunity, chọn gói sản phẩm và hệ thống tự động bóc tách tiền dịch vụ chịu thuế 10%, đào tạo không chịu thuế và tiền thu hộ trường.
- **Quy tắc liên quan:** `DEC-09` (VAT Treatment), `BR-COM-010` (Hạn hiệu lực 15 ngày).
- **Tiêu chí chấp nhận:**
  - Tạo bản ghi `Com_Quotations` và `Com_QuotationItems` ở trạng thái `Draft`.
  - Tự động gán `ValidUntilDate = CreatedAtUtc + 15 ngày`.

#### US-16: Tích Hợp Workflow Engine Phê Duyệt Chiết Khấu / Học Bổng (FND-03)
- **Mã User Story:** `US-MVP-16` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 8 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, khi tôi áp dụng mức giảm giá vượt quá 1.000.000 VNĐ, tôi muốn hệ thống tự động chuyển Báo giá sang `PendingApproval` và gửi thông báo cho Trưởng phòng hoặc Giám đốc Chi nhánh duyệt qua FND-03 Workflow Engine.
- **Quy tắc liên quan:** `BR-COM-012`, `DEC-03`.
- **Tiêu chí chấp nhận:**
  - Giảm giá $\le 1$ tr: Tự động `Approved`.
  - Giảm giá $> 1$ tr đến $\le 3$ tr: Tạo `Wf_Instance` gửi Trưởng phòng duyệt.
  - Giảm giá $> 3$ tr đến $\le 5$ tr: Gửi Giám đốc Chi nhánh duyệt.
  - Trưởng phòng/Giám đốc có quyền Duyệt hoặc Từ chối kèm ghi chú. Mọi transition lưu vào `Wf_History`.

#### US-17: Quản Lý Phiên Bản Báo Giá Bất Biến (Quotation Versioning)
- **Mã User Story:** `US-MVP-17` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, khi khách hàng yêu cầu điều chỉnh gói chi phí sau khi đã gửi báo giá, tôi muốn tạo phiên bản mới (V2, V3) giữ nguyên lịch sử bản cũ để đối chiếu.
- **Quy tắc liên quan:** `BR-COM-011`.
- **Tiêu chí chấp nhận:**
  - Tạo bản clone với `VersionNumber = VersionNumber + 1`. Bản cũ giữ nguyên trạng thái `Sent`.
  - Khi một bản được ký hợp đồng, các bản còn lại chuyển sang `Superseded` (`BR-COM-013`).

#### US-18: Xuất File Báo Giá PDF Chuẩn Mẫu Thương Hiệu
- **Mã User Story:** `US-MVP-18` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P2 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, tôi muốn xuất bảng Báo giá ra file PDF đẹp mắt có logo thương hiệu SHD Korea / SHD Education để gửi cho phụ huynh qua Zalo.
- **Tiêu chí chấp nhận:**
  - Sinh file PDF chuẩn kích thước A4, có đầy đủ bảng dòng chi phí, điều khoản thanh toán và chữ ký giám đốc.
  - Chuyển trạng thái Báo giá sang `Sent`.

---

### SPRINT 5: ĐỒNG BỘ PARTY 360 & HỢP ĐỒNG ĐA PHÁP NHÂN

#### US-19: Chuyển Đổi Opportunity Sang Hợp Đồng & Đồng Bộ Party 360 Lõi
- **Mã User Story:** `US-MVP-19` | **Phân hệ:** `CROSS` | **Độ ưu tiên:** P1 | **Ước lượng:** 8 SP
- **Câu chuyện người dùng:** Là một Tư vấn viên, khi cơ hội chốt thành công, tôi muốn bấm "Chuyển thành Hợp đồng" để hệ thống tự động đồng bộ học viên vào `Party_Parties` và sinh hợp đồng nháp mà không cần gõ lại thông tin.
- **Quy tắc liên quan:** `BR-CRM-013`, `BR-CRM-014`, `DEC-11`, `DEC-13`.
- **Tiêu chí chấp nhận:**
  - Kiểm tra số CCCD trong `Party_PartyIdentifications`. Nếu chưa có: Tạo mới Party, Person, Role `Student`. Nếu đã có: Tái sử dụng `PartyId` cũ.
  - Chuyển Lead sang `Converted`.
  - Sinh bản ghi `Com_Contracts` ở trạng thái `Draft`, kế thừa đầy đủ dòng chi phí từ Báo giá.
  - Về thời điểm Opportunity chuyển `ClosedWon` (`DEC-13` - `PO_DECISION_REQUIRED`):
    - **Phương án 1 (Handoff to Draft):** Chuyển `Opportunity.Stage = 'ClosedWon'` ngay khi sinh Hợp đồng nháp thành công (hỗ trợ Reopen về `Negotiation` nếu Hợp đồng nháp bị xóa/hủy).
    - **Phương án 2 (Contract Signed - Khuyến nghị kỹ thuật):** Opportunity giữ trạng thái `Negotiation` (hoặc `ContractDrafted`), chỉ chuyển `ClosedWon` khi hai bên hoàn tất ký hợp đồng (`Com_Contracts: Signed`).
    - **Phương án 3 (Contract Activated):** Opportunity chỉ chuyển `ClosedWon` khi kế toán xác nhận nộp cọc Đợt 1 và hợp đồng kích hoạt (`Com_Contracts: Active`).

#### US-20: Soạn Thảo Hợp Đồng Đa Pháp Nhân & Tách Biệt Đơn Vị Bán Hàng
- **Mã User Story:** `US-MVP-20` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Cán bộ Hợp đồng, tôi muốn hợp đồng lưu trữ chính xác Pháp nhân ký kết (Bên A) và Đơn vị bán hàng để tính chỉ tiêu doanh số.
- **Quy tắc liên quan:** `BR-COM-003`, `DEC-05`.
- **Tiêu chí chấp nhận:**
  - Hợp đồng lưu đủ `ContractingLegalEntityId` và `SellingBusinessUnitId`.
  - Số hợp đồng sinh tự động dạng `HD-YYYYMM/PHAPNHAN/XXXX`.

#### US-21: Tự Động Sinh Lịch Trình Thanh Toán (Com_PaymentSchedules)
- **Mã User Story:** `US-MVP-21` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Cán bộ Hợp đồng, tôi muốn hệ thống tự động chia các đợt nộp tiền (Đợt 1 mở hồ sơ, Đợt 2 invoice trường, Đợt 3 khi có visa) theo định mức gói.
- **Tiêu chí chấp nhận:**
  - Tạo các bản ghi trong `Com_PaymentSchedules` với `DueDate`, `ExpectedAmount`, `Status = Pending`.
  - Gắn nhãn `UnlocksObligationType` cho từng đợt (`BR-COM-025`).

#### US-22: Ký Hợp Đồng & Upload Bản Scan Lưu Mã Băm Toàn Vẹn SHA256 (Doc_Documents)
- **Mã User Story:** `US-MVP-22` | **Phân hệ:** `COMMERCIAL` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Cán bộ Hợp đồng, sau khi hai bên ký tươi và đóng dấu tròn, tôi muốn upload file PDF scan lên hệ thống để lưu trữ an toàn và chống sửa đổi.
- **Quy tắc liên quan:** `DEC-08`, ADR-009.
- **Tiêu chí chấp nhận:**
  - Lưu file vào `Doc_Documents` với phân loại `Restricted`, tự động tính toán mã băm SHA256.
  - Chuyển trạng thái Hợp đồng từ `PendingSignature` sang `Signed`.
  - Cấm xóa vật lý hợp đồng đã ký (`BR-COM-021`).

---

### SPRINT 6: KÍCH HOẠT HỢP ĐỒNG, BÀN GIAO NGHĨA VỤ & TEST E2E

#### US-23: Kế Toán Xác Nhận Thu Tiền Đợt 1 & Kích Hoạt Hợp Đồng (Activation Gate)
- **Mã User Story:** `US-MVP-23` | **Phân hệ:** `COMMERCIAL` / `Finance` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Kế toán Thu công nợ, khi tôi xác nhận khách hàng đã nộp đủ tiền cọc Đợt 1 qua ngân hàng, tôi muốn Hợp đồng tự động chuyển sang trạng thái `Active`.
- **Quy tắc liên quan:** `BR-COM-020`, `DEC-06`.
- **Tiêu chí chấp nhận:**
  - Khi Phiếu thu tiền Đợt 1 được xác nhận, `Com_PaymentSchedules` Đợt 1 chuyển sang `FullyPaid`.
  - Hợp đồng chuyển trạng thái từ `Signed` sang `Active`.
  - Bắn sự kiện `Commercial.ContractActivatedDomainEvent` vào `System_OutboxMessages`.

#### US-24: Bàn Giao Nghĩa Vụ Đào Tạo & Tiếp Nhận Hồ Sơ Gốc
- **Mã User Story:** `US-MVP-24` | **Phân hệ:** `CROSS` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Trưởng phòng Đào tạo, khi hợp đồng học viên kích hoạt `Active`, tôi muốn nhận được thông báo để xếp lớp tiếng Topik cho học viên ngay lập tức.
- **Quy tắc liên quan:** `BR-COM-025`.
- **Tiêu chí chấp nhận:**
  - Lắng nghe sự kiện `ContractActivatedDomainEvent`, cập nhật `Com_ServiceObligations` của Đào tạo và Hồ sơ sang `ReadyForHandover`.
  - Hiển thị danh sách học viên mới trên màn hình tiếp nhận của Giáo vụ.

#### US-25: Che Giấu Dữ Liệu Nhạy Cảm Học Viên trên Stored Procedures (Data Masking)
- **Mã User Story:** `US-MVP-25` | **Phân hệ:** `Security` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một Cán bộ Bảo mật, tôi muốn các Stored Procedure đọc danh sách Lead và Hợp đồng tự động che giấu số điện thoại và CCCD của học viên đối với nhân viên không thuộc phạm vi phụ trách.
- **Quy tắc liên quan:** `BR-CRM-015`, Nghị định 13/2023/NĐ-CP.
- **Tiêu chí chấp nhận:**
  - Stored Procedure `sp_Crm_Lead_GetPagedList` và `sp_Commercial_Contract_GetPagedList` kiểm tra `@RequestingUserId`. Nếu không phải người phụ trách hoặc Quản lý chi nhánh, hiển thị `0912***789`.
  - Ghi vết audit log khi người dùng có thẩm quyền bấm mở xem đầy đủ.

#### US-26: Kiểm Thử Tích Hợp End-to-End Toàn Bộ Lát Cắt Dọc MVP
- **Mã User Story:** `US-MVP-26` | **Phân hệ:** `QA/QC` | **Độ ưu tiên:** P1 | **Ước lượng:** 5 SP
- **Câu chuyện người dùng:** Là một QA Lead, tôi muốn chạy bộ test kịch bản tự động kiểm chứng toàn bộ luồng từ Form Web $\rightarrow$ Lead $\rightarrow$ Opp $\rightarrow$ Quote $\rightarrow$ Contract $\rightarrow$ Active $\rightarrow$ Party 360 để nghiệm thu sản phẩm.
- **Tiêu chí chấp nhận:**
  - Vượt qua 100% 20 Test Cases quy định trong [BUSINESS_ACCEPTANCE_CHECKLIST.md](file:///f:/MyProjectSHD\SHDONEERP/docs/business/05_DELIVERY/BUSINESS_ACCEPTANCE_CHECKLIST.md).

