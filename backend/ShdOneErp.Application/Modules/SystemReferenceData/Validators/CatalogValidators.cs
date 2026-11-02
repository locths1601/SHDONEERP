using System.Text.RegularExpressions;
using FluentValidation;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Validators;

public class CreateCatalogRequestValidator : AbstractValidator<CreateCatalogRequest>
{
    private static readonly Regex CodeRegex = new("^[A-Za-z0-9_.-]+$", RegexOptions.Compiled);

    public CreateCatalogRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã nhóm danh mục không được để trống.")
            .Length(2, 50).WithMessage("Mã nhóm danh mục phải từ 2 đến 50 ký tự.")
            .Must(code => !string.IsNullOrWhiteSpace(code) && CodeRegex.IsMatch(code.Trim()))
            .WithMessage("Mã nhóm danh mục chỉ được chứa chữ cái, số, dấu chấm, dấu gạch ngang và dấu gạch dưới.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhóm danh mục không được để trống.")
            .Length(2, 150).WithMessage("Tên nhóm danh mục phải từ 2 đến 150 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả nhóm danh mục tối đa 500 ký tự.");

        RuleFor(x => x.OwnerModule)
            .NotEmpty().WithMessage("Phân hệ sở hữu không được để trống.")
            .Length(2, 50).WithMessage("Phân hệ sở hữu từ 2 đến 50 ký tự.");
    }
}

public class UpdateCatalogRequestValidator : AbstractValidator<UpdateCatalogRequest>
{
    public UpdateCatalogRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhóm danh mục không được để trống.")
            .Length(2, 150).WithMessage("Tên nhóm danh mục phải từ 2 đến 150 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả nhóm danh mục tối đa 500 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Mã phiên bản (RowVersion) là bắt buộc để kiểm soát xung đột dữ liệu.");
    }
}

public class ChangeCatalogStatusRequestValidator : AbstractValidator<ChangeCatalogStatusRequest>
{
    public ChangeCatalogStatusRequestValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Mã phiên bản (RowVersion) là bắt buộc để kiểm soát xung đột dữ liệu.");
    }
}

