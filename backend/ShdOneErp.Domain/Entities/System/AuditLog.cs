namespace ShdOneErp.Domain.Entities.System;

public class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid? UserId { get; private set; }
    public string? UserName { get; private set; }
    public Guid? LegalEntityId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityName { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string? AffectedColumns { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private AuditLog() { }

    public AuditLog(
        string action,
        string entityName,
        string entityId,
        string? oldValues = null,
        string? newValues = null,
        string? affectedColumns = null,
        Guid? userId = null,
        string? userName = null,
        Guid? legalEntityId = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? correlationId = null)
    {
        Action = action;
        EntityName = entityName;
        EntityId = entityId;
        OldValues = oldValues;
        NewValues = newValues;
        AffectedColumns = affectedColumns;
        UserId = userId;
        UserName = userName;
        LegalEntityId = legalEntityId;
        IpAddress = ipAddress;
        UserAgent = userAgent;
        CorrelationId = correlationId;
        CreatedAtUtc = DateTime.UtcNow;
    }
}

