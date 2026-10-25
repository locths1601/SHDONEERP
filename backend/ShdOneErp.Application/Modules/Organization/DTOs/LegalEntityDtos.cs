using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Organization.DTOs;

public class LegalEntityDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? TradingName { get; set; }
    public string? TaxCode { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[]? RowVersion { get; set; }
    public string? RowVersionBase64 => RowVersion != null ? Convert.ToBase64String(RowVersion) : null;
}

public class LegalEntityDetailDto : LegalEntityDto
{
    public int BusinessUnitCount { get; set; }
    public int BranchCount { get; set; }
}

public class LegalEntityLookupDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateLegalEntityRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? TradingName { get; set; }
    public string? TaxCode { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}

public class UpdateLegalEntityRequest
{
    public string Name { get; set; } = string.Empty;
    public string? TradingName { get; set; }
    public string? TaxCode { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public EntityStatus Status { get; set; }
    public string RowVersionBase64 { get; set; } = string.Empty;
}

public class LegalEntityFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public string SortBy { get; set; } = "CreatedAtUtc";
    public string SortOrder { get; set; } = "DESC";
}
