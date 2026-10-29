import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { branchService } from '../services/branchService';
import { BranchFilter, CreateBranchRequest, UpdateBranchRequest } from '../branches';

export const BRANCHES_QUERY_KEY = 'branches';
type ApiError = Error & { code?: string };

export function useBranches(query: BranchFilter) {
  return useQuery({
    queryKey: [BRANCHES_QUERY_KEY, query],
    queryFn: () => branchService.getPaged(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useBranchDetail(id?: string) {
  return useQuery({
    queryKey: [BRANCHES_QUERY_KEY, 'detail', id],
    queryFn: () => branchService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useBranchLookup(legalEntityId?: string, businessUnitId?: string) {
  return useQuery({
    queryKey: [BRANCHES_QUERY_KEY, 'lookup', legalEntityId, businessUnitId],
    queryFn: () => branchService.getLookup(legalEntityId, businessUnitId),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBranchRequest) => branchService.create(request),
    onSuccess: () => {
      toast.success('Tạo cơ sở / chi nhánh thành công');
      queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể tạo cơ sở / chi nhánh'),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateBranchRequest }) =>
      branchService.update(id, request),
    onSuccess: () => {
      toast.success('Cập nhật cơ sở / chi nhánh thành công');
      queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });
    },
    onError: (error: ApiError) => {
      toast.error(
        error.code === 'CONCURRENCY_CONFLICT'
          ? 'Dữ liệu đã thay đổi bởi người khác. Hãy tải lại trước khi cập nhật.'
          : error.message || 'Không thể cập nhật cơ sở / chi nhánh'
      );
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động cơ sở / chi nhánh');
      queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể ngừng hoạt động cơ sở / chi nhánh'),
  });
}
