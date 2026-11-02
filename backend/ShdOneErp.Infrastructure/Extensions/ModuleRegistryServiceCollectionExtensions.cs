using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using ShdOneErp.Application.Modules.SystemRegistry.DTOs;
using ShdOneErp.Application.Modules.SystemRegistry.Interfaces;
using ShdOneErp.Application.Modules.SystemRegistry.Services;
using ShdOneErp.Application.Modules.SystemRegistry.Validators;
using ShdOneErp.Infrastructure.Persistence.StoredProcedures.ReadServices;

namespace ShdOneErp.Infrastructure.Extensions;

public static class ModuleRegistryServiceCollectionExtensions
{
    public static IServiceCollection AddModuleRegistryModule(this IServiceCollection services)
    {
        // 1. Read-side CQRS services (Stored Procedures via Dapper)
        services.AddScoped<IModuleRegistryReadService, ModuleRegistryReadService>();
        services.AddScoped<IFeatureRegistryReadService, FeatureRegistryReadService>();

        // 2. Write-side CQRS services (EF Core with Direct GBAC Authorization)
        services.AddScoped<IModuleRegistryWriteService, ModuleRegistryWriteService>();
        services.AddScoped<IFeatureRegistryWriteService, FeatureRegistryWriteService>();

        // 3. FluentValidation Validators
        services.AddScoped<IValidator<CreateModuleRequest>, CreateModuleRequestValidator>();
        services.AddScoped<IValidator<UpdateModuleRequest>, UpdateModuleRequestValidator>();
        services.AddScoped<IValidator<AddModuleDependencyRequest>, AddModuleDependencyRequestValidator>();
        services.AddScoped<IValidator<CreateFeatureRequest>, CreateFeatureRequestValidator>();
        services.AddScoped<IValidator<UpdateFeatureRequest>, UpdateFeatureRequestValidator>();
        services.AddScoped<IValidator<CreateFeatureActionRequest>, CreateFeatureActionRequestValidator>();
        services.AddScoped<IValidator<UpdateFeatureActionRequest>, UpdateFeatureActionRequestValidator>();

        return services;
    }
}
