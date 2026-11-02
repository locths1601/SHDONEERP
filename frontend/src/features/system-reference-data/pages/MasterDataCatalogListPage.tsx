import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Power,
  CheckCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  Layers,
  ListOrdered,
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { PageContainer } from '../../../components/common/PageContainer';
import { Catalog, CatalogFilter } from '../types/referenceData';
import {
  useCatalogs,
  useDeactivateCatalog,
  useActivateCatalog,
} from '../hooks/useCatalogs';
import { CatalogDrawerForm } from '../components/CatalogDrawerForm';
import { CatalogConflictModal } from '../components/CatalogConflictModal';
import { CatalogItemsView } from '../components/CatalogItemsView';

export const MasterDataCatalogListPage: React.FC = () => {
  const [filter, setFilter] = useState<CatalogFilter>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    ownerModule: '',
    isActive: '',
    isSystem: '',
    sortBy: 'Code',
    sortOrder: 'ASC',
  });

  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [actionCatalog, setActionCatalog] = useState<{
    catalog: Catalog;
    type: 'deactivate' | 'activate';
  } | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useCatalogs(filter);
  const deactivateMutation = useDeactivateCatalog();
  const activateMutation = useActivateCatalog();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter((prev) => ({ ...prev, searchTerm: e.target.value, page: 1 }));
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter((prev) => ({ ...prev, ownerModule: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilter((prev) => ({
      ...prev,
      isActive: val === '' ? '' : val === 'true',
      page: 1,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilter((prev) => ({
      ...prev,
      isSystem: val === '' ? '' : val === 'true',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreate = () => {
    setEditingCatalog(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (catalog: Catalog) => {
    setEditingCatalog(catalog);
    setFormOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionCatalog) return;
    const { catalog, type } = actionCatalog;

    try {
      if (type === 'deactivate') {
        await deactivateMutation.mutateAsync({
          id: catalog.id,
          payload: { rowVersion: catalog.rowVersionBase64 },
        });
      } else {
        await activateMutation.mutateAsync({
          id: catalog.id,
          payload: { rowVersion: catalog.rowVersionBase64 },
        });
      }
      setActionCatalog(null);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        setActionCatalog(null);
        setConflictModalOpen(true);
      }
    }
  };

  const handleConflictReload = () => {
    setConflictModalOpen(false);
    refetch();
  };

  const columns: Column<Catalog>[] = [
    {
      key: 'code',
      header: 'Mã nhóm (Code)',
      width: '180px',
      render: (cat) => (
        <div className="font-mono font-semibold text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded inline-block border border-blue-200">
          {cat.code}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên nhóm & Mô tả',
      render: (cat) => (
        <div>
          <div className="font-medium text-slate-900">{cat.name}</div>
          {cat.description && (
            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{cat.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'ownerModule',
      header: 'Phân hệ',
      width: '120px',
      render: (cat) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Layers className="w-3 h-3 text-slate-500" />
          {cat.ownerModule}
        </span>
      ),
    },
    {
      key: 'isSystem',
      header: 'Chế độ quản trị',
      width: '160px',
      render: (cat) =>
        cat.isSystem ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-500" />
            SYSTEM_CONTROLLED
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            ADMIN_MANAGED
          </span>
        ),
    },
    {
      key: 'itemCount',
      header: 'Số giá trị',
      width: '110px',
      align: 'center',
      render: (cat) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCatalog(cat);
          }}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
          title="Xem & quản lý các giá trị con"
        >
          <ListOrdered className="w-3 h-3" />
          {cat.itemCount}
        </button>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: '120px',
      align: 'center',
      render: (cat) =>
        cat.isActive ? (
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
      width: '140px',
      align: 'right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCatalog(cat)}
              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 h-auto"
              title="Quản lý các giá trị con"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Can permission="system.reference_data.manage">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(cat)}
              className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 h-auto"
              title="Chỉnh sửa thông tin"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            {!cat.isSystem &&
              (cat.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActionCatalog({ catalog: cat, type: 'deactivate' })}
                  className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 p-1.5 h-auto"
                  title="Ngừng sử dụng nhóm danh mục"
                >
                  <Power className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActionCatalog({ catalog: cat, type: 'activate' })}
                  className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 h-auto"
                  title="Kích hoạt lại nhóm danh mục"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              ))}
          </Can>
        </div>
      ),
    },
  ];

  if (selectedCatalog) {
    return (
      <PageContainer
        title="Dữ liệu nguồn (Master Data)"
        subtitle={`Quản lý các giá trị tham chiếu thuộc nhóm danh mục [${selectedCatalog.code}].`}
      >
        <CatalogItemsView
          catalog={selectedCatalog}
          onBack={() => {
            setSelectedCatalog(null);
            refetch();
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Dữ liệu nguồn (Master Data)"
      subtitle="Quản lý các nhóm danh mục tham chiếu chuẩn hóa toàn hệ sinh thái ERP"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>

          <Can permission="system.reference_data.manage">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Thêm nhóm danh mục
            </Button>
          </Can>
        </div>
      }
    >
      {/* Thanh bộ lọc & tìm kiếm */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã code hoặc tên nhóm danh mục..."
            value={filter.searchTerm || ''}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lọc Module */}
          <select
            value={filter.ownerModule || ''}
            onChange={handleModuleChange}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tất cả phân hệ</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="ADMISSION">ADMISSION</option>
            <option value="PARTY">PARTY</option>
            <option value="CRM">CRM</option>
            <option value="ORG">ORG</option>
          </select>

          {/* Lọc Trạng thái */}
          <select
            value={filter.isActive === '' || filter.isActive === undefined ? '' : String(filter.isActive)}
            onChange={handleStatusChange}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động (ACTIVE)</option>
            <option value="false">Ngừng dùng (INACTIVE)</option>
          </select>

          {/* Lọc Loại quản trị */}
          <select
            value={filter.isSystem === '' || filter.isSystem === undefined ? '' : String(filter.isSystem)}
            onChange={handleTypeChange}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tất cả chế độ</option>
            <option value="false">ADMIN_MANAGED</option>
            <option value="true">SYSTEM_CONTROLLED</option>
          </select>
        </div>
      </div>

      {/* Error Banner nếu có lỗi API */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Không thể tải danh sách nhóm danh mục</p>
              <p className="text-xs text-rose-600 mt-0.5">{(error as any)?.message || 'Lỗi kết nối máy chủ.'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-rose-300 text-rose-700 hover:bg-rose-100">
            Thử lại
          </Button>
        </div>
      )}

      {/* DataGrid hiển thị bảng dữ liệu (Bao gồm Loading và Empty state) */}
      <DataGrid
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        page={data?.page || 1}
        pageSize={data?.pageSize || 10}
        totalItems={data?.totalCount || 0}
        totalPages={data?.totalPages || 0}
        onPageChange={handlePageChange}
        emptyTitle="Chưa có nhóm danh mục nào"
        emptyDescription="Hệ thống chưa có nhóm danh mục phù hợp với bộ lọc tìm kiếm của bạn."
        emptyAction={
          <Can permission="system.reference_data.manage">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo nhóm danh mục đầu tiên
            </Button>
          </Can>
        }
      />

      {/* Drawer Form Thêm / Sửa */}
      <CatalogDrawerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        catalog={editingCatalog}
        onConflict={() => setConflictModalOpen(true)}
      />

      {/* Dialog Xác nhận Đổi Trạng thái (Ngừng dùng / Kích hoạt) */}
      <ConfirmDialog
        isOpen={Boolean(actionCatalog)}
        onClose={() => setActionCatalog(null)}
        onConfirm={handleConfirmAction}
        title={actionCatalog?.type === 'deactivate' ? 'Ngừng sử dụng nhóm danh mục' : 'Kích hoạt lại nhóm danh mục'}
        message={
          actionCatalog?.type === 'deactivate'
            ? `Bạn có chắc chắn muốn ngừng sử dụng nhóm danh mục '${actionCatalog?.catalog.name}' (${actionCatalog?.catalog.code})? Dữ liệu lịch sử đã dùng nhóm này vẫn được bảo toàn.`
            : `Bạn có chắc chắn muốn kích hoạt lại nhóm danh mục '${actionCatalog?.catalog.name}' (${actionCatalog?.catalog.code})?`
        }
        confirmLabel={actionCatalog?.type === 'deactivate' ? 'Ngừng sử dụng' : 'Kích hoạt lại'}
        variant={actionCatalog?.type === 'deactivate' ? 'danger' : 'primary'}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
      />

      {/* Modal Xử lý Xung đột Đồng thời (409) */}
      <CatalogConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onReload={handleConflictReload}
      />
    </PageContainer>
  );
};
