# SHD OneERP — System Reference Data User Stories

**Epic:** SYS-REF — Cấu hình hệ thống / Dữ liệu nguồn  
**Status:** PROPOSED  
**Business owner:** System Administration  
**Technical owner:** Foundation/System Configuration, tùy kết quả audit hiện trạng.

## Phạm vi

Quản trị viên có thể tạo nhóm danh mục và giá trị qua UI, ví dụ quốc gia, tỉnh/thành, phường/xã, loại giấy tờ, trạng thái hồ sơ, thị trường du học, chương trình, kỳ nhập học và lý do nghiệp vụ.

Không dùng seed/hardcode làm cơ chế vận hành. Không xây EAV cho toàn bộ domain. Workflow, Checklist Template và transaction records có owner và vòng đời riêng.

---

## SYS-REF-01 — Quản lý nhóm danh mục

**Priority:** P0  
**Actor:** System Config Admin  
**Dependency:** GATE-00; PO-001, PO-002

**User Story:** Là quản trị viên, tôi muốn tạo và quản lý các nhóm danh mục qua giao diện để các module dùng chung mà không cần thay đổi code.

**Business Rules**
- Nhóm có Code, Name, Description, OwnerModule, ScopePolicy, Status, ManagementMode.
- Code unique trong namespace/scope.
- SYSTEM_CONTROLLED chỉ sửa trong giới hạn cho phép; ADMIN_MANAGED cho phép quản trị.
- Không xóa hoặc đổi code khi đã có tham chiếu.
- API phải fail-closed.

**Acceptance Criteria**
- **AC01:** Given admin có quyền, When tạo nhóm hợp lệ, Then nhóm được lưu, hiển thị và ghi audit.
- **AC02:** Given code trùng trong namespace/scope, When lưu, Then backend trả validation error, không tạo duplicate.
- **AC03:** Given nhóm đã được dùng, When yêu cầu xóa/đổi code, Then backend từ chối.
- **AC04:** Given user không có quyền, When gọi API create/update trực tiếp, Then bị từ chối.
- **AC05:** Given nhóm mới được kích hoạt, When UI quản trị tải danh sách, Then nhóm xuất hiện không cần deploy.

**Evidence:** UI CRUD, API GET/POST, migration/SP, duplicate tests, GBAC, audit, concurrency.

---

## SYS-REF-02 — Quản lý giá trị danh mục

**Priority:** P0  
**Dependency:** SYS-REF-01

**User Story:** Là quản trị viên, tôi muốn thêm/sửa/sắp xếp/ngừng sử dụng các giá trị danh mục để các module luôn dùng dữ liệu cập nhật.

**Business Rules**
- Value có stable Code, DisplayName, Description, SortOrder, IsActive, optional EffectiveFrom/To.
- Không liên kết bằng display label.
- Deactivation không làm mất dữ liệu lịch sử.
- Cache phải invalidated khi thay đổi.
- Có RowVersion và audit.

**Acceptance Criteria**
- **AC01:** Given catalog hợp lệ, When thêm value mới, Then lưu và hiển thị qua UI.
- **AC02:** Given value đã active, When mở dropdown nghiệp vụ, Then hiển thị qua API mà không cần seed/redeploy.
- **AC03:** Given value đã được dùng, When deactivate, Then hồ sơ cũ vẫn hiển thị đúng, tạo mới không chọn value inactive nếu policy cấm.
- **AC04:** Given hai admin sửa cùng value, When bản ghi stale được lưu, Then trả concurrency conflict.
- **AC05:** Given user ngoài scope, When truy vấn trực tiếp, Then backend không lộ value trái phép.

**Evidence:** GET SP, EF write, UI, concurrency, historical reference, permissions.

---

## SYS-REF-03 — Địa lý phân cấp và lịch sử địa giới

**Priority:** P0  
**Dependency:** SYS-REF-01/02, PO-005

**User Story:** Là quản trị viên, tôi muốn quản lý quốc gia và các cấp đơn vị hành chính theo nguồn có hiệu lực để hồ sơ học viên sử dụng địa chỉ nhất quán.

**Business Rules**
- Không giả định mọi quốc gia hoặc mọi thời kỳ đều có đúng ba cấp.
- Có Country, AdministrativeUnitType, Parent, Code, Name, EffectivePeriod, SourceVersion.
- Không tạo vòng lặp phân cấp.
- Địa chỉ lịch sử phải giữ được ngữ cảnh thời điểm ghi nhận.
- Import địa giới phải có nguồn, preview, validation.

**Acceptance Criteria**
- **AC01:** Given chọn country/parent, When truy vấn đơn vị con, Then chỉ trả về đơn vị hợp lệ theo phiên bản.
- **AC02:** Given đơn vị được sáp nhập/đổi tên, When cập nhật có hiệu lực, Then địa chỉ lịch sử không bị phá hủy.
- **AC03:** Given parent tạo cycle, When lưu, Then backend từ chối.
- **AC04:** Given import có duplicate/parent thiếu, When preview, Then báo lỗi theo dòng và không ghi dữ liệu sai.
- **AC05:** Given user không có quyền import, When gọi API, Then bị từ chối.

**Evidence:** Hierarchy, effective dating, historical address, import validation, authorization.

---

## SYS-REF-04 — Phân quyền, scope và audit danh mục

**Priority:** P0  
**Dependency:** SYS-REF-01/02, IdentityAccess/Organization

**User Story:** Là quản trị hệ thống, tôi muốn kiểm soát ai được xem, tạo, sửa, ngừng dùng, import/export và phê duyệt danh mục.

**Business Rules**
- Phân biệt VIEW/CREATE/UPDATE/DEACTIVATE/IMPORT/EXPORT/APPROVE theo permission registry thực tế.
- Backend kiểm tra Direct GBAC và Data Scope, không chỉ ẩn nút.
- Global/LegalEntity/Market scope chỉ dùng theo PO-approved policy.
- Audit có actor, action, timestamp, entity, before/after phù hợp, correlation ID.
- Bảo vệ PII và secrets trong logs.

**Acceptance Criteria**
- **AC01:** Given user chỉ có VIEW, When gọi update API, Then 403/denied theo conventions.
- **AC02:** Given user ngoài LegalEntity scope, When GET hoặc UPDATE value, Then không lộ hoặc thay đổi trái phép.
- **AC03:** Given thay đổi hợp lệ, When lưu, Then có audit đầy đủ.
- **AC04:** Given admin bị thu hồi quyền, When thực hiện lại thao tác, Then backend từ chối.
- **AC05:** Given value thuộc scope khác, When export, Then không bao gồm dữ liệu trái quyền.

**Evidence:** Permission matrix, negative API tests, cross-entity tests, audit.

**Implementation note:** Bảo mật nền tảng phải có ngay khi SYS-REF-01/02 được triển khai; SYS-REF-04 hoàn thiện quản trị nâng cao.

---

## SYS-REF-05 — Import/Export danh mục

**Priority:** P1  
**Dependency:** SYS-REF-02/04

**User Story:** Là quản trị viên, tôi muốn nhập/xuất danh mục hàng loạt có preview, kiểm tra và audit.

**Business Rules**
- Staging/preview trước khi ghi.
- Validate code, parent, scope, effective dates, duplicates, references.
- Idempotency hoặc duplicate-safe retry.
- Giới hạn file, kích thước, quyền và logging.
- Không ghi trực tiếp vào production bằng script tùy ý.

**Acceptance Criteria**
- **AC01:** Given file hợp lệ, When preview, Then hiển thị số dòng CREATE/UPDATE/UNCHANGED/ERROR.
- **AC02:** Given file có lỗi, When validate, Then hiển thị lỗi theo dòng, không silent import.
- **AC03:** Given batch được xác nhận, When import, Then có audit và kết quả thực thi.
- **AC04:** Given retry cùng batch, When thực thi, Then không tạo duplicate.
- **AC05:** Given export, When tải file, Then dữ liệu tuân thủ quyền/scope.

**Evidence:** Preview, batch logs, retry tests, export security, validation.

---

## SYS-REF-06 — Trạng thái danh mục và Workflow integration

**Priority:** P0  
**Dependency:** SYS-REF-02/04, Workflow Foundation

**User Story:** Là quản trị viên nghiệp vụ, tôi muốn quản lý danh mục trạng thái và ánh xạ với Workflow mà không làm sai quy trình xử lý hồ sơ đang chạy.

**Business Rules**
- Reference Data sở hữu code/label/sort/classification.
- Workflow sở hữu state/transition/guard/actor/version.
- Thêm value không tự động thêm transition.
- Thay đổi workflow phải có approval và migration policy cho running instances.
- Không hardcode nhãn trạng thái vào business logic.

**Acceptance Criteria**
- **AC01:** Given tạo status mới, When lưu, Then status có trong catalog nhưng chưa mặc nhiên là transition hợp lệ.
- **AC02:** Given workflow chưa phê duyệt transition, When chuyển trạng thái, Then backend từ chối.
- **AC03:** Given workflow version mới, When có case đang chạy trên version cũ, Then giữ khả năng diễn giải lịch sử.
- **AC04:** Given status đang được tham chiếu, When deactivate, Then hiển thị impact và áp dụng approval policy.
- **AC05:** Given user không có quyền cấu hình workflow, When gọi transition configuration API, Then bị từ chối.

**Evidence:** Workflow integration, unauthorized transition, version history, running-case regression.

## Epic Acceptance

- Admin tạo catalog/value qua UI và API.
- Module nghiệp vụ đọc danh mục động.
- Không cần sửa code/seed/redeploy khi thêm value hợp lệ.
- Dữ liệu cũ được bảo vệ; scope/audit/concurrency đạt.
- Workflow và domain business rules không bị thay đổi chỉ vì thêm danh mục.
