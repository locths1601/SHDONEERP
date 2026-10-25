# 10 — ARCHITECTURAL DECISION RECORDS (ADR)

## ADR-001: Lựa chọn Kiến trúc Modular Monolith thay vì Microservices ban đầu
- **Bối cảnh**: Hệ sinh thái SHD Corp bao gồm nhiều mảng nghiệp vụ (Đào tạo, Du học, Visa, Định cư, Tài chính) cần chia sẻ định danh Party 360 và thông tin tổ chức. Đội ngũ đang trong giai đoạn xây dựng và chuẩn hóa mô hình nghiệp vụ.
- **Quyết định**: Chọn kiến trúc Modular Monolith dựa trên Clean Architecture. Mã nguồn chung một repository và giải pháp triển khai thống nhất, phân tách boundary rõ ràng bằng projects/namespaces (`ShdOneErp.Domain`, `ShdOneErp.Application`, `ShdOneErp.Infrastructure`, `ShdOneErp.Api`).
- **Hệ quả**: Giảm chi phí vận hành hạ tầng, loại bỏ độ trễ và phân tán dữ liệu của distributed transactions, dễ dàng tái cấu trúc domain. Sẵn sàng tách ra Microservices trong tương lai khi có nhu cầu tải riêng biệt.

## ADR-002: Tách biệt Write-side (EF Core) và Read-side (Stored Procedures)
- **Bối cảnh**: Hệ thống ERP yêu cầu tốc độ truy vấn danh sách, tìm kiếm, phân trang và báo cáo tổng hợp cực nhanh; đồng thời cần đảm bảo tính toàn vẹn và concurrency cho các thao tác ghi dữ liệu.
- **Quyết định**:
  - Write-side: Sử dụng EF Core với Unit of Work, Change Tracking, Concurrency Token (`rowversion`), Auditing.
  - Read-side: 100% API GET nghiệp vụ bắt buộc thực thi qua SQL Server Stored Procedures (`sp_*`) thông qua `ISpExecutor`.
- **Hệ quả**: Truy vấn GET được tối ưu triệt để bằng Execution Plan của SQL Server, loại bỏ vấn đề N+1 và chi phí mapping thừa của ORM. Developer phải duy trì Stored Procedures cùng với migrations.

## ADR-003: Phân quyền Direct GBAC v4.2 kết hợp Data Scoping
- **Bối cảnh**: Hệ thống phục vụ nhiều công ty con và đơn vị kinh doanh. Một nhân viên có thể là Kế toán của Công ty A nhưng chỉ có quyền xem báo cáo tại Công ty B.
- **Quyết định**: Áp dụng mô hình Direct Group-Based Access Control kết hợp với Scope (`Global`, `LegalEntity`, `BusinessUnit`, `Branch`). Permission được định nghĩa canonical `module.resource.action`. Kiểm tra quyền được thực thi chặt chẽ ở cả Controller Policy và SQL Query Parameters.
- **Hệ quả**: Phân quyền linh hoạt, bảo mật deny-by-default, ngăn chặn hoàn toàn việc rò rỉ dữ liệu chéo giữa các pháp nhân.

## ADR-004: Quản lý Database bằng Handwritten SQL Migrations
- **Bối cảnh**: EF Core Migrations tự động thường sinh ra code SQL khó kiểm soát, khó tối ưu index và không hỗ trợ trực tiếp quản lý version của Stored Procedures.
- **Quyết định**: Quản lý 100% schema, stored procedures, indexes và seeds thông qua các file SQL viết tay có đánh số thứ tự phiên bản theo ngày giờ (`database/migrations/YYYYMMDD_HHMM_Name.sql`). Quản lý lịch sử bằng bảng `__DbMigrationHistory`.
- **Hệ quả**: DBA kiểm soát hoàn toàn chất lượng câu lệnh SQL, migration an toàn và tương thích với CI/CD pipeline.
