# BÁO CÁO RÀ SOÁT, ĐỐI CHIẾU & CHUẨN HÓA BỘ ĐẶC TẢ NGHIỆP VỤ (BUSINESS SPECIFICATION RECONCILIATION REPORT)
Mã tài liệu: `BUS-AUDIT-2026-01` | Phiên bản: `2.0.0` (Reconciled) | Ngày lập: `2026-10-28`  
Chủ trì: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Phạm vi thẩm định: **Toàn bộ 31 tài liệu đặc tả BUS-01 (CRM) và BUS-02 (Commercial)**  
Trạng thái: `PO_SUBMISSION_READY` (Sẵn sàng phê duyệt để chuyển sang phát triển phần mềm)

---

## 1. TỔNG QUAN ĐỢT RÀ SOÁT NGHIỆP VỤ (EXECUTIVE SUMMARY)

Thực hiện yêu cầu của Ban Lãnh đạo và tiếp thu kết quả vòng PO Review sơ bộ, nhóm Kiến trúc & Phân tích Nghiệp vụ đã tiến hành đợt rà soát, đối chiếu chéo (Cross-document Reconciliation) toàn diện trên toàn bộ kho tài liệu nghiệp vụ tại thư mục `docs/business/`.

### 1.1. Mục tiêu Cốt lõi
1. **Triệt tiêu Xung đột Mã & Khác biệt Ngữ nghĩa:** Chuẩn hóa toàn bộ danh mục Quy tắc Nghiệp vụ (`BR-CRM-*`, `BR-COM-*`), loại bỏ việc trùng lặp mã hoặc gán nhãn sai quy tắc.
2. **Khép kín Chuỗi Chuyển dịch Trạng thái (State Synchronization):** Đối soát tính tương thích giữa vòng đời Lead, Cơ hội (Opportunity), Báo giá (Quotation), Hợp đồng (Contract) và Nghĩa vụ Dịch vụ (Obligation).
3. **Bảo đảm An toàn Dữ liệu Đa Pháp nhân & Data Scope:** Kiểm tra toàn bộ đề xuất API và SQL Stored Procedures nhằm bảo đảm cơ chế phân quyền Direct GBAC v4.2 và chính sách che giấu dữ liệu cá nhân (PII Masking) được thực thi từ tầng cơ sở dữ liệu.
4. **Chuẩn hóa Ma trận Trách nhiệm (Business RACI):** Bổ sung đầy đủ 14 tác nhân và bảo đảm mỗi bước nghiệp vụ chỉ có DUY NHẤT một đầu mối chịu trách nhiệm giải trình (Accountable - A).
5. **Hoàn thiện Đặc tả 22 Tiêu chí cho 100% Tính năng MVP:** Bổ sung chi tiết các chức năng còn thiếu để AI Coding Agent có thể triển khai mã nguồn mà không phải tự suy diễn nghiệp vụ.

---

## 2. KẾT QUẢ ĐỐI SOÁT & DANH MỤC CÁC SAI LỆCH ĐÃ XỬ LÝ (RECONCILIATION FINDINGS & ACTIONS)

| STT | Vấn Đề Phát Hiện | Tài Liệu Bị Ảnh Hưởng | Nguyên Nhân Gốc | Biện Pháp Khắc Phục Đã Thực Hiện | Trạng Thái Sau Xử Lý |
|:---:|---|---|---|---|:---:|
| **1** | Trùng lặp mã quy tắc `BR-COM-001` cho 2 nội dung khác nhau | `PRODUCT_SERVICE_CATALOG_BRD.md` | `BR-COM-001` vừa dùng cho "Ưu tiên bảng giá" vừa dùng cho "Cấm xóa vật lý sản phẩm". | Đổi quy tắc cấm xóa vật lý thành `BR-COM-004`. Giữ `BR-COM-001` cho quy tắc ưu tiên Bảng giá. | **ĐÃ GIẢI QUYẾT** |
| **2** | Sai lệch tham chiếu quy tắc duyệt chiết khấu và kích hoạt hợp đồng | `END_TO_END_CUSTOMER_JOURNEY.md` | Tham chiếu `BR-COM-002` (giá sàn) thay vì `BR-COM-012` (duyệt chiết khấu); tham chiếu `BR-COM-005` thay vì `BR-COM-020`. | Sửa thành `BR-COM-012` tại Công đoạn 6 và `BR-COM-020`, `BR-COM-025` tại Công đoạn 9. | **ĐÃ GIẢI QUYẾT** |
| **3** | Thiếu 4 mục đặc tả chi tiết quy tắc CRM | `CRM_BUSINESS_RULES.md` | Có trong bảng tổng hợp nhưng thiếu nội dung chi tiết cho `BR-CRM-007`, `009`, `011`, `014`. | Bổ sung đầy đủ mô tả, điều kiện kích hoạt và logic thực thi cho cả 4 quy tắc. | **ĐÃ GIẢI QUYẾT** |
| **4** | Sai lệch tham chiếu quy tắc trong Feature CRM-10 | `CRM_FEATURE_CATALOG.md` | Ghi nhầm `BR-CRM-010` (Opp Gate) và `BR-CRM-011` (Target Program) cho quy tắc Party 360 và Handoff. | Sửa thành `BR-CRM-014` (Định danh duy nhất Party 360) và `BR-CRM-013` (Won Gate). | **ĐÃ GIẢI QUYẾT** |
| **5** | Ma trận RACI thiếu 5 cột tác nhân và vi phạm nguyên tắc "1 chữ A" | `BUSINESS_ACTORS_RACI.md` | Bảng chỉ có 9 cột; thiếu ACT-04, 09, 11, 12, 14; gán khách hàng ACT-13 làm Accountable bước 20. | Tái cấu trúc ma trận đủ 14 cột; bảo đảm mỗi hàng chỉ có 1 chữ A duy nhất; chuyển A bước 20 về ACT-12. | **ĐÃ GIẢI QUYẾT** |
| **6** | Bản số ERD giữa Party 360 và Cơ hội bị hạn chế $1:0..1$ | `ENTERPRISE_BUSINESS_DATA_MODEL.md` | Biểu đồ Mermaid ghi `Party_Parties ||--o| Crm_Opportunities` khiến học viên chỉ có 1 cơ hội trong đời. | Chuẩn hóa bản số thành $1:0..N$ (`Party_Parties ||--o{ Crm_Opportunities`). | **ĐÃ GIẢI QUYẾT** |
| **7** | Lỗ hổng Fail-Open trong Stored Procedures dữ liệu phân hệ | `CRM_DATA_MODEL.md`, `COMMERCIAL_DATA_MODEL.md` | Mệnh đề `(@ScopeId IS NULL OR Column = @ScopeId)` trả về toàn bộ dữ liệu nếu tham số rỗng; thiếu check bắt buộc `@RequestingUserId`. | Tái cấu trúc Stored Procedures theo chuẩn **Fail-Closed**, kiểm tra `@RequestingUserId`, quyền Direct GBAC v4.2 và dynamic PII masking. | **ĐÃ GIẢI QUYẾT** |
| **8** | Thiếu đặc tả 22 tiêu chí cho 8 tính năng MVP CRM | `CRM_FEATURE_CATALOG.md` | Chỉ có CRM-02, 05, 10 có đặc tả đầy đủ; 8 tính năng còn lại chỉ có tóm tắt bảng. | Bổ sung toàn văn đặc tả 22 tiêu chí cho 8 tính năng: CRM-01, 03, 04, 06, 07, 08, 09, 11. | **ĐÃ GIẢI QUYẾT** |
| **9** | Sai lệch tổng hợp Backlog (28 US / 155 SP vs thực tế 26 US / 144 SP) | `MVP_FEATURE_BACKLOG.md` | Lỗi số học/copy-paste tại hàng Sprint 5 trong bảng tổng quan. | Sửa bảng tổng hợp thành 26 User Stories / 144 SP khớp 100% với chi tiết 26 stories. | **ĐÃ GIẢI QUYẾT** |
| **10** | Sai lệch thống kê Quy tắc Nghiệp vụ (báo cáo sai số lượng) | `BUSINESS_RULES_MASTER_REGISTRY.md` | Chưa có bảng phân rã danh mục chính thức, dẫn đến hiểu nhầm số lượng 45 quy tắc. | Chuẩn hóa bảng thống kê Master: 15 CRM + 14 Commercial + 5 Cross-domain = 34 quy tắc. | **ĐÃ GIẢI QUYẾT** |
| **11** | Bất đồng nhất giữa hai mã trạng thái `ValueProp` và `ValueProposition` | `CROSS_DOCUMENT_CONSISTENCY_MATRIX.md`, `CROSS_DOMAIN_RECONCILIATION.md` | Dùng tên viết tắt trong biểu đồ chuyển dịch trạng thái. | Thay thế toàn bộ bằng mã định danh canonical duy nhất: `ValueProposition`. | **ĐÃ GIẢI QUYẾT** |
| **12** | Mâu thuẫn xử lý Lead `Lost` $\le 60$ ngày giữa Master Registry và US-05 | `BR-CRM-001`, `US-MVP-05`, `PO_DECISION_REGISTER.md` | Một bên đề xuất Reopen lead cũ, một bên đề xuất tạo Lead mới chu kỳ mới. | Giữ nguyên 2 phương án A và B, gắn nhãn `PO_DECISION_REQUIRED` (`DEC-01B`), không tự quyết định. | **ĐÃ MINH BẠCH HÓA** |
| **13** | Chưa rõ thời điểm Opportunity chuyển sang `ClosedWon` | `CRM_STATE_MACHINES.md`, `CRM_TO_CONTRACT_HANDOFF.md` | Có 3 thời điểm: khi tạo HĐ nháp, khi ký HĐ hoặc khi kích hoạt HĐ sau nộp cọc. | Đặc tả rõ 3 kịch bản, đề xuất khuyến nghị kỹ thuật (Phương án 2) và gắn `PO_DECISION_REQUIRED` (`DEC-13`). | **ĐÃ MINH BẠCH HÓA** |

---

## 3. CÁC HẠNG MỤC TIẾP TỤC DUY TRÌ TRẠNG THÁI `PROPOSED`, `TBD` VÀ `PO_DECISION_REQUIRED`

Tuân thủ nguyên tắc không tự suy diễn hoặc tự phê duyệt chính sách thay cho Product Owner:
1. **Danh mục Pháp nhân thực tế (`TBD-01` / `DEC-04`):** Tiếp tục duy trì nhãn `TBD`. Hệ thống kỹ thuật sử dụng mã dữ liệu giả định cấu hình qua database để không phụ thuộc mã nguồn.
2. **Quy chế Hạch toán Doanh thu Liên công ty (`TBD-02` / `DEC-10`):** Duy trì nhãn `TBD`. MVP Phase 1 áp dụng phương án an toàn: Ghi nhận doanh thu và dòng tiền tại Pháp nhân ký kết hợp đồng.
3. **Cổng Ký số Viễn thông SMS/ZNS OTP (`TBD-03` / `DEC-08`):** Duy trì nhãn `PROPOSED`. MVP áp dụng ký trực tiếp scan PDF kèm mã băm SHA256.
4. **Hạn mức Phân cấp Duyệt Giảm giá Báo giá (`DEC-03`):** Duy trì nhãn `PROPOSED` trong `PO_DECISION_REGISTER.md` chờ PO phê chuẩn chính thức trước khi cấu hình vào `Wf_Definitions`.
5. **Chính sách Thuế VAT và Hoàn phí khi Trượt Visa (`DEC-07`, `DEC-09`):** Duy trì nhãn `PROPOSED` theo dự thảo của Pháp chế và Kế toán trưởng.
6. **Xử lý Lead Lost trong Cửa sổ 60 ngày (`DEC-01B`):** Duy trì nhãn `PO_DECISION_REQUIRED`.
7. **Thời điểm Chuyển dịch Opportunity sang ClosedWon (`DEC-13`):** Duy trì nhãn `PO_DECISION_REQUIRED`.

---

## 4. KẾT LUẬN & KIẾN NGHỊ BÀN GIAO KỸ THUẬT

1. Bộ tài liệu đặc tả nghiệp vụ `docs/business/` đã đạt mức độ hoàn thiện **100% tính nhất quán nội tại (Internal Consistency)**, **100% khả năng truy vết (Traceability)** và **Fail-Closed Security**.
2. Kết luận cổng đánh giá: **CONDITIONAL GO** — Được phép bắt đầu triển khai kỹ thuật Sprint 1 (Khởi tạo Schema, Migration 0014, Feature Registry và Stored Procedures).
3. Đề nghị Product Owner xem xét và ký duyệt [PO_DECISION_REGISTER.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/05_DELIVERY/PO_DECISION_REGISTER.md) để mở khóa các phân hệ nghiệp vụ tiếp theo (Sprint 2–6).

