using FluentAssertions;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class FeatureRegistryValidationTests
{
    private readonly CreateFeatureRequestValidator _createFeatureValidator = new();
    private readonly CreateFeatureActionRequestValidator _createActionValidator = new();

    [Theory]
    [InlineData("identity.user_groups")]
    [InlineData("org.legal_entities")]
    [InlineData("party.profiles.view")]
    [InlineData("module.feature1")]
    public void CreateFeature_ValidCode_PassesValidation(string code)
    {
        var request = new CreateFeatureRequest
        {
            ModuleId = Guid.NewGuid(),
            Code = code,
            Name = "Tính năng Test",
            FeatureType = "Screen",
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = _createFeatureValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("AB")] // Too short (< 3)
    [InlineData("FEATURE_CAPS")] // Must be lowercase/dots/underscores
    [InlineData("feature with space")]
    public void CreateFeature_InvalidCode_FailsValidation(string code)
    {
        var request = new CreateFeatureRequest
        {
            ModuleId = Guid.NewGuid(),
            Code = code,
            Name = "Tính năng Test",
            FeatureType = "Screen",
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = _createFeatureValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateFeatureRequest.Code));
    }

    [Theory]
    [InlineData("Screen")]
    [InlineData("Api")]
    [InlineData("BusinessProcess")]
    [InlineData("Report")]
    [InlineData("Component")]
    [InlineData("Service")]
    public void CreateFeature_ValidType_PassesValidation(string featureType)
    {
        var request = new CreateFeatureRequest
        {
            ModuleId = Guid.NewGuid(),
            Code = "test.valid_type",
            Name = "Tính năng Test",
            FeatureType = featureType,
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = _createFeatureValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateFeature_EmptyModuleId_FailsValidation()
    {
        var request = new CreateFeatureRequest
        {
            ModuleId = Guid.Empty,
            Code = "test.feature",
            Name = "Tính năng Test",
            FeatureType = "Screen",
            Status = "Active",
            DataClassification = "Internal"
        };

        var result = _createFeatureValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateFeatureRequest.ModuleId));
    }

    [Theory]
    [InlineData("view", "Xem danh sách", "identity.group.view")]
    [InlineData("create", "Thêm mới", "identity.group.create")]
    [InlineData("export_excel", "Xuất báo cáo", "audit.log.export")]
    public void CreateFeatureAction_ValidRequest_PassesValidation(string actionCode, string actionName, string permCode)
    {
        var request = new CreateFeatureActionRequest
        {
            ActionCode = actionCode,
            ActionName = actionName,
            PermissionCode = permCode
        };

        var result = _createActionValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("ACTION-UPPER", "Tên", "valid.perm.code")] // Must be lowercase
    [InlineData("a", "Tên", "valid.perm.code")] // Too short (< 2)
    public void CreateFeatureAction_InvalidActionCode_FailsValidation(string actionCode, string actionName, string permCode)
    {
        var request = new CreateFeatureActionRequest
        {
            ActionCode = actionCode,
            ActionName = actionName,
            PermissionCode = permCode
        };

        var result = _createActionValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateFeatureActionRequest.ActionCode));
    }
}
