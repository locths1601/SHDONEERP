# SHD OneERP — SYS-REF-01 USER ACCEPTANCE TESTING (UAT) GUIDE

**Story ID:** `SYS-REF-01`  
**Story Title:** Quản lý nhóm danh mục dùng chung (System Reference Data Catalogs)  
**Persona:** Quản trị viên cấu hình hệ thống (System Config Admin) / Người dùng nghiệp vụ  
**Mục tiêu:** Hướng dẫn kiểm định chất lượng và nghiệm thu thực tế luồng quản trị nhóm danh mục trên giao diện web.  

---

## 1. DỮ LIỆU KIỂM THỬ GIẢ LẬP (SYNTHETIC TEST DATA)

- **Tài khoản Quản trị viên:** `admin@shdcorp.vn` / `Admin@123` (Có quyền `system.reference_data.manage`).
- **Tài khoản Nhân viên nghiệp vụ:** `officer@shdcorp.vn` / `Officer@123` (Chỉ có quyền `system.reference_data.view`).
- **Mã nhóm mẫu:**
  - `KOREA_INTAKE_TERM`: "Kỳ nhập học Hàn Quốc" (OwnerModule: `ADMISSION`)
  - `KOREA_VISA_STATUS`: "Trạng thái Visa Hàn Quốc" (OwnerModule: `ADMISSION`)
  - `SYS_DOCUMENT_TYPE`: "Loại giấy tờ căn bản" (OwnerModule: `SYSTEM`, IsSystem: `true`)

---

## 2. CÁC KỊCH BẢN KIỂM ĐỊNH NGHIỆM THU (TEST SCENARIOS)

### Kịch bản UAT-01: Luồng chuẩn tạo mới nhóm danh mục (Happy Path — AC01 & AC05)
1. **Given:** Đăng nhập vào hệ thống với tài khoản `admin@shdcorp.vn`.
2. **When:** 
   - Điều hướng tới menu `Cấu hình hệ thống → Dữ liệu nguồn (Master Data)`.
   - Nhấn nút `+ Thêm nhóm danh mục`.
   - Nhập thông tin:
     - Mã nhóm: `KOREA_INTAKE_TERM`
     - Tên nhóm: `Kỳ nhập học Hàn Quốc`
     - Phân hệ sở hữu: `ADMISSION`
     - Mô tả: `Quản lý các kỳ tuyển sinh du học Hàn Quốc (Tháng 3, 6, 9, 12)`
   - Nhấn nút `Tạo mới`.
3. **Then:**
   - Toast thông báo màu xanh hiển thị: "Tạo mới nhóm danh mục thành công".
   - SideDrawer tự động đóng lại.
   - Bản ghi `KOREA_INTAKE_TERM` xuất hiện ngay lập tức trên bảng DataGrid với nhãn `ACTIVE`, phân hệ `ADMISSION` và số giá trị con `0`.

---

### Kịch bản UAT-02: Kiểm tra chặn trùng mã Code (Validation Failure — AC02)
1. **Given:** Danh mục `KOREA_INTAKE_TERM` đã tồn tại trong CSDL.
2. **When:** 
   - Nhấn nút `+ Thêm nhóm danh mục`.
   - Nhập mã nhóm: `korea_intake_term` (hoặc `KOREA_INTAKE_TERM`).
   - Nhập tên: `Kỳ nhập học trùng lặp`.
   - Nhấn nút `Tạo mới`.
3. **Then:**
   - Hệ thống hiển thị thông báo lỗi màu đỏ: "Mã nhóm danh mục 'KOREA_INTAKE_TERM' đã tồn tại trong hệ thống."
   - Không sinh thêm bản ghi duplicate trong CSDL.

---

### Kịch bản UAT-03: Kiểm tra tính bất biến của mã Code và Chỉnh sửa thông tin (AC03)
1. **Given:** Nhóm `KOREA_INTAKE_TERM` hiển thị trên danh sách.
2. **When:** 
   - Nhấn biểu tượng chỉnh sửa (Edit) tại dòng của nhóm.
3. **Then:**
   - SideDrawer mở ra. Ô nhập `Mã nhóm danh mục (Code)` bị disable hoàn toàn (màu xám), không cho phép chỉnh sửa.
   - Nhập tên mới: `Kỳ nhập học Hàn Quốc (Chuẩn hóa)`.
   - Nhấn `Lưu thay đổi`.
   - Bảng DataGrid cập nhật tên mới ngay lập tức.

---

### Kịch bản UAT-04: Kiểm soát phân quyền Direct GBAC (Permission Denied — AC04)
1. **Given:** Đăng nhập với tài khoản `officer@shdcorp.vn` (chỉ có quyền view).
2. **When:** Truy cập `/admin/reference-data`.
3. **Then:**
   - Trang danh sách hiển thị dữ liệu bình thường để tra cứu.
   - Nút `+ Thêm nhóm danh mục` hoàn toàn bị ẩn đi.
   - Cột `Thao tác` không hiển thị nút sửa hoặc ngừng sử dụng (được bảo vệ bởi `<Can>`).
   - Nếu cố ý gửi request `POST /api/v1/system/reference-data/catalogs` qua Postman, backend trả về HTTP 403 Forbidden.

---

### Kịch bản UAT-05: Kiểm tra Khóa bảo vệ Danh mục Hệ thống (System Controlled — AC03)
1. **Given:** Nhóm danh mục `SYS_DOCUMENT_TYPE` có `isSystem = true`.
2. **When:** Quản trị viên quan sát dòng danh mục trên bảng.
3. **Then:**
   - Cột "Chế độ quản trị" hiển thị badge màu tím `SYSTEM_CONTROLLED`.
   - Nút `Ngừng sử dụng` (Power) hoàn toàn bị ẩn để tránh việc vô hiệu hóa nhầm nhóm lõi.
   - Nếu gọi API `PUT /deactivate`, backend từ chối với lỗi `CANNOT_DEACTIVATE_SYSTEM_CATALOG`.

---

### Kịch bản UAT-06: Xung đột đồng thời Optimistic Concurrency 409 (Edge Case)
1. **Given:** Hai quản trị viên A và B cùng mở form sửa nhóm danh mục `KOREA_INTAKE_TERM`.
2. **When:** 
   - Quản trị viên A sửa tên và nhấn Lưu thành công (RowVersion trong CSDL đã tăng).
   - Quản trị viên B giữ nguyên màn hình cũ và nhấn Lưu.
3. **Then:**
   - Backend phát hiện lệch RowVersion và trả về HTTP 409 Conflict.
   - Giao diện của B hiển thị hộp thoại `CatalogConflictModal`: "Xung đột dữ liệu (HTTP 409) — Nhóm danh mục vừa được cập nhật bởi người dùng khác".
   - Nhấn nút "Tải lại dữ liệu mới nhất" sẽ nạp lại thông tin mới nhất của Quản trị viên A mà không làm mất tính toàn vẹn dữ liệu.

