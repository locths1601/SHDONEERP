using FluentValidation;
using ShdOneErp.Application.Modules.Organization.DTOs;

namespace ShdOneErp.Application.Modules.Organization.Validators;

public class CreateBusinessUnitValidator : AbstractValidator<CreateBusinessUnitRequest>
{
    public CreateBusinessUnitValidator()
    {
        RuleFor(x => x.LegalEntityId)
            .NotEmpty().WithMessage("Pháp nhân là bắt buộc.");
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã đơn vị kinh doanh không được để trống.")
            .MaximumLength(50).WithMessage("Mã đơn vị kinh doanh tối đa 50 ký tự.")
            .Matches("^[A-Za-z0-9_]+$").WithMessage("Mã chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_).");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên đơn vị kinh doanh không được để trống.")
            .MaximumLength(200).WithMessage("Tên đơn vị kinh doanh tối đa 200 ký tự.");
        RuleFor(x => x.Status).IsInEnum().WithMessage("Trạng thái không hợp lệ.");
    }
}

public class UpdateBusinessUnitValidator : AbstractValidator<UpdateBusinessUnitRequest>
{
    public UpdateBusinessUnitValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên đơn vị kinh doanh không được để trống.")
            .MaximumLength(200).WithMessage("Tên đơn vị kinh doanh tối đa 200 ký tự.");
        RuleFor(x => x.Status).IsInEnum().WithMessage("Trạng thái không hợp lệ.");
        RuleFor(x => x.RowVersionBase64)
            .NotEmpty().WithMessage("RowVersion là bắt buộc.")
            .Must(IsValidBase64).WithMessage("RowVersion không hợp lệ.");
    }

    private static bool IsValidBase64(string value)
    {
        Span<byte> buffer = stackalloc byte[16];
        return Convert.TryFromBase64String(value, buffer, out var bytesWritten) && bytesWritten == 8;
    }
}
