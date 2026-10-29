# SHD OneERP — SA-01 PARTY360 / STUDENT PROFILE BACKEND CONTRACT

**Domain Owner:** `Party360`  
**Mục tiêu:** Cung cấp hạ tầng định danh học viên (STU-01) dùng chung toàn hệ sinh thái SHD Corp.

---

### 1. NGUYÊN TẮC THIẾT KẾ
- Không tạo bảng nhân bản `Student` độc lập; tái sử dụng `Party_Parties`, `Party_Persons`, `Party_PartyRoles`, `Party_PartyContactMethods`, `Party_PartyIdentifications`.
- Một con người chỉ có 1 `PartyId` duy nhất. Vai trò học viên được biểu diễn bằng `PartyRole` (`RoleType = 'Student'`).
- Hỗ trợ quan hệ phụ huynh / người giám hộ qua `Party_PartyRelationships` (`FromPartyId`, `ToPartyId`, `RelationshipType`).
- Read-side qua Stored Procedure `sp_Party_Student_GetPagedList` và `sp_Party_Student_GetDetailById`.
- Áp dụng PII Masking: Số điện thoại (`090****123`) và CCCD/Hộ chiếu (`001099******`) được che nếu người truy vấn không có quyền Admin/Unmask.

---

### 2. APIS VÀ PERMISSIONS
- `GET /api/v1/parties/students` — Policy: `Permission:party.profile.view`
- `GET /api/v1/parties/students/{id}` — Policy: `Permission:party.profile.view`
- `POST /api/v1/parties/students` — Policy: `Permission:party.profile.create`
- `POST /api/v1/parties/{id}/identifications` — Policy: `Permission:party.profile.edit`
- `POST /api/v1/parties/{id}/relationships` — Policy: `Permission:party.profile.edit`

---

### 3. EVIDENCE VÀ KIỂM THỬ
- Entity Domain: `Party.cs` đã bổ sung `AddIdentification`, `AddRelationship`, collection `Relationships`.
- DTOs: `PartyDtos.cs` đã bổ sung `CreateStudentProfileRequest`, `StudentListItemDto`, `PartyIdentificationDto`, `PartyRelationshipDto`.
- Read Service: `PartyReadService.Sp.cs` đã triển khai `GetStudentsPagedAsync` và `GetStudentDetailAsync`.
- Tests: `CreateStudentValidator_WithValidStudentData_ShouldPass`, `CreateStudentValidator_WithInvalidCodeAndEmail_ShouldFail`, `AddPartyIdentificationValidator_WithValidData_ShouldPass`, `AddPartyRelationshipValidator_WithEmptyToParty_ShouldFail` đều PASS (145/145).

