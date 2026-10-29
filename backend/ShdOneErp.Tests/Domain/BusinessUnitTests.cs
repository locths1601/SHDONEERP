using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class BusinessUnitTests
{
    [Fact]
    public void CreateBusinessUnit_NormalizesCodeAndPreservesParent()
    {
        var legalEntityId = Guid.NewGuid();

        var unit = new BusinessUnit(legalEntityId, " sales_north ", " Kinh doanh miền Bắc ");

        unit.LegalEntityId.Should().Be(legalEntityId);
        unit.Code.Should().Be("SALES_NORTH");
        unit.Name.Should().Be("Kinh doanh miền Bắc");
        unit.Status.Should().Be(EntityStatus.Active);
    }

    [Theory]
    [InlineData("", "Tên hợp lệ")]
    [InlineData("SALES", " ")]
    public void CreateBusinessUnit_RequiresCodeAndName(string code, string name)
    {
        Action action = () => new BusinessUnit(Guid.NewGuid(), code, name);

        action.Should().Throw<BusinessRuleViolationException>();
    }

    [Fact]
    public void UpdateAndSoftDelete_MarkEntityUpdated()
    {
        var unit = new BusinessUnit(Guid.NewGuid(), "SALES", "Kinh doanh");

        unit.Update("Kinh doanh miền Nam", EntityStatus.Inactive);
        unit.SoftDelete();

        unit.Name.Should().Be("Kinh doanh miền Nam");
        unit.Status.Should().Be(EntityStatus.Inactive);
        unit.IsDeleted.Should().BeTrue();
        unit.DeletedAtUtc.Should().NotBeNull();
        unit.UpdatedAtUtc.Should().NotBeNull();
    }
}
