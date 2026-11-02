using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Organization.DTOs;

public class BusinessUnitDto
{
    public Guid Id { get; set; }
    public Guid LegalEntityId { get; set; }
    public string LegalEntityCode { get; set; } = string.Empty;
    public string LegalEntityName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[]? RowVersion { get; set; }
    public string? RowVersionBase64 => RowVersion is null ? null : Convert.ToBase64String(RowVersion);
}

public class BusinessUnitDetailDto : BusinessUnitDto
{
    public int BranchCount { get; set; }
}

public class CreateBusinessUnitRequest
{
    public Guid LegalEntityId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}

public class UpdateBusinessUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public EntityStatus Status { get; set; }
    public string RowVersionBase64 { get; set; } = string.Empty;
}

public class BusinessUnitFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? LegalEntityId { get; set; }
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public string SortBy { get; set; } = "CreatedAtUtc";
    public string SortOrder { get; set; } = "DESC";
}
