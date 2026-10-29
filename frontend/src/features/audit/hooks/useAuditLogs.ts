import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/auditLogService';
import { AuditLogFilter } from '../types/auditLog';

export const AUDIT_LOGS_QUERY_KEY = 'audit-logs';

export function useAuditLogs(query: AuditLogFilter) {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, query],
    queryFn: () => auditLogService.getPaged(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useAuditLogDetail(id?: string) {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, 'detail', id],
    queryFn: () => auditLogService.getById(id!),
    enabled: Boolean(id),
  });
}

