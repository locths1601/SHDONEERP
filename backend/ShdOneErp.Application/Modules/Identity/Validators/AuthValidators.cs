using FluentValidation;
using ShdOneErp.Application.Modules.Identity.DTOs;

namespace ShdOneErp.Application.Modules.Identity.Validators;

public class RevokeTokenRequestValidator : AbstractValidator<RevokeTokenRequest>
{
    public RevokeTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token không được để trống.");
    }
}

public class BootstrapAdminRequestValidator : AbstractValidator<BootstrapAdminRequest>
{
    public BootstrapAdminRequestValidator()
    {
        RuleFor(x => x.AdminUsername)
            .NotEmpty().WithMessage("Tên đăng nhập quản trị không được để trống.")
            .MinimumLength(3).WithMessage("Tên đăng nhập phải có ít nhất 3 ký tự.")
            .MaximumLength(50).WithMessage("Tên đăng nhập không vượt quá 50 ký tự.")
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch nối, chấm hoặc gạch dưới.");

        RuleFor(x => x.AdminEmail)
            .NotEmpty().WithMessage("Email quản trị không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.")
            .MaximumLength(100).WithMessage("Email không vượt quá 100 ký tự.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(150).WithMessage("Họ và tên không vượt quá 150 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(12).WithMessage("Mật khẩu quản trị phải có ít nhất 12 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ cái in hoa.")
            .Matches(@"[a-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ cái thường.")
            .Matches(@"[0-9]").WithMessage("Mật khẩu phải chứa ít nhất một chữ số.")
            .Matches(@"[\W_]").WithMessage("Mật khẩu phải chứa ít nhất một ký tự đặc biệt.");
    }
}

