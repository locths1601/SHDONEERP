export type ScopeType = 'Global' | 'LegalEntity' | 'BusinessUnit' | 'Branch';

export interface UserGroup {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  scopeType: ScopeType;
  isSystem: boolean;
  isActive: boolean;
  memberCount: number;
  permissionCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64?: string | null;
}

export interface UserGroupDetail extends UserGroup {}

export interface UserGroupFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  scopeType?: string;
  isActive?: boolean;
}

export interface UserGroupMember {
  membershipId: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  isUserActive: boolean;
  scopeLegalEntityId?: string | null;
  legalEntityCode?: string | null;
  legalEntityName?: string | null;
  scopeBusinessUnitId?: string | null;
  businessUnitCode?: string | null;
  businessUnitName?: string | null;
  scopeBranchId?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  assignedAtUtc: string;
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  createdAtUtc: string;
}

export interface GroupPermissionGrant {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  module: string;
  description?: string | null;
  grantedAtUtc: string;
}

export interface UserEffectiveDetailedPermission {
  permissionCode: string;
  permissionName: string;
  module: string;
  scopeType: string;
  scopeLegalEntityId?: string | null;
  scopeLegalEntityName?: string | null;
  scopeBusinessUnitId?: string | null;
  scopeBusinessUnitName?: string | null;
  scopeBranchId?: string | null;
  scopeBranchName?: string | null;
  viaGroupName: string;
}

export interface CreateUserGroupRequest {
  code: string;
  name: string;
  description?: string;
  scopeType: ScopeType;
  isActive: boolean;
}

export interface UpdateUserGroupRequest {
  name: string;
  description?: string;
  isActive: boolean;
  rowVersionBase64: string;
}

export interface AssignUserGroupMemberRequest {
  userId: string;
  scopeLegalEntityId?: string | null;
  scopeBusinessUnitId?: string | null;
  scopeBranchId?: string | null;
}

export interface UpdateGroupPermissionsRequest {
  permissionIds: string[];
}

