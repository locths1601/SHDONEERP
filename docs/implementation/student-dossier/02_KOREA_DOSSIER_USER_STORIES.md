# SHD OneERP — Korea Dossier Incremental User Stories

**Epic:** SHD Korea Student Dossier  
**Status:** PROPOSED — verify existing implementation before coding  
**Sources:** SHD-KR-HS-01, SHD-KR-HS-02, workbook quản lý hồ sơ, Business Gap Matrix, Incremental Backlog.  
**Important:** Preserve original IDs US-KR-01..14. Do not duplicate STU-01/ADM-01.

## General Rules

- One PartyId per real person; multiple Applications are allowed.
- Documents Foundation owns files; AdmissionVisa owns dossier evidence/processing.
- Training status, dossier stage, current task, document collection, document processing, review, school submission and visa status are distinct.
- Korean legal/consular rules require official source verification, version and PO approval before automated enforcement.
- All stories require positive, negative, permission, scope, audit and regression evidence where applicable.

---

## US-KR-01 — Hồ sơ học vấn chi tiết

**Priority:** P1  
**Actor:** Chuyên viên hồ sơ  
**Dependency:** SYS-REF-02; ownership decision.

**Story:** Lưu lịch sử học vấn, trường, GPA, tốt nghiệp và số buổi nghỉ để đánh giá hồ sơ trường/visa.

**AC**
- AC01: Given hồ sơ có quyền sửa, When nhập học vấn THPT/lớp 10–12, Then validate thang điểm, đơn vị và lưu đúng.
- AC02: Given dữ liệu hợp lệ, When tính GPA, Then dùng công thức đã được PO duyệt; không mặc định trung bình ba năm.
- AC03: Given học viên có nhiều bậc học, When bổ sung, Then lưu được lịch sử và evidence.
- AC04: Given vượt ngưỡng cảnh báo cấu hình, When đánh giá, Then cảnh báo có nguồn/version, không tự động kết luận không đủ điều kiện.

**Ownership:** Kiểm tra master học vấn Party360/Training; Application có snapshot khi cần, không tạo hai nguồn sự thật.  
**Negative:** GPA sai scale, absence sai đơn vị, invalid dates, concurrency, cross-entity.  
**PO TBD:** GPA scale, công thức, source of truth, snapshot, ngưỡng.

---

## US-KR-02 — Người bảo lãnh và chứng minh tài chính

**Priority:** P1  
**Dependency:** Party relationships, security/retention decision.

**Story:** Liên kết người bảo lãnh và quản lý bằng chứng tài chính, thu nhập, tài sản theo Application.

**AC**
- AC01: Given sponsor đã có Party, When liên kết, Then dùng PartyId hiện có, không duplicate.
- AC02: Given nhiều nguồn thu nhập/tài sản, When khai báo, Then lưu loại, chủ sở hữu, tiền tệ, thời kỳ, evidence.
- AC03: Given tài liệu được upload, When lưu, Then liên kết Documents Foundation và áp dụng classification bảo mật.
- AC04: Given user thiếu quyền, When truy vấn API/UI, Then không lộ thông tin tài chính.

**Ownership:** Party giữ quan hệ; AdmissionVisa giữ dữ liệu chứng minh tài chính theo case.  
**Negative:** Duplicate sponsor, negative amount, currency, sensitive-file leakage, cross-scope.  
**PO TBD:** Loại tài sản, retention, masking, authorized roles.

---

## US-KR-03 — Checklist ba giai đoạn

**Priority:** P0  
**Dependency:** SYS-REF-02/06, Workflow, Documents.

**Story:** Cấu hình checklist Đầu vào, Nộp trường, Lãnh sự theo thị trường/trường/kỳ/phase/version.

**AC**
- AC01: Given approved applicable template, When tạo/khởi động Application, Then sinh checklist đúng phiên bản.
- AC02: Given document dùng ở phase trước, When reuse, Then cùng document có phase review độc lập.
- AC03: Given template version mới, When publish, Then case cũ giữ snapshot trừ khi có approved migration.
- AC04: Given mandatory item chưa đạt, When chuyển stage có guard, Then Workflow chặn và nêu lý do.

**Ownership:** AdmissionVisa checklist; Documents Foundation file.  
**Negative:** Template conflicts, expired version, wrong reviewer, stale evidence.  
**PO TBD:** Applicability precedence, exceptions, completion policy, migration.

---

## US-KR-04 — Chuẩn tên file và xuất ZIP

**Priority:** P1  
**Dependency:** US-KR-03, Documents.

**Story:** Sinh tên xuất theo naming policy và đóng gói bộ chứng từ theo checklist.

**AC**
- AC01: Given naming template hiệu lực, When chuẩn bị export, Then sinh tên phù hợp, giữ original filename/metadata.
- AC02: Given selected phase, When export ZIP, Then chỉ chứa authorized, approved, correct-version files.
- AC03: Given missing/unapproved item, When export, Then cảnh báo hoặc chặn theo policy.
- AC04: Given thiếu export permission, When gọi API, Then backend từ chối và audit.

**Negative:** ZIP traversal, duplicate names, Unicode, cross-scope, large files.  
**PO TBD:** Naming template, blocking policy, watermark, retention.

---

## US-KR-05 — Four-Eyes Cross-check

**Priority:** P0  
**Dependency:** US-KR-03, US-KR-13.

**Story:** Bước kiểm tra quan trọng phải được duyệt bởi người độc lập với người chuẩn bị.

**AC**
- AC01: Given user chuẩn bị document version, When tự approve, Then backend từ chối.
- AC02: Given reviewer độc lập có quyền/scope, When approve/reject, Then lưu reviewer, time, comment, version.
- AC03: Given file/version thay đổi sau duyệt, When xem review, Then approval cũ không tự áp dụng cho bản mới.
- AC04: Given mandatory review chưa đạt, When chuyển stage, Then Workflow chặn.

**Negative:** Self-approval, forged reviewer, concurrency, privilege escalation.  
**PO TBD:** Review steps, escalation, exception policy. Super Admin không bypass âm thầm.

---

## US-KR-06 — Dịch thuật và đối tác

**Priority:** P1  
**Dependency:** US-KR-03/05.

**Story:** Tạo batch dịch thuật, giao đối tác, theo dõi SLA, nhận và kiểm tra bản dịch.

**AC**
- AC01: Given eligible documents, When tạo batch, Then chọn partner, nhiều document, deadline.
- AC02: Given approaching/overdue deadline, When xem dashboard, Then cảnh báo theo SLA cấu hình.
- AC03: Given returned translation, When nhận, Then lưu version liên kết bản gốc.
- AC04: Given translation rejected, When xử lý, Then tạo rework và giữ lịch sử.

**Negative:** Unauthorized sharing, wrong version, duplicate request, overdue.  
**PO TBD:** Partners, SLA, delivery/custody, costs.

---

## US-KR-07 — Công chứng và hợp pháp hóa

**Priority:** P1  
**Dependency:** US-KR-06 hoặc eligible document.

**Story:** Theo dõi từng thủ tục công chứng, chứng nhận và hợp pháp hóa.

**AC**
- AC01: Given eligible document, When tạo request, Then lưu procedure, agency, dates, quantity.
- AC02: Given returned result, When nhận, Then lưu evidence, custodian, outcome.
- AC03: Given expiry rule đã được duyệt, When kiểm tra, Then cảnh báo theo effective policy.
- AC04: Given policy thay đổi, When publish, Then lịch sử giữ policy version cũ.

**Negative:** Wrong sequence, expired policy, invalid custody, unauthorized change.  
**PO TBD:** Cơ quan, phí, hiệu lực, quy định tem. Không hardcode tem vàng/tím.

---

## US-KR-08 — Nộp nhiều trường và phỏng vấn

**Priority:** P1  
**Dependency:** US-KR-03, School/Intake master, PO-006.

**Story:** Một dossier quản lý nhiều School Submission và Interview Attempts.

**AC**
- AC01: Given Application, When tạo School Submission, Then lưu school, program, intake, submission date, evidence.
- AC02: Given interview invitation, When tạo lịch, Then lưu timezone, mode, attendees, owner.
- AC03: Given result, When cập nhật, Then lưu outcome, source, history.
- AC04: Given retry/switch school, When tạo attempt mới, Then giữ toàn bộ attempts trước.

**Negative:** Duplicate attempts, timezone, invalid school, unauthorized result edits.  
**PO TBD:** Application grain, preferred school, max attempts (không hardcode).

---

## US-KR-09 — Invoice học phí trường

**Priority:** P1  
**Dependency:** US-KR-08, Finance contract.

**Story:** Theo dõi invoice trường, hạn nộp, tiền tệ, bằng chứng thanh toán và xác nhận trường đã nhận.

**AC**
- AC01: Given school invoice, When ghi nhận, Then lưu invoice number, school, submission, currency, amount, due date, document.
- AC02: Given exchange rate, When hiển thị quy đổi, Then có source/time/rounding và giữ nguyên original amount.
- AC03: Given authorized confirmation, When nhận event/confirmation, Then hiển thị payment status có nguồn.
- AC04: Given hồ sơ staff thiếu quyền, When mark Paid, Then backend từ chối.

**Negative:** Duplicate invoice, currency, false paid, unauthorized edit, cross-entity.  
**PO TBD:** Invoice owner, payment authority, reconciliation.

---

## US-KR-10 — Yêu cầu tài chính/sức khỏe phục vụ visa

**Priority:** P1  
**Dependency:** US-KR-02/03, approved policy.

**Story:** Áp dụng yêu cầu visa theo policy được duyệt, không hardcode pháp lý Hàn Quốc.

**AC**
- AC01: Given market/program/school/date, When load requirements, Then dùng approved effective version.
- AC02: Given financial evidence, When lưu, Then có document type, issuer, dates, confidentiality.
- AC03: Given health evidence, When lưu, Then có provider/date/validity theo policy.
- AC04: Given unverified policy, When đánh giá, Then yêu cầu manual review, không auto-pass/fail.

**Negative:** Sensitive data leak, policy conflict, expiry, wrong market.  
**PO TBD:** Official sources, effective dates, authorized approver.

---

## US-KR-11 — Visa Case và nộp lãnh sự

**Priority:** P1  
**Dependency:** US-KR-10, Workflow.

**Story:** Quản lý Visa Submission Attempts, biên nhận, yêu cầu bổ sung, phỏng vấn, kết quả.

**AC**
- AC01: Given VisaCase, When tạo attempt, Then lưu location, date, receipt, status, evidence.
- AC02: Given supplementary request, When ghi nhận, Then tạo task, owner, deadline.
- AC03: Given result, When cập nhật, Then lưu source/time/evidence, giữ attempts cũ.
- AC04: Given approved SLA/calendar, When tính due date, Then tính theo policy và ngày nghỉ có version.

**Negative:** Duplicate receipt, retries, unauthorized outcome, holiday errors.  
**PO TBD:** KVAC/consulate statuses, SLA, result source; không hardcode 20 ngày.

---

## US-KR-12 — Xuất cảnh và bàn giao

**Priority:** P2  
**Dependency:** US-KR-11, InternationalPlacement, OverseasCare.

**Story:** Ghi nhận xuất cảnh, bàn giao giấy tờ gốc, xác nhận đến nơi/nhập học.

**AC**
- AC01: Given ready-to-depart case, When lưu flight, Then có datetime/timezone/owner.
- AC02: Given physical originals, When handover, Then lưu item, giver, receiver, time, signed evidence.
- AC03: Given arrival/enrollment confirmation, When cập nhật, Then lưu source và phát event theo contract.
- AC04: Given missing confirmation, When close case, Then áp dụng approved completion guard.

**Negative:** Missing originals, wrong receiver, sensitive data, premature completion.  
**PO TBD:** Ownership, handover signatures, close conditions.

---

## US-KR-13 — Phân công và deadline

**Priority:** P0  
**Dependency:** Organization/IdentityAccess, SYS-REF-02.

**Story:** Phân công Consultant, Processing Officer, Reviewer và theo dõi deadline.

**AC**
- AC01: Given Application, When assign, Then lưu được các role theo RACI đã duyệt.
- AC02: Given reassignment, When lưu, Then giữ old/new actor, reason, effective time.
- AC03: Given milestone deadline, When approaching/overdue, Then cảnh báo theo calendar/SLA.
- AC04: Given assignee ngoài scope/inactive, When assign, Then backend từ chối.

**Negative:** Cross-entity assignment, inactive staff, concurrent reassignment.  
**PO TBD:** RACI, escalation, transfer policy, intake deadlines.

---

## US-KR-14 — Tách trạng thái học viên/hồ sơ/chứng từ

**Priority:** P0  
**Dependency:** SYS-REF-06, Workflow, Training ownership.

**Story:** Phân biệt Training Status, Dossier Stage, Current Action, Collection Status, Processing Status, Review Status, School Submission Status và Visa Status.

**AC**
- AC01: Given học viên đang học tiếng nhưng đã nộp trường, When mở Student 360, Then hiển thị hai trạng thái độc lập.
- AC02: Given dossier transition, When Workflow chạy, Then không tự đổi Training Status.
- AC03: Given document received nhưng đang dịch, When mở checklist, Then hiển thị Collection/Processing/Review riêng.
- AC04: Given status label đổi, When xem lịch sử, Then không làm sai nghĩa và audit.

**Negative:** Invalid transition, missing mapping, version mismatch, unauthorized update.  
**PO TBD:** Training source of truth, status taxonomy, workflow mapping.

## Common Acceptance Gate

Mỗi story phải có:
- Existing implementation audit.
- Approved DoR and contracts.
- Positive/negative/security tests.
- SQL Server integration evidence khi liên quan DB.
- No duplicate domain entities.
- No hardcoded mutable master data or unverified Korean policies.
- Eight report files and PO handoff.
