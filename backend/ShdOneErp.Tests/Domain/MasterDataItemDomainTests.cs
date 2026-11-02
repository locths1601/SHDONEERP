using FluentAssertions;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.System;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class MasterDataItemDomainTests
{
    private readonly Guid _catalogId = Guid.NewGuid();

    [Fact]
    public void Constructor_ValidParameters_CreatesItemWithDefaultValues()
    {
        var item = new MasterDataItem(
            _catalogId,
            "d4_visa",
            "Visa Du học D4-1",
            "D4-1",
            10,
            null,
            "{\"type\":\"general\"}");

        item.Id.Should().NotBeEmpty();
        item.CatalogId.Should().Be(_catalogId);
        item.Code.Should().Be("D4_VISA");
        item.Name.Should().Be("Visa Du học D4-1");
        item.Value.Should().Be("D4-1");
        item.DisplayOrder.Should().Be(10);
        item.IsActive.Should().BeTrue();
        item.ParentItemId.Should().BeNull();
        item.MetadataJson.Should().Be("{\"type\":\"general\"}");
        item.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        item.UpdatedAtUtc.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Constructor_EmptyCode_ThrowsBusinessRuleViolationException(string? code)
    {
        var act = () => new MasterDataItem(_catalogId, code!, "Tên giá trị");
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Mã giá trị danh mục không được để trống*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Constructor_EmptyName_ThrowsBusinessRuleViolationException(string? name)
    {
        var act = () => new MasterDataItem(_catalogId, "ITEM_01", name!);
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Tên giá trị danh mục không được để trống*");
    }

    [Fact]
    public void Constructor_EmptyCatalogId_ThrowsBusinessRuleViolationException()
    {
        var act = () => new MasterDataItem(Guid.Empty, "ITEM_01", "Tên giá trị");
        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*Định danh nhóm danh mục không hợp lệ*");
    }

    [Fact]
    public void UpdateDetails_ValidValues_UpdatesFields()
    {
        var item = new MasterDataItem(_catalogId, "ITEM_01", "Tên cũ", "Giá trị cũ", 1);
        item.UpdateDetails("Tên mới", "Giá trị mới", 5, null, "{\"flag\":true}");

        item.Name.Should().Be("Tên mới");
        item.Value.Should().Be("Giá trị mới");
        item.DisplayOrder.Should().Be(5);
        item.MetadataJson.Should().Be("{\"flag\":true}");
        item.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void UpdateDetails_SelfParent_ThrowsBusinessRuleViolationException()
    {
        var item = new MasterDataItem(_catalogId, "ITEM_01", "Tên");
        var act = () => item.UpdateDetails("Tên", null, 0, item.Id, null);

        act.Should().Throw<BusinessRuleViolationException>()
            .WithMessage("*không thể làm cha chính nó*");
    }

    [Fact]
    public void Deactivate_SetsIsActiveToFalse()
    {
        var item = new MasterDataItem(_catalogId, "ITEM_01", "Tên");
        item.Deactivate();

        item.IsActive.Should().BeFalse();
        item.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void Activate_SetsIsActiveToTrue()
    {
        var item = new MasterDataItem(_catalogId, "ITEM_01", "Tên");
        item.Deactivate();
        item.IsActive.Should().BeFalse();

        item.Activate();
        item.IsActive.Should().BeTrue();
    }
}

