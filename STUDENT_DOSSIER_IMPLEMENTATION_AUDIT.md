# SHD OneERP — BÁO CÁO KIỂM TOÁN HIỆN TRẠNG TRIỂN KHAI STU-01 & ADM-01
## (STUDENT DOSSIER IMPLEMENTATION AUDIT)

**Vai trò kiểm toán:** Master Orchestrator Agent  
**Dự án:** SHD OneERP — Enterprise Multi-Company Platform  
**Ngày kiểm toán:** 2026-10-29  
**Mục tiêu:** Rà soát thực tế mã nguồn, cơ sở dữ liệu, Stored Procedures, API, UI và bộ kiểm thử của hai gói chức năng **STU-01 (Student Profile Management)** và **ADM-01 (Student Application & Dossier Management)**; đối chiếu với tài liệu nghiệp vụ thực tế của SHD Korea nhằm xác định chính xác hiện trạng và các điểm chưa hoàn thiện.

---

## 1. THANG ĐÁNH GIÁ KIỂM TOÁN (AUDIT CLASSIFICATION)

Mỗi chức năng được phân loại theo 4 trạng thái nghiêm ngặt:
1. **`IMPLEMENTED & VERIFIED`**: Đã được hiện thực hóa đầy đủ trong mã nguồn (Domain, Application, Migration SQL, Stored Procedure, API Controller, Frontend UI) và đã vượt qua automated tests thực tế.
2. **`IMPLEMENTED BUT INCOMPLETE`**: Đã có cấu trúc mã nguồn, entity hoặc giao diện cơ bản nhưng còn thiếu các trường dữ liệu đặc thù, thiếu ràng buộc nghiệp vụ hoặc chưa phản ánh đủ quy trình thực tế của SHD Korea.
3. **`NOT IMPLEMENTED`**: Chưa có bất kỳ cấu trúc bảng, service, API hoặc giao diện nào trong mã nguồn hiện tại.
4. **`BLOCKED BY BUSINESS DECISION`**: Đã xác định nhu cầu nhưng cần Product Owner/Hội đồng nghiệp vụ phê duyệt chính sách hoặc lựa chọn phương án kiến trúc trước khi triển khai.

---

## 2. BẢNG TỔNG HỢP KIỂM TOÁN CHỨC NĂNG (FEATURE-BY-FEATURE AUDIT MATRIX)

### 2.1. Phân hệ Quản lý Hồ sơ Học viên (STU-01 — Party360 Domain)

| Mã | Chức năng nghiệp vụ | Hiện trạng mã nguồn | Bằng chứng Source Code & Test | Đánh giá kiểm toán |
|---|---|---|---|---|
| **STU-01.1** | Định danh Party học viên dùng chung (`PartyType=Person`, vai trò `Student`) | Tái sử dụng `Party_Parties`, `Party_Persons`, `Party_PartyRoles`. Không nhân bản Person. | [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L7-L83), [PartyTests.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Domain/PartyTests.cs#L11-L36) | `IMPLEMENTED & VERIFIED` |
| **STU-01.2** | Tra cứu danh bạ học viên phân trang (Student Directory) | SP `sp_Party_Student_GetPagedList` với Direct GBAC v4.2, phân quyền fail-closed và che dữ liệu PII (`party.pii.view`). | [Migration 20261029_0015](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L330-L558), [PartiesController.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Api/Controllers/PartiesController.cs#L148-L154) | `IMPLEMENTED & VERIFIED` |
| **STU-01.3** | Màn hình danh sách học viên & Tiếp nhận học viên mới (Frontend) | `StudentDirectoryPage.tsx`, `StudentList.tsx`, drawer `StudentCreateDrawer.tsx` liên kết API thật. | [StudentDirectoryPage.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/pages/studentWorkspace/StudentDirectoryPage.tsx), [StudentCreateDrawer.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentCreateDrawer.tsx) | `IMPLEMENTED & VERIFIED` |
| **STU-01.4** | Quản lý giấy tờ định danh (CCCD, Hộ chiếu) | Bảng `Party_PartyIdentifications`, API POST `api/v1/parties/{id}/identifications`, Tab `StudentIdentificationsTab.tsx`. | [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L279-L302), [StudentIdentificationsTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentIdentificationsTab.tsx) | `IMPLEMENTED & VERIFIED` |
| **STU-01.5** | Quản lý thân nhân, người bảo lãnh tài chính (Guarantor / Sponsor) | Bảng `Party_PartyRelationships`, các cờ `IsEmergencyContact`, `IsLegalGuardian`, `IsFinancialSponsor`, nghề nghiệp, CCCD, SĐT. | [Migration 20261029_0015](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L207-L236), [StudentOverviewTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentOverviewTab.tsx#L21-L74) | `IMPLEMENTED BUT INCOMPLETE` *(Thiếu tổng thu nhập, tài sản sổ đỏ, cơ quan công tác)* |
| **STU-01.6** | Hồ sơ học vấn chi tiết (THPT, GPA lớp 10/11/12/3 năm, số buổi nghỉ học cấp 3) | Chưa có schema lưu trữ trường cấp 3, năm tốt nghiệp, điểm GPA 3 năm và số buổi nghỉ học cấp 3. | Không có trong `Party_Persons` hoặc `Adm_StudentApplications`. | `NOT IMPLEMENTED` |
| **STU-01.7** | Trạng thái đào tạo học viên (Đang học tiếng, TOPIK I, TOPIK II, Bảo lưu, Rút hồ sơ) | Bảng `Party_Parties` chỉ có trạng thái hệ thống chung (`Active`/`Suspended`). Chưa phân tách Student Training Status. | [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L11) | `IMPLEMENTED BUT INCOMPLETE` |

---

### 2.2. Phân hệ Hồ sơ Đăng ký Tuyển sinh & Du học (ADM-01 — AdmissionVisa Domain)

| Mã | Chức năng nghiệp vụ | Hiện trạng mã nguồn | Bằng chứng Source Code & Test | Đánh giá kiểm toán |
|---|---|---|---|---|
| **ADM-01.1** | Khởi tạo hồ sơ du học độc lập (1 Party có nhiều Applications) | Bảng `Adm_StudentApplications`, hỗ trợ tạo nhiều hồ sơ trên cùng `StudentPartyId` ở các LegalEntity khác nhau. | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L7-L73), [AdmissionValidationTests.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Application/AdmissionValidationTests.cs#L96-L113) | `IMPLEMENTED & VERIFIED` |
| **ADM-01.2** | Đăng ký Module, Features & Permissions trong System Registry (FND-04) | Module `ADMISSIONVISA`, 2 Features (`admission.student_application`, `admission.document_checklist`), 7 Action Permissions. | [Migration 20261029_0015](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L23-L201) | `IMPLEMENTED & VERIFIED` |
| **ADM-01.3** | Tra cứu danh sách hồ sơ tuyển sinh phân trang (SP fail-closed scope) | SP `sp_Admission_Application_GetPagedList` lọc theo `TargetMarket`, `IntakeTerm`, `Status`, `LegalEntityId`. | [Migration 20261029_0015](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L652-L841) | `IMPLEMENTED & VERIFIED` |
| **ADM-01.4** | Quản lý kỳ tuyển sinh (Intake Term) | Lưu chuỗi tự do `IntakeTerm` (`NVARCHAR(50)`). Chưa có danh mục 4 mùa chuẩn (Tháng 3, 6, 9, 12) và mốc tiến độ theo kỳ. | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L23), [ApplicationCreateDrawer.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/ApplicationCreateDrawer.tsx#L23) | `IMPLEMENTED BUT INCOMPLETE` |
| **ADM-01.5** | Trạng thái vòng đời hồ sơ du học (Application Status Lifecycle) | Sử dụng 6 trạng thái thô: `Draft`, `Submitted`, `UnderReview`, `Accepted`, `Rejected`, `Withdrawn`. Chưa ánh xạ 7 giai đoạn SHD Korea. | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L25,L96-L100), [ApplicationDetailModal.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/ApplicationDetailModal.tsx#L133-L149) | `IMPLEMENTED BUT INCOMPLETE` |
| **ADM-01.6** | Tích hợp State Machine với FND-03 Workflow Engine | FND-03 Engine đã có sẵn nhưng `StudentApplication` chưa kích hoạt instance, chuyển trạng thái hoàn toàn qua update trực tiếp. | [StudentApplicationWriteService.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/AdmissionVisa/Services/StudentApplicationWriteService.cs#L104-L141) | `IMPLEMENTED BUT INCOMPLETE` |
| **ADM-01.7** | Phân công nhân sự thụ lý (Assignment) | Có 1 trường `AssignedUserId`. Chưa phân tách Người tư vấn tuyển sinh (`NTV`) và Chuyên viên xử lý hồ sơ (`Nhân viên xử lý`). | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L27) | `IMPLEMENTED BUT INCOMPLETE` |
| **ADM-01.8** | Khởi tạo danh mục checklist giấy tờ du học | Tự động sinh 9 hạng mục tài liệu cơ bản khi tạo hồ sơ du học. | [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L128-L141) | `IMPLEMENTED BUT INCOMPLETE` *(Checklist hardcoded, chưa phân 3 giai đoạn: Đầu vào - Trường - Lãnh sự)* |
| **ADM-01.9** | Số hóa & Lưu trữ tệp scan bảo mật (`Doc_Documents`, SHA256) | `LocalFileSystemDocumentStorageService` lưu tệp vật lý, kiểm tra định dạng, tính SHA256, phân quyền tải tệp. | [LocalFileSystemDocumentStorageService.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Services/LocalFileSystemDocumentStorageService.cs), [ChecklistsController.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Api/Controllers/ChecklistsController.cs#L115-L165) | `IMPLEMENTED & VERIFIED` |
| **ADM-01.10** | Thẩm định & Từ chối từng hạng mục tài liệu (Verify / Reject) | API `verify` và `reject` (kèm `rejectionReason`), cập nhật `VerifiedByUserId`, `VerifiedAtUtc`, optimistic concurrency 409. | [ChecklistItem.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/ChecklistItem.cs#L60-L88), [AdmissionValidationTests.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Tests/Application/AdmissionValidationTests.cs#L115-L134) | `IMPLEMENTED & VERIFIED` |
| **ADM-01.11** | Kiểm tra chéo hồ sơ (Cross-Check / 4-Eyes Principle) | Chưa có cơ chế ngăn chặn người soạn thảo tự thẩm định hồ sơ của mình; chưa có mốc kiểm duyệt "Sẵn sàng gửi dịch". | [ChecklistWriteService.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/AdmissionVisa/Services/ChecklistWriteService.cs#L45-L68) | `IMPLEMENTED BUT INCOMPLETE` |
| **ADM-01.12** | Theo dõi dịch thuật & đơn vị dịch thuật (Translation Pipeline) | Chưa có quản lý gói dịch thuật, đơn vị dịch (An Phúc), ngày gửi, ngày hẹn trả, tệp bản dịch đính kèm. | Chưa có bảng hoặc trường dữ liệu nào. | `NOT IMPLEMENTED` |
| **ADM-01.13** | Theo dõi công chứng & hợp pháp hóa lãnh sự (Tem vàng / Tem tím) | Chưa có theo dõi xin tem vàng Sở Ngoại vụ (30.000đ), xin tem tím Lãnh sự quán (4 USD, hạn 1 năm), ngày hẹn, ngày nhận. | Chưa có bảng hoặc trường dữ liệu nào. | `NOT IMPLEMENTED` |
| **ADM-01.14** | Quản lý nguyện vọng nộp nhiều trường, phỏng vấn & Invoice học phí | Chưa có bảng danh sách trường apply, bài viết GTBT & KHHT, lịch phỏng vấn trường, quản lý Invoice học phí (KRW/VND). | Chỉ có 1 trường chuỗi `ProgramName`. | `NOT IMPLEMENTED` |
| **ADM-01.15** | Hồ sơ Lãnh sự: Sổ đóng băng K-Study (10M/8M won) & Khám lao | Chưa có quản lý tài khoản đóng băng theo vùng (10 triệu won khu vực Seoul/Gyeonggi, 8 triệu won khu vực khác), khám lao Phước An 2. | Chỉ có checklist generic `FINANCIAL_PROOF`, `HEALTH_CERT`. | `NOT IMPLEMENTED` |
| **ADM-01.16** | Nộp hồ sơ Visa tại KVAC HCMC & Theo dõi 20 ngày làm việc | Chưa có mã hồ sơ KVAC, ngày nộp, hẹn trả kết quả 20 ngày, tra cứu trạng thái portal KVAC. | Chưa có bảng hoặc trường dữ liệu nào. | `NOT IMPLEMENTED` |
| **ADM-01.17** | Xuất cảnh, bàn giao hồ sơ gốc & theo dõi sau nhập cảnh | Chưa có biên bản bàn giao hồ sơ tại sân bay, lịch bay, xác nhận nhập cảnh và hoàn tất nhập học tại Hàn Quốc. | Chưa có bảng hoặc trường dữ liệu nào. | `NOT IMPLEMENTED` |
| **ADM-01.18** | Quản lý thời hạn hiệu lực tài liệu 3 tháng (3-Month Document Expiry Alert) | Chưa có cơ chế cảnh báo giấy tờ lãnh sự quá hạn 3 tháng (xác nhận cư trú, cam kết bảo lãnh, xác nhận thu nhập, bản dịch). | Cần chính sách phê duyệt cơ chế tính hạn. | `BLOCKED BY BUSINESS DECISION` |

---

## 3. ĐÁNH GIÁ CHI TIẾT TỪNG PHÂN TẦNG KỸ THUẬT

### 3.1. Database Schema & Migrations
- **Thành phần đã hoàn thành:**
  - `database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` tạo chuẩn 4 bảng: `Party_PartyRelationships`, `Adm_StudentApplications`, `Adm_ChecklistItems`, `Adm_ApplicationDocumentLinks`.
  - Có đầy đủ Foreign Keys, Constraints (`DF_...`, `UQ_...`), Non-Clustered Indexes tối ưu, trường kiểm soát `RowVersion`, `CreatedAtUtc`, `IsDeleted`.
  - Tích hợp 7 Stored Procedures đọc dữ liệu với Direct GBAC v4.2 fail-closed.
- **Hạn chế kỹ thuật phát hiện:**
  - Bảng `Party_PartyRelationships` trong SQL Migration có các cột riêng: `RelatedPersonName`, `PhoneNumber`, `Email`, `NationalId`, `Occupation`, `Address`, `IsFinancialSponsor`... nhưng trong Domain Entity [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L304-L331) lại chỉ có cấu trúc trừu tượng `FromPartyId` và `ToPartyId`. Hiện tại EF Core đang lưu dữ liệu quan hệ qua `PartyWriteService` sử dụng mapping trực tiếp, cần đồng bộ lại Domain Entity model để bảo đảm tính toàn vẹn hướng đối tượng DDD.

### 3.2. Backend Application Services & Stored Procedures
- **CQRS Split tuân thủ xuất sắc:**
  - Nhánh GHI (Write): Đi qua `PartyWriteService`, `StudentApplicationWriteService`, `ChecklistWriteService` với EF Core, kiểm soát quyền qua `IPermissionResolver`, concurrency check 409 qua `RowVersion`.
  - Nhánh ĐỌC (Read): Toàn bộ đi qua Stored Procedures (`sp_Party_Student_GetPagedList`, `sp_Admission_Application_GetPagedList`, `sp_Admission_Checklist_GetByApplicationId`) thông qua `ISpExecutor`, không dùng LINQ hay raw SQL trực tiếp.
  - Fail-closed: Mọi SP đều từ chối trả dữ liệu (trả về 0 dòng) nếu `@CurrentUserId IS NULL` hoặc người dùng không có LegalEntity scope hợp lệ.
- **Hạn chế:**
  - Việc chuyển trạng thái hồ sơ tuyển sinh chưa gọi qua `IWorkflowEngine` (FND-03), làm mất đi tính năng ghi vết `WorkflowTransitionHistory` và phát sự kiện `DomainEvent` qua Outbox.

### 3.3. Frontend (React 18, TypeScript Strict, Tailwind CSS)
- **Kiến trúc UI hoàn chỉnh:**
  - Giao diện đặt tại `frontend/src/features/studentWorkspace/` và `frontend/src/pages/studentWorkspace/`.
  - Bao gồm: Student Directory, Tiếp nhận học viên mới (Drawer), Màn hình Student 360 (Tab Tổng quan, Tab Giấy tờ định danh, Tab Hồ sơ tuyển sinh & Checklist).
  - Tích hợp TanStack Query với cache invalidation chính xác sau mỗi thao tác tạo/sửa/thẩm định.
  - Xử lý đầy đủ các trạng thái UI: Loading spinner, Empty state, Rejection modal, Upload progress, Badge trạng thái.
  - Vượt qua `npm run build` (`tsc && vite build`) với 0 lỗi TypeScript.
- **Hạn chế:**
  - Giao diện mới chỉ hiển thị thanh trạng thái hồ sơ du học 6 bước cơ bản (`Draft` -> `Submitted` -> `UnderReview` -> `Accepted`/`Rejected`), chưa phản ánh được timeline 7 giai đoạn thực tế và chưa có bảng chi tiết dịch thuật/công chứng/hợp pháp hóa.

### 3.4. Automated Tests
- Toàn bộ **152 tests** trong `backend/ShdOneErp.Tests` đều **PASS 100%**:
  - `AdmissionValidationTests`: Kiểm tra tính hợp lệ dữ liệu tạo hồ sơ, optimistic concurrency `RowVersion`, thẩm định/từ chối checklist, tự động tạo checklist tiêu chuẩn.
  - `PartyValidationTests` & `PartyTests`: Kiểm tra toàn vẹn định danh Party 360.
  - Các tests GBAC, ScopeResolver, Workflow, Outbox đều chạy ổn định.

---

## 4. KẾT LUẬN KIỂM TOÁN

1. **Khẳng định nền tảng vững chắc:** STU-01 và ADM-01 đã được triển khai bài bản theo đúng chuẩn kiến trúc Clean Architecture, Modular Monolith và Persistent CQRS Split của SHD OneERP. Không có tình trạng duplicate domain hay phá vỡ GBAC.
2. **Xác định chính xác phạm vi còn thiếu:** Hệ thống hiện tại là **bộ khung quản lý hồ sơ du học tổng quát (Generic Application & Checklist Engine)**, nhưng chưa có các module nghiệp vụ chuyên sâu đặc thù của thị trường Hàn Quốc theo tài liệu SHD Korea (7 giai đoạn xử lý, 3 lớp checklist riêng biệt, quy trình dịch thuật - công chứng - tem vàng/tem tím, tài chính K-study, khám lao, KVAC và xuất cảnh).
3. **Định hướng tiếp theo:** Cần giữ nguyên cấu trúc nền tảng đã hoàn thành; triển khai phần mở rộng đặc thù của SHD Korea dưới dạng **Cấu hình nghiệp vụ theo Thị trường (Market Configuration)** và các bảng mở rộng bổ trợ, tuyệt đối không hardcode làm ảnh hưởng các thị trường khác (Đức, Nhật, Úc, v.v.).

