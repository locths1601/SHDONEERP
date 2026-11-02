import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import {
  StudentListItemDto,
  StudentFilterQuery,
  StudentDetailDto,
  CreateStudentPayload,
  AddIdentificationPayload,
  AddRelationshipPayload,
  StudentApplicationListItemDto,
  StudentApplicationDetailDto,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  UpdateApplicationStatusPayload,
  ChecklistItemDto,
  AddChecklistItemPayload,
  VerifyChecklistPayload,
  RejectChecklistPayload,
} from '../types';

export const studentWorkspaceService = {
  // --- Student (Party360 Domain) ---
  getStudentsPaged: (query: StudentFilterQuery) => {
    return apiClient.get<PagedData<StudentListItemDto>>('/parties/students', query);
  },

  getStudentDetail: (id: string) => {
    return apiClient.get<StudentDetailDto>(`/parties/students/${id}`);
  },

  createStudent: (payload: CreateStudentPayload) => {
    return apiClient.post<{ id: string }>('/parties/students', payload);
  },

  addIdentification: (partyId: string, payload: AddIdentificationPayload) => {
    return apiClient.post<{ id: string }>(`/parties/${partyId}/identifications`, payload);
  },

  addRelationship: (partyId: string, payload: AddRelationshipPayload) => {
    return apiClient.post<{ id: string }>(`/parties/${partyId}/relationships`, payload);
  },

  // --- Student Application (AdmissionVisa Domain) ---
  getApplicationsPaged: (query: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    targetMarket?: string;
    intakeTerm?: string;
    status?: string;
    legalEntityId?: string;
    studentPartyId?: string;
  }) => {
    return apiClient.get<PagedData<StudentApplicationListItemDto>>('/admissions/applications', query);
  },

  getApplicationDetail: (id: string) => {
    return apiClient.get<StudentApplicationDetailDto>(`/admissions/applications/${id}`);
  },

  getApplicationsByStudentPartyId: (studentPartyId: string) => {
    return apiClient.get<StudentApplicationListItemDto[]>(`/admissions/applications/by-student/${studentPartyId}`);
  },

  createApplication: (payload: CreateApplicationPayload) => {
    return apiClient.post<{ id: string }>('/admissions/applications', payload);
  },

  updateApplication: (id: string, payload: UpdateApplicationPayload) => {
    return apiClient.put(`/admissions/applications/${id}`, payload);
  },

  updateApplicationStatus: (id: string, payload: UpdateApplicationStatusPayload) => {
    return apiClient.put(`/admissions/applications/${id}/status`, payload);
  },

  deleteApplication: (id: string) => {
    return apiClient.delete(`/admissions/applications/${id}`);
  },

  // --- Checklist & Dossier (AdmissionVisa + Documents) ---
  getChecklist: (applicationId: string) => {
    return apiClient.get<ChecklistItemDto[]>(`/admissions/applications/${applicationId}/checklist`);
  },

  addChecklistItem: (applicationId: string, payload: AddChecklistItemPayload) => {
    return apiClient.post<{ id: string }>(`/admissions/applications/${applicationId}/checklist`, payload);
  },

  verifyChecklistItem: (applicationId: string, itemId: string, payload: VerifyChecklistPayload) => {
    return apiClient.post(`/admissions/applications/${applicationId}/checklist/${itemId}/verify`, payload);
  },

  rejectChecklistItem: (applicationId: string, itemId: string, payload: RejectChecklistPayload) => {
    return apiClient.post(`/admissions/applications/${applicationId}/checklist/${itemId}/reject`, payload);
  },

  resetChecklistItem: (applicationId: string, itemId: string) => {
    return apiClient.post(`/admissions/applications/${applicationId}/checklist/${itemId}/reset`);
  },

  uploadDocument: (applicationId: string, itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<{
      documentId: string;
      linkId: string;
      fileName: string;
      fileSize: number;
      sha256: string;
    }>(`/admissions/applications/${applicationId}/checklist/${itemId}/upload`, formData);
  },

  getDocumentDownloadUrl: (documentId: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/admissions/documents/${documentId}/download`;
  },
};

