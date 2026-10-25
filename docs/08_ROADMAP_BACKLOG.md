# 08 — LỘ TRÌNH TRIỂN KHAI & BACKLOG CHI TIẾT

## 1. Trạng thái các Phase hiện tại

| Phase | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|
| **Phase 0** | Khởi tạo Solution, Frontend, Migration Runner, Docs, CI Config | **IMPLEMENTED** | Nền tảng sạch, không phụ thuộc dự án cũ |
| **Phase 1** | Identity & Access Management (Direct GBAC v4.2, Auth, JWT) | **IMPLEMENTED** | Schema, SP, Token Service, Controller, Tests |
| **Phase 2** | Organization Module (Vertical Slice: Legal Entity Management) | **IMPLEMENTED** | End-to-end: Domain, SP, API, React UI, Test |
| **Phase 3** | Party 360 Foundation (Khách hàng, Người học dùng chung) | **IMPLEMENTED (Design & Schema)** | Schema & Entity models sẵn sàng |
| **Phase 4** | CRM & Tuyển sinh | **PLANNED** | Tiếp nối sau khi duyệt Party 360 |
| **Phase 5** | Catalog Dịch vụ, Hợp đồng & Thanh toán | **PLANNED** | Phụ thuộc chính sách giá TBD |
| **Phase 6** | Quản lý Đào tạo Ngoại ngữ & Lớp học | **PLANNED** | Khung chuẩn chương trình học |
| **Phase 7** | Hồ sơ Du học, Visa & Phỏng vấn | **PLANNED** | Quy trình xử lý theo từng thị trường |

## 2. Top 10 Backlog Items tiếp theo (Prioritized)
1. **[PO-01]** Xác nhận danh mục Pháp nhân & Đơn vị kinh doanh chính thức trong hệ sinh thái SHD Corp.
2. **[ORG-02]** Triển khai Vertical Slice cho Business Unit Management (Liên kết Legal Entity).
3. **[ORG-03]** Triển khai Vertical Slice cho Branch / Campus Management.
4. **[AUTH-02]** Màn hình UI quản lý Phân quyền User Group và Gán thành viên theo Scope trên Frontend.
5. **[PARTY-01]** Triển khai API CRUD & Search cho Party 360 (Person & Organization).
6. **[PARTY-02]** Triển khai UI Party 360 Directory & Customer Profile View.
7. **[AUDIT-01]** Ghi nhận tự động `SystemAuditLog` cho mọi thao tác CUD (Create/Update/Delete) thông qua Interceptor.
8. **[CRM-01]** Thiết kế luồng tiếp nhận Lead tuyển sinh từ nhiều nguồn và phân bổ tư vấn viên.
9. **[COMM-01]** Định nghĩa danh mục sản phẩm/dịch vụ du học và khóa học ngôn ngữ.
10. **[INTEG-01]** Thiết lập Outbox Pattern phục vụ gửi thông báo và tích hợp hệ thống bên thứ ba.
