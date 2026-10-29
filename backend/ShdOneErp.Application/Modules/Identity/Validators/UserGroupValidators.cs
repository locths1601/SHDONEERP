using FluentValidation;
using ShdOneErp.Application.Modules.Identity.DTOs;

namespace ShdOneErp.Application.Modules.Identity.Validators;

public class CreateUserGroupValidator : AbstractValidator<CreateUserGroupRequest>
{
    public CreateUserGroupValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã nhóm người dùng không được để trống.")
            .MaximumLength(50).WithMessage("Mã nhóm tối đa 50 ký tự.")
            .Matches("^[A-Za-z0-9_]+$").WithMessage("Mã nhóm chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_).");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhóm người dùng không được để trống.")
            .MaximumLength(150).WithMessage("Tên nhóm tối đa 150 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả tối đa 500 ký tự.");

        RuleFor(x => x.ScopeType)
            .IsInEnum().WithMessage("Loại phạm vi nhóm (ScopeType) không hợp lệ.");
    }
}

public class UpdateUserGroupValidator : AbstractValidator<UpdateUserGroupRequest>
{
    public UpdateUserGroupValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhóm người dùng không được để trống.")
            .MaximumLength(150).WithMessage("Tên nhóm tối đa 150 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả tối đa 500 ký tự.");

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

public class AssignUserGroupMemberValidator : AbstractValidator<AssignUserGroupMemberRequest>
{
    public AssignUserGroupMemberValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Người dùng là bắt buộc.");
    }
}

public class UpdateGroupPermissionsValidator : AbstractValidator<UpdateGroupPermissionsRequest>
{
    public UpdateGroupPermissionsValidator()
    {
        RuleFor(x => x.PermissionIds)
            .NotNull().WithMessage("Danh sách mã quyền không được để null.");
    }
}

