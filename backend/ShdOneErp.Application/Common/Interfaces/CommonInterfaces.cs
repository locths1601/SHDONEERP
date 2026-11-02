using System.Data;
using ShdOneErp.Application.Common.Models;

namespace ShdOneErp.Application.Common.Interfaces;

public interface ISpExecutor
{
    Task<PagedResult<T>> ExecuteStoredProcedurePagedAsync<T>(
        string procedureName,
        object? parameters = null,
        string totalCountParamName = "TotalCount",
        CancellationToken cancellationToken = default);

    Task<T?> ExecuteStoredProcedureSingleAsync<T>(
        string procedureName,
        object? parameters = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<T>> ExecuteStoredProcedureListAsync<T>(
        string procedureName,
        object? parameters = null,
        CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    IReadOnlyList<string> Permissions { get; }
    IReadOnlyList<Guid> AllowedLegalEntityIds { get; }
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string username, string email, IEnumerable<string> permissions, bool isAdmin);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public interface IPermissionResolver
{
    Task<IReadOnlyList<EffectivePermissionDto>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> HasGlobalPermissionAsync(Guid userId, string permissionCode, CancellationToken cancellationToken = default);
    Task<bool> HasPermissionAsync(
        Guid userId,
        string permissionCode,
        Guid? legalEntityId = null,
        Guid? businessUnitId = null,
        Guid? branchId = null,
        CancellationToken cancellationToken = default);
}

public class EffectivePermissionDto
{
    public string PermissionCode { get; set; } = string.Empty;
    public string ScopeType { get; set; } = "Global";
    public Guid? ScopeLegalEntityId { get; set; }
    public Guid? ScopeBusinessUnitId { get; set; }
    public Guid? ScopeBranchId { get; set; }
}

public interface IPermissionCacheInvalidator
{
    void InvalidateUser(Guid userId);
    void InvalidateAll();
}
