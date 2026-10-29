using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Party360.DTOs;

public class PartyFilterQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? PartyType { get; set; } // Person, Organization
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public Guid? LegalEntityId { get; set; }
    public string SortBy { get; set; } = "CreatedAtUtc";
    public string SortOrder { get; set; } = "DESC";
}

public class PartyListItemDto
{
    public Guid Id { get; set; }
    public string PartyType { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public int RoleCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public string RowVersionBase64 => Convert.ToBase64String(RowVersion);
}

public class PartyDetailDto
{
    public Guid Id { get; set; }
    public string PartyType { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    public string RowVersionBase64 => Convert.ToBase64String(RowVersion);

    // Person
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? FullName => !string.IsNullOrEmpty(LastName) || !string.IsNullOrEmpty(FirstName)
        ? $"{LastName} {FirstName}".Trim()
        : null;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }

    // Organization
    public string? CompanyName { get; set; }
    public string? TradingName { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }

    // Navigation lists
    public List<PartyRoleDto> Roles { get; set; } = new();
    public List<PartyContactMethodDto> ContactMethods { get; set; } = new();
    public List<PartyIdentificationDto> Identifications { get; set; } = new();
    public List<PartyRelationshipDto> Relationships { get; set; } = new();
}

public class PartyRoleDto
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public string RoleType { get; set; } = string.Empty;
    public Guid? LegalEntityId { get; set; }
    public string? LegalEntityCode { get; set; }
    public string? LegalEntityName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PartyContactMethodDto
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public string ContactType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreatePersonPartyRequest
{
    public string Code { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }

    // Initial contacts
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }

    // Initial role
    public string? InitialRoleType { get; set; } // Student, Parent, Applicant, etc.
    public Guid? LegalEntityId { get; set; }
}

public class CreateOrganizationPartyRequest
{
    public string Code { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? TradingName { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }

    // Initial contacts
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }

    // Initial role
    public string? InitialRoleType { get; set; } // PartnerSchool, Agency, Vendor, Employer
    public Guid? LegalEntityId { get; set; }
}

public class UpdatePersonPartyRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }
    public string Status { get; set; } = "Active";
    public string? RowVersionBase64 { get; set; }
}

public class UpdateOrganizationPartyRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string? TradingName { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public string Status { get; set; } = "Active";
    public string? RowVersionBase64 { get; set; }
}

public class UpdatePartyStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? RowVersionBase64 { get; set; }
}

public class AddPartyContactMethodRequest
{
    public ContactType ContactType { get; set; }
    public string Value { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}

public class AddPartyRoleRequest
{
    public string RoleType { get; set; } = string.Empty;
    public Guid? LegalEntityId { get; set; }
}

public class PartyIdentificationDto
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public string IdentificationType { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PartyRelationshipDto
{
    public Guid Id { get; set; }
    public Guid FromPartyId { get; set; }
    public Guid ToPartyId { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string ToPartyDisplayName { get; set; } = string.Empty;
    public string? ToPartyPhone { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class AddPartyIdentificationRequest
{
    public string IdentificationType { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }
}

public class AddPartyRelationshipRequest
{
    public Guid ToPartyId { get; set; }
    public string RelationshipType { get; set; } = string.Empty; // Parent, Guardian, Sponsor
}

public class CreateStudentProfileRequest
{
    public string Code { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }

    // Contacts
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }

    // Identification (CCCD / Passport)
    public string? IdentificationType { get; set; }
    public string? IdentificationNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }

    // LegalEntity enrollment scope
    public Guid? LegalEntityId { get; set; }
}

public class StudentListItemDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Nationality { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string? IdentificationNumber { get; set; }
    public Guid? LegalEntityId { get; set; }
    public string? LegalEntityName { get; set; }
    public int ActiveApplicationCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    public string RowVersionBase64 => Convert.ToBase64String(RowVersion);
}

