using System.Text.RegularExpressions;
using FluentValidation;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;

namespace ShdOneErp.Application.Modules.SystemRegistry.Validators;

public class CreateModuleRequestValidator : AbstractValidator<CreateModuleRequest>
{
    private static readonly Regex CodeRegex = new("^[A-Za-z0-9_]+$", RegexOptions.Compiled);
    private static readonly Regex VersionRegex = new(@"^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$", RegexOptions.Compiled);
    private static readonly string[] ValidStatuses = ["Active", "Inactive", "Beta", "Deprecated"];

    public CreateModuleRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã phân hệ không được để trống.")
            .Length(2, 50).WithMessage("Mã phân hệ phải từ 2 đến 50 ký tự.")
            .Must(code => !string.IsNullOrWhiteSpace(code) && CodeRegex.IsMatch(code.Trim()))
            .WithMessage("Mã phân hệ chỉ được chứa chữ cái, số và dấu gạch dưới.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên phân hệ không được để trống.")
            .Length(2, 150).WithMessage("Tên phân hệ phải từ 2 đến 150 ký tự.");

        RuleFor(x => x.Version)
            .NotEmpty().WithMessage("Phiên bản phân hệ không được để trống.")
            .Must(ver => !string.IsNullOrWhiteSpace(ver) && VersionRegex.IsMatch(ver.Trim()))
            .WithMessage("Phiên bản phải tuân thủ định dạng Semantic Versioning (ví dụ: 1.0.0 hoặc 1.0.0-beta).");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái phân hệ không được để trống.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Trạng thái phân hệ phải là Active, Inactive, Beta hoặc Deprecated.");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Tên biểu tượng (Icon) tối đa 100 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả phân hệ tối đa 500 ký tự.");
    }
}

public class UpdateModuleRequestValidator : AbstractValidator<UpdateModuleRequest>
{
    private static readonly Regex VersionRegex = new(@"^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$", RegexOptions.Compiled);
    private static readonly string[] ValidStatuses = ["Active", "Inactive", "Beta", "Deprecated"];

    public UpdateModuleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên phân hệ không được để trống.")
            .Length(2, 150).WithMessage("Tên phân hệ phải từ 2 đến 150 ký tự.");

        RuleFor(x => x.Version)
            .NotEmpty().WithMessage("Phiên bản phân hệ không được để trống.")
            .Must(ver => !string.IsNullOrWhiteSpace(ver) && VersionRegex.IsMatch(ver.Trim()))
            .WithMessage("Phiên bản phải tuân thủ định dạng Semantic Versioning (ví dụ: 1.0.0 hoặc 1.0.0-beta).");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái phân hệ không được để trống.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Trạng thái phân hệ phải là Active, Inactive, Beta hoặc Deprecated.");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Tên biểu tượng (Icon) tối đa 100 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả phân hệ tối đa 500 ký tự.");
    }
}

public class AddModuleDependencyRequestValidator : AbstractValidator<AddModuleDependencyRequest>
{
    private static readonly string[] ValidTypes = ["Required", "Optional", "Extension"];

    public AddModuleDependencyRequestValidator()
    {
        RuleFor(x => x.DependsOnModuleId)
            .NotEmpty().WithMessage("Phải chọn phân hệ phụ thuộc.");

        RuleFor(x => x.DependencyType)
            .NotEmpty().WithMessage("Loại phụ thuộc không được để trống.")
            .Must(t => ValidTypes.Contains(t))
            .WithMessage("Loại phụ thuộc phải là Required, Optional hoặc Extension.");

        RuleFor(x => x.MinVersion)
            .MaximumLength(30).WithMessage("Phiên bản tối thiểu tối đa 30 ký tự.");
    }
}
