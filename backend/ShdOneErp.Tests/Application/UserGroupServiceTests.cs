using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Services;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Enums;
using ShdOneErp.Infrastructure.Persistence;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class UserGroupServiceTests
{
    private readonly Mock<ICurrentUser> _currentUserMock;
    private readonly Mock<IPermissionResolver> _permissionResolverMock;
    private readonly Mock<IPermissionCacheInvalidator> _cacheInvalidatorMock;

    public UserGroupServiceTests()
    {
        _currentUserMock = new Mock<ICurrentUser>();
        _permissionResolverMock = new Mock<IPermissionResolver>();
        _cacheInvalidatorMock = new Mock<IPermissionCacheInvalidator>();
    }

    private ShdOneErpDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ShdOneErpDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShdOneErpDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WhenUserLacksPermission_ReturnsUnauthorized()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _permissionResolverMock.Setup(p => p.HasGlobalPermissionAsync(It.IsAny<Guid>(), "identity.group.create", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(It.IsAny<Guid>(), "identity.group.create", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new UserGroupWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object, _cacheInvalidatorMock.Object);

        var request = new CreateUserGroupRequest
        {
            Code = "TEST_GROUP",
            Name = "Nhóm kiểm thử",
            ScopeType = ScopeType.Global
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("UNAUTHORIZED");
    }

    [Fact]
    public async Task CreateAsync_WhenCreatingGlobalScopeWithoutAdmin_ReturnsForbidden()
    {
        using var context = CreateInMemoryDbContext();
        var normalUserId = Guid.NewGuid();
        _currentUserMock.Setup(u => u.UserId).Returns(normalUserId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(false);
        _permissionResolverMock.Setup(p => p.HasPermissionAsync(normalUserId, "identity.group.create", null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _permissionResolverMock.Setup(p => p.HasGlobalPermissionAsync(normalUserId, "identity.group.create", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var service = new UserGroupWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object, _cacheInvalidatorMock.Object);

        var request = new CreateUserGroupRequest
        {
            Code = "GLOBAL_GROUP",
            Name = "Nhóm toàn cầu",
            ScopeType = ScopeType.Global
        };

        var result = await service.CreateAsync(request);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("UNAUTHORIZED_GLOBAL_SCOPE");
    }

    [Fact]
    public async Task AssignMemberAsync_InvalidatesUserCache()
    {
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.UserId).Returns(adminId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        // Chuẩn bị Group và User trong DB
        var group = new UserGroup("HR_TEAM", "Nhóm Nhân sự", "Nhóm quản lý nhân sự", ScopeType.Global);
        var user = new User("employee1", "emp1@shd.vn", "hash_pass", "Nguyen Van A");

        context.UserGroups.Add(group);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new UserGroupWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object, _cacheInvalidatorMock.Object);

        var request = new AssignUserGroupMemberRequest
        {
            UserId = user.Id
        };

        var result = await service.AssignMemberAsync(group.Id, request);

        result.Success.Should().BeTrue();
        _cacheInvalidatorMock.Verify(c => c.InvalidateUser(user.Id), Times.Once);

        var membership = await context.UserGroupMembers.FirstOrDefaultAsync(m => m.UserGroupId == group.Id && m.UserId == user.Id);
        membership.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_WhenGroupIsSystem_ReturnsError()
    {
        using var context = CreateInMemoryDbContext();
        _currentUserMock.Setup(u => u.UserId).Returns(Guid.NewGuid());
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var systemGroup = new UserGroup("SYSTEM_ADMIN", "Quản trị hệ thống", "Nhóm hệ thống cố định", ScopeType.Global, isSystem: true);

        context.UserGroups.Add(systemGroup);
        await context.SaveChangesAsync();

        var service = new UserGroupWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object, _cacheInvalidatorMock.Object);

        var result = await service.DeleteAsync(systemGroup.Id);

        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("CANNOT_DELETE_SYSTEM_GROUP");
    }

    [Fact]
    public async Task UpdatePermissionsAsync_InvalidatesAllMembersCache()
    {
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();

        _currentUserMock.Setup(u => u.UserId).Returns(adminId);
        _currentUserMock.Setup(u => u.IsAdmin).Returns(true);

        var group = new UserGroup("FINANCE_DEPT", "Nhóm Tài chính", "Nhóm tài chính", ScopeType.Global);
        var user1 = new User("fin1", "fin1@shd.vn", "hash1", "Finance 1");
        var user2 = new User("fin2", "fin2@shd.vn", "hash2", "Finance 2");
        var perm = new Permission("finance.report.view", "Xem báo cáo tài chính", "Finance");

        context.UserGroups.Add(group);
        context.Users.AddRange(user1, user2);
        context.Permissions.Add(perm);
        await context.SaveChangesAsync();

        var mem1 = new UserGroupMember(user1.Id, group.Id);
        var mem2 = new UserGroupMember(user2.Id, group.Id);
        context.UserGroupMembers.AddRange(mem1, mem2);
        await context.SaveChangesAsync();

        var service = new UserGroupWriteService(context, _currentUserMock.Object, _permissionResolverMock.Object, _cacheInvalidatorMock.Object);

        var request = new UpdateGroupPermissionsRequest
        {
            PermissionIds = new List<Guid> { perm.Id }
        };

        var result = await service.UpdatePermissionsAsync(group.Id, request);

        result.Success.Should().BeTrue();
        _cacheInvalidatorMock.Verify(c => c.InvalidateUser(user1.Id), Times.Once);
        _cacheInvalidatorMock.Verify(c => c.InvalidateUser(user2.Id), Times.Once);
    }
}
