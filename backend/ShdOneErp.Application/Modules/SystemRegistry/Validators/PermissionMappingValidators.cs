using System.Text.RegularExpressions;
using FluentValidation;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;

namespace ShdOneErp.Application.Modules.SystemRegistry.Validators;

public class CreateFeatureActionRequestValidator : AbstractValidator<CreateFeatureActionRequest>
{
    private static readonly Regex ActionCodeRegex = new("^[a-z0-9_]+$", RegexOptions.Compiled);
    private static readonly Regex PermCodeRegex = new("^[a-z0-9_.]+$", RegexOptions.Compiled);

    public CreateFeatureActionRequestValidator()
    {
        RuleFor(x => x.ActionCode)
            .NotEmpty().WithMessage("Mã hành động không được để trống.")
            .Length(2, 50).WithMessage("Mã hành động phải từ 2 đến 50 ký tự.")
            .Must(c => !string.IsNullOrWhiteSpace(c) && ActionCodeRegex.IsMatch(c.Trim()))
            .WithMessage("Mã hành động chỉ được chứa chữ cái thường, số và dấu gạch dưới (ví dụ: view, create, edit, delete, export, assign).");

        RuleFor(x => x.ActionName)
            .NotEmpty().WithMessage("Tên hành động không được để trống.")
            .Length(2, 100).WithMessage("Tên hành động phải từ 2 đến 100 ký tự.");

        RuleFor(x => x.PermissionCode)
            .NotEmpty().WithMessage("Mã quyền (PermissionCode) không được để trống.")
            .Length(3, 100).WithMessage("Mã quyền phải từ 3 đến 100 ký tự.")
            .Must(c => !string.IsNullOrWhiteSpace(c) && PermCodeRegex.IsMatch(c.Trim()))
            .WithMessage("Mã quyền phải tuân thủ quy tắc module.entity.action (ví dụ: identity.group.view).");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả hành động tối đa 500 ký tự.");
    }
}

public class UpdateFeatureActionRequestValidator : AbstractValidator<UpdateFeatureActionRequest>
{
    private static readonly Regex PermCodeRegex = new("^[a-z0-9_.]+$", RegexOptions.Compiled);

    public UpdateFeatureActionRequestValidator()
    {
        RuleFor(x => x.ActionName)
            .NotEmpty().WithMessage("Tên hành động không được để trống.")
            .Length(2, 100).WithMessage("Tên hành động phải từ 2 đến 100 ký tự.");

        RuleFor(x => x.PermissionCode)
            .NotEmpty().WithMessage("Mã quyền (PermissionCode) không được để trống.")
            .Length(3, 100).WithMessage("Mã quyền phải từ 3 đến 100 ký tự.")
            .Must(c => !string.IsNullOrWhiteSpace(c) && PermCodeRegex.IsMatch(c.Trim()))
            .WithMessage("Mã quyền phải tuân thủ quy tắc module.entity.action (ví dụ: identity.group.view).");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả hành động tối đa 500 ký tự.");
    }
}
