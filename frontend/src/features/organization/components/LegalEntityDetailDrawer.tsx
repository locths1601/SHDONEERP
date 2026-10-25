import React from 'react';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Skeleton } from '../../../components/common/Skeleton';
import { useLegalEntityDetail } from '../hooks/useLegalEntities';
import { formatDate } from '../../../lib/utils';
import { Building2, Mail, Phone, Globe, MapPin, Edit3, GitFork, Layers } from 'lucide-react';
import { Can } from '../../../components/common/AuthGuards';

interface Props {
  entityId: string | null;
  onClose: () => void;
  onEdit: () => void;
}

export const LegalEntityDetailDrawer: React.FC<Props> = ({ entityId, onClose, onEdit }) => {
  const { data: entity, isLoading } = useLegalEntityDetail(entityId || undefined);

  if (!entityId) return null;

  return (
    <SideDrawer
      isOpen={!!entityId}
      onClose={onClose}
      title="Chi tiết Pháp nhân"
      subtitle={entity?.code || 'Đang tải...'}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Can permission="org.legal_entity.edit">
            <Button size="sm" onClick={onEdit} icon={<Edit3 className="w-4 h-4" />}>
              Chỉnh sửa
            </Button>
          </Can>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : entity ? (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                {entity.code}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2">{entity.name}</h2>
              {entity.tradingName && (
                <p className="text-xs text-slate-500 mt-0.5">Tên thương mại: {entity.tradingName}</p>
              )}
            </div>
            <div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  entity.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : entity.status === 'Inactive'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {entity.status === 'Active'
                  ? 'Đang hoạt động'
                  : entity.status === 'Inactive'
                  ? 'Tạm ngưng'
                  : 'Giải thể'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Đơn vị kinh doanh</span>
                <span className="text-lg font-bold text-slate-900">{entity.businessUnitCount}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Chi nhánh / Cơ sở</span>
                <span className="text-lg font-bold text-slate-900">{entity.branchCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin liên hệ & Pháp lý</h4>

            <div className="flex items-center gap-3 text-slate-700">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Mã số thuế: <strong className="text-slate-900">{entity.taxCode || '—'}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Điện thoại: {entity.phoneNumber || '—'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Email: {entity.email || '—'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Website: {entity.website ? <a href={entity.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{entity.website}</a> : '—'}</span>
            </div>

            <div className="flex items-start gap-3 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>Địa chỉ: {entity.address || '—'}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 space-y-1">
            <p>Khởi tạo: {formatDate(entity.createdAtUtc)}</p>
            {entity.updatedAtUtc && <p>Cập nhật lần cuối: {formatDate(entity.updatedAtUtc)}</p>}
          </div>
        </div>
      ) : null}
    </SideDrawer>
  );
};
