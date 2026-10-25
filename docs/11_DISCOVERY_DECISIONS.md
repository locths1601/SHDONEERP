# 11 — DISCOVERY DECISIONS & OPEN QUESTIONS (TBD)

Tài liệu này ghi nhận toàn bộ các giả định, thông tin chưa được xác nhận và câu hỏi mở cần **Product Owner (PO)** của SHD Corp phê chuẩn.

| Mã | Hạng mục | Hiện trạng / Đề xuất kỹ thuật | Tác động hệ thống | Trạng thái |
|---|---|---|---|---|
| **TBD-01** | **Danh mục Pháp nhân thực tế** | Đang sử dụng mã mẫu minh họa (`SHD_CORP`, `SHD_EDU`, `SHD_ACADEMY`, `SHD_INTL`). Cần PO cung cấp tên pháp nhân, MST, địa chỉ chính thức. | Dữ liệu khởi tạo (Seed data) cho môi trường UAT/Production. | `TBD — Chờ PO xác nhận` |
| **TBD-02** | **Cơ cấu Business Unit & Brand** | Đề xuất tách biệt Brand tiếp thị (SHD Academy) và Business Unit quản lý doanh thu/chi phí. | Mô hình quan hệ giữa LegalEntity, BusinessUnit và Brand. | `TBD — Đề xuất phương án` |
| **TBD-03** | **Chính sách phân chia doanh thu liên công ty** | Khách hàng nộp tiền tại Công ty A nhưng học tại Chi nhánh của Công ty B. Cần cơ chế xuất hóa đơn và ghi nhận doanh thu nội bộ. | Thiết kế module Commercial & Finance ở Phase 5 & 10. | `TBD — Chờ nghiệp vụ kế toán` |
| **TBD-04** | **Quy trình phê duyệt hợp đồng dịch vụ** | Hợp đồng trên bao nhiêu tiền cần Giám đốc Pháp nhân phê duyệt? Có phân cấp phê duyệt theo chức vụ không? | Thiết kế Workflow State Machine trong tương lai. | `TBD — Chờ PO cung cấp matrix` |
| **TBD-05** | **Bảo vệ dữ liệu cá nhân (PII & Nghị định 13/2023)** | Dữ liệu CCCD/Hộ chiếu, điểm học bạ, hồ sơ tài chính du học sinh cần mã hóa tại cột dữ liệu (Column-level encryption) hay mã hóa toàn bộ DB (TDE)? | Kiến trúc bảo mật tầng Database và cơ chế giải mã khi hiển thị. | `TBD — Đề xuất TDE + Masking` |
| **TBD-06** | **Chính sách cấp tài khoản ban đầu** | Quy định tạo mật khẩu ban đầu cho nhân viên mới và cơ chế bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên. | Đã triển khai cờ `MustChangePassword = true` trong Identity module. | `TBD — Đã chuẩn hóa kỹ thuật` |
