using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShdOneErp.Application.Common.Interfaces;
using ShdOneErp.Application.Modules.Audit.Interfaces;
using ShdOneErp.Application.Modules.Identity.Interfaces;
using ShdOneErp.Application.Modules.Identity.Services;
using ShdOneErp.Application.Modules.Organization.Interfaces;
using ShdOneErp.Application.Modules.Organization.Services;
using ShdOneErp.Application.Modules.Party360.Interfaces;
using ShdOneErp.Application.Modules.Party360.Services;
using ShdOneErp.Application.Modules.SystemReferenceData.Interfaces;
using ShdOneErp.Application.Modules.SystemReferenceData.Services;
using ShdOneErp.Infrastructure.Authentication;
using ShdOneErp.Infrastructure.Extensions;
using ShdOneErp.Infrastructure.Persistence;
using ShdOneErp.Infrastructure.Persistence.Interceptors;
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

        // 1. Caching & Interceptors
        services.AddMemoryCache();
        services.AddScoped<AuditSaveChangesInterceptor>();

        // 2. Entity Framework Core DbContext (Write-side with Auto Audit & Outbox Interceptor)
        services.AddDbContext<ShdOneErpDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(ShdOneErpDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            });
            options.AddInterceptors(sp.GetRequiredService<AuditSaveChangesInterceptor>());
        });

        services.AddScoped<IShdOneErpDbContext>(provider => provider.GetRequiredService<ShdOneErpDbContext>());

        // 3. Stored Procedure Executor (Read-side)
        services.AddScoped<ISpExecutor, SpExecutor>();

        // 4. Security & Direct GBAC Authorization Services
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddScoped<PermissionResolver>();
        services.AddScoped<IPermissionResolver>(sp => sp.GetRequiredService<PermissionResolver>());
        services.AddScoped<IPermissionCacheInvalidator>(sp => sp.GetRequiredService<PermissionResolver>());
        services.AddScoped<IScopeResolver, ScopeResolver>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserGroupWriteService, UserGroupWriteService>();
        services.AddScoped<IUserGroupReadService, UserGroupReadService>();

        // 5. Organization Module Services
        services.AddScoped<ILegalEntityWriteService, LegalEntityWriteService>();
        services.AddScoped<ILegalEntityReadService, LegalEntityReadService>();
        services.AddScoped<IBusinessUnitWriteService, BusinessUnitWriteService>();
        services.AddScoped<IBusinessUnitReadService, BusinessUnitReadService>();
        services.AddScoped<IBranchWriteService, BranchWriteService>();
        services.AddScoped<IBranchReadService, BranchReadService>();

        // 6. Party 360 Module Services
        services.AddScoped<IPartyWriteService, PartyWriteService>();
        services.AddScoped<IPartyReadService, PartyReadService>();

        // 7. Admission & Visa Module Services
        services.AddScoped<ShdOneErp.Application.Modules.AdmissionVisa.Interfaces.IStudentApplicationWriteService, ShdOneErp.Application.Modules.AdmissionVisa.Services.StudentApplicationWriteService>();
        services.AddScoped<ShdOneErp.Application.Modules.AdmissionVisa.Interfaces.IStudentApplicationReadService, ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices.StudentApplicationReadService>();
        services.AddScoped<ShdOneErp.Application.Modules.AdmissionVisa.Interfaces.IChecklistWriteService, ShdOneErp.Application.Modules.AdmissionVisa.Services.ChecklistWriteService>();
        services.AddScoped<ShdOneErp.Application.Modules.AdmissionVisa.Interfaces.IChecklistReadService, ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices.ChecklistReadService>();

        // 8. Document Storage Service
        services.AddScoped<IDocumentStorageService, ShdOneErp.Infrastructure.Services.DocumentStorage.LocalFileSystemDocumentStorageService>();

        // 9. Audit Log Platform Service
        services.AddScoped<IAuditLogReadService, AuditLogReadService>();

        // 10. Module & Feature Registry Platform
        services.AddModuleRegistryModule();

        // 11. Workflow Engine & Transactional Outbox Foundation
        services.AddWorkflowEngineServices();
        services.AddTransactionalOutboxPlatform();

        // 12. System Reference Data Module Services (SYS-REF-01 & SYS-REF-02)
        services.AddScoped<IMasterDataCatalogWriteService, MasterDataCatalogWriteService>();
        services.AddScoped<IMasterDataCatalogReadService, MasterDataCatalogReadService>();
        services.AddScoped<IMasterDataItemWriteService, MasterDataItemWriteService>();
        services.AddScoped<IMasterDataItemReadService, MasterDataItemReadService>();
        services.AddScoped<IMasterDataService, MasterDataService>();

        return services;
    }
}
