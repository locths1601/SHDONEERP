using FluentValidation.TestHelper;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;
using ShdOneErp.Application.Modules.AdmissionVisa.Validators;
using ShdOneErp.Domain.Entities.AdmissionVisa;
using Xunit;

namespace ShdOneErp.Tests.Application;

public class AdmissionValidationTests
{
    private readonly CreateStudentApplicationValidator _createValidator = new();
    private readonly UpdateStudentApplicationValidator _updateValidator = new();
    private readonly UpdateStudentApplicationStatusValidator _statusValidator = new();
    private readonly VerifyChecklistItemValidator _verifyValidator = new();
    private readonly RejectChecklistItemValidator _rejectValidator = new();

    [Fact]
    public void CreateStudentApplication_ShouldFail_WhenRequiredFieldsAreEmpty()
    {
        var request = new CreateStudentApplicationRequest
        {
            StudentPartyId = Guid.Empty,
            LegalEntityId = Guid.Empty,
            TargetMarket = "",
            IntakeTerm = "",
            ProgramName = ""
        };

        var result = _createValidator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.StudentPartyId);
        result.ShouldHaveValidationErrorFor(x => x.LegalEntityId);
        result.ShouldHaveValidationErrorFor(x => x.TargetMarket);
        result.ShouldHaveValidationErrorFor(x => x.IntakeTerm);
        result.ShouldHaveValidationErrorFor(x => x.ProgramName);
    }

    [Fact]
    public void CreateStudentApplication_ShouldPass_WhenFieldsAreValid()
    {
        var request = new CreateStudentApplicationRequest
        {
            StudentPartyId = Guid.NewGuid(),
            LegalEntityId = Guid.NewGuid(),
            TargetMarket = "Korea",
            IntakeTerm = "2026-Fall",
            ProgramName = "Du học tiếng D4-1 Hàn Quốc"
        };

        var result = _createValidator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void UpdateStudentApplication_ShouldFail_WhenRowVersionIsNotValidBase64()
    {
        var request = new UpdateStudentApplicationRequest
        {
            TargetMarket = "Korea",
            IntakeTerm = "2026-Fall",
            ProgramName = "D4-1",
            RowVersion = "not-valid-base-64!!!"
        };

        var result = _updateValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.RowVersion);
    }

    [Fact]
    public void UpdateStudentApplicationStatus_ShouldFail_WhenStatusIsInvalid()
    {
        var request = new UpdateStudentApplicationStatusRequest
        {
            Status = "FakeStatus123",
            RowVersion = Convert.ToBase64String(new byte[8])
        };

        var result = _statusValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.Status);
    }

    [Fact]
    public void RejectChecklistItem_ShouldFail_WhenRejectionReasonIsEmpty()
    {
        var request = new RejectChecklistItemRequest
        {
            RejectionReason = "",
            RowVersion = Convert.ToBase64String(new byte[8])
        };

        var result = _rejectValidator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.RejectionReason);
    }

    [Fact]
    public void StudentApplication_ShouldInitializeStandardChecklistItems()
    {
        var app = new StudentApplication(
            "APP-20261029-TEST01",
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Korea",
            "2026-Fall",
            "Du học tiếng D4-1");

        app.InitializeStandardChecklist();

        Assert.NotEmpty(app.ChecklistItems);
        Assert.Contains(app.ChecklistItems, c => c.ItemCode == "PASSPORT" && c.IsRequired);
        Assert.Contains(app.ChecklistItems, c => c.ItemCode == "BIRTH_CERT" && c.IsRequired);
        Assert.Contains(app.ChecklistItems, c => c.ItemCode == "ACADEMIC_TRANSCRIPT" && c.IsRequired);
    }

    [Fact]
    public void ChecklistItem_VerifyAndReject_ShouldUpdateStatusAndTracking()
    {
        var verifierId = Guid.NewGuid();
        var item = new ChecklistItem(Guid.NewGuid(), "PASSPORT", "Hộ chiếu");

        Assert.Equal("Pending", item.Status);

        item.Verify(verifierId, "Đã kiểm tra bản gốc");
        Assert.Equal("Verified", item.Status);
        Assert.Equal(verifierId, item.VerifiedByUserId);
        Assert.NotNull(item.VerifiedAtUtc);

        item.Reject(verifierId, "Hộ chiếu hết hạn");
        Assert.Equal("Rejected", item.Status);
        Assert.Equal("Hộ chiếu hết hạn", item.RejectionReason);

        item.ResetToPending();
        Assert.Equal("Pending", item.Status);
        Assert.Null(item.VerifiedByUserId);
    }
}

