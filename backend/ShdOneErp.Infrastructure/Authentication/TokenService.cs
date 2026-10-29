using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShdOneErp.Application.Common.Interfaces;

namespace ShdOneErp.Infrastructure.Authentication;

public class TokenService : ITokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationMinutes;

    public TokenService(IConfiguration configuration)
    {
        _secretKey = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Cấu hình Jwt:Secret là bắt buộc.");
        if (Encoding.UTF8.GetByteCount(_secretKey) < 32)
            throw new InvalidOperationException("Jwt:Secret phải có tối thiểu 32 byte.");

        _issuer = configuration["Jwt:Issuer"] ?? "ShdOneErpApi";
        _audience = configuration["Jwt:Audience"] ?? "ShdOneErpClient";
        _expirationMinutes = int.TryParse(configuration["Jwt:ExpirationMinutes"], out var mins) ? mins : 60;
    }

    public string GenerateAccessToken(Guid userId, string username, string email, IEnumerable<string> permissions, bool isAdmin)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, username),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("isAdmin", isAdmin.ToString().ToLowerInvariant())
        };

        foreach (var perm in permissions)
        {
            claims.Add(new Claim("permission", perm));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
