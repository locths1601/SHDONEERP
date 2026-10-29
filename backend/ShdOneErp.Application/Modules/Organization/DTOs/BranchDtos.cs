using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Organization.DTOs;

public class BranchDto
{
    public Guid Id { get; set; }
    public Guid LegalEntityId { get; set; }
    public string LegalEntityCode { get; set; } = string.Empty;
    public string LegalEntityName { get; set; } = string.Empty;
    public Guid? BusinessUnitId { get; set; }
    public string? BusinessUnitCode { get; set; }
    public string? BusinessUnitName { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[]? RowVersion { get; set; }
    public string? RowVersionBase64 => RowVersion is null ? null : Convert.ToBase64String(RowVersion);
}

public class BranchDetailDto : BranchDto
{
}

public class BranchLookupDto
{
    public Guid Id { get; set; }
    public Guid LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}

public class CreateBranchRequest
{
    public Guid LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}

public class UpdateBranchRequest
{
    public Guid? BusinessUnitId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public EntityStatus Status { get; set; }
    public string RowVersionBase64 { get; set; } = string.Empty;
}

public class BranchFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? LegalEntityId { get; set; }
    public Guid? BusinessUnitId { get; set; }
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public string SortBy { get; set; } = "CreatedAtUtc";
    public string SortOrder { get; set; } = "DESC";
}

