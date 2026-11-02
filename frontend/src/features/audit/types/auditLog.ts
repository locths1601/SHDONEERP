export interface AuditLogItem {
  id: string;
  timestampUtc: string;
  action: string;
  entityName: string;
  entityId: string;
  userId?: string | null;
  userName?: string | null;
  affectedColumns?: string | null;
  legalEntityId?: string | null;
  legalEntityCode?: string | null;
  legalEntityName?: string | null;
  correlationId?: string | null;
}

export interface AuditLogDetail extends AuditLogItem {
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
  spanId?: string | null;
}

export interface AuditLogFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  action?: string;
  entityName?: string;
  userName?: string;
  fromDateUtc?: string;
  toDateUtc?: string;
  correlationId?: string;
  legalEntityId?: string;
}

