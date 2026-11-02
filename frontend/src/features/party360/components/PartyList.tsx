import React, { useState } from 'react';
import { Plus, Eye, Trash2, User, Building } from 'lucide-react';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/Modal';
import { Can } from '../../../components/common/AuthGuards';
import { formatDate } from '../../../lib/utils';
import { PartyListItemDto, PartyFilterQuery } from '../types';
import { usePartiesPaged, useDeleteParty } from '../hooks/useParties';
import { PartyFormDrawer } from './PartyFormDrawer';
import { PartyDetailDrawer } from './PartyDetailDrawer';

export const PartyList: React.FC = () => {
  const [query, setQuery] = useState<PartyFilterQuery>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    partyType: '',
    status: '',
    sortBy: 'CreatedAtUtc',
    sortOrder: 'DESC',
  });

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [detailPartyId, setDetailPartyId] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<PartyListItemDto | null>(null);

  const { data, isLoading, refetch, isFetching } = usePartiesPaged(query);
  const deleteMutation = useDeleteParty();

  const handleSearchChange = (searchTerm: string) => {
    setQuery((prev) => ({ ...prev, searchTerm, pageNumber: 1 }));
  };

  const handleStatusFilterChange = (status: string) => {
    setQuery((prev) => ({ ...prev, status, pageNumber: 1 }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, pageNumber: page }));
  };

  const handleOpenCreate = () => {
    setFormDrawerOpen(true);
  };

  const handleOpenDetail = (party: PartyListItemDto) => {
    setDetailPartyId(party.id);
  };

  const handleOpenDelete = (party: PartyListItemDto) => {
    setPartyToDelete(party);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (partyToDelete) {
      deleteMutation.mutate(partyToDelete.id, {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setPartyToDelete(null);
        },
      });
    }
  };

  const columns: Column<PartyListItemDto>[] = [
    {
      key: 'code',
      header: 'Mã định danh',
      width: '140px',
      render: (row) => (
        <span
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          onClick={() => handleOpenDetail(row)}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: 'partyType',
      header: 'Loại Party',
      width: '130px',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            row.partyType === 'Person'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}
        >
          {row.partyType === 'Person' ? <User className="w-3 h-3" /> : <Building className="w-3 h-3" />}
          {row.partyType === 'Person' ? 'Cá nhân' : 'Tổ chức'}
        </span>
      ),
    },
    {
      key: 'displayName',
      header: 'Họ tên / Tên tổ chức',
      render: (row) => <span className="font-semibold text-slate-800">{row.displayName}</span>,
    },
    {
      key: 'email',
      header: 'Email chính',
      width: '180px',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate block max-w-[170px]">{row.primaryEmail || '—'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      width: '130px',
      render: (row) => <span className="text-xs text-slate-600">{row.primaryPhone || '—'}</span>,
    },
    {
      key: 'roles',
      header: 'Vai trò',
      width: '100px',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
          {row.roleCount} vai trò
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '120px',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {row.status === 'Active' ? 'Hoạt động' : row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      width: '130px',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAtUtc)}</span>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '100px',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDetail(row)}
            title="Xem chi tiết 360"
            className="p-1.5 text-slate-500 hover:text-blue-600"
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Can permission="party.profile.edit">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDelete(row)}
              title="Xóa hồ sơ"
              className="p-1.5 text-slate-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* List Toolbar */}
      <ListToolbar
        searchTerm={query.searchTerm || ''}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Tìm theo mã, họ tên, công ty, email, SĐT..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        filters={
          <select
            value={query.status || ''}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Tạm ngưng</option>
          </select>
        }
        primaryAction={
          <Can permission="party.profile.create">
            <Button size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
              Thêm hồ sơ Party
            </Button>
          </Can>
        }
      />

      {/* Filter tabs by Party Type */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setQuery((prev) => ({ ...prev, partyType: '', pageNumber: 1 }))}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            !query.partyType ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả đối tượng
        </button>
        <button
          onClick={() => setQuery((prev) => ({ ...prev, partyType: 'Person', pageNumber: 1 }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            query.partyType === 'Person' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Học viên & Cá nhân (Person)
        </button>
        <button
          onClick={() => setQuery((prev) => ({ ...prev, partyType: 'Organization', pageNumber: 1 }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            query.partyType === 'Organization' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Đối tác & Tổ chức (Organization)
        </button>
      </div>

      {/* Main DataGrid */}
      <DataGrid
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        page={data?.page || 1}
        pageSize={data?.pageSize || 10}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        onPageChange={handlePageChange}
      />

      {/* Create Form Drawer */}
      <PartyFormDrawer isOpen={formDrawerOpen} onClose={() => setFormDrawerOpen(false)} />

      {/* Detail 360 Drawer */}
      <PartyDetailDrawer partyId={detailPartyId} onClose={() => setDetailPartyId(null)} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hồ sơ Party"
        message={`Bạn có chắc chắn muốn xóa hồ sơ '${partyToDelete?.displayName}' (${partyToDelete?.code})? Hành động này sẽ được ghi nhận vào nhật ký kiểm toán.`}
        confirmLabel="Xóa hồ sơ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

