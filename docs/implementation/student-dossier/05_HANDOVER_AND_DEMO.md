# SHD OneERP — Student Dossier Vertical Slice Handover & Demo Guide

## 1. Quick Start
### 1.1 Backend
```bash
# Build solution
dotnet build backend/ShdOneErp.sln

# Run unit tests
dotnet test backend/ShdOneErp.sln

# Run API Server
dotnet run --project backend/ShdOneErp.Api
# Swagger available at: http://localhost:5000/swagger
```

### 1.2 Database Migration
Run migration `database/migrations/20261029_0015_AdmissionVisaStudentApplicationSchemaAndSp.sql` on `ShdOneErpDb` using SQL Server Management Studio or PowerShell migration runner.

### 1.3 Frontend
```bash
cd frontend
npm run build
npm run dev
# App available at: http://localhost:5173
```

---

## 2. End-to-End User Journey Walkthrough

### Step 1: Truy cập Học viên & Hồ sơ 360
- Đăng nhập hệ thống SHD OneERP.
- Bấm vào menu **Học viên & Hồ sơ 360** trên Sidebar (`/students`).
- Xem danh sách học viên hiện có, tìm kiếm theo tên hoặc lọc theo pháp nhân.

### Step 2: Tiếp nhận học viên mới
- Bấm **Tiếp nhận học viên mới**.
- Nhập thông tin:
  - Họ đệm: `Nguyễn Văn`
  - Tên: `Khánh`
  - Pháp nhân quản lý: Chọn `SHD Education` hoặc pháp nhân bất kỳ.
  - Số điện thoại: `0988 777 666`
  - Ngày sinh, Giới tính, Email, Địa chỉ.
- Bấm **Xác nhận tạo hồ sơ** -> Thông báo thành công, học viên xuất hiện trên bảng.

### Step 3: Xem Hồ sơ 360 & Bổ sung giấy tờ
- Bấm vào hàng học viên hoặc nút **Hồ sơ 360** -> Chuyển đến `/students/{id}`.
- **Tab 1: Tổng quan & Thân nhân:**
  - Bấm **Bổ sung thân nhân** -> Nhập thông tin Bố/Mẹ (Nguyễn Văn A, SĐT, CCCD, nghề nghiệp, chọn tickbox "Bảo trợ tài chính").
  - Lưu thành công -> Card thân nhân xuất hiện kèm badge "Bảo lãnh".
- **Tab 2: Giấy tờ định danh:**
  - Bấm **Bổ sung giấy tờ** -> Chọn CCCD hoặc Hộ chiếu, nhập số `001099012345`, ngày cấp, nơi cấp.
  - Lưu thành công -> Card định danh xuất hiện với mã số font mono nổi bật.

### Step 4: Mở hồ sơ du học & Quản lý Checklist Visa
- **Tab 3: Hồ sơ du học & Checklist Visa:**
  - Bấm **Mở hồ sơ du học mới**.
  - Chọn thị trường: `Hàn Quốc`.
  - Kỳ tuyển sinh: `2026-Kỳ Thu (Tháng 9)`.
  - Chương trình đào tạo: `Du học tiếng Hàn D4-1`.
  - Bấm **Tạo hồ sơ du học** -> Hệ thống tạo hồ sơ và **tự động sinh 9 checklist tài liệu tiêu chuẩn** (Hộ chiếu, CCCD, Khai sinh, Học bạ, Bằng cấp, Chứng minh tài chính, Khám sức khỏe, Ảnh thẻ, Lý lịch tư pháp).
  - Bấm **Xem & Thẩm định** -> Mở modal chi tiết hồ sơ.

### Step 5: Đính kèm file số hóa & Thẩm định Checklist
- Trong modal chi tiết hồ sơ:
  - Bấm **Tải file lên** tại hạng mục `PASSPORT` (Hộ chiếu) -> Chọn file PDF hoặc ảnh -> File được tải lên, tính SHA256, gắn vào checklist. Trạng thái chuyển thành **Chờ thẩm định (Uploaded)**.
  - Bấm **Thẩm định** -> Trạng thái chuyển thành **Hợp lệ (Verified)** với tên người thẩm định và thời gian.
  - Bấm **Từ chối** tại một hạng mục khác -> Nhập lý do (VD: "Bản sao thiếu công chứng tư pháp") -> Trạng thái chuyển thành **Bị từ chối (Rejected)** kèm lý do màu đỏ.
  - Tiến độ checklist cập nhật theo thời gian thực (ví dụ: `1/9 hạng mục hợp lệ`).

### Step 6: Chuyển trạng thái quy trình hồ sơ du học
- Trên thanh trạng thái quy trình:
  - Bấm **Nộp hồ sơ (Submitted)** -> Chuyển từ `Draft` sang `Submitted`.
  - Bấm **Bắt đầu thẩm định hồ sơ Visa** -> Chuyển sang `UnderReview`.
  - Khi hoàn tất thẩm định: Bấm **Chấp thuận / Đậu Visa** (`Accepted`) hoặc **Từ chối Visa** (`Rejected`).
- Mọi thao tác đều được kiểm soát bởi RowVersion, ngăn chặn ghi đè dữ liệu khi có nhiều tư vấn viên thao tác đồng thời.

