using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Application.Modules.Identity.Services;

namespace ShdOneErp.Api.Controllers;

[Route("api/v1/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng nhập hệ thống và cấp phát JWT token + Refresh token
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Làm mới JWT access token qua Refresh token
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshTokenAsync(request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Đăng xuất và thu hồi phiên làm việc (Revoke Refresh token)
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RevokeTokenAsync(request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Khởi tạo tài khoản quản trị viên đầu tiên của hệ thống (Secure Bootstrap)
    /// </summary>
    [HttpPost("bootstrap")]
    [AllowAnonymous]
    public async Task<IActionResult> Bootstrap([FromBody] BootstrapAdminRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.BootstrapAdminAsync(request, cancellationToken);
        return FromResult(result);
    }

    /// <summary>
    /// Lấy thông tin tài khoản và danh sách quyền hiệu lực hiện hành
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUserProfile(CancellationToken cancellationToken)
    {
        var result = await _authService.GetCurrentUserProfileAsync(cancellationToken);
        return FromResult(result);
    }
}
