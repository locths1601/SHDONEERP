# SHD OneERP — MA TRẬN KHOẢNG TRỐNG NGHIỆP VỤ SHD KOREA
## (SHD KOREA BUSINESS GAP MATRIX)

**Tài liệu tham chiếu nguồn:**
1. `docs/FileSHD/QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` (Sheets: *DS học viên*, *Hồ sơ chi tiết*, *Checklist*, *Invoice & Thanh toán*, *Danh mục*, *Dasboard*)
2. `docs/FileSHD/SHD-KR-HS-01 - Quy trình tiếp nhận, xử lý và quản lý hồ sơ du học Hàn Quốc.docx` (Các mục 1.0 - 2.7, Phụ lục 1A, 2A, 3A, 4A)
3. `docs/FileSHD/SHD-KR-HS-02 - Quy trình tổng quan xử lý hồ sơ Hàn Quốc (1).docx` (Các giai đoạn I - VIII)
4. Mã nguồn và migrations hiện tại: `database/migrations/20261029_0015_...sql`, `backend/ShdOneErp.*`, `frontend/src/features/studentWorkspace/*`

---

## MA TRẬN ĐỐI CHIẾU CHI TIẾT (GAP MATRIX)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MỨC ĐỘ ƯU TIÊN:                                                                                        │
│ [CRITICAL] : Ảnh hưởng trực tiếp đến tính pháp lý hồ sơ visa, chặn dòng công việc chính của Phòng HS. │
│ [HIGH]     : Thiếu thông tin bắt buộc đối soát tài chính, trường Hàn Quốc hoặc cơ quan lãnh sự.       │
│ [MEDIUM]   : Tối ưu hóa vận hành, theo dõi tiến độ tự động, hạn chế sai sót tác nghiệp thủ công.       │
│ [LOW]      : Tiện ích mở rộng UI/UX, báo cáo trực quan nâng cao.                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### GAP-KR-01: Thông tin học vấn chi tiết (GPA 3 năm cấp 3 & Số buổi nghỉ học)

- **Nguồn tài liệu:**
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột I, J, K, L, M, N, O, P.
  - `SHD-KR-HS-01` — Mục 2.4 (Câu hỏi phỏng vấn số 309, 310).
- **Chức năng đang có:**
  - Hệ thống chỉ lưu thông tin cá nhân cơ bản của học viên trong `Party_Persons` (Họ tên, Ngày sinh, Giới tính, Quốc tịch).
- **Bằng chứng source code:**
  - [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L136-L179): Lớp `Person` chỉ có `FirstName`, `LastName`, `DateOfBirth`, `Gender`, `Nationality`.
  - [20261029_0015...sql](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L240-L274): Bảng `Adm_StudentApplications` không có cột lưu thông tin học bạ.
- **Khoảng trống (Gap):**
  - Thiếu hoàn toàn các trường dữ liệu mang tính sống còn khi thẩm định hồ sơ du học Hàn Quốc:
    1. Tên trường THPT (`Trường THPT`) và Năm tốt nghiệp THPT (`Năm tốt nghiệp THPT`).
    2. Điểm GPA Lớp 10, Lớp 11, Lớp 12 và GPA trung bình 3 năm (`GPA 3 năm`).
    3. Số buổi nghỉ học cấp 3 (`Số buổi nghỉ`): Trường Hàn Quốc và Cục Xuất nhập cảnh Hàn Quốc đánh giá cực kỳ khắt khe tiêu chí này (nghỉ quá số buổi quy định sẽ bị từ chối cấp thư mời hoặc visa).
    4. Thông tin Trường Cao đẳng/Đại học nếu học viên đã tốt nghiệp hoặc đang theo học.
- **Mức độ ưu tiên:** `CRITICAL`
- **Đề xuất thay đổi:**
  - Tạo bảng mở rộng `Adm_StudentAcademicProfiles` (1-1 với `Adm_StudentApplications` hoặc gắn theo `PartyId` vai trò `Student`) để lưu trữ lịch sử học tập, GPA từng năm, số ngày vắng mặt cấp 3 và năm tốt nghiệp.
  - Cập nhật SP `sp_Admission_Application_GetDetailById` và giao diện Form/Detail hồ sơ học viên.
- **Quyết định cần PO xác nhận:**
  - PO quyết định: Lưu hồ sơ học vấn theo từng lần `StudentApplication` (để bảo lưu lịch sử tại thời điểm nộp) hay lưu chung vào `Party_Persons` (dùng chung cho mọi hồ sơ sau này)? *Khuyến nghị: Lưu vào bảng mở rộng `Adm_StudentAcademicProfiles` tham chiếu `StudentApplicationId` để đảm bảo tính bất biến của hồ sơ nộp.*

---

### GAP-KR-02: Cơ cấu tài chính người bảo lãnh & Tài sản đảm bảo (Sổ đỏ, Thu nhập)

- **Nguồn tài liệu:**
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột Q, R, S, T, U, V; Sheet *Hồ sơ chi tiết*, Cột J, N (File Dựng thu nhập - Cam kết bảo lãnh).
  - `SHD-KR-HS-01` — Mục 2.2.1, 2.5.1, Phụ lục 3A.
- **Chức năng đang có:**
  - Bảng `Party_PartyRelationships` đã có các trường: `RelatedPersonName`, `PhoneNumber`, `NationalId`, `Occupation`, cờ boolean `IsFinancialSponsor`.
- **Bằng chứng source code:**
  - [20261029_0015...sql](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L210-L232): Schema `Party_PartyRelationships`.
  - [StudentOverviewTab.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/StudentOverviewTab.tsx#L23-L35): Form thêm thân nhân chỉ có trường text `Occupation` và tickbox `IsFinancialSponsor`.
- **Khoảng trống (Gap):**
  - Thiếu trường lưu mức thu nhập hàng tháng (`Tổng thu nhập`, VD: `71.650.333 VNĐ/tháng`).
  - Thiếu cơ chế theo dõi tài sản bảo lãnh: Số lượng sổ đỏ (`Sổ đỏ 1, 2, 3`), quyền sở hữu (Bố mẹ, hay Đất ông bà kèm giấy khai sinh chứng minh quan hệ, hoặc Hợp đồng thuê đất).
  - Thiếu liên kết hồ sơ nghề nghiệp: Giấy phép ĐKKD + Thuế 3 tháng đối với hộ kinh doanh; HĐLĐ + Bảng lương + VssID tiếng Anh đối với nhân viên công ty; Giấy xác nhận canh tác nuôi trồng đối với hộ làm nông nghiệp.
  - Thiếu theo dõi trạng thái tệp: "File Dựng thu nhập - Cam kết bảo lãnh (Hồ sơ trường)" và "File Dựng thu nhập - Cam kết bảo lãnh (Hồ sơ visa)".
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Bổ sung các cột vào `Party_PartyRelationships` hoặc bảng mở rộng `Adm_ApplicationFinancialProfiles`: `MonthlyIncomeAmount`, `IncomeSourceType` (BusinessOwner, SalariedEmployee, Agriculture, Other), `LandCertificateCount`, `HasMortgageInBank` (Sổ đỏ đang thế chấp ngân hàng).
  - Cho phép đính kèm tệp văn bản giải trình thu nhập và cam kết bảo lãnh được số hóa.
- **Quyết định cần PO xác nhận:**
  - Xác nhận hạn mức thu nhập tối thiểu khuyến nghị của SHD Korea cho từng khu vực trường Hàn Quốc (Seoul/Vùng ven/Busan) để đưa ra cảnh báo tự động trên hệ thống khi chuyên viên nhập liệu.

---

### GAP-KR-03: Cấu hình phân loại Checklist 3 giai đoạn (Đầu vào — Trường — Lãnh sự)

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Phụ lục 1A (Checklist đầu vào: 11 mục), Phụ lục 2A (Checklist trường: 11 mục), Phụ lục 3A (Checklist lãnh sự: 14 mục).
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *Checklist* & Sheet *Danh mục* (Cột H: 25 loại giấy tờ).
- **Chức năng đang có:**
  - Khởi tạo tự động 9 hạng mục checklist cơ bản trong `StudentApplication.InitializeStandardChecklist()`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L128-L141): Danh sách 9 items hardcode: `PASSPORT`, `ID_CARD`, `BIRTH_CERT`, `ACADEMIC_TRANSCRIPT`, `GRADUATION_CERT`, `FINANCIAL_PROOF`, `HEALTH_CERT`, `PHOTO_PORTRAIT`, `CRIMINAL_RECORD`.
  - [ChecklistItem.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/ChecklistItem.cs#L12): Cột `Category` generic (`Identity`, `Academic`, `Financial`, `Medical`, `Legal`, `Other`).
- **Khoảng trống (Gap):**
  - Không thể phân biệt tài liệu thuộc giai đoạn nào trong 3 giai đoạn độc lập:
    - Giai đoạn 1: Hồ sơ tiếp nhận ban đầu (học viên nộp trong 2 tuần).
    - Giai đoạn 2: Hồ sơ hoàn thiện nộp trường đại học Hàn Quốc.
    - Giai đoạn 3: Hồ sơ nộp Lãnh sự quán / KVAC (yêu cầu nghiêm ngặt trong 3 tháng).
  - Thiếu các loại giấy tờ đặc thù của Hàn Quốc: Xác nhận cư trú (ghi đủ thành viên), Sổ đỏ công chứng 3 tháng, Giấy phép ĐKKD & Thuế 3 tháng, HĐLĐ & BHXH VssID tiếng Anh, Giấy khám lao cơ sở chỉ định, Sổ đóng băng K-Study (Shinhan/Woori Bank).
- **Mức độ ưu tiên:** `CRITICAL`
- **Đề xuất thay đổi:**
  - Bổ sung cột `Phase` (`Intake`, `SchoolDossier`, `ConsulateDossier`) vào `Adm_ChecklistItems`.
  - Thiết kế bảng mẫu cấu hình `Adm_MarketChecklistTemplates` (`TargetMarket`, `Phase`, `ItemCode`, `ItemName`, `IsRequired`, `ValidityDays`, `SortOrder`) để hỗ trợ cấu hình động theo thị trường, không hardcode vào C# Domain Entity.
- **Quyết định cần PO xác nhận:**
  - Khi học viên nộp 1 tài liệu ở Giai đoạn Đầu vào (ví dụ Hộ chiếu hoặc Khai sinh), hệ thống tự động kế thừa và link sang Checklist Trường và Checklist Lãnh sự hay yêu cầu thẩm định lại ở từng giai đoạn? *Khuyến nghị: Tự động link tệp, nhưng trạng thái thẩm định (Verified) phải thực hiện độc lập ở từng giai đoạn vì yêu cầu về thời hạn công chứng khác nhau.*

---

### GAP-KR-04: Quy trình 7 giai đoạn & 13 mốc tiến độ xử lý hồ sơ

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.0 (Sơ đồ tổng quan 7 giai đoạn), Bảng kế hoạch theo kỳ nhập học.
  - `SHD-KR-HS-02` — Mục I.3 (Sơ đồ tổng quan theo tuần: Tuần 1-2, Tuần 3, Tuần 9, Tuần 10, Tuần 11, Tuần 14, Tuần 18-20).
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *Danh mục*, Cột B (13 trạng thái hồ sơ).
- **Chức năng đang có:**
  - 6 trạng thái cơ bản: `Draft`, `Submitted`, `UnderReview`, `Accepted`, `Rejected`, `Withdrawn`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L25,L96-L100): Status check chỉ gồm 6 giá trị hardcode.
  - [ApplicationDetailModal.tsx](file:///F:/MyProjectSHD/SHDONEERP/frontend/src/features/studentWorkspace/components/ApplicationDetailModal.tsx#L133-L149): UI chỉ hiển thị 6 badge đơn giản.
- **Khoảng trống (Gap):**
  - Không phản ánh được 7 giai đoạn nghiệp vụ:
    - 01: Tiếp nhận hồ sơ đầu vào (Tuần 1-2)
    - 02: Xử lý hồ sơ trường (Tuần 3)
    - 03: Nộp hồ sơ trường (Tuần 9)
    - 04: Phỏng vấn trường (Tuần 10)
    - 05: Xử lý hồ sơ lãnh sự (Tuần 11)
    - 06: Nộp Visa & Phỏng vấn Lãnh sự (Tuần 14)
    - 07: Xuất cảnh & Bàn giao (Tuần 18-20)
  - Không phản ánh được 13 mốc nghiệp vụ tác nghiệp hàng ngày của nhân viên hồ sơ:
    *Thu hồ sơ -> Kiểm tra hồ sơ -> Dịch thuật -> Công chứng -> Nộp trường -> Chờ Invoice -> Đóng học phí -> Nhận COA -> Xin Visa -> Có Visa -> Book vé -> Đào tạo trước bay -> Đã xuất cảnh.*
  - Tách rời hoàn toàn khỏi `IWorkflowEngine` (FND-03).
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Tách bạch rõ 2 khái niệm trong `Adm_StudentApplications`:
    - `WorkflowState`: Quản lý qua FND-03 Workflow Engine (`KOREA_STUDY_ABROAD_V1`).
    - `OperationalStage`: Phản ánh 7 giai đoạn thực tế và % tiến độ hoàn thành (`CompletionPercentage`).
  - Đăng ký Workflow Definition cho thị trường Hàn Quốc vào FND-03, kích hoạt `WorkflowInstance` khi hồ sơ chuyển từ `Draft` sang `Active`.
- **Quyết định cần PO xác nhận:**
  - Chuyển giai đoạn (Stage transition) là bắt buộc tuần tự nghiêm ngặt (Strict Sequential) hay cho phép xử lý song song các hạng mục (Parallel Flex) khi có học viên hồ sơ đặc cách/nhanh? *Khuyến nghị: Cho phép chuyển giai đoạn linh hoạt dựa trên điều kiện checklist tiên quyết (Prerequisite Check).*

---

### GAP-KR-05: Kiểm tra chéo hồ sơ & Nguyên tắc 4 mắt (Four-Eyes Principle)

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 1.2 (Nguyên tắc bắt buộc số 3: *"Hồ sơ phải được kiểm tra chéo trước khi gửi trường, dịch thuật, cơ quan chứng nhận hoặc cơ quan tiếp nhận visa"*); Mục 2.2.1 (*"Nhân sự hồ sơ kiểm tra chéo hồ sơ của nhau. Nếu đạt: xác nhận 'Sẵn sàng gửi dịch'. Nếu chưa đạt: trả lại người phụ trách chỉnh sửa và ghi rõ lỗi. Có dấu vết kiểm tra; không tự kiểm tra và tự duyệt cùng một hồ sơ"*).
- **Chức năng đang có:**
  - API thẩm định `verify` ghi nhận `VerifiedByUserId` và `VerifiedAtUtc`.
- **Bằng chứng source code:**
  - [ChecklistWriteService.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Application/Modules/AdmissionVisa/Services/ChecklistWriteService.cs#L45-L68): Phương thức `VerifyChecklistItemAsync` chỉ kiểm tra quyền `admission.dossier.verify`, không kiểm tra ai là người phụ trách hồ sơ.
- **Khoảng trống (Gap):**
  - Thiếu ràng buộc: Người phụ trách chính của hồ sơ (`AssignedUserId`) hoặc người tạo/upload tệp KHÔNG ĐƯỢC PHÉP tự bấm thẩm định duyệt hồ sơ của chính mình.
  - Thiếu mốc kiểm duyệt cấp độ hồ sơ: Bước ký duyệt "Sẵn sàng gửi dịch" (Ready for Translation) do chuyên viên khác hoặc Trưởng phòng hồ sơ ký xác nhận.
- **Mức độ ưu tiên:** `CRITICAL` (Rủi ro toàn vẹn dữ liệu & Kiểm soát nội bộ)
- **Đề xuất thay đổi:**
  - Thêm kiểm tra logic trong `ChecklistWriteService`:
    ```csharp
    if (application.AssignedUserId == currentUserId && !isSuperAdmin)
        return Result.Fail("CROSS_CHECK_VIOLATION", "Nguyên tắc kiểm soát nội bộ: Chuyên viên phụ trách không được tự thẩm định duyệt hồ sơ của chính mình. Vui lòng chuyển chuyên viên khác kiểm tra chéo.");
    ```
  - Bổ sung bảng `Adm_DossierReviews` ghi vết lịch sử kiểm tra chéo: `ReviewerUserId`, `ReviewDate`, `ReviewType` (CrossCheck, ManagerApproval), `Status` (Passed, ReturnedWithNotes), `Notes`.
- **Quyết định cần PO xác nhận:**
  - Xác nhận danh sách vai trò được phép kiểm tra chéo: Giữa các chuyên viên hồ sơ cùng cấp (Peer Review), hay bắt buộc phải là Tổ trưởng / Trưởng phòng hồ sơ duyệt?

---

### GAP-KR-06: Quy trình Dịch thuật & Đơn vị dịch thuật (An Phúc Translation)

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.2.1, 2.2.2, 2.5.1 (*Đơn vị dịch thuật: Công ty TNHH Dịch thuật An Phúc - 236/2A Dương Thị Mười, P. Tân Thới Hiệp, TP.HCM - 0338 818 947; Thời gian dịch khoảng 02 ngày; photo 1 mặt, không dùng bản scan để nộp Lãnh sự*).
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *Hồ sơ chi tiết*, Cột R, S, T (`Ngày dịch`, `Đơn vị dịch`, `File scan dịch đính kèm`).
- **Chức năng đang có:**
  - Chưa có bất kỳ cấu trúc bảng hoặc API nào quản lý việc gửi nhận dịch thuật.
- **Bằng chứng source code:**
  - [20261029_0015...sql](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql): Không có bảng nào về Translation.
- **Khoảng trống (Gap):**
  - Thiếu tính năng lập gói hồ sơ gửi dịch thuật (`TranslationBatch`).
  - Thiếu quản lý đối tác dịch thuật (Tên đơn vị, thông tin liên hệ, đơn giá/phí dịch).
  - Thiếu theo dõi ngày gửi dịch, ngày hẹn trả kết quả, ngày nhận bản dịch thực tế, số lượng bản dịch.
  - Thiếu nơi lưu trữ tệp scan bản dịch đã được công chứng tư pháp.
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Tạo bảng `Adm_TranslationRequests` liên kết với `Adm_StudentApplications` và các `ChecklistItems` cần dịch.
  - Các trường: `VendorName`, `SentDate`, `ExpectedReturnDate`, `ActualReturnDate`, `TranslatedDocumentId`, `Status` (Draft, Sent, Completed, ReturnedForCorrection).
  - Cho phép đính kèm tệp scan bản dịch trực tiếp vào từng checklist item.
- **Quyết định cần PO xác nhận:**
  - Đơn vị dịch thuật có cần được quản lý như một `Party` kiểu `Organization` với vai trò `Vendor` trong Party360 không? *Khuyến nghị: Tái sử dụng `PartyType=Organization` và `PartyRole=Vendor` để chuẩn hóa toàn hệ sinh thái.*

---

### GAP-KR-07: Quy trình Công chứng & Hợp pháp hóa Lãnh sự (Tem vàng Sở Ngoại vụ & Tem tím Lãnh sự)

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.2.3 (*Chứng nhận/hợp pháp hóa hồ sơ: Xin tem tại Sở Ngoại vụ TP.HCM 184 Pasteur, phí 30.000đ/tem; Xin tem tím Lãnh sự quán Hàn Quốc 107 Nguyễn Du, phí 4 USD/tem ~108.000đ, hạn tem tím 1 năm*).
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *Hồ sơ chi tiết*, Cột U, V, W, X, Y, Z.
- **Chức năng đang có:**
  - Chưa có tính năng theo dõi tem chứng nhận lãnh sự.
- **Bằng chứng source code:**
  - [20261029_0015...sql](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql): Không có trường dữ liệu về tem vàng, tem tím.
- **Khoảng trống (Gap):**
  - Thiếu theo dõi ngày nộp công chứng tư pháp và chuyên viên thực hiện.
  - Thiếu theo dõi Tem vàng Sở Ngoại vụ: `Ngày đăng ký xin tem cục`, `Ngày hẹn nhận kết quả tem cục`, số lượng tem, lệ phí.
  - Thiếu theo dõi Tem tím Lãnh sự quán Hàn Quốc: `Ngày đăng ký xin tem tím`, `Ngày hẹn nhận kết quả tem tím`, ngày hết hạn tem tím (thời hạn 1 năm kể từ ngày dán).
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Mở rộng bảng `Adm_ChecklistItems` hoặc bảng phụ `Adm_DocumentLegalizations` để lưu: `NotarizedDate`, `YellowStampSubmittedDate`, `YellowStampAppointmentDate`, `PurpleStampSubmittedDate`, `PurpleStampAppointmentDate`, `PurpleStampExpiryDate`.
  - Bổ sung bộ lọc trên Dashboard hồ sơ: "Hồ sơ chờ lấy tem vàng", "Hồ sơ chờ lấy tem tím", "Hồ sơ tem tím sắp hết hạn (< 30 ngày)".
- **Quyết định cần PO xác nhận:**
  - Lệ phí tem vàng (30.000 VNĐ) và tem tím (4 USD) có cần tích hợp hạch toán tự động sang module Tài chính/Kế toán (Commercial/Finance) không, hay hiện tại chỉ ghi nhận phục vụ theo dõi hành chính?

---

### GAP-KR-08: Nộp nhiều trường đại học (Multi-School Applications) & Theo dõi Invoice học phí

- **Nguồn tài liệu:**
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột C, D, Z; Sheet *Invoice & Thanh toán* (Cột A đến N).
  - `SHD-KR-HS-01` — Mục 2.3, 2.4.
  - `SHD-KR-HS-02` — Mục III, IV.
- **Chức năng đang có:**
  - `Adm_StudentApplications` chỉ lưu 1 chuỗi text `ProgramName`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L24): `public string ProgramName { get; private set; }`.
- **Khoảng trống (Gap):**
  - Trong thực tế du học Hàn Quốc, một học viên thường đăng ký nguyện vọng và nộp hồ sơ vào 2-3 trường đại học đồng thời (VD: Nguyện vọng 1: ĐH Sunmoon, Nguyện vọng 2: ĐH Soonchunhyang; hoặc ĐH Chosun, CĐ Ansan, CĐ Myongji).
  - Thiếu theo dõi phỏng vấn trường: Lịch phỏng vấn, link phòng họp (Google Meet/Zoom), điểm ôn luyện mô phỏng, kết quả đỗ/trượt từng trường.
  - Thiếu hoàn toàn phân hệ theo dõi Invoice học phí từ trường Hàn Quốc:
    - Số Invoice của trường (`Invoice số`).
    - Ngày nhận Invoice, Hạn thanh toán (`Deadline`).
    - Số tiền bằng Won Hàn Quốc (`Số tiền KRW`), Tỷ giá hối đoái áp dụng (`Tỷ giá`), Thành tiền Việt Nam đồng (`Thành tiền VNĐ`).
    - Ngày công ty chuyển tiền cho trường (`Ngày chuyển tiền`).
    - Trạng thái Invoice: `Chưa nhận Invoice`, `Đã nhận Invoice`, `Chờ thanh toán`, `Đã thanh toán`, `Trường đã xác nhận`.
    - Thư mời nhập học / Mã cấp visa điện tử (`COA`).
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Tạo bảng `Adm_ApplicationSchoolChoices`: Lưu danh sách các trường học viên apply (`TargetSchoolPartyId`, `MajorName`, `ApplicationDate`, `InterviewDate`, `InterviewLink`, `InterviewResult`, `IsSelectedChoice`).
  - Tạo bảng `Adm_SchoolInvoices`: Lưu thông tin invoice học phí, số tiền KRW, tỷ giá quy đổi VNĐ, hạn nộp, ngày chuyển khoản ngân hàng và trạng thái xác nhận.
- **Quyết định cần PO xác nhận:**
  - Việc chuyển tiền thanh toán invoice học phí cho trường Hàn Quốc có yêu cầu phê duyệt từ Kế toán trưởng / Giám đốc điều hành trên ERP trước khi ghi nhận trạng thái "Đã thanh toán" không?

---

### GAP-KR-09: Hồ sơ Lãnh sự: Sổ đóng băng K-Study (Shinhan/Woori) & Khám lao Phước An 2

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.5.2 (*Khám lao tại Trung tâm Y khoa Phước An 2 - 686-688 Phường Diên Hồng, TP.HCM; Chứng minh tài chính sổ đóng băng 10.000.000 won cho trường khu vực Seoul/Incheon/Gyeonggi, 8.000.000 won cho khu vực khác*).
  - `SHD-KR-HS-02` — Mục V.
- **Chức năng đang có:**
  - Checklist item `HEALTH_CERT` và `FINANCIAL_PROOF` ở dạng generic.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L137-L138): Chỉ có mã code generic, không có trường nghiệp vụ chi tiết.
- **Khoảng trống (Gap):**
  - Không có trường theo dõi loại tài khoản đóng băng (K-Study/K-Visa), ngân hàng mở (Shinhan Bank, Woori Bank, Hana Bank), số tài khoản, số tiền đóng băng (10.000.000 KRW hoặc 8.000.000 KRW), ngày mở sổ và ngày duy trì.
  - Không có trường lưu kết quả khám lao: Cơ sở y tế chỉ định (Phước An 2), ngày khám, ngày hết hạn kết quả khám lao.
- **Mức độ ưu tiên:** `MEDIUM`
- **Đề xuất thay đổi:**
  - Bổ sung metadata hoặc bảng chi tiết `Adm_ConsulateRequirements`:
    - `FrozenAccountBankName`, `FrozenAccountAmountKrw`, `FrozenAccountOpenedDate`.
    - `TuberculosisClinicName`, `TuberculosisExaminationDate`, `TuberculosisExpiryDate`.
- **Quyết định cần PO xác nhận:**
  - Xác nhận danh sách ngân hàng được chỉ định mở sổ đóng băng K-Study để tạo danh mục lựa chọn (Dropdown) chuẩn hóa dữ liệu.

---

### GAP-KR-10: Nộp Visa tại KVAC HCMC & Theo dõi hẹn trả kết quả 20 ngày làm việc

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.6 (*Địa điểm: KVAC HCMC - 253 Điện Biên Phủ, P. Xuân Hòa, TP.HCM; Phí 50 USD + phí dịch vụ KVAC ~1.710.000đ; Thời gian trả kết quả 20 ngày làm việc không tính T7, CN; Tra cứu định kỳ trên website KVAC*).
  - `SHD-KR-HS-02` — Mục VI.
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột AF (`Visa`).
- **Chức năng đang có:**
  - Chuyển trạng thái sang `UnderReview` và `Accepted`/`Rejected`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L96-L100).
- **Khoảng trống (Gap):**
  - Thiếu mã số hồ sơ KVAC cấp khi nộp (`KvacApplicationCode`).
  - Thiếu ngày nộp thực tế tại KVAC và ngày dự kiến trả kết quả (tính tự động cộng 20 ngày làm việc loại trừ thứ 7, chủ nhật và ngày nghỉ lễ Việt Nam/Hàn Quốc).
  - Thiếu trường ghi nhận phỏng vấn lãnh sự (nếu có thông báo yêu cầu phỏng vấn), kết quả phỏng vấn lãnh sự.
  - Thiếu lưu trữ ảnh chụp màn hình tra cứu trạng thái visa trên cổng KVAC.
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Bổ sung vào `Adm_StudentApplications` hoặc bảng `Adm_VisaApplications`: `KvacApplicationNumber`, `KvacSubmissionDate`, `ExpectedResultDate`, `VisaResult` (Granted, AdditionalDocsRequired, Denied), `DenialReasonCode`, `VisaIssueDate`, `VisaExpiryDate`.
- **Quyết định cần PO xác nhận:**
  - Có yêu cầu xây dựng worker tự động tra cứu (crawling/scraping) kết quả visa từ trang web của KVAC HCMC hay chuyên viên hồ sơ tra cứu thủ công rồi cập nhật trạng thái vào ERP? *Khuyến nghị: Hiện tại nhập liệu thủ công kèm upload ảnh chụp màn hình để tránh rủi ro captcha/bị chặn IP từ KVAC.*

---

### GAP-KR-11: Xuất cảnh, Bàn giao hồ sơ gốc & Xác nhận nhập học tại Hàn Quốc

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Mục 2.7 (*Xuất cảnh và bàn giao; Hướng dẫn trước bay 05 ngày; Bàn giao hồ sơ gốc cho học viên và ký biên bản tại sân bay; Theo dõi nhập cảnh và cập nhật trạng thái 'Đã nhập học'*).
  - `SHD-KR-HS-02` — Mục VII.
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột AG (`Bay`).
- **Chức năng đang có:**
  - Chưa có chức năng theo dõi xuất cảnh và bàn giao hồ sơ gốc.
- **Bằng chứng source code:**
  - Không có trường hoặc bảng nào liên quan đến Departure/Flight.
- **Khoảng trống (Gap):**
  - Thiếu thông tin vé máy bay: Mã chuyến bay, Ngày bay, Giờ bay, Sân bay đến (Incheon, Gimhae/Busan).
  - Thiếu checklist bàn giao hồ sơ gốc tại sân bay và biên bản bàn giao có chữ ký học viên.
  - Thiếu thông tin đầu mối đón tại Hàn Quốc (Người đón của trường hoặc đại lý).
  - Thiếu bước đóng hồ sơ hoàn tất: Chuyển trạng thái sang `Đã xuất cảnh` và `Đã nhập học` (Enrolled at destination).
- **Mức độ ưu tiên:** `MEDIUM`
- **Đề xuất thay đổi:**
  - Bổ sung cấu trúc `Adm_DepartureHandover`: `FlightNumber`, `DepartureDate`, `ArrivalAirport`, `OriginalDocumentsHandoverDate`, `HandoverMinutesDocumentId`, `KoreanContactPhone`, `ArrivalStatus` (Departed, Arrived, Enrolled).
- **Quyết định cần PO xác nhận:**
  - Biên bản bàn giao hồ sơ gốc tại sân bay ký bằng giấy rồi chụp ảnh upload hay ký điện tử trên thiết bị di động?

---

### GAP-KR-12: Phân công nhân sự kép (NTV vs Nhân viên xử lý) & Quản lý Deadline theo kỳ

- **Nguồn tài liệu:**
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột X (`NTV`), Cột Y (`Nhân viên xử lý`), Cột AE (`Deadline`).
  - `SHD-KR-HS-01` — Mục 1.3 (Phân công trách nhiệm), Mục 2.0 (Khung thời gian tham chiếu theo kỳ).
- **Chức năng đang có:**
  - Bảng `Adm_StudentApplications` chỉ có 1 trường `AssignedUserId`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L27): `public Guid? AssignedUserId { get; private set; }`.
  - [20261029_0015...sql](file:///F:/MyProjectSHD/SHDONEERP/database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql#L253,L268).
- **Khoảng trống (Gap):**
  - Không thể hiện được mô hình thực tế của SHD Korea:
    1. `NTV` (Người tư vấn tuyển sinh / Sales Counselor): Chịu trách nhiệm tư vấn ban đầu, ký hợp đồng, thu hồ sơ đợt 1 và đôn đốc phụ huynh.
    2. `Nhân viên xử lý` (Dossier Processing Officer): Chịu trách nhiệm trực tiếp chuẩn hóa hồ sơ, dịch thuật, xin tem, nộp trường và nộp visa.
  - Thiếu quản lý `Deadline` theo mốc kỳ nhập học và cảnh báo trễ hạn (Overdue SLA alert) khi một giai đoạn kéo dài quá thời gian tham chiếu.
- **Mức độ ưu tiên:** `HIGH`
- **Đề xuất thay đổi:**
  - Bổ sung vào `Adm_StudentApplications`:
    - `ConsultantUserId` (Khóa ngoại trỏ về `Identity_Users` đại diện cho NTV).
    - `ProcessingOfficerUserId` (Khóa ngoại trỏ về `Identity_Users` đại diện cho Nhân viên xử lý).
    - `TargetIntakeDeadline` (Ngày hạn chót của kỳ).
  - Thêm cột tính toán hoặc cờ `IsOverdue` trong Stored Procedure danh sách hồ sơ khi `GETUTCDATE() > Deadline` mà hồ sơ chưa đạt mốc tương ứng.
- **Quyết định cần PO xác nhận:**
  - Phân quyền dữ liệu (Data Scope): NTV có được quyền xem hồ sơ sau khi đã bàn giao sang cho Nhân viên xử lý hồ sơ hay không? *Khuyến nghị: Cả NTV và Nhân viên xử lý đều có quyền xem (Read) hồ sơ trong phạm vi phụ trách, nhưng chỉ Nhân viên xử lý mới có quyền thao tác (Edit/Verify) checklist.*

---

### GAP-KR-13: Quy tắc đặt tên file scan chuẩn hóa (Naming Convention Phụ lục 4A)

- **Nguồn tài liệu:**
  - `SHD-KR-HS-01` — Phụ lục 4A (*Quy tắc lưu trữ: `01. Form_<HoTen>`, `02. Passport_<HoTen>`, `03. Picture_<HoTen>`, `04. High School Diploma_University Degree_<HoTen>`, `05. School Report_Transcript_<HoTen>`, ..., `14. Bank_<HoTen>`*).
- **Chức năng đang có:**
  - `IDocumentStorageService` lưu tệp theo `OriginalFileName` và GUID vật lý.
- **Bằng chứng source code:**
  - [LocalFileSystemDocumentStorageService.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Infrastructure/Services/LocalFileSystemDocumentStorageService.cs#L36-L55).
- **Khoảng trống (Gap):**
  - Khi tải tệp lên từ giao diện web, hệ thống giữ nguyên tên tệp của người dùng mà không tự động chuẩn hóa theo quy tắc Phụ lục 4A.
  - Khi cần tải trọn bộ hồ sơ (Download full dossier zip) để gửi trường hoặc nộp Lãnh sự, chuyên viên phải đổi tên từng tệp thủ công.
- **Mức độ ưu tiên:** `MEDIUM`
- **Đề xuất thay đổi:**
  - Bổ sung helper format tên tệp chuẩn hóa khi upload hoặc khi xuất file:
    `{ItemOrderIndex:D2}. {StandardItemName}_{StudentFullNameUnaccented}.{ext}`.
  - Thêm tính năng "Tải xuống toàn bộ hồ sơ đã chuẩn hóa tên" (Download Dossier Package Zip) cho trường học hoặc lãnh sự.
- **Quyết định cần PO xác nhận:**
  - Xác nhận danh mục mã tiền tố tên tệp cho các tài liệu phát sinh ngoài 14 mục chuẩn của Phụ lục 4A.

---

### GAP-KR-14: Phân biệt rõ Trạng thái Học viên vs Tiến độ Hồ sơ vs Tình trạng Chứng từ

- **Nguồn tài liệu:**
  - `QUẢN LÝ HỒ SƠ DU HOC HÀN.xlsx` — Sheet *DS học viên*, Cột AB (`Trạng thái học viên`), Cột AC (`Tiến độ hồ sơ`); Sheet *Hồ sơ chi tiết*, Cột D (`Tình trạng chứng từ`).
  - `SHD-KR-HS-01` — Mục 1.2.
- **Chức năng đang có:**
  - Sử dụng chung 1 trường `Status` trong `Adm_StudentApplications` và 1 trường `Status` trong `Party_Parties`.
- **Bằng chứng source code:**
  - [StudentApplication.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/AdmissionVisa/StudentApplication.cs#L25).
  - [PartyEntities.cs](file:///F:/MyProjectSHD/SHDONEERP/backend/ShdOneErp.Domain/Entities/Party/PartyEntities.cs#L11).
- **Khoảng trống (Gap):**
  - Đang bị lẫn lộn giữa 3 chiều trạng thái hoàn toàn độc lập:
    1. **Trạng thái học viên (Student Status - Phòng Đào tạo & Quản lý học viên):**
       `Mới nhập học`, `Đang học tiếng`, `Đã có TOPIK I`, `Đã có TOPIK II`, `Bảo lưu`, `Rút hồ sơ`.
    2. **Tiến độ hồ sơ du học (Dossier Progress - Phòng Hồ sơ & Đối ngoại):**
       `Thu hồ sơ`, `Kiểm tra hồ sơ`, `Dịch thuật`, `Công chứng`, `Nộp trường`, `Chờ Invoice`, `Đóng học phí`, `Nhận COA`, `Xin Visa`, `Có Visa`, `Book vé`, `Đào tạo trước bay`, `Đã xuất cảnh`.
    3. **Tình trạng chứng từ vật lý (Document Physical Status - Chuyên viên xử lý hồ sơ):**
       `Bản gốc`, `Bản sao trích lục`, `Bản photo`, `Chờ dấu mộc Hiệu trưởng`, `Chờ gửi dịch`, `Đã công chứng`, `Đã xin tem vàng`, `Đã xin tem tím`.
- **Mức độ ưu tiên:** `CRITICAL` (Bảo đảm tính trong sáng của mô hình dữ liệu DDD)
- **Đề xuất thay đổi:**
  - Tách bạch rõ 3 trường độc lập:
    - `StudentTrainingStatus` (trong `PartyRole` hoặc hồ sơ đào tạo).
    - `ApplicationStage` (trong `Adm_StudentApplications`).
    - `DocumentPhysicalState` (trong `Adm_ChecklistItems`).
- **Quyết định cần PO xác nhận:**
  - Khi học viên chuyển trạng thái "Bảo lưu" hoặc "Rút hồ sơ" tại Phòng Đào tạo, hệ thống có tự động đình chỉ (Suspend) toàn bộ các hồ sơ du học đang xử lý dở dang của học viên đó hay không?

---

## TỔNG HỢP THEO MỨC ĐỘ ƯU TIÊN

| Mức độ ưu tiên | Số lượng Gap | Danh sách Gap ID | Hành động đề xuất |
|---|---|---|---|
| **CRITICAL** | **4** | GAP-KR-01, GAP-KR-03, GAP-KR-05, GAP-KR-14 | Bắt buộc phải thiết kế schema mở rộng và quy tắc nghiệp vụ trong Sprint kế tiếp; không thể vận hành thực tế nếu thiếu 4 mục này. |
| **HIGH** | **5** | GAP-KR-02, GAP-KR-04, GAP-KR-06, GAP-KR-07, GAP-KR-08, GAP-KR-10, GAP-KR-12 | Cần thiết lập bảng dữ liệu và form nghiệp vụ cho giai đoạn Trường và Lãnh sự. |
| **MEDIUM** | **3** | GAP-KR-09, GAP-KR-11, GAP-KR-13 | Triển khai theo dạng tiện ích nghiệp vụ bổ trợ (K-study, sân bay, chuẩn hóa tên file). |
| **BLOCKED BY PO** | **1** | GAP-KR-01 (Scope lưu học vấn), GAP-KR-03 (Link checklist), GAP-KR-05 (Peer review), GAP-KR-12 (Phân quyền NTV) | Trình Hội đồng PO phê duyệt phương án kiến trúc trước khi code. |

