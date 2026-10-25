using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Common.Models;
using ShdOneErp.Application.Modules.Identity.DTOs;
using ShdOneErp.Domain.Common;
using ShdOneErp.Domain.Entities.Identity;

namespace ShdOneErp.Application.Modules.Identity.Services;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<Result<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> GetCurrentUserProfileAsync(CancellationToken cancellationToken = default);
}
