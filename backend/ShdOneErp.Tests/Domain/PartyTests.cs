using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Party;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class PartyTests
{
    [Fact]
    public void CreatePersonParty_WithValidData_ShouldInitializeCorrectly()
    {
        // Arrange
        var party = new Party(PartyType.Person, "p-001");
        var person = new Person(party.Id, "Văn A", "Nguyễn", new DateTime(2000, 1, 1), "Male", "Việt Nam");

        // Act
        party.AttachPerson(person);
        party.AddContactMethod(ContactType.Email, "vana.nguyen@example.com", isPrimary: true);
        party.AddRole("Student", Guid.NewGuid());

        // Assert
        party.Id.Should().NotBeEmpty();
        party.PartyType.Should().Be(PartyType.Person);
        party.Code.Should().Be("P-001");
        party.Status.Should().Be("Active");
        party.IsDeleted.Should().BeFalse();

        party.Person.Should().NotBeNull();
        party.Person!.FullName.Should().Be("Nguyễn Văn A");
        party.ContactMethods.Should().HaveCount(1);
        party.ContactMethods.First().Value.Should().Be("vana.nguyen@example.com");
        party.Roles.Should().HaveCount(1);
        party.Roles.First().RoleType.Should().Be("Student");
    }

    [Fact]
    public void CreateOrganizationParty_WithValidData_ShouldInitializeCorrectly()
    {
        // Arrange
        var party = new Party(PartyType.Organization, "org-shd-intl");
        var org = new OrganizationParty(party.Id, "Đại học Quốc tế Seoul", "Seoul Tech", "1234567890", "REG-999");

        // Act
        party.AttachOrganizationParty(org);
        party.AddRole("PartnerSchool");

        // Assert
        party.PartyType.Should().Be(PartyType.Organization);
        party.Code.Should().Be("ORG-SHD-INTL");
        party.OrganizationParty.Should().NotBeNull();
        party.OrganizationParty!.CompanyName.Should().Be("Đại học Quốc tế Seoul");
        party.OrganizationParty!.TradingName.Should().Be("Seoul Tech");
        party.Roles.First().RoleType.Should().Be("PartnerSchool");
    }

    [Fact]
    public void AttachPerson_ToOrganizationParty_ShouldThrowBusinessRuleViolationException()
    {
        // Arrange
        var party = new Party(PartyType.Organization, "ORG-001");
        var person = new Person(party.Id, "An", "Trần");

        // Act
        Action act = () => party.AttachPerson(person);

        // Assert
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Chỉ có Party kiểu Person mới có thể gắn thông tin cá nhân*");
    }

    [Fact]
    public void UpdateStatusAndSoftDelete_ShouldUpdatePartyState()
    {
        // Arrange
        var party = new Party(PartyType.Person, "P-002");

        // Act
        party.UpdateStatus("Suspended");
        party.SoftDelete();

        // Assert
        party.Status.Should().Be("Suspended");
        party.IsDeleted.Should().BeTrue();
        party.DeletedAtUtc.Should().NotBeNull();
        party.UpdatedAtUtc.Should().NotBeNull();
    }
}

