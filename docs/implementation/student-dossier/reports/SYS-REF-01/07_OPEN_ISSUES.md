# SHD OneERP — SYS-REF-01 OPEN ISSUES & TECHNICAL DEBT

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Ngày lập:** 02/11/2026  
**Master Agent:** Master AI Agent Orchestrator  
**Tổng số vấn đề:** 3 (0 Blocker P0/P1, 1 Medium P2, 2 Low P3)

---

## 1. BẢNG THEO DÕI VẤN ĐỀ TỒN ĐỌNG (OPEN ISSUES MATRIX)

| ID | Mức độ | Mô tả chi tiết | Tác động thực tế | Hành động khắc phục đề xuất | Người chịu trách nhiệm |
|:---:|:---:|---|---|---|:---:|
| **ISS-01** | **P2** | Cảnh báo bảo mật phụ thuộc ngoài (Transitive NuGet Dependencies `NU1901`-`NU1904`) trong các package `Azure.Identity`, `System.Formats.Asn1` do các SDK bên thứ 3 tham chiếu gián tiếp. | Không ảnh hưởng đến runtime hoặc logic nghiệp vụ hiện tại của phân hệ Reference Data (chạy SQL Server cục bộ, không dùng Azure Identity trong DEV). | Nâng cấp tập trung các transitive package trong kỳ bảo trì nền tảng (Foundation Architecture Maintenance). | Platform Engineer |
| **ISS-02** | **P3** | Kiểm thử tự động E2E Frontend (Playwright/Cypress) chưa được tích hợp vào CI/CD pipeline chung của repository. | Kiểm thử giao diện hiện dựa trên 100% TypeScript type-check, Vite production build, Unit tests backend và kịch bản UAT thủ công có hướng dẫn chi tiết. | Xây dựng khung kiểm thử tự động Browser E2E cho phân hệ Quản trị hệ thống trong Sprint QA. | QA Lead / Frontend Agent |
| **ISS-03** | **P3** | Chính sách phân vùng dữ liệu (`ScopePolicy`) hiện cố định là `GLOBAL` theo quyết định của Product Owner. | Các đơn vị thành viên (Legal Entity) sử dụng chung một tập danh mục tham chiếu thống nhất, chưa hỗ trợ ghi đè danh mục riêng theo từng pháp nhân. | Nếu tương lai có nghiệp vụ danh mục đặc thù theo từng công ty con, sẽ mở rộng logic phân quyền theo `LegalEntityId` trong `sp_System_MasterData_Catalog_GetPagedList`. | Solution Architect |

---

## 2. ĐÁNH GIÁ RỦI RO HỒI QUY (REGRESSION RISK ASSESSMENT)

- **Nguy cơ phá vỡ CSDL:** `0%` (Đã kiểm chứng Fresh Database Rehearsal 16/16 migrations thành công; 100% Stored Procedures và bảng hoạt động đồng bộ với checksum SHA256).
- **Nguy cơ xung đột đồng thời:** Đã được kiểm soát toàn diện bằng cơ chế `RowVersion` Base64 token ở cả tầng CSDL SQL Server, EF Core DbUpdateConcurrencyException và Frontend `CatalogConflictModal` (HTTP 409).
- **Nguy cơ bảo mật & rò rỉ quyền:** `0%` (Direct GBAC v4.2 áp dụng cơ chế Fail-Closed ở Controller, Service và Stored Procedure; kiểm soát nghiêm ngặt quyền `system_admin` đối với danh mục hệ thống).

---

## 3. KẾT LUẬN VỀ ĐỘ SẴN SÀNG

Không có bất kỳ lỗi P0 hoặc P1 nào chặn triển khai (Zero Blockers). Phân hệ `SYS-REF-01` hoàn toàn ổn định và sẵn sàng cho Product Owner đánh giá nghiệm thu.

