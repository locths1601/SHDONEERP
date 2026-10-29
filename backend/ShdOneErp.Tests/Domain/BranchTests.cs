using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class BranchTests
{
    [Fact]
    public void CreateBranch_NormalizesCodeAndSetsProperties()
    {
        var legalEntityId = Guid.NewGuid();
        var businessUnitId = Guid.NewGuid();

        var branch = new Branch(
            legalEntityId,
            " campus_hn01 ",
            " Cơ sở Cầu Giấy - Hà Nội ",
            businessUnitId,
            " 123 Cầu Giấy, Hà Nội ",
            EntityStatus.Active);

        branch.LegalEntityId.Should().Be(legalEntityId);
        branch.BusinessUnitId.Should().Be(businessUnitId);
        branch.Code.Should().Be("CAMPUS_HN01");
        branch.Name.Should().Be("Cơ sở Cầu Giấy - Hà Nội");
        branch.Address.Should().Be("123 Cầu Giấy, Hà Nội");
        branch.Status.Should().Be(EntityStatus.Active);
        branch.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void CreateBranch_ThrowsOnEmptyLegalEntity()
    {
        Action act = () => new Branch(Guid.Empty, "CAMPUS_HN", "Cơ sở Hà Nội");
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Pháp nhân là bắt buộc*");
    }

    [Theory]
    [InlineData("", "Tên hợp lệ")]
    [InlineData("   ", "Tên hợp lệ")]
    [InlineData("CAMPUS01", "")]
    [InlineData("CAMPUS01", "   ")]
    public void CreateBranch_RequiresCodeAndName(string code, string name)
    {
        Action act = () => new Branch(Guid.NewGuid(), code, name);
        act.Should().Throw<BusinessRuleViolationException>();
    }

    [Fact]
    public void Update_UpdatesFieldsAndTimestamp()
    {
        var branch = new Branch(Guid.NewGuid(), "CAMPUS_HCM", "Cơ sở HCM");
        var newBusinessUnitId = Guid.NewGuid();

        branch.Update("Cơ sở Quận 1 - HCM", newBusinessUnitId, "456 Nguyễn Huệ, Q1", EntityStatus.Active);

        branch.Name.Should().Be("Cơ sở Quận 1 - HCM");
        branch.BusinessUnitId.Should().Be(newBusinessUnitId);
        branch.Address.Should().Be("456 Nguyễn Huệ, Q1");
        branch.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void SoftDelete_MarksEntityAsDeleted()
    {
        var branch = new Branch(Guid.NewGuid(), "CAMPUS_DN", "Cơ sở Đà Nẵng");

        branch.SoftDelete();

        branch.IsDeleted.Should().BeTrue();
        branch.DeletedAtUtc.Should().NotBeNull();
        branch.UpdatedAtUtc.Should().NotBeNull();
    }
}

