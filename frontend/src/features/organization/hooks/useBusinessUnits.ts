import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { businessUnitService } from '../services/businessUnitService';
import { BusinessUnitFilter, CreateBusinessUnitRequest, UpdateBusinessUnitRequest } from '../businessUnits';

export const BUSINESS_UNITS_QUERY_KEY = 'business-units';
type ApiError = Error & { code?: string };

export function useBusinessUnits(query: BusinessUnitFilter) {
  return useQuery({
    queryKey: [BUSINESS_UNITS_QUERY_KEY, query],
    queryFn: () => businessUnitService.getPaged(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useBusinessUnitDetail(id?: string) {
  return useQuery({
    queryKey: [BUSINESS_UNITS_QUERY_KEY, 'detail', id],
    queryFn: () => businessUnitService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBusinessUnitRequest) => businessUnitService.create(request),
    onSuccess: () => {
      toast.success('Tạo đơn vị kinh doanh thành công');
      queryClient.invalidateQueries({ queryKey: [BUSINESS_UNITS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể tạo đơn vị kinh doanh'),
  });
}

export function useUpdateBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateBusinessUnitRequest }) =>
      businessUnitService.update(id, request),
    onSuccess: () => {
      toast.success('Cập nhật đơn vị kinh doanh thành công');
      queryClient.invalidateQueries({ queryKey: [BUSINESS_UNITS_QUERY_KEY] });
    },
    onError: (error: ApiError) => {
      toast.error(error.code === 'CONCURRENCY_CONFLICT'
        ? 'Dữ liệu đã thay đổi bởi người khác. Hãy tải lại trước khi cập nhật.'
        : error.message || 'Không thể cập nhật đơn vị kinh doanh');
    },
  });
}

export function useDeleteBusinessUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessUnitService.delete(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động đơn vị kinh doanh');
      queryClient.invalidateQueries({ queryKey: [BUSINESS_UNITS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể ngừng hoạt động đơn vị'),
  });
}
