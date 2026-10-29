using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Infrastructure.Authentication;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class CacheInvalidationTests
{
    [Fact]
    public async Task PermissionResolver_CachesPermissions_AndInvalidatesCorrectly()
    {
        var spExecutorMock = new Mock<ISpExecutor>();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var resolver = new PermissionResolver(spExecutorMock.Object, cache);

        var userId = Guid.NewGuid();
        var initialPermissions = new List<EffectivePermissionDto>
        {
            new() { PermissionCode = "org.legal_entity.view", ScopeType = "Global" }
        };

        var updatedPermissions = new List<EffectivePermissionDto>
        {
            new() { PermissionCode = "org.legal_entity.view", ScopeType = "Global" },
            new() { PermissionCode = "org.legal_entity.create", ScopeType = "Global" }
        };

        spExecutorMock.SetupSequence(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
                "sp_Identity_User_GetEffectivePermissions",
                It.IsAny<object>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(initialPermissions)
            .ReturnsAsync(updatedPermissions);

        // Lần 1: Gọi SP
        var call1 = await resolver.GetUserPermissionsAsync(userId);
        call1.Should().HaveCount(1);
        spExecutorMock.Verify(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions", It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Once);

        // Lần 2: Lấy từ Cache (không gọi SP lần 2)
        var call2 = await resolver.GetUserPermissionsAsync(userId);
        call2.Should().HaveCount(1);
        spExecutorMock.Verify(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions", It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Once);

        // Invalidate Cache
        resolver.InvalidateUser(userId);

        // Lần 3: Sau Invalidate, bắt buộc phải gọi lại SP để lấy dữ liệu mới
        var call3 = await resolver.GetUserPermissionsAsync(userId);
        call3.Should().HaveCount(2);
        spExecutorMock.Verify(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions", It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}

