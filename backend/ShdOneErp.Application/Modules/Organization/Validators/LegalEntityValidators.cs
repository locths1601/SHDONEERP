using FluentValidation;
using ShdOneErp.Application.Modules.Organization.DTOs;

namespace ShdOneErp.Application.Modules.Organization.Validators;

public class CreateLegalEntityValidator : AbstractValidator<CreateLegalEntityRequest>
{
    public CreateLegalEntityValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã pháp nhân không được để trống.")
            .MaximumLength(50).WithMessage("Mã pháp nhân tối đa 50 ký tự.")
            .Matches("^[A-Z0-9_]+$").WithMessage("Mã pháp nhân chỉ được chứa chữ cái in hoa, chữ số và dấu gạch dưới (_).");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên pháp nhân không được để trống.")
            .MaximumLength(200).WithMessage("Tên pháp nhân tối đa 200 ký tự.");

        RuleFor(x => x.TradingName)
            .MaximumLength(200).WithMessage("Tên thương mại tối đa 200 ký tự.");

        RuleFor(x => x.TaxCode)
            .MaximumLength(50).WithMessage("Mã số thuế tối đa 50 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Định dạng email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("Số điện thoại tối đa 50 ký tự.");

        RuleFor(x => x.Website)
            .MaximumLength(150).WithMessage("Website tối đa 150 ký tự.");
    }
}

public class UpdateLegalEntityValidator : AbstractValidator<UpdateLegalEntityRequest>
{
    public UpdateLegalEntityValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên pháp nhân không được để trống.")
            .MaximumLength(200).WithMessage("Tên pháp nhân tối đa 200 ký tự.");

        RuleFor(x => x.TradingName)
            .MaximumLength(200).WithMessage("Tên thương mại tối đa 200 ký tự.");

        RuleFor(x => x.TaxCode)
            .MaximumLength(50).WithMessage("Mã số thuế tối đa 50 ký tự.");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Định dạng email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(50).WithMessage("Số điện thoại tối đa 50 ký tự.");

        RuleFor(x => x.Website)
            .MaximumLength(150).WithMessage("Website tối đa 150 ký tự.");

        RuleFor(x => x.RowVersionBase64)
            .NotEmpty().WithMessage("RowVersion là bắt buộc để kiểm soát cập nhật đồng thời (Optimistic Concurrency).");
    }
}
