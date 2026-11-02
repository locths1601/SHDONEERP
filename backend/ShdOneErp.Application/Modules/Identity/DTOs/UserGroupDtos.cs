using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Identity.DTOs;

public class UserGroupDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ScopeType { get; set; } = "Global";
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; }
    public int MemberCount { get; set; }
    public int PermissionCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public byte[]? RowVersion { get; set; }
    public string? RowVersionBase64 => RowVersion is null ? null : Convert.ToBase64String(RowVersion);
}

public class UserGroupDetailDto : UserGroupDto
{
}

public class UserGroupMemberDto
{
    public Guid MembershipId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsUserActive { get; set; }
    public Guid? ScopeLegalEntityId { get; set; }
    public string? LegalEntityCode { get; set; }
    public string? LegalEntityName { get; set; }
    public Guid? ScopeBusinessUnitId { get; set; }
    public string? BusinessUnitCode { get; set; }
    public string? BusinessUnitName { get; set; }
    public Guid? ScopeBranchId { get; set; }
    public string? BranchCode { get; set; }
    public string? BranchName { get; set; }
    public DateTime AssignedAtUtc { get; set; }
}

public class PermissionItemDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class GroupPermissionGrantDto
{
    public Guid PermissionId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime GrantedAtUtc { get; set; }
}

public class UserEffectiveDetailedPermissionDto
{
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string ScopeType { get; set; } = "Global";
    public Guid? ScopeLegalEntityId { get; set; }
    public string? ScopeLegalEntityName { get; set; }
    public Guid? ScopeBusinessUnitId { get; set; }
    public string? ScopeBusinessUnitName { get; set; }
    public Guid? ScopeBranchId { get; set; }
    public string? ScopeBranchName { get; set; }
    public string ViaGroupName { get; set; } = string.Empty;
}

public class CreateUserGroupRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ScopeType ScopeType { get; set; } = ScopeType.Global;
    public bool IsActive { get; set; } = true;
}

public class UpdateUserGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string RowVersionBase64 { get; set; } = string.Empty;
}

public class AssignUserGroupMemberRequest
{
    public Guid UserId { get; set; }
    public Guid? ScopeLegalEntityId { get; set; }
    public Guid? ScopeBusinessUnitId { get; set; }
    public Guid? ScopeBranchId { get; set; }
}

public class UpdateGroupPermissionsRequest
{
    public List<Guid> PermissionIds { get; set; } = new();
}

public class UserGroupFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SearchTerm { get; set; }
    public string? ScopeType { get; set; }
    public bool? IsActive { get; set; }
}

