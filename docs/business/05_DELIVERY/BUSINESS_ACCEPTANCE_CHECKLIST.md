# DANH MỤC KIỂM THỬ NGHIỆM THU NGHIỆP VỤ (BUSINESS ACCEPTANCE CHECKLIST)
Mã tài liệu: `BUS-DOC-05-04` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Mục tiêu: **Bộ tiêu chí nghiệm thu UAT dành cho QA/QC và Ban Nghiệp vụ Doanh nghiệp**

---

## 1. SUITE 1: TIẾP NHẬN LEAD & KIỂM SOÁT TRÙNG LẶP (LEAD INGESTION)

| Mã Test Case | Tên Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Mong Đợi (Pass Criteria) | Trạng Thái |
|---|---|---|---|:---:|
| `TC-LEAD-01` | Tiếp nhận Lead mới hoàn toàn từ Webhook | Payload JSON có SĐT `0988111222` chưa từng có trong hệ thống | Tạo bản ghi mới trong `Crm_Leads`, trạng thái `New`, cấp mã `LD-YYYYMM-XXXX`, bắn sự kiện Outbox. | Sẵn sàng |
| `TC-LEAD-02` | Chuẩn hóa số điện thoại hợp lệ | Nhập `0912 345 678` hoặc `+84-912.345.678` | Database lưu chuẩn E.164: `+84912345678`. | Sẵn sàng |
| `TC-LEAD-03` | Chặn trùng lặp trong cửa sổ 60 ngày | Gửi lại SĐT `0988111222` sau 15 ngày từ chiến dịch Facebook khác | Không tạo Lead mới; tăng `TouchpointCount = 2`; gửi notification cho nhân viên phụ trách cũ. | Sẵn sàng |
| `TC-LEAD-04` | Cho phép mở chu kỳ Lead mới sau 60 ngày | Gửi lại SĐT đã từng đăng ký cách đây 90 ngày | Tạo Lead chu kỳ mới (`IsRecycled = true`), liên kết mã Lead cũ, cho phép phân bổ bình thường. | Sẵn sàng |
| `TC-LEAD-05` | Nhập file Excel danh sách học viên | Upload file Excel 50 dòng có 3 dòng sai định dạng số điện thoại | Hệ thống báo lỗi chi tiết 3 dòng sai; cho phép import thành công 47 dòng đúng. | Sẵn sàng |

---

## 2. SUITE 2: PHÂN BỔ TƯ VẤN & GIÁM SÁT CAM KẾT SLA

| Mã Test Case | Tên Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Mong Đợi (Pass Criteria) | Trạng Thái |
|---|---|---|---|:---:|
| `TC-SLA-01` | Phân bổ Round-Robin công bằng | 3 nhân viên A (3 Lead), B (1 Lead), C (2 Lead). Ingest 1 Lead mới | Hệ thống tự động gán cho nhân viên B; Lead đổi sang `Assigned`. | Sẵn sàng |
| `TC-SLA-02` | Thiết lập thời hạn SLA cho Lead Hot | Lead có điểm đánh giá $\ge 70$ điểm | `SlaDeadlineUtc` được gán chính xác bằng `AssignedAtUtc + 15 phút`. | Sẵn sàng |
| `TC-SLA-03` | Dừng đồng hồ SLA khi gọi điện | Nhân viên bấm gọi và lưu nhật ký cuộc gọi sau 8 phút | `FirstContactedAtUtc` được ghi nhận; đồng hồ dừng; cờ `IsSlaBreached = false`. | Sẵn sàng |
| `TC-SLA-04` | Báo động vi phạm SLA khi quá hạn | Nhân viên không tương tác sau 16 phút | Bật cờ `IsSlaBreached = true`, badge đổi màu đỏ nhấp nháy; gửi cảnh báo cho Trưởng phòng. | Sẵn sàng |
| `TC-SLA-05` | Tự động thu hồi Lead sau 120 phút | Quá hạn SLA 120 phút không có gia hạn | Hệ thống hủy gán nhân viên cũ, chuyển Lead về Hàng đợi phân bổ lại cho người khác. | Sẵn sàng |

---

## 3. SUITE 3: BÁO GIÁ & PHÊ DUYỆT WORKFLOW CHIẾT KHẤU

| Mã Test Case | Tên Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Mong Đợi (Pass Criteria) | Trạng Thái |
|---|---|---|---|:---:|
| `TC-QUOTE-01` | Lập báo giá chuẩn không chiết khấu | Chọn gói du học Hàn Quốc 185.000.000 đ | Tự động bóc tách thành tiền, thuế VAT; trạng thái `Approved` ngay lập tức. | Sẵn sàng |
| `TC-QUOTE-02` | Kích hoạt luồng duyệt khi giảm 2.000.000 đ | Áp dụng giảm giá 2.000.000 đ (Vượt hạn mức tư vấn viên) | Báo giá chuyển sang `PendingApproval`; sinh Workflow Instance gửi Trưởng phòng duyệt. | Sẵn sàng |
| `TC-QUOTE-03` | Trưởng phòng từ chối mức giảm giá | Trưởng phòng bấm "Từ chối" kèm ghi chú "Tối đa chỉ giảm 1.5tr" | Báo giá quay về trạng thái `Draft`; tư vấn viên nhận thông báo điều chỉnh lại. | Sẵn sàng |
| `TC-QUOTE-04` | Phiên bản báo giá bất biến | Tạo bản V2 sau khi sửa giá | Bản V1 được lưu trữ giữ nguyên lịch sử; bản V2 mang số hiệu mới. | Sẵn sàng |

---

## 4. SUITE 4: HỢP ĐỒNG, ĐỒNG BỘ PARTY 360 & KÍCH HOẠT DỊCH VỤ

| Mã Test Case | Tên Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Mong Đợi (Pass Criteria) | Trạng Thái |
|---|---|---|---|:---:|
| `TC-CON-01` | Chuyển đổi Cơ hội thành công sang Hợp đồng | Bấm "Chuyển thành Hợp đồng" trên Opportunity Won | Tự động sinh `Com_Contracts` dạng `Draft`; tự động tạo hồ sơ học viên trong `Party_Parties`. | Sẵn sàng |
| `TC-CON-02` | Phát hiện xung đột số CCCD | Nhập số CCCD đã thuộc về một người khác trong hệ thống | Báo lỗi `PARTY_IDENTITY_MISMATCH`; rollback toàn bộ transaction; không sinh hợp đồng sai. | Sẵn sàng |
| `TC-CON-03` | Ký hợp đồng và lưu vết mã băm SHA256 | Upload file scan hợp đồng có đủ chữ ký và con dấu tròn | Lưu file vào `Doc_Documents`, tự động tính toán mã băm SHA256 lưu vết toàn vẹn; trạng thái `Signed`. | Sẵn sàng |
| `TC-CON-04` | Kích hoạt Hợp đồng sau khi nộp cọc Đợt 1 | Kế toán tạo Phiếu thu tiền 30.000.000 đ cho Đợt 1 | Hợp đồng chuyển sang `Active`; bắn sự kiện Outbox; mở khóa nghĩa vụ xếp lớp tiếng. | Sẵn sàng |
| `TC-CON-05` | Ngăn chặn xóa Hợp đồng đã kích hoạt | Người dùng bấm lệnh xóa trên Hợp đồng đang `Active` | Hệ thống từ chối thao tác với mã lỗi `ACTIVE_CONTRACT_CANNOT_BE_DELETED`. | Sẵn sàng |

---

## 5. SUITE 5: PHÂN QUYỀN DIRECT GBAC & CHE GIẤU DỮ LIỆU CÁ NHÂN (PII MASKING)

| Mã Test Case | Tên Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Mong Đợi (Pass Criteria) | Trạng Thái |
|---|---|---|---|:---:|
| `TC-SEC-01` | Giới hạn xem theo Chi nhánh (Branch Scope) | Nhân viên Chi nhánh TP.HCM đăng nhập tra cứu Lead | Chỉ nhìn thấy các Lead thuộc chi nhánh TP.HCM; không thấy Lead Hà Nội. | Sẵn sàng |
| `TC-SEC-02` | Tự động che giấu số điện thoại (Masking) | Tư vấn viên A xem danh sách Lead do Tư vấn viên B phụ trách | Cột số điện thoại hiển thị `0982***456`. | Sẵn sàng |
| `TC-SEC-03` | Lưu vết kiểm toán khi xem số điện thoại thật | Tư vấn viên bấm icon con mắt để xem đầy đủ số điện thoại | Hiển thị số đầy đủ; tự động ghi 1 dòng vào `Audit_SystemLogs` với Action `UNMASK_PHONE`. | Sẵn sàng |
| `TC-SEC-04` | Kiểm soát đa pháp nhân trên Hợp đồng | Kế toán Công ty Giáo dục xem hợp đồng Công ty Học viện | Bị từ chối truy cập (HTTP 403 Forbidden). | Sẵn sàng |

