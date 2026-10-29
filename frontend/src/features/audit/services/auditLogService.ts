import { apiClient } from '../../../lib/apiClient';
import { PagedData } from '../../../types/api';
import { AuditLogItem, AuditLogDetail, AuditLogFilter } from '../types/auditLog';

export const auditLogService = {
  getPaged: (query: AuditLogFilter) =>
    apiClient.get<PagedData<AuditLogItem>>('/identity/audit-logs', query),

  getById: (id: string) =>
    apiClient.get<AuditLogDetail>(`/identity/audit-logs/${id}`),
};

