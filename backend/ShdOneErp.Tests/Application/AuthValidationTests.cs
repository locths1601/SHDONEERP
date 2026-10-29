using FluentAssertions;
using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class AuthValidationTests
{
    private readonly BootstrapAdminRequestValidator _bootstrapValidator = new();
    private readonly RevokeTokenRequestValidator _revokeValidator = new();

    [Fact]
    public void BootstrapValidator_WithStrongCredentials_ShouldPass()
    {
        var request = new BootstrapAdminRequest
        {
            AdminUsername = "super_admin",
            AdminEmail = "admin@shdcorp.vn",
            FullName = "Quản Trị Viên",
            Password = "P@ssw0rdSecure2026!",
            BootstrapSecret = "MySecretKey"
        };

        var result = _bootstrapValidator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("short")] // less than 12 chars
    [InlineData("alllowercase123!")] // no uppercase
    [InlineData("ALLUPPERCASE123!")] // no lowercase
    [InlineData("NoSpecialChars123")] // no special character
    public void BootstrapValidator_WithWeakPassword_ShouldHaveValidationError(string weakPassword)
    {
        var request = new BootstrapAdminRequest
        {
            AdminUsername = "admin",
            AdminEmail = "admin@shdcorp.vn",
            FullName = "Admin",
            Password = weakPassword
        };

        var result = _bootstrapValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void RevokeValidator_WithEmptyToken_ShouldHaveValidationError()
    {
        var request = new RevokeTokenRequest { RefreshToken = "" };
        var result = _revokeValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.RefreshToken);
    }
}

