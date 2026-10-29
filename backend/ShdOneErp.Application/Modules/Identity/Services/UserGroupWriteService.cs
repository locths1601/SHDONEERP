using Microsoft.EntityFrameworkCore;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Interfaces;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Application.Modules.Identity.Services;

public class UserGroupWriteService : IUserGroupWriteService
{
    private readonly IShdOneErpDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionResolver _permissionResolver;
    private readonly IPermissionCacheInvalidator _cacheInvalidator;

    public UserGroupWriteService(
        IShdOneErpDbContext context,
        ICurrentUser currentUser,
        IPermissionResolver permissionResolver,
        IPermissionCacheInvalidator cacheInvalidator)
    {
        _context = context;
        _currentUser = currentUser;
        _permissionResolver = permissionResolver;
        _cacheInvalidator = cacheInvalidator;
    }

    public async Task<Result<Guid>> CreateAsync(CreateUserGroupRequest request, CancellationToken cancellationToken = default)
    {
        // 1. Kiểm tra quyền tạo nhóm
        if (!await HasGlobalOrScopePermissionAsync("identity.group.create", cancellationToken))
            return Result<Guid>.Fail("UNAUTHORIZED", "Bạn không có quyền tạo nhóm người dùng.");

        // 2. Nếu nhóm có Scope Global, bắt buộc người tạo phải có quyền Global
        if (request.ScopeType == ScopeType.Global && !_currentUser.IsAdmin)
        {
            var hasGlobal = _currentUser.UserId.HasValue 
                && await _permissionResolver.HasGlobalPermissionAsync(_currentUser.UserId.Value, "identity.group.create", cancellationToken);
            if (!hasGlobal)
                return Result<Guid>.Fail("UNAUTHORIZED_GLOBAL_SCOPE", "Chỉ Quản trị viên cấp Toàn hệ thống (Global) mới được tạo nhóm có phạm vi Global.");
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.UserGroups.AnyAsync(x => x.Code == code, cancellationToken);
        if (codeExists)
            return Result<Guid>.Fail("DUPLICATE_GROUP_CODE", $"Mã nhóm '{code}' đã tồn tại trong hệ thống.");

        var group = new UserGroup(code, request.Name, request.Description, request.ScopeType, isSystem: false);
        _context.UserGroups.Add(group);

        await _context.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Ok(group.Id, "Tạo nhóm người dùng thành công.");
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateUserGroupRequest request, CancellationToken cancellationToken = default)
    {
        var group = await _context.UserGroups.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (group is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm người dùng.");

        if (!await HasGlobalOrScopePermissionAsync("identity.group.edit", cancellationToken))
            return Result.Fail("UNAUTHORIZED", "Bạn không có quyền chỉnh sửa nhóm người dùng.");

        if (!Convert.TryFromBase64String(request.RowVersionBase64, new byte[8], out var bytesWritten) || bytesWritten != 8)
            return Result.Fail("INVALID_ROW_VERSION", "RowVersion không hợp lệ. Vui lòng tải lại trang.");

        var requestedVersion = Convert.FromBase64String(request.RowVersionBase64);
        if (!requestedVersion.SequenceEqual(group.RowVersion))
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu nhóm đã bị thay đổi bởi người khác. Vui lòng tải lại.");

        if (group.IsSystem && !request.IsActive)
            return Result.Fail("CANNOT_DEACTIVATE_SYSTEM_GROUP", "Không thể vô hiệu hóa nhóm quản trị hệ thống.");

        group.UpdateDetails(request.Name, request.Description, request.IsActive);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);

            // Invalidate cache của các thành viên trong nhóm
            await InvalidateGroupMembersCacheAsync(id, cancellationToken);

            return Result.Ok("Cập nhật nhóm người dùng thành công.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result.Fail("CONCURRENCY_CONFLICT", "Dữ liệu nhóm đã bị thay đổi bởi người khác. Vui lòng tải lại.");
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var group = await _context.UserGroups
            .Include(x => x.Members)
            .Include(x => x.GroupPermissions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (group is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm người dùng.");

        if (group.IsSystem)
            return Result.Fail("CANNOT_DELETE_SYSTEM_GROUP", "Không thể xóa nhóm thuộc hệ thống.");

        if (!await HasGlobalOrScopePermissionAsync("identity.group.delete", cancellationToken))
            return Result.Fail("UNAUTHORIZED", "Bạn không có quyền xóa nhóm người dùng.");

        if (group.Members.Count > 0)
            return Result.Fail("HAS_MEMBERS", $"Nhóm đang có {group.Members.Count} thành viên. Vui lòng loại bỏ thành viên trước khi xóa nhóm.");

        // Invalidate cache thành viên (nếu có)
        var memberUserIds = group.Members.Select(m => m.UserId).Distinct().ToList();

        _context.UserGroupPermissions.RemoveRange(group.GroupPermissions);
        _context.UserGroups.Remove(group);

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var uid in memberUserIds)
        {
            _cacheInvalidator.InvalidateUser(uid);
        }

        return Result.Ok("Đã xóa nhóm người dùng thành công.");
    }

    public async Task<Result> AssignMemberAsync(Guid userGroupId, AssignUserGroupMemberRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasGlobalOrScopePermissionAsync("identity.group.assign", cancellationToken))
            return Result.Fail("UNAUTHORIZED", "Bạn không có quyền gán thành viên vào nhóm.");

        var group = await _context.UserGroups.FirstOrDefaultAsync(x => x.Id == userGroupId, cancellationToken);
        if (group is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm người dùng.");

        if (!group.IsActive)
            return Result.Fail("GROUP_INACTIVE", "Nhóm người dùng này đang bị tạm khóa.");

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);
        if (user is null || !user.IsActive)
            return Result.Fail("USER_NOT_FOUND", "Người dùng không tồn tại hoặc đã bị khóa.");

        // Kiểm tra tính hợp lệ của Scope theo ScopeType của nhóm
        switch (group.ScopeType)
        {
            case ScopeType.Global:
                if (group.Code == "ADMINISTRATORS" && !_currentUser.IsAdmin)
                {
                    return Result.Fail("UNAUTHORIZED_ADMIN_ASSIGN", "Chỉ Quản trị viên tối cao mới có thể chỉ định thành viên vào nhóm ADMINISTRATORS.");
                }
                break;

            case ScopeType.LegalEntity:
                if (!request.ScopeLegalEntityId.HasValue)
                    return Result.Fail("MISSING_SCOPE_ENTITY", "Nhóm này yêu cầu chỉ định phạm vi Pháp nhân cụ thể.");
                break;

            case ScopeType.BusinessUnit:
                if (!request.ScopeBusinessUnitId.HasValue)
                    return Result.Fail("MISSING_SCOPE_BU", "Nhóm này yêu cầu chỉ định phạm vi Đơn vị kinh doanh cụ thể.");
                break;

            case ScopeType.Branch:
                if (!request.ScopeBranchId.HasValue)
                    return Result.Fail("MISSING_SCOPE_BRANCH", "Nhóm này yêu cầu chỉ định phạm vi Cơ sở/Chi nhánh cụ thể.");
                break;
        }

        // Kiểm tra xem đã gán membership này chưa
        var exists = await _context.UserGroupMembers.AnyAsync(x =>
            x.UserGroupId == userGroupId
            && x.UserId == request.UserId
            && x.ScopeLegalEntityId == request.ScopeLegalEntityId
            && x.ScopeBusinessUnitId == request.ScopeBusinessUnitId
            && x.ScopeBranchId == request.ScopeBranchId,
            cancellationToken);

        if (exists)
            return Result.Fail("ALREADY_ASSIGNED", "Người dùng đã được gán vào nhóm với phạm vi dữ liệu này rồi.");

        var membership = new UserGroupMember(
            request.UserId,
            userGroupId,
            request.ScopeLegalEntityId,
            request.ScopeBusinessUnitId,
            request.ScopeBranchId);

        _context.UserGroupMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        // Vô hiệu hóa cache tức thời cho người dùng này
        _cacheInvalidator.InvalidateUser(request.UserId);

        return Result.Ok("Đã thêm thành viên và thiết lập phạm vi quyền thành công.");
    }

    public async Task<Result> RemoveMemberAsync(Guid userGroupId, Guid membershipId, CancellationToken cancellationToken = default)
    {
        if (!await HasGlobalOrScopePermissionAsync("identity.group.assign", cancellationToken))
            return Result.Fail("UNAUTHORIZED", "Bạn không có quyền quản lý thành viên nhóm.");

        var membership = await _context.UserGroupMembers
            .Include(x => x.UserGroup)
            .FirstOrDefaultAsync(x => x.Id == membershipId && x.UserGroupId == userGroupId, cancellationToken);

        if (membership is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy bản ghi thành viên.");

        // Bảo vệ chống lockout: Không cho phép xóa admin cuối cùng trong nhóm ADMINISTRATORS
        if (membership.UserGroup?.Code == "ADMINISTRATORS")
        {
            var adminCount = await _context.UserGroupMembers
                .CountAsync(x => x.UserGroupId == userGroupId, cancellationToken);
            if (adminCount <= 1)
                return Result.Fail("CANNOT_REMOVE_LAST_ADMIN", "Không thể loại bỏ Quản trị viên cuối cùng trong hệ thống.");
        }

        var targetUserId = membership.UserId;
        _context.UserGroupMembers.Remove(membership);
        await _context.SaveChangesAsync(cancellationToken);

        // Vô hiệu hóa cache tức thời
        _cacheInvalidator.InvalidateUser(targetUserId);

        return Result.Ok("Đã loại bỏ thành viên khỏi nhóm.");
    }

    public async Task<Result> UpdatePermissionsAsync(Guid userGroupId, UpdateGroupPermissionsRequest request, CancellationToken cancellationToken = default)
    {
        if (!await HasGlobalOrScopePermissionAsync("identity.permission.assign", cancellationToken))
            return Result.Fail("UNAUTHORIZED", "Bạn không có quyền phân bổ quyền cho nhóm.");

        var group = await _context.UserGroups
            .Include(x => x.GroupPermissions)
            .FirstOrDefaultAsync(x => x.Id == userGroupId, cancellationToken);

        if (group is null)
            return Result.Fail("NOT_FOUND", "Không tìm thấy nhóm người dùng.");

        if (group.IsSystem && group.Code == "ADMINISTRATORS")
            return Result.Fail("CANNOT_MODIFY_ADMIN_PERMISSIONS", "Nhóm ADMINISTRATORS tự động sở hữu toàn bộ quyền hệ thống, không cần cấu hình thủ công.");

        // Xác thực các PermissionId có hợp lệ không
        var validPermissionIds = await _context.Permissions
            .Where(p => request.PermissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        // Xóa quyền cũ
        _context.UserGroupPermissions.RemoveRange(group.GroupPermissions);

        // Thêm quyền mới
        foreach (var permId in validPermissionIds)
        {
            _context.UserGroupPermissions.Add(new UserGroupPermission(userGroupId, permId));
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate cache của tất cả thành viên trong nhóm
        await InvalidateGroupMembersCacheAsync(userGroupId, cancellationToken);

        return Result.Ok($"Đã cập nhật thành công {validPermissionIds.Count} quyền cho nhóm.");
    }

    private async Task InvalidateGroupMembersCacheAsync(Guid userGroupId, CancellationToken cancellationToken)
    {
        var memberUserIds = await _context.UserGroupMembers
            .Where(m => m.UserGroupId == userGroupId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var uid in memberUserIds)
        {
            _cacheInvalidator.InvalidateUser(uid);
        }
    }

    private async Task<bool> HasGlobalOrScopePermissionAsync(string permissionCode, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue) return false;
        if (_currentUser.IsAdmin) return true;

        return await _permissionResolver.HasPermissionAsync(_currentUser.UserId.Value, permissionCode, cancellationToken: cancellationToken);
    }
}
