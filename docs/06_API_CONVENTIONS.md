# 06 — CHUẨN GIAO THỨC API (API CONVENTIONS)

## 1. Chuẩn RESTful & URL
- Base URL: `/api/v1/{module}/{resource}`
- Ví dụ:
  - `GET /api/v1/organization/legal-entities` (Lấy danh sách phân trang)
  - `GET /api/v1/organization/legal-entities/{id}` (Lấy chi tiết)
  - `POST /api/v1/organization/legal-entities` (Tạo mới)
  - `PUT /api/v1/organization/legal-entities/{id}` (Cập nhật)
  - `DELETE /api/v1/organization/legal-entities/{id}` (Xóa / Đổi trạng thái)

## 2. Định dạng phản hồi chuẩn (Response Contracts)

### A. Phản hồi thành công cho danh sách phân trang (Paged Result)
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  },
  "traceId": "00-7c4d5e6f-..."
}
```

### B. Phản hồi thành công cho dữ liệu đơn (Single Item Result)
```json
{
  "success": true,
  "data": {
    "id": "e4f8b...",
    "code": "SHD_EDU",
    "name": "Công ty Cổ phần Giáo dục SHD",
    "status": "Active",
    "rowVersion": "AAAAAAABb1s="
  },
  "traceId": "00-7c4d5e6f-..."
}
```

### C. Phản hồi lỗi chuẩn (Unified Error Envelope)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu gửi lên không hợp lệ",
    "details": [
      { "field": "Code", "message": "Mã pháp nhân không được để trống" },
      { "field": "TaxCode", "message": "Mã số thuế không đúng định dạng" }
    ]
  },
  "traceId": "00-7c4d5e6f-..."
}
```

## 3. Các mã HTTP Status thông dụng
- `200 OK`: Truy vấn hoặc cập nhật thành công.
- `201 Created`: Tạo mới tài nguyên thành công kèm URI hoặc dữ liệu mới.
- `400 Bad Request`: Lỗi cú pháp hoặc nghiệp vụ do Client.
- `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn.
- `403 Forbidden`: Người dùng không có quyền hoặc ngoài phạm vi được phép.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `409 Conflict`: Đụng độ phiên bản cập nhật (Concurrency rowversion mismatch) hoặc trùng lặp mã duy nhất.
- `500 Internal Server Error`: Lỗi hệ thống ngoài dự kiến.
