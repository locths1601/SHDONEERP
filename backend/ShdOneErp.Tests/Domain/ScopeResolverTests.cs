using FluentAssertions;
using Moq;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Domain.Enums;
using ShdOneErp.Infrastructure.Authentication;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class ScopeResolverTests
{
    private readonly Mock<IPermissionResolver> _permissionResolverMock = new();
    private readonly ScopeResolver _scopeResolver;

    public ScopeResolverTests()
    {
        _scopeResolver = new ScopeResolver(_permissionResolverMock.Object);
    }

    [Fact]
    public async Task ResolveScopeAsync_GlobalGrant_ReturnsIsGlobalTrue()
    {
        var userId = Guid.NewGuid();
        _permissionResolverMock.Setup(x => x.GetUserPermissionsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EffectivePermissionDto>
            {
                new() { PermissionCode = "org.legal_entity.view", ScopeType = "Global" }
            });

        var result = await _scopeResolver.ResolveScopeAsync(userId, "org.legal_entity.view");

        result.IsGlobal.Should().BeTrue();
    }

    [Fact]
    public async Task ResolveScopeAsync_ScopedGrants_AggregatesEntityIds()
    {
        var userId = Guid.NewGuid();
        var leId1 = Guid.NewGuid();
        var leId2 = Guid.NewGuid();
        var buId = Guid.NewGuid();

        _permissionResolverMock.Setup(x => x.GetUserPermissionsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EffectivePermissionDto>
            {
                new() { PermissionCode = "org.branch.view", ScopeType = "LegalEntity", ScopeLegalEntityId = leId1 },
                new() { PermissionCode = "org.branch.view", ScopeType = "LegalEntity", ScopeLegalEntityId = leId2 },
                new() { PermissionCode = "org.branch.view", ScopeType = "BusinessUnit", ScopeBusinessUnitId = buId },
            });

        var result = await _scopeResolver.ResolveScopeAsync(userId, "org.branch.view");

        result.IsGlobal.Should().BeFalse();
        result.AllowedLegalEntityIds.Should().BeEquivalentTo(new[] { leId1, leId2 });
        result.AllowedBusinessUnitIds.Should().BeEquivalentTo(new[] { buId });
    }

    [Fact]
    public async Task HasResourceAccessAsync_CrossCompanyAttempt_IsBlocked()
    {
        var userId = Guid.NewGuid();
        var companyA = Guid.NewGuid();
        var companyB = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        // User chỉ có quyền tại Company A
        _permissionResolverMock.Setup(x => x.HasPermissionAsync(userId, "doc.view", companyB, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var canAccess = await _scopeResolver.HasResourceAccessAsync(
            userId, "doc.view", companyB, ownerUserId, DataClassification.Internal);

        canAccess.Should().BeFalse("Người dùng không thuộc Company B không được phép truy cập tài nguyên của Company B");
    }

    [Fact]
    public async Task HasResourceAccessAsync_ConfidentialData_RequiresResourceOwnershipOrAdmin()
    {
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var companyA = Guid.NewGuid();

        _permissionResolverMock.Setup(x => x.HasPermissionAsync(userId, "doc.view", companyA, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _permissionResolverMock.Setup(x => x.HasGlobalPermissionAsync(userId, "doc.view", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Trường hợp 1: Người dùng không phải chủ sở hữu tài liệu mật
        var nonOwnerAccess = await _scopeResolver.HasResourceAccessAsync(
            userId, "doc.view", companyA, otherUserId, DataClassification.Confidential);
        nonOwnerAccess.Should().BeFalse("Dữ liệu Confidential trong cùng công ty nhưng không phải chủ sở hữu sẽ bị từ chối");

        // Trường hợp 2: Người dùng chính là chủ sở hữu tài liệu mật
        var ownerAccess = await _scopeResolver.HasResourceAccessAsync(
            userId, "doc.view", companyA, userId, DataClassification.Confidential);
        ownerAccess.Should().BeTrue("Chính chủ sở hữu tài liệu Confidential được phép truy cập");
    }
}

