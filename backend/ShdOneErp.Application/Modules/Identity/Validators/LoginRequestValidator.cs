using FluentValidation;
using ShdOneErp.Application.Modules.Identity.DTOs;

namespace ShdOneErp.Application.Modules.Identity.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.UsernameOrEmail)
            .NotEmpty().WithMessage("Tên đăng nhập hoặc email không được để trống.")
            .MaximumLength(100).WithMessage("Độ dài tối đa là 100 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}
