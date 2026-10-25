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
