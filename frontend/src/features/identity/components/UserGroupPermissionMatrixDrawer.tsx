import React, { useEffect, useState } from 'react';
import { Shield, CheckSquare, Square, Save, Filter } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { PermissionItem } from '../types/userGroup';
import {
  useAllPermissions,
  useUserGroupPermissions,
  useUpdateGroupPermissions,
} from '../hooks/useUserGroups';

interface UserGroupPermissionMatrixDrawerProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export const UserGroupPermissionMatrixDrawer: React.FC<UserGroupPermissionMatrixDrawerProps> = ({
  groupId,
  groupName,
  onClose,
}) => {
  const { data: allPermissions, isLoading: isLoadingAll } = useAllPermissions();
  const { data: grantedPermissions, isLoading: isLoadingGranted } = useUserGroupPermissions(groupId);
  const updateMutation = useUpdateGroupPermissions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  useEffect(() => {
    if (grantedPermissions) {
      setSelectedIds(new Set(grantedPermissions.map((p) => p.permissionId)));
    }
  }, [grantedPermissions]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleModule = (modulePermissions: PermissionItem[], selectAll: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      modulePermissions.forEach((p) => {
        if (selectAll) {
          next.add(p.id);
        } else {
          next.delete(p.id);
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: groupId,
      request: {
        permissionIds: Array.from(selectedIds),
      },
    });
    onClose();
  };

  // Lọc permissions
  const filteredPermissions = (allPermissions || []).filter((p) => {
    const matchSearch =
      searchTerm === '' ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchModule = selectedModule === 'ALL' || p.module === selectedModule;
    return matchSearch && matchModule;
  });

  // Gom nhóm theo module
  const groupedByModule = filteredPermissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    const mod = p.module || 'Other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const modules = Array.from(new Set((allPermissions || []).map((p) => p.module)));

  const isLoading = isLoadingAll || isLoadingGranted;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Ma trận Cấp quyền trực tiếp</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấp quyền cho nhóm: <span className="font-semibold text-slate-800">{groupName}</span> • Đã chọn:{' '}
              <span className="font-bold text-emerald-700">{selectedIds.size}</span> quyền hạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toolbar lọc */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã quyền, tên quyền..."
            className="px-3 py-1.5 text-xs rounded border border-slate-300 focus:ring-emerald-200"
          />
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="ALL">Tất cả Phân hệ ({modules.length})</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh sách Ma trận theo Modules */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">Đang tải danh mục quyền hạn...</div>
          ) : Object.keys(groupedByModule).length > 0 ? (
            Object.entries(groupedByModule).map(([moduleName, perms]) => {
              const allSelected = perms.every((p) => selectedIds.has(p.id));

              return (
                <div key={moduleName} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Module header */}
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {moduleName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({perms.filter((p) => selectedIds.has(p.id)).length}/{perms.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleModule(perms, !allSelected)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      {allSelected ? (
                        <>
                          <Square className="h-3.5 w-3.5" />
                          <span>Bỏ chọn module</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Chọn tất cả module</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quyền trong module */}
                  <div className="divide-y divide-slate-100">
                    {perms.map((p) => {
                      const isChecked = selectedIds.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(p.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.code}
                              </span>
                              <span className="text-xs font-medium text-slate-800">{p.name}</span>
                            </div>
                            {p.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">Không tìm thấy quyền nào phù hợp.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <Button variant="ghost" onClick={onClose} disabled={updateMutation.isPending}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4" />
            <span>Lưu ma trận quyền ({selectedIds.size})</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
