# SỔ ĐĂNG KÝ QUYẾT ĐỊNH PRODUCT OWNER (PO DECISION REGISTER)
Mã tài liệu: `BUS-DOC-05-05` | Phiên bản: `2.0.0` (Comprehensive Master) | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Người phê duyệt: **Product Owner & Ban Lãnh đạo Tập đoàn SHD Corp**

---

## 1. MỤC ĐÍCH & QUY TRÌNH QUẢN TRỊ QUYẾT ĐỊNH

Tài liệu này tập hợp toàn bộ các chính sách nghiệp vụ, giá bán, thuế, hoàn phí, cơ cấu pháp lý và cam kết SLA đang ở trạng thái `PROPOSED` hoặc `TBD` cần sự phê chuẩn chính thức bằng văn bản của **Product Owner (PO)** và Hội đồng Quản trị SHD Corp.

Mỗi quyết định được phân tích toàn diện theo 4 góc nhìn:
1. **Hiện trạng / Căn cứ thực tế:** Đã có trong mã nguồn hay chưa.
2. **Các phương án đánh giá (Options Evaluated):** Phân tích ưu nhược điểm của từng kịch bản.
3. **Khuyến nghị của Solution Architect & Enterprise BA (Recommended Option):** Phương án tối ưu nhất về bảo mật, trải nghiệm người dùng và kiến trúc hệ thống.
4. **Tác động tiến độ:** Mức độ khẩn cấp đối với các Sprint phát triển.

---

## 2. BẢNG TỔNG HỢP CÁC CHÍNH SÁCH BẮT BUỘC PO PHÊ DUYỆT

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

## 3. CHI TIẾT CÁC CHÍNH SÁCH CẦN PHÊ DUYỆT

### DEC-01: Cửa Sổ Kiểm Tra Trùng Lặp Lead (Deduplication Window)
- **Phương án A (Khuyến nghị): Cửa sổ 60 ngày.** Nếu khách hàng đăng ký lại trong vòng 60 ngày, ghi nhận thêm 1 tương tác mới và giữ nguyên tư vấn viên cũ. Sau 60 ngày hoặc khi Lead cũ đã đóng Lost, cho phép mở chu kỳ Lead mới.
  - *Ưu điểm:* Cân bằng giữa quyền lợi hoa hồng của tư vấn viên và việc tái kích hoạt khách hàng nguội.
- **Phương án B: Cửa sổ 30 ngày.** Rút ngắn thời gian bảo vệ khách hàng.
  - *Nhược điểm:* Tư vấn viên phản ứng vì khách hàng du học thường cần từ 2 - 3 tháng cân nhắc tài chính.
- **Phương án C: Cửa sổ 180 ngày.** Giữ vĩnh viễn quyền chăm sóc của tư vấn viên đầu tiên.
  - *Nhược điểm:* Dẫn đến tình trạng "găm khách" nhưng không chăm sóc tích cực, lãng phí chi phí marketing.

### DEC-02: Thời Hạn Cam Kết Phản Hồi Lead Hot (First-Contact SLA)
- **Phương án A (Khuyến nghị): Cam kết 15 phút trong giờ hành chính.** Áp dụng cho Lead Hot (GPA $\ge 6.5$, tài chính sẵn sàng, nhu cầu kỳ bay gần). Quá 120 phút không có log cuộc gọi sẽ tự động thu hồi Lead.
  - *Ưu điểm:* Tận dụng tối đa thời gian vàng khi khách hàng vừa điền form; tăng 50% tỷ lệ kết nối thành công.
- **Phương án B: Cam kết 60 phút.** Giảm áp lực cho tư vấn viên.
  - *Nhược điểm:* Khách hàng có xu hướng điền form của nhiều trung tâm du học cùng lúc; ai gọi trước sẽ chốt được lịch hẹn.

### DEC-03: Phân Cấp Hạn Mức Duyệt Giảm Giá / Học Bổng Báo Giá
- **Khung phân quyền khuyến nghị:**
  1. *Tư vấn viên:* $\le 1.000.000$ VNĐ (chỉ áp dụng mã voucher khuyến mại do Marketing phát hành).
  2. *Trưởng phòng Tuyển sinh Chi nhánh:* $\le 3.000.000$ VNĐ.
  3. *Giám đốc Chi nhánh:* $\le 5.000.000$ VNĐ.
  4. *Giám đốc Khối BU / Tổng Giám đốc Tập đoàn:* $> 5.000.000$ VNĐ.
  5. *Trần chiết khấu tối đa:* Không vượt quá **15% tổng giá trị hợp đồng**.

### DEC-04: Danh Mục Pháp Nhân & Mã Số Thuế Chính Thức (`TBD-01`)
- **Yêu cầu khẩn cấp:** PO cung cấp danh sách tên pháp nhân, địa chỉ trụ sở, mã số thuế và tài khoản ngân hàng chính thức của:
  1. Pháp nhân đào tạo ngoại ngữ tại Việt Nam.
  2. Pháp nhân tư vấn du học và xử lý visa (có giấy phép của Sở GD&ĐT).
  3. Pháp nhân/văn phòng bảo trợ hải ngoại tại Hàn Quốc (SHD Korea).

### DEC-07: Chính Sách Hoàn Phí khi Trượt Visa hoặc Hủy Hợp Đồng
- **Khung chính sách khuyến nghị:**
  - *Trượt Visa:* Hoàn trả 100% học phí trường nước ngoài đã chuyển; khấu trừ chi phí dịch thuật công chứng thực chi (có hóa đơn) và học phí tiếng tại Việt Nam đã học theo đơn giá niêm yết.
  - *Rút hồ sơ đơn phương trước khi nộp trường:* Khấu trừ 30% phí dịch vụ mở hồ sơ.
  - *Rút hồ sơ sau khi đã có Thư mời trường (CoA):* Khấu trừ 50% phí dịch vụ.
  - *Thời hạn thanh toán hoàn phí:* Từ 15 đến 30 ngày làm việc kể từ ngày hoàn tất Biên bản thanh lý hợp đồng.

### DEC-09: Bóc Tách Thuế Giá Trị Gia Tăng (VAT Treatment)
- **Quy chuẩn tài chính đề xuất:**
  - Khoản mục Đào tạo ngoại ngữ: **Không chịu thuế GTGT** (theo Luật Thuế GTGT cho lĩnh vực giáo dục).
  - Khoản mục Dịch vụ tư vấn hồ sơ du học & di trú: Áp dụng thuế suất **Thuế GTGT 10%**.
  - Khoản thu hộ nộp thẳng cho trường nước ngoài / Đại sứ quán: **Không tính thuế GTGT** (Ghi nhận khoản chi hộ).

---

## 4. BIÊN BẢN PHÊ DUYỆT CỦA PRODUCT OWNER

```
DỰ ÁN: NỀN TẢNG ERP TẬP ĐOÀN SHD CORP (SHD ONEERP)
GIAI ĐOẠN: PHÂN TÍCH NGHIỆP VỤ & THIẾT KẾ CHỨC NĂNG (BUS-01 & BUS-02)

Căn cứ vào kết quả thẩm định đối chiếu chéo tại Sổ đăng ký quyết định PO (BUS-DOC-05-05),
tôi đại diện Ban Quản trị Sản phẩm & Hội đồng Điều hành SHD Corp:

[  ] PHÊ DUYỆT CHÍNH THỨC TOÀN BỘ 14 QUYẾT ĐỊNH
[  ] PHÊ DUYỆT KÈM ĐIỀU CHỈNH CÁC HẠNG MỤC SAU:
     ...............................................................................................
     ...............................................................................................
[  ] YÊU CẦU BẢO VỆ LẠI TRƯỚC HỘI ĐỒNG QUẢN TRỊ

Họ và tên Product Owner: ..........................................................................
Chức danh: ........................................................................................
Ngày phê chuẩn: ...... / ...... / 2026
Chữ ký:
```
