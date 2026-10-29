import React from 'react';
import { ShieldCheck, Calendar, Users, Shield, Edit2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { useUserGroupDetail, useUserGroupMembers, useUserGroupPermissions } from '../hooks/useUserGroups';

interface UserGroupDetailDrawerProps {
  groupId: string;
  onClose: () => void;
  onEdit?: () => void;
}

export const UserGroupDetailDrawer: React.FC<UserGroupDetailDrawerProps> = ({
  groupId,
  onClose,
  onEdit,
}) => {
  const { data: group, isLoading } = useUserGroupDetail(groupId);
  const { data: members } = useUserGroupMembers(groupId);
  const { data: permissions } = useUserGroupPermissions(groupId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-lg bg-white shadow-2xl p-6 flex items-center justify-center">
          <div className="text-sm text-slate-500">Đang tải thông tin nhóm...</div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
              <span className="font-mono text-xs text-indigo-600 font-semibold">{group.code}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Phạm vi gán dữ liệu</span>
              <span className="text-sm font-semibold text-slate-800">{group.scopeType}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Trạng thái</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-0.5 ${
                group.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {group.isActive ? 'Hoạt động' : 'Tạm khóa'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-500 block">Mô tả</span>
              <p className="text-xs text-slate-700 mt-0.5">{group.description || 'Chưa có mô tả'}</p>
            </div>
          </div>

          {/* Thành viên hiện tại */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900">
                <Users className="h-4 w-4 text-slate-600" />
                <span>Thành viên trong nhóm ({members?.length || 0})</span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {members && members.length > 0 ? (
                members.map((m) => (
                  <div key={m.membershipId} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{m.fullName}</p>
                      <p className="text-[11px] text-slate-500">@{m.username} • {m.email}</p>
                    </div>
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {m.branchName || m.businessUnitName || m.legalEntityName || 'Toàn cầu'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Chưa có thành viên nào trong nhóm.</div>
              )}
            </div>
          </div>

          {/* Quyền trực tiếp được cấp */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Quyền trực tiếp được gán ({permissions?.length || 0})</span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {permissions && permissions.length > 0 ? (
                permissions.map((p) => (
                  <div key={p.permissionId} className="p-2.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {p.permissionCode}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.module}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{p.permissionName}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Chưa cấp quyền trực tiếp nào cho nhóm.</div>
              )}
            </div>
          </div>

          {/* Audit metadata */}
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Ngày tạo: {new Date(group.createdAtUtc).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          {onEdit && (
            <Can permission="identity.group.edit">
              <Button variant="primary" onClick={onEdit} className="flex items-center gap-1.5">
                <Edit2 className="h-4 w-4" />
                <span>Chỉnh sửa nhóm</span>
              </Button>
            </Can>
          )}
        </div>
      </div>
    </div>
  );
};

