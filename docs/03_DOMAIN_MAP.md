# 03 — TARGET DOMAIN MAP

Bản đồ các miền nghiệp vụ (Bounded Contexts) trong SHD OneERP:

| STT | Domain Context | Vai trò & Trách nhiệm chính | Thực thể chính |
|---|---|---|---|
| 1 | **Foundation** | Hệ thống cốt lõi, Audit log, Mã danh mục, Tham số hệ thống, SP Executor | SystemAuditLog, LookupItem, SystemSetting |
| 2 | **IdentityAccess** | Quản lý người dùng, Xác thực, Nhóm quyền (GBAC), Phân quyền, JWT Session | User, UserGroup, Permission, UserGroupMember, UserGroupPermission |
| 3 | **Organization** | Quản trị cơ cấu đa pháp nhân, đơn vị kinh doanh, chi nhánh, phòng ban | LegalEntity, BusinessUnit, Branch, Department |
| 4 | **Party360** | Định danh duy nhất khách hàng/đối tác toàn hệ sinh thái | Party, Person, OrganizationParty, PartyRole, PartyContactMethod |
| 5 | **CRM** | Quản lý khách hàng tiềm năng, nguồn tuyển sinh, cơ hội và tư vấn | Lead, Opportunity, CounselingLog |
| 6 | **Commercial** | Quản lý gói sản phẩm, dịch vụ du học/đào tạo, hợp đồng dịch vụ và xuất hóa đơn | ProductCatalog, ServicePackage, ServiceContract, BillingRecord |
| 7 | **Education** | Khóa học ngoại ngữ, lớp học, lịch học, điểm danh, kết quả thi | Course, ClassSchedule, Attendance, ExamScore |
| 8 | **AdmissionVisa** | Hồ sơ du học sinh, hồ sơ dịch thuật, nộp visa, phỏng vấn ĐSQ, xuất cảnh | StudentApplication, DocumentChecklist, VisaCase |
| 9 | **InternationalPlacement**| Đối tác trường nước ngoài, nghiệp đoàn, đơn hàng làm việc, phỏng vấn ghép đơn | PartnerSchool, Employer, JobPlacement |
| 10 | **OverseasCare** | Đón sân bay, nhà ở nước ngoài, giám hộ, hỗ trợ sinh viên tại nước sở tại | ArrivalSupport, Accommodation, OverseasCareCase |
| 11 | **Finance** | Doanh thu, công nợ, phiếu thu, đối soát liên công ty | Invoicing, PaymentReceipt, IntercompanyTransfer |
| 12 | **PeopleAdmin** | Nhân sự nội bộ, hợp đồng lao động, chấm công giảng viên (Giai đoạn sau) | Employee, TeacherAssignment |
| 13 | **Insights** | Báo cáo phân tích kinh doanh, dự báo tài chính (Giai đoạn sau) | AnalyticsSnapshot, ExecutiveReport |
| 14 | **AIIntegration** | Trợ lý tra cứu tri thức chính sách du học, soạn thảo văn bản (Giai đoạn sau) | AiPromptLog, KnowledgeIndex |
