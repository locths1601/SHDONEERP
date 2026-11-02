namespace ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

public class ItemDto
{
    public Guid Id { get; set; }
    public Guid CatalogId { get; set; }
    public string? CatalogCode { get; set; }
    public string? CatalogName { get; set; }
    public bool? CatalogIsSystem { get; set; }
    public bool? CatalogIsActive { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public string StatusLabel => IsActive ? "ACTIVE" : "INACTIVE";
    public Guid? ParentItemId { get; set; }
    public string? ParentItemCode { get; set; }
    public string? ParentItemName { get; set; }
    public string? MetadataJson { get; set; }
    public byte[]? RowVersion { get; set; }
    public string RowVersionBase64 => RowVersion != null ? Convert.ToBase64String(RowVersion) : string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class ItemFilterQuery
{
    public Guid CatalogId { get; set; }
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public Guid? ParentItemId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "DisplayOrder";
    public string SortOrder { get; set; } = "ASC";
}

public class CreateItemRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public Guid? ParentItemId { get; set; }
    public string? MetadataJson { get; set; }
}

public class UpdateItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public Guid? ParentItemId { get; set; }
    public string? MetadataJson { get; set; }
    public string RowVersion { get; set; } = string.Empty;
}

public class ChangeItemStatusRequest
{
    public string RowVersion { get; set; } = string.Empty;
}

public class ItemLookupDto
{
    public Guid Id { get; set; }
    public Guid CatalogId { get; set; }
    public string CatalogCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Value { get; set; }
    public int DisplayOrder { get; set; }
    public Guid? ParentItemId { get; set; }
    public string? MetadataJson { get; set; }
}

