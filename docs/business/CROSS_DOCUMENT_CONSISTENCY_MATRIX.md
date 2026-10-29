# MA TRẬN ĐỐI CHIẾU TÍNH NHẤT QUÁN TOÀN DIỆN (CROSS-DOCUMENT CONSISTENCY MATRIX)
Mã tài liệu: `BUS-MATRIX-2026-02` | Phiên bản: `2.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Phạm vi: **Đối soát chéo 31 tài liệu đặc tả nghiệp vụ SHD OneERP**

---

## 1. MA TRẬN ĐỐI CHIẾU THỰC THỂ DỮ LIỆU (DATA ENTITY CROSS-REFERENCE MATRIX)

Bảng đối chiếu kiểm tra tính nhất quán trong cách đặt tên bảng, vai trò và phạm vi xuất hiện qua các nhóm tài liệu:

| Tên Thực Thể / Bảng Dữ Liệu | Schema / Module | Tài Liệu Định Nghĩa Gốc | Xuất Hiện Tại Các Tài Liệu Khác | Đánh Giá Tính Nhất Quán |
|---|---|---|---|:---:|
| `Crm_MarketingSources` | `CRM` | `CRM_DATA_MODEL.md` | `CRM_BRD.md`, `CRM_FEATURE_CATALOG.md`, `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **ĐỒNG NHẤT 100%** |
| `Crm_Campaigns` | `CRM` | `CRM_DATA_MODEL.md` | `CRM_BRD.md`, `CRM_FEATURE_CATALOG.md`, `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **ĐỒNG NHẤT 100%** |
| `Crm_Leads` | `CRM` | `CRM_DATA_MODEL.md` | Toàn bộ 8 tài liệu CRM, Journey, Handoff, Backlog | **ĐỒNG NHẤT 100%** |
| `Crm_LeadTouchpoints` | `CRM` | `CRM_DATA_MODEL.md` | `CRM_BRD.md`, `CRM_FEATURE_CATALOG.md`, `CRM_PROCESS_MAP.md` | **ĐỒNG NHẤT 100%** |
| `Crm_ConsultationLogs` | `CRM` | `CRM_DATA_MODEL.md` | `CRM_BRD.md`, `CRM_STATE_MACHINES.md`, `CRM_UI_UX_SPEC.md` | **ĐỒNG NHẤT 100%** |
| `Crm_Opportunities` | `CRM` | `CRM_DATA_MODEL.md` | Toàn bộ tài liệu CRM, Handoff, Commercial, Backlog | **ĐỒNG NHẤT 100%** |
| `Crm_LostReasons` | `CRM` | `CRM_DATA_MODEL.md` | `CRM_STATE_MACHINES.md`, `CRM_FEATURE_CATALOG.md`, `CRM_UI_UX_SPEC.md` | **ĐỒNG NHẤT 100%** |
| `Com_Products` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `PRODUCT_SERVICE_CATALOG_BRD.md`, `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **ĐỒNG NHẤT 100%** |
| `Com_Services` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `PRODUCT_SERVICE_CATALOG_BRD.md`, `SERVICE_FULFILLMENT_BRD.md` | **ĐỒNG NHẤT 100%** |
| `Com_PackageComponents` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `PRODUCT_SERVICE_CATALOG_BRD.md`, `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **ĐỒNG NHẤT 100%** |
| `Com_PriceLists` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `PRODUCT_SERVICE_CATALOG_BRD.md`, `QUOTATION_MANAGEMENT_BRD.md` | **ĐỒNG NHẤT 100%** |
| `Com_Quotations` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `QUOTATION_MANAGEMENT_BRD.md`, `CRM_TO_CONTRACT_HANDOFF.md`, Backlog | **ĐỒNG NHẤT 100%** |
| `Com_Contracts` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | Toàn bộ 7 tài liệu Commercial, Handoff, Backlog | **ĐỒNG NHẤT 100%** |
| `Com_ContractAddenda` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `CONTRACT_MANAGEMENT_BRD.md`, `CONTRACT_LIFECYCLE.md` | **ĐỒNG NHẤT 100%** |
| `Com_PaymentSchedules` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `SERVICE_FULFILLMENT_BRD.md`, `CONTRACT_LIFECYCLE.md` | **ĐỒNG NHẤT 100%** |
| `Com_ServiceObligations` | `COMMERCIAL` | `COMMERCIAL_DATA_MODEL.md` | `SERVICE_FULFILLMENT_BRD.md`, `BUSINESS_DOMAIN_MAP.md` | **ĐỒNG NHẤT 100%** |
| `Party_Parties` (Lõi) | `PARTY360` | Migration `0004` (Foundation) | `PARTY360_INTEGRATION.md`, `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **TÁI SỬ DỤNG 100%** |
| `Party_Persons` (Lõi) | `PARTY360` | Migration `0004` (Foundation) | `PARTY360_INTEGRATION.md`, `CRM_TO_CONTRACT_HANDOFF.md` | **TÁI SỬ DỤNG 100%** |
| `Party_PartyRoles` (Lõi) | `PARTY360` | Migration `0004` (Foundation) | `PARTY360_INTEGRATION.md` (Roles: `Student`, `Parent`, `Agent`) | **TÁI SỬ DỤNG 100%** |
| `Org_LegalEntities` | `ORGANIZATION` | Migration `0003` (Foundation) | `SHD_BUSINESS_CONTEXT.md`, Commercial, CRM Data Scopes | **TÁI SỬ DỤNG 100%** |
| `Org_BusinessUnits` | `ORGANIZATION` | Migration `0003` (Foundation) | `SHD_BUSINESS_CONTEXT.md`, Commercial, CRM Data Scopes | **TÁI SỬ DỤNG 100%** |
| `Org_Branches` | `ORGANIZATION` | Migration `0003` (Foundation) | `SHD_BUSINESS_CONTEXT.md`, Commercial, CRM Data Scopes | **TÁI SỬ DỤNG 100%** |
| `Wf_Definitions / Instances`| `WORKFLOW` | Migration `0013` (Foundation) | `WORKFLOW_EVENT_MAPPING.md`, `CONTRACT_LIFECYCLE.md` | **TÁI SỬ DỤNG 100%** |
| `Doc_Documents` | `DOCUMENTS` | Migration `0010` (Foundation) | `CONTRACT_MANAGEMENT_BRD.md` (SHA256 e-Sign) | **TÁI SỬ DỤNG 100%** |
| `Audit_SystemLogs` | `AUDIT` | Migration `0010` (Foundation) | Tất cả các Feature Catalogs & BRD (Audit logging) | **TÁI SỬ DỤNG 100%** |

---

## 2. MA TRẬN ĐỐI CHIẾU QUY TẮC NGHIỆP VỤ (BUSINESS RULES RECONCILIATION)

| Mã Quy Tắc Chuẩn | Tên Quy Tắc Nghiệp Vụ | Nơi Định Nghĩa Chi Tiết | Nơi Được Tham Chiếu Áp Dụng | Trạng Thái Nhất Quán |
|---|---|---|---|:---:|
| `BR-CRM-001` | Cửa sổ kiểm tra trùng lặp Lead 60 ngày | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-02, 03), `CRM_PROCESS_MAP.md` | **KHỚP 100%** |
| `BR-CRM-002` | Định dạng số điện thoại chuẩn E.164 | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-02, 03) | **KHỚP 100%** |
| `BR-CRM-003` | Ưu tiên nguồn giới thiệu CTV (Referral Attribution) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-01, 02) | **KHỚP 100%** |
| `BR-CRM-004` | Cam kết phản hồi cuộc gọi đầu tiên (SLA: 15p / 2h / 24h) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-04, 05), `CRM_PROCESS_MAP.md` | **KHỚP 100%** |
| `BR-CRM-005` | Khung giờ tính SLA hành chính (08:00 - 18:00 T2-T7) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-05) | **KHỚP 100%** |
| `BR-CRM-006` | Thu hồi & Tái phân bổ tự động sau 120 phút quá hạn SLA | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-05), `CRM_PROCESS_MAP.md` | **KHỚP 100%** |
| `BR-CRM-007` | Giới hạn 50 Lead đang xử lý đồng thời (WIP Limit) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-05) | **ĐÃ BỔ SUNG CHI TIẾT** |
| `BR-CRM-008` | Bắt buộc ghi nhận kết quả khi đổi trạng thái Lead | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-06), `CRM_PROCESS_MAP.md` | **KHỚP 100%** |
| `BR-CRM-009` | Bắt buộc hẹn ngày gọi lại tối đa 14 ngày | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-06, 07) | **ĐÃ BỔ SUNG CHI TIẾT** |
| `BR-CRM-010` | Điều kiện chuyển Lead sang Cơ hội (Opportunity Gate) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-08), `CRM_STATE_MACHINES.md` | **KHỚP 100%** |
| `BR-CRM-011` | Bắt buộc gắn sản phẩm và giá trị vào Opportunity | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-08) | **ĐÃ BỔ SUNG CHI TIẾT** |
| `BR-CRM-012` | Bắt buộc nhập lý do thất bại khi đóng cơ hội (Lost) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-08, 09), `CRM_STATE_MACHINES.md` | **KHỚP 100%** |
| `BR-CRM-013` | Điều kiện chuyển đổi sang Hợp đồng (Won Gate) | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-10), `CRM_TO_CONTRACT_HANDOFF.md` | **ĐÃ HIỆU CHỈNH KHỚP** |
| `BR-CRM-014` | Định danh duy nhất Party 360 cho học viên toàn hệ thống | `CRM_BUSINESS_RULES.md` | `CRM_FEATURE_CATALOG.md` (FEAT-10), `PARTY360_INTEGRATION.md` | **ĐÃ HIỆU CHỈNH KHỚP** |
| `BR-CRM-015` | Che giấu dữ liệu cá nhân nhạy cảm học viên (Data Masking) | `CRM_BUSINESS_RULES.md` | `CRM_UI_UX_SPEC.md`, `CRM_DATA_MODEL.md` | **KHỚP 100%** |
| `BR-COM-001` | Ưu tiên áp dụng Bảng giá (Chiến dịch > Khu vực > Chuẩn) | `PRODUCT_SERVICE_CATALOG_BRD.md` | `QUOTATION_MANAGEMENT_BRD.md` | **ĐÃ PHÂN TÁCH KHỚP** |
| `BR-COM-002` | Giá bán không thấp hơn giá sàn niêm yết | `PRODUCT_SERVICE_CATALOG_BRD.md` | `QUOTATION_MANAGEMENT_BRD.md` | **KHỚP 100%** |
| `BR-COM-003` | Sản phẩm bắt buộc gắn pháp nhân sở hữu (`LegalEntityId`) | `PRODUCT_SERVICE_CATALOG_BRD.md` | `CONTRACT_MANAGEMENT_BRD.md` | **KHỚP 100%** |
| `BR-COM-004` | Cấm xóa vật lý sản phẩm / dịch vụ đã có giao dịch | `PRODUCT_SERVICE_CATALOG_BRD.md` | `COMMERCIAL_DATA_MODEL.md` | **ĐÃ ĐỔI MÃ TRÁNH TRÙNG** |
| `BR-COM-010` | Báo giá bắt buộc có thời hạn hiệu lực (mặc định 15 ngày)| `QUOTATION_MANAGEMENT_BRD.md` | `CRM_TO_CONTRACT_HANDOFF.md` | **KHỚP 100%** |
| `BR-COM-011` | Báo giá đã gửi không sửa trực tiếp; phải tạo phiên bản mới| `QUOTATION_MANAGEMENT_BRD.md` | `COMMERCIAL_DATA_MODEL.md` | **KHỚP 100%** |
| `BR-COM-012` | Ma trận phân cấp thẩm quyền duyệt chiết khấu 4 tầng | `QUOTATION_MANAGEMENT_BRD.md` | `END_TO_END_CUSTOMER_JOURNEY.md`, `WORKFLOW_EVENT_MAPPING.md` | **ĐÃ HIỆU CHỈNH KHỚP** |
| `BR-COM-013` | Báo giá được chọn ký Hợp đồng thì các bản khác Superseded | `QUOTATION_MANAGEMENT_BRD.md` | `CRM_TO_CONTRACT_HANDOFF.md` | **KHỚP 100%** |
| `BR-COM-020` | Hợp đồng chỉ `Active` sau khi có đủ chữ ký và cọc Đợt 1 | `CONTRACT_MANAGEMENT_BRD.md` | `END_TO_END_CUSTOMER_JOURNEY.md`, `CONTRACT_LIFECYCLE.md` | **ĐÃ HIỆU CHỈNH KHỚP** |
| `BR-COM-021` | Cấm xóa vật lý hợp đồng đã kích hoạt; chỉ thanh lý | `CONTRACT_MANAGEMENT_BRD.md` | `CONTRACT_LIFECYCLE.md`, `COMMERCIAL_DATA_MODEL.md` | **KHỚP 100%** |
| `BR-COM-022` | Người ký đại diện pháp nhân phải có quyền trong Scope | `CONTRACT_MANAGEMENT_BRD.md` | `COMMERCIAL_PERMISSION_MATRIX.md` | **KHỚP 100%** |
| `BR-COM-023` | Phụ lục hợp đồng không sửa hợp đồng gốc; quản lý version | `CONTRACT_MANAGEMENT_BRD.md` | `COMMERCIAL_DATA_MODEL.md` | **KHỚP 100%** |
| `BR-COM-024` | Chính sách hoàn phí theo kết quả visa và giai đoạn hồ sơ | `CONTRACT_LIFECYCLE.md` | `PO_DECISION_REGISTER.md` | **KHỚP 100% (PROPOSED)** |
| `BR-COM-025` | Điều kiện mở khóa bàn giao nghĩa vụ theo mốc nộp tiền | `SERVICE_FULFILLMENT_BRD.md` | `END_TO_END_CUSTOMER_JOURNEY.md`, `WORKFLOW_EVENT_MAPPING.md` | **ĐÃ HIỆU CHỈNH KHỚP** |
| `BR-XDOM-001` | Độc lập Schema phân vùng & Cấm SQL cross-domain Join | `CROSS_DOMAIN_DATA_AND_WORKFLOW_RECONCILIATION.md` | `ENTERPRISE_BUSINESS_DATA_MODEL.md` | **ĐỒNG BỘ 100%** |
| `BR-XDOM-002` | Bắt buộc phát tán sự kiện qua Transactional Outbox | `WORKFLOW_EVENT_MAPPING.md` | Migration `0013`, Tất cả Handlers | **ĐỒNG BỘ 100%** |
| `BR-XDOM-003` | Xử lý sự kiện Idempotent chống trùng lặp 24h | `BUSINESS_INTEGRATION_CONTRACTS.md` | Event Consumers | **ĐỒNG BỘ 100%** |
| `BR-XDOM-004` | Phân quyền 3 lớp Direct GBAC v4.2 & Data Scope | `COMMERCIAL_PERMISSION_MATRIX.md` | `CRM_PERMISSION_MATRIX.md`, Stored Procedures | **ĐỒNG BỘ 100%** |
| `BR-XDOM-005` | Bất biến lịch sử kiểm toán Append-Only | `AUDIT_SYSTEM_LOGS` | `CRM_DATA_MODEL.md`, `COMMERCIAL_DATA_MODEL.md` | **ĐỒNG BỘ 100%** |

---

## 3. MA TRẬN ĐỐI CHIẾU MÁY TRẠNG THÁI (STATE SYNCHRONIZATION MATRIX)

| Giai Đoạn Chuỗi Giá Trị | Trạng Thái Thực Thể Nguồn | Trạng Thái Thực Thể Đích | Sự Kiện Kích Hoạt Chuyển Giao | Ràng Buộc Kiểm Soát (Guards) |
|---|---|---|---|---|
| **1. Tiếp nhận $\rightarrow$ Phân bổ** | `Crm_Leads: New` | `Crm_Leads: Assigned` | `LeadAssignedEvent` | Đã chọn tư vấn viên đang trực ca |
| **2. Phân bổ $\rightarrow$ Tương tác** | `Crm_Leads: Assigned` | `Crm_Leads: Contacted` | `ConsultationLoggedEvent` | Có ít nhất 01 log cuộc gọi được lưu |
| **3. Khảo sát $\rightarrow$ Tiềm năng** | `Crm_Leads: Contacted` | `Crm_Leads: Qualified` | `LeadQualifiedEvent` | GPA $\ge 6.0$, gia đình đồng ý tài chính |
| **4. Tiềm năng $\rightarrow$ Cơ hội** | `Crm_Leads: Qualified` | `Crm_Opportunities: Discovery`| `LeadConvertedEvent` | Xác định thị trường và năm bay |
| **5. Cơ hội $\rightarrow$ Báo giá** | `Crm_Opportunities: ValueProposition` | `Com_Quotations: Draft` | `QuotationCreatedEvent` | Đã chọn Gói sản phẩm từ Catalog |
| **6. Duyệt Báo giá** | `Com_Quotations: PendingApproval`| `Com_Quotations: Approved` | `QuotationApprovedEvent` | Cấp thẩm quyền duyệt chiết khấu qua Workflow |
| **7. Gửi Báo giá $\rightarrow$ Đàm phán** | `Com_Quotations: Sent` | `Crm_Opportunities: ProposalSent`| User Action | File PDF đã được gửi cho khách |
| **8. Chốt Báo giá $\rightarrow$ Hợp đồng**| `Com_Quotations: Accepted` | `Com_Contracts: Draft` | `ConvertOpportunityToContract` | Có số CCCD học viên, định danh Party 360 |
| **9. Đóng Cơ hội Tuyển sinh** | `Com_Contracts: Draft` (Tạo xong) | `Crm_Opportunities: ClosedWon` | `OpportunityWonEvent` | Lead chuyển `Converted`, Opp chuyển `ClosedWon` (Thời điểm chính xác theo `DEC-13`: `PO_DECISION_REQUIRED`) |
| **10. Thẩm định $\rightarrow$ Ký kết** | `Com_Contracts: Approved` | `Com_Contracts: Signed` | `ContractSignedEvent` | Upload bản scan ký tươi SHA256 hoặc OTP |
| **11. Ký kết $\rightarrow$ Kích hoạt** | `Com_Contracts: Signed` | `Com_Contracts: Active` | `ContractActivatedEvent` | Kế toán xác nhận Phiếu thu tiền Đợt 1 |
| **12. Kích hoạt $\rightarrow$ Bàn giao** | `Com_Contracts: Active` | `Com_ServiceObligations: HandedOver`| `ObligationHandedOverEvent`| Mở khóa xếp lớp tiếng & tiếp nhận hồ sơ gốc |

