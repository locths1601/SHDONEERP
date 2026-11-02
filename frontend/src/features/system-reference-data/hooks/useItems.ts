import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { referenceDataService } from '../services/referenceDataService';
import {
  ItemFilter,
  CreateItemPayload,
  UpdateItemPayload,
  ChangeItemStatusPayload,
} from '../types/referenceData';
import { CATALOGS_QUERY_KEY } from './useCatalogs';

export const ITEMS_QUERY_KEY = ['system-reference-data', 'items'];
export const LOOKUP_QUERY_KEY = ['system-reference-data', 'lookup'];

export const useItems = (catalogId: string, filter: ItemFilter) => {
  return useQuery({
    queryKey: [...ITEMS_QUERY_KEY, catalogId, filter],
    queryFn: () => referenceDataService.getItems(catalogId, filter),
    enabled: Boolean(catalogId),
  });
};

export const useItemDetail = (catalogId: string, itemId: string | null) => {
  return useQuery({
    queryKey: [...ITEMS_QUERY_KEY, catalogId, 'detail', itemId],
    queryFn: () => referenceDataService.getItemById(catalogId, itemId!),
    enabled: Boolean(catalogId && itemId),
  });
};

export const useCreateItem = (catalogId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => referenceDataService.createItem(catalogId, payload),
    onSuccess: () => {
      toast.success('Tạo mới giá trị danh mục thành công');
      queryClient.invalidateQueries({ queryKey: [...ITEMS_QUERY_KEY, catalogId] });
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOOKUP_QUERY_KEY });
    },
    onError: (err: any) => {
      const msg = err.message || 'Không thể tạo mới giá trị danh mục.';
      toast.error(`Lỗi: ${msg}`);
    },
  });
};

export const useUpdateItem = (catalogId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateItemPayload }) =>
      referenceDataService.updateItem(catalogId, itemId, payload),
    onSuccess: () => {
      toast.success('Cập nhật thông tin giá trị danh mục thành công');
      queryClient.invalidateQueries({ queryKey: [...ITEMS_QUERY_KEY, catalogId] });
      queryClient.invalidateQueries({ queryKey: CATALOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOOKUP_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể cập nhật giá trị danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

export const useDeactivateItem = (catalogId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: ChangeItemStatusPayload }) =>
      referenceDataService.deactivateItem(catalogId, itemId, payload),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa giá trị danh mục');
      queryClient.invalidateQueries({ queryKey: [...ITEMS_QUERY_KEY, catalogId] });
      queryClient.invalidateQueries({ queryKey: LOOKUP_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể vô hiệu hóa giá trị danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

export const useActivateItem = (catalogId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: ChangeItemStatusPayload }) =>
      referenceDataService.activateItem(catalogId, itemId, payload),
    onSuccess: () => {
      toast.success('Đã kích hoạt lại giá trị danh mục');
      queryClient.invalidateQueries({ queryKey: [...ITEMS_QUERY_KEY, catalogId] });
      queryClient.invalidateQueries({ queryKey: LOOKUP_QUERY_KEY });
    },
    onError: (err: any) => {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Xung đột đồng thời: Bản ghi đã bị thay đổi bởi người khác.');
      } else {
        const msg = err.message || 'Không thể kích hoạt giá trị danh mục.';
        toast.error(`Lỗi: ${msg}`);
      }
    },
  });
};

export const useItemLookup = (catalogCode: string) => {
  return useQuery({
    queryKey: [...LOOKUP_QUERY_KEY, catalogCode],
    queryFn: () => referenceDataService.getLookupByCatalogCode(catalogCode),
    enabled: Boolean(catalogCode),
  });
};

