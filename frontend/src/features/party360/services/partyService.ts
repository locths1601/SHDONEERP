import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  PartyListItemDto,
  PartyDetailDto,
  PartyFilterQuery,
  CreatePersonPartyPayload,
  CreateOrganizationPartyPayload,
  UpdatePersonPartyPayload,
  UpdateOrganizationPartyPayload,
} from '../types';

export const partyService = {
  getPaged: (params: PartyFilterQuery) => {
    return apiClient.get<PagedData<PartyListItemDto>>('/parties', params);
  },

  getById: (id: string) => {
    return apiClient.get<PartyDetailDto>(`/parties/${id}`);
  },

  createPerson: (data: CreatePersonPartyPayload) => {
    return apiClient.post<{ id: string }>('/parties/person', data);
  },

  createOrganization: (data: CreateOrganizationPartyPayload) => {
    return apiClient.post<{ id: string }>('/parties/organization', data);
  },

  updatePerson: (id: string, data: UpdatePersonPartyPayload) => {
    return apiClient.put(`/parties/person/${id}`, data);
  },

  updateOrganization: (id: string, data: UpdateOrganizationPartyPayload) => {
    return apiClient.put(`/parties/organization/${id}`, data);
  },

  updateStatus: (id: string, status: string, rowVersionBase64?: string) => {
    return apiClient.put(`/parties/${id}/status`, { status, rowVersionBase64 });
  },

  delete: (id: string) => {
    return apiClient.delete(`/parties/${id}`);
  },
};

