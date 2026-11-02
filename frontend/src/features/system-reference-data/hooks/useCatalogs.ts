import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { referenceDataService } from '../services/referenceDataService';
import {
  CatalogFilter,
  CreateCatalogPayload,
  UpdateCatalogPayload,
  ChangeCatalogStatusPayload,
} from '../types/referenceData';

export const CATALOGS_QUERY_KEY = ['system-reference-data', 'catalogs'];

export const useCatalogs = (filter: CatalogFilter) => {
  return useQuery({
    queryKey: [...CATALOGS_QUERY_KEY, filter],
    queryFn: () => referenceDataService.getCatalogs(filter),
  });
};

export const useCatalogDetail = (id: string | null) => {
  return useQuery({
    queryKey: [...CATALOGS_QUERY_KEY, 'detail', id],
    queryFn: () => referenceDataService.getCatalogById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCatalogPayload) => referenceDataService.createCatalog(payload),
    onSuccess: () => {
      toast.success('Tạo mới nhóm danh mục thành công');
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
    },
    onError: (err: any) => {
      const msg = err.message || 'Không thể tạo mới nhóm danh mục.';
      toast.error(`Lỗi: ${msg}`);
    },
  });
};

export const useUpdateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCatalogPayload }) =>
      referenceDataService.updateCatalog(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thông tin nhóm danh mục thành công');
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể cập nhật nhóm danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

export const useDeactivateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeCatalogStatusPayload }) =>
      referenceDataService.deactivateCatalog(id, payload),
    onSuccess: () => {
      toast.success('Đã ngừng sử dụng nhóm danh mục');
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể ngừng sử dụng nhóm danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

export const useActivateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeCatalogStatusPayload }) =>
      referenceDataService.activateCatalog(id, payload),
    onSuccess: () => {
      toast.success('Đã kích hoạt lại nhóm danh mục');
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể kích hoạt nhóm danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

