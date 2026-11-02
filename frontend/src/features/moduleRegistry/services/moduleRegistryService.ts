import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  Module,
  ModuleDetail,
  ModuleHierarchy,
  ModuleDependency,
  ModuleFilter,
  CreateModuleRequest,
  UpdateModuleRequest,
  AddModuleDependencyRequest,
  Feature,
  FeatureDetail,
  FeatureHierarchy,
  FeatureFilter,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  FeatureActionPermission,
  CreateFeatureActionRequest,
  UpdateFeatureActionRequest,
  ActionPermissionMappingView,
  PermissionMappingFilter,
} from '../types/moduleRegistry';

export const moduleRegistryService = {
  // Modules CRUD & Hierarchy
  getModulesPaged: (query: ModuleFilter) =>
    apiClient.get<PagedData<Module>>('/system/modules', query),

  getModuleById: (id: string) =>
    apiClient.get<ModuleDetail>(`/system/modules/${id}`),

  getModuleHierarchy: () =>
    apiClient.get<ModuleHierarchy[]>('/system/modules/hierarchy'),

  getModuleDependencies: (id: string) =>
    apiClient.get<ModuleDependency[]>(`/system/modules/${id}/dependencies`),

  createModule: (request: CreateModuleRequest) =>
    apiClient.post<{ id: string }>('/system/modules', request),

  updateModule: (id: string, request: UpdateModuleRequest) =>
    apiClient.put(`/system/modules/${id}`, request),

  deleteModule: (id: string) =>
    apiClient.delete(`/system/modules/${id}`),

  addModuleDependency: (moduleId: string, request: AddModuleDependencyRequest) =>
    apiClient.post<{ id: string }>(`/system/modules/${moduleId}/dependencies`, request),

  removeModuleDependency: (dependencyId: string) =>
    apiClient.delete(`/system/modules/dependencies/${dependencyId}`),

  // Features CRUD & Hierarchy
  getFeaturesPaged: (query: FeatureFilter) =>
    apiClient.get<PagedData<Feature>>('/system/features', query),

  getFeatureById: (id: string) =>
    apiClient.get<FeatureDetail>(`/system/features/${id}`),

  getFeatureHierarchy: (moduleId?: string) =>
    apiClient.get<FeatureHierarchy[]>('/system/features/hierarchy', moduleId ? { moduleId } : undefined),

  getFeatureActions: (featureId: string) =>
    apiClient.get<FeatureActionPermission[]>(`/system/features/${featureId}/actions`),

  createFeature: (request: CreateFeatureRequest) =>
    apiClient.post<{ id: string }>('/system/features', request),

  updateFeature: (id: string, request: UpdateFeatureRequest) =>
    apiClient.put(`/system/features/${id}`, request),

  deleteFeature: (id: string) =>
    apiClient.delete(`/system/features/${id}`),

  addFeatureAction: (featureId: string, request: CreateFeatureActionRequest) =>
    apiClient.post<{ id: string }>(`/system/features/${featureId}/actions`, request),

  updateFeatureAction: (actionMappingId: string, request: UpdateFeatureActionRequest) =>
    apiClient.put(`/system/features/actions/${actionMappingId}`, request),

  removeFeatureAction: (actionMappingId: string) =>
    apiClient.delete(`/system/features/actions/${actionMappingId}`),

  // Permission Mapping Viewer
  getPermissionMappingCatalog: (query: PermissionMappingFilter) =>
    apiClient.get<ActionPermissionMappingView[]>('/system/permission-mapping', query),
};
