import React from 'react';
import { History, ShieldAlert, Clock, User, HardDrive, Key, Globe } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { useAuditLogDetail } from '../hooks/useAuditLogs';

interface AuditLogDetailDrawerProps {
  logId: string;
  onClose: () => void;
}

export const AuditLogDetailDrawer: React.FC<AuditLogDetailDrawerProps> = ({ logId, onClose }) => {
  const { data: log, isLoading } = useAuditLogDetail(logId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-2xl bg-white shadow-2xl p-6 flex items-center justify-center">
          <div className="text-sm text-slate-500">Đang tải chi tiết nhật ký kiểm toán...</div>
        </div>
      </div>
    );
  }

  if (!log) return null;

  // Phân giải Before/After JSON
  let oldObj: Record<string, unknown> = {};
  let newObj: Record<string, unknown> = {};

  try {
    if (log.oldValues) oldObj = JSON.parse(log.oldValues);
  } catch {
    oldObj = { _raw: log.oldValues };
  }

  try {
    if (log.newValues) newObj = JSON.parse(log.newValues);
  } catch {
    newObj = { _raw: log.newValues };
  }

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Insert':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-semibold">Tạo mới (Insert)</span>;
      case 'Update':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-semibold">Cập nhật (Update)</span>;
      case 'SoftDelete':
        return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded font-semibold">Xóa mềm (SoftDelete)</span>;
      case 'HardDelete':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded font-semibold">Xóa vĩnh viễn (HardDelete)</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-semibold">{action}</span>;
    }
  };

  const renderValue = (val: unknown) => {
    if (val === undefined || val === null) {
      return <span className="text-slate-400 italic font-mono text-[11px]">null</span>;
    }
    if (typeof val === 'string' && val === '***MASKED***') {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 font-bold">
          <ShieldAlert className="h-3 w-3 shrink-0" />
          <span>***MASKED***</span>
        </span>
      );
    }
    if (typeof val === 'object') {
      return <span className="font-mono text-xs text-slate-700">{JSON.stringify(val)}</span>;
    }
    return <span className="font-mono text-xs text-slate-800 break-all">{String(val)}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Chi tiết Thay đổi Kiểm toán</h2>
                {getActionBadge(log.action)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thực thể: <span className="font-semibold text-slate-800">{log.entityName}</span> • ID:{' '}
                <span className="font-mono text-slate-700">{log.entityId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Thời gian (UTC)</span>
              </span>
              <p className="font-medium text-slate-800">{new Date(log.timestampUtc).toLocaleString('vi-VN')}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Người thực hiện</span>
              </span>
              <p className="font-medium text-slate-800">@{log.userName || 'System'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                <span>Pháp nhân</span>
              </span>
              <p className="font-medium text-slate-800">{log.legalEntityCode || 'Toàn cầu / N/A'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span>Địa chỉ IP</span>
              </span>
              <p className="font-mono text-slate-800">{log.ipAddress || 'Internal'}</p>
            </div>

            <div className="space-y-0.5 col-span-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-slate-400" />
                <span>Correlation / Trace ID</span>
              </span>
              <p className="font-mono text-slate-800 break-all">{log.correlationId || log.traceId || 'N/A'}</p>
            </div>
          </div>

          {/* Diff Viewer Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                So sánh Dữ liệu Trước & Sau (Before / After Diff)
              </h3>
              <span className="text-xs text-slate-500">{allKeys.length} trường dữ liệu</span>
            </div>

            {allKeys.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-1/4">Trường (Field)</th>
                      <th className="py-2 px-3 w-3/8 border-l border-slate-200">Giá trị trước (Old)</th>
                      <th className="py-2 px-3 w-3/8 border-l border-slate-200">Giá trị sau (New)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allKeys.map((k) => {
                      const oldVal = oldObj[k];
                      const newVal = newObj[k];
                      const isAdded = oldVal === undefined && newVal !== undefined;
                      const isDeleted = oldVal !== undefined && newVal === undefined;
                      const isModified =
                        oldVal !== undefined &&
                        newVal !== undefined &&
                        JSON.stringify(oldVal) !== JSON.stringify(newVal);

                      let rowBg = 'hover:bg-slate-50';
                      if (isModified) rowBg = 'bg-amber-50/50 hover:bg-amber-50';
                      else if (isAdded) rowBg = 'bg-emerald-50/40 hover:bg-emerald-50';
                      else if (isDeleted) rowBg = 'bg-rose-50/40 hover:bg-rose-50';

                      return (
                        <tr key={k} className={`transition-colors ${rowBg}`}>
                          <td className="py-2 px-3 font-mono font-medium text-slate-800 align-top">
                            {k}
                            {isModified && (
                              <span className="block text-[10px] text-amber-600 font-sans font-normal">Đã sửa đổi</span>
                            )}
                            {isAdded && (
                              <span className="block text-[10px] text-emerald-600 font-sans font-normal">Trường mới</span>
                            )}
                            {isDeleted && (
                              <span className="block text-[10px] text-rose-600 font-sans font-normal">Đã xóa</span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 align-top bg-white/50">
                            {renderValue(oldVal)}
                          </td>
                          <td className="py-2 px-3 border-l border-slate-200 align-top bg-white/50">
                            {renderValue(newVal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                Không có dữ liệu diff trước/sau cho bản ghi kiểm toán này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

