import React, { useState } from 'react';
import { 
  Eye, 
  Plus, 
  Edit2, 
  Trash2, 
  Layers, 
  Link2, 
  Cpu, 
  ShieldCheck, 
  Building2, 
  Users, 
  Database, 
  FileText, 
  GitBranch, 
  History,
  FolderTree
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { Module, ModuleFilter, ModuleStatus } from '../types/moduleRegistry';
import { useModules, useDeleteModule } from '../hooks/useModuleRegistry';
import { ModuleFormDrawer } from './ModuleFormDrawer';
import { ModuleDetailDrawer } from './ModuleDetailDrawer';
import { ModuleDependencyModal } from './ModuleDependencyModal';

export const ModuleList: React.FC = () => {
  const [query, setQuery] = useState<ModuleFilter>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    status: '',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [detailModuleId, setDetailModuleId] = useState<string | null>(null);
  const [dependencyModuleId, setDependencyModuleId] = useState<string | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);

  const { data, isLoading, refetch, isFetching } = useModules(query);
  const deleteMutation = useDeleteModule();

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'Beta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Beta</span>;
      case 'Deprecated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Deprecated</span>;
      case 'Inactive':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Inactive</span>;
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'Building2': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'Users': return <Users className="w-4 h-4 text-emerald-600" />;
      case 'Database': return <Database className="w-4 h-4 text-amber-600" />;
      case 'FileText': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'GitBranch': return <GitBranch className="w-4 h-4 text-pink-600" />;
      case 'History': return <History className="w-4 h-4 text-slate-600" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-cyan-600" />;
      default: return <Layers className="w-4 h-4 text-blue-600" />;
    }
  };

  const columns: Column<Module>[] = [
    {
      key: 'code',
      header: 'Mã phân hệ',
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 border border-slate-200 shrink-0">
            {renderIcon(row.icon)}
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-slate-900 block leading-tight">{row.code}</span>
            <span className="text-[10px] text-slate-500 font-mono">v{row.version}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên phân hệ & Nghiệp vụ',
      render: (row) => (
        <div>
          <span className="font-semibold text-sm text-slate-900">{row.name}</span>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'parentModuleName',
      header: 'Phân hệ cha',
      width: '170px',
      render: (row) => (
        row.parentModuleName ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <FolderTree className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{row.parentModuleName}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">-- Gốc --</span>
        )
      ),
    },
    {
      key: 'featureCount',
      header: 'Tính năng',
      width: '110px',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Cpu className="w-3 h-3" />
          {row.featureCount}
        </span>
      ),
    },
    {
      key: 'dependencyCount',
      header: 'Phụ thuộc',
      width: '110px',
      render: (row) => (
        <button
          onClick={() => setDependencyModuleId(row.id)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          title="Nhấp để xem/quản lý quan hệ phụ thuộc"
        >
          <Link2 className="w-3 h-3 text-slate-500" />
          {row.dependencyCount}
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '110px',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailModuleId(row.id)}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDependencyModuleId(row.id)}
            className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
            title="Quản lý quan hệ phụ thuộc"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <Can permission="system.module.manage">
            <button
              onClick={() => {
                setEditingModule(row);
                setFormOpen(true);
              }}
              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Chỉnh sửa"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingModule(row)}
              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Xóa phân hệ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!deletingModule) return;
    await deleteMutation.mutateAsync(deletingModule.id);
    setDeletingModule(null);
  };

  return (
    <div className="space-y-4">
      <ListToolbar
        searchTerm={query.searchTerm || ''}
        onSearchChange={(searchTerm) => setQuery((q) => ({ ...q, searchTerm, page: 1 }))}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        searchPlaceholder="Tìm kiếm theo mã, tên hoặc mô tả phân hệ..."
        filters={
          <select
            value={query.status || ''}
            onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value, page: 1 }))}
            className="px-3 py-2 text-xs border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động (Active)</option>
            <option value="Beta">Thử nghiệm (Beta)</option>
            <option value="Deprecated">Khai tử (Deprecated)</option>
            <option value="Inactive">Vô hiệu hóa (Inactive)</option>
          </select>
        }
        primaryAction={
          <Can permission="system.module.manage">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingModule(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Thêm Phân hệ
            </Button>
          </Can>
        }
      />

      <DataGrid
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        page={data?.page || 1}
        pageSize={data?.pageSize || 10}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 1}
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
        emptyTitle="Chưa có phân hệ nào được đăng ký"
        emptyDescription="Hệ thống chưa có metadata phân hệ phù hợp với bộ lọc tìm kiếm hiện tại."
      />

      {/* Form Drawer (Create / Edit) */}
      <ModuleFormDrawer
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingModule(null);
        }}
        module={editingModule}
      />

      {/* Detail Drawer */}
      <ModuleDetailDrawer
        isOpen={!!detailModuleId}
        onClose={() => setDetailModuleId(null)}
        moduleId={detailModuleId}
        onEdit={() => {
          const m = data?.items.find((item) => item.id === detailModuleId);
          if (m) {
            setDetailModuleId(null);
            setEditingModule(m);
            setFormOpen(true);
          }
        }}
        onManageDependencies={() => {
          setDependencyModuleId(detailModuleId);
        }}
      />

      {/* Dependency Modal */}
      <ModuleDependencyModal
        isOpen={!!dependencyModuleId}
        onClose={() => setDependencyModuleId(null)}
        moduleId={dependencyModuleId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa Phân hệ"
        message={`Bạn có chắc chắn muốn xóa phân hệ "${deletingModule?.name}" (${deletingModule?.code})? Hành động này sẽ thất bại nếu phân hệ đang chứa tính năng hoặc có phân hệ con trực thuộc.`}
        confirmLabel="Xác nhận Xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
