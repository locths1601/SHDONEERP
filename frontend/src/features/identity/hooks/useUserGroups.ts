import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userGroupService } from '../services/userGroupService';
import {
  UserGroupFilter,
  CreateUserGroupRequest,
  UpdateUserGroupRequest,
  AssignUserGroupMemberRequest,
  UpdateGroupPermissionsRequest,
} from '../types/userGroup';

export const USER_GROUPS_QUERY_KEY = 'user-groups';
type ApiError = Error & { code?: string };

export function useUserGroups(query: UserGroupFilter) {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, query],
    queryFn: () => userGroupService.getPaged(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useUserGroupDetail(id?: string) {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, 'detail', id],
    queryFn: () => userGroupService.getById(id!),
    enabled: Boolean(id),
  });
}

export function useUserGroupMembers(id?: string) {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, 'members', id],
    queryFn: () => userGroupService.getMembers(id!),
    enabled: Boolean(id),
  });
}

export function useUserGroupPermissions(id?: string) {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, 'permissions', id],
    queryFn: () => userGroupService.getPermissions(id!),
    enabled: Boolean(id),
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, 'all-permissions'],
    queryFn: () => userGroupService.getAllPermissions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserEffectivePermissions(userId?: string) {
  return useQuery({
    queryKey: [USER_GROUPS_QUERY_KEY, 'effective-permissions', userId],
    queryFn: () => userGroupService.getUserEffectivePermissions(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateUserGroupRequest) => userGroupService.create(request),
    onSuccess: () => {
      toast.success('Tạo nhóm người dùng thành công');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể tạo nhóm người dùng'),
  });
}

export function useUpdateUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateUserGroupRequest }) =>
      userGroupService.update(id, request),
    onSuccess: () => {
      toast.success('Cập nhật nhóm người dùng thành công');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => {
      toast.error(
        error.code === 'CONCURRENCY_CONFLICT'
          ? 'Dữ liệu đã bị thay đổi bởi phiên khác. Hãy tải lại trước khi lưu.'
          : error.message || 'Không thể cập nhật nhóm người dùng'
      );
    },
  });
}

export function useDeleteUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userGroupService.delete(id),
    onSuccess: () => {
      toast.success('Xóa nhóm người dùng thành công');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể xóa nhóm người dùng'),
  });
}

export function useAssignGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AssignUserGroupMemberRequest }) =>
      userGroupService.assignMember(id, request),
    onSuccess: (_, { id }) => {
      toast.success('Thêm thành viên vào nhóm thành công');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY, 'members', id] });
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể thêm thành viên'),
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, membershipId }: { id: string; membershipId: string }) =>
      userGroupService.removeMember(id, membershipId),
    onSuccess: (_, { id }) => {
      toast.success('Đã loại thành viên khỏi nhóm');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY, 'members', id] });
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể loại thành viên khỏi nhóm'),
  });
}

export function useUpdateGroupPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateGroupPermissionsRequest }) =>
      userGroupService.updatePermissions(id, request),
    onSuccess: (_, { id }) => {
      toast.success('Cập nhật quyền trực tiếp cho nhóm thành công');
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY, 'permissions', id] });
      queryClient.invalidateQueries({ queryKey: [USER_GROUPS_QUERY_KEY] });
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể cập nhật quyền nhóm'),
  });
}

