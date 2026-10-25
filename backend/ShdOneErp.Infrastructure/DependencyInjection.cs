using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.Identity.Services;
using ShdOneErp.Application.Modules.Organization.Interfaces;
using ShdOneErp.Application.Modules.Organization.Services;
using ShdOneErp.Infrastructure.Authentication;
using ShdOneErp.Infrastructure.Persistence;
using ShdOneErp.Infrastructure.Persistence.StoredProcedures;
using ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;
using ShdOneErp.Infrastructure.Services;

namespace ShdOneErp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Database=ShdOneErpDb;User Id=sa;Password=YourStrong@Passw0rd!;TrustServerCertificate=True;";

        // 1. Entity Framework Core DbContext (Write-side)
        services.AddDbContext<ShdOneErpDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(ShdOneErpDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            });
        });

        services.AddScoped<IShdOneErpDbContext>(provider => provider.GetRequiredService<ShdOneErpDbContext>());

        // 2. Stored Procedure Executor (Read-side)
        services.AddScoped<ISpExecutor, SpExecutor>();

        // 3. Security & Authentication Services
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddScoped<IPermissionResolver, PermissionResolver>();
        services.AddScoped<IAuthService, AuthService>();

        // 4. Module Services
        services.AddScoped<ILegalEntityWriteService, LegalEntityWriteService>();
        services.AddScoped<ILegalEntityReadService, LegalEntityReadService>();

        return services;
    }
}
