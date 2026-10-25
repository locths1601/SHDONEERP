# 00 — TẦM NHÌN DỰ ÁN SHD ONEERP

## 1. Mục tiêu chiến lược
Hệ thống **SHD OneERP** là nền tảng quản trị tổng thể doanh nghiệp (Enterprise Resource Planning) đa công ty, được xây dựng riêng biệt nhằm số hóa và đồng bộ hóa toàn bộ chuỗi giá trị và hoạt động nghiệp vụ của tập đoàn **SHD Corp**.

Hệ sinh thái bao gồm nhiều mảng kinh doanh:
- Đào tạo ngoại ngữ (Hàn, Nhật, Đức, Anh, ...)
- Tư vấn và xử lý hồ sơ du học
- Quản lý visa, phỏng vấn và xuất cảnh
- Hợp tác đối tác quốc tế, trường đại học, tổ chức việc làm
- Chăm sóc và hỗ trợ lưu học sinh, lao động ở nước ngoài
- Quản trị CRM tuyển sinh, hợp đồng, tài chính, thanh toán và hạch toán liên công ty
- Quản trị nguồn nhân lực, giảng viên và báo cáo điều hành

## 2. Các nguyên tắc vàng (Core Guiding Principles)
1. **Đa pháp nhân & Phân quyền đa cấp**: Hệ thống hỗ trợ đa Legal Entity, Business Unit, Brand và Branch. Dữ liệu được cô lập bảo mật tuyệt đối theo quyền hạn và phạm vi.
2. **Khách hàng là trung tâm (Party 360)**: Một cá nhân/học viên sở hữu một định danh duy nhất trong toàn hệ sinh thái (`PartyId`), có thể tham gia nhiều chương trình học, ký nhiều hợp đồng với các công ty khác nhau mà không bị trùng lặp hay phân mảnh thông tin.
3. **Hiệu năng & Khả năng mở rộng cao**: Phân tách rõ ràng giữa Write-side (Command với EF Core) và Read-side (Query siêu tốc với Stored Procedures).
4. **Bảo mật Deny-by-Default**: Mọi quyền truy cập dữ liệu và tài nguyên đều bị từ chối trừ khi được cấp quyền rõ ràng thông qua mô hình Direct GBAC v4.2.

## 3. Lộ trình phát triển tổng thể
- **Phase 0**: Project Bootstrap, Clean Architecture Solution, React Vite UI, Database Migration Engine.
- **Phase 1**: Identity & Access Management (Direct GBAC v4.2, Authentication, Permission Resolver).
- **Phase 2**: Organization Module (Quản lý Pháp nhân - Legal Entity, Business Unit, Branch).
- **Phase 3**: Party 360 Foundation (Khách hàng, Người học, Hồ sơ định danh dùng chung).
- **Phase 4**: CRM Tuyển sinh & Quản lý cơ hội.
- **Phase 5**: Danh mục Dịch vụ, Hợp đồng & Thanh toán (Commercial & Billing).
- **Phase 6**: Quản lý Đào tạo (Education & Training).
- **Phase 7**: Quản lý Hồ sơ & Visa (Admission & Visa).
- **Phase 8**: Đối tác Quốc tế & Việc làm (Placement).
- **Phase 9**: Hỗ trợ Học viên Nước ngoài (Overseas Care).
- **Phase 10**: Quản trị Tài chính & Báo cáo Hợp nhất (Finance & Executive Insights).
