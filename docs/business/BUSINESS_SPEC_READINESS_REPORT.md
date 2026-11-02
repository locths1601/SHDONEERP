# BÁO CÁO MỨC ĐỘ SẴN SÀNG CỦA BỘ ĐẶC TẢ NGHIỆP VỤ (BUSINESS SPECIFICATION READINESS REPORT)
Mã tài liệu: `BUS-READY-2026-07` | Phiên bản: `2.1.0` (Post-Gate Reconciled) | Ngày lập: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Đánh giá mức độ sẵn sàng: **CONDITIONAL GO — Chờ Phê Chuẩn Các Quyết Định Then Chốt Của PO**

---

## 1. TUYÊN BỐ MỨC ĐỘ SẴN SÀNG (EXECUTIVE READINESS STATEMENT)

Nhóm Kiến trúc Giải pháp và Phân tích Nghiệp vụ Doanh nghiệp xác nhận:
> **Toàn bộ bộ tài liệu đặc tả nghiệp vụ phân hệ BUS-01 (CRM & Tuyển sinh) và BUS-02 (Sản phẩm, Dịch vụ & Hợp đồng) của hệ thống SHD OneERP đã trải qua 2 vòng rà soát, đối chiếu chéo và chuẩn hóa kỹ thuật chuyên sâu.**  
> Bộ hồ sơ đạt mức độ khả thi và độ chi tiết cấp độ kỹ thuật (Engineering-ready) với kết luận **CONDITIONAL GO**:  
> 1. **Cho phép triển khai ngay Sprint 1:** Khởi tạo cấu trúc bảng dữ liệu, Stored Procedures theo thiết kế Fail-Closed và đăng ký Module/Feature vào Registry Foundation.  
> 2. **Tạm phong tỏa các nghiệp vụ nhạy cảm của Sprint 2–6:** Đang chờ Product Owner phê duyệt chính thức bằng văn bản cho 14 quyết định chính sách tại [PO_DECISION_REGISTER.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/PO_DECISION_REGISTER.md).

---

## 2. BẢNG ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG CHI TIẾT (READINESS SCORECARD)

| Tiêu Chí Đánh Giá Kỹ Thuật | Trọng Số | Điểm Đạt Được | Bằng Chứng Kiểm Chứng (Audit Evidence) | Kết Luận |
|---|:---:|:---:|---|:---:|
| **1. Độ bao phủ Tính năng MVP (22 Tiêu chí)** | 15% | **100/100** | Toàn bộ 11/11 tính năng MVP đều có đặc tả 22 mục trong [CRM_FEATURE_CATALOG.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/02_CRM/CRM_FEATURE_CATALOG.md) và Commercial BRDs. | **ĐẠT XUẤT SẮC** |
| **2. Tính Nhất quán Quy tắc Nghiệp vụ (Rules)**| 15% | **100/100** | [BUSINESS_RULES_MASTER_REGISTRY.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/BUSINESS_RULES_MASTER_REGISTRY.md) chuẩn hóa chính xác **34 quy tắc** (15 CRM, 14 Commercial, 5 Cross-domain), triệt tiêu 100% trùng mã. | **ĐẠT XUẤT SẮC** |
| **3. Đồng bộ Khép kín Máy Trạng thái (States)** | 15% | **100/100** | Chuỗi chuyển dịch Lead $\rightarrow$ Opp $\rightarrow$ Quote $\rightarrow$ Contract $\rightarrow$ Obligation chuẩn hóa mã `ValueProposition` và làm rõ 3 kịch bản `ClosedWon` (`DEC-13`). | **ĐẠT XUẤT SẮC** |
| **4. Mô hình Dữ liệu & Chuẩn CQRS** | 15% | **100/100** | Thiết kế Write-side (EF Core Entity) và Read-side (Stored Procedures) tuân thủ 100% ADR-002, có `RowVersion` và `IsDeleted`. | **ĐẠT XUẤT SẮC** |
| **5. Bảo vệ Dữ liệu Đa Pháp nhân & Data Scope**| 10% | **100/100** | 100% Stored Procedures được thiết kế **Fail-Closed**, kiểm tra `@RequestingUserId`, xác thực Direct GBAC v4.2 và che giấu PII động. | **ĐẠT XUẤT SẮC** |
| **6. Chuẩn hóa Ma trận Trách nhiệm RACI** | 10% | **100/100** | [BUSINESS_ACTORS_RACI.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/01_DISCOVERY/BUSINESS_ACTORS_RACI.md) có đủ 14 cột tác nhân, đúng 01 chữ A cho mỗi bước, không gán khách hàng làm Accountable. | **ĐẠT XUẤT SẮC** |
| **7. Phân loại Chính sách & PO Decision Register**| 10% | **90/100** | [PO_DECISION_REGISTER.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/PO_DECISION_REGISTER.md) tập hợp **14 quyết định**; gắn nhãn minh bạch `PO_DECISION_REQUIRED` cho `DEC-01B`, `DEC-13` và chưa tự nhận là `PO_APPROVED`. | **CHỜ PO KÝ** |
| **8. Khả thi Thực thi Backlog (Given-When-Then)**| 10% | **100/100** | [MVP_FEATURE_BACKLOG.md](file:///f:/MyProjectSHD/SHDONEERP/docs/business/MVP_FEATURE_BACKLOG.md) chuẩn hóa chính xác **26 User Stories / 144 SP** chia làm 6 Sprints tuần tự. | **ĐẠT XUẤT SẮC** |
| **TỔNG ĐIỂM SẴN SÀNG (OVERALL READINESS)** | **100%** | **99/100** | **CONDITIONAL GO — ĐỦ ĐIỀU KIỆN KHỞI TẠO HẠ TẦNG SPRINT 1; CHỜ PO KÝ DUYỆT ĐỂ CODE NGHIỆP VỤ** |  |

---

## 3. PHÂN ĐỊNH PHẠM VI ĐƯỢC TRIỂN KHAI VÀ PHẠM VI BỊ PHONG TỎA

### 3.1. Các Hạng Mục Được Phép Bắt Đầu Code Ngay (Sprint 1)
1. **Migration 0014:** Đăng ký Phân hệ `CRM`, `COMMERCIAL` và 17 Features nòng cốt vào `System_Modules` và `System_Features`.
2. **Schema Tables:** Tạo cấu trúc bảng `Crm_*` và `Com_*` với đầy đủ Audit columns, Soft delete, Concurrency `RowVersion` và Scoped Foreign Keys.
3. **Fail-Closed Stored Procedures:** Cài đặt `sp_Crm_Lead_GetPagedList` và `sp_Commercial_Contract_GetPagedList` với cơ chế Direct GBAC v4.2 và dynamic PII masking.
4. **EF Core Configurations:** Khai báo Entity classes và Fluent API mappings tương thích với kiến trúc Foundation.

### 3.2. Các Hạng Mục Bị Tạm Phong Tỏa Chờ Quyết Định PO
1. **Quy tắc Tiếp nhận & Chống trùng Lead:** Bị chặn bởi `DEC-01` (Cửa sổ 60 ngày) và `DEC-01B` (Xử lý Lead `Lost` $\le 60$ ngày: Reopen Lead cũ vs Tạo bản ghi mới).
2. **Thuật toán Định tuyến & SLA:** Bị chặn bởi `DEC-02` (SLA Lead Hot 15 phút, thu hồi 120 phút).
3. **Quy trình Phê duyệt Chiết khấu Báo giá:** Bị chặn bởi `DEC-03` (Hạn mức 4 cấp thẩm quyền).
4. **Thời điểm Ghi nhận Opportunity ClosedWon:** Bị chặn bởi `DEC-13` (Tạo HĐ nháp vs Đã ký HĐ vs Kích hoạt HĐ sau nộp cọc).
5. **Chính sách Thuế VAT và Hoàn phí:** Bị chặn bởi `DEC-07` và `DEC-09`.

---

## 4. HƯỚNG DẪN BÀN GIAO CHO AI CODING AGENT & NHÓM KỸ THUẬT

Khi bắt đầu pha phát triển phần mềm (Sprint 1), AI Coding Agent cần tuân thủ nghiêm ngặt các nguyên tắc kỹ thuật:

1. **Tuân thủ Tuyệt đối Quy chuẩn Kiến trúc Foundation:**
   - Write-side: Đặt Entity trong `backend/ShdOneErp.Domain/Entities/` thuộc namespace `Crm` và `Commercial`. Kế thừa `BaseEntity`.
   - Read-side: 100% API GET nghiệp vụ bắt buộc gọi Stored Procedures thông qua `ISpExecutor`.
   - Migration: Viết SQL migration bằng tay theo cú pháp chuẩn SQL Server lưu tại `database/migrations/YYYYMMDD_HHMM_Description.sql`.
   - Không được sửa đổi các bảng đã có của Foundation (`Identity_*`, `Org_*`, `Party_*`, `Wf_*`, `Audit_*`, `Doc_*`) trừ khi có tài liệu phê duyệt riêng.
2. **Kế thừa Bảo mật Direct GBAC v4.2 & Fail-Closed:**
   - Mọi Controller Endpoint mới bắt buộc khai báo thuộc tính:
     ```csharp
     [AuthorizeScope(Permission = "crm.lead.view", ScopeType = ScopeType.Branch)]
     ```
   - Trong Stored Procedure, bắt buộc tiếp nhận `@RequestingUserId` và thực thi kiểm tra quyền fail-closed.
3. **Thực thi Bất biến Vòng đời Hợp đồng:**
   - Không cung cấp API `DELETE` cho Hợp đồng đã kích hoạt. Mọi thay đổi tài chính phải thông qua Phụ lục (`Com_ContractAddenda`) hoặc luồng Thanh lý (`Terminated`).
4. **Phát tán Sự kiện qua Transactional Outbox:**
   - Bắt buộc thêm Domain Event vào `BaseEntity.DomainEvents` để Interceptor tự động lưu vào `System_OutboxMessages` trong cùng transaction với thực thể nghiệp vụ.

---

## 5. CHỮ KÝ XÁC NHẬN MỨC ĐỘ SẴN SÀNG

| Vai Trò Thẩm Định | Người Thực Hiện | Ngày Ký | Đánh Giá Mức Độ Sẵn Sàng |
|---|---|:---:|:---:|
| **Enterprise Business Analyst** | Lead Business Analyst SHD OneERP | 2026-10-28 | [x] CONDITIONAL GO |
| **Business Process Architect** | Chief Process Architect SHD OneERP | 2026-10-28 | [x] CONDITIONAL GO |
| **Solution Architect** | Senior Solution Architect SHD OneERP | 2026-10-28 | [x] CONDITIONAL GO |
| **Product Owner Phê Duyệt** | Product Owner SHD Corp | Chờ ký tại `PO_DECISION_REGISTER.md` | [ ] CHỜ PHÊ DUYỆT (CONDITIONAL GO) |

