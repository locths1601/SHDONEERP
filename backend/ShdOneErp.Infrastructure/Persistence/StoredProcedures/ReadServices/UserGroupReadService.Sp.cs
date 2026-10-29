using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Interfaces;

namespace ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

public class UserGroupReadService : IUserGroupReadService
{
    private readonly ISpExecutor _spExecutor;
    private readonly ICurrentUser _currentUser;

    public UserGroupReadService(ISpExecutor spExecutor, ICurrentUser currentUser)
    {
        _spExecutor = spExecutor;
        _currentUser = currentUser;
    }

    public Task<PagedResult<UserGroupDto>> GetPagedAsync(
        UserGroupFilterQuery query,
        CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedurePagedAsync<UserGroupDto>(
            "sp_Identity_UserGroup_GetPaged",
            new
            {
                PageNumber = query.Page,
                PageSize = query.PageSize,
                query.SearchTerm,
                query.ScopeType,
                query.IsActive,
                CurrentUserId = _currentUser.UserId
            },
            cancellationToken: cancellationToken);
    }

    public Task<UserGroupDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _spExecutor.ExecuteStoredProcedureSingleAsync<UserGroupDetailDto>(
            "sp_Identity_UserGroup_GetById",
            new { Id = id, CurrentUserId = _currentUser.UserId },
            cancellationToken);
    }

    public async Task<IReadOnlyList<UserGroupMemberDto>> GetMembersAsync(Guid userGroupId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<UserGroupMemberDto>(
            "sp_Identity_UserGroup_GetMembers",
            new { UserGroupId = userGroupId, CurrentUserId = _currentUser.UserId },
            cancellationToken);
    }

    public async Task<IReadOnlyList<GroupPermissionGrantDto>> GetPermissionsAsync(Guid userGroupId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<GroupPermissionGrantDto>(
            "sp_Identity_UserGroup_GetPermissions",
            new { UserGroupId = userGroupId },
            cancellationToken);
    }

    public async Task<IReadOnlyList<PermissionItemDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<PermissionItemDto>(
            "sp_Identity_Permission_GetAll",
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyList<UserEffectiveDetailedPermissionDto>> GetUserEffectivePermissionsAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        return await _spExecutor.ExecuteStoredProcedureListAsync<UserEffectiveDetailedPermissionDto>(
            "sp_Identity_User_GetDetailedEffectivePermissions",
            new { TargetUserId = targetUserId },
            cancellationToken);
    }
}

