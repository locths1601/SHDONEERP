import React, { useState } from 'react';
import { UserCheck, Search, ShieldCheck, Building, Layers, MapPin, Globe } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { useUserEffectivePermissions } from '../hooks/useUserGroups';

interface UserEffectivePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserEffectivePermissionsModal: React.FC<UserEffectivePermissionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [userIdInput, setUserIdInput] = useState('');
  const [queriedUserId, setQueriedUserId] = useState<string | null>(null);

  const { data: effectivePerms, isLoading, isFetching } = useUserEffectivePermissions(queriedUserId || undefined);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userIdInput.trim()) {
      setQueriedUserId(userIdInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tra cứu Quyền hiệu lực & Phạm vi dữ liệu người dùng</h2>
              <p className="text-xs text-slate-500">
                Kiểm toán Direct GBAC: Phân giải quyền thực tế được gán qua các nhóm thành viên kèm Scope cụ thể.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Nhập User ID (GUID) của người dùng để tra cứu quyền..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-indigo-200"
              />
            </div>
            <Button size="sm" variant="primary" type="submit" isLoading={isFetching}>
              Tra cứu quyền
            </Button>
          </form>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {queriedUserId ? (
            isLoading ? (
              <div className="text-center py-12 text-xs text-slate-400">Đang phân giải quyền hiệu lực...</div>
            ) : effectivePerms && effectivePerms.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span>Tìm thấy <strong className="text-slate-900">{effectivePerms.length}</strong> quyền hiệu lực</span>
                  <span>User: <strong className="font-mono text-slate-800">{queriedUserId}</strong></span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {effectivePerms.map((perm, idx) => (
                    <div key={`${perm.permissionCode}-${idx}`} className="p-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {perm.permissionCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-900">{perm.permissionName}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{perm.module}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Nhận qua nhóm: <span className="font-medium text-slate-700">{perm.viaGroupName}</span>
                        </p>
                      </div>

                      {/* Scope Badge */}
                      <div className="shrink-0 flex items-center gap-1.5 text-xs">
                        {perm.scopeType === 'Global' && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-1 rounded font-medium">
                            <Globe className="h-3 w-3" />
                            <span>Toàn cầu (Global)</span>
                          </span>
                        )}

                        {perm.scopeType === 'LegalEntity' && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded font-medium">
                            <Building className="h-3 w-3" />
                            <span>Pháp nhân: {perm.scopeLegalEntityName || 'ID'}</span>
                          </span>
                        )}

                        {perm.scopeType === 'BusinessUnit' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded font-medium">
                            <Layers className="h-3 w-3" />
                            <span>BU: {perm.scopeBusinessUnitName || 'ID'}</span>
                          </span>
                        )}

                        {perm.scopeType === 'Branch' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded font-medium">
                            <MapPin className="h-3 w-3" />
                            <span>Cơ sở: {perm.scopeBranchName || 'ID'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Người dùng này chưa có quyền hiệu lực nào hoặc chưa được gán vào nhóm người dùng.
              </div>
            )
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              Nhập mã định danh người dùng ở thanh tìm kiếm phía trên để kiểm tra toàn bộ quyền hiệu lực và phạm vi truy cập dữ liệu tương ứng.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

