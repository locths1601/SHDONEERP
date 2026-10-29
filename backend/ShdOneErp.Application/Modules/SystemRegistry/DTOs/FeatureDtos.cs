namespace ShdOneErp.Application.Modules.SystemRegistry.DTOs;

public class FeatureDto
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FeatureType { get; set; } = "Screen"; // Screen, Api, BusinessProcess, Report, Component, Service
    public Guid? ParentFeatureId { get; set; }
    public string? ParentFeatureName { get; set; }
    public string? RoutePath { get; set; }
    public string? ApiEndpoint { get; set; }
    public string? ComponentKey { get; set; }
    public string? Icon { get; set; }
    public int OrderIndex { get; set; }
    public string? SupportedActions { get; set; } = "[\"view\"]";
    public string Status { get; set; } = "Active";
    public string OwnerTeam { get; set; } = "Platform Team";
    public string DataClassification { get; set; } = "Internal";
    public bool IsEnabledGlobal { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public int ActionCount { get; set; }
}

public class FeatureDetailDto : FeatureDto
{
    public string? ParentFeatureCode { get; set; }
    public IReadOnlyList<FeatureActionPermissionDto> Actions { get; set; } = Array.Empty<FeatureActionPermissionDto>();
}

public class FeatureHierarchyDto
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FeatureType { get; set; } = "Screen";
    public Guid? ParentFeatureId { get; set; }
    public string? RoutePath { get; set; }
    public string? Icon { get; set; }
    public int OrderIndex { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsEnabledGlobal { get; set; }
    public int ActionCount { get; set; }
    public List<FeatureHierarchyDto> Children { get; set; } = new();
}

public class CreateFeatureRequest
{
    public Guid ModuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FeatureType { get; set; } = "Screen";
    public Guid? ParentFeatureId { get; set; }
    public string? RoutePath { get; set; }
    public string? ApiEndpoint { get; set; }
    public string? ComponentKey { get; set; }
    public string? Icon { get; set; }
    public int OrderIndex { get; set; } = 0;
    public string? SupportedActions { get; set; } = "[\"view\"]";
    public string Status { get; set; } = "Active";
    public string OwnerTeam { get; set; } = "Platform Team";
    public string DataClassification { get; set; } = "Internal";
    public bool IsEnabledGlobal { get; set; } = true;
}

public class UpdateFeatureRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FeatureType { get; set; } = "Screen";
    public Guid? ParentFeatureId { get; set; }
    public string? RoutePath { get; set; }
    public string? ApiEndpoint { get; set; }
    public string? ComponentKey { get; set; }
    public string? Icon { get; set; }
    public int OrderIndex { get; set; } = 0;
    public string? SupportedActions { get; set; } = "[\"view\"]";
    public string Status { get; set; } = "Active";
    public string OwnerTeam { get; set; } = "Platform Team";
    public string DataClassification { get; set; } = "Internal";
    public bool IsEnabledGlobal { get; set; } = true;
}

public class FeatureFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? ModuleId { get; set; }
    public string? FeatureType { get; set; }
    public string? Status { get; set; }
    public string? SearchTerm { get; set; }
}
