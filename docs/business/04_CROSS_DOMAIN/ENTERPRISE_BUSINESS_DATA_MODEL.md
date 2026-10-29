# MÔ HÌNH DỮ LIỆU TỔNG THỂ DOANH NGHIỆP (ENTERPRISE BUSINESS DATA MODEL)
Mã tài liệu: `BUS-DOC-04-05` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Phạm vi: **Hợp nhất CRM, Commercial, Party 360, Organization, Documents & Workflow**

---

## 1. SƠ ĐỒ THỰC THỂ DOANH NGHIỆP TOÀN DIỆN (ENTERPRISE MASTER ERD)

```mermaid
erDiagram
    %% KHỐI CƠ CẤU TỔ CHỨC
    Org_LegalEntities ||--o{ Org_BusinessUnits : "so_huu"
    Org_LegalEntities ||--o{ Org_Branches : "van_hanh"
    Org_BusinessUnits ||--o{ Org_Branches : "quan_ly"
    
    %% KHỐI ĐỊNH DANH PARTY 360
    Party_Parties ||--o| Party_Persons : "la_ca_nhan"
    Party_Parties ||--o| Party_OrganizationParties : "la_to_chuc"
    Party_Parties ||--o{ Party_PartyRoles : "dam_nhiem"
    Party_Parties ||--o{ Party_PartyContactMethods : "lien_lac"
    Party_Parties ||--o{ Party_PartyIdentifications : "giay_to_phap_ly"
    Party_Parties ||--o{ Party_PartyRelationships : "quan_he"

    %% KHỐI CRM & TUYỂN SINH
    Crm_MarketingSources ||--o{ Crm_Campaigns : "khoi_chay"
    Crm_Campaigns ||--o{ Crm_Leads : "thu_hut"
    Org_Branches ||--o{ Crm_Leads : "tiep_nhan"
    Identity_Users ||--o{ Crm_Leads : "cham_soc"
    Crm_Leads ||--o{ Crm_ConsultationLogs : "ghi_nhat_ky"
    Crm_Leads ||--o| Crm_Opportunities : "chuyen_thanh_co_hoi"
    Party_Parties ||--o{ Crm_Opportunities : "dinh_danh_khach"

    %% KHỐI COMMERCIAL CATALOG & BÁO GIÁ
    Com_Products ||--o{ Com_PackageComponents : "chua_dich_vu"
    Com_Services ||--o{ Com_PackageComponents : "cau_thanh"
    Com_Products ||--o{ Com_PriceListItems : "dinh_gia"
    Com_PriceLists ||--o{ Com_PriceListItems : "bang_gia"
    Crm_Opportunities ||--o{ Com_Quotations : "sinh_bao_gia"
    Com_Quotations ||--o{ Com_QuotationItems : "dong_chi_tiet"

    %% KHỐI HỢP ĐỒNG & NGHĨA VỤ THỰC HIỆN
    Com_Quotations ||--o| Com_Contracts : "chuyen_thanh_hop_dong"
    Org_LegalEntities ||--o{ Com_Contracts : "ky_dai_dien"
    Org_BusinessUnits ||--o{ Com_Contracts : "tinh_doanh_so"
    Party_Parties ||--o{ Com_Contracts : "hoc_vien_dung_ten"
    Party_Parties ||--o{ Com_Contracts : "nguoi_bao_lanh"
    Com_Contracts ||--o{ Com_ContractItems : "san_pham_cam_ket"
    Com_Contracts ||--o{ Com_ContractAddenda : "phu_luc_hop_dong"
    Com_Contracts ||--o{ Com_PaymentSchedules : "lich_nop_tien"
    Com_Contracts ||--o{ Com_ServiceObligations : "nghia_vu_giao_viec"

    %% KHỐI NỀN TẢNG WORKFLOW & TÀI LIỆU
    Doc_Documents ||--o{ Com_Contracts : "dinh_kem_file_ky"
    Wf_Instances ||--o| Com_Quotations : "luong_duyet_chiet_khau"
    Wf_Instances ||--o| Com_Contracts : "luong_duyet_phap_ly"
```

---

## 2. MA TRẬN QUAN HỆ & BẢN SỐ (CARDINALITY MATRIX)

| Thực Thể Gốc (Source Entity) | Quan Hệ | Thực Thể Đích (Target Entity) | Bản Số (Cardinality) | Ý Nghĩa Nghiệp Vụ |
|---|:---:|---|:---:|---|
| `Party_Parties` | $1 \rightarrow N$ | `Crm_Leads` | $1 : 0..N$ | Một người có thể để lại nhiều Lead qua nhiều năm/kỳ tuyển sinh khác nhau. |
| `Crm_Leads` | $1 \rightarrow 1$ | `Crm_Opportunities` | $1 : 0..1$ | Một Lead chỉ chuyển đổi thành tối đa 01 Opportunity trong cùng một chu kỳ tuyển sinh. |
| `Crm_Opportunities` | $1 \rightarrow N$ | `Com_Quotations` | $1 : 1..N$ | Một cơ hội có thể có nhiều phiên bản Báo giá (V1, V2, V3) trong quá trình đàm phán. |
| `Com_Quotations` | $1 \rightarrow 1$ | `Com_Contracts` | $1 : 0..1$ | Chỉ có 01 Báo giá được chấp thuận mới được chuyển đổi thành Hợp đồng chính thức. |
| `Party_Parties` | $1 \rightarrow N$ | `Com_Contracts` | $1 : 0..N$ | Một học viên có thể ký nhiều hợp đồng (Học tiếng, Du học nghề, Chuyển tiếp). |
| `Com_Contracts` | $1 \rightarrow N$ | `Com_ContractItems` | $1 : 1..N$ | Mỗi hợp đồng bao gồm một hoặc nhiều gói sản phẩm / dịch vụ cụ thể. |
| `Com_Contracts` | $1 \rightarrow N$ | `Com_PaymentSchedules`| $1 : 1..N$ | Mỗi hợp đồng có lịch trình thanh toán chia làm nhiều đợt (thường 2 - 4 đợt). |
| `Com_Contracts` | $1 \rightarrow N$ | `Com_ServiceObligations`| $1 : 1..N$ | Mỗi hợp đồng phát sinh nhiều nghĩa vụ (Đào tạo, Hồ sơ visa, Đón sân bay). |
| `Com_Contracts` | $1 \rightarrow N$ | `Com_ContractAddenda` | $1 : 0..N$ | Một hợp đồng có thể có nhiều phụ lục sửa đổi điều khoản qua thời gian. |
| `Doc_Documents` | $1 \rightarrow N$ | `Com_Contracts` | $1 : 1..N$ | Bản scan hợp đồng và các giấy tờ tùy thân được quản lý trong Document Foundation. |

---

## 3. NGUYÊN TẮC BẢO TOÀN DỮ LIỆU & ĐỒNG BỘ DOANH NGHIỆP

1. **Khóa Lạc Quan Toàn Hệ Thống (Optimistic Concurrency Control):**
   - 100% các bảng giao dịch chính (`Crm_Leads`, `Crm_Opportunities`, `Com_Quotations`, `Com_Contracts`) bắt buộc có trường `RowVersion ROWVERSION NOT NULL`.
   - Mọi thao tác cập nhật từ Frontend bắt buộc gửi kèm `RowVersionBase64`. Nếu phát hiện dữ liệu đã bị người khác thay đổi trước đó, hệ thống trả về mã lỗi HTTP 409 Conflict.
2. **Chính Sách Xóa Mềm Bất Biến (Soft Delete & Immutability):**
   - Áp dụng cờ `IsDeleted = 1`, `DeletedAtUtc = SYSUTCDATETIME()`.
   - Hợp đồng ở trạng thái `Active`, `UnderFulfillment`, `Completed` tuyệt đối không được phép xóa mềm lẫn xóa cứng; chỉ có thể chuyển trạng thái sang `Terminated`.
3. **Phân Vùng Dữ Liệu Phân Quyền (Scoped Data Isolation):**
   - Mọi bản ghi giao dịch đều mang đủ bộ 3 khóa ngoại phạm vi: `ScopeLegalEntityId`, `ScopeBusinessUnitId`, `ScopeBranchId`.
   - Stored Procedures đọc dữ liệu luôn lọc theo phạm vi được cấp của người dùng đăng nhập (`IScopeResolver`).

