using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Services;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class ItemWriteServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;

    public ItemWriteServiceTests()
    {
        _currentUserMock = new Mock<ICurrentUser>();
        _permissionResolverMock = new Mock<IPermissionResolver>();
    }

    private ShdOneErpDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShdOneErpDbContext(options);
    }

    private static void SetRowVersion(MasterDataItem item, byte[] version)
    {
        typeof(MasterDataItem).GetProperty(nameof(MasterDataItem.RowVersion))!
            .SetValue(item, version);
    }

    [Fact]
    public async Task CreateAsync_WhenUserLacksPermission_ReturnsForbidden()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("INTAKE", "Kỳ tuyển sinh", isSystem: false);
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(It.IsAny<Guid>(), "system.reference_data.manage", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest { Code = "SPRING_2026", Name = "Kỳ Mùa Xuân 2026" };

        var result = await service.CreateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("FORBIDDEN");
    }

    [Fact]
    public async Task CreateAsync_WhenCatalogNotFound_ReturnsNotFound()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest { Code = "SPRING_2026", Name = "Kỳ Mùa Xuân 2026" };

        var result = await service.CreateAsync(Guid.NewGuid(), request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("NOT_FOUND");
    }

    [Fact]
    public async Task CreateAsync_WhenCatalogInactive_ReturnsCatalogInactive()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("INACTIVE_CAT", "Nhóm ngưng", isSystem: false);
        catalog.Deactivate();
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest { Code = "ITEM_01", Name = "Giá trị 1" };

        var result = await service.CreateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CATALOG_INACTIVE");
    }

    [Fact]
    public async Task CreateAsync_SystemCatalogWithoutSystemAdminPermission_ReturnsForbidden()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("SYS_CAT", "Nhóm hệ thống", isSystem: true);
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(It.IsAny<Guid>(), "system.reference_data.manage", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(It.IsAny<Guid>(), "system.reference_data.system_admin", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest { Code = "SYS_ITEM", Name = "Giá trị hệ thống" };

        var result = await service.CreateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("FORBIDDEN");
        result.Message.Should().Contain("system_admin");
    }

    [Fact]
    public async Task CreateAsync_DuplicateCodeInSameCatalog_ReturnsDuplicateCode()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("INTAKE", "Kỳ tuyển sinh", isSystem: false);
        context.MasterDataCatalogs.Add(catalog);
        var existingItem = new MasterDataItem(catalog.Id, "SPRING_2026", "Kỳ Xuân 2026");
        context.MasterDataItems.Add(existingItem);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest { Code = "spring_2026", Name = "Kỳ Xuân Trùng Mã" };

        var result = await service.CreateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("DUPLICATE_CODE");
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesItemSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("INTAKE", "Kỳ tuyển sinh", isSystem: false);
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest
        {
            Code = "FALL_2026",
            Name = "Kỳ Mùa Thu 2026",
            Value = "2026-09",
            DisplayOrder = 2
        };

        var result = await service.CreateAsync(catalog.Id, request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var created = await context.MasterDataItems.FirstOrDefaultAsync(i => i.Id == result.Data);
        created.Should().NotBeNull();
        created!.Code.Should().Be("FALL_2026");
        created.Name.Should().Be("Kỳ Mùa Thu 2026");
        created.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_ParentItemFromDifferentCatalog_ReturnsInvalidParentItem()
    {
        using var context = CreateInMemoryDbContext();
        var catalogA = new MasterDataCatalog("CAT_A", "Nhóm A");
        var catalogB = new MasterDataCatalog("CAT_B", "Nhóm B");
        context.MasterDataCatalogs.AddRange(catalogA, catalogB);

        var itemB = new MasterDataItem(catalogB.Id, "ITEM_B", "Mục nhóm B");
        context.MasterDataItems.Add(itemB);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateItemRequest
        {
            Code = "ITEM_A",
            Name = "Mục nhóm A",
            ParentItemId = itemB.Id // Thuộc Catalog B
        };

        var result = await service.CreateAsync(catalogA.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("INVALID_PARENT_ITEM");
    }

    [Fact]
    public async Task UpdateAsync_CannotParentSelf_ReturnsCannotParentSelf()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("CAT", "Nhóm");
        context.MasterDataCatalogs.Add(catalog);
        var item = new MasterDataItem(catalog.Id, "ITEM_01", "Tên 1");
        context.MasterDataItems.Add(item);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new UpdateItemRequest
        {
            Name = "Tên cập nhật",
            ParentItemId = item.Id, // Tự làm cha
            RowVersion = Convert.ToBase64String(new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 })
        };

        var result = await service.UpdateAsync(catalog.Id, item.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CANNOT_PARENT_SELF");
    }

    [Fact]
    public async Task UpdateAsync_CyclicHierarchy_ReturnsCyclicHierarchy()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("CAT", "Nhóm");
        context.MasterDataCatalogs.Add(catalog);

        // A -> B -> C
        var itemA = new MasterDataItem(catalog.Id, "ITEM_A", "Mục A");
        context.MasterDataItems.Add(itemA);
        await context.SaveChangesAsync();

        var itemB = new MasterDataItem(catalog.Id, "ITEM_B", "Mục B", parentItemId: itemA.Id);
        context.MasterDataItems.Add(itemB);
        await context.SaveChangesAsync();

        var itemC = new MasterDataItem(catalog.Id, "ITEM_C", "Mục C", parentItemId: itemB.Id);
        context.MasterDataItems.Add(itemC);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        // Cố gắng đặt ItemA.ParentItemId = ItemC.Id (tạo thành chu trình C -> B -> A -> C)
        var request = new UpdateItemRequest
        {
            Name = "Mục A Cập nhật",
            ParentItemId = itemC.Id,
            RowVersion = Convert.ToBase64String(new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 })
        };

        var result = await service.UpdateAsync(catalog.Id, itemA.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CYCLIC_HIERARCHY");
    }

    [Fact]
    public async Task DeactivateAsync_ValidItem_DeactivatesSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("CAT", "Nhóm");
        context.MasterDataCatalogs.Add(catalog);
        var item = new MasterDataItem(catalog.Id, "ITEM_01", "Tên 1");
        var version = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };
        SetRowVersion(item, version);
        context.MasterDataItems.Add(item);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new ChangeItemStatusRequest
        {
            RowVersion = Convert.ToBase64String(version)
        };

        var result = await service.DeactivateAsync(catalog.Id, item.Id, request);

        result.Success.Should().BeTrue();
        var updated = await context.MasterDataItems.FindAsync(item.Id);
        updated!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_MismatchedRowVersion_ReturnsConcurrencyConflict()
    {
        using var context = CreateInMemoryDbContext();
        var catalog = new MasterDataCatalog("CAT", "Nhóm");
        context.MasterDataCatalogs.Add(catalog);
        var item = new MasterDataItem(catalog.Id, "ITEM_01", "Tên 1");
        SetRowVersion(item, new byte[] { 1, 1, 1, 1 });
        context.MasterDataItems.Add(item);
        await context.SaveChangesAsync();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataItemWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new UpdateItemRequest
        {
            Name = "Tên cập nhật",
            RowVersion = Convert.ToBase64String(new byte[] { 9, 9, 9, 9 }) // Sai phiên bản
        };

        var result = await service.UpdateAsync(catalog.Id, item.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CONCURRENCY_CONFLICT");
    }
}
