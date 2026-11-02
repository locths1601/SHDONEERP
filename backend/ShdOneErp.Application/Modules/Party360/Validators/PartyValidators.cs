using FluentValidation;
using ShdOneErp.Application.Modules.Party360.DTOs;

namespace ShdOneErp.Application.Modules.Party360.Validators;

public class CreatePersonPartyValidator : AbstractValidator<CreatePersonPartyRequest>
{
    public CreatePersonPartyValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã khách hàng/học viên không được để trống.")
            .MaximumLength(50).WithMessage("Mã không vượt quá 50 ký tự.")
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Mã chỉ được chứa chữ cái, số, gạch ngang, gạch dưới hoặc chấm.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Tên không được để trống.")
            .MaximumLength(100).WithMessage("Tên không vượt quá 100 ký tự.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Họ đệm không được để trống.")
            .MaximumLength(100).WithMessage("Họ đệm không vượt quá 100 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("Số điện thoại không vượt quá 50 ký tự.");
    }
}

public class CreateOrganizationPartyValidator : AbstractValidator<CreateOrganizationPartyRequest>
{
    public CreateOrganizationPartyValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã đối tác/tổ chức không được để trống.")
            .MaximumLength(50).WithMessage("Mã không vượt quá 50 ký tự.")
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Mã chỉ được chứa chữ cái, số, gạch ngang, gạch dưới hoặc chấm.");

        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Tên đối tác/công ty không được để trống.")
            .MaximumLength(200).WithMessage("Tên công ty không vượt quá 200 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.TaxId)
            .MaximumLength(50).WithMessage("Mã số thuế không vượt quá 50 ký tự.");
    }
}

public class UpdatePersonPartyValidator : AbstractValidator<UpdatePersonPartyRequest>
{
    public UpdatePersonPartyValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Tên không được để trống.")
            .MaximumLength(100).WithMessage("Tên không vượt quá 100 ký tự.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Họ đệm không được để trống.")
            .MaximumLength(100).WithMessage("Họ đệm không vượt quá 100 ký tự.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái không được để trống.")
            .MaximumLength(30);

        RuleFor(x => x.RowVersionBase64)
            .Must(BeValidRowVersion).When(x => !string.IsNullOrEmpty(x.RowVersionBase64))
            .WithMessage("RowVersion không đúng định dạng Base64 8 bytes.");
    }

    private static bool BeValidRowVersion(string? rowVersion)
    {
        if (string.IsNullOrEmpty(rowVersion)) return true;
        try
        {
            var bytes = Convert.FromBase64String(rowVersion);
            return bytes.Length == 8;
        }
        catch
        {
            return false;
        }
    }
}

public class UpdateOrganizationPartyValidator : AbstractValidator<UpdateOrganizationPartyRequest>
{
    public UpdateOrganizationPartyValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Tên công ty không được để trống.")
            .MaximumLength(200).WithMessage("Tên công ty không vượt quá 200 ký tự.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái không được để trống.")
            .MaximumLength(30);

        RuleFor(x => x.RowVersionBase64)
            .Must(BeValidRowVersion).When(x => !string.IsNullOrEmpty(x.RowVersionBase64))
            .WithMessage("RowVersion không đúng định dạng Base64 8 bytes.");
    }

    private static bool BeValidRowVersion(string? rowVersion)
    {
        if (string.IsNullOrEmpty(rowVersion)) return true;
        try
        {
            var bytes = Convert.FromBase64String(rowVersion);
            return bytes.Length == 8;
        }
        catch
        {
            return false;
        }
    }
}

public class UpdatePartyStatusValidator : AbstractValidator<UpdatePartyStatusRequest>
{
    public UpdatePartyStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái không được để trống.")
            .MaximumLength(30);

        RuleFor(x => x.RowVersionBase64)
            .Must(BeValidRowVersion).When(x => !string.IsNullOrEmpty(x.RowVersionBase64))
            .WithMessage("RowVersion không đúng định dạng Base64 8 bytes.");
    }

    private static bool BeValidRowVersion(string? rowVersion)
    {
        if (string.IsNullOrEmpty(rowVersion)) return true;
        try
        {
            var bytes = Convert.FromBase64String(rowVersion);
            return bytes.Length == 8;
        }
        catch
        {
            return false;
        }
    }
}

public class CreateStudentProfileValidator : AbstractValidator<CreateStudentProfileRequest>
{
    public CreateStudentProfileValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã học viên không được để trống.")
            .MaximumLength(50).WithMessage("Mã không vượt quá 50 ký tự.")
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Mã chỉ được chứa chữ cái, số, gạch ngang, gạch dưới hoặc chấm.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Tên không được để trống.")
            .MaximumLength(100).WithMessage("Tên không vượt quá 100 ký tự.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Họ đệm không được để trống.")
            .MaximumLength(100).WithMessage("Họ đệm không vượt quá 100 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("Số điện thoại không vượt quá 50 ký tự.");

        RuleFor(x => x.IdentificationNumber)
            .MaximumLength(100).WithMessage("Số định danh không vượt quá 100 ký tự.");
    }
}

public class AddPartyIdentificationValidator : AbstractValidator<AddPartyIdentificationRequest>
{
    public AddPartyIdentificationValidator()
    {
        RuleFor(x => x.IdentificationType)
            .NotEmpty().WithMessage("Loại giấy tờ không được để trống.")
            .MaximumLength(50).WithMessage("Loại giấy tờ không vượt quá 50 ký tự.");

        RuleFor(x => x.IdentificationNumber)
            .NotEmpty().WithMessage("Số định danh/CCCD/Hộ chiếu không được để trống.")
            .MaximumLength(100).WithMessage("Số định danh không vượt quá 100 ký tự.");
    }
}

public class AddPartyRelationshipValidator : AbstractValidator<AddPartyRelationshipRequest>
{
    public AddPartyRelationshipValidator()
    {
        RuleFor(x => x.ToPartyId)
            .NotEmpty().WithMessage("Đối tượng liên kết không được để trống.");

        RuleFor(x => x.RelationshipType)
            .NotEmpty().WithMessage("Loại mối quan hệ không được để trống.")
            .MaximumLength(50).WithMessage("Loại quan hệ không vượt quá 50 ký tự.");
    }
}
