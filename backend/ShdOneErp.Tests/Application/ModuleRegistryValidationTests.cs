using FluentAssertions;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class ModuleRegistryValidationTests
{
    private readonly CreateModuleRequestValidator _createModuleValidator = new();
    private readonly UpdateModuleRequestValidator _updateModuleValidator = new();
    private readonly AddModuleDependencyRequestValidator _addDepValidator = new();

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("A")] // Too short (< 2)
    [InlineData("INVALID-CODE@!")] // Invalid characters
    public void CreateModule_InvalidCode_FailsValidation(string code)
    {
        var request = new CreateModuleRequest
        {
            Code = code,
            Name = "Phân hệ Test",
            Version = "1.0.0",
            Status = "Active"
        };

        var result = _createModuleValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateModuleRequest.Code));
    }

    [Theory]
    [InlineData("1.0")] // Missing patch
    [InlineData("v1.0.0")] // Contains 'v'
    [InlineData("abc")]
    [InlineData("1.0.0.0")] // 4 parts
    public void CreateModule_InvalidVersion_FailsValidation(string version)
    {
        var request = new CreateModuleRequest
        {
            Code = "TEST_MODULE",
            Name = "Phân hệ Test",
            Version = version,
            Status = "Active"
        };

        var result = _createModuleValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateModuleRequest.Version));
    }

    [Theory]
    [InlineData("Active")]
    [InlineData("Inactive")]
    [InlineData("Beta")]
    [InlineData("Deprecated")]
    public void CreateModule_ValidStatus_PassesValidation(string status)
    {
        var request = new CreateModuleRequest
        {
            Code = "TEST_MODULE",
            Name = "Phân hệ Test",
            Version = "1.0.0",
            Status = status
        };

        var result = _createModuleValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("UnknownStatus")]
    public void CreateModule_InvalidStatus_FailsValidation(string status)
    {
        var request = new CreateModuleRequest
        {
            Code = "TEST_MODULE",
            Name = "Phân hệ Test",
            Version = "1.0.0",
            Status = status
        };

        var result = _createModuleValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateModuleRequest.Status));
    }

    [Theory]
    [InlineData("Required")]
    [InlineData("Optional")]
    [InlineData("Extension")]
    public void AddDependency_ValidType_PassesValidation(string type)
    {
        var request = new AddModuleDependencyRequest
        {
            DependsOnModuleId = Guid.NewGuid(),
            DependencyType = type,
            MinVersion = "1.0.0"
        };

        var result = _addDepValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }
}
