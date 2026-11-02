import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { legalEntityService } from '../services/legalEntityService';
import {
  CreateLegalEntityRequest,
  UpdateLegalEntityRequest,
  LegalEntityFilterQuery,
} from '../types';

export const LEGAL_ENTITIES_QUERY_KEY = 'legal-entities';

export function useLegalEntitiesPaged(query: LegalEntityFilterQuery) {
  return useQuery({
    queryKey: [LEGAL_ENTITIES_QUERY_KEY, query],
    queryFn: () => legalEntityService.getPaged(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useLegalEntityDetail(id?: string) {
  return useQuery({
    queryKey: [LEGAL_ENTITIES_QUERY_KEY, 'detail', id],
    queryFn: () => legalEntityService.getById(id!),
    enabled: !!id,
  });
}

export function useLegalEntityLookup() {
  return useQuery({
    queryKey: [LEGAL_ENTITIES_QUERY_KEY, 'lookup'],
    queryFn: () => legalEntityService.getLookup(),
  });
}

export function useCreateLegalEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLegalEntityRequest) => legalEntityService.create(data),
    onSuccess: () => {
      toast.success('Đăng ký pháp nhân mới thành công');
      queryClient.invalidateQueries({ queryKey: [LEGAL_ENTITIES_QUERY_KEY] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể tạo mới pháp nhân');
    },
  });
}

export function useUpdateLegalEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLegalEntityRequest }) =>
      legalEntityService.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin pháp nhân thành công');
      queryClient.invalidateQueries({ queryKey: [LEGAL_ENTITIES_QUERY_KEY] });
    },
    onError: (err: any) => {
      if (err.code === 'CONCURRENCY_CONFLICT') {
        toast.error('Dữ liệu đã bị sửa bởi phiên khác. Vui lòng tải lại và thử lại!');
      } else {
        toast.error(err.message || 'Cập nhật pháp nhân thất bại');
      }
    },
  });
}

export function useDeleteLegalEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => legalEntityService.delete(id),
    onSuccess: () => {
      toast.success('Xóa pháp nhân thành công');
      queryClient.invalidateQueries({ queryKey: [LEGAL_ENTITIES_QUERY_KEY] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể xóa pháp nhân');
    },
  });
}
