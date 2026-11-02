import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy, 
  FileCheck 
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { Skeleton } from '../../../components/common/Skeleton';
import { ConfirmDialog } from '../../../components/common/Modal';
import { toast } from 'sonner';
import { 
  PermissionMappingFilter, 
  ActionPermissionMappingView, 
  FeatureType,
  FeatureActionPermission 
} from '../types/moduleRegistry';
import { 
  usePermissionMappingCatalog, 
  useModuleHierarchy, 
  useRemoveFeatureAction 
} from '../hooks/useModuleRegistry';
import { ActionMappingDrawer } from './ActionMappingDrawer';

export const ActionPermissionMappingViewer: React.FC = () => {
  const [filter, setFilter] = useState<PermissionMappingFilter>({
    moduleId: '',
    searchTerm: '',
  });

  const [editingMapping, setEditingMapping] = useState<{
    featureId: string;
    action: FeatureActionPermission;
  } | null>(null);

  const [deletingMapping, setDeletingMapping] = useState<ActionPermissionMappingView | null>(null);

  const { data: mappings, isLoading, refetch } = usePermissionMappingCatalog(filter);
  const { data: moduleHierarchy } = useModuleHierarchy();
  const removeActionMutation = useRemoveFeatureAction();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép mã quyền: ${text}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMapping) return;
    try {
      await removeActionMutation.mutateAsync({
        featureId: deletingMapping.featureId,
        actionMappingId: deletingMapping.mappingId,
      });
      setDeletingMapping(null);
    } catch {
      // toast error handled in hook
    }
  };

  const getTypeBadge = (type: FeatureType) => {
    switch (type) {
      case 'Screen':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Screen</span>;
      case 'Component':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Component</span>;
      case 'Report':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Report</span>;
      case 'Api':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Api</span>;
      case 'BusinessProcess':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">Process</span>;
      case 'Service':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">Service</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Info Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-5 rounded-2xl border border-blue-100/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                <FileCheck className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Bản đồ Ánh xạ: Phân hệ → Tính năng → Hành động → Quyền (GBAC)
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Danh mục metadata tập trung quy định quyền hạn vận hành của từng thao tác nghiệp vụ.
              Kiểm soát phân quyền runtime (GBAC) đối chiếu trực tiếp mã quyền này từ Identity Permission Engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur px-3 py-2 rounded-xl border border-blue-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Tổng số ánh xạ</span>
              <span className="text-lg font-bold text-blue-700 font-mono">
                {mappings?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Lọc theo Phân hệ:</span>
            <select
              value={filter.moduleId || ''}
              onChange={(e) => setFilter((prev) => ({ ...prev, moduleId: e.target.value }))}
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã quyền, hành động, tính năng..."
              value={filter.searchTerm || ''}
              onChange={(e) => setFilter((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs w-72 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Mappings Table */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !mappings || mappings.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center">
          <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Chưa có bản ghi ánh xạ quyền nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Không tìm thấy bản ghi phù hợp với bộ lọc tìm kiếm. Hãy thêm hành động vào các tính năng để tạo ánh xạ quyền.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Phân hệ (Module)</th>
                  <th className="py-3 px-4">Tính năng (Feature)</th>
                  <th className="py-3 px-4">Hành động (Action)</th>
                  <th className="py-3 px-4">Mã quyền GBAC (PermissionCode)</th>
                  <th className="py-3 px-4 text-center">Trạng thái Catalog</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mappings.map((item) => (
                  <tr key={item.mappingId} className="hover:bg-slate-50/70 transition">
                    {/* Module */}
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.moduleCode}
                        </span>
                        <span className="text-slate-500 truncate max-w-[120px]">{item.moduleName}</span>
                      </div>
                    </td>

                    {/* Feature */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{item.featureName}</span>
                          {getTypeBadge(item.featureType)}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {item.featureCode}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                          {item.actionCode}
                        </span>
                        <span className="font-medium text-slate-800">{item.actionName}</span>
                        {item.isDefault && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      {item.permissionDescription && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.permissionDescription}</p>
                      )}
                    </td>

                    {/* PermissionCode */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-mono font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {item.permissionCode}
                        </span>
                        <button
                          onClick={() => handleCopy(item.permissionCode)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"
                          title="Sao chép mã quyền"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Catalog Status */}
                    <td className="py-3 px-4 text-center">
                      {item.permissionId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã liên kết ({item.permissionName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          Chưa có trong Catalog
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Can permission="system.permission_map.manage">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingMapping({
                                featureId: item.featureId,
                                action: {
                                  id: item.mappingId,
                                  featureId: item.featureId,
                                  actionCode: item.actionCode,
                                  actionName: item.actionName,
                                  permissionCode: item.permissionCode,
                                  permissionId: item.permissionId,
                                  permissionName: item.permissionName,
                                  isDefault: item.isDefault,
                                  description: item.permissionDescription,
                                  createdAtUtc: item.createdAtUtc,
                                },
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Sửa cấu hình ánh xạ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingMapping(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Gỡ ánh xạ hành động"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Mapping Edit Drawer */}
      {editingMapping && (
        <ActionMappingDrawer
          isOpen={!!editingMapping}
          onClose={() => setEditingMapping(null)}
          featureId={editingMapping.featureId}
          actionMapping={editingMapping.action}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingMapping}
        onClose={() => setDeletingMapping(null)}
        onConfirm={handleDeleteConfirm}
        title="Gỡ bỏ Ánh xạ Quyền"
        message={`Bạn có chắc muốn xóa ánh xạ cho hành động "${deletingMapping?.actionCode}" với mã quyền "${deletingMapping?.permissionCode}" không?`}
        confirmLabel="Xóa ánh xạ"
        variant="danger"
        isLoading={removeActionMutation.isPending}
      />
    </div>
  );
};
