using System.Text.RegularExpressions;
using FluentValidation;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;

namespace ShdOneErp.Application.Modules.SystemRegistry.Validators;

public class CreateFeatureRequestValidator : AbstractValidator<CreateFeatureRequest>
{
    private static readonly Regex CodeRegex = new("^[a-z0-9_.]+$", RegexOptions.Compiled);
    private static readonly string[] ValidTypes = ["Screen", "Api", "BusinessProcess", "Report", "Component", "Service"];
    private static readonly string[] ValidStatuses = ["Active", "Beta", "Disabled", "Deprecated"];
    private static readonly string[] ValidClassifications = ["Public", "Internal", "Confidential", "Restricted"];

    public CreateFeatureRequestValidator()
    {
        RuleFor(x => x.ModuleId)
            .NotEmpty().WithMessage("Phải chọn phân hệ trực thuộc.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã tính năng không được để trống.")
            .Length(3, 100).WithMessage("Mã tính năng phải từ 3 đến 100 ký tự.")
            .Must(code => !string.IsNullOrWhiteSpace(code) && CodeRegex.IsMatch(code.Trim()))
            .WithMessage("Mã tính năng chỉ được chứa chữ thường, số, dấu chấm và gạch dưới (ví dụ: identity.user_groups).");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên tính năng không được để trống.")
            .Length(2, 200).WithMessage("Tên tính năng phải từ 2 đến 200 ký tự.");

        RuleFor(x => x.FeatureType)
            .NotEmpty().WithMessage("Loại tính năng không được để trống.")
            .Must(t => ValidTypes.Contains(t))
            .WithMessage("Loại tính năng phải là Screen, Api, BusinessProcess, Report, Component hoặc Service.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái tính năng không được để trống.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Trạng thái tính năng phải là Active, Beta, Disabled hoặc Deprecated.");

        RuleFor(x => x.DataClassification)
            .NotEmpty().WithMessage("Phân loại dữ liệu không được để trống.")
            .Must(c => ValidClassifications.Contains(c))
            .WithMessage("Phân loại dữ liệu phải là Public, Internal, Confidential hoặc Restricted.");

        RuleFor(x => x.RoutePath)
            .MaximumLength(200).WithMessage("Đường dẫn Route tối đa 200 ký tự.");

        RuleFor(x => x.ApiEndpoint)
            .MaximumLength(250).WithMessage("Endpoint API tối đa 250 ký tự.");

        RuleFor(x => x.ComponentKey)
            .MaximumLength(100).WithMessage("Mã component tối đa 100 ký tự.");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Biểu tượng (Icon) tối đa 100 ký tự.");

        RuleFor(x => x.OwnerTeam)
            .MaximumLength(100).WithMessage("Đội ngũ phụ trách tối đa 100 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả tính năng tối đa 500 ký tự.");
    }
}

public class UpdateFeatureRequestValidator : AbstractValidator<UpdateFeatureRequest>
{
    private static readonly string[] ValidTypes = ["Screen", "Api", "BusinessProcess", "Report", "Component", "Service"];
    private static readonly string[] ValidStatuses = ["Active", "Beta", "Disabled", "Deprecated"];
    private static readonly string[] ValidClassifications = ["Public", "Internal", "Confidential", "Restricted"];

    public UpdateFeatureRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên tính năng không được để trống.")
            .Length(2, 200).WithMessage("Tên tính năng phải từ 2 đến 200 ký tự.");

        RuleFor(x => x.FeatureType)
            .NotEmpty().WithMessage("Loại tính năng không được để trống.")
            .Must(t => ValidTypes.Contains(t))
            .WithMessage("Loại tính năng phải là Screen, Api, BusinessProcess, Report, Component hoặc Service.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái tính năng không được để trống.")
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Trạng thái tính năng phải là Active, Beta, Disabled hoặc Deprecated.");

        RuleFor(x => x.DataClassification)
            .NotEmpty().WithMessage("Phân loại dữ liệu không được để trống.")
            .Must(c => ValidClassifications.Contains(c))
            .WithMessage("Phân loại dữ liệu phải là Public, Internal, Confidential hoặc Restricted.");

        RuleFor(x => x.RoutePath)
            .MaximumLength(200).WithMessage("Đường dẫn Route tối đa 200 ký tự.");

        RuleFor(x => x.ApiEndpoint)
            .MaximumLength(250).WithMessage("Endpoint API tối đa 250 ký tự.");

        RuleFor(x => x.ComponentKey)
            .MaximumLength(100).WithMessage("Mã component tối đa 100 ký tự.");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Biểu tượng (Icon) tối đa 100 ký tự.");

        RuleFor(x => x.OwnerTeam)
            .MaximumLength(100).WithMessage("Đội ngũ phụ trách tối đa 100 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả tính năng tối đa 500 ký tự.");
    }
}
