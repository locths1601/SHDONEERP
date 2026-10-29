# MA TRẬN PHÂN QUYỀN DIRECT GBAC V4.2 — PHÂN HỆ THƯƠNG MẠI & HỢP ĐỒNG (BUS-02)
Mã tài liệu: `BUS-DOC-03-07` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tích hợp: **FND-01 GroupUser & Authorization & FND-04 Module/Feature Registry**

---

## 1. NGUYÊN TẮC BẢO MẬT HỢP ĐỒNG & DỮ LIỆU TÀI CHÍNH THƯƠNG MẠI

Hợp đồng và Báo giá là các tài sản thông tin thuộc cấp độ bảo mật cao (`Confidential` đến `Restricted`). Phân quyền trong phân hệ Commercial phải đảm bảo:
1. **Kiểm soát Đa Pháp nhân Chặt chẽ:** Kế toán hoặc Cán bộ Hợp đồng của Pháp nhân A tuyệt đối không được xem hoặc can thiệp vào Hợp đồng thuộc Pháp nhân B trừ khi có quyền hạn `Global` (Ban Kiểm soát nội bộ hoặc Tổng Giám đốc Tập đoàn).
2. **Tách biệt Thẩm quyền (Segregation of Duties - SoD):**
   - Chuyên viên tư vấn (người bán hàng) có thể tạo Báo giá nhưng không thể tự phê duyệt mức chiết khấu vượt hạn mức của mình.
   - Chuyên viên tư vấn không được quyền tự ý kích hoạt Hợp đồng sang trạng thái `Active`; quyền kích hoạt chỉ thuộc về Kế toán sau khi có chứng từ thu tiền.
   - Quyết định thanh lý, chấm dứt hoặc bồi thường hợp đồng bắt buộc phải do Giám đốc Pháp nhân phê chuẩn.

---

## 2. DANH MỤC QUYỀN NGUYÊN TỬ PHÂN HỆ COMMERCIAL (PERMISSIONS CATALOG)

| STT | Permission Code | Tên Quyền Tiếng Việt | Mô Tả Phạm Vi Thao Tác | Cấp Độ Bảo Mật |
|---|---|---|---|:---:|
| 1 | `commercial.catalog.view` | Xem Danh mục Sản phẩm & Giá | Tra cứu danh mục gói sản phẩm, dịch vụ và bảng giá niêm yết. | Nội bộ (Internal) |
| 2 | `commercial.catalog.manage` | Quản lý Sản phẩm & Bảng giá | Thêm/sửa sản phẩm, định mức gói, cấu hình bảng giá đa tầng. | Quan trọng (Confidential) |
| 3 | `commercial.quotation.view` | Xem Báo giá Thương mại | Xem danh sách và chi tiết các bảng báo giá trong phạm vi Scope. | Nội bộ (Internal) |
| 4 | `commercial.quotation.create` | Tạo mới & Sửa Báo giá | Soạn thảo báo giá từ cơ hội hoặc tạo mới báo giá cho học viên. | Nội bộ (Internal) |
| 5 | `commercial.quotation.approve`| Phê duyệt Chiết khấu Báo giá | Duyệt các báo giá có mức giảm giá hoặc học bổng vượt hạn mức. | Quan trọng (Confidential) |
| 6 | `commercial.contract.view` | Xem Hợp đồng Dịch vụ | Tra cứu danh sách và nội dung hợp đồng trong phạm vi quản trị. | Quan trọng (Confidential) |
| 7 | `commercial.contract.create` | Soạn thảo Hợp đồng Dịch vụ | Khởi tạo hợp đồng nháp từ báo giá hoặc cơ hội kinh doanh. | Quan trọng (Confidential) |
| 8 | `commercial.contract.sign` | Ký duyệt Đại diện Pháp nhân | Đại diện pháp nhân ký số/phê duyệt phát hành hợp đồng chính thức. | Hạn chế (Restricted) |
| 9 | `commercial.contract.activate` | Kích hoạt Hợp đồng Dịch vụ | Xác nhận thanh toán Đợt 1 và đưa hợp đồng vào thực thi. | Quan trọng (Confidential) |
| 10 | `commercial.contract.terminate`| Thanh lý & Hủy Hợp đồng | Phê duyệt quyết định thanh lý, hoàn phí khi trượt visa hoặc rút hồ sơ. | Hạn chế (Restricted) |
| 11 | `commercial.obligation.view` | Xem Nghĩa vụ Dịch vụ | Theo dõi tiến độ bàn giao các nghĩa vụ đào tạo, visa và hải ngoại. | Nội bộ (Internal) |
| 12 | `commercial.obligation.assign` | Điều phối & Bàn giao Nghĩa vụ | Bàn giao hồ sơ học viên cho các khối vận hành chuyên trách. | Nội bộ (Internal) |

---

## 3. MA TRẬN PHÂN BỔ QUYỀN HẠN THEO VAI TRÒ DOANH NGHIỆP (ROLE MAPPING)

| Mã Quyền (Permission Code) | Ban Tổng Giám Đốc (`BoardDirectors`) | Giám Đốc Pháp Nhân (`LegalDirector`) | Giám Đốc Chi Nhánh (`BranchDirector`) | Cán Bộ Hợp Đồng / Pháp Chế (`ContractOfficer`) | Kế Toán Thu Công Nợ (`Accountant`) | Chuyên Viên Tư Vấn (`Counselor`) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Phạm vi Scope Mặc định** | **Global** | **LegalEntity** | **Branch** | **LegalEntity** | **LegalEntity / Branch** | **Branch / Self** |
| `commercial.catalog.view` | [x] Full | [x] | [x] | [x] | [x] | [x] In Scope |
| `commercial.catalog.manage`| [x] Full | [x] In LegalEntity | [ ] | [ ] | [ ] | [ ] |
| `commercial.quotation.view`| [x] Full | [x] | [x] | [x] | [x] | [x] Self Only |
| `commercial.quotation.create`| [x] | [ ] | [x] | [x] | [ ] | [x] |
| `commercial.quotation.approve`| [x] Full ($>5tr$) | [x] In LE | [x] ($\le 5tr$) | [ ] | [ ] | [ ] |
| `commercial.contract.view` | [x] Full | [x] In LE | [x] In Branch | [x] In LE | [x] In LE | [x] Self Only |
| `commercial.contract.create`| [x] | [ ] | [x] | [x] Full | [ ] | [x] (Khởi tạo nháp) |
| `commercial.contract.sign` | [x] Full | [x] In LE | [ ] (Trừ ủy quyền) | [ ] | [ ] | [ ] |
| `commercial.contract.activate`| [x] | [x] | [ ] | [ ] | [x] Full (Sau thu tiền) | [ ] |
| `commercial.contract.terminate`| [x] Full | [x] In LE | [ ] (Chỉ đề xuất) | [x] (Thẩm tra) | [ ] (Thực chi hoàn) | [ ] |
| `commercial.obligation.view` | [x] Full | [x] | [x] | [x] | [x] | [x] (Của học viên mình) |
| `commercial.obligation.assign` | [x] | [x] | [x] | [x] | [ ] | [ ] |

