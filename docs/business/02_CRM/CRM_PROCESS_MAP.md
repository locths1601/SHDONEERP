# BẢN ĐỒ QUY TRÌNH NGHIỆP VỤ — PHÂN HỆ CRM & TUYỂN SINH (CRM PROCESS MAPS)
Mã tài liệu: `BUS-DOC-02-02` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Trạng thái: `PROPOSED` (Mô hình hóa quy trình chuẩn vận hành cho SHD Corp)

---

## 1. QUY TRÌNH TIẾP NHẬN & PHÁT HIỆN TRÙNG LẶP LEAD (LEAD INGESTION & DEDUPLICATION)

Quy trình đảm bảo mọi dữ liệu khách hàng từ các kênh trực tuyến và trực tiếp đều được kiểm soát trùng lặp tự động trước khi đi vào phễu phân bổ tuyển sinh.

```mermaid
flowchart TD
    Start(["Khách hàng gửi thông tin (Web / Form Ads / Excel / Walk-in)"]) --> Normalize["Chuẩn hóa dữ liệu:<br/>• Số ĐT về chuẩn E.164<br/>• Họ tên viết hoa chữ cái đầu<br/>• Gắn UTM Campaign & Source"]
    
    Normalize --> CheckPhone{"Kiểm tra Số ĐT<br/>trong DB Crm_Leads?"}
    
    CheckPhone -- "Chưa tồn tại" --> CreateNew["Khởi tạo Lead Mới (Status: New)<br/>• Gán LeadCode duy nhất<br/>• Ghi nhận First-touch Attribution"]
    CreateNew --> ScoreAndRoute["Chuyển sang Quy trình Chấm điểm & Phân bổ"]
    
    CheckPhone -- "Đã tồn tại" --> CheckWindow{"Thời gian tương tác<br/>gần nhất <= 60 ngày?"}
    
    CheckWindow -- "Đúng (Trong 60 ngày)" --> CheckActive{"Lead cũ đang<br/>được chăm sóc<br/>(New / Contacted / Qualified)?"}
    
    CheckActive -- "Đang chăm sóc" --> AppendTouchpoint["Không tạo Lead mới!<br/>• Ghi nhận thêm 1 Interaction Touchpoint<br/>• Gửi thông báo cho Nhân viên đang phụ trách<br/>• Cập nhật ngày tương tác mới nhất"]
    AppendTouchpoint --> EndDuplicate(["Kết thúc - Giữ nguyên Tư vấn viên"])
    
    CheckActive -- "Đã Lost / Hủy" --> ReopenLead["Tái mở Lead (Re-engagement)<br/>• Chuyển trạng thái Lead sang 'Recycled'<br/>• Gán quyền ưu tiên cho Tư vấn viên cũ nếu còn làm việc"]
    ReopenLead --> ScoreAndRoute
    
    CheckWindow -- "Sai (> 60 ngày)" --> CreateFreshLead["Khởi tạo Lead Chu kỳ mới (Recycled Cycle)<br/>• Lưu liên kết với LeadId cũ để đối soát<br/>• Cho phép phân bổ cho Tư vấn viên mới"]
    CreateFreshLead --> ScoreAndRoute
```

---

## 2. QUY TRÌNH CHẤM ĐIỂM & PHÂN BỔ LEAD (LEAD SCORING & SMART ROUTING)

Quy trình sàng lọc năng lực học tập/tài chính sơ bộ và điều phối Lead tới tư vấn viên theo ca trực và địa bàn phụ trách.

```mermaid
flowchart TD
    In(["Lead mới được tạo hoặc tái mở"]) --> EvalScores["Đánh giá tiêu chí chấm điểm tự động:<br/>1. Điểm GPA cấp 3 (>=6.5: +30đ)<br/>2. Năm trống tốt nghiệp (<=2 năm: +20đ)<br/>3. Nhu cầu kỳ bay gần nhất (+20đ)<br/>4. Sẵn sàng tài chính sơ bộ (+30đ)"]
    
    EvalScores --> AssignTier{"Tổng điểm đánh giá?"}
    AssignTier -- ">= 70 điểm" --> MarkHot["Phân hạng HOT LEAD<br/>SLA Cuộc gọi: 15 Phút"]
    AssignTier -- "40 - 69 điểm" --> MarkWarm["Phân hạng WARM LEAD<br/>SLA Cuộc gọi: 2 Giờ"]
    AssignTier -- "< 40 điểm" --> MarkCold["Phân hạng COLD LEAD<br/>SLA Cuộc gọi: 24 Giờ"]
    
    MarkHot & MarkWarm & MarkCold --> CheckReferral{"Có mã Cộng tác viên<br/>hoặc Chỉ định riêng?"}
    
    CheckReferral -- "Có chỉ định" --> DirectAssign["Gán trực tiếp cho Tư vấn viên được chỉ định<br/>Status: Assigned"]
    
    CheckReferral -- "Không chỉ định" --> ResolveQueue["Xác định Hàng đợi Routing theo:<br/>• Thị trường quan tâm (Hàn / Đức / Nhật)<br/>• Chi nhánh gần nhất của khách hàng"]
    
    ResolveQueue --> RoundRobin["Thực thi thuật toán Round-Robin:<br/>Chọn Tư vấn viên đang Online / Trong ca trực<br/>có số lượng Lead đang xử lý ít nhất"]
    
    RoundRobin --> DirectAssign
    
    DirectAssign --> StartSLATimer["Kích hoạt Đồng hồ đếm ngược SLA<br/>Gửi thông báo Push & Email cho Tư vấn viên"]
    StartSLATimer --> EndRouting(["Chờ Tư vấn viên liên hệ"])
```

---

## 3. QUY TRÌNH TƯ VẤN, ĐÁNH GIÁ NHU CẦU & KIỂM SOÁT SLA (CONSULTATION & SLA ESCALATION)

Quy trình theo dõi hoạt động tư vấn thực tế của nhân viên và cơ chế tự động can thiệp nếu xảy ra vi phạm thời gian phản hồi khách hàng.

```mermaid
flowchart TD
    AssignedLead(["Lead đã được phân bổ cho Tư vấn viên"]) --> WaitCall{"Tư vấn viên gọi điện<br/>trong thời hạn SLA?"}
    
    WaitCall -- "Không liên hệ (Quá hạn)" --> SLABreach["CẢNH BÁO VI PHẠM SLA:<br/>• Thông báo Trưởng phòng Tuyển sinh<br/>• Đánh dấu cờ vi phạm SLA trên Lead"]
    SLABreach --> AutoReclaim{"Quá hạn SLA > 2 giờ<br/>và không có gia hạn?"}
    AutoReclaim -- "Đúng" --> Reclaim["TỰ ĐỘNG THU HỒI LEAD<br/>Hủy phân bổ nhân viên cũ<br/>Chuyển Lead về Hàng đợi để phân bổ người khác"]
    Reclaim --> AssignedLead
    AutoReclaim -- "Chưa quá 2h" --> Remind["Nhắc nhở khẩn cấp qua Notification"]
    Remind --> WaitCall
    
    WaitCall -- "Đã gọi điện" --> StopSLA["Dừng đồng hồ SLA<br/>Ghi nhận thời gian phản hồi thực tế (Response Time)"]
    StopSLA --> LogOutcome["Mở Drawer 'Nhật ký Tư vấn':<br/>Nhập kết quả cuộc gọi & Nội dung trao đổi"]
    
    LogOutcome --> OutcomeCheck{"Kết quả cuộc gọi?"}
    
    OutcomeCheck -- "Không nghe máy / Bận" --> ScheduleFollowup["Đặt lịch gọi lại (Follow-up Date)<br/>Trạng thái: Contacted<br/>Tự động nhắc lịch vào ngày hẹn"]
    
    OutcomeCheck -- "Sai số / Không đủ điều kiện" --> MarkDisqualified["Chuyển trạng thái: Disqualified<br/>Bắt buộc nhập lý do (Wrong Number, Blacklist...)"]
    
    OutcomeCheck -- "Có nhu cầu nhưng chưa chốt" --> NeedsAssessment["Thực hiện Khảo sát Nhu cầu Chi tiết:<br/>Chọn Trường, Ngành, Ngân sách<br/>Trạng thái: Qualified"]
    
    OutcomeCheck -- "Đồng ý lộ trình & Xin báo giá" --> ConvertToOpp["ĐỦ ĐIỀU KIỆN CHỐT ĐƠN:<br/>Khởi tạo Cơ hội Kinh doanh (Opportunity)<br/>Trạng thái Lead: Converted"]
```

---

## 4. QUY TRÌNH PHỄU CƠ HỘI KINH DOANH (SALES PIPELINE PROGRESSION)

Quản trị toàn bộ các bước từ lúc có cơ hội bán hàng đến khi thương lượng và đóng hợp đồng.

```mermaid
flowchart TD
    NewOpp(["Khởi tạo Opportunity từ Lead Converted"]) --> Stage1["Giai đoạn 1: Discovery (Tìm hiểu)<br/>Xác nhận nguyện vọng trường & năng lực học viên"]
    
    Stage1 --> Stage2["Giai đoạn 2: Value Proposition (Đề xuất)<br/>Gửi thông tin trường đối tác, lộ trình học tiếng"]
    
    Stage2 --> Stage3["Giai đoạn 3: Proposal Sent (Gửi Báo giá)<br/>Chọn Gói Sản phẩm từ Catalog (BUS-02)<br/>Gửi file Báo giá PDF chuẩn"]
    
    Stage3 --> CustomerFeedback{"Phản hồi của Khách hàng?"}
    
    CustomerFeedback -- "Yêu cầu giảm giá / Thêm ưu đãi" --> Stage4["Giai đoạn 4: Negotiation (Thương lượng)<br/>Áp dụng Voucher hoặc gửi luồng Duyệt Giảm giá"]
    Stage4 --> CustomerFeedback
    
    CustomerFeedback -- "Từ chối / Chọn đối thủ" --> ClosedLost["KẾT THÚC THẤT BẠI (Closed Lost)<br/>• Bắt buộc chọn Lý do thất bại (Lost Reason)<br/>• Nhập chi tiết phản hồi của khách<br/>• Lưu vết để tái tiếp cận kỳ sau"]
    
    CustomerFeedback -- "Đồng ý ký hợp đồng" --> ClosedWon["KẾT THÚC THÀNH CÔNG (Closed Won)<br/>• Chuyển sang Quy trình Ký Hợp đồng & Bàn giao Dịch vụ (BUS-02)"]
```

---

## 5. QUY TRÌNH CHUYỂN GIAO CRM $\rightarrow$ HỢP ĐỒNG & PARTY 360 (CRM-TO-COMMERCIAL HANDOFF)

Khâu then chốt kết nối hai phân hệ BUS-01 và BUS-02, bảo đảm tính nhất quán dữ liệu và loại bỏ hoàn toàn việc nhập lại dữ liệu thủ công.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Tư vấn viên Tuyển sinh
    participant CRM as BUS-01 (Crm_Opportunities)
    participant P360 as Party 360 Foundation (Party_Parties)
    participant COM as BUS-02 (Com_Contracts)
    participant WF as Workflow Engine (FND-03)
    participant OUT as Transactional Outbox (ADR-006)

    Staff->>CRM: Bấm nút "Chuyển thành Hợp đồng" trên Opportunity (Closed Won)
    CRM->>P360: Kiểm tra định danh Học viên (CCCD / Số điện thoại)
    alt Học viên chưa có trong Party 360
        P360-->>P360: Tạo Party mới (Type: Person) & PartyRole: Student
        P360-->>P360: Tạo Party Phụ huynh (nếu có) & PartyRelationship: Parent-Child
    else Học viên đã tồn tại
        P360-->>P360: Tái sử dụng PartyId & Bổ sung Role 'Student' nếu chưa có
    end
    CRM->>COM: Khởi tạo Draft Contract (Sao chép Báo giá, Sản phẩm, Pháp nhân ký)
    COM->>WF: Khởi tạo Workflow Instance cho Hợp đồng mới (Initial State: Draft)
    COM->>OUT: Ghi nhận Domain Event 'OpportunityConvertedToContractEvent'
    OUT-->>Staff: Trả về ContractId và chuyển hướng giao diện sang Màn hình Soạn thảo Hợp đồng
```

