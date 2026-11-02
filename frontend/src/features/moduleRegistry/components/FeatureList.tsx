import React, { useState } from 'react';
import { 
  Eye, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  Building2, 
  Users, 
  Database, 
  FileText, 
  GitBranch, 
  History, 
  Cpu, 
  Key, 
  Globe, 
  Filter 
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { 
  Feature, 
  FeatureFilter, 
  FeatureType, 
  FeatureStatus, 
  DataClassification 
} from '../types/moduleRegistry';
import { 
  useFeatures, 
  useDeleteFeature, 
  useModuleHierarchy 
} from '../hooks/useModuleRegistry';
import { FeatureFormDrawer } from './FeatureFormDrawer';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';

export const FeatureList: React.FC = () => {
  const [query, setQuery] = useState<FeatureFilter>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    moduleId: '',
    featureType: '',
    status: '',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [detailFeatureId, setDetailFeatureId] = useState<string | null>(null);
  const [deletingFeature, setDeletingFeature] = useState<Feature | null>(null);

  const { data, isLoading, refetch, isFetching } = useFeatures(query);
  const { data: moduleHierarchy } = useModuleHierarchy();
  const deleteMutation = useDeleteFeature();

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'Beta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Beta</span>;
      case 'Deprecated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Deprecated</span>;
      case 'Disabled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Disabled</span>;
    }
  };

  const getTypeBadge = (type: FeatureType) => {
    switch (type) {
      case 'Screen':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">Screen</span>;
      case 'Component':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">Component</span>;
      case 'Report':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">Report</span>;
      case 'Api':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">Api</span>;
      case 'BusinessProcess':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-pink-100 text-pink-800 border border-pink-200">Process</span>;
      case 'Service':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">Service</span>;
    }
  };

  const getClassificationBadge = (cls: DataClassification) => {
    switch (cls) {
      case 'Public':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Public</span>;
      case 'Internal':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Internal</span>;
      case 'Confidential':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Confidential</span>;
      case 'Restricted':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Restricted</span>;
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
      default: return <Globe className="w-4 h-4 text-blue-600" />;
    }
  };

  const columns: Column<Feature>[] = [
    {
      key: 'code',
      header: 'Mã tính năng & Loại',
      width: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 border border-slate-200 shrink-0">
            {renderIcon(row.icon || '')}
          </div>
          <div>
            <span className="font-mono font-bold text-xs text-slate-900 block leading-tight">{row.code}</span>
            <div className="mt-0.5">{getTypeBadge(row.featureType)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên tính năng & Module',
      render: (row) => (
        <div>
          <span className="font-semibold text-sm text-slate-900 block">{row.name}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center font-mono text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded border border-blue-200">
              {row.moduleCode}
            </span>
            <span className="text-xs text-slate-500 truncate">{row.moduleName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'routing',
      header: 'Route & API Endpoint',
      width: '240px',
      render: (row) => (
        <div className="space-y-1 text-xs">
          {row.routePath && (
            <div className="flex items-center gap-1 font-mono text-slate-700 truncate" title={row.routePath}>
              <span className="text-[10px] text-slate-400 font-sans">UI:</span>
              <span className="truncate">{row.routePath}</span>
            </div>
          )}
          {row.apiEndpoint && (
            <div className="flex items-center gap-1 font-mono text-blue-600 truncate" title={row.apiEndpoint}>
              <span className="text-[10px] text-slate-400 font-sans">API:</span>
              <span className="truncate">{row.apiEndpoint}</span>
            </div>
          )}
          {!row.routePath && !row.apiEndpoint && (
            <span className="text-slate-400 italic">Chưa thiết lập</span>
          )}
        </div>
      ),
    },
    {
      key: 'classification',
      header: 'Phân loại / Phụ trách',
      width: '160px',
      render: (row) => (
        <div className="space-y-1">
          <div>{getClassificationBadge(row.dataClassification)}</div>
          <span className="text-xs text-slate-600 block truncate">
            {row.ownerTeam || 'Chưa gán đội ngũ'}
          </span>
        </div>
      ),
    },
    {
      key: 'actionsCount',
      header: 'Hành động',
      width: '110px',
      align: 'center',
      render: (row) => (
        <div className="text-center">
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            <Key className="w-3 h-3" />
            {row.actionCount}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '110px',
      align: 'center',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'operations',
      header: 'Thao tác',
      width: '120px',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setDetailFeatureId(row.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Xem chi tiết & mã quyền"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Can permission="system.feature.manage">
            <button
              onClick={() => {
                setEditingFeature(row);
                setFormOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
              title="Chỉnh sửa tính năng"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingFeature(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Xóa tính năng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!deletingFeature) return;
    try {
      await deleteMutation.mutateAsync(deletingFeature.id);
      setDeletingFeature(null);
    } catch {
      // toast error handled in hook
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <ListToolbar
            searchPlaceholder="Tìm theo mã hoặc tên tính năng..."
            searchTerm={query.searchTerm || ''}
            onSearchChange={(searchTerm) => setQuery((prev) => ({ ...prev, searchTerm, page: 1 }))}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
          <Can permission="system.feature.manage">
            <Button
              variant="primary"
              onClick={() => {
                setEditingFeature(null);
                setFormOpen(true);
              }}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Đăng ký tính năng
            </Button>
          </Can>
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Phân hệ:</span>
            <select
              value={query.moduleId || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, moduleId: e.target.value, page: 1 }))}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả phân hệ</option>
              {moduleHierarchy?.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.code} - {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-600">Loại:</span>
            <select
              value={query.featureType || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, featureType: e.target.value, page: 1 }))}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="Screen">Màn hình (Screen)</option>
              <option value="Component">Thành phần (Component)</option>
              <option value="Report">Báo cáo (Report)</option>
              <option value="Api">API Endpoint</option>
              <option value="BusinessProcess">Nghiệp vụ (Process)</option>
              <option value="Service">Dịch vụ (Service)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-600">Trạng thái:</span>
            <select
              value={query.status || ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động (Active)</option>
              <option value="Beta">Thử nghiệm (Beta)</option>
              <option value="Deprecated">Sắp khai tử (Deprecated)</option>
              <option value="Disabled">Vô hiệu hóa (Disabled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <DataGrid
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        page={data?.page || 1}
        pageSize={data?.pageSize || 10}
        totalItems={data?.totalItems || 0}
        totalPages={data?.totalPages || 0}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        emptyTitle="Chưa có tính năng nào"
        emptyDescription="Hiện chưa có tính năng nào khớp với tiêu chí tìm kiếm."
        emptyAction={
          <Can permission="system.feature.manage">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingFeature(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo tính năng đầu tiên
            </Button>
          </Can>
        }
      />

      {/* Feature Form Drawer */}
      <FeatureFormDrawer
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFeature(null);
        }}
        feature={editingFeature}
        defaultModuleId={query.moduleId}
      />

      {/* Feature Detail Drawer */}
      <FeatureDetailDrawer
        isOpen={!!detailFeatureId}
        onClose={() => setDetailFeatureId(null)}
        featureId={detailFeatureId}
        onEdit={() => {
          const feat = data?.items.find((x) => x.id === detailFeatureId);
          if (feat) {
            setDetailFeatureId(null);
            setEditingFeature(feat);
            setFormOpen(true);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingFeature}
        onClose={() => setDeletingFeature(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa Tính năng"
        message={`Bạn có chắc chắn muốn xóa tính năng "${deletingFeature?.code} - ${deletingFeature?.name}" không? Thao tác này sẽ xóa toàn bộ các hành động và cấu hình quyền liên quan.`}
        confirmLabel="Xóa tính năng"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
