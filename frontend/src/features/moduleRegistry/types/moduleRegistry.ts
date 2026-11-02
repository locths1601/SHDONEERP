export type ModuleStatus = 'Active' | 'Inactive' | 'Beta' | 'Deprecated';

export type FeatureType = 'Screen' | 'Api' | 'BusinessProcess' | 'Report' | 'Component' | 'Service';

export type FeatureStatus = 'Active' | 'Beta' | 'Disabled' | 'Deprecated';

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type DependencyType = 'Required' | 'Optional' | 'Extension';

export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  orderIndex: number;
  icon: string;
  status: ModuleStatus;
  isActive: boolean;
  parentModuleId?: string;
  parentModuleName?: string;
  parentModuleCode?: string;
  effectiveFromUtc?: string;
  effectiveToUtc?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  featureCount: number;
  dependencyCount: number;
}

export interface ModuleDependency {
  id: string;
  moduleId: string;
  dependsOnModuleId: string;
  dependsOnModuleCode: string;
  dependsOnModuleName: string;
  dependencyType: DependencyType;
  minVersion?: string;
  createdAtUtc: string;
}

export interface ModuleHierarchy {
  id: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  orderIndex: number;
  icon: string;
  status: ModuleStatus;
  isActive: boolean;
  parentModuleId?: string;
  featureCount: number;
  children: ModuleHierarchy[];
}

export interface ModuleDetail extends Module {
  dependencies: ModuleDependency[];
  childModules: ModuleHierarchy[];
}

export interface CreateModuleRequest {
  code: string;
  name: string;
  description?: string;
  version: string;
  orderIndex?: number;
  icon?: string;
  status?: ModuleStatus;
  parentModuleId?: string | null;
  effectiveFromUtc?: string | null;
  effectiveToUtc?: string | null;
}

export interface UpdateModuleRequest {
  name: string;
  description?: string;
  version: string;
  orderIndex?: number;
  icon?: string;
  status?: ModuleStatus;
  parentModuleId?: string | null;
  effectiveFromUtc?: string | null;
  effectiveToUtc?: string | null;
}

export interface AddModuleDependencyRequest {
  dependsOnModuleId: string;
  dependencyType: DependencyType;
  minVersion?: string;
}

export interface ModuleFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  isActive?: boolean;
}

export interface Feature {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  code: string;
  name: string;
  description?: string;
  featureType: FeatureType;
  parentFeatureId?: string;
  parentFeatureName?: string;
  routePath?: string;
  apiEndpoint?: string;
  componentKey?: string;
  icon?: string;
  orderIndex: number;
  supportedActions?: string;
  status: FeatureStatus;
  ownerTeam: string;
  dataClassification: DataClassification;
  isEnabledGlobal: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  actionCount: number;
}

export interface FeatureActionPermission {
  id: string;
  featureId: string;
  actionCode: string;
  actionName: string;
  permissionCode: string;
  permissionId?: string;
  permissionName?: string;
  permissionModule?: string;
  description?: string;
  isDefault: boolean;
  createdAtUtc: string;
}

export interface FeatureDetail extends Feature {
  parentFeatureCode?: string;
  actions: FeatureActionPermission[];
}

export interface FeatureHierarchy {
  id: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  code: string;
  name: string;
  featureType: FeatureType;
  parentFeatureId?: string;
  routePath?: string;
  icon?: string;
  orderIndex: number;
  status: FeatureStatus;
  isEnabledGlobal: boolean;
  actionCount: number;
  children: FeatureHierarchy[];
}

export interface CreateFeatureRequest {
  moduleId: string;
  code: string;
  name: string;
  description?: string;
  featureType: FeatureType;
  parentFeatureId?: string | null;
  routePath?: string;
  apiEndpoint?: string;
  componentKey?: string;
  icon?: string;
  orderIndex?: number;
  supportedActions?: string;
  status?: FeatureStatus;
  ownerTeam?: string;
  dataClassification?: DataClassification;
  isEnabledGlobal?: boolean;
}

export interface UpdateFeatureRequest {
  name: string;
  description?: string;
  featureType: FeatureType;
  parentFeatureId?: string | null;
  routePath?: string;
  apiEndpoint?: string;
  componentKey?: string;
  icon?: string;
  orderIndex?: number;
  supportedActions?: string;
  status?: FeatureStatus;
  ownerTeam?: string;
  dataClassification?: DataClassification;
  isEnabledGlobal?: boolean;
}

export interface FeatureFilter {
  page?: number;
  pageSize?: number;
  moduleId?: string;
  featureType?: string;
  status?: string;
  searchTerm?: string;
}

export interface ActionPermissionMappingView {
  mappingId: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  featureId: string;
  featureCode: string;
  featureName: string;
  featureType: FeatureType;
  actionCode: string;
  actionName: string;
  permissionCode: string;
  permissionId?: string;
  permissionName: string;
  permissionDescription?: string;
  isDefault: boolean;
  featureStatus: FeatureStatus;
  moduleStatus: ModuleStatus;
  createdAtUtc: string;
}

export interface CreateFeatureActionRequest {
  actionCode: string;
  actionName: string;
  permissionCode: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateFeatureActionRequest {
  actionName: string;
  permissionCode: string;
  description?: string;
  isDefault?: boolean;
}

export interface PermissionMappingFilter {
  moduleId?: string;
  searchTerm?: string;
}
