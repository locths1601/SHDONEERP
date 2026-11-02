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

public class CatalogWriteServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;

    public CatalogWriteServiceTests()
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

    private static void SetRowVersion(MasterDataCatalog catalog, byte[] version)
    {
        typeof(MasterDataCatalog).GetProperty(nameof(MasterDataCatalog.RowVersion))!
            .SetValue(catalog, version);
    }

    [Fact]
    public async Task CreateAsync_WhenUserLacksPermission_ReturnsForbidden()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(It.IsAny<Guid>(), "system.reference_data.manage", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateCatalogRequest
        {
            Code = "TEST_CATALOG",
            Name = "Nhóm kiểm thử",
            OwnerModule = "SYSTEM"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("FORBIDDEN");
    }

    [Fact]
    public async Task CreateAsync_SystemCatalogWithoutSystemAdminPermission_ReturnsForbidden()
    {
        using var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(userId);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(userId, "system.reference_data.manage", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(userId, "system.reference_data.system_admin", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateCatalogRequest
        {
            Code = "SYS_CORE",
            Name = "Danh mục cốt lõi",
            OwnerModule = "SYSTEM",
            IsSystem = true
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("FORBIDDEN");
        result.Message.Should().Contain("hệ thống cấp cao");
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesCatalogSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateCatalogRequest
        {
            Code = "KOREA_INTAKE_TERM",
            Name = "Kỳ nhập học Hàn Quốc",
            Description = "Quản lý các kỳ tuyển sinh",
            OwnerModule = "ADMISSION",
            IsSystem = false
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var catalogInDb = await context.MasterDataCatalogs.FirstOrDefaultAsync(c => c.Id == result.Data);
        catalogInDb.Should().NotBeNull();
        catalogInDb!.Code.Should().Be("KOREA_INTAKE_TERM");
        catalogInDb.Name.Should().Be("Kỳ nhập học Hàn Quốc");
        catalogInDb.IsActive.Should().BeTrue();
        catalogInDb.IsSystem.Should().BeFalse();
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ReturnsDuplicateCodeError()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var existingCatalog = new MasterDataCatalog("KOREA_INTAKE_TERM", "Kỳ nhập học", ownerModule: "ADMISSION");
        context.MasterDataCatalogs.Add(existingCatalog);
        await context.SaveChangesAsync();

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new CreateCatalogRequest
        {
            Code = "korea_intake_term", // case insensitive duplicate
            Name = "Trùng lặp kỳ nhập học",
            OwnerModule = "ADMISSION"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("DUPLICATE_CODE");
    }

    [Fact]
    public async Task UpdateAsync_MatchingRowVersion_UpdatesNameAndDescription()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var catalog = new MasterDataCatalog("TEST_CATALOG", "Tên cũ", "Mô tả cũ", "SYSTEM", isSystem: false);
        SetRowVersion(catalog, new byte[] { 0, 0, 0, 1 });
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        var currentToken = Convert.ToBase64String(catalog.RowVersion);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new UpdateCatalogRequest
        {
            Name = "Tên cập nhật",
            Description = "Mô tả cập nhật",
            RowVersion = currentToken
        };

        var result = await service.UpdateAsync(catalog.Id, request);

        result.Success.Should().BeTrue();
        var updatedInDb = await context.MasterDataCatalogs.FindAsync(catalog.Id);
        updatedInDb!.Name.Should().Be("Tên cập nhật");
        updatedInDb.Description.Should().Be("Mô tả cập nhật");
    }

    [Fact]
    public async Task UpdateAsync_MismatchedRowVersion_ReturnsConcurrencyConflict()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var catalog = new MasterDataCatalog("TEST_CATALOG", "Tên cũ", "Mô tả cũ", "SYSTEM", isSystem: false);
        SetRowVersion(catalog, new byte[] { 0, 0, 0, 1 });
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new UpdateCatalogRequest
        {
            Name = "Tên cập nhật",
            Description = "Mô tả cập nhật",
            RowVersion = Convert.ToBase64String(new byte[] { 9, 9, 9, 9 }) // Stale / mismatched token
        };

        var result = await service.UpdateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CONCURRENCY_CONFLICT");
    }

    [Fact]
    public async Task DeactivateAsync_SystemControlledCatalog_ReturnsCannotDeactivateError()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var catalog = new MasterDataCatalog("SYS_CATALOG", "Hệ thống", "Lõi", "SYSTEM", isSystem: true);
        SetRowVersion(catalog, new byte[] { 0, 0, 0, 1 });
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        var currentToken = Convert.ToBase64String(catalog.RowVersion);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new ChangeCatalogStatusRequest
        {
            RowVersion = currentToken
        };

        var result = await service.DeactivateAsync(catalog.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CANNOT_DEACTIVATE_SYSTEM_CATALOG");
    }

    [Fact]
    public async Task DeactivateAsync_AdminManagedCatalog_DeactivatesSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var catalog = new MasterDataCatalog("ADMIN_CATALOG", "Danh mục quản trị", null, "CRM", isSystem: false);
        SetRowVersion(catalog, new byte[] { 0, 0, 0, 1 });
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        var currentToken = Convert.ToBase64String(catalog.RowVersion);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new ChangeCatalogStatusRequest
        {
            RowVersion = currentToken
        };

        var result = await service.DeactivateAsync(catalog.Id, request);

        result.Success.Should().BeTrue();
        var inDb = await context.MasterDataCatalogs.FindAsync(catalog.Id);
        inDb!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ActivateAsync_ValidCatalog_ActivatesSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var catalog = new MasterDataCatalog("ADMIN_CATALOG", "Danh mục", null, "CRM", isSystem: false);
        SetRowVersion(catalog, new byte[] { 0, 0, 0, 1 });
        catalog.Deactivate();
        context.MasterDataCatalogs.Add(catalog);
        await context.SaveChangesAsync();

        var currentToken = Convert.ToBase64String(catalog.RowVersion);

        var service = new MasterDataCatalogWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);
        var request = new ChangeCatalogStatusRequest
        {
            RowVersion = currentToken
        };

        var result = await service.ActivateAsync(catalog.Id, request);

        result.Success.Should().BeTrue();
        var inDb = await context.MasterDataCatalogs.FindAsync(catalog.Id);
        inDb!.IsActive.Should().BeTrue();
    }
}
