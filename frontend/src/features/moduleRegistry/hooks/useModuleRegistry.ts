import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moduleRegistryService } from '../services/moduleRegistryService';
import {
  ModuleFilter,
  CreateModuleRequest,
  UpdateModuleRequest,
  AddModuleDependencyRequest,
  FeatureFilter,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  CreateFeatureActionRequest,
  UpdateFeatureActionRequest,
  PermissionMappingFilter,
} from '../types/moduleRegistry';

const MODULES_KEY = 'system-modules';
const FEATURES_KEY = 'system-features';
const PERMISSION_MAPPING_KEY = 'system-permission-mapping';

// Modules Hooks
export const useModules = (query: ModuleFilter) => {
  return useQuery({
    queryKey: [MODULES_KEY, query],
    queryFn: () => moduleRegistryService.getModulesPaged(query),
  });
};

export const useModule = (id: string | null) => {
  return useQuery({
    queryKey: [MODULES_KEY, 'detail', id],
    queryFn: () => moduleRegistryService.getModuleById(id!),
    enabled: !!id,
  });
};

export const useModuleHierarchy = () => {
  return useQuery({
    queryKey: [MODULES_KEY, 'hierarchy'],
    queryFn: () => moduleRegistryService.getModuleHierarchy(),
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateModuleRequest) => moduleRegistryService.createModule(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      toast.success('Đăng ký phân hệ thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo phân hệ.');
    },
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateModuleRequest }) =>
      moduleRegistryService.updateModule(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY, 'detail', id] });
      toast.success('Cập nhật phân hệ thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật phân hệ.');
    },
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleRegistryService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      toast.success('Xóa phân hệ thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa phân hệ.');
    },
  });
};

export const useAddModuleDependency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, request }: { moduleId: string; request: AddModuleDependencyRequest }) =>
      moduleRegistryService.addModuleDependency(moduleId, request),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY, 'detail', moduleId] });
      toast.success('Thêm quan hệ phụ thuộc thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thêm quan hệ phụ thuộc.');
    },
  });
};

export const useRemoveModuleDependency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dependencyId }: { moduleId: string; dependencyId: string }) =>
      moduleRegistryService.removeModuleDependency(dependencyId),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY, 'detail', moduleId] });
      toast.success('Đã gỡ bỏ quan hệ phụ thuộc.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gỡ bỏ quan hệ phụ thuộc.');
    },
  });
};

// Features Hooks
export const useFeatures = (query: FeatureFilter) => {
  return useQuery({
    queryKey: [FEATURES_KEY, query],
    queryFn: () => moduleRegistryService.getFeaturesPaged(query),
  });
};

export const useFeature = (id: string | null) => {
  return useQuery({
    queryKey: [FEATURES_KEY, 'detail', id],
    queryFn: () => moduleRegistryService.getFeatureById(id!),
    enabled: !!id,
  });
};

export const useFeatureHierarchy = (moduleId?: string) => {
  return useQuery({
    queryKey: [FEATURES_KEY, 'hierarchy', moduleId],
    queryFn: () => moduleRegistryService.getFeatureHierarchy(moduleId),
  });
};

export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateFeatureRequest) => moduleRegistryService.createFeature(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      toast.success('Đăng ký tính năng mới thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo tính năng.');
    },
  });
};

export const useUpdateFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateFeatureRequest }) =>
      moduleRegistryService.updateFeature(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY] });
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY, 'detail', id] });
      toast.success('Cập nhật tính năng thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật tính năng.');
    },
  });
};

export const useDeleteFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleRegistryService.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY] });
      queryClient.invalidateQueries({ queryKey: [MODULES_KEY] });
      toast.success('Xóa tính năng thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa tính năng.');
    },
  });
};

export const useAddFeatureAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ featureId, request }: { featureId: string; request: CreateFeatureActionRequest }) =>
      moduleRegistryService.addFeatureAction(featureId, request),
    onSuccess: (_, { featureId }) => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY, 'detail', featureId] });
      queryClient.invalidateQueries({ queryKey: [PERMISSION_MAPPING_KEY] });
      toast.success('Thêm hành động thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thêm hành động.');
    },
  });
};

export const useUpdateFeatureAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionMappingId, request }: { featureId: string; actionMappingId: string; request: UpdateFeatureActionRequest }) =>
      moduleRegistryService.updateFeatureAction(actionMappingId, request),
    onSuccess: (_, { featureId }) => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY, 'detail', featureId] });
      queryClient.invalidateQueries({ queryKey: [PERMISSION_MAPPING_KEY] });
      toast.success('Cập nhật hành động thành công.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật hành động.');
    },
  });
};

export const useRemoveFeatureAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionMappingId }: { featureId: string; actionMappingId: string }) =>
      moduleRegistryService.removeFeatureAction(actionMappingId),
    onSuccess: (_, { featureId }) => {
      queryClient.invalidateQueries({ queryKey: [FEATURES_KEY, 'detail', featureId] });
      queryClient.invalidateQueries({ queryKey: [PERMISSION_MAPPING_KEY] });
      toast.success('Đã gỡ bỏ hành động.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gỡ bỏ hành động.');
    },
  });
};

// Permission Mapping Catalog Hook
export const usePermissionMappingCatalog = (query: PermissionMappingFilter) => {
  return useQuery({
    queryKey: [PERMISSION_MAPPING_KEY, query],
    queryFn: () => moduleRegistryService.getPermissionMappingCatalog(query),
  });
};
