using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;

namespace ShdOneErp.Application.Modules.Identity.Interfaces;

public interface IUserGroupReadService
{
    Task<PagedResult<UserGroupDto>> GetPagedAsync(UserGroupFilterQuery query, CancellationToken cancellationToken = default);
    Task<UserGroupDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserGroupMemberDto>> GetMembersAsync(Guid userGroupId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GroupPermissionGrantDto>> GetPermissionsAsync(Guid userGroupId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PermissionItemDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserEffectiveDetailedPermissionDto>> GetUserEffectivePermissionsAsync(Guid targetUserId, CancellationToken cancellationToken = default);
}

public interface IUserGroupWriteService
{
    Task<Result<Guid>> CreateAsync(CreateUserGroupRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, UpdateUserGroupRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> AssignMemberAsync(Guid userGroupId, AssignUserGroupMemberRequest request, CancellationToken cancellationToken = default);
    Task<Result> RemoveMemberAsync(Guid userGroupId, Guid membershipId, CancellationToken cancellationToken = default);
    Task<Result> UpdatePermissionsAsync(Guid userGroupId, UpdateGroupPermissionsRequest request, CancellationToken cancellationToken = default);
}

