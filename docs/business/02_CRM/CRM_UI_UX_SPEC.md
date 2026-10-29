# ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG — PHÂN HỆ CRM (CRM UI/UX SPECIFICATION)
Mã tài liệu: `BUS-DOC-02-08` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Chuẩn công nghệ UI: **React 18 + TypeScript strict + Tailwind CSS + shadcn/ui + Lucide Icons + TanStack Query**

---

## 1. TỔNG QUAN HỆ THỐNG MÀN HÌNH CRM (SCREEN CATALOG)

Phân hệ CRM cung cấp không gian làm việc chuyên biệt theo từng vai trò:
1. **`SCR-CRM-01` — CRM Executive & Counselor Dashboard:** Bảng điều khiển phễu chuyển đổi, cảnh báo vi phạm SLA và chỉ số KPI.
2. **`SCR-CRM-02` — Lead Management Workspace:** Danh sách khách hàng tiềm năng, bộ lọc đa chiều, cơ chế phân bổ hàng loạt.
3. **`SCR-CRM-03` — Lead Detail & Quick Activity Drawer:** Ngăn kéo trượt xem chi tiết hồ sơ học viên, lịch sử chạm và ghi nhanh nhật ký cuộc gọi.
4. **`SCR-CRM-04` — Opportunity Kanban Pipeline:** Bảng trực quan hóa phễu cơ hội kinh doanh dạng thẻ kéo thả (Drag-and-Drop).
5. **`SCR-CRM-05` — Conversion & Party 360 Handover Modal:** Hộp thoại chuyển đổi cơ hội thành công sang hợp đồng và liên kết định danh.

---

## 2. ĐẶC TẢ CHI TIẾT TỪNG MÀN HÌNH

---

### MÀN HÌNH: SCR-CRM-02 — LEAD MANAGEMENT WORKSPACE (KHÔNG GIAN QUẢN LÝ LEAD)

#### 1. Mục đích & Tác nhân sử dụng
- **Mục đích:** Giúp tư vấn viên và trưởng phòng theo dõi, lọc, tìm kiếm và thao tác trên danh sách hàng nghìn khách hàng tiềm năng mà không bị trễ tải.
- **Tác nhân:** Chuyên viên Tuyển sinh, Trưởng nhóm Tuyển sinh, Giám đốc Chi nhánh.

#### 2. Bố cục Giao diện (Layout Wireframe)

```
+----------------------------------------------------------------------------------------------------+
|  BREADCRUMB: Tuyển sinh / Khách hàng tiềm năng (Leads)                          [ + Thêm mới Lead ]|
+----------------------------------------------------------------------------------------------------+
|  TÌM KIẾM NHANH: [ Search họ tên, SĐT, mã lead...         ] [ Lọc nâng cao v ] [ Export Excel ]     |
+----------------------------------------------------------------------------------------------------+
|  STATUS TABS: (All: 1,420) | (Mới: 45) | (Đã gán: 120) | (Đã liên hệ: 380) | (Vi phạm SLA: 12) !  |
+----------------------------------------------------------------------------------------------------+
|  THANH THAO TÁC HÀNG LOẠT (Khi tích chọn >= 1 dòng):                                              |
|  Đã chọn 5 dòng: [ Phân bổ cho nhân viên v ] [ Gán nhãn Tag v ] [ Đổi trạng thái v ]              |
+----+-------------+--------------------+----------------+--------------+---------+----------+-------+
| [x]| Mã Lead     | Họ & Tên Học Viên  | Số Điện Thoại  | Chương Trình | Xếp Hạng| SLA Đếm  | Phụ   |
|    |             |                    |                | Quan Tâm     | (Tier)  | Ngược    | Trách |
+----+-------------+--------------------+----------------+--------------+---------+----------+-------+
| [ ]| LD-2610-089 | Trần Hoàng Nam     | 0982***456     | Hàn Quốc D4  | [ HOT ] | [ 08:42 ]| MinhNV|
| [ ]| LD-2610-090 | Lê Thu Thảo        | 0914***123     | Đức Điều Dưỡng| [WARM] | [ 01:15h]| LanNT |
| [ ]| LD-2610-091 | Phạm Minh Đức      | 0978***888     | Nhật Kỹ Sư   | [COLD] | [  --  ] | Chưa  |
| [ ]| LD-2610-092 | Vũ Thị Hải Yến     | 0905***999     | Hàn Quốc D2  | [ HOT ] | [QUÁ HẠN]| TuấnLA|
+----+-------------+--------------------+----------------+--------------+---------+----------+-------+
| Trang 1 / 72  | Hiển thị: [ 20 dòng v ]                              < Trước  [1] 2 3 ... 72  Sau >|
+----------------------------------------------------------------------------------------------------+
```

#### 3. Các Thành phần Tương tác & Hành động (Actions)
- **Cột Số Điện Thoại (Masked Phone Number):**
  - Mặc định che giấu: `0982***456`.
  - Có icon con mắt bên cạnh. Khi người dùng có quyền click mở, hệ thống gửi request giải mã và lưu vết audit log.
- **Cột Đếm ngược SLA (Countdown Timer Badge):**
  - Còn $> 50\%$ thời gian: Badge màu xanh lục (`bg-emerald-50 text-emerald-700`).
  - Còn $< 25\%$ thời gian: Badge màu cam nhạt (`bg-amber-50 text-amber-700`).
  - Quá hạn: Badge màu đỏ nhấp nháy (`bg-rose-100 text-rose-800 animate-pulse`), hiển thị dòng chữ `QUÁ HẠN 24m`.
- **Hành động Click vào Dòng (Row Click):** Mở Slide-over Drawer `SCR-CRM-03` từ cạnh phải màn hình mà không làm tải lại trang.

#### 4. Quy tắc Kiểm tra Dữ liệu Form Thêm mới Lead (Form Validation)
- `FullName`: Bắt buộc, độ dài từ 3 đến 100 ký tự tiếng Việt.
- `PhoneNumber`: Bắt buộc, đúng định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng `03`, `05`, `07`, `08`, `09` hoặc tiền tố `+84`).
- `TargetProgram`: Bắt buộc chọn từ Dropdown (lấy từ Master Data).
- `HighSchoolGpa`: Số thực từ 0.00 đến 10.00.

#### 5. Trạng thái Hiển thị (UI States)
- **Loading State:** Sử dụng `Skeleton` table gồm 5 dòng shimmer, giữ nguyên header bảng.
- **Empty State:** Hiển thị minh họa hộp rỗng với thông điệp: *"Không tìm thấy khách hàng tiềm năng nào phù hợp với bộ lọc hiện tại"*, kèm nút bấm *"Xóa toàn bộ bộ lọc"*.
- **Error State:** Banner cảnh báo màu đỏ với mã lỗi `QUERY_EXECUTION_ERROR`, kèm nút *"Thử lại (Retry)"*.

---

### MÀN HÌNH: SCR-CRM-03 — LEAD DETAIL & ACTIVITY DRAWER (NGĂN KÉO TƯ VẤN NHANH)

#### 1. Bố cục Ngăn kéo (Slide-over Drawer - Rộng 650px)

```
+--------------------------------------------------------------------+
| [X Đóng]   HỒ SƠ KHÁCH HÀNG: TRẦN HOÀNG NAM               [ Sửa ]  |
| Mã: LD-2610-089  |  Trạng thái: [ CONTACTED ]  |  Tier: [ HOT ]     |
+--------------------------------------------------------------------+
| THÔNG TIN CHUNG              | NĂNG LỰC & NGUYỆN VỌNG              |
| • SĐT: 0982 123 456 (Gọi)    | • GPA Cấp 3: 7.8                    |
| • Email: nam.th@gmail.com    | • Tốt nghiệp: 2025 (Chưa gap)       |
| • Tỉnh thành: Hà Nội         | • Chương trình: Hàn Quốc D4-1       |
| • Nguồn: Facebook Fanpage KR | • Người phụ trách: Nguyễn Văn Minh  |
+--------------------------------------------------------------------+
| [ TAB: NHẬT KÝ CUỘC GỌI ]  [ TAB: KHẢO SÁT ]  [ TAB: ĐA ĐIỂM CHẠM ]|
+--------------------------------------------------------------------+
| + GHI NHANH CUỘC GỌI MỚI:                                          |
| Kết quả: [ Đã liên hệ - Rất quan tâm v ]  Thời lượng: [ 320 ] giây |
| Ghi chú: Học viên muốn đi kỳ Tháng 9/2026 trường Đại học Chung-Ang. |
|          Phụ huynh lo lắng về chi phí mở sổ tiết kiệm ngân hàng.   |
| Hẹn gọi lại: [ 2026-10-30 09:30 ]  Hành động: [ Gửi Brochure Zalo ]|
|                                                [ + Lưu Nhật Ký ]   |
+--------------------------------------------------------------------+
| DÒNG THỜI GIAN TƯƠNG TÁC (TIMELINE):                               |
| [28/10 14:15] Cuộc gọi: Đã liên hệ (MinhNV) - "Tư vấn lộ trình..." |
| [28/10 10:00] Tiếp nhận từ Form Ads: "Chiến dịch Mùa Thu 2026"     |
+--------------------------------------------------------------------+
| HÀNH ĐỘNG CUỐI:                                                    |
| [ Chuyển người phụ trách ]   [ Báo Thất Bại ]   [ + TẠO CƠ HỘI MỚI ]|
+--------------------------------------------------------------------+
```

---

### MÀN HÌNH: SCR-CRM-04 — OPPORTUNITY KANBAN PIPELINE (BẢNG PHỄU CƠ HỘI)

#### 1. Mô tả Chức năng Kéo Thả (Drag-and-Drop)
- Hiển thị 5 cột tương ứng 5 giai đoạn: `Discovery` (10%) $\rightarrow$ `ValueProposition` (25%) $\rightarrow$ `ProposalSent` (50%) $\rightarrow$ `Negotiation` (75%) $\rightarrow$ `ClosedWon / Lost`.
- Mỗi thẻ (Card) hiển thị:
  - Tên học viên & Mã cơ hội.
  - Tên gói chương trình quan tâm (Badge màu sắc theo quốc gia).
  - Giá trị dự kiến (Ví dụ: `185,000,000 đ`).
  - Tên tư vấn viên phụ trách & Avatar.
- Khi người dùng kéo thẻ từ `ProposalSent` sang `Negotiation`: Tự động gọi API cập nhật giai đoạn; nếu chuyển sang `ClosedWon`: Tự động kích hoạt Modal `SCR-CRM-05`.
- Nếu chuyển sang `ClosedLost`: Mở popup bắt buộc chọn mã lý do thất bại.

