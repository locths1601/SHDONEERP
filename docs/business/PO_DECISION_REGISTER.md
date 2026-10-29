# SỔ ĐĂNG KÝ QUYẾT ĐỊNH PRODUCT OWNER (PO DECISION REGISTER)
Mã tài liệu: `BUS-DOC-05-05` | Phiên bản: `2.0.0` (Comprehensive Master) | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Người phê duyệt: **Product Owner & Ban Lãnh đạo Tập đoàn SHD Corp**

---

> [!IMPORTANT]
> Tài liệu này là bản sao chính thức của Sổ Đăng Ký Quyết Định Product Owner được đặt tại thư mục gốc `docs/business/` phục vụ tra cứu nhanh. Bản gốc điều hành dự án được duy trì đồng bộ tại [05_DELIVERY/PO_DECISION_REGISTER.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/05_DELIVERY/PO_DECISION_REGISTER.md).

## 1. BẢNG TỔNG HỢP CÁC CHÍNH SÁCH BẮT BUỘC PO PHÊ DUYỆT

| Mã Quyết Định | Hạng Mục Nghiệp Vụ Cần Quyết Định | Trạng Thái Bằng Chứng | Đề Xuất Khuyến Nghị Của Kỹ Thuật | Tác Động Tiến Độ | Trạng Thái Phê Duyệt |
|:---:|---|:---:|---|:---:|:---:|
| **DEC-01** | **Cửa sổ Kiểm soát Trùng lặp Lead** | `PROPOSED` | Áp dụng cửa sổ **60 ngày** theo số điện thoại chuẩn E.164. Trùng trong 60 ngày thì giữ nhân viên cũ; quá 60 ngày coi như Lead mới. | Sprint 2 (Core CRM) | `Chờ PO Ký Duyệt` |
| **DEC-01B** | **Xử lý Lead Lost trong Cửa sổ 60 Ngày** | `PO_DECISION_REQUIRED` | **Phương án A:** Reopen Lead cũ sang `Recycled` và phân bổ lại.<br/>**Phương án B (Khuyến nghị kỹ thuật):** Tạo bản ghi `Crm_Leads` mới chu kỳ mới (`IsRecycled = true`, `OriginalLeadId = OldLeadId`) để bảo toàn dữ liệu lịch sử và tỷ lệ chuyển đổi. | Sprint 2 (Ingestion & Dedup) | `PO_DECISION_REQUIRED` |
| **DEC-02** | **Thời hạn Cam kết Phản hồi Lead Hot (SLA)** | `PROPOSED` | Cam kết **15 phút** cho Lead Hot; tự động cảnh báo Trưởng phòng và thu hồi Lead sau 120 phút không xử lý. | Sprint 2 (Routing) | `Chờ PO Ký Duyệt` |
| **DEC-03** | **Phân cấp Hạn mức Duyệt Giảm giá Báo giá** | `PROPOSED` | Tư vấn viên: $\le 1$ tr; Trưởng phòng: $\le 3$ tr; Giám đốc CN: $\le 5$ tr; Tổng Giám đốc: $> 5$ tr qua FND-03 Workflow. | Sprint 4 (Quotation) | `Chờ PO Ký Duyệt` |
| **DEC-04** | **Danh mục Pháp nhân & MST Chính thức** | `TBD` | PO cung cấp danh sách tên pháp nhân, MST, con dấu và người đại diện theo pháp luật của các đơn vị nòng cốt. | Sprint 1 (Seed Data) | `TBD — Khẩn cấp` |
| **DEC-05** | **Tách biệt Đơn vị Bán hàng & Pháp nhân Ký Hợp đồng**| `PROPOSED` | Bắt buộc lưu trữ cả `ContractingLegalEntityId` và `SellingBusinessUnitId` trên thực thể Hợp đồng. | Sprint 5 (Contract) | `Chờ PO Ký Duyệt` |
| **DEC-06** | **Chính sách Thu Cọc Kích hoạt Dịch vụ** | `PROPOSED` | Hợp đồng chỉ chuyển sang `Active` khi Kế toán ghi nhận thanh toán Đợt 1 (tối thiểu 20 - 30 triệu đồng). | Sprint 5 (Contract) | `Chờ PO Ký Duyệt` |
| **DEC-07** | **Chính sách Hoàn phí khi Trượt Visa** | `PROPOSED` | Hoàn 100% học phí trường nước ngoài đã nộp; khấu trừ chi phí dịch thuật, công chứng và đào tạo tiếng thực tế đã phát sinh. | Sprint 5 (Settlement) | `Chờ PO Ký Duyệt` |
| **DEC-08** | **Cơ chế Ký Hợp đồng Khách hàng ở Xa** | `PROPOSED` | MVP Phase 1 áp dụng ký tươi scan upload PDF kèm SHA256; hoãn tích hợp cổng ký số SMS OTP sang Phase 2. | Sprint 5 (Contract) | `Chờ PO Ký Duyệt` |
| **DEC-09** | **Chính sách Bóc tách Thuế GTGT (VAT Treatment)**| `PROPOSED` | Đào tạo ngoại ngữ: Không chịu thuế VAT; Dịch vụ tư vấn hồ sơ: Thuế VAT 10%; Khoản thu hộ trường: Không VAT. | Sprint 4 (Pricing Engine)| `Chờ PO Ký Duyệt` |
| **DEC-10** | **Quy chế Hạch toán Doanh thu Liên Công Ty** | `TBD` | MVP ghi nhận doanh thu tại Pháp nhân ký; hoãn cơ chế xuất hóa đơn nội bộ đối ứng sang Phase 2. | Sprint 5 (Finance Link) | `TBD — Chờ Kế toán`|
| **DEC-11** | **Khóa Định danh Học viên Dưới 14 Tuổi** | `PROPOSED` | Chấp nhận Giấy khai sinh / Hộ chiếu đính kèm CCCD của Người giám hộ trong `Party_PartyIdentifications`. | Sprint 5 (Party 360) | `Chờ PO Ký Duyệt` |
| **DEC-12** | **Phê duyệt Phạm vi Triển khai MVP Phase 1** | `PROPOSED` | Chốt phạm vi 8 Epics nòng cốt từ Marketing $\rightarrow$ Hợp đồng $\rightarrow$ Kích hoạt Đào tạo & Hồ sơ; dời VoIP sang Phase 2. | Toàn dự án | `Chờ PO Ký Duyệt` |
| **DEC-13** | **Thời điểm Xác nhận Opportunity ClosedWon** | `PO_DECISION_REQUIRED` | **Phương án 1:** Chuyển `ClosedWon` ngay khi tạo Hợp đồng nháp (Draft).<br/>**Phương án 2 (Khuyến nghị kỹ thuật):** Chuyển `ClosedWon` khi hai bên ký Hợp đồng (Signed).<br/>**Phương án 3:** Chuyển `ClosedWon` khi Hợp đồng Kích hoạt (Active) sau khi đóng cọc. | Sprint 3 & Sprint 5 | `PO_DECISION_REQUIRED` |

---

## 2. BIÊN BẢN PHÊ DUYỆT CỦA PRODUCT OWNER

```
DỰ ÁN: NỀN TẢNG ERP TẬP ĐOÀN SHD CORP (SHD ONEERP)
GIAI ĐOẠN: PHÂN TÍCH NGHIỆP VỤ & THIẾT KẾ CHỨC NĂNG (BUS-01 & BUS-02)

[  ] PHÊ DUYỆT CHÍNH THỨC TOÀN BỘ 14 QUYẾT ĐỊNH
[  ] PHÊ DUYỆT KÈM ĐIỀU CHỈNH
[  ] YÊU CẦU BẢO VỆ LẠI

Họ và tên Product Owner: ..........................................................................
Chức vụ: ..........................................................................................
Ngày phê chuẩn: ...... / ...... / 2026
Chữ ký:
```

