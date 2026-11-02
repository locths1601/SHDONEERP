using FluentAssertions;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;
using ShdOneErp.Application.Modules.SystemReferenceData.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class ItemValidationTests
{
    private readonly CreateItemRequestValidator _createValidator = new();
    private readonly UpdateItemRequestValidator _updateValidator = new();
    private readonly ChangeItemStatusRequestValidator _statusValidator = new();

    [Fact]
    public void CreateItem_ValidRequest_PassesValidation()
    {
        var request = new CreateItemRequest
        {
            Code = "VN_NATIONALITY",
            Name = "Việt Nam",
            Value = "VN",
            DisplayOrder = 1,
            MetadataJson = "{\"code2\":\"VN\"}"
        };

        var result = _createValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void CreateItem_EmptyCode_FailsValidation(string? code)
    {
        var request = new CreateItemRequest { Code = code!, Name = "Hợp lệ" };
        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateItemRequest.Code));
    }

    [Fact]
    public void CreateItem_SpecialCharactersCode_FailsValidation()
    {
        var request = new CreateItemRequest { Code = "CODE WITH SPACE!@#", Name = "Hợp lệ" };
        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateItemRequest.Code));
    }

    [Fact]
    public void CreateItem_InvalidJson_FailsValidation()
    {
        var request = new CreateItemRequest { Code = "CODE_01", Name = "Hợp lệ", MetadataJson = "not a valid json string" };
        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateItemRequest.MetadataJson));
    }

    [Fact]
    public void UpdateItem_ValidRequest_PassesValidation()
    {
        var request = new UpdateItemRequest
        {
            Name = "Tên cập nhật",
            Value = "Giá trị mới",
            DisplayOrder = 5,
            RowVersion = Convert.ToBase64String(new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 }),
            MetadataJson = "{\"status\":\"ok\"}"
        };

        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void UpdateItem_EmptyRowVersion_FailsValidation()
    {
        var request = new UpdateItemRequest
        {
            Name = "Tên cập nhật",
            RowVersion = ""
        };

        var result = _updateValidator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(UpdateItemRequest.RowVersion));
    }

    [Fact]
    public void ChangeStatus_EmptyRowVersion_FailsValidation()
    {
        var request = new ChangeItemStatusRequest { RowVersion = "" };
        var result = _statusValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ChangeItemStatusRequest.RowVersion));
    }
}

