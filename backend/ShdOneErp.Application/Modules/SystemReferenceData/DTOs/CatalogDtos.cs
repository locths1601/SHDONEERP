namespace ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

public class CatalogDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerModule { get; set; } = "SYSTEM";
    public string ScopePolicy { get; set; } = "GLOBAL";
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; }
    public string StatusLabel => IsActive ? "ACTIVE" : "INACTIVE";
    public string ManagementModeLabel => IsSystem ? "SYSTEM_CONTROLLED" : "ADMIN_MANAGED";
    public byte[]? RowVersion { get; set; }
    public string RowVersionBase64 => RowVersion != null ? Convert.ToBase64String(RowVersion) : string.Empty;
    public int ItemCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class CatalogFilterQuery
{
    public string? SearchTerm { get; set; }
    public string? OwnerModule { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsSystem { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "Code";
    public string SortOrder { get; set; } = "ASC";
}

public class CreateCatalogRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerModule { get; set; } = "SYSTEM";
    public bool IsSystem { get; set; } = false;
}

public class UpdateCatalogRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RowVersion { get; set; } = string.Empty;
}

public class ChangeCatalogStatusRequest
{
    public string RowVersion { get; set; } = string.Empty;
}

