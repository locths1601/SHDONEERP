using ShdOneErp.Domain.Common;

namespace ShdOneErp.Domain.Entities.System;

public class MasterDataCatalog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string OwnerModule { get; private set; } = "SYSTEM";
    public string ScopePolicy { get; private set; } = "GLOBAL";
    public bool IsSystem { get; private set; } = false;
    public bool IsActive { get; private set; } = true;
    public byte[] RowVersion { get; private set; } = [];
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }

    public ICollection<MasterDataItem> Items { get; private set; } = new List<MasterDataItem>();

    private MasterDataCatalog() { }

    public MasterDataCatalog(
        string code,
        string name,
        string? description = null,
        string ownerModule = "SYSTEM",
        bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_CODE", "Mã danh mục không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên danh mục không được để trống.");

        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        OwnerModule = string.IsNullOrWhiteSpace(ownerModule) ? "SYSTEM" : ownerModule.Trim().ToUpperInvariant();
        ScopePolicy = "GLOBAL";
        IsSystem = isSystem;
        IsActive = true;
    }

    public void UpdateDetails(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên danh mục không được để trống.");

        Name = name.Trim();
        Description = description?.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        if (IsSystem)
            throw new BusinessRuleViolationException("CANNOT_DEACTIVATE_SYSTEM_CATALOG", "Không thể ngừng sử dụng nhóm danh mục hệ thống cốt lõi.");

        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
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
    public byte[] RowVersion { get; private set; } = [];
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }

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
        if (catalogId == Guid.Empty)
            throw new BusinessRuleViolationException("INVALID_CATALOG_ID", "Định danh nhóm danh mục không hợp lệ.");
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_CODE", "Mã giá trị danh mục không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên giá trị danh mục không được để trống.");
        if (parentItemId.HasValue && parentItemId.Value == Id)
            throw new BusinessRuleViolationException("CANNOT_PARENT_SELF", "Giá trị danh mục không thể làm cha chính nó.");

        CatalogId = catalogId;
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Value = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        DisplayOrder = displayOrder;
        ParentItemId = parentItemId;
        MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? null : metadataJson.Trim();
        IsActive = true;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string name,
        string? value,
        int displayOrder,
        Guid? parentItemId,
        string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_NAME", "Tên giá trị danh mục không được để trống.");
        if (parentItemId.HasValue && parentItemId.Value == Id)
            throw new BusinessRuleViolationException("CANNOT_PARENT_SELF", "Giá trị danh mục không thể làm cha chính nó.");

        Name = name.Trim();
        Value = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        DisplayOrder = displayOrder;
        ParentItemId = parentItemId;
        MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? null : metadataJson.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetRowVersion(byte[] rowVersion)
    {
        RowVersion = rowVersion ?? [];
    }
}
