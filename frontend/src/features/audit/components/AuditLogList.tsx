import React, { useState } from 'react';
import { Eye, History, Filter, User, HardDrive, Calendar } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { AuditLogItem, AuditLogFilter } from '../types/auditLog';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';

export const AuditLogList: React.FC = () => {
  const [query, setQuery] = useState<AuditLogFilter>({
    page: 1,
    pageSize: 15,
    searchTerm: '',
    action: '',
    entityName: '',
  });

  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const { data, isLoading, refetch, isFetching } = useAuditLogs(query);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Insert':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Insert</span>;
      case 'Update':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Update</span>;
      case 'SoftDelete':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">SoftDelete</span>;
      case 'HardDelete':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">HardDelete</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'timestampUtc',
      header: 'Thời gian',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{new Date(row.timestampUtc).toLocaleString('vi-VN')}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Thao tác',
      width: '110px',
      render: (row) => getActionBadge(row.action),
    },
    {
      key: 'entity',
      header: 'Thực thể & Bản ghi',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{row.entityName}</span>
          <span className="text-[11px] font-mono text-slate-500 block truncate max-w-xs">{row.entityId}</span>
        </div>
      ),
    },
    {
      key: 'affectedColumns',
      header: 'Trường thay đổi',
      render: (row) => (
        <span className="text-xs text-slate-600 font-mono truncate max-w-xs block" title={row.affectedColumns || ''}>
          {row.affectedColumns || '—'}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Người thực hiện',
      width: '130px',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-800">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-medium">@{row.userName || 'System'}</span>
        </div>
      ),
    },
    {
      key: 'legalEntity',
      header: 'Pháp nhân',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <HardDrive className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{row.legalEntityCode || 'Toàn cầu'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Xem diff',
      width: '80px',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDetailId(row.id)}
          title="Xem so sánh trước/sau (Before/After Diff)"
        >
          <Eye className="h-4 w-4 text-indigo-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nhật ký Kiểm toán Hệ thống (System Audit Logs)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi, kiểm tra toàn bộ lịch sử biến động dữ liệu và bảo mật với tính năng Masking tự động cho các thông tin nhạy cảm.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{showAdvancedFilter ? 'Ẩn bộ lọc nâng cao' : 'Bộ lọc nâng cao'}</span>
          </Button>
        </div>
      </div>

      <ListToolbar
        searchTerm={query.searchTerm || ''}
        onSearchChange={(val) => setQuery((prev) => ({ ...prev, searchTerm: val, page: 1 }))}
        searchPlaceholder="Tìm theo tên thực thể, ID bản ghi, người dùng..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Bộ lọc nâng cao */}
      {showAdvancedFilter && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Loại thao tác (Action)</label>
            <select
              value={query.action || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, action: e.target.value || undefined, page: 1 }))}
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
            >
              <option value="">Tất cả thao tác</option>
              <option value="Insert">Insert (Tạo mới)</option>
              <option value="Update">Update (Cập nhật)</option>
              <option value="SoftDelete">SoftDelete (Xóa mềm)</option>
              <option value="HardDelete">HardDelete (Xóa cứng)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Tên bảng / Thực thể (Entity)</label>
            <input
              type="text"
              value={query.entityName || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, entityName: e.target.value || undefined, page: 1 }))}
              placeholder="VD: User, LegalEntity, Branch..."
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Correlation ID / Trace ID</label>
            <input
              type="text"
              value={query.correlationId || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, correlationId: e.target.value || undefined, page: 1 }))}
              placeholder="Mã luồng trace..."
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
            />
          </div>
        </div>
      )}

      {/* Bảng dữ liệu DataGrid */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <DataGrid<AuditLogItem>
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          emptyTitle="Chưa có bản ghi nhật ký kiểm toán nào"
          emptyDescription="Không có bản ghi nhật ký kiểm toán nào phù hợp với bộ lọc hiện tại."
          page={query.page || 1}
          pageSize={query.pageSize || 15}
          totalItems={data?.totalItems || 0}
          onPageChange={(p) => setQuery((prev) => ({ ...prev, page: p }))}
        />
      </div>

      {/* Drawer xem chi tiết Diff */}
      {detailId && (
        <AuditLogDetailDrawer
          logId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
};
