using FluentAssertions;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Infrastructure.Authentication;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class DirectGbacTests
{
    [Fact]
    public async Task HasPermission_WithGlobalScope_ShouldGrantAccessToAnyLegalEntity()
    {
        // Arrange
        var mockSpExecutor = new Mock<ISpExecutor>();
        var userId = Guid.NewGuid();
        var anyLegalEntityId = Guid.NewGuid();

        var grants = new List<EffectivePermissionDto>
        {
            new() { PermissionCode = "org.legal_entity.view", ScopeType = "Global" }
        };

        mockSpExecutor.Setup(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions",
            It.IsAny<object>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(grants);

        var resolver = new PermissionResolver(mockSpExecutor.Object);

        // Act
        var hasAccess = await resolver.HasPermissionAsync(userId, "org.legal_entity.view", anyLegalEntityId);

        // Assert
        hasAccess.Should().BeTrue();
    }

    [Fact]
    public async Task HasPermission_WithScopedLegalEntity_ShouldDenyAccessToDifferentEntity()
    {
        // Arrange
        var mockSpExecutor = new Mock<ISpExecutor>();
        var userId = Guid.NewGuid();
        var entityA = Guid.NewGuid();
        var entityB = Guid.NewGuid();

        var grants = new List<EffectivePermissionDto>
        {
            new()
            {
                PermissionCode = "org.legal_entity.edit",
                ScopeType = "LegalEntity",
                ScopeLegalEntityId = entityA
            }
        };

        mockSpExecutor.Setup(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions",
            It.IsAny<object>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(grants);

        var resolver = new PermissionResolver(mockSpExecutor.Object);

        // Act
        var hasAccessToEntityA = await resolver.HasPermissionAsync(userId, "org.legal_entity.edit", entityA);
        var hasAccessToEntityB = await resolver.HasPermissionAsync(userId, "org.legal_entity.edit", entityB);

        // Assert
        hasAccessToEntityA.Should().BeTrue("Người dùng được cấp quyền tại Pháp nhân A");
        hasAccessToEntityB.Should().BeFalse("Người dùng KHÔNG được cấp quyền tại Pháp nhân B (Cross-entity isolation enforced)");
    }

    [Fact]
    public async Task HasPermission_WhenPermissionNotGranted_ShouldReturnFalse()
    {
        // Arrange
        var mockSpExecutor = new Mock<ISpExecutor>();
        var userId = Guid.NewGuid();

        var grants = new List<EffectivePermissionDto>
        {
            new() { PermissionCode = "org.legal_entity.view", ScopeType = "Global" }
        };

        mockSpExecutor.Setup(x => x.ExecuteStoredProcedureListAsync<EffectivePermissionDto>(
            "sp_Identity_User_GetEffectivePermissions",
            It.IsAny<object>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(grants);

        var resolver = new PermissionResolver(mockSpExecutor.Object);

        // Act
        var hasDeletePermission = await resolver.HasPermissionAsync(userId, "org.legal_entity.delete");

        // Assert
        hasDeletePermission.Should().BeFalse("Người dùng không có quyền delete, mặc định là deny-by-default");
    }
}
