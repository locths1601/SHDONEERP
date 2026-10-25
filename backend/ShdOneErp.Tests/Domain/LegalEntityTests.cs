using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Organization;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class LegalEntityTests
{
    [Fact]
    public void CreateLegalEntity_WithValidInputs_ShouldInitializeCorrectly()
    {
        // Arrange & Act
        var entity = new LegalEntity(
            code: "shd_corp",
            name: "Công ty Cổ phần Tập đoàn SHD",
            tradingName: "SHD Group",
            taxCode: "0108999999",
            status: EntityStatus.Active);

        // Assert
        entity.Id.Should().NotBeEmpty();
        entity.Code.Should().Be("SHD_CORP"); // Normalized uppercase
        entity.Name.Should().Be("Công ty Cổ phần Tập đoàn SHD");
        entity.TradingName.Should().Be("SHD Group");
        entity.TaxCode.Should().Be("0108999999");
        entity.Status.Should().Be(EntityStatus.Active);
        entity.IsDeleted.Should().BeFalse();
        entity.DeletedAtUtc.Should().BeNull();
        entity.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateLegalEntity_WithEmptyCode_ShouldThrowBusinessRuleViolationException(string? invalidCode)
    {
        // Act
        Action act = () => new LegalEntity(invalidCode!, "Tên Pháp Nhân Hợp Lệ");

        // Assert
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Mã pháp nhân không được để trống*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateLegalEntity_WithEmptyName_ShouldThrowBusinessRuleViolationException(string? invalidName)
    {
        // Act
        Action act = () => new LegalEntity("SHD_CORP", invalidName!);

        // Assert
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Tên pháp nhân không được để trống*");
    }

    [Fact]
    public void UpdateLegalEntity_ShouldUpdateFieldsAndMarkTimestamp()
    {
        // Arrange
        var entity = new LegalEntity("SHD_EDU", "Tên Cũ");

        // Act
        entity.Update(
            name: "Tên Mới Được Cập Nhật",
            tradingName: "SHD Education New",
            taxCode: "0109999999",
            address: "Hà Nội",
            phoneNumber: "024.1111.2222",
            email: "edu@shdcorp.vn",
            website: "https://shd.vn",
            status: EntityStatus.Inactive);

        // Assert
        entity.Name.Should().Be("Tên Mới Được Cập Nhật");
        entity.TradingName.Should().Be("SHD Education New");
        entity.Status.Should().Be(EntityStatus.Inactive);
        entity.UpdatedAtUtc.Should().NotBeNull();
        entity.UpdatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void SoftDelete_ShouldSetIsDeletedAndDeletedTimestamp()
    {
        // Arrange
        var entity = new LegalEntity("SHD_TEMP", "Công ty tạm thời");

        // Act
        entity.SoftDelete();

        // Assert
        entity.IsDeleted.Should().BeTrue();
        entity.DeletedAtUtc.Should().NotBeNull();
        entity.DeletedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));

        // Restore
        entity.Restore();
        entity.IsDeleted.Should().BeFalse();
        entity.DeletedAtUtc.Should().BeNull();
    }
}
