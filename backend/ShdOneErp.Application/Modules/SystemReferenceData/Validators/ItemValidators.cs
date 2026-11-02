using System.Text.Json;
using System.Text.RegularExpressions;
using FluentValidation;
using ShdOneErp.Application.Modules.SystemReferenceData.DTOs;

namespace ShdOneErp.Application.Modules.SystemReferenceData.Validators;

public class CreateItemRequestValidator : AbstractValidator<CreateItemRequest>
{
    private static readonly Regex CodeRegex = new("^[A-Za-z0-9_.-]+$", RegexOptions.Compiled);

    public CreateItemRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã giá trị danh mục không được để trống.")
            .Length(1, 50).WithMessage("Mã giá trị danh mục phải từ 1 đến 50 ký tự.")
            .Must(code => !string.IsNullOrWhiteSpace(code) && CodeRegex.IsMatch(code.Trim()))
            .WithMessage("Mã giá trị danh mục chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang và dấu chấm.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên giá trị danh mục không được để trống.")
            .Length(1, 200).WithMessage("Tên giá trị danh mục phải từ 1 đến 200 ký tự.");

        RuleFor(x => x.Value)
            .MaximumLength(500).WithMessage("Giá trị nghiệp vụ tối đa 500 ký tự.");

        RuleFor(x => x.MetadataJson)
            .Must(BeValidJson).When(x => !string.IsNullOrWhiteSpace(x.MetadataJson))
            .WithMessage("MetadataJson phải là chuỗi JSON hợp lệ.");
    }

    private static bool BeValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return true;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class UpdateItemRequestValidator : AbstractValidator<UpdateItemRequest>
{
    public UpdateItemRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên giá trị danh mục không được để trống.")
            .Length(1, 200).WithMessage("Tên giá trị danh mục phải từ 1 đến 200 ký tự.");

        RuleFor(x => x.Value)
            .MaximumLength(500).WithMessage("Giá trị nghiệp vụ tối đa 500 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Mã phiên bản (RowVersion) là bắt buộc để kiểm soát xung đột dữ liệu.");

        RuleFor(x => x.MetadataJson)
            .Must(BeValidJson).When(x => !string.IsNullOrWhiteSpace(x.MetadataJson))
            .WithMessage("MetadataJson phải là chuỗi JSON hợp lệ.");
    }

    private static bool BeValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return true;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class ChangeItemStatusRequestValidator : AbstractValidator<ChangeItemStatusRequest>
{
    public ChangeItemStatusRequestValidator()
    {
        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Mã phiên bản (RowVersion) là bắt buộc để kiểm soát xung đột dữ liệu.");
    }
}

