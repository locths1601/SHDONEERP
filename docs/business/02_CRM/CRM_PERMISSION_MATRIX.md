# MA TRẬN PHÂN QUYỀN DIRECT GBAC V4.2 — PHÂN HỆ CRM (CRM PERMISSION MATRIX)
Mã tài liệu: `BUS-DOC-02-07` | Phiên bản: `1.0.0` | Ngày hiệu lực: `2026-10-28`  
Phụ trách: **Senior Product Owner / Enterprise Business Analyst / Solution Architect**  
Tích hợp: **FND-01 GroupUser & Authorization & FND-04 Module/Feature Registry**

---

## 1. NGUYÊN TẮC PHÂN QUYỀN DIRECT GBAC KẾT HỢP DATA SCOPING

Phân hệ CRM tuân thủ nghiêm ngặt mô hình phân quyền 3 lớp đã được thiết lập tại **ADR-003** và **ADR-008**:
1. **Lớp 1 — Quyền Nguyên tử (Atomic Permission):** Người dùng phải có mã quyền phù hợp định dạng `crm.<entity>.<action>` được gán thông qua Nhóm quyền (`Identity_UserGroups`).
2. **Lớp 2 — Phạm vi Dữ liệu (Data Scope):** Dữ liệu trả về hoặc thao tác ghi bị giới hạn theo Scope được cấu hình trong bảng `Identity_UserGroupMembers`:
   - `Global`: Toàn bộ tập đoàn (Tổng Giám đốc, Ban Kiểm soát).
   - `LegalEntity`: Giới hạn trong Pháp nhân được phân công.
   - `BusinessUnit`: Giới hạn trong Khối kinh doanh (Ví dụ: Khối Du học Hàn Quốc).
   - `Branch`: Giới hạn tại Cơ sở/Chi nhánh nơi nhân viên làm việc (Campus Cầu Giấy, Chi nhánh TP.HCM).
   - `Self`: Chỉ xem và thao tác trên những Lead/Opportunity do chính mình sở hữu hoặc được phân bổ (`AssignedToUserId = CurrentUserId`).
3. **Lớp 3 — Che giấu Dữ liệu Nhạy cảm (Data Masking Gate):** Nhân viên xem bản ghi ngoài quyền sở hữu sẽ tự động bị che giấu số điện thoại và CCCD của học viên.

---

## 2. DANH MỤC QUYỀN NGUYÊN TỬ PHÂN HỆ CRM (PERMISSIONS CATALOG)

| STT | Permission Code | Tên Quyền Tiếng Việt | Mô Tả Phạm Vi Thao Tác | Phân Loại Rủi Ro |
|---|---|---|---|:---:|
| 1 | `crm.lead.view` | Xem danh sách & Chi tiết Lead | Xem danh sách khách hàng tiềm năng trong phạm vi Scope được cấp. | Nội bộ (Internal) |
| 2 | `crm.lead.create` | Tạo mới Khách hàng Tiềm năng | Nhập tay Lead mới hoặc chạy chức năng import file Excel. | Nội bộ (Internal) |
| 3 | `crm.lead.edit` | Cập nhật Thông tin Lead | Chỉnh sửa thông tin học bạ, nhu cầu, phân loại điểm của Lead. | Nội bộ (Internal) |
| 4 | `crm.lead.delete` | Xóa mềm Lead | Chỉ dành cho Quản trị viên khi Lead bị rác hoặc sai lệch dữ liệu. | Hạn chế (Restricted) |
| 5 | `crm.lead.assign` | Phân bổ & Thu hồi Lead | Gán nhân viên tư vấn phụ trách, chuyển người phụ trách hoặc thu hồi. | Quan trọng (Confidential) |
| 6 | `crm.consultation.view` | Xem Nhật ký Tư vấn | Đọc lịch sử cuộc gọi, biên bản tư vấn và khảo sát nhu cầu. | Nội bộ (Internal) |
| 7 | `crm.consultation.create` | Tạo Nhật ký Tư vấn | Thêm mới bản ghi cuộc gọi, kết quả tương tác và đặt lịch hẹn. | Nội bộ (Internal) |
| 8 | `crm.opportunity.view` | Xem Phễu Cơ hội Kinh doanh | Xem Kanban board và danh sách cơ hội tuyển sinh. | Nội bộ (Internal) |
| 9 | `crm.opportunity.manage` | Quản lý Cơ hội Kinh doanh | Tạo mới, kéo thả thay đổi giai đoạn phễu, cập nhật giá trị dự kiến. | Nội bộ (Internal) |
| 10 | `crm.opportunity.convert`| Chuyển đổi Cơ hội sang Hợp đồng | Kích hoạt liên kết Party 360 và khởi tạo Hợp đồng sang BUS-02. | Quan trọng (Confidential) |
| 11 | `crm.campaign.manage` | Quản lý Chiến dịch & Nguồn MKT | Thiết lập chiến dịch, ngân sách, lấy webhook key cho quảng cáo. | Quan trọng (Confidential) |
| 12 | `crm.analytics.view` | Xem Dashboard & Báo cáo Tuyển sinh | Xem báo cáo tỷ lệ chuyển đổi, hiệu suất tư vấn và doanh số. | Quan trọng (Confidential) |

---

## 3. MA TRẬN ÁNH XẠ NHÓM NGƯỜI DÙNG & QUYỀN HẠN (ROLE-TO-PERMISSION MATRIX)

| Mã Quyền (Permission Code) | Quản trị Toàn quyền (`AdminGroup`) | Giám đốc BU / Chi nhánh (`SalesDirector`) | Trưởng nhóm Tuyển sinh (`SalesManager`) | Chuyên viên Tư vấn Tuyển sinh (`SalesStaff`) | Chuyên viên Marketing (`MarketingStaff`) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Phạm vi Scope Mặc định** | **Global** | **BU / Branch** | **Branch** | **Self** | **BU** |
| `crm.lead.view` | [x] Full | [x] In Scope | [x] In Scope | [x] Self Only | [x] In Scope |
| `crm.lead.create` | [x] | [x] | [x] | [x] | [x] (Import Batch) |
| `crm.lead.edit` | [x] | [x] | [x] | [x] (Chỉ Lead của mình) | [ ] |
| `crm.lead.delete` | [x] | [ ] | [ ] | [ ] | [ ] |
| `crm.lead.assign` | [x] | [x] | [x] | [ ] | [ ] |
| `crm.consultation.view` | [x] | [x] | [x] | [x] | [ ] |
| `crm.consultation.create` | [x] | [x] | [x] | [x] | [ ] |
| `crm.opportunity.view` | [x] | [x] | [x] | [x] (Self Only) | [ ] |
| `crm.opportunity.manage` | [x] | [x] | [x] | [x] (Của mình) | [ ] |
| `crm.opportunity.convert` | [x] | [x] | [x] | [x] (Của mình) | [ ] |
| `crm.campaign.manage` | [x] | [x] | [ ] | [ ] | [x] Full |
| `crm.analytics.view` | [x] Toàn quốc | [x] BU / Chi nhánh | [x] Chi nhánh / Nhóm | [x] (KPI Cá nhân) | [x] (ROI Chiến dịch) |

---

## 4. MA TRẬN ĐĂNG KÝ VÀO REGISTRY PLATFORM (FND-04 COMPATIBLE)

Khi triển khai code thực tế, các quyền trên sẽ được seed vào `Identity_Permissions` và ánh xạ qua `System_FeatureActionPermissions` như sau:

```sql
-- Trích đoạn Seed Registry Permissions cho CRM Module
INSERT INTO [dbo].[Identity_Permissions] ([Id], [Code], [Name], [Module], [Description]) VALUES
(NEWID(), 'crm.lead.view', N'Xem danh sách khách hàng tiềm năng', 'CRM', N'Xem danh sách và chi tiết Lead theo phạm vi quản trị'),
(NEWID(), 'crm.lead.create', N'Tạo mới khách hàng tiềm năng', 'CRM', N'Thêm mới Lead thủ công hoặc import danh sách file Excel'),
(NEWID(), 'crm.lead.edit', N'Cập nhật thông tin khách hàng', 'CRM', N'Chỉnh sửa thông tin học viên tiềm năng'),
(NEWID(), 'crm.lead.assign', N'Phân bổ chuyên viên phụ trách', 'CRM', N'Phân bổ hoặc chuyển người phụ trách Lead cho chuyên viên'),
(NEWID(), 'crm.opportunity.convert', N'Chuyển đổi sang hợp đồng', 'CRM', N'Chuyển đổi cơ hội thành công sang hợp đồng và liên kết Party 360');
```

