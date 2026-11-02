namespace ShdOneErp.Domain.Enums;

public enum EntityStatus
{
    Active = 1,
    Inactive = 2,
    UnderLiquidation = 3
}

public enum ScopeType
{
    Global = 1,
    LegalEntity = 2,
    BusinessUnit = 3,
    Branch = 4
}

public enum PartyType
{
    Person = 1,
    Organization = 2
}

public enum ContactType
{
    Email = 1,
    Phone = 2,
    Address = 3,
    Zalo = 4
}

public enum DataClassification
{
    Public = 1,
    Internal = 2,
    Confidential = 3,
    Restricted = 4
}

public enum AuditAction
{
    Insert = 1,
    Update = 2,
    SoftDelete = 3,
    Restore = 4,
    HardDelete = 5,
    SecurityOverride = 6
}

public enum WorkflowStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4
}
