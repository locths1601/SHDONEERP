# TẬP HỢP GIẢ ĐỊNH & QUYẾT ĐỊNH NGHIỆP VỤ (ASSUMPTIONS & BUSINESS DECISIONS)
Mã tài liệu: `BUS-DOC-01-05` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Phân loại: Tài liệu Kiểm soát Rủi ro & Kiến trúc Hệ thống

---

## 1. NGUYÊN TẮC QUẢN TRỊ GIẢ ĐỊNH & PHÂN LOẠI TRẠNG THÁI

Trong giai đoạn phân tích nghiệp vụ hệ thống SHD OneERP, mọi nhận định, cấu trúc dữ liệu và quy trình đều phải được gắn nhãn trạng thái minh bạch:
- **`VERIFIED` (Đã xác minh):** Đã kiểm chứng trực tiếp từ mã nguồn, bảng cơ sở dữ liệu, Stored Procedures hoặc tài liệu Foundation đã nghiệm thu.
- **`PROPOSED` (Đề xuất kỹ thuật/nghiệp vụ):** Do Senior Solution Architect & Enterprise BA đề xuất dựa trên thông lệ tốt nhất của ngành giáo dục quốc tế và ERP doanh nghiệp. Có thể dùng để thiết kế kiến trúc và chuẩn bị code mẫu nhưng cần PO chính thức phê duyệt trước khi Go-Live.
- **`TBD` (To Be Determined - Chưa xác định):** Hoàn toàn chưa có thông tin hoặc còn nhiều phương án mâu thuẫn cần PO và Ban Lãnh đạo ra quyết định.
- **`PO_APPROVED` (Đã được PO phê duyệt):** Đã có văn bản, biên bản cuộc họp hoặc chỉ đạo trực tiếp từ Product Owner chấp thuận áp dụng chính thức.

---

## 2. BẢNG THEO DÕI GIẢ ĐỊNH & QUYẾT ĐỊNH NGHIỆP VỤ (ASSUMPTION REGISTER)

| Mã | Hạng Mục / Nội Dung Nghiệp Vụ | Nguồn Căn Cứ & Hiện Trạng | Đánh Giá Tác Động Hệ Thống | Trạng Thái |
|---|---|---|---|:---:|
| **ASN-01** | **Tái sử dụng Nền tảng Đa pháp nhân & GBAC v4.2** | Bảng `Org_LegalEntities`, `Org_BusinessUnits`, `Identity_UserGroups`, Migration 0003, 0007, 0009. | CRM và Contract phải kế thừa 100% cơ chế Scope: `Global`, `LegalEntity`, `BusinessUnit`, `Branch`, `Self`. Không tạo bảng phân quyền riêng. | `VERIFIED` |
| **ASN-02** | **Định danh Khách hàng qua Party 360** | Bảng `Party_Parties`, `Party_Persons`, `Party_PartyRoles`, Migration 0004, 0008. | Khi Lead chuyển đổi thành Opportunity/Contract, phải tạo hoặc liên kết `PartyId`. Học viên là Party có Role `Student`, phụ huynh có Role `Parent`. | `VERIFIED` |
| **ASN-03** | **Tái sử dụng Generic Workflow Engine (FND-03)** | Bảng `Wf_Definitions`, `Wf_Instances`, `Wf_History`, Migration 0013, Doc 20. | Mọi luồng phê duyệt Báo giá, duyệt Giảm giá, duyệt Hợp đồng và duyệt Hoàn phí đều dùng bảng `Wf_*` thông qua `IWorkflowEngine`. Không tạo bảng duyệt song song. | `VERIFIED` |
| **ASN-04** | **Phát tán Sự kiện qua Transactional Outbox (ADR-006)** | Bảng `System_OutboxMessages`, `AuditSaveChangesInterceptor`. | Khi Hợp đồng ký kết hoặc Lead chuyển trạng thái, tạo Domain Event đẩy vào Outbox trong cùng Transaction để các phân hệ khác lắng nghe bất đồng bộ. | `VERIFIED` |
| **ASN-05** | **Đăng ký Tính năng qua Module Registry (FND-04)** | Bảng `System_Modules`, `System_Features`, `System_FeatureActionPermissions`, Migration 0012. | Các chức năng mới của CRM (`CRM`) và Commercial (`COMMERCIAL`) phải được đăng ký vào Registry với mã chuẩn `crm.*` và `commercial.*`. | `VERIFIED` |
| **ASN-06** | **Tách biệt Đơn vị Bán hàng và Pháp nhân Ký Hợp đồng** | Mô hình kinh doanh thực tế của SHD Corp (Học viên tư vấn tại Chi nhánh nhưng ký hợp đồng với Công ty Giáo dục có giấy phép). | Entity `Contract` bắt buộc có cả 2 trường: `ContractingLegalEntityId` (Pháp nhân ký) và `SellingBusinessUnitId` (Đơn vị bán hàng tính KPI). | `PROPOSED` |
| **ASN-07** | **Mô hình Gói Sản phẩm Du học Đa Cấu phần (Composite Package)** | Khảo sát quy trình báo giá du học trọn gói. | Một Product có thể là sản phẩm độc lập (Single Service) hoặc gói trọn gói gồm nhiều Service con (Package Components). | `PROPOSED` |
| **ASN-08** | **Cơ chế Phát hiện Trùng lặp Lead (Duplicate Detection Window)** | Tránh tranh chấp hoa hồng giữa các tư vấn viên và nguồn tiếp thị. | Cửa sổ kiểm tra trùng theo Số điện thoại là **60 ngày** kể từ tương tác gần nhất. Ngoài 60 ngày coi như Lead mới. | `PROPOSED` |
| **ASN-09** | **Phân cấp Thẩm quyền Duyệt Giảm giá Báo giá** | Kiểm soát biên lợi nhuận và hạn mức chiết khấu. | Phân cấp 4 tầng: Tư vấn viên ($\le 1$ tr), Trưởng phòng ($\le 3$ tr), Giám đốc Chi nhánh ($\le 5$ tr), Ban Tổng Giám đốc ($> 5$ tr). | `PROPOSED` |
| **ASN-10** | **Quy trình Nghiệm thu Hoàn tất Hợp đồng (Contract Settlement)** | Hợp đồng du học không kết thúc ngay khi nộp tiền mà kéo dài tới khi ổn định học tập ở nước ngoài. | Trạng thái Hợp đồng chuyển sang `Completed` sau khi kết thúc 30 ngày hỗ trợ sau xuất cảnh tại nước sở tại. | `PROPOSED` |
| **ASN-11** | **Bảo vệ Dữ liệu Nhạy cảm Học viên (Nghị định 13/2023/NĐ-CP)** | Bảng `Doc_Documents` đã có `DataClassification`. | CCCD, Hộ chiếu, Số dư tài khoản ngân hàng, Hồ sơ y tế của học viên được xếp vào mức `Restricted`/`Confidential`, bắt buộc che giấu một phần (Masking) trên UI khi hiển thị cho nhân viên thông thường. | `PROPOSED` |
| **ASN-12** | **Danh mục Pháp nhân thực tế và Mã số thuế chính thức** | Cần hồ sơ pháp lý từ Ban Lãnh đạo SHD. | Chưa có dữ liệu thực tế. Tạm thời sử dụng dữ liệu giả lập mẫu cho môi trường Development. | `TBD` |
| **ASN-13** | **Quy chế Hạch toán Doanh thu & Phí dịch vụ Nội bộ (Internal Transfer Pricing)** | Cần phê chuẩn của Kế toán trưởng SHD Corp. | Chưa có văn bản quy chế tài chính nội bộ. MVP Phase 1 hạch toán đơn giản theo pháp nhân thu tiền. | `TBD` |
| **ASN-14** | **Nhà cung cấp Dịch vụ Ký số Điện tử & SMS OTP** | Cần chọn nhà cung cấp: VNPT, Viettel, FPT hoặc Zalo ZNS. | Đang chờ đánh giá chi phí vận hành và hợp đồng khung viễn thông. | `TBD` |

---

## 3. TÁC ĐỘNG TỚI THIẾT KẾ KIẾN TRÚC & MÃ NGUỒN

Các quyết định trên định hình trực tiếp các nguyên tắc thiết kế cho các phân hệ:
1. **Tuyệt đối không xây dựng hệ thống phân quyền song song:** Toàn bộ API của `CRM` và `Commercial` sẽ sử dụng thuộc tính `[AuthorizeScope(Permission = "...")]` kế thừa từ `ShdOneErp.Infrastructure.Security`.
2. **Tuân thủ CQRS nguyên bản của SHD OneERP:**
   - Mọi thao tác ghi (Create, Update, State Transition): Thực thi qua EF Core `DbContext` trong `ShdOneErp.Domain` và `ShdOneErp.Application`.
   - Mọi thao tác đọc danh sách, dashboard, tìm kiếm nâng cao: 100% thực thi qua SQL Stored Procedures (`sp_Crm_*`, `sp_Commercial_*`) thông qua `ISpExecutor`.
3. **Đảm bảo tính bất biến của hợp đồng:**
   - Hợp đồng khi đã ở trạng thái `Signed` hoặc `Active` tuyệt đối không được phép UPDATE trực tiếp các điều khoản tài chính và dịch vụ. Mọi điều chỉnh bắt buộc phải tạo bản ghi `ContractAmendment` (Phụ lục hợp đồng) có quy trình phê duyệt riêng.

