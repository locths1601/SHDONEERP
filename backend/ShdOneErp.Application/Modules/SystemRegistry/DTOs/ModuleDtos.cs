namespace ShdOneErp.Application.Modules.SystemRegistry.DTOs;

public class ModuleDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = "1.0.0";
    public int OrderIndex { get; set; }
    public string Icon { get; set; } = "Layers";
    public string Status { get; set; } = "Active";
    public bool IsActive { get; set; }
    public Guid? ParentModuleId { get; set; }
    public string? ParentModuleName { get; set; }
    public string? ParentModuleCode { get; set; }
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public int FeatureCount { get; set; }
    public int DependencyCount { get; set; }
}

public class ModuleDetailDto : ModuleDto
{
    public IReadOnlyList<ModuleDependencyDto> Dependencies { get; set; } = Array.Empty<ModuleDependencyDto>();
    public IReadOnlyList<ModuleHierarchyDto> ChildModules { get; set; } = Array.Empty<ModuleHierarchyDto>();
}

public class ModuleHierarchyDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = "1.0.0";
    public int OrderIndex { get; set; }
    public string Icon { get; set; } = "Layers";
    public string Status { get; set; } = "Active";
    public bool IsActive { get; set; }
    public Guid? ParentModuleId { get; set; }
    public int FeatureCount { get; set; }
    public List<ModuleHierarchyDto> Children { get; set; } = new();
}

public class ModuleDependencyDto
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public Guid DependsOnModuleId { get; set; }
    public string DependsOnModuleCode { get; set; } = string.Empty;
    public string DependsOnModuleName { get; set; } = string.Empty;
    public string DependencyType { get; set; } = "Required";
    public string? MinVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateModuleRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = "1.0.0";
    public int OrderIndex { get; set; } = 0;
    public string Icon { get; set; } = "Layers";
    public string Status { get; set; } = "Active";
    public Guid? ParentModuleId { get; set; }
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
}

public class UpdateModuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Version { get; set; } = "1.0.0";
    public int OrderIndex { get; set; } = 0;
    public string Icon { get; set; } = "Layers";
    public string Status { get; set; } = "Active";
    public Guid? ParentModuleId { get; set; }
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
}

public class AddModuleDependencyRequest
{
    public Guid DependsOnModuleId { get; set; }
    public string DependencyType { get; set; } = "Required"; // Required, Optional, Extension
    public string? MinVersion { get; set; }
}

public class ModuleFilterQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SearchTerm { get; set; }
    public string? Status { get; set; }
    public bool? IsActive { get; set; }
}
