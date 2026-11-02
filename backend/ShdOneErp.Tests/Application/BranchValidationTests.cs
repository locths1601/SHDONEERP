using FluentAssertions;
using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.Organization.DTOs;
using ShdOneErp.Application.Modules.Organization.Validators;
using ShdOneErp.Domain.Enums;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class BranchValidationTests
{
    private readonly CreateBranchValidator _createValidator = new();
    private readonly UpdateBranchValidator _updateValidator = new();

    [Fact]
    public void CreateValidator_ValidRequest_Passes()
    {
        var model = new CreateBranchRequest
        {
            LegalEntityId = Guid.NewGuid(),
            BusinessUnitId = Guid.NewGuid(),
            Code = "CAMPUS_01",
            Name = "Cơ sở Đống Đa",
            Address = "100 Chùa Bộc, Đống Đa, Hà Nội",
            Status = EntityStatus.Active
        };

        var result = _createValidator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateValidator_InvalidCodeOrMissingLegalEntity_Fails()
    {
        var model = new CreateBranchRequest
        {
            LegalEntityId = Guid.Empty,
            Code = "campus@invalid#",
            Name = ""
        };

        var result = _createValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.LegalEntityId);
        result.ShouldHaveValidationErrorFor(x => x.Code);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void UpdateValidator_ValidRequest_Passes()
    {
        var validRowVersion = Convert.ToBase64String(new byte[8] { 1, 2, 3, 4, 5, 6, 7, 8 });
        var model = new UpdateBranchRequest
        {
            Name = "Cơ sở Cầu Giấy",
            Address = "Số 1 Cầu Giấy, Hà Nội",
            Status = EntityStatus.Active,
            RowVersionBase64 = validRowVersion
        };

        var result = _updateValidator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-base64")]
    [InlineData("AQID")] // 3 bytes instead of 8
    public void UpdateValidator_InvalidRowVersion_Fails(string rowVersion)
    {
        var model = new UpdateBranchRequest
        {
            Name = "Cơ sở Cầu Giấy",
            Status = EntityStatus.Active,
            RowVersionBase64 = rowVersion
        };

        var result = _updateValidator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.RowVersionBase64);
    }
}

