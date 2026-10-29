namespace ShdOneErp.Application.Modules.SystemRegistry.DTOs;

public class FeatureActionPermissionDto
{
    public Guid Id { get; set; }
    public Guid FeatureId { get; set; }
    public string ActionCode { get; set; } = string.Empty;
    public string ActionName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public Guid? PermissionId { get; set; }
    public string? PermissionName { get; set; }
    public string? PermissionModule { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
}

public class ActionPermissionMappingViewDto
{
    public Guid MappingId { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public Guid FeatureId { get; set; }
    public string FeatureCode { get; set; } = string.Empty;
    public string FeatureName { get; set; } = string.Empty;
    public string FeatureType { get; set; } = "Screen";
    public string ActionCode { get; set; } = string.Empty;
    public string ActionName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public Guid? PermissionId { get; set; }
    public string? PermissionName { get; set; }
    public string? PermissionDescription { get; set; }
    public bool IsDefault { get; set; }
    public string FeatureStatus { get; set; } = "Active";
    public string ModuleStatus { get; set; } = "Active";
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateFeatureActionRequest
{
    public string ActionCode { get; set; } = string.Empty;
    public string ActionName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; } = true;
}

public class UpdateFeatureActionRequest
{
    public string ActionName { get; set; } = string.Empty;
    public string PermissionCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; } = true;
}

public class PermissionMappingFilterQuery
{
    public Guid? ModuleId { get; set; }
    public string? SearchTerm { get; set; }
}
