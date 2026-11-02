import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  Branch,
  BranchDetail,
  BranchFilter,
  BranchOption,
  CreateBranchRequest,
  UpdateBranchRequest,
} from '../branches';
import { BusinessUnit, LegalEntityOption } from '../businessUnits';

export const branchService = {
  getPaged: (query: BranchFilter) =>
    apiClient.get<PagedData<Branch>>('/organization/branches', query),
  getById: (id: string) => apiClient.get<BranchDetail>(`/organization/branches/${id}`),
  getLookup: (legalEntityId?: string, businessUnitId?: string) =>
    apiClient.get<BranchOption[]>('/organization/branches/lookup', { legalEntityId, businessUnitId }),
  getLegalEntities: () => apiClient.get<LegalEntityOption[]>('/organization/legal-entities/lookup'),
  getBusinessUnits: (legalEntityId?: string) =>
    apiClient.get<PagedData<BusinessUnit>>('/organization/business-units', {
      legalEntityId,
      pageSize: 100,
      status: 'Active',
    }),
  create: (request: CreateBranchRequest) =>
    apiClient.post<{ id: string }>('/organization/branches', request),
  update: (id: string, request: UpdateBranchRequest) =>
    apiClient.put(`/organization/branches/${id}`, request),
  delete: (id: string) => apiClient.delete(`/organization/branches/${id}`),
};

