namespace ShdOneErp.Application.Modules.Audit.DTOs;

public class AuditLogSummaryDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public Guid? LegalEntityId { get; set; }
    public string? LegalEntityName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? AffectedColumns { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class AuditLogDetailDto : AuditLogSummaryDto
{
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}

public class AuditLogFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? FromDateUtc { get; set; }
    public DateTime? ToDateUtc { get; set; }
    public Guid? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? CorrelationId { get; set; }
    public Guid? LegalEntityId { get; set; }
}

