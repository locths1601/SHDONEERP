import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  LegalEntityDto,
  LegalEntityDetailDto,
  LegalEntityLookupDto,
  CreateLegalEntityRequest,
  UpdateLegalEntityRequest,
  LegalEntityFilterQuery,
} from '../types';

export const legalEntityService = {
  getPaged: (query: LegalEntityFilterQuery) => {
    return apiClient.get<PagedData<LegalEntityDto>>('/organization/legal-entities', query);
  },

  getById: (id: string) => {
    return apiClient.get<LegalEntityDetailDto>(`/organization/legal-entities/${id}`);
  },

  getLookup: () => {
    return apiClient.get<LegalEntityLookupDto[]>('/organization/legal-entities/lookup');
  },

  create: (data: CreateLegalEntityRequest) => {
    return apiClient.post<{ id: string }>('/organization/legal-entities', data);
  },

  update: (id: string, data: UpdateLegalEntityRequest) => {
    return apiClient.put(`/organization/legal-entities/${id}`, data);
  },

  delete: (id: string) => {
    return apiClient.delete(`/organization/legal-entities/${id}`);
  },
};
