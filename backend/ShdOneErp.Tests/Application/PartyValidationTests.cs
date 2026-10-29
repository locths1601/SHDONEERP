using FluentAssertions;
using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.Party360.DTOs;
using ShdOneErp.Application.Modules.Party360.Validators;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class PartyValidationTests
{
    private readonly CreatePersonPartyValidator _personValidator = new();
    private readonly CreateOrganizationPartyValidator _orgValidator = new();

    [Fact]
    public void CreatePersonValidator_WithValidInput_ShouldNotHaveErrors()
    {
        var request = new CreatePersonPartyRequest
        {
            Code = "STU-2026-001",
            FirstName = "Bình",
            LastName = "Lê",
            Email = "binh.le@example.com",
            PhoneNumber = "0988776655"
        };

        var result = _personValidator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreatePersonValidator_WithEmptyNames_ShouldHaveValidationErrors()
    {
        var request = new CreatePersonPartyRequest
        {
            Code = "",
            FirstName = "",
            LastName = "",
            Email = "invalid-email"
        };

        var result = _personValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Code);
        result.ShouldHaveValidationErrorFor(x => x.FirstName);
        result.ShouldHaveValidationErrorFor(x => x.LastName);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void CreateOrganizationValidator_WithEmptyCompanyName_ShouldFail()
    {
        var request = new CreateOrganizationPartyRequest
        {
            Code = "AGENCY-01",
            CompanyName = ""
        };

        var result = _orgValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.CompanyName);
    }

    [Fact]
    public void CreateStudentValidator_WithValidStudentData_ShouldPass()
    {
        var validator = new CreateStudentProfileValidator();
        var request = new CreateStudentProfileRequest
        {
            Code = "SHD-STU-2026-9999",
            FirstName = "An",
            LastName = "Nguyễn",
            Email = "an.nguyen@shd.edu.vn",
            PhoneNumber = "0912345678",
            IdentificationType = "CitizenId",
            IdentificationNumber = "001099123456"
        };

        var result = validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateStudentValidator_WithInvalidCodeAndEmail_ShouldFail()
    {
        var validator = new CreateStudentProfileValidator();
        var request = new CreateStudentProfileRequest
        {
            Code = "INVALID CODE!",
            FirstName = "An",
            LastName = "Nguyễn",
            Email = "invalid_email_format"
        };

        var result = validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Code);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void AddPartyIdentificationValidator_WithValidData_ShouldPass()
    {
        var validator = new AddPartyIdentificationValidator();
        var request = new AddPartyIdentificationRequest
        {
            IdentificationType = "Passport",
            IdentificationNumber = "B9876543"
        };

        var result = validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void AddPartyRelationshipValidator_WithEmptyToParty_ShouldFail()
    {
        var validator = new AddPartyRelationshipValidator();
        var request = new AddPartyRelationshipRequest
        {
            ToPartyId = Guid.Empty,
            RelationshipType = "Parent"
        };

        var result = validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.ToPartyId);
    }
}

