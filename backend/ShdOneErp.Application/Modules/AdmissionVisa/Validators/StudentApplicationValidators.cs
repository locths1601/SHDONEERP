using FluentValidation;
using ShdOneErp.Application.Modules.AdmissionVisa.DTOs;

namespace ShdOneErp.Application.Modules.AdmissionVisa.Validators;

public class CreateStudentApplicationValidator : AbstractValidator<CreateStudentApplicationRequest>
{
    public CreateStudentApplicationValidator()
    {
        RuleFor(x => x.StudentPartyId)
            .NotEmpty().WithMessage("Học viên chỉ định không được để trống.");

        RuleFor(x => x.LegalEntityId)
            .NotEmpty().WithMessage("Pháp nhân tiếp nhận không được để trống.");

        RuleFor(x => x.TargetMarket)
            .NotEmpty().WithMessage("Thị trường du học mục tiêu không được để trống.")
            .MaximumLength(100).WithMessage("Thị trường không được vượt quá 100 ký tự.");

        RuleFor(x => x.IntakeTerm)
            .NotEmpty().WithMessage("Kỳ tuyển sinh không được để trống.")
            .MaximumLength(50).WithMessage("Kỳ tuyển sinh không được vượt quá 50 ký tự.");

        RuleFor(x => x.ProgramName)
            .NotEmpty().WithMessage("Chương trình tuyển sinh không được để trống.")
            .MaximumLength(200).WithMessage("Tên chương trình không được vượt quá 200 ký tự.");

        When(x => !string.IsNullOrWhiteSpace(x.ApplicationCode), () =>
        {
            RuleFor(x => x.ApplicationCode!)
                .MaximumLength(50).WithMessage("Mã hồ sơ không được vượt quá 50 ký tự.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(1000).WithMessage("Ghi chú không được vượt quá 1000 ký tự.");
        });
    }
}

public class UpdateStudentApplicationValidator : AbstractValidator<UpdateStudentApplicationRequest>
{
    public UpdateStudentApplicationValidator()
    {
        RuleFor(x => x.TargetMarket)
            .NotEmpty().WithMessage("Thị trường du học mục tiêu không được để trống.")
            .MaximumLength(100).WithMessage("Thị trường không được vượt quá 100 ký tự.");

        RuleFor(x => x.IntakeTerm)
            .NotEmpty().WithMessage("Kỳ tuyển sinh không được để trống.")
            .MaximumLength(50).WithMessage("Kỳ tuyển sinh không được vượt quá 50 ký tự.");

        RuleFor(x => x.ProgramName)
            .NotEmpty().WithMessage("Chương trình tuyển sinh không được để trống.")
            .MaximumLength(200).WithMessage("Tên chương trình không được vượt quá 200 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("RowVersion là bắt buộc để kiểm soát xung đột dữ liệu.")
            .Must(BeValidRowVersion).WithMessage("RowVersion không đúng định dạng Base64.");

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(1000).WithMessage("Ghi chú không được vượt quá 1000 ký tự.");
        });
    }

    private static bool BeValidRowVersion(string rowVersion)
    {
        Span<byte> buffer = stackalloc byte[16];
        return Convert.TryFromBase64String(rowVersion, buffer, out _);
    }
}

public class UpdateStudentApplicationStatusValidator : AbstractValidator<UpdateStudentApplicationStatusRequest>
{
    private static readonly string[] ValidStatuses = { "Draft", "Submitted", "UnderReview", "Accepted", "Rejected", "Withdrawn" };

    public UpdateStudentApplicationStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái hồ sơ không được để trống.")
            .Must(s => ValidStatuses.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Trạng thái hồ sơ không hợp lệ (Draft, Submitted, UnderReview, Accepted, Rejected, Withdrawn).");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("RowVersion là bắt buộc để kiểm soát xung đột dữ liệu.")
            .Must(BeValidRowVersion).WithMessage("RowVersion không đúng định dạng Base64.");

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(1000).WithMessage("Ghi chú không được vượt quá 1000 ký tự.");
        });
    }

    private static bool BeValidRowVersion(string rowVersion)
    {
        Span<byte> buffer = stackalloc byte[16];
        return Convert.TryFromBase64String(rowVersion, buffer, out _);
    }
}

public class VerifyChecklistItemValidator : AbstractValidator<VerifyChecklistItemRequest>
{
    public VerifyChecklistItemValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("RowVersion là bắt buộc.")
            .Must(BeValidRowVersion).WithMessage("RowVersion không đúng định dạng Base64.");

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(500).WithMessage("Ghi chú không được vượt quá 500 ký tự.");
        });
    }

    private static bool BeValidRowVersion(string rowVersion)
    {
        Span<byte> buffer = stackalloc byte[16];
        return Convert.TryFromBase64String(rowVersion, buffer, out _);
    }
}

public class RejectChecklistItemValidator : AbstractValidator<RejectChecklistItemRequest>
{
    public RejectChecklistItemValidator()
    {
        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Lý do từ chối không được để trống.")
            .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("RowVersion là bắt buộc.")
            .Must(BeValidRowVersion).WithMessage("RowVersion không đúng định dạng Base64.");
    }

    private static bool BeValidRowVersion(string rowVersion)
    {
        Span<byte> buffer = stackalloc byte[16];
        return Convert.TryFromBase64String(rowVersion, buffer, out _);
    }
}

public class AddChecklistItemValidator : AbstractValidator<AddChecklistItemRequest>
{
    public AddChecklistItemValidator()
    {
        RuleFor(x => x.ItemCode)
            .NotEmpty().WithMessage("Mã hạng mục tài liệu không được để trống.")
            .MaximumLength(50).WithMessage("Mã hạng mục không được vượt quá 50 ký tự.");

        RuleFor(x => x.ItemName)
            .NotEmpty().WithMessage("Tên hạng mục tài liệu không được để trống.")
            .MaximumLength(200).WithMessage("Tên hạng mục không được vượt quá 200 ký tự.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Phân loại tài liệu không được để trống.")
            .MaximumLength(50).WithMessage("Phân loại không được vượt quá 50 ký tự.");

        When(x => !string.IsNullOrWhiteSpace(x.Notes), () =>
        {
            RuleFor(x => x.Notes!)
                .MaximumLength(500).WithMessage("Ghi chú không được vượt quá 500 ký tự.");
        });
    }
}

