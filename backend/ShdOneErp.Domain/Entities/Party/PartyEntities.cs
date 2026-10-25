using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.Party;

public class Party : BaseEntity
{
    public PartyType PartyType { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Active";
    public bool IsDeleted { get; private set; } = false;

    public Person? Person { get; private set; }
    public OrganizationParty? OrganizationParty { get; private set; }

    public ICollection<PartyRole> Roles { get; private set; } = new List<PartyRole>();
    public ICollection<PartyContactMethod> ContactMethods { get; private set; } = new List<PartyContactMethod>();
    public ICollection<PartyIdentification> Identifications { get; private set; } = new List<PartyIdentification>();

    private Party() { }

    public Party(PartyType partyType, string code)
    {
        PartyType = partyType;
        Code = code.Trim().ToUpperInvariant();
    }

    public void AttachPerson(Person person)
    {
        if (PartyType != PartyType.Person)
            throw new BusinessRuleViolationException("INVALID_PARTY_TYPE", "Chỉ có Party kiểu Person mới có thể gắn thông tin cá nhân.");
        Person = person;
    }

    public void AttachOrganizationParty(OrganizationParty org)
    {
        if (PartyType != PartyType.Organization)
            throw new BusinessRuleViolationException("INVALID_PARTY_TYPE", "Chỉ có Party kiểu Organization mới có thể gắn thông tin tổ chức.");
        OrganizationParty = org;
    }
}

public class Person
{
    public Guid PartyId { get; private set; }
    public Party? Party { get; private set; }

    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public DateTime? DateOfBirth { get; private set; }
    public string? Gender { get; private set; }
    public string? Nationality { get; private set; }

    public string FullName => $"{LastName} {FirstName}".Trim();

    private Person() { }

    public Person(Guid partyId, string firstName, string lastName, DateTime? dateOfBirth = null, string? gender = null, string? nationality = null)
    {
        PartyId = partyId;
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        DateOfBirth = dateOfBirth;
        Gender = gender;
        Nationality = nationality;
    }
}

public class OrganizationParty
{
    public Guid PartyId { get; private set; }
    public Party? Party { get; private set; }

    public string CompanyName { get; private set; } = string.Empty;
    public string? TradingName { get; private set; }
    public string? TaxId { get; private set; }
    public string? RegistrationNumber { get; private set; }

    private OrganizationParty() { }

    public OrganizationParty(Guid partyId, string companyName, string? tradingName = null, string? taxId = null, string? registrationNumber = null)
    {
        PartyId = partyId;
        CompanyName = companyName.Trim();
        TradingName = tradingName?.Trim();
        TaxId = taxId?.Trim();
        RegistrationNumber = registrationNumber?.Trim();
    }
}

public class PartyRole
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid PartyId { get; private set; }
    public Party? Party { get; private set; }

    public string RoleType { get; private set; } = string.Empty; // Student, Parent, PartnerSchool, Agency, Vendor
    public Guid? LegalEntityId { get; private set; }
    public LegalEntity? LegalEntity { get; private set; }

    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private PartyRole() { }

    public PartyRole(Guid partyId, string roleType, Guid? legalEntityId = null)
    {
        PartyId = partyId;
        RoleType = roleType.Trim();
        LegalEntityId = legalEntityId;
    }
}

public class PartyContactMethod
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid PartyId { get; private set; }
    public Party? Party { get; private set; }

    public ContactType ContactType { get; private set; }
    public string Value { get; private set; } = string.Empty;
    public bool IsPrimary { get; private set; } = false;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private PartyContactMethod() { }

    public PartyContactMethod(Guid partyId, ContactType contactType, string value, bool isPrimary = false)
    {
        PartyId = partyId;
        ContactType = contactType;
        Value = value.Trim();
        IsPrimary = isPrimary;
    }
}

public class PartyIdentification
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid PartyId { get; private set; }
    public Party? Party { get; private set; }

    public string IdentificationType { get; private set; } = string.Empty; // CitizenId, Passport
    public string IdentificationNumber { get; private set; } = string.Empty;
    public DateTime? IssueDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? IssuingAuthority { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private PartyIdentification() { }

    public PartyIdentification(Guid partyId, string identificationType, string identificationNumber, DateTime? issueDate = null, DateTime? expiryDate = null, string? issuingAuthority = null)
    {
        PartyId = partyId;
        IdentificationType = identificationType.Trim();
        IdentificationNumber = identificationNumber.Trim();
        IssueDate = issueDate;
        ExpiryDate = expiryDate;
        IssuingAuthority = issuingAuthority?.Trim();
    }
}
