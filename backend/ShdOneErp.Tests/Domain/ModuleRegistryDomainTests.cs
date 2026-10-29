using FluentAssertions;
using ShdOneErp.Domain.Entities.System;
using Xunit;

namespace ShdOneErp.Tests.Domain;

public class ModuleRegistryDomainTests
{
    [Fact]
    public void SystemModule_Constructor_NormalizesCodeToUppercaseAndTrims()
    {
        // Act
        var module = new SystemModule(
            code: "  identity_core  ",
            name: "  Hệ thống Định danh  ",
            description: " Mô tả module ",
            version: " 1.2.0 ",
            orderIndex: 10,
            icon: "ShieldCheck",
            status: "Active");

        // Assert
        module.Id.Should().NotBeEmpty();
        module.Code.Should().Be("IDENTITY_CORE");
        module.Name.Should().Be("Hệ thống Định danh");
        module.Description.Should().Be("Mô tả module");
        module.Version.Should().Be("1.2.0");
        module.OrderIndex.Should().Be(10);
        module.Icon.Should().Be("ShieldCheck");
        module.Status.Should().Be("Active");
        module.IsActive.Should().BeTrue();
    }

    [Fact]
    public void SystemModule_SetStatus_UpdatesStatusAndIsActive()
    {
        // Arrange
        var module = new SystemModule("ORG", "Tổ chức", null, "1.0.0");

        // Act
        module.SetStatus("Inactive");

        // Assert
        module.Status.Should().Be("Inactive");
        module.IsActive.Should().BeFalse();
        module.UpdatedAtUtc.Should().NotBeNull();

        // Reactivate
        module.SetStatus("Active");
        module.Status.Should().Be("Active");
        module.IsActive.Should().BeTrue();
    }

    [Fact]
    public void SystemModule_Update_AppliesAllPropertiesCorrectly()
    {
        // Arrange
        var module = new SystemModule("PARTY", "Chủ thể", "Gốc", "1.0.0");
        var parentId = Guid.NewGuid();
        var fromDate = DateTime.UtcNow;
        var toDate = fromDate.AddYears(1);

        // Act
        module.Update(
            name: "Party 360 Nâng cao",
            description: "Mô tả mới",
            version: "2.0.0",
            orderIndex: 25,
            icon: "Users2",
            status: "Beta",
            parentModuleId: parentId,
            effectiveFromUtc: fromDate,
            effectiveToUtc: toDate);

        // Assert
        module.Name.Should().Be("Party 360 Nâng cao");
        module.Description.Should().Be("Mô tả mới");
        module.Version.Should().Be("2.0.0");
        module.OrderIndex.Should().Be(25);
        module.Icon.Should().Be("Users2");
        module.Status.Should().Be("Beta");
        module.ParentModuleId.Should().Be(parentId);
        module.EffectiveFromUtc.Should().Be(fromDate);
        module.EffectiveToUtc.Should().Be(toDate);
        module.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public void SystemFeature_Constructor_NormalizesCodeToLowercase()
    {
        // Act
        var moduleId = Guid.NewGuid();
        var feature = new SystemFeature(
            moduleId: moduleId,
            code: "  IDENTITY.USER_GROUPS  ",
            name: " Quản trị Nhóm quyền ",
            description: " Chi tiết tính năng ",
            isEnabledGlobal: true,
            featureType: "Screen",
            routePath: "/admin/user-groups");

        // Assert
        feature.Id.Should().NotBeEmpty();
        feature.ModuleId.Should().Be(moduleId);
        feature.Code.Should().Be("identity.user_groups");
        feature.Name.Should().Be("Quản trị Nhóm quyền");
        feature.FeatureType.Should().Be("Screen");
        feature.RoutePath.Should().Be("/admin/user-groups");
        feature.Status.Should().Be("Active");
        feature.IsEnabledGlobal.Should().BeTrue();
    }

    [Fact]
    public void SystemFeatureActionPermission_Update_ModifiesFieldsCorrectly()
    {
        // Arrange
        var featureId = Guid.NewGuid();
        var permId = Guid.NewGuid();
        var action = new SystemFeatureActionPermission(
            featureId: featureId,
            actionCode: "VIEW",
            actionName: "Xem danh sách",
            permissionCode: "ORG.LEGAL_ENTITY.VIEW");

        action.ActionCode.Should().Be("view");
        action.PermissionCode.Should().Be("org.legal_entity.view");

        // Act
        action.Update(
            actionName: "Xem chi tiết",
            permissionCode: "org.legal_entity.detail",
            permissionId: permId,
            description: "Cập nhật mô tả",
            isDefault: false);

        // Assert
        action.ActionName.Should().Be("Xem chi tiết");
        action.PermissionCode.Should().Be("org.legal_entity.detail");
        action.PermissionId.Should().Be(permId);
        action.Description.Should().Be("Cập nhật mô tả");
        action.IsDefault.Should().BeFalse();
    }
}
