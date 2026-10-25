import React, { useState } from 'react';
import { Plus, Eye, Edit2, Trash2, Building } from 'lucide-react';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/Modal';
import { Can } from '../../../components/common/AuthGuards';
import { formatDate } from '../../../lib/utils';
import { LegalEntityDto, LegalEntityFilterQuery } from '../types';
import { useLegalEntitiesPaged, useDeleteLegalEntity } from '../hooks/useLegalEntities';
import { LegalEntityFormDrawer } from './LegalEntityFormDrawer';
import { LegalEntityDetailDrawer } from './LegalEntityDetailDrawer';

export const LegalEntityList: React.FC = () => {
  const [query, setQuery] = useState<LegalEntityFilterQuery>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    status: '',
    sortBy: 'CreatedAtUtc',
    sortOrder: 'DESC',
  });

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [selectedEntityForEdit, setSelectedEntityForEdit] = useState<LegalEntityDto | null>(null);

  const [detailEntityId, setDetailEntityId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<LegalEntityDto | null>(null);

  const { data, isLoading, refetch, isFetching } = useLegalEntitiesPaged(query);
  const deleteMutation = useDeleteLegalEntity();

  const handleSearchChange = (searchTerm: string) => {
    setQuery((prev) => ({ ...prev, searchTerm, page: 1 }));
  };

  const handleStatusFilterChange = (status: string) => {
    setQuery((prev) => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const handleOpenCreate = () => {
    setSelectedEntityForEdit(null);
    setFormDrawerOpen(true);
  };

  const handleOpenEdit = (entity: LegalEntityDto) => {
    setSelectedEntityForEdit(entity);
    setFormDrawerOpen(true);
  };

  const handleOpenDelete = (entity: LegalEntityDto) => {
    setEntityToDelete(entity);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (entityToDelete) {
      await deleteMutation.mutateAsync(entityToDelete.id);
      setDeleteConfirmOpen(false);
      setEntityToDelete(null);
    }
  };

  const columns: Column<LegalEntityDto>[] = [
    {
      key: 'code',
      header: 'Mã Pháp nhân',
      width: '160px',
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên Pháp nhân / Đơn vị',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          {row.tradingName && <span className="text-xs text-slate-400 block">{row.tradingName}</span>}
        </div>
      ),
    },
    {
      key: 'taxCode',
      header: 'Mã số thuế',
      width: '140px',
      render: (row) => <span className="text-slate-600 font-mono text-xs">{row.taxCode || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      width: '190px',
      render: (row) => (
        <div className="text-xs text-slate-500 space-y-0.5">
          {row.phoneNumber && <div>{row.phoneNumber}</div>}
          {row.email && <div className="truncate text-slate-400">{row.email}</div>}
          {!row.phoneNumber && !row.email && <div>—</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '130px',
      render: (row) => {
        const isAct = row.status === 'Active';
        const isLiq = row.status === 'UnderLiquidation';
        return (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-block ${
              isAct
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isLiq
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isAct ? 'Hoạt động' : isLiq ? 'Giải thể' : 'Tạm ngưng'}
          </span>
        );
      },
    },
    {
      key: 'createdAtUtc',
      header: 'Ngày tạo',
      width: '140px',
      render: (row) => <span className="text-xs text-slate-400">{formatDate(row.createdAtUtc)}</span>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '120px',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDetailEntityId(row.id)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Can permission="org.legal_entity.edit">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
              title="Chỉnh sửa"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </Can>
          <Can permission="org.legal_entity.delete">
            <button
              onClick={() => handleOpenDelete(row)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ListToolbar
        searchTerm={query.searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm kiếm theo mã, tên, MST, email..."
        onRefresh={refetch}
        isRefreshing={isFetching}
        filters={
          <select
            value={query.status || ''}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Inactive">Tạm ngưng</option>
            <option value="UnderLiquidation">Đang giải thể</option>
          </select>
        }
        primaryAction={
          <Can permission="org.legal_entity.create">
            <Button size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
              Thêm Pháp nhân
            </Button>
          </Can>
        }
      />

      <DataGrid
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        page={data?.page || 1}
        pageSize={data?.pageSize || 10}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        onPageChange={handlePageChange}
        onRowClick={(row) => setDetailEntityId(row.id)}
        emptyTitle="Chưa có pháp nhân nào"
        emptyDescription="Hệ thống chưa ghi nhận pháp nhân nào hoặc bộ lọc hiện tại không có kết quả."
        emptyAction={
          <Can permission="org.legal_entity.create">
            <Button size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
              Thêm Pháp nhân đầu tiên
            </Button>
          </Can>
        }
      />

      <LegalEntityFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        entityToEdit={selectedEntityForEdit}
      />

      <LegalEntityDetailDrawer
        entityId={detailEntityId}
        onClose={() => setDetailEntityId(null)}
        onEdit={() => {
          if (detailEntityId && data?.items) {
            const found = data.items.find((x) => x.id === detailEntityId);
            if (found) {
              setDetailEntityId(null);
              handleOpenEdit(found);
            }
          }
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Pháp nhân"
        message={`Bạn có chắc chắn muốn xóa pháp nhân "${entityToDelete?.name}" (${entityToDelete?.code})? Hành động này sẽ chuyển trạng thái pháp nhân sang đã xóa mềm.`}
        confirmLabel="Xác nhận xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
