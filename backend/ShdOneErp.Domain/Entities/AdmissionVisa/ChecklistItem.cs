using ShdOneErp.Domain.Common;

namespace ShdOneErp.Domain.Entities.AdmissionVisa;

public class ChecklistItem : BaseEntity
{
    public Guid StudentApplicationId { get; private set; }
    public StudentApplication? StudentApplication { get; private set; }

    public string ItemCode { get; private set; } = string.Empty;
    public string ItemName { get; private set; } = string.Empty;
    public string Category { get; private set; } = "Other"; // Identity, Academic, Financial, Medical, Legal, Other
    public bool IsRequired { get; private set; } = true;
    public string Status { get; private set; } = "Pending"; // Pending, Uploaded, Verified, Rejected

    public string? Notes { get; private set; }
    public string? RejectionReason { get; private set; }
    public Guid? VerifiedByUserId { get; private set; }
    public DateTime? VerifiedAtUtc { get; private set; }

    public ICollection<ApplicationDocumentLink> DocumentLinks { get; private set; } = new List<ApplicationDocumentLink>();

    private ChecklistItem() { }

    public ChecklistItem(
        Guid studentApplicationId,
        string itemCode,
        string itemName,
        string category = "Other",
        bool isRequired = true,
        string? notes = null)
    {
        if (studentApplicationId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_APPLICATION", "Hồ sơ tuyển sinh không hợp lệ.");
        if (string.IsNullOrWhiteSpace(itemCode))
            throw new BusinessRuleViolationException("INVALID_ITEM_CODE", "Mã hạng mục tài liệu không được để trống.");
        if (string.IsNullOrWhiteSpace(itemName))
            throw new BusinessRuleViolationException("INVALID_ITEM_NAME", "Tên hạng mục tài liệu không được để trống.");

        StudentApplicationId = studentApplicationId;
        ItemCode = itemCode.Trim().ToUpperInvariant();
        ItemName = itemName.Trim();
        Category = string.IsNullOrWhiteSpace(category) ? "Other" : category.Trim();
        IsRequired = isRequired;
        Status = "Pending";
        Notes = notes?.Trim();
    }

    public void MarkUploaded(string? notes = null)
    {
        Status = "Uploaded";
        RejectionReason = null;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        MarkUpdated();
    }

    public void Verify(Guid verifiedByUserId, string? notes = null)
    {
        if (verifiedByUserId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_VERIFIER", "Người thẩm định hồ sơ không hợp lệ.");

        Status = "Verified";
        VerifiedByUserId = verifiedByUserId;
        VerifiedAtUtc = DateTime.UtcNow;
        RejectionReason = null;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        MarkUpdated();
    }

    public void Reject(Guid verifiedByUserId, string rejectionReason)
    {
        if (verifiedByUserId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_VERIFIER", "Người thẩm định hồ sơ không hợp lệ.");
        if (string.IsNullOrWhiteSpace(rejectionReason))
            throw new BusinessRuleViolationException("MISSING_REJECTION_REASON", "Lý do từ chối hồ sơ không được để trống.");

        Status = "Rejected";
        VerifiedByUserId = verifiedByUserId;
        VerifiedAtUtc = DateTime.UtcNow;
        RejectionReason = rejectionReason.Trim();
        MarkUpdated();
    }

    public void ResetToPending(string? notes = null)
    {
        Status = "Pending";
        VerifiedByUserId = null;
        VerifiedAtUtc = null;
        RejectionReason = null;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        MarkUpdated();
    }

    public ApplicationDocumentLink LinkDocument(Guid documentId, Guid userId)
    {
        if (documentId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_DOCUMENT", "Tài liệu đính kèm không hợp lệ.");
        if (userId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_USER", "Người đính kèm tài liệu không hợp lệ.");

        var link = new ApplicationDocumentLink(Id, documentId, userId);
        DocumentLinks.Add(link);
        MarkUploaded();
        return link;
    }
}

