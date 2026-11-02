import React from 'react';
import { AuditLogList } from '../../features/audit/components/AuditLogList';

export const AuditLogsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <AuditLogList />
    </div>
  );
};

