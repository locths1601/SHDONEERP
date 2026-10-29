# BẢN ĐỒ MIỀN NGHIỆP VỤ & RANH GIỚI LIÊN PHÂN HỆ (BUSINESS DOMAIN MAP)
Mã tài liệu: `BUS-DOC-04-01` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Phương pháp luận: **Domain-Driven Design (DDD) & Context Mapping**

---

## 1. TỔNG THỂ BẢN ĐỒ CÁC MIỀN NGHIỆP VỤ (BOUNDED CONTEXT TOPOLOGY)

Trong kiến trúc Modular Monolith của SHD OneERP, toàn bộ hệ sinh thái được phân chia thành **14 Bounded Contexts**. Hai phân hệ **BUS-01 (CRM)** và **BUS-02 (Commercial)** đóng vai trò là "Cửa ngõ Doanh thu & Pháp lý" của toàn bộ doanh nghiệp.

```mermaid
graph TD
    subgraph FOUNDATION_LAYER["LÕI NỀN TẢNG DÙNG CHUNG (Foundation & Shared Kernel)"]
        FND_ORG["Organization Domain<br/>(LegalEntity, BU, Branch)"]
        FND_ID["Identity & GBAC Domain<br/>(Users, Permissions, Scopes)"]
        FND_P360["Party 360 Domain<br/>(Parties, Persons, Roles, Contacts)"]
        FND_WF["Workflow & Event Foundation<br/>(Wf_Instances, Outbox)"]
        FND_DOC["Document Foundation<br/>(Doc_Documents, Storage)"]
    end

    subgraph INTAKE_LAYER["TẦNG TIẾP NHẬN & THƯƠNG MẠI (Intake & Commercial - BUS-01 & BUS-02)"]
        DOM_CRM["BUS-01: CRM & TUYỂN SINH<br/>• Lead Acquisition & Scoring<br/>• Consultation & Opportunity Pipeline"]
        DOM_COM["BUS-02: COMMERCIAL & CONTRACTS<br/>• Product & Service Catalog<br/>• Quotation & Pricing Engine<br/>• Multi-party Contracts<br/>• Service Obligations & Billing Milestones"]
    end

    subgraph FULFILLMENT_LAYER["TẦNG VẬN HÀNH DỊCH VỤ CHUYÊN TRÁCH (Service Fulfillment)"]
        DOM_EDU["Domain 7: EDUCATION<br/>• Lớp học tiếng Topik/JLPT<br/>• Điểm danh & Kết quả thi"]
        DOM_VISA["Domain 8: ADMISSION & VISA<br/>• Hồ sơ du học sinh<br/>• Dịch thuật công chứng & Visa"]
        DOM_PLACE["Domain 9: INTERNATIONAL PLACEMENT<br/>• Đối tác trường nước ngoài (CoA)<br/>• Doanh nghiệp tuyển dụng"]
        DOM_CARE["Domain 10: OVERSEAS CARE<br/>• Đón sân bay & Nhà ở nước ngoài<br/>• Giám hộ pháp lý & Thẻ cư trú"]
    end

    subgraph FINANCIAL_LAYER["TẦNG TÀI CHÍNH DOANH NGHIỆP (Corporate Finance)"]
        DOM_FIN["Domain 11: FINANCE & ACCOUNTING<br/>• Phiếu thu, gạch nợ ngân hàng<br/>• Hóa đơn điện tử VAT & Sổ cái"]
    end

    DOM_CRM -->|1. Upstream| DOM_COM
    DOM_CRM -. Dùng chung .-> FND_P360 & FND_ORG & FND_ID
    DOM_COM -. Dùng chung .-> FND_P360 & FND_ORG & FND_WF & FND_DOC

    DOM_COM -->|2. Kích hoạt Nghĩa vụ| DOM_EDU
    DOM_COM -->|2. Kích hoạt Nghĩa vụ| DOM_VISA
    DOM_COM -->|2. Kích hoạt Nghĩa vụ| DOM_PLACE
    DOM_COM -->|2. Kích hoạt Nghĩa vụ| DOM_CARE

    DOM_COM <-->|3. Đối soát Công nợ & Thu tiền| DOM_FIN
```

---

## 2. MA TRẬN MỐI QUAN HỆ GIỮA CÁC MIỀN (CONTEXT MAPPING RELATIONSHIPS)

Áp dụng các mẫu quan hệ chuẩn DDD (Domain-Driven Design Context Mapping):

| Cặp Domain Giao Tiếp | Loại Mối Quan Hệ (Relationship Type) | Cơ Chế Tương Tác Kỹ Thuật | Mô Tả Ranh Giới Nghiệp Vụ |
|---|---|---|---|
| **CRM $\rightarrow$ Party 360** | **Conformist (Tuân thủ)** | Direct Domain Service (`IPartyService`) | CRM tuân thủ định dạng định danh Party của Foundation; không tự tạo bảng Person riêng. |
| **CRM $\rightarrow$ Commercial** | **Customer / Supplier (Khách - Thợ)** | Domain Events + Contract Request DTO | CRM cung cấp Khách hàng tiềm năng & Nguyện vọng; Commercial cung cấp Gói sản phẩm & Báo giá. |
| **Commercial $\rightarrow$ Workflow** | **Open Host Service (OHS)** | `IWorkflowEngine` Interface | Commercial sử dụng động cơ workflow nền tảng để phê duyệt Báo giá và Hợp đồng. |
| **Commercial $\rightarrow$ Fulfillment (Edu, Visa, Care)** | **Upstream / Downstream (Thượng nguồn / Hạ nguồn)** | Transactional Outbox Domain Events | Commercial phát sự kiện kích hoạt; các Domain Fulfillment đăng ký tiêu thụ bất đồng bộ. |
| **Commercial $\leftrightarrow$ Finance** | **Partnership (Hợp tác hai chiều)** | Eventual Consistency qua Outbox | Commercial quản lý lịch nộp tiền hợp đồng; Finance quản lý giao dịch thu tiền thực tế và gạch nợ. |
| **Tất cả $\rightarrow$ Organization & Identity** | **Shared Kernel (Lõi chia sẻ)** | GBAC Policies & Data Scopes | Mọi domain đều chia sẻ cấu trúc Legal Entity, Business Unit, Branch và User. |

---

## 3. NGUYÊN TẮC BẢO TOÀN TÍNH ĐỘC LẬP MIỀN (LOOSE COUPLING PRINCIPLES)

1. **Không Truy vấn Chéo Database Schema Trực tiếp (No Cross-boundary SQL Joins):**
   - Khi Service của `CRM` cần thông tin `Contract`, nó không được phép `JOIN` trực tiếp vào bảng `Com_Contracts` trong cùng transaction nếu không thuộc facade CQRS được định nghĩa trước.
   - Thao tác ghi dữ liệu của từng Domain phải độc lập tuyệt đối trong DbContext của module đó.
2. **Giao tiếp Bất đồng bộ qua Sự kiện Miền (Async via Domain Events):**
   - Mọi thay đổi trạng thái có ảnh hưởng sang phân hệ khác đều phải phát sinh Domain Event (Ví dụ: `ContractActivatedDomainEvent`).
   - Các Domain tiếp nhận (như `Education`, `AdmissionVisa`) tự lắng nghe sự kiện và tạo hồ sơ nội bộ độc lập. Nếu phân hệ Đào tạo bị gián đoạn, việc ký kết hợp đồng bên Commercial vẫn diễn ra thông suốt.

