import React from 'react';
import { SideDrawer } from '../../../components/common/Modal';
import { useBusinessUnitDetail } from '../hooks/useBusinessUnits';

interface Props {
  id: string | null;
  onClose: () => void;
}

export const BusinessUnitDetailDrawer: React.FC<Props> = ({ id, onClose }) => {
  const { data, isLoading, isError } = useBusinessUnitDetail(id ?? undefined);

  return (
    <SideDrawer isOpen={Boolean(id)} onClose={onClose} title="Chi tiết đơn vị kinh doanh" subtitle={data?.code}>
      {isLoading && <p role="status" className="text-sm text-slate-500">Đang tải dữ liệu…</p>}
      {isError && <p role="alert" className="text-sm text-red-600">Không thể tải chi tiết. Vui lòng thử lại.</p>}
      {data && (
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div><dt className="text-slate-500">Mã đơn vị</dt><dd className="font-medium">{data.code}</dd></div>
          <div><dt className="text-slate-500">Tên đơn vị</dt><dd className="font-medium">{data.name}</dd></div>
          <div><dt className="text-slate-500">Pháp nhân</dt><dd className="font-medium">{data.legalEntityCode} — {data.legalEntityName}</dd></div>
          <div><dt className="text-slate-500">Trạng thái</dt><dd className="font-medium">{data.status}</dd></div>
          <div><dt className="text-slate-500">Số chi nhánh</dt><dd className="font-medium">{data.branchCount}</dd></div>
        </dl>
      )}
    </SideDrawer>
  );
};
