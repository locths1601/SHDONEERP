import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  UserGroup,
  UserGroupDetail,
  UserGroupFilter,
  UserGroupMember,
  PermissionItem,
  GroupPermissionGrant,
  UserEffectiveDetailedPermission,
  CreateUserGroupRequest,
  UpdateUserGroupRequest,
  AssignUserGroupMemberRequest,
  UpdateGroupPermissionsRequest,
} from '../types/userGroup';

export const userGroupService = {
  getPaged: (query: UserGroupFilter) =>
    apiClient.get<PagedData<UserGroup>>('/identity/user-groups', query),

  getById: (id: string) =>
    apiClient.get<UserGroupDetail>(`/identity/user-groups/${id}`),

  create: (request: CreateUserGroupRequest) =>
    apiClient.post<{ id: string }>('/identity/user-groups', request),

  update: (id: string, request: UpdateUserGroupRequest) =>
    apiClient.put(`/identity/user-groups/${id}`, request),

  delete: (id: string) =>
    apiClient.delete(`/identity/user-groups/${id}`),

  getMembers: (id: string) =>
    apiClient.get<UserGroupMember[]>(`/identity/user-groups/${id}/members`),

  assignMember: (id: string, request: AssignUserGroupMemberRequest) =>
    apiClient.post(`/identity/user-groups/${id}/members`, request),

  removeMember: (id: string, membershipId: string) =>
    apiClient.delete(`/identity/user-groups/${id}/members/${membershipId}`),

  getPermissions: (id: string) =>
    apiClient.get<GroupPermissionGrant[]>(`/identity/user-groups/${id}/permissions`),

  updatePermissions: (id: string, request: UpdateGroupPermissionsRequest) =>
    apiClient.put(`/identity/user-groups/${id}/permissions`, request),

  getAllPermissions: () =>
    apiClient.get<PermissionItem[]>('/identity/user-groups/permissions'),

  getUserEffectivePermissions: (userId: string) =>
    apiClient.get<UserEffectiveDetailedPermission[]>(`/identity/user-groups/users/${userId}/effective-permissions`),
};

