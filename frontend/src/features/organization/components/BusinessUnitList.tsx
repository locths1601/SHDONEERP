import React, { useState } from 'react';
import { Eye, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { BusinessUnit, BusinessUnitFilter } from '../businessUnits';
import { useBusinessUnits, useDeleteBusinessUnit } from '../hooks/useBusinessUnits';
import { BusinessUnitDetailDrawer } from './BusinessUnitDetailDrawer';
import { BusinessUnitFormDrawer } from './BusinessUnitFormDrawer';

export const BusinessUnitList: React.FC = () => {
  const [query, setQuery] = useState<BusinessUnitFilter>({ page: 1, pageSize: 10, searchTerm: '', sortBy: 'CreatedAtUtc', sortOrder: 'DESC' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BusinessUnit | null>(null);
  const { data, isLoading, isError, refetch, isFetching } = useBusinessUnits(query);
  const deleteMutation = useDeleteBusinessUnit();

  const columns: Column<BusinessUnit>[] = [
    { key: 'code', header: 'Mã đơn vị', width: '150px', render: (row) => <span className="font-mono font-semibold">{row.code}</span> },
    { key: 'name', header: 'Tên đơn vị', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'legalEntity', header: 'Pháp nhân', render: (row) => <span>{row.legalEntityCode} — {row.legalEntityName}</span> },
    { key: 'status', header: 'Trạng thái', width: '130px', render: (row) => <span>{row.status === 'Active' ? 'Hoạt động' : row.status === 'Inactive' ? 'Tạm ngưng' : 'Đang giải thể'}</span> },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '120px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <button type="button" aria-label={`Xem ${row.code}`} onClick={() => setDetailId(row.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <Eye className="h-4 w-4" />
          </button>
          <Can permission="org.business_unit.edit">
            <button type="button" aria-label={`Sửa ${row.code}`} onClick={() => { setEditing(row); setFormOpen(true); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <Edit2 className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="org.business_unit.delete">
            <button type="button" aria-label={`Ngừng ${row.code}`} onClick={() => setDeleting(row)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <>
      <ListToolbar
        searchTerm={query.searchTerm}
        onSearchChange={(searchTerm) => setQuery((current) => ({ ...current, searchTerm, page: 1 }))}
        searchPlaceholder="Tìm theo mã hoặc tên đơn vị..."
        onRefresh={() => { void refetch(); }}
        isRefreshing={isFetching}
        primaryAction={
          <Can permission="org.business_unit.create">
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Tạo đơn vị</Button>
          </Can>
        }
      />
      {isError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải danh sách đơn vị kinh doanh. Vui lòng thử lại.
          <Button variant="outline" size="sm" onClick={() => { void refetch(); }}>Thử lại</Button>
        </div>
      ) : (
        <DataGrid
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="Chưa có đơn vị kinh doanh"
          emptyDescription="Không có dữ liệu phù hợp với phạm vi quyền hiện tại."
          page={data?.page ?? query.page}
          pageSize={data?.pageSize ?? query.pageSize}
          totalItems={data?.totalItems ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      )}

      <BusinessUnitFormDrawer isOpen={formOpen} onClose={() => setFormOpen(false)} businessUnit={editing} />
      <BusinessUnitDetailDrawer id={detailId} onClose={() => setDetailId(null)} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
        title="Ngừng đơn vị kinh doanh"
        message={`Bạn có chắc muốn ngừng "${deleting?.name ?? ''}"? Thao tác không xóa dữ liệu chi nhánh.`}
        confirmLabel="Ngừng hoạt động"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
