# 05 — MÔ HÌNH PHÂN QUYỀN DIRECT GBAC v4.2

## 1. Nguyên tắc cốt lõi
Hệ thống áp dụng mô hình **Direct GBAC v4.2 (Group-Based Access Control)** kết hợp **Data Scoping**:
1. Quyền (Permission) được định nghĩa theo hành động cụ thể trên tài nguyên (`module.resource.action`).
2. Quyền không bao giờ được gán trực tiếp cho User mà luôn được gán thông qua **UserGroup**.
3. Thành viên tham gia nhóm (`UserGroupMember`) có thể được giới hạn phạm vi hiệu lực (`Scope`):
   - `Global`: Có quyền trên toàn hệ thống (dành cho Ban Lãnh đạo Tập đoàn hoặc Admin IT).
   - `LegalEntity`: Chỉ có quyền trong phạm vi Pháp nhân được chỉ định.
   - `BusinessUnit`: Chỉ có quyền trong Đơn vị kinh doanh được chỉ định.
   - `Branch`: Chỉ có quyền trong Chi nhánh / Cơ sở đào tạo được chỉ định.
4. **Quyền Hiệu Lực (Effective Permission)**:
   $$\text{HasPermission}(U, P, E) = \exists M \in \text{Memberships}(U): P \in \text{Permissions}(M.\text{Group}) \land \text{IsScopeApplicable}(M, E)$$

## 2. Nhóm quản trị hệ thống
- Nhóm `ADMINISTRATORS` (Code: `ADMINISTRATORS`, không dựa vào ID số).
- Nhóm này có cờ `IsSystem = true`.
- Được bypass kiểm tra quyền ứng dụng thông thường nhưng **không** được bỏ qua Audit Log và các quy tắc bảo vệ dữ liệu bí mật/chữ ký bảo mật.

## 3. Thực thi kiểm soát tại Backend
- Ở cấp độ Controller/Action: Sử dụng ASP.NET Core Authorization Policy `[Authorize(Policy = "Permission:org.legal_entity.view")]`.
- Ở cấp độ Data Query (Stored Procedures): Truyền tham số `@CurrentUserId` hoặc danh sách `@AllowedLegalEntityIds` vào Stored Procedure để thực hiện lọc dữ liệu ngay tại database.
- Cấm tuyệt đối việc client truyền cờ "isAdmin = true" để bypass hoặc chỉ kiểm tra quyền ở giao diện frontend.
