namespace ShdOneErp.Domain.Entities.System;

public class MasterDataCatalog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public ICollection<MasterDataItem> Items { get; private set; } = new List<MasterDataItem>();

    private MasterDataCatalog() { }

    public MasterDataCatalog(string code, string name, string? description = null, bool isSystem = true)
    {
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        IsSystem = isSystem;
    }
}

public class MasterDataItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CatalogId { get; private set; }
    public MasterDataCatalog? Catalog { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Value { get; private set; }
    public int DisplayOrder { get; private set; } = 0;
    public bool IsActive { get; private set; } = true;
    public Guid? ParentItemId { get; private set; }
    public MasterDataItem? ParentItem { get; private set; }
    public string? MetadataJson { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public ICollection<MasterDataItem> Children { get; private set; } = new List<MasterDataItem>();

    private MasterDataItem() { }

    public MasterDataItem(
        Guid catalogId,
        string code,
        string name,
        string? value = null,
        int displayOrder = 0,
        Guid? parentItemId = null,
        string? metadataJson = null)
    {
        CatalogId = catalogId;
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Value = value?.Trim();
        DisplayOrder = displayOrder;
        ParentItemId = parentItemId;
        MetadataJson = metadataJson;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }
}

