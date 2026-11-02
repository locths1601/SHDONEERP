using FluentAssertions;
using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class BusinessUnitValidationTests
{
    private readonly CreateBusinessUnitValidator _createValidator = new();
    private readonly UpdateBusinessUnitValidator _updateValidator = new();

    [Fact]
    public void CreateValidator_RequiresLegalEntityAndValidCode()
    {
        var result = _createValidator.TestValidate(new CreateBusinessUnitRequest
        {
            Code = "sales-east",
            Name = "Kinh doanh miền Đông"
        });

        result.ShouldHaveValidationErrorFor(x => x.LegalEntityId);
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-base64")]
    [InlineData("AQID")]
    public void UpdateValidator_RequiresEightByteRowVersion(string rowVersion)
    {
        var result = _updateValidator.TestValidate(new UpdateBusinessUnitRequest
        {
            Name = "Kinh doanh",
            RowVersionBase64 = rowVersion
        });

        result.ShouldHaveValidationErrorFor(x => x.RowVersionBase64);
    }
}
