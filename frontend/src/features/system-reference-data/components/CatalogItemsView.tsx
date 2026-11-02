import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Power,
  CheckCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  Layers,
  FileCode,
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { Catalog, ReferenceDataItem, ItemFilter } from '../types/referenceData';
import {
  useItems,
  useDeactivateItem,
  useActivateItem,
} from '../hooks/useItems';
import { ItemDrawerForm } from './ItemDrawerForm';
import { CatalogConflictModal } from './CatalogConflictModal';

interface CatalogItemsViewProps {
  catalog: Catalog;
  onBack: () => void;
}

export const CatalogItemsView: React.FC<CatalogItemsViewProps> = ({ catalog, onBack }) => {
  const [filter, setFilter] = useState<ItemFilter>({
    catalogId: catalog.id,
    page: 1,
    pageSize: 10,
    searchTerm: '',
    isActive: '',
    sortBy: 'DisplayOrder',
    sortOrder: 'ASC',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceDataItem | null>(null);
  const [actionItem, setActionItem] = useState<{
    item: ReferenceDataItem;
    type: 'deactivate' | 'activate';
  } | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useItems(catalog.id, filter);
  const deactivateMutation = useDeactivateItem(catalog.id);
  const activateMutation = useActivateItem(catalog.id);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, searchTerm: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilter((prev) => ({
      ...prev,
      isActive: val === '' ? '' : val === 'true',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: ReferenceDataItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    const { item, type } = actionItem;

    try {
      if (type === 'deactivate') {
        await deactivateMutation.mutateAsync({
          itemId: item.id,
          payload: { rowVersion: item.rowVersionBase64 },
        });
      } else {
        await activateMutation.mutateAsync({
          itemId: item.id,
          payload: { rowVersion: item.rowVersionBase64 },
        });
      }
      setActionItem(null);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        setActionItem(null);
        setConflictModalOpen(true);
      }
    }
  };

  const isMutating = deactivateMutation.isPending || activateMutation.isPending;
  const isCatalogInactive = !catalog.isActive;

  const columns: Column<ReferenceDataItem>[] = [
    {
      key: 'displayOrder',
      header: 'Thứ tự',
      width: '80px',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {item.displayOrder}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Mã giá trị (Code)',
      width: '180px',
      render: (item) => (
        <div className="font-mono font-semibold text-emerald-900 text-xs bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-200">
          {item.code}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên giá trị & Thông tin phụ',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-900">{item.name}</div>
          {item.parentItemCode && (
            <div className="text-xs text-slate-500 mt-0.5">
              Mục cha:{' '}
              <span className="font-mono font-medium text-slate-700">
                [{item.parentItemCode}] {item.parentItemName}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Giá trị nghiệp vụ (Value)',
      width: '180px',
      render: (item) =>
        item.value ? (
          <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {item.value}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">-- Chưa đặt --</span>
        ),
    },
    {
      key: 'metadataJson',
      header: 'Metadata',
      width: '110px',
      align: 'center',
      render: (item) =>
        item.metadataJson ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200"
            title={item.metadataJson}
          >
            <FileCode className="w-3 h-3 text-amber-500" />
            JSON
          </span>
        ) : (
          <span className="text-xs text-slate-300">--</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: '120px',
      align: 'center',
      render: (item) =>
        item.isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            INACTIVE
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '130px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Can permission="system.reference_data.manage">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(item)}
              disabled={isCatalogInactive}
              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 h-auto disabled:opacity-40"
              title={isCatalogInactive ? 'Nhóm danh mục đang ngừng hoạt động' : 'Chỉnh sửa'}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            {item.isActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionItem({ item, type: 'deactivate' })}
                disabled={isCatalogInactive}
                className="text-slate-600 hover:text-amber-600 hover:bg-amber-50 p-1.5 h-auto disabled:opacity-40"
                title={isCatalogInactive ? 'Nhóm danh mục đang ngừng hoạt động' : 'Vô hiệu hóa'}
              >
                <Power className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionItem({ item, type: 'activate' })}
                disabled={isCatalogInactive}
                className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 h-auto disabled:opacity-40"
                title={isCatalogInactive ? 'Nhóm danh mục đang ngừng hoạt động' : 'Kích hoạt lại'}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Header & Catalog Context Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh mục
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {catalog.code}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{catalog.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {catalog.description || 'Không có mô tả chi tiết'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Phân hệ: {catalog.ownerModule}
            </span>

            {catalog.isSystem ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                SYSTEM_CONTROLLED
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                ADMIN_MANAGED
              </span>
            )}

            {catalog.isActive ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                INACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Warning banner nếu Catalog đang bị Inactive */}
        {isCatalogInactive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Cảnh báo:</strong> Nhóm danh mục này đang ở trạng thái ngừng sử dụng (INACTIVE). Các thao tác thêm mới và cập nhật giá trị con đã bị khóa.
            </span>
          </div>
        )}
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên giá trị..."
              value={filter.searchTerm || ''}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <select
            value={filter.isActive === '' || filter.isActive === undefined ? '' : String(filter.isActive)}
            onChange={handleStatusChange}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động (ACTIVE)</option>
            <option value="false">Ngừng sử dụng (INACTIVE)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-slate-600 border-slate-300"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Can permission="system.reference_data.manage">
            <Button
              onClick={handleOpenCreate}
              disabled={isCatalogInactive}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Thêm giá trị
            </Button>
          </Can>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold">Lỗi tải danh sách giá trị danh mục</div>
            <div className="text-xs mt-0.5 text-red-700">
              {(error as any)?.message || 'Không thể kết nối đến máy chủ API.'}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 text-red-700">
            Thử lại
          </Button>
        </div>
      )}

      {/* Items DataGrid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <DataGrid<ReferenceDataItem>
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          totalItems={data?.totalCount || 0}
          totalPages={data?.totalPages || 0}
          page={data?.page || filter.page}
          pageSize={data?.pageSize || filter.pageSize}
          onPageChange={handlePageChange}
          emptyTitle={`Chưa có giá trị nào trong nhóm [${catalog.code}]`}
          emptyDescription='Nhấn "+ Thêm giá trị" để tạo mục đầu tiên.'
        />
      </div>

      {/* Item Drawer Form */}
      <ItemDrawerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        catalogId={catalog.id}
        catalogCode={catalog.code}
        catalogName={catalog.name}
        item={editingItem}
        existingItems={data?.items || []}
        onConflict={() => setConflictModalOpen(true)}
      />

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionItem)}
        onClose={() => setActionItem(null)}
        onConfirm={handleConfirmAction}
        isLoading={isMutating}
        title={
          actionItem?.type === 'deactivate'
            ? 'Xác nhận ngừng sử dụng giá trị'
            : 'Xác nhận kích hoạt lại giá trị'
        }
        message={
          actionItem?.type === 'deactivate'
            ? `Bạn có chắc chắn muốn vô hiệu hóa giá trị [${actionItem?.item.code}] ${actionItem?.item.name}? Giá trị này sẽ không còn xuất hiện trong các danh mục lựa chọn mới.`
            : `Bạn có chắc chắn muốn kích hoạt lại giá trị [${actionItem?.item.code}] ${actionItem?.item.name}?`
        }
        confirmLabel={actionItem?.type === 'deactivate' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
        variant={actionItem?.type === 'deactivate' ? 'danger' : 'primary'}
      />

      {/* 409 Conflict Modal */}
      <CatalogConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onReload={() => {
          setConflictModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
