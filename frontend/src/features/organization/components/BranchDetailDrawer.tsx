import React from 'react';
import { SideDrawer } from '../../../components/common/Modal';
import { useBranchDetail } from '../hooks/useBranches';

interface Props {
  id: string | null;
  onClose: () => void;
}

export const BranchDetailDrawer: React.FC<Props> = ({ id, onClose }) => {
  const { data, isLoading, isError } = useBranchDetail(id ?? undefined);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Hoạt động</span>;
      case 'Inactive':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Tạm ngưng</span>;
      case 'UnderLiquidation':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Đang giải thể</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <SideDrawer isOpen={Boolean(id)} onClose={onClose} title="Chi tiết cơ sở đào tạo / Chi nhánh" subtitle={data?.code}>
      {isLoading && <p role="status" className="text-sm text-slate-500">Đang tải dữ liệu…</p>}
      {isError && <p role="alert" className="text-sm text-red-600">Không thể tải chi tiết. Vui lòng thử lại.</p>}
      {data && (
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 font-medium">Mã cơ sở</dt>
            <dd className="font-mono font-semibold text-slate-900 mt-0.5">{data.code}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Tên cơ sở / Chi nhánh</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{data.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Pháp nhân chủ quản</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {data.legalEntityCode} — {data.legalEntityName}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Đơn vị kinh doanh (BU)</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {data.businessUnitId
                ? `${data.businessUnitCode} — ${data.businessUnitName}`
                : <span className="text-slate-400 italic">Trực thuộc Pháp nhân</span>}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Địa chỉ cơ sở</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {data.address || <span className="text-slate-400 italic">Chưa cập nhật</span>}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Trạng thái</dt>
            <dd className="mt-1">{getStatusBadge(data.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Ngày tạo (UTC)</dt>
            <dd className="font-mono text-xs text-slate-700 mt-0.5">{new Date(data.createdAtUtc).toLocaleString('vi-VN')}</dd>
          </div>
          {data.updatedAtUtc && (
            <div>
              <dt className="text-slate-500 font-medium">Cập nhật lần cuối</dt>
              <dd className="font-mono text-xs text-slate-700 mt-0.5">{new Date(data.updatedAtUtc).toLocaleString('vi-VN')}</dd>
            </div>
          )}
        </dl>
      )}
    </SideDrawer>
  );
};

