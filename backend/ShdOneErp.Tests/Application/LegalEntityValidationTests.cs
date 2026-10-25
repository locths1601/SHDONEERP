using FluentAssertions;
using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Validators;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class LegalEntityValidationTests
{
    private readonly CreateLegalEntityValidator _createValidator = new();
    private readonly UpdateLegalEntityValidator _updateValidator = new();

    [Fact]
    public void CreateValidator_WithValidRequest_ShouldNotHaveAnyErrors()
    {
        var request = new CreateLegalEntityRequest
        {
            Code = "SHD_EDU",
            Name = "Công ty Cổ phần Giáo dục SHD",
            TradingName = "SHD Education",
            TaxCode = "0108123456",
            Email = "info@shdedu.vn",
            PhoneNumber = "02431234567",
            Website = "https://shdedu.vn",
            Status = EntityStatus.Active
        };

        var result = _createValidator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("shd-edu!")] // Ký tự đặc biệt không được phép
    public void CreateValidator_WithInvalidCode_ShouldHaveValidationError(string invalidCode)
    {
        var request = new CreateLegalEntityRequest
        {
            Code = invalidCode,
            Name = "Công ty hợp lệ"
        };

        var result = _createValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Fact]
    public void CreateValidator_WithInvalidEmail_ShouldHaveValidationError()
    {
        var request = new CreateLegalEntityRequest
        {
            Code = "SHD_CORP",
            Name = "Công ty hợp lệ",
            Email = "email_khong_hop_le"
        };

        var result = _createValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void UpdateValidator_MissingRowVersion_ShouldHaveValidationError()
    {
        var request = new UpdateLegalEntityRequest
        {
            Name = "Tên Mới",
            RowVersionBase64 = "" // Thiếu concurrency token
        };

        var result = _updateValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.RowVersionBase64);
    }
}
