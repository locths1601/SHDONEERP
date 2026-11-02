using FluentAssertions;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class CatalogValidationTests
{
    private readonly CreateCatalogRequestValidator _createValidator = new();
    private readonly UpdateCatalogRequestValidator _updateValidator = new();
    private readonly ChangeCatalogStatusRequestValidator _statusValidator = new();

    [Theory]
    [InlineData("COUNTRY")]
    [InlineData("korea.visa.status")]
    [InlineData("STUDENT_STATUS_01")]
    [InlineData("SYS_REF-DATA")]
    public void CreateCatalog_ValidCode_PassesValidation(string code)
    {
        var request = new CreateCatalogRequest
        {
            Code = code,
            Name = "Danh mục hợp lệ",
            Description = "Mô tả",
            OwnerModule = "SYSTEM"
        };

        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")] // Quá ngắn (< 2)
    [InlineData("CODE WITH SPACE")]
    [InlineData("CODE@SPECIAL#")]
    public void CreateCatalog_InvalidCode_FailsValidation(string code)
    {
        var request = new CreateCatalogRequest
        {
            Code = code,
            Name = "Danh mục",
            OwnerModule = "SYSTEM"
        };

        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateCatalog_EmptyName_FailsValidation(string name)
    {
        var request = new CreateCatalogRequest
        {
            Code = "VALID_CODE",
            Name = name,
            OwnerModule = "SYSTEM"
        };

        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void UpdateCatalog_MissingRowVersion_FailsValidation()
    {
        var request = new UpdateCatalogRequest
        {
            Name = "Tên cập nhật",
            RowVersion = "" // Missing RowVersion
        };

        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RowVersion");
    }

    [Fact]
    public void UpdateCatalog_ValidPayload_PassesValidation()
    {
        var request = new UpdateCatalogRequest
        {
            Name = "Tên mới",
            Description = "Mô tả mới",
            RowVersion = Convert.ToBase64String(new byte[] { 0, 0, 0, 0, 0, 0, 0, 1 })
        };

        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ChangeCatalogStatus_MissingRowVersion_FailsValidation()
    {
        var request = new ChangeCatalogStatusRequest
        {
            RowVersion = ""
        };

        var result = _statusValidator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}

