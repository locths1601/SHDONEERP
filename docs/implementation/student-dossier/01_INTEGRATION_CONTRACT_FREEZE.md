# SHD OneERP — 01. INTEGRATION CONTRACT FREEZE
## STU-01 Student Profile Management + ADM-01 Student Application & Dossier

**Phiên bản:** 1.0.0 (FROZEN)  
**Ngày đóng băng hợp đồng:** 2026-10-29  
**Người phê duyệt:** Master Orchestrator, SA-00..05  
**Cổng Gate G0:** `PASSED` — Tất cả hợp đồng giao tiếp giữa các phân hệ và sub-agents đã được chốt và có hiệu lực bắt buộc.

---

### 1. NGUYÊN TẮC RÀNG BUỘC CỐT LÕI (IMMUTABLE BOUNDARIES)

1. **Không tạo module lõi `STUDENT`**:
   - Dữ liệu định danh, cá nhân, ngày sinh, giới tính, liên hệ, giấy tờ tùy thân thuộc **độc quyền** `Party360` (`Party`, `Person`, `PartyRole`, `PartyIdentification`, `PartyContactMethod`).
   - `Student 360` / `Học viên & Hồ sơ` chỉ là **Workspace / Menu tổng hợp tại Frontend**.
2. **Quy tắc 1 Con người = 1 `PartyId`**:
   - Toàn hệ sinh thái SHD Corp sử dụng duy nhất một `PartyId` cho mỗi cá nhân.
   - Vai trò học viên được kích hoạt bằng `PartyRole` có `RoleType = 'Student'`.
3. **Quan hệ 1 Party -> N `StudentApplication`**:
   - Một cá nhân có thể nộp nhiều hồ sơ du học/tuyển sinh qua thời gian, tại nhiều thị trường hoặc pháp nhân khác nhau.
4. **Cô lập dữ liệu xuyên phân hệ (No Cross-Module DbSet Writes)**:
   - `AdmissionVisa` **không được ghi trực tiếp** vào `DbSet<Party>` hoặc các bảng `Party_*`.
   - `AdmissionVisa` tham chiếu `StudentPartyId` và tương tác qua `IPartyReadService` hoặc ID reference.

---

### 2. DANH MỤC MÃ QUYỀN DIRECT GBAC v4.2

| Mã quyền (Permission Code) | Tên quyền | Cấp độ Scope hỗ trợ | Mô tả hành động |
|---|---|---|---|
| `party.profile.view` | Xem hồ sơ định danh | Global, LegalEntity | Tra cứu danh sách, xem chi tiết Party/Học viên. |
| `party.profile.create` | Tạo mới định danh | Global, LegalEntity | Thêm mới hồ sơ cá nhân học viên/phụ huynh. |
| `party.profile.edit` | Sửa hồ sơ định danh | Global, LegalEntity | Sửa thông tin, CCCD, liên hệ, vai trò. |
| `admission.application.view` | Xem hồ sơ tuyển sinh | Global, LegalEntity, Branch | Xem danh sách hồ sơ du học, chi tiết tiến độ. |
| `admission.application.create` | Tạo hồ sơ du học | Global, LegalEntity, Branch | Mở đợt đăng ký hồ sơ du học (Draft). |
| `admission.application.edit` | Sửa hồ sơ du học | Global, LegalEntity, Branch | Cập nhật thông tin kỳ nhập học, chương trình, ghi chú. |
| `admission.dossier.view` | Xem checklist tài liệu | Global, LegalEntity, Branch | Xem danh mục chứng từ và trạng thái checklist. |
| `admission.dossier.upload` | Tải lên chứng từ | Global, LegalEntity, Branch | Đính kèm tệp chứng từ vào checklist hồ sơ. |
| `admission.dossier.verify` | Thẩm định tài liệu | Global, LegalEntity, Branch | Phê duyệt/từ chối chứng từ trong checklist. |

---

### 3. HỢP ĐỒNG API CONTRACTS (RESTFUL JSON)

#### 3.1. STU-01 — Party360 / Student Profile APIs

| Method | Endpoint | Action Permission | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/parties/students` | `party.profile.view` | Danh sách học viên phân trang (kèm PII masking nếu không phải quản trị viên). |
| `GET` | `/api/v1/parties/students/{partyId}` | `party.profile.view` | Chi tiết hồ sơ học viên: Person, Roles, Contacts, Identifications. |
| `POST` | `/api/v1/parties/students` | `party.profile.create` | Tạo nhanh hồ sơ học viên (tự động gắn vai trò `Student`). |
| `POST` | `/api/v1/parties/{partyId}/identifications` | `party.profile.edit` | Thêm giấy tờ tùy thân (CCCD, Hộ chiếu) cho học viên. |
| `POST` | `/api/v1/parties/{partyId}/relationships` | `party.profile.edit` | Khai báo quan hệ phụ huynh / người giám hộ (nếu có). |

#### 3.2. ADM-01 — Admission & Student Application APIs

| Method | Endpoint | Action Permission | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/admissions/applications` | `admission.application.view` | Danh sách hồ sơ tuyển sinh theo Scope (phân trang, lọc theo thị trường, trạng thái, học viên). |
| `GET` | `/api/v1/admissions/applications/{id}` | `admission.application.view` | Chi tiết hồ sơ tuyển sinh, tiến độ và thông tin tổng quát. |
| `GET` | `/api/v1/admissions/applications/by-student/{studentPartyId}` | `admission.application.view` | Danh sách toàn bộ các đợt hồ sơ du học của một học viên cụ thể. |
| `POST` | `/api/v1/admissions/applications` | `admission.application.create` | Tạo mới hồ sơ du học (trạng thái `Draft`). |
| `PUT` | `/api/v1/admissions/applications/{id}` | `admission.application.edit` | Cập nhật hồ sơ du học (chống ghi đè với `RowVersionBase64`). |
| `PUT` | `/api/v1/admissions/applications/{id}/status` | `admission.application.edit` | Chuyển đổi trạng thái hồ sơ (Draft -> Submitted -> UnderReview -> Accepted/Rejected). |

#### 3.3. ADM-01 — Dossier Checklist & Documents APIs

| Method | Endpoint | Action Permission | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/admissions/applications/{applicationId}/checklist` | `admission.dossier.view` | Danh sách checklist giấy tờ cần nộp kèm trạng thái từng mục. |
| `POST` | `/api/v1/admissions/applications/{applicationId}/checklist/init-default` | `admission.dossier.upload` | Khởi tạo bộ checklist chuẩn theo thị trường chỉ định. |
| `POST` | `/api/v1/admissions/applications/{applicationId}/checklist/{itemId}/upload` | `admission.dossier.upload` | Tải lên file đính kèm chứng từ (multipart/form-data), lưu qua `IDocumentStorageService`. |
| `GET` | `/api/v1/admissions/applications/{applicationId}/checklist/{itemId}/download` | `admission.dossier.view` | Tải xuống an toàn chứng từ đã đính kèm (kiểm tra quyền truy cập). |
| `PUT` | `/api/v1/admissions/applications/{applicationId}/checklist/{itemId}/verify` | `admission.dossier.verify` | Xác minh chứng từ (`Verified` hoặc `Rejected` kèm lý do). |

---

### 4. STORED PROCEDURE CONTRACTS (READ-SIDE VIA `ISpExecutor`)

1. **`sp_Party_Student_GetPagedList`**:
   - Tham số: `@PageNumber INT`, `@PageSize INT`, `@SearchTerm NVARCHAR(100)`, `@LegalEntityId UNIQUEIDENTIFIER`, `@Status NVARCHAR(30)`, `@SortBy NVARCHAR(50)`, `@SortOrder NVARCHAR(10)`, `@CurrentUserId UNIQUEIDENTIFIER`, `@TotalCount INT OUTPUT`.
   - Bảo mật: Tham số `@CurrentUserId` bắt buộc. Fail-closed: Nếu người dùng không có quyền hoặc ngoài phạm vi LegalEntity, trả về 0 dòng.
   - PII Masking: Số CCCD/Hộ chiếu và SĐT được mask (ví dụ: `090****123`, `001099******`) trừ khi người dùng là `ADMINISTRATORS` hoặc có quyền đặc biệt.
2. **`sp_Party_Student_GetDetailById`**:
   - Trả về 4 Result Sets: (1) Party & Person Info, (2) Active Roles, (3) Contact Methods, (4) Identifications.
3. **`sp_Admission_Application_GetPagedList`**:
   - Tham số: `@PageNumber INT`, `@PageSize INT`, `@SearchTerm NVARCHAR(100)`, `@StudentPartyId UNIQUEIDENTIFIER`, `@LegalEntityId UNIQUEIDENTIFIER`, `@TargetMarket NVARCHAR(50)`, `@Status NVARCHAR(30)`, `@CurrentUserId UNIQUEIDENTIFIER`, `@TotalCount INT OUTPUT`.
   - Kết hợp Data Scope qua `Org_LegalEntities` của user group memberships.
4. **`sp_Admission_Application_GetDetailById`**:
   - Trả về thông tin chi tiết hồ sơ, thông tin tóm tắt học viên từ `Party_Persons`, pháp nhân tiếp nhận và tiến độ hồ sơ.
5. **`sp_Admission_Checklist_GetByApplicationId`**:
   - Trả về danh sách mục checklist kèm tệp đính kèm (`Doc_Documents`) đã liên kết.

---

### 5. DỮ LIỆU ĐĂNG KÝ HỆ THỐNG (FEATURE REGISTRY & MODULES)

- Module `PARTY360` (đã đăng ký trong `20261027_0012`).
  - Thêm Feature `party360.student_profile` ("Quản lý thông tin học viên").
- Module `ADMISSIONVISA` ("Phân hệ Tuyển sinh & Quản lý Hồ sơ Du học").
  - Feature `admission.student_application` ("Quản lý Hồ sơ Đăng ký Du học").
  - Feature `admission.document_checklist` ("Checklist & Thẩm định Hồ sơ Chứng từ").

---

### 6. FRONTEND ROUTING & WORKSPACE CONTRACT

- Menu gốc: `Học viên & Hồ sơ` (Đường dẫn `/students`).
- Sub-views:
  - `/students`: Danh sách học viên toàn hệ sinh thái (`StudentDirectoryPage`).
  - `/students/:id`: Màn hình `Student 360 Detail` với các tabs:
    - Tab 1: `Tổng quan & Lý lịch` (`OverviewTab`)
    - Tab 2: `Định danh & Liên hệ` (`IdentificationsContactsTab`)
    - Tab 3: `Hồ sơ du học` (`ApplicationsTab` - Danh sách các hồ sơ du học của học viên)
    - Tab 4: `Checklist chứng từ` (`ChecklistDossierTab` - Chi tiết hồ sơ tuyển sinh đang chọn)
- UX Gates: Có đầy đủ Loading Skeleton, EmptyState khi chưa có bản ghi, Error state có traceId & Retry, 403 Forbidden khi thiếu quyền, ConfirmDialog khi cập nhật/xóa.

