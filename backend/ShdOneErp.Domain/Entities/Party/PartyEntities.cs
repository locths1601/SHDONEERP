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
    public DateTime? DeletedAtUtc { get; private set; }

    public Person? Person { get; private set; }
    public OrganizationParty? OrganizationParty { get; private set; }

    public ICollection<PartyRole> Roles { get; private set; } = new List<PartyRole>();
    public ICollection<PartyContactMethod> ContactMethods { get; private set; } = new List<PartyContactMethod>();
    public ICollection<PartyIdentification> Identifications { get; private set; } = new List<PartyIdentification>();
    public ICollection<PartyRelationship> Relationships { get; private set; } = new List<PartyRelationship>();

    private Party() { }

    public Party(PartyType partyType, string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_PARTY_CODE", "Mã định danh Party không được để trống.");

        PartyType = partyType;
        Code = code.Trim().ToUpperInvariant();
        Status = "Active";
    }

    public void AttachPerson(Person person)
    {
        if (PartyType != PartyType.Person)
            throw new BusinessRuleViolationException("INVALID_PARTY_TYPE", "Chỉ có Party kiểu Person mới có thể gắn thông tin cá nhân.");
        Person = person;
        MarkUpdated();
    }

    public void AttachOrganizationParty(OrganizationParty org)
    {
        if (PartyType != PartyType.Organization)
            throw new BusinessRuleViolationException("INVALID_PARTY_TYPE", "Chỉ có Party kiểu Organization mới có thể gắn thông tin tổ chức.");
        OrganizationParty = org;
        MarkUpdated();
    }

    public void UpdateStatus(string newStatus)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            throw new BusinessRuleViolationException("INVALID_STATUS", "Trạng thái không được để trống.");

        Status = newStatus.Trim();
        MarkUpdated();
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        MarkUpdated();
    }

    public void AddRole(string roleType, Guid? legalEntityId = null)
    {
        if (string.IsNullOrWhiteSpace(roleType))
            throw new BusinessRuleViolationException("INVALID_ROLE_TYPE", "Loại vai trò không được để trống.");

        var existing = Roles.FirstOrDefault(r => r.RoleType == roleType.Trim() && r.LegalEntityId == legalEntityId);
        if (existing != null)
        {
            existing.SetActive(true);
        }
        else
        {
            Roles.Add(new PartyRole(Id, roleType.Trim(), legalEntityId));
        }
        MarkUpdated();
    }

    public void AddContactMethod(ContactType contactType, string value, bool isPrimary = false)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new BusinessRuleViolationException("INVALID_CONTACT_VALUE", "Giá trị thông tin liên hệ không được để trống.");

        if (isPrimary)
        {
            foreach (var cm in ContactMethods.Where(c => c.ContactType == contactType))
            {
                cm.SetPrimary(false);
            }
        }

        ContactMethods.Add(new PartyContactMethod(Id, contactType, value.Trim(), isPrimary));
        MarkUpdated();
    }

    public void AddIdentification(string identificationType, string identificationNumber, DateTime? issueDate = null, DateTime? expiryDate = null, string? issuingAuthority = null)
    {
        if (string.IsNullOrWhiteSpace(identificationType))
            throw new BusinessRuleViolationException("INVALID_IDENTIFICATION_TYPE", "Loại giấy tờ định danh không được để trống.");
        if (string.IsNullOrWhiteSpace(identificationNumber))
            throw new BusinessRuleViolationException("INVALID_IDENTIFICATION_NUMBER", "Số định danh không được để trống.");

        var existing = Identifications.FirstOrDefault(i => i.IdentificationType.Equals(identificationType.Trim(), StringComparison.OrdinalIgnoreCase) && i.IdentificationNumber.Equals(identificationNumber.Trim(), StringComparison.OrdinalIgnoreCase));
        if (existing == null)
        {
            Identifications.Add(new PartyIdentification(Id, identificationType.Trim(), identificationNumber.Trim(), issueDate, expiryDate, issuingAuthority?.Trim()));
            MarkUpdated();
        }
    }

    public void AddRelationship(Guid toPartyId, string relationshipType)
    {
        if (toPartyId == Guid.Empty || toPartyId == Id)
            throw new BusinessRuleViolationException("INVALID_RELATIONSHIP_TARGET", "Đối tượng liên kết quan hệ không hợp lệ.");
        if (string.IsNullOrWhiteSpace(relationshipType))
            throw new BusinessRuleViolationException("INVALID_RELATIONSHIP_TYPE", "Loại mối quan hệ không được để trống.");

        var existing = Relationships.FirstOrDefault(r => r.ToPartyId == toPartyId && r.RelationshipType.Equals(relationshipType.Trim(), StringComparison.OrdinalIgnoreCase));
        if (existing != null)
        {
            existing.SetActive(true);
        }
        else
        {
            Relationships.Add(new PartyRelationship(Id, toPartyId, relationshipType.Trim()));
        }
        MarkUpdated();
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
        if (string.IsNullOrWhiteSpace(firstName))
            throw new BusinessRuleViolationException("INVALID_FIRST_NAME", "Tên không được để trống.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new BusinessRuleViolationException("INVALID_LAST_NAME", "Họ đệm không được để trống.");

        PartyId = partyId;
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        DateOfBirth = dateOfBirth;
        Gender = gender?.Trim();
        Nationality = nationality?.Trim();
    }

    public void Update(string firstName, string lastName, DateTime? dateOfBirth = null, string? gender = null, string? nationality = null)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new BusinessRuleViolationException("INVALID_FIRST_NAME", "Tên không được để trống.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new BusinessRuleViolationException("INVALID_LAST_NAME", "Họ đệm không được để trống.");

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        DateOfBirth = dateOfBirth;
        Gender = gender?.Trim();
        Nationality = nationality?.Trim();
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
        if (string.IsNullOrWhiteSpace(companyName))
            throw new BusinessRuleViolationException("INVALID_COMPANY_NAME", "Tên công ty/tổ chức không được để trống.");

        PartyId = partyId;
        CompanyName = companyName.Trim();
        TradingName = tradingName?.Trim();
        TaxId = taxId?.Trim();
        RegistrationNumber = registrationNumber?.Trim();
    }

    public void Update(string companyName, string? tradingName = null, string? taxId = null, string? registrationNumber = null)
    {
        if (string.IsNullOrWhiteSpace(companyName))
            throw new BusinessRuleViolationException("INVALID_COMPANY_NAME", "Tên công ty/tổ chức không được để trống.");

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
        IsActive = true;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
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

    public void SetPrimary(bool isPrimary)
    {
        IsPrimary = isPrimary;
    }

    public void UpdateValue(string value)
    {
        Value = value.Trim();
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

public class PartyRelationship
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid FromPartyId { get; private set; }
    public Party? FromParty { get; private set; }

    public Guid ToPartyId { get; private set; }
    public Party? ToParty { get; private set; }

    public string RelationshipType { get; private set; } = string.Empty; // Parent, Guardian, Sponsor
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private PartyRelationship() { }

    public PartyRelationship(Guid fromPartyId, Guid toPartyId, string relationshipType)
    {
        FromPartyId = fromPartyId;
        ToPartyId = toPartyId;
        RelationshipType = relationshipType.Trim();
        IsActive = true;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }
}
