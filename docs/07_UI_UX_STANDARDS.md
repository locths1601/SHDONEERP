# 07 — TIÊU CHUẨN GIAO DIỆN & TRẢI NGHIỆM (UI/UX STANDARDS)

## 1. Thiết kế Giao diện Enterprise
- Giao diện thiết kế theo phong cách hiện đại, tinh giản, chuyên nghiệp cho người dùng văn phòng và điều hành.
- Khung màu chủ đạo: Deep Navy / Slate Blue kết hợp Neutral Gray tạo cảm giác tin cậy và bền vững.
- Hỗ trợ đầy đủ Light Mode và Dark Mode.
- Tương thích tốt trên màn hình chuẩn 1920x1080 và 1366x768.

## 2. Hệ thống Reusable Components (`frontend/src/components/common/`)
1. `PageContainer`: Khung chuẩn cho từng trang gồm Tiêu đề, Breadcrumb, Action buttons.
2. `ListToolbar`: Thanh công cụ tìm kiếm nhanh, bộ lọc nâng cao, nút Tạo mới, nút Export.
3. `DataGrid`: Bảng dữ liệu có sắp xếp cột, chọn hàng, phân trang, hiển thị loading skeleton và empty state.
4. `SideDrawer`: Ngăn trượt từ phải sang phục vụ xem nhanh thông tin hoặc biểu mẫu chỉnh sửa không cần rời trang.
5. `Modal`: Hộp thoại phục vụ tác vụ tập trung.
6. `ConfirmDialog`: Hộp thoại xác nhận thao tác quan trọng/nguy hiểm (Xóa, Phê duyệt, Hủy bỏ).
7. `Can` & `RequireAuth`: Component kiểm soát hiển thị nút/menu theo quyền của người dùng.
8. `ErrorBoundary`: Bắt lỗi React runtime và hiển thị màn hình fallback an toàn.

## 3. Quản lý 6 Trạng thái UI (Mandatory States)
- Không bao giờ để người dùng nhìn thấy màn hình trắng hoặc nút bấm không phản hồi.
- Mọi thao tác tải dữ liệu phải có Skeleton Loader tương ứng.
- Khi không có dữ liệu, hiển thị EmptyState với mô tả và hành động tạo mới nếu có quyền.
- Thông báo lỗi/thành công bằng hệ thống Toast Notifications (`sonner`).
