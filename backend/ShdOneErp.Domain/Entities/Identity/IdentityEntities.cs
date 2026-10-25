using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Domain.Entities.Identity;

public class User : BaseEntity
{
    public string Username { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool MustChangePassword { get; private set; } = false;
    public DateTime? LastLoginAtUtc { get; private set; }

    // Navigation collections
    public ICollection<UserGroupMember> GroupMemberships { get; private set; } = new List<UserGroupMember>();
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    private User() { } // For EF Core

    public User(string username, string email, string passwordHash, string fullName, string? phoneNumber = null, bool mustChangePassword = false)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new BusinessRuleViolationException("INVALID_USERNAME", "Tên đăng nhập không được để trống.");
        if (string.IsNullOrWhiteSpace(email))
            throw new BusinessRuleViolationException("INVALID_EMAIL", "Email không được để trống.");

        Username = username.Trim().ToLowerInvariant();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        FullName = fullName.Trim();
        PhoneNumber = phoneNumber?.Trim();
        MustChangePassword = mustChangePassword;
    }

    public void UpdateProfile(string fullName, string? phoneNumber)
    {
        FullName = fullName.Trim();
        PhoneNumber = phoneNumber?.Trim();
        MarkUpdated();
    }

    public void SetPassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        MustChangePassword = false;
        MarkUpdated();
    }

    public void RecordLogin()
    {
        LastLoginAtUtc = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        MarkUpdated();
    }
}

public class UserGroup : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ScopeType ScopeType { get; private set; } = ScopeType.Global;
    public bool IsSystem { get; private set; } = false;
    public bool IsActive { get; private set; } = true;

    public ICollection<UserGroupPermission> GroupPermissions { get; private set; } = new List<UserGroupPermission>();
    public ICollection<UserGroupMember> Members { get; private set; } = new List<UserGroupMember>();

    private UserGroup() { }

    public UserGroup(string code, string name, string? description, ScopeType scopeType, bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new BusinessRuleViolationException("INVALID_GROUP_CODE", "Mã nhóm không được để trống.");
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException("INVALID_GROUP_NAME", "Tên nhóm không được để trống.");

        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        ScopeType = scopeType;
        IsSystem = isSystem;
    }

    public void UpdateDetails(string name, string? description, bool isActive)
    {
        if (IsSystem && !isActive)
            throw new BusinessRuleViolationException("CANNOT_DEACTIVATE_SYSTEM_GROUP", "Không thể vô hiệu hóa nhóm người dùng thuộc hệ thống.");

        Name = name.Trim();
        Description = description?.Trim();
        IsActive = isActive;
        MarkUpdated();
    }
}

public class Permission
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Module { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public ICollection<UserGroupPermission> GroupPermissions { get; private set; } = new List<UserGroupPermission>();

    private Permission() { }

    public Permission(string code, string name, string module, string? description = null)
    {
        Code = code.Trim().ToLowerInvariant();
        Name = name.Trim();
        Module = module.Trim();
        Description = description?.Trim();
    }
}

public class UserGroupPermission
{
    public Guid UserGroupId { get; private set; }
    public UserGroup? UserGroup { get; private set; }

    public Guid PermissionId { get; private set; }
    public Permission? Permission { get; private set; }

    public DateTime GrantedAtUtc { get; private set; } = DateTime.UtcNow;

    private UserGroupPermission() { }

    public UserGroupPermission(Guid userGroupId, Guid permissionId)
    {
        UserGroupId = userGroupId;
        PermissionId = permissionId;
    }
}

public class UserGroupMember
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public User? User { get; private set; }

    public Guid UserGroupId { get; private set; }
    public UserGroup? UserGroup { get; private set; }

    public Guid? ScopeLegalEntityId { get; private set; }
    public Guid? ScopeBusinessUnitId { get; private set; }
    public Guid? ScopeBranchId { get; private set; }

    public DateTime AssignedAtUtc { get; private set; } = DateTime.UtcNow;

    private UserGroupMember() { }

    public UserGroupMember(Guid userId, Guid userGroupId, Guid? scopeLegalEntityId = null, Guid? scopeBusinessUnitId = null, Guid? scopeBranchId = null)
    {
        UserId = userId;
        UserGroupId = userGroupId;
        ScopeLegalEntityId = scopeLegalEntityId;
        ScopeBusinessUnitId = scopeBusinessUnitId;
        ScopeBranchId = scopeBranchId;
    }
}

public class RefreshToken
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public User? User { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? RevokedAtUtc { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }

    public bool IsActive => RevokedAtUtc == null && DateTime.UtcNow < ExpiresAtUtc;

    private RefreshToken() { }

    public RefreshToken(Guid userId, string tokenHash, DateTime expiresAtUtc)
    {
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public void Revoke(string? replacedByTokenHash = null)
    {
        RevokedAtUtc = DateTime.UtcNow;
        ReplacedByTokenHash = replacedByTokenHash;
    }
}
