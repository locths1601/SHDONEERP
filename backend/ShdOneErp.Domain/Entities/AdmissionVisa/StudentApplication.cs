using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using PartyEntity = ShdOneErp.Domain.Entities.Party.Party;

namespace ShdOneErp.Domain.Entities.AdmissionVisa;

public class StudentApplication : BaseEntity
{
    public string ApplicationCode { get; private set; } = string.Empty;
    public Guid StudentPartyId { get; private set; }
    public PartyEntity? StudentParty { get; private set; }

    public Guid LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }

    public Guid? BusinessUnitId { get; private set; }
    public BusinessUnit? BusinessUnit { get; private set; }

    public Guid? BranchId { get; private set; }
    public Branch? Branch { get; private set; }

    public string TargetMarket { get; private set; } = string.Empty; // Korea, Japan, Germany, Australia, etc.
    public string IntakeTerm { get; private set; } = string.Empty;    // 2026-Fall, 2027-Spring
    public string ProgramName { get; private set; } = string.Empty;   // Du học tiếng D4-1, Du học nghề D4-6, etc.
    public string Status { get; private set; } = "Draft";             // Draft, Submitted, UnderReview, Accepted, Rejected, Withdrawn

    public Guid? AssignedUserId { get; private set; }
    public string? Notes { get; private set; }

    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAtUtc { get; private set; }

    public ICollection<ChecklistItem> ChecklistItems { get; private set; } = new List<ChecklistItem>();

    private StudentApplication() { }

    public StudentApplication(
        string applicationCode,
        Guid studentPartyId,
        Guid legalEntityId,
        string targetMarket,
        string intakeTerm,
        string programName,
        Guid? businessUnitId = null,
        Guid? branchId = null,
        Guid? assignedUserId = null,
        string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(applicationCode))
            throw new BusinessRuleViolationException("INVALID_APPLICATION_CODE", "Mã hồ sơ du học không được để trống.");
        if (studentPartyId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_STUDENT_PARTY", "Học viên chỉ định không hợp lệ.");
        if (legalEntityId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_LEGAL_ENTITY", "Pháp nhân tiếp nhận hồ sơ không hợp lệ.");
        if (string.IsNullOrWhiteSpace(targetMarket))
            throw new BusinessRuleViolationException("INVALID_TARGET_MARKET", "Thị trường du học mục tiêu không được để trống.");
        if (string.IsNullOrWhiteSpace(intakeTerm))
            throw new BusinessRuleViolationException("INVALID_INTAKE_TERM", "Kỳ tuyển sinh không được để trống.");
        if (string.IsNullOrWhiteSpace(programName))
            throw new BusinessRuleViolationException("INVALID_PROGRAM_NAME", "Chương trình tuyển sinh không được để trống.");

        ApplicationCode = applicationCode.Trim().ToUpperInvariant();
        StudentPartyId = studentPartyId;
        LegalEntityId = legalEntityId;
        BusinessUnitId = businessUnitId;
        BranchId = branchId;
        TargetMarket = targetMarket.Trim();
        IntakeTerm = intakeTerm.Trim();
        ProgramName = programName.Trim();
        AssignedUserId = assignedUserId;
        Notes = notes?.Trim();
        Status = "Draft";
    }

    public void Update(string targetMarket, string intakeTerm, string programName, string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(targetMarket))
            throw new BusinessRuleViolationException("INVALID_TARGET_MARKET", "Thị trường du học mục tiêu không được để trống.");
        if (string.IsNullOrWhiteSpace(intakeTerm))
            throw new BusinessRuleViolationException("INVALID_INTAKE_TERM", "Kỳ tuyển sinh không được để trống.");
        if (string.IsNullOrWhiteSpace(programName))
            throw new BusinessRuleViolationException("INVALID_PROGRAM_NAME", "Chương trình tuyển sinh không được để trống.");

        TargetMarket = targetMarket.Trim();
        IntakeTerm = intakeTerm.Trim();
        ProgramName = programName.Trim();
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void UpdateStatus(string newStatus, string? notes = null)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            throw new BusinessRuleViolationException("INVALID_STATUS", "Trạng thái hồ sơ không được để trống.");

        var validStatuses = new[] { "Draft", "Submitted", "UnderReview", "Accepted", "Rejected", "Withdrawn" };
        if (!validStatuses.Contains(newStatus.Trim(), StringComparer.OrdinalIgnoreCase))
            throw new BusinessRuleViolationException("INVALID_STATUS", $"Trạng thái '{newStatus}' không hợp lệ.");

        Status = newStatus.Trim();
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        MarkUpdated();
    }

    public void AssignUser(Guid? userId)
    {
        AssignedUserId = userId;
        MarkUpdated();
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }

    public ChecklistItem AddChecklistItem(string itemCode, string itemName, string category = "Other", bool isRequired = true, string? notes = null)
    {
        var item = new ChecklistItem(Id, itemCode, itemName, category, isRequired, notes);
        ChecklistItems.Add(item);
        return item;
    }

    public void InitializeStandardChecklist()
    {
        if (ChecklistItems.Count > 0) return;

        AddChecklistItem("PASSPORT", "Hộ chiếu (còn hạn tối thiểu 12 tháng)", "Identity", true);
        AddChecklistItem("ID_CARD", "Căn cước công dân học viên & phụ huynh", "Identity", true);
        AddChecklistItem("BIRTH_CERT", "Giấy khai sinh (bản sao/trích lục)", "Identity", true);
        AddChecklistItem("ACADEMIC_TRANSCRIPT", "Học bạ / Bảng điểm bậc học cao nhất", "Academic", true);
        AddChecklistItem("GRADUATION_CERT", "Bằng tốt nghiệp / Giấy chứng nhận tốt nghiệp tạm thời", "Academic", true);
        AddChecklistItem("FINANCIAL_PROOF", "Sổ tiết kiệm & Xác nhận số dư ngân hàng", "Financial", true);
        AddChecklistItem("HEALTH_CERT", "Giấy khám sức khỏe theo mẫu bệnh viện chỉ định", "Medical", true);
        AddChecklistItem("PHOTO_PORTRAIT", "Ảnh chân dung 3.5x4.5 chuẩn quốc tế (phông trắng)", "Identity", true);
        AddChecklistItem("CRIMINAL_RECORD", "Phiếu lý lịch tư pháp số 2", "Legal", false);
    }
}

