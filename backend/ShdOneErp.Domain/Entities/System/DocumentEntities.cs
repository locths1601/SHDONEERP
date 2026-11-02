using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;
using PartyEntity = ShdOneErp.Domain.Entities.Party.Party;

namespace ShdOneErp.Domain.Entities.System;

public class Document : BaseEntity
{
    public Guid LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }

    public string? DocumentNumber { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string DocumentType { get; private set; } = string.Empty; // Contract, IdentityCard, Transcript, Visa, Invoice
    public DataClassification DataClassification { get; private set; } = DataClassification.Internal;

    public Guid OwnerUserId { get; private set; }
    public Guid? PartyId { get; private set; }
    public PartyEntity? Party { get; private set; }

    public string StorageProvider { get; private set; } = "LocalFileSystem";
    public string StoragePath { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public string Sha256Checksum { get; private set; } = string.Empty;
    public bool IsEncrypted { get; private set; } = false;

    public EntityStatus Status { get; private set; } = EntityStatus.Active;
    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAtUtc { get; private set; }

    private Document() { }

    public Document(
        Guid legalEntityId,
        string title,
        string documentType,
        DataClassification dataClassification,
        Guid ownerUserId,
        string storagePath,
        string originalFileName,
        string contentType,
        long fileSizeBytes,
        string sha256Checksum,
        string? documentNumber = null,
        Guid? partyId = null,
        bool isEncrypted = false)
    {
        LegalEntityId = legalEntityId;
        Title = title.Trim();
        DocumentType = documentType.Trim();
        DataClassification = dataClassification;
        OwnerUserId = ownerUserId;
        StoragePath = storagePath;
        OriginalFileName = originalFileName.Trim();
        ContentType = contentType.Trim();
        FileSizeBytes = fileSizeBytes;
        Sha256Checksum = sha256Checksum.Trim();
        DocumentNumber = documentNumber?.Trim();
        PartyId = partyId;
        IsEncrypted = isEncrypted;
    }

    public void SoftDelete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }
}

