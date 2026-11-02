import React, { useState } from 'react';
import { Eye, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { Branch, BranchFilter } from '../branches';
import { useBranches, useDeleteBranch } from '../hooks/useBranches';
import { BranchDetailDrawer } from './BranchDetailDrawer';
import { BranchFormDrawer } from './BranchFormDrawer';

export const BranchList: React.FC = () => {
  const [query, setQuery] = useState<BranchFilter>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    sortBy: 'CreatedAtUtc',
    sortOrder: 'DESC',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useBranches(query);
  const deleteMutation = useDeleteBranch();

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

  const columns: Column<Branch>[] = [
    {
      key: 'code',
      header: 'Mã cơ sở',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
          <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>{row.code}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên cơ sở / Chi nhánh',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'legalEntity',
      header: 'Pháp nhân',
      render: (row) => (
        <span className="text-slate-600">
          {row.legalEntityCode} — {row.legalEntityName}
        </span>
      ),
    },
    {
      key: 'businessUnit',
      header: 'Đơn vị kinh doanh (BU)',
      render: (row) => (
        <span className="text-slate-600">
          {row.businessUnitCode ? `${row.businessUnitCode} — ${row.businessUnitName}` : <span className="text-slate-400 italic">Trực thuộc Pháp nhân</span>}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      render: (row) => (
        <span className="text-slate-600 text-xs truncate max-w-xs block" title={row.address ?? ''}>
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '120px',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '120px',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label={`Xem ${row.code}`}
            onClick={() => setDetailId(row.id)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Can permission="org.branch.edit">
            <button
              type="button"
              aria-label={`Sửa ${row.code}`}
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </Can>
          <Can permission="org.branch.delete">
            <button
              type="button"
              aria-label={`Ngừng ${row.code}`}
              onClick={() => setDeleting(row)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
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
        searchPlaceholder="Tìm theo mã, tên hoặc địa chỉ cơ sở..."
        onRefresh={() => {
          void refetch();
        }}
        isRefreshing={isFetching}
        primaryAction={
          <Can permission="org.branch.create">
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Tạo cơ sở / chi nhánh
            </Button>
          </Can>
        }
      />

      {isError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải danh sách cơ sở / chi nhánh đào tạo. Vui lòng thử lại.
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        <DataGrid
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          emptyTitle="Chưa có cơ sở đào tạo / chi nhánh"
          emptyDescription="Không tìm thấy cơ sở nào phù hợp với phạm vi phân quyền của bạn."
          page={data?.page ?? query.page}
          pageSize={data?.pageSize ?? query.pageSize}
          totalItems={data?.totalItems ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      )}

      <BranchFormDrawer isOpen={formOpen} onClose={() => setFormOpen(false)} branch={editing} />
      <BranchDetailDrawer id={detailId} onClose={() => setDetailId(null)} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
        title="Ngừng hoạt động cơ sở đào tạo"
        message={`Bạn có chắc chắn muốn ngừng hoạt động cơ sở "${deleting?.name ?? ''}" (${deleting?.code ?? ''})?`}
        confirmLabel="Ngừng hoạt động"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

