# HỢP ĐỒNG TÍCH HỢP DỮ LIỆU LIÊN PHÂN HỆ (BUSINESS INTEGRATION CONTRACTS)
Mã tài liệu: `BUS-DOC-04-06` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tiêu chuẩn kỹ thuật: **JSON Schema & C# Strong-typed DTO Contracts**

---

## 1. HỢP ĐỒNG DỮ LIỆU: CHUYỂN GIAO CRM $\rightarrow$ HỢP ĐỒNG THƯƠNG MẠI

### Payload Request: `CrmToCommercialHandoffRequest`
Được gửi khi tư vấn viên bấm *"Chuyển thành Hợp đồng Dịch vụ"* trên màn hình Opportunity Won:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CrmToCommercialHandoffRequest",
  "type": "object",
  "required": [
    "opportunityId",
    "contractingLegalEntityId",
    "sellingBusinessUnitId",
    "sellingBranchId",
    "studentProfile"
  ],
  "properties": {
    "opportunityId": { "type": "string", "format": "uuid" },
    "quotationId": { "type": ["string", "null"], "format": "uuid" },
    "contractingLegalEntityId": { "type": "string", "format": "uuid" },
    "sellingBusinessUnitId": { "type": "string", "format": "uuid" },
    "sellingBranchId": { "type": "string", "format": "uuid" },
    "targetProgram": { "type": "string", "enum": ["Korea_D4", "Korea_D2", "Germany_Vocational", "Japan_Vocational"] },
    "targetIntake": { "type": "string", "example": "2026-Q3" },
    "studentProfile": {
      "type": "object",
      "required": ["fullName", "phoneNumber", "dateOfBirth", "gender", "idNumber", "permanentAddress"],
      "properties": {
        "existingPartyId": { "type": ["string", "null"], "format": "uuid" },
        "fullName": { "type": "string", "minLength": 3, "maxLength": 150 },
        "phoneNumber": { "type": "string", "pattern": "^\\+?[0-9]{10,12}$" },
        "email": { "type": ["string", "null"], "format": "email" },
        "dateOfBirth": { "type": "string", "format": "date" },
        "gender": { "type": "string", "enum": ["Male", "Female", "Other"] },
        "idType": { "type": "string", "enum": ["CCCD", "Passport"], "default": "CCCD" },
        "idNumber": { "type": "string", "minLength": 9, "maxLength": 20 },
        "idIssueDate": { "type": "string", "format": "date" },
        "idIssuePlace": { "type": "string" },
        "permanentAddress": { "type": "string", "maxLength": 300 }
      }
    },
    "guarantorProfile": {
      "type": ["object", "null"],
      "properties": {
        "fullName": { "type": "string" },
        "relationshipType": { "type": "string", "enum": ["Father", "Mother", "Guardian"] },
        "phoneNumber": { "type": "string" },
        "idNumber": { "type": "string" }
      }
    }
  }
}
```

---

## 2. HỢP ĐỒNG SỰ KIỆN: HỢP ĐỒNG ĐÃ ĐƯỢC KÍCH HOẠT VẬN HÀNH

### Event Payload: `ContractActivatedDomainEventPayload`
Được phát sinh qua Transactional Outbox khi Kế toán xác nhận Phiếu thu tiền Đợt 1 thành công:

```json
{
  "eventId": "e9b4c1a2-3f8d-4e5a-9c12-3456789abcde",
  "eventType": "Commercial.ContractActivatedDomainEvent",
  "occurredOnUtc": "2026-10-28T14:45:00Z",
  "correlationId": "corr-20261028-0099",
  "payload": {
    "contractId": "c1a2b3c4-d5e6-4f7a-8b9c-0123456789ab",
    "contractCode": "HD-202610/SHD-KR/0089",
    "contractType": "StudyAbroad_KR",
    "studentPartyId": "p1a2b3c4-0000-0000-0000-000000000001",
    "studentFullName": "Nguyễn Văn An",
    "contractingLegalEntityId": "LE100000-0000-0000-0000-000000000002",
    "sellingBusinessUnitId": "BU100000-0000-0000-0000-000000000001",
    "initialPaymentAmount": 30000000.0,
    "totalContractValue": 185000000.0,
    "requiredObligations": [
      {
        "obligationId": "ob-001",
        "type": "LanguageTraining",
        "targetDomain": "Education",
        "targetCourseLevel": "Topik_2",
        "fulfillingBranchId": "BR100000-0000-0000-0000-000000000001"
      },
      {
        "obligationId": "ob-002",
        "type": "VisaDossier",
        "targetDomain": "AdmissionVisa",
        "targetIntake": "2026-Q3",
        "targetCountry": "Korea"
      }
    ]
  }
}
```

---

## 3. HỢP ĐỒNG SỰ KIỆN: ĐỐI SOÁT THU TIỀN VỚI PHÂN HỆ TÀI CHÍNH

### Event Payload: `FinanceBillingSyncPayload`
Giao tiếp hai chiều giữa Commercial và Finance:

```json
{
  "contractId": "c1a2b3c4-d5e6-4f7a-8b9c-0123456789ab",
  "contractCode": "HD-202610/SHD-KR/0089",
  "paymentMilestoneIndex": 1,
  "transactionReference": "BANK_VCB_20261028_987654",
  "amountPaid": 30000000.0,
  "paidAtUtc": "2026-10-28T14:40:00Z",
  "confirmedByUserId": "u-accountant-001",
  "paymentStatus": "FullyPaid",
  "remainingBalance": 155000000.0
}
```

