using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Services;
using ShdOneErp.Domain.Entities.System;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class ModuleRegistryServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;

    public ModuleRegistryServiceTests()
    {
        _currentUserMock = new Mock<ICurrentUser>();
        _permissionResolverMock = new Mock<IPermissionResolver>();

        // Default admin user for tests
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
    public async Task CreateAsync_ValidRequest_CreatesModuleSuccessfully()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ModuleRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateModuleRequest
        {
            Code = "FINANCE",
            Name = "Phân hệ Tài chính",
            Description = "Quản trị công nợ và kế toán",
            Version = "1.0.0",
            OrderIndex = 50,
            Icon = "Coins",
            Status = "Active"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeEmpty();

        var saved = await context.SystemModules.FirstOrDefaultAsync(m => m.Id == result.Data);
        saved.Should().NotBeNull();
        saved!.Code.Should().Be("FINANCE");
        saved.Name.Should().Be("Phân hệ Tài chính");
        saved.Status.Should().Be("Active");
        saved.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ReturnsDuplicateCodeError()
    {
        using var context = CreateInMemoryDbContext();
        context.SystemModules.Add(new SystemModule("IDENTITY", "Định danh", null, "1.0.0"));
        await context.SaveChangesAsync();

        var service = new ModuleRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new CreateModuleRequest
        {
            Code = "identity", // Should conflict with "IDENTITY"
            Name = "Trùng lặp",
            Version = "1.0.0",
            Status = "Active"
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("DUPLICATE_CODE");
    }

    [Fact]
    public async Task UpdateAsync_SelfAsParent_ReturnsInvalidParentError()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("HR", "Nhân sự", null, "1.0.0");
        context.SystemModules.Add(module);
        await context.SaveChangesAsync();

        var service = new ModuleRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new UpdateModuleRequest
        {
            Name = "Nhân sự đổi tên",
            Version = "1.0.0",
            Status = "Active",
            ParentModuleId = module.Id // Self as parent!
        };

        var result = await service.UpdateAsync(module.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("INVALID_PARENT");
    }

    [Fact]
    public async Task DeleteAsync_WhenHasFeatures_RejectsWithDependentRecords()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("ACADEMIC", "Đào tạo", null, "1.0.0");
        context.SystemModules.Add(module);
        await context.SaveChangesAsync();

        var feature = new SystemFeature(module.Id, "academic.courses", "Khóa học");
        context.SystemFeatures.Add(feature);
        await context.SaveChangesAsync();

        var service = new ModuleRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var result = await service.DeleteAsync(module.Id);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("HAS_DEPENDENT_RECORDS");
    }

    [Fact]
    public async Task AddDependencyAsync_SelfDependency_ReturnsError()
    {
        using var context = CreateInMemoryDbContext();
        var module = new SystemModule("CRM", "Khách hàng", null, "1.0.0");
        context.SystemModules.Add(module);
        await context.SaveChangesAsync();

        var service = new ModuleRegistryWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object);

        var request = new AddModuleDependencyRequest
        {
            DependsOnModuleId = module.Id, // Self dependency!
            DependencyType = "Required"
        };

        var result = await service.AddDependencyAsync(module.Id, request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("SELF_DEPENDENCY");
    }
}
