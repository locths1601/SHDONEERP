using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class MasterDataCatalogDomainTests
{
    [Fact]
    public void Constructor_ValidParameters_CreatesCatalogWithDefaultValues()
    {
        var catalog = new MasterDataCatalog("korea_visa_status", "Trạng thái Visa Hàn Quốc", "Mô tả", "ADMISSION", isSystem: false);

        catalog.Id.Should().NotBeEmpty();
        catalog.Code.Should().Be("KOREA_VISA_STATUS");
        catalog.Name.Should().Be("Trạng thái Visa Hàn Quốc");
        catalog.Description.Should().Be("Mô tả");
        catalog.OwnerModule.Should().Be("ADMISSION");
        catalog.ScopePolicy.Should().Be("GLOBAL");
        catalog.IsSystem.Should().BeFalse();
        catalog.IsActive.Should().BeTrue();
        catalog.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        catalog.UpdatedAtUtc.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Constructor_EmptyCode_ThrowsBusinessRuleViolationException(string? code)
    {
        var act = () => new MasterDataCatalog(code!, "Tên danh mục");
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Mã danh mục không được để trống*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Constructor_EmptyName_ThrowsBusinessRuleViolationException(string? name)
    {
        var act = () => new MasterDataCatalog("CATALOG_01", name!);
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Tên danh mục không được để trống*");
    }

    [Fact]
    public void UpdateDetails_ValidValues_UpdatesNameAndDescription()
    {
        var catalog = new MasterDataCatalog("CATALOG_01", "Tên cũ", "Mô tả cũ");
        catalog.UpdateDetails("Tên mới", "Mô tả mới");

        catalog.Name.Should().Be("Tên mới");
        catalog.Description.Should().Be("Mô tả mới");
        catalog.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void Deactivate_AdminManagedCatalog_SetsIsActiveToFalse()
    {
        var catalog = new MasterDataCatalog("CATALOG_01", "Tên", isSystem: false);
        catalog.Deactivate();

        catalog.IsActive.Should().BeFalse();
        catalog.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void Deactivate_SystemControlledCatalog_ThrowsException()
    {
        var catalog = new MasterDataCatalog("SYS_CATALOG", "Tên", isSystem: true);
        var act = () => catalog.Deactivate();

        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Không thể ngừng sử dụng nhóm danh mục hệ thống cốt lõi*");
    }

    [Fact]
    public void Activate_DeactivatedCatalog_SetsIsActiveToTrue()
    {
        var catalog = new MasterDataCatalog("CATALOG_01", "Tên", isSystem: false);
        catalog.Deactivate();
        catalog.IsActive.Should().BeFalse();

        catalog.Activate();
        catalog.IsActive.Should().BeTrue();
    }
}

