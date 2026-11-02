# 08 — LỘ TRÌNH TRIỂN KHAI & BACKLOG CHI TIẾT

## 1. Trạng thái các Phase hiện tại

| Phase | Nội dung | Trạng thái | Ghi chú |
|---|---|---|---|
| **Phase 0** | Khởi tạo Solution, Frontend, Migration Runner, Docs, CI Config | **VERIFIED / PASS** | Đã cấu hình và kiểm chứng toàn bộ trên .NET 10 SDK (v10.0.403). Migration runner có khóa phân tán `sp_getapplock` (đã chuẩn hóa cú pháp string); hoàn thiện toàn bộ `.cursor/rules/*.mdc` (9 rules). |
| **Phase 1** | Identity & Access Management (Direct GBAC v4.2, Auth, JWT) | **VERIFIED / PASS** | Đã triển khai đầy đủ: Login, RefreshToken, Logout/Revoke (`POST /api/v1/auth/logout`), Bootstrap Quản trị viên an toàn (`POST /api/v1/auth/bootstrap`), Dynamic Policy `Permission:<code>` kiểm tra quyền hiện hành trực tiếp qua DB, bảo mật secret qua environment. Kiểm thử GBAC & Auth validation đạt 100%. |
| **Phase 2** | Organization Module (Vertical Slices: Legal Entity, Business Unit, Branch/Campus) | **VERIFIED / PASS** | Hoàn thiện trọn vẹn 3 vertical slices: `LegalEntity` (Pháp nhân), `BusinessUnit` (Đơn vị kinh doanh), và `Branch` (Cơ sở / Chi nhánh đào tạo trực thuộc) với CRUD, phân trang qua Stored Procedure, lọc scope GBAC server-side, Optimistic Concurrency qua `RowVersion` và giao diện React 18 hoàn chỉnh. Kiểm thử nghiệp vụ và validation đạt 100%. |
| **Phase 3** | Party 360 Foundation (Định danh Khách hàng, Học viên, Đối tác dùng chung) | **VERIFIED / PASS** | Hoàn thiện vertical slice: Migration `20261026_0008` (Stored Procedures `sp_Party_GetPaged`, `sp_Party_GetById`), DDD Entity (`Party`, `Person`, `OrganizationParty`, `PartyRole`, `PartyContactMethod`), Application Services/Validators, `PartiesController`, UI `PartyList`, `PartyFormDrawer`, `PartyDetailDrawer` (360 view) và route `/party-360`. Kiểm thử Party đạt 100%. |
| **Phase 4** | CRM & Tuyển sinh | **PLANNED** | Tiếp nối sau khi nghiệm thu Organization & Party 360 |
| **Phase 5** | Catalog Dịch vụ, Hợp đồng & Thanh toán | **PLANNED** | Phụ thuộc chính sách giá và hạch toán nội bộ |
| **Phase 6** | Quản lý Đào tạo Ngoại ngữ & Lớp học | **PLANNED** | Khung chuẩn chương trình học và khóa đào tạo tại các cơ sở (Campus) |
| **Phase 7** | Hồ sơ Du học, Visa & Phỏng vấn | **PLANNED** | Quy trình xử lý theo từng quốc gia / thị trường |

## 2. Top 10 Backlog Items tiếp theo (Prioritized)

1. **[PO-01]** Xác nhận danh mục Pháp nhân, Đơn vị kinh doanh & Cơ sở đào tạo chính thức trong hệ sinh thái SHD Corp. — `BLOCKED / NEEDS_PO`.
2. **[AUTH-02]** Màn hình UI quản lý Phân quyền User Group và Gán thành viên theo Scope trên Frontend (`/admin/user-groups`).
3. **[AUDIT-01]** Ghi nhận tự động `SystemAuditLog` cho mọi thao tác CUD (Create/Update/Delete) thông qua DbContext SaveChanges Interceptor.
4. **[CRM-01]** Thiết kế luồng tiếp nhận Lead tuyển sinh từ nhiều nguồn (Website, Fanpage, Hotline) và phân bổ tư vấn viên theo Chi nhánh / Đơn vị.
5. **[COMM-01]** Định nghĩa danh mục sản phẩm/dịch vụ du học và các gói học phí khóa học tiếng tại các Campus.
6. **[FIN-01]** Quy chế đối soát và chia sẻ doanh thu giữa các Pháp nhân trong tập đoàn khi học viên đăng ký liên chi nhánh.
7. **[INTEG-01]** Thiết lập Outbox Pattern phục vụ phát hành sự kiện nội bộ và tích hợp hệ thống bên thứ ba.
8. **[EDU-01]** Thiết kế phân hệ Quản lý Lớp học và Phòng học trực thuộc từng Cơ sở đào tạo (Branch/Campus).
9. **[PERF-01]** Thiết lập Performance Benchmark cho Stored Procedures khi volume dữ liệu lớn (> 500,000 bản ghi).
10. **[CI-01]** Thiết lập kịch bản GitHub Actions tự động build backend và frontend khi push lên main.

## 3. Bằng chứng kiểm thử trong phiên hiện tại

- **Môi trường .NET SDK**: Đã xác thực .NET 10.0.403 (Host runtime 10.0.14). Toàn bộ 5 projects (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`) đồng bộ mục tiêu `net10.0`.
- **Backend Build**: `dotnet build backend/ShdOneErp.sln` thành công, 0 lỗi.
- **Backend Test**: `dotnet test backend/ShdOneErp.sln` chạy thành công **58/58 tests PASS** (Direct GBAC, Legal Entity, Business Unit, Branch/Campus, Party 360, Auth Validation, Password Hasher), 0 Failed, 0 Skipped.
- **Frontend Build**: `npm.cmd run build` (`tsc && vite build`) hoàn thành thành công trong 1.82s, **1,594 modules transformed, 0 lỗi TypeScript**.
- **Migration Runner**: Khắc phục lỗi cú pháp chuỗi `@LockOwner`, xác thực AST parser không còn lỗi cú pháp nào. Đã bổ sung migration `20261026_0009_BranchManagementAndScopedReads.sql`.
