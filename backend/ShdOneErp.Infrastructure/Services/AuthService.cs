using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Services;
using ShdOneErp.Domain.Entities.Identity;
using ShdOneErp.Domain.Enums;

namespace ShdOneErp.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IShdOneErpDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IPermissionResolver _permissionResolver;
    private readonly ICurrentUser _currentUser;
    private readonly IConfiguration _configuration;

    public AuthService(
        IShdOneErpDbContext context,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IPermissionResolver permissionResolver,
        ICurrentUser currentUser,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _permissionResolver = permissionResolver;
        _currentUser = currentUser;
        _configuration = configuration;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var identifier = request.UsernameOrEmail.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.GroupMemberships)
                .ThenInclude(m => m.UserGroup)
            .FirstOrDefaultAsync(u => u.Username == identifier || u.Email == identifier, cancellationToken);

        if (user == null)
        {
            return Result<LoginResponse>.Fail("INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            return Result<LoginResponse>.Fail("USER_INACTIVE", "Tài khoản người dùng đã bị khóa hoặc tạm ngưng.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Result<LoginResponse>.Fail("INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không chính xác.");
        }

        // Kiểm tra quyền Admin
        var isAdmin = user.GroupMemberships.Any(m => m.UserGroup != null && m.UserGroup.Code == "ADMINISTRATORS" && m.UserGroup.IsActive);

        // Lấy danh sách quyền hiệu lực
        var effectiveGrants = await _permissionResolver.GetUserPermissionsAsync(user.Id, cancellationToken);
        var permissionCodes = effectiveGrants.Select(g => g.PermissionCode).Distinct().ToList();

        // Tạo JWT Token
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Username, user.Email, permissionCodes, isAdmin);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var refreshTokenHash = _tokenService.HashToken(rawRefreshToken);

        var refreshTokenEntity = new RefreshToken(
            user.Id,
            refreshTokenHash,
            DateTime.UtcNow.AddDays(7));

        _context.RefreshTokens.Add(refreshTokenEntity);
        user.RecordLogin();

        await _context.SaveChangesAsync(cancellationToken);

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresInSeconds = 3600,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                MustChangePassword = user.MustChangePassword,
                IsAdmin = isAdmin,
                Permissions = permissionCodes
            }
        };

        return Result<LoginResponse>.Ok(response, "Đăng nhập thành công.");
    }

    public async Task<Result<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashToken(request.RefreshToken);

        var existingToken = await _context.RefreshTokens
            .Include(t => t.User)
                .ThenInclude(u => u!.GroupMemberships)
                    .ThenInclude(m => m.UserGroup)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (existingToken == null || !existingToken.IsActive || existingToken.User == null || !existingToken.User.IsActive)
        {
            return Result<LoginResponse>.Fail("INVALID_REFRESH_TOKEN", "Phiên làm việc không hợp lệ hoặc đã hết hạn.");
        }

        var user = existingToken.User;
        var isAdmin = user.GroupMemberships.Any(m => m.UserGroup != null && m.UserGroup.Code == "ADMINISTRATORS" && m.UserGroup.IsActive);

        var effectiveGrants = await _permissionResolver.GetUserPermissionsAsync(user.Id, cancellationToken);
        var permissionCodes = effectiveGrants.Select(g => g.PermissionCode).Distinct().ToList();

        var newAccessToken = _tokenService.GenerateAccessToken(user.Id, user.Username, user.Email, permissionCodes, isAdmin);
        var newRawRefreshToken = _tokenService.GenerateRefreshToken();
        var newRefreshTokenHash = _tokenService.HashToken(newRawRefreshToken);

        existingToken.Revoke(newRefreshTokenHash);

        var newRefreshTokenEntity = new RefreshToken(
            user.Id,
            newRefreshTokenHash,
            DateTime.UtcNow.AddDays(7));

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRawRefreshToken,
            ExpiresInSeconds = 3600,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                MustChangePassword = user.MustChangePassword,
                IsAdmin = isAdmin,
                Permissions = permissionCodes
            }
        };

        return Result<LoginResponse>.Ok(response, "Làm mới phiên làm việc thành công.");
    }

    public async Task<Result> RevokeTokenAsync(RevokeTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Result.Ok("Không có token cần thu hồi.");
        }

        var tokenHash = _tokenService.HashToken(request.RefreshToken);
        var existingToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (existingToken != null && existingToken.IsActive)
        {
            existingToken.Revoke();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result.Ok("Đã thu hồi phiên làm việc và đăng xuất an toàn.");
    }

    public async Task<Result<UserDto>> BootstrapAdminAsync(BootstrapAdminRequest request, CancellationToken cancellationToken = default)
    {
        var configuredSecret = _configuration["Bootstrap:Secret"] 
            ?? Environment.GetEnvironmentVariable("BOOTSTRAP_SECRET");

        var adminGroup = await _context.UserGroups
            .FirstOrDefaultAsync(g => g.Code == "ADMINISTRATORS" && g.IsActive, cancellationToken);

        var hasAdmin = adminGroup != null && await _context.UserGroupMembers
            .AnyAsync(m => m.UserGroupId == adminGroup.Id, cancellationToken);

        if (hasAdmin)
        {
            var isSecretValid = !string.IsNullOrWhiteSpace(configuredSecret) 
                && string.Equals(request.BootstrapSecret, configuredSecret, StringComparison.Ordinal);

            if (!isSecretValid)
            {
                return Result<UserDto>.Fail(
                    "BOOTSTRAP_FORBIDDEN",
                    "Hệ thống đã có quản trị viên. Khởi tạo lại yêu cầu cấu hình Bootstrap Secret hợp lệ.");
            }
        }

        var normalizedUsername = request.AdminUsername.Trim().ToLowerInvariant();
        var normalizedEmail = request.AdminEmail.Trim().ToLowerInvariant();

        var userExists = await _context.Users
            .AnyAsync(u => u.Username == normalizedUsername || u.Email == normalizedEmail, cancellationToken);

        if (userExists)
        {
            return Result<UserDto>.Fail(
                "DUPLICATE_USER",
                $"Tài khoản với tên đăng nhập '{normalizedUsername}' hoặc email '{normalizedEmail}' đã tồn tại.");
        }

        if (adminGroup == null)
        {
            adminGroup = new UserGroup("ADMINISTRATORS", "Quản trị viên toàn hệ thống", "Nhóm quản trị tối cao", ScopeType.Global, isSystem: true);
            _context.UserGroups.Add(adminGroup);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var adminUser = new User(
            normalizedUsername,
            normalizedEmail,
            passwordHash,
            request.FullName,
            mustChangePassword: true);

        _context.Users.Add(adminUser);

        var membership = new UserGroupMember(adminUser.Id, adminGroup.Id);
        _context.UserGroupMembers.Add(membership);

        await _context.SaveChangesAsync(cancellationToken);

        var dto = new UserDto
        {
            Id = adminUser.Id,
            Username = adminUser.Username,
            Email = adminUser.Email,
            FullName = adminUser.FullName,
            MustChangePassword = adminUser.MustChangePassword,
            IsAdmin = true,
            Permissions = new List<string> { "*" }
        };

        return Result<UserDto>.Ok(dto, "Khởi tạo tài khoản quản trị hệ thống thành công (Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên).");
    }

    public async Task<Result<UserDto>> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
        {
            return Result<UserDto>.Fail("UNAUTHORIZED", "Người dùng chưa đăng nhập.");
        }

        var userId = _currentUser.UserId.Value;
        var user = await _context.Users
            .Include(u => u.GroupMemberships)
                .ThenInclude(m => m.UserGroup)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return Result<UserDto>.Fail("USER_NOT_FOUND", "Không tìm thấy thông tin người dùng.");
        }

        var isAdmin = user.GroupMemberships.Any(m => m.UserGroup != null && m.UserGroup.Code == "ADMINISTRATORS" && m.UserGroup.IsActive);
        var effectiveGrants = await _permissionResolver.GetUserPermissionsAsync(userId, cancellationToken);

        var dto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            MustChangePassword = user.MustChangePassword,
            IsAdmin = isAdmin,
            Permissions = effectiveGrants.Select(g => g.PermissionCode).Distinct().ToList()
        };

        return Result<UserDto>.Ok(dto);
    }
}
