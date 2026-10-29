# BẢN ĐỒ QUY TRÌNH WORKFLOW & SỰ KIỆN MIỀN OUTBOX (WORKFLOW & EVENT MAPPING)
Mã tài liệu: `BUS-DOC-04-04` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tích hợp: **FND-03 Workflow Engine (Migration 0013, ADR-010, ADR-011, ADR-012)**

---

## 1. DANH MỤC CÁC QUY TRÌNH WORKFLOW CHÍNH THỨC (WORKFLOW DEFINITIONS)

Các phân hệ CRM và Commercial sử dụng chung bảng `Wf_Definitions` và `Wf_DefinitionVersions` của nền tảng FND-03:

| Mã Quy Trình (`Code`) | Tên Quy Trình Phê Duyệt | Thực Thể Áp Dụng (`EntityType`) | Số Bước Duyệt | Thẩm Quyền Phê Duyệt |
|---|---|---|:---:|---|
| `WF_QUOTATION_DISCOUNT` | Phê duyệt Chiết khấu / Học bổng Báo giá | `Com_Quotations` | 1 - 2 Cấp | Trưởng phòng Tuyển sinh / Giám đốc Chi nhánh / Tổng Giám đốc |
| `WF_CONTRACT_APPROVAL` | Thẩm tra & Ký duyệt Hợp đồng Du học | `Com_Contracts` | 2 Cấp | Cán bộ Pháp chế thẩm tra $\rightarrow$ Giám đốc Pháp nhân ký |
| `WF_CONTRACT_REFUND` | Phê duyệt Thanh lý & Hoàn phí Hợp đồng | `Com_Contracts` | 3 Cấp | Chuyên viên Hồ sơ $\rightarrow$ Kế toán trưởng $\rightarrow$ Giám đốc Pháp nhân |
| `WF_LEAD_REASSIGNMENT` | Phê duyệt Chuyển giao / Thu hồi Lead | `Crm_Leads` | 1 Cấp | Trưởng phòng Tuyển sinh Chi nhánh |

---

## 2. CẤU HÌNH SCHEMA JSON MẪU CHO QUY TRÌNH PHÊ DUYỆT BÁO GIÁ

Trích đoạn `DefinitionJson` lưu trong `Wf_DefinitionVersions`:

```json
{
  "workflowCode": "WF_QUOTATION_DISCOUNT",
  "version": 1,
  "initialState": "Draft",
  "states": [
    { "name": "Draft", "isFinal": false },
    { "name": "PendingManagerApproval", "isFinal": false },
    { "name": "PendingDirectorApproval", "isFinal": false },
    { "name": "Approved", "isFinal": true },
    { "name": "Rejected", "isFinal": true }
  ],
  "transitions": [
    {
      "action": "SUBMIT_FOR_APPROVAL",
      "fromState": "Draft",
      "toState": "PendingManagerApproval",
      "requiredPermission": "commercial.quotation.create",
      "conditionExpression": "discountAmount > 1000000 && discountAmount <= 3000000"
    },
    {
      "action": "SUBMIT_FOR_DIRECTOR_APPROVAL",
      "fromState": "Draft",
      "toState": "PendingDirectorApproval",
      "requiredPermission": "commercial.quotation.create",
      "conditionExpression": "discountAmount > 3000000"
    },
    {
      "action": "MANAGER_APPROVE",
      "fromState": "PendingManagerApproval",
      "toState": "Approved",
      "requiredPermission": "commercial.quotation.approve",
      "scopeRequired": "Branch"
    },
    {
      "action": "DIRECTOR_APPROVE",
      "fromState": "PendingDirectorApproval",
      "toState": "Approved",
      "requiredPermission": "commercial.quotation.approve",
      "scopeRequired": "LegalEntity"
    },
    {
      "action": "REJECT",
      "fromState": "PendingManagerApproval",
      "toState": "Rejected",
      "requiredPermission": "commercial.quotation.approve"
    }
  ]
}
```

---

## 3. DANH MỤC SỰ KIỆN MIỀN OUTBOX (DOMAIN EVENTS CATALOG)

Tất cả các sự kiện phát sinh từ thực thể nghiệp vụ đều được lưu vào bảng `System_OutboxMessages` trong cùng Database Transaction:

| STT | Event Type | Phân Hệ Phát Sinh | Payload Chính | Phân Hệ Tiêu Thụ (Consumers) |
|---|---|---|---|---|
| 1 | `Crm.LeadIngestedEvent` | BUS-01 (CRM) | `LeadId`, `PhoneNumber`, `TargetProgram`, `SourceId` | Lead Routing Service, Notification |
| 2 | `Crm.LeadAssignedEvent` | BUS-01 (CRM) | `LeadId`, `AssignedToUserId`, `SlaDeadlineUtc` | Notification, SLA Monitoring Worker |
| 3 | `Crm.LeadSlaBreachedEvent` | BUS-01 (CRM) | `LeadId`, `AssignedToUserId`, `MinutesOverdue` | Manager Notification, Auto-Reclaim Worker |
| 4 | `Crm.OpportunityWonEvent` | BUS-01 (CRM) | `OpportunityId`, `PartyId`, `QuotationId` | Commercial Handoff Handler |
| 5 | `Commercial.QuotationApprovedEvent` | BUS-02 (Commercial) | `QuotationId`, `ApprovedByUserId`, `GrandTotal` | CRM Opportunity Progress Handler |
| 6 | `Commercial.ContractSignedEvent` | BUS-02 (Commercial) | `ContractId`, `ContractCode`, `StudentPartyId` | Finance Billing Inception Handler |
| 7 | `Commercial.ContractActivatedEvent`| BUS-02 (Commercial) | `ContractId`, `ContractCode`, `StudentPartyId` | Education, Admission & Visa Handover |
| 8 | `Commercial.ObligationHandedOverEvent`| BUS-02 (Commercial)| `ObligationId`, `TargetDomain`, `PartyId` | Education / Admission / Placement Services |
| 9 | `Finance.PaymentConfirmedEvent` | Domain 11 (Finance)| `PaymentReceiptId`, `ContractCode`, `Amount` | Commercial Payment Schedule Handler |

---

## 4. BẢO ĐẢM TÍNH BẤT BIẾN & XỬ LÝ SỰ KIỆN CHỐNG TRÙNG LẶP (IDEMPOTENCY)

Theo quy định tại **ADR-011** và **ADR-012**:
1. **Lịch sử Luân chuyển Bất biến:** Mọi bước chuyển trạng thái thành công đều sinh một bản ghi `Wf_History` append-only; tuyệt đối không cung cấp API cập nhật hay xóa bản ghi lịch sử này.
2. **Khóa Chống Trùng lặp (Idempotency Key):**
   - Mọi thông điệp Outbox khi được Dispatcher gửi đi đều đính kèm `MessageId` (UUID).
   - Phân hệ Consumer bắt buộc kiểm tra `IIdempotencyStore` trước khi thực thi xử lý (VD: `crm:event:lead_ingest:{MessageId}`). Nếu đã tồn tại key trong vòng 24 giờ, Consumer bỏ qua ngay lập tức, bảo đảm tính nhất quán (Exactly-once semantic effect).
3. **Lưu Vết Lịch Sử Thử Lại:** Bảng `System_OutboxProcessingHistory` ghi nhận toàn bộ số lần thử lại (AttemptNumber 1 đến 5), thời gian thực thi (DurationMs) và nội dung lỗi (nếu có) phục vụ giám sát vận hành hệ thống.

