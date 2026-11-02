using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;

namespace ShdOneErp.Domain.Entities.AdmissionVisa;

public class ApplicationDocumentLink : BaseEntity
{
    public Guid ChecklistItemId { get; private set; }
    public ChecklistItem? ChecklistItem { get; private set; }

    public Guid DocumentId { get; private set; }
    public Document? Document { get; private set; }

    public Guid LinkedByUserId { get; private set; }
    public DateTime LinkedAtUtc { get; private set; }

    private ApplicationDocumentLink() { }

    public ApplicationDocumentLink(Guid checklistItemId, Guid documentId, Guid linkedByUserId)
    {
        if (checklistItemId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_CHECKLIST_ITEM", "Hạng mục hồ sơ không hợp lệ.");
        if (documentId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_DOCUMENT", "Tài liệu lưu trữ không hợp lệ.");
        if (linkedByUserId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_USER", "Người liên kết tài liệu không hợp lệ.");

        ChecklistItemId = checklistItemId;
        DocumentId = documentId;
        LinkedByUserId = linkedByUserId;
        LinkedAtUtc = DateTime.UtcNow;
    }
}

