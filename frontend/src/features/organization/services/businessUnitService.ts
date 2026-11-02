import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  BusinessUnit,
  BusinessUnitDetail,
  BusinessUnitFilter,
  CreateBusinessUnitRequest,
  LegalEntityOption,
  UpdateBusinessUnitRequest,
} from '../businessUnits';

export const businessUnitService = {
  getPaged: (query: BusinessUnitFilter) =>
    apiClient.get<PagedData<BusinessUnit>>('/organization/business-units', query),
  getById: (id: string) => apiClient.get<BusinessUnitDetail>(`/organization/business-units/${id}`),
  getLegalEntities: () => apiClient.get<LegalEntityOption[]>('/organization/legal-entities/lookup'),
  create: (request: CreateBusinessUnitRequest) =>
    apiClient.post<{ id: string }>('/organization/business-units', request),
  update: (id: string, request: UpdateBusinessUnitRequest) =>
    apiClient.put(`/organization/business-units/${id}`, request),
  delete: (id: string) => apiClient.delete(`/organization/business-units/${id}`),
};
