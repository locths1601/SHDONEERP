using ShdOneErp.Domain.Common;

namespace ShdOneErp.Domain.Entities.System;

public class SystemModule
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string Version { get; private set; } = "1.0.0";
    public int OrderIndex { get; private set; } = 0;
    public string Icon { get; private set; } = "Layers";
    public string Status { get; private set; } = "Active"; // Active, Inactive, Beta, Deprecated
    public bool IsActive { get; private set; } = true;
    public Guid? ParentModuleId { get; private set; }
    public SystemModule? ParentModule { get; private set; }
    public DateTime? EffectiveFromUtc { get; private set; }
    public DateTime? EffectiveToUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }

    public ICollection<SystemModule> ChildModules { get; private set; } = new List<SystemModule>();
    public ICollection<SystemFeature> Features { get; private set; } = new List<SystemFeature>();
    public ICollection<SystemModuleDependency> Dependencies { get; private set; } = new List<SystemModuleDependency>();

    private SystemModule() { }

    public SystemModule(
        string code,
        string name,
        string? description,
        string version,
        int orderIndex = 0,
        string icon = "Layers",
        string status = "Active",
        Guid? parentModuleId = null,
        DateTime? effectiveFromUtc = null,
        DateTime? effectiveToUtc = null)
    {
        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        Version = string.IsNullOrWhiteSpace(version) ? "1.0.0" : version.Trim();
        OrderIndex = orderIndex;
        Icon = string.IsNullOrWhiteSpace(icon) ? "Layers" : icon.Trim();
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        ParentModuleId = parentModuleId;
        EffectiveFromUtc = effectiveFromUtc;
        EffectiveToUtc = effectiveToUtc;
        IsActive = status != "Inactive";
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(
        string name,
        string? description,
        string version,
        int orderIndex,
        string icon,
        string status,
        Guid? parentModuleId = null,
        DateTime? effectiveFromUtc = null,
        DateTime? effectiveToUtc = null)
    {
        Name = name.Trim();
        Description = description?.Trim();
        Version = string.IsNullOrWhiteSpace(version) ? "1.0.0" : version.Trim();
        OrderIndex = orderIndex;
        Icon = string.IsNullOrWhiteSpace(icon) ? "Layers" : icon.Trim();
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        ParentModuleId = parentModuleId;
        EffectiveFromUtc = effectiveFromUtc;
        EffectiveToUtc = effectiveToUtc;
        IsActive = Status != "Inactive";
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetStatus(string status)
    {
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        IsActive = Status != "Inactive";
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetIsActive(bool isActive)
    {
        IsActive = isActive;
        if (!isActive && Status == "Active")
        {
            Status = "Inactive";
        }
        else if (isActive && Status == "Inactive")
        {
            Status = "Active";
        }
        UpdatedAtUtc = DateTime.UtcNow;
    }
}

public class SystemModuleDependency
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ModuleId { get; private set; }
    public SystemModule? Module { get; private set; }
    public Guid DependsOnModuleId { get; private set; }
    public SystemModule? DependsOnModule { get; private set; }
    public string DependencyType { get; private set; } = "Required"; // Required, Optional, Extension
    public string? MinVersion { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private SystemModuleDependency() { }

    public SystemModuleDependency(
        Guid moduleId,
        Guid dependsOnModuleId,
        string dependencyType = "Required",
        string? minVersion = null)
    {
        ModuleId = moduleId;
        DependsOnModuleId = dependsOnModuleId;
        DependencyType = string.IsNullOrWhiteSpace(dependencyType) ? "Required" : dependencyType.Trim();
        MinVersion = minVersion?.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}

public class SystemFeature
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ModuleId { get; private set; }
    public SystemModule? Module { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string FeatureType { get; private set; } = "Screen"; // Screen, Api, BusinessProcess, Report, Component, Service
    public Guid? ParentFeatureId { get; private set; }
    public SystemFeature? ParentFeature { get; private set; }
    public string? RoutePath { get; private set; }
    public string? ApiEndpoint { get; private set; }
    public string? ComponentKey { get; private set; }
    public string? Icon { get; private set; }
    public int OrderIndex { get; private set; } = 0;
    public string? SupportedActions { get; private set; } = "[\"view\"]";
    public string Status { get; private set; } = "Active"; // Active, Beta, Disabled, Deprecated
    public string OwnerTeam { get; private set; } = "Platform Team";
    public string DataClassification { get; private set; } = "Internal"; // Public, Internal, Confidential, Restricted
    public bool IsEnabledGlobal { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; private set; }

    public ICollection<SystemFeature> ChildFeatures { get; private set; } = new List<SystemFeature>();
    public ICollection<SystemFeatureActionPermission> ActionPermissions { get; private set; } = new List<SystemFeatureActionPermission>();

    private SystemFeature() { }

    public SystemFeature(
        Guid moduleId,
        string code,
        string name,
        string? description = null,
        bool isEnabledGlobal = true,
        string featureType = "Screen",
        Guid? parentFeatureId = null,
        string? routePath = null,
        string? apiEndpoint = null,
        string? componentKey = null,
        string? icon = null,
        int orderIndex = 0,
        string? supportedActions = "[\"view\"]",
        string status = "Active",
        string ownerTeam = "Platform Team",
        string dataClassification = "Internal")
    {
        ModuleId = moduleId;
        Code = code.Trim().ToLowerInvariant();
        Name = name.Trim();
        Description = description?.Trim();
        IsEnabledGlobal = isEnabledGlobal;
        FeatureType = string.IsNullOrWhiteSpace(featureType) ? "Screen" : featureType.Trim();
        ParentFeatureId = parentFeatureId;
        RoutePath = routePath?.Trim();
        ApiEndpoint = apiEndpoint?.Trim();
        ComponentKey = componentKey?.Trim();
        Icon = icon?.Trim();
        OrderIndex = orderIndex;
        SupportedActions = string.IsNullOrWhiteSpace(supportedActions) ? "[\"view\"]" : supportedActions.Trim();
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        OwnerTeam = string.IsNullOrWhiteSpace(ownerTeam) ? "Platform Team" : ownerTeam.Trim();
        DataClassification = string.IsNullOrWhiteSpace(dataClassification) ? "Internal" : dataClassification.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(
        string name,
        string? description,
        string featureType,
        string? routePath,
        string? apiEndpoint,
        string? componentKey,
        string? icon,
        int orderIndex,
        string? supportedActions,
        string status,
        string ownerTeam,
        string dataClassification,
        bool isEnabledGlobal,
        Guid? parentFeatureId = null)
    {
        Name = name.Trim();
        Description = description?.Trim();
        FeatureType = string.IsNullOrWhiteSpace(featureType) ? "Screen" : featureType.Trim();
        RoutePath = routePath?.Trim();
        ApiEndpoint = apiEndpoint?.Trim();
        ComponentKey = componentKey?.Trim();
        Icon = icon?.Trim();
        OrderIndex = orderIndex;
        SupportedActions = string.IsNullOrWhiteSpace(supportedActions) ? "[\"view\"]" : supportedActions.Trim();
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        OwnerTeam = string.IsNullOrWhiteSpace(ownerTeam) ? "Platform Team" : ownerTeam.Trim();
        DataClassification = string.IsNullOrWhiteSpace(dataClassification) ? "Internal" : dataClassification.Trim();
        IsEnabledGlobal = isEnabledGlobal;
        ParentFeatureId = parentFeatureId;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetStatus(string status)
    {
        Status = string.IsNullOrWhiteSpace(status) ? "Active" : status.Trim();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetIsEnabledGlobal(bool isEnabledGlobal)
    {
        IsEnabledGlobal = isEnabledGlobal;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}

public class SystemFeatureActionPermission
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid FeatureId { get; private set; }
    public SystemFeature? Feature { get; private set; }
    public string ActionCode { get; private set; } = string.Empty; // view, create, edit, delete, export, assign, approve
    public string ActionName { get; private set; } = string.Empty;
    public string PermissionCode { get; private set; } = string.Empty;
    public Guid? PermissionId { get; private set; }
    public string? Description { get; private set; }
    public bool IsDefault { get; private set; } = true;
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private SystemFeatureActionPermission() { }

    public SystemFeatureActionPermission(
        Guid featureId,
        string actionCode,
        string actionName,
        string permissionCode,
        Guid? permissionId = null,
        string? description = null,
        bool isDefault = true)
    {
        FeatureId = featureId;
        ActionCode = actionCode.Trim().ToLowerInvariant();
        ActionName = actionName.Trim();
        PermissionCode = permissionCode.Trim().ToLowerInvariant();
        PermissionId = permissionId;
        Description = description?.Trim();
        IsDefault = isDefault;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(
        string actionName,
        string permissionCode,
        Guid? permissionId = null,
        string? description = null,
        bool isDefault = true)
    {
        ActionName = actionName.Trim();
        PermissionCode = permissionCode.Trim().ToLowerInvariant();
        PermissionId = permissionId;
        Description = description?.Trim();
        IsDefault = isDefault;
    }
}
