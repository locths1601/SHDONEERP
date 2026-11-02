using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Services;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class FeatureRegistryServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;

    public FeatureRegistryServiceTests()
    {
        _currentUserMock = new Mock<ICurrentUser>();
        _permissionResolverMock = new Mock<IPermissionResolver>();

        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
    }

    private ShdOneErpDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShdOneErpDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesFeatureSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("ORG", "Tổ chức", null, "1.0.0");
        context.SystemModules.Add(module);
        await context.SaveChangesAsync();

        var service = new FeatureRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateFeatureRequest
        {
            ModuleId = module.Id,
            Code = "org.departments",
            Name = "Phòng ban",
            Description = "Quản trị cơ cấu phòng ban",
            FeatureType = "Screen",
            RoutePath = "/organization/departments",
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var saved = await context.SystemFeatures.FirstOrDefaultAsync(f => f.Id == result.Data);
        saved.Should().NotBeNull();
        saved!.Code.Should().Be("org.departments");
        saved.ModuleId.Should().Be(module.Id);
        saved.RoutePath.Should().Be("/organization/departments");
    }

    [Fact]
    public async Task CreateAsync_NonExistentModule_ReturnsModuleNotFoundError()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FeatureRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateFeatureRequest
        {
            ModuleId = Guid.NewGuid(), // Non-existent module
            Code = "nonexistent.feature",
            Name = "Tính năng mồ côi",
            FeatureType = "Screen",
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("MODULE_NOT_FOUND");
    }

    [Fact]
    public async Task AddActionMappingAsync_LinksToExistingPermissionId_WhenFound()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("IDENTITY", "Định danh", null, "1.0.0");
        context.SystemModules.Add(module);

        var feature = new SystemFeature(module.Id, "identity.users", "Quản lý Người dùng");
        context.SystemFeatures.Add(feature);

        // Seed permission catalog
        var perm = new Permission("identity.user.view", "Xem danh sách người dùng", "Identity", "Tra cứu user");
        context.Permissions.Add(perm);

        await context.SaveChangesAsync();

        var service = new FeatureRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateFeatureActionRequest
        {
            ActionCode = "view",
            ActionName = "Xem người dùng",
            PermissionCode = "identity.user.view",
            Description = "Mô tả xem user",
            IsDefault = true
        };

        var result = await service.AddActionMappingAsync(feature.Id, request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var savedFeature = await context.SystemFeatures
            .Include(f => f.ActionPermissions)
            .FirstOrDefaultAsync(f => f.Id == feature.Id);

        savedFeature.Should().NotBeNull();
        savedFeature!.ActionPermissions.Should().HaveCount(1);
        var mapping = savedFeature.ActionPermissions.First();
        mapping.ActionCode.Should().Be("view");
        mapping.PermissionCode.Should().Be("identity.user.view");
        mapping.PermissionId.Should().Be(perm.Id); // Verified auto-linked permission!
    }

    [Fact]
    public async Task AddActionMappingAsync_DuplicateAction_ReturnsDuplicateActionError()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("IDENTITY", "Định danh", null, "1.0.0");
        context.SystemModules.Add(module);

        var feature = new SystemFeature(module.Id, "identity.users", "Quản lý Người dùng");
        feature.ActionPermissions.Add(new SystemFeatureActionPermission(feature.Id, "view", "Xem", "identity.user.view"));
        context.SystemFeatures.Add(feature);
        await context.SaveChangesAsync();

        var service = new FeatureRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateFeatureActionRequest
        {
            ActionCode = "view", // Duplicate action code on this feature
            ActionName = "Xem lại",
            PermissionCode = "identity.user.view"
        };

        var result = await service.AddActionMappingAsync(feature.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("DUPLICATE_ACTION");
    }
}
