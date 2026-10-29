import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Building, Layers, MapPin, Globe } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/Modal';
import { ScopeType } from '../types/userGroup';
import { useUserGroupMembers, useAssignGroupMember, useRemoveGroupMember } from '../hooks/useUserGroups';
import { useLegalEntityLookup } from '../../organization/hooks/useLegalEntities';
import { useBusinessUnits } from '../../organization/hooks/useBusinessUnits';
import { useBranchLookup } from '../../organization/hooks/useBranches';

interface UserGroupMembersDrawerProps {
  groupId: string;
  groupName: string;
  groupScopeType: ScopeType;
  onClose: () => void;
}

export const UserGroupMembersDrawer: React.FC<UserGroupMembersDrawerProps> = ({
  groupId,
  groupName,
  groupScopeType,
  onClose,
}) => {
  const { data: members, isLoading } = useUserGroupMembers(groupId);
  const assignMutation = useAssignGroupMember();
  const removeMutation = useRemoveGroupMember();

  // State thêm thành viên
  const [showAddForm, setShowAddForm] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedLegalEntityId, setSelectedLegalEntityId] = useState('');
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [formError, setFormError] = useState('');

  // Xóa thành viên
  const [deletingMembership, setDeletingMembership] = useState<{ id: string; fullName: string } | null>(null);

  // Dữ liệu lookup cho Scope Assignment
  const { data: legalEntities } = useLegalEntityLookup();
  const { data: buData } = useBusinessUnits(
    selectedLegalEntityId ? { legalEntityId: selectedLegalEntityId, pageSize: 100 } : { pageSize: 100 }
  );
  const { data: branches } = useBranchLookup(
    selectedLegalEntityId || undefined,
    selectedBusinessUnitId || undefined
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!userIdInput.trim()) {
      setFormError('Vui lòng nhập mã định danh (User ID) của người dùng');
      return;
    }

    // Validate Scope tương ứng với nhóm
    if (groupScopeType === 'LegalEntity' && !selectedLegalEntityId) {
      setFormError('Nhóm yêu cầu phân bổ theo Pháp nhân. Vui lòng chọn Pháp nhân.');
      return;
    }
    if (groupScopeType === 'BusinessUnit' && !selectedBusinessUnitId) {
      setFormError('Nhóm yêu cầu phân bổ theo Khối Đào tạo (BU). Vui lòng chọn Khối BU.');
      return;
    }
    if (groupScopeType === 'Branch' && !selectedBranchId) {
      setFormError('Nhóm yêu cầu phân bổ theo Cơ sở / Campus. Vui lòng chọn Cơ sở.');
      return;
    }

    await assignMutation.mutateAsync({
      id: groupId,
      request: {
        userId: userIdInput.trim(),
        scopeLegalEntityId: selectedLegalEntityId || null,
        scopeBusinessUnitId: selectedBusinessUnitId || null,
        scopeBranchId: selectedBranchId || null,
      },
    });

    // Reset form
    setUserIdInput('');
    setSelectedLegalEntityId('');
    setSelectedBusinessUnitId('');
    setSelectedBranchId('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Quản lý Thành viên</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhóm: <span className="font-semibold text-slate-800">{groupName}</span> • Phạm vi nhóm:{' '}
              <span className="font-semibold text-indigo-700">{groupScopeType}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nút bật/tắt form thêm */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              Danh sách thành viên ({members?.length || 0})
            </span>
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'primary'}
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>{showAddForm ? 'Đóng form thêm' : 'Thêm thành viên mới'}</span>
            </Button>
          </div>

          {/* Form thêm thành viên & phân bổ Scope */}
          {showAddForm && (
            <form onSubmit={handleAssign} className="bg-slate-50 border border-indigo-200 rounded-lg p-4 space-y-4 shadow-sm animate-in fade-in duration-150">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-indigo-600" />
                <span>Gán người dùng vào nhóm & Thiết lập Scope</span>
              </h3>

              {formError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã User ID (GUID) của nhân sự <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="VD: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                  className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 focus:ring-indigo-200 bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nhập mã định danh người dùng trong phân hệ Quản trị / Nhân sự.
                </p>
              </div>

              {/* Phân bổ Scope dạng cascade */}
              <div className="p-3 bg-white rounded border border-slate-200 space-y-3">
                <span className="text-xs font-semibold text-slate-800 block">
                  Phân bổ phạm vi truy cập dữ liệu (Data Scope)
                </span>

                {groupScopeType === 'Global' && (
                  <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-2.5 rounded">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>Nhóm có phạm vi Toàn cầu: Thành viên sẽ có quyền hạn trên tất cả các pháp nhân và cơ sở.</span>
                  </div>
                )}

                {(groupScopeType === 'LegalEntity' || groupScopeType === 'BusinessUnit' || groupScopeType === 'Branch') && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-blue-600" />
                      <span>Pháp nhân (Legal Entity)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedLegalEntityId}
                      onChange={(e) => {
                        setSelectedLegalEntityId(e.target.value);
                        setSelectedBusinessUnitId('');
                        setSelectedBranchId('');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-indigo-200"
                    >
                      <option value="">-- Chọn Pháp nhân --</option>
                      {legalEntities?.map((le: any) => (
                        <option key={le.id} value={le.id}>
                          {le.code} — {le.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(groupScopeType === 'BusinessUnit' || groupScopeType === 'Branch') && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Khối Đào tạo / BU</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedBusinessUnitId}
                      onChange={(e) => {
                        setSelectedBusinessUnitId(e.target.value);
                        setSelectedBranchId('');
                      }}
                      disabled={!selectedLegalEntityId}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-indigo-200 disabled:bg-slate-100"
                    >
                      <option value="">-- Chọn Khối Đào tạo --</option>
                      {buData?.items.map((bu) => (
                        <option key={bu.id} value={bu.id}>
                          {bu.code} — {bu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {groupScopeType === 'Branch' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      <span>Cơ sở / Campus trực thuộc</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      disabled={!selectedBusinessUnitId}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-indigo-200 disabled:bg-slate-100"
                    >
                      <option value="">-- Chọn Cơ sở / Campus --</option>
                      {branches?.map((br: any) => (
                        <option key={br.id} value={br.id}>
                          {br.code} — {br.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" type="button" onClick={() => setShowAddForm(false)}>
                  Hủy
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={assignMutation.isPending}>
                  Thêm vào nhóm
                </Button>
              </div>
            </form>
          )}

          {/* Bảng danh sách thành viên hiện có */}
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Đang tải danh sách thành viên...</div>
          ) : members && members.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.membershipId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{m.fullName}</span>
                      <span className="text-xs font-mono text-slate-500">@{m.username}</span>
                      {!m.isUserActive && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">Tài khoản khóa</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{m.email} {m.phoneNumber ? `• ${m.phoneNumber}` : ''}</p>

                    {/* Scope gán */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
                      <span className="font-medium text-slate-500">Scope:</span>
                      {m.branchName ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                          Campus: {m.branchName} ({m.businessUnitName} - {m.legalEntityCode})
                        </span>
                      ) : m.businessUnitName ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                          Khối BU: {m.businessUnitName} ({m.legalEntityCode})
                        </span>
                      ) : m.legalEntityName ? (
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                          Pháp nhân: {m.legalEntityName}
                        </span>
                      ) : (
                        <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                          Toàn cầu (Global)
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingMembership({ id: m.membershipId, fullName: m.fullName })}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    title="Loại thành viên khỏi nhóm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
              Chưa có thành viên nào trong nhóm này. Hãy bấm &quot;Thêm thành viên mới&quot; để gán quyền.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end bg-slate-50">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>

      {/* Xác nhận xóa thành viên */}
      <ConfirmDialog
        isOpen={Boolean(deletingMembership)}
        title="Loại thành viên khỏi nhóm"
        message={`Bạn có chắc chắn muốn loại "${deletingMembership?.fullName}" khỏi nhóm "${groupName}"? Quyền truy cập gắn với nhóm này sẽ bị thu hồi ngay lập tức.`}
        confirmLabel="Xác nhận loại"
        variant="danger"
        isLoading={removeMutation.isPending}
        onConfirm={async () => {
          if (deletingMembership) {
            await removeMutation.mutateAsync({ id: groupId, membershipId: deletingMembership.id });
            setDeletingMembership(null);
          }
        }}
        onClose={() => setDeletingMembership(null)}
      />
    </div>
  );
};
