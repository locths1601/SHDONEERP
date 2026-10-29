namespace ShdOneErp.Application.Modules.AdmissionVisa.DTOs;

public class StudentApplicationFilterQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SearchTerm { get; set; }
    public string? TargetMarket { get; set; }
    public string? IntakeTerm { get; set; }
    public string? Status { get; set; }
    public Guid? LegalEntityId { get; set; }
    public Guid? StudentPartyId { get; set; }
    public string SortBy { get; set; } = "CreatedAtUtc";
    public string SortOrder { get; set; } = "DESC";
}

public class StudentApplicationListItemDto
{
    public Guid Id { get; set; }
    public string ApplicationCode { get; set; } = string.Empty;
    public Guid StudentPartyId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentCode { get; set; }
    public Guid LegalEntityId { get; set; }
    public string LegalEntityName { get; set; } = string.Empty;
    public string TargetMarket { get; set; } = string.Empty;
    public string IntakeTerm { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public int TotalChecklistItems { get; set; }
    public int VerifiedChecklistItems { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class StudentApplicationDetailDto
{
    public Guid Id { get; set; }
    public string ApplicationCode { get; set; } = string.Empty;
    public Guid StudentPartyId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentCode { get; set; }
    public Guid LegalEntityId { get; set; }
    public string LegalEntityName { get; set; } = string.Empty;
    public Guid? BusinessUnitId { get; set; }
    public string? BusinessUnitName { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string TargetMarket { get; set; } = string.Empty;
    public string IntakeTerm { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public string? Notes { get; set; }
    public string RowVersion { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public List<ChecklistItemDto> ChecklistItems { get; set; } = new();
}

public class CreateStudentApplicationRequest
{
    public string? ApplicationCode { get; set; }
    public Guid StudentPartyId { get; set; }
    public Guid LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public Guid? BranchId { get; set; }
    public string TargetMarket { get; set; } = string.Empty;
    public string IntakeTerm { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public Guid? AssignedUserId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateStudentApplicationRequest
{
    public string TargetMarket { get; set; } = string.Empty;
    public string IntakeTerm { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string RowVersion { get; set; } = string.Empty;
}

public class UpdateStudentApplicationStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string RowVersion { get; set; } = string.Empty;
}

public class ChecklistItemDto
{
    public Guid Id { get; set; }
    public Guid StudentApplicationId { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? VerifiedByUserId { get; set; }
    public string? VerifiedByName { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public string RowVersion { get; set; } = string.Empty;

    public List<ApplicationDocumentLinkDto> DocumentLinks { get; set; } = new();
}

public class ApplicationDocumentLinkDto
{
    public Guid Id { get; set; }
    public Guid ChecklistItemId { get; set; }
    public Guid DocumentId { get; set; }
    public string DocumentTitle { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string Sha256Checksum { get; set; } = string.Empty;
    public Guid LinkedByUserId { get; set; }
    public string? LinkedByName { get; set; }
    public DateTime LinkedAtUtc { get; set; }
}

public class VerifyChecklistItemRequest
{
    public string? Notes { get; set; }
    public string RowVersion { get; set; } = string.Empty;
}

public class RejectChecklistItemRequest
{
    public string RejectionReason { get; set; } = string.Empty;
    public string RowVersion { get; set; } = string.Empty;
}

public class AddChecklistItemRequest
{
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public bool IsRequired { get; set; } = true;
    public string? Notes { get; set; }
}
