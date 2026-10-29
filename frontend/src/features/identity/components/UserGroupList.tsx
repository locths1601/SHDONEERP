import React, { useState } from 'react';
import { Eye, Plus, Edit2, Trash2, Users, Shield, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { ConfirmDialog } from '../../../components/common/Modal';
import { DataGrid, Column } from '../../../components/common/DataGrid';
import { ListToolbar } from '../../../components/common/ListToolbar';
import { UserGroup, UserGroupFilter, ScopeType } from '../types/userGroup';
import { useUserGroups, useDeleteUserGroup } from '../hooks/useUserGroups';
import { UserGroupFormDrawer } from './UserGroupFormDrawer';
import { UserGroupDetailDrawer } from './UserGroupDetailDrawer';
import { UserGroupMembersDrawer } from './UserGroupMembersDrawer';
import { UserGroupPermissionMatrixDrawer } from './UserGroupPermissionMatrixDrawer';
import { UserEffectivePermissionsModal } from './UserEffectivePermissionsModal';

export const UserGroupList: React.FC = () => {
  const [query, setQuery] = useState<UserGroupFilter>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<UserGroup | null>(null);

  // Modals quản lý thành viên, ma trận quyền và tra cứu quyền hiệu lực
  const [membersGroupId, setMembersGroupId] = useState<{ id: string; name: string; scopeType: ScopeType } | null>(null);
  const [permissionsGroupId, setPermissionsGroupId] = useState<{ id: string; name: string } | null>(null);
  const [effectivePermsModalOpen, setEffectivePermsModalOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useUserGroups(query);
  const deleteMutation = useDeleteUserGroup();

  const getScopeBadge = (scopeType: ScopeType) => {
    switch (scopeType) {
      case 'Global':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">Toàn cầu (Global)</span>;
      case 'LegalEntity':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Pháp nhân (Legal Entity)</span>;
      case 'BusinessUnit':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Khối Đào tạo (BU)</span>;
      case 'Branch':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Cơ sở / Campus</span>;
      default:
        return <span>{scopeType}</span>;
    }
  };

  const columns: Column<UserGroup>[] = [
    {
      key: 'code',
      header: 'Mã nhóm',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{row.code}</span>
          {row.isSystem && (
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-sans font-normal">Hệ thống</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Tên nhóm người dùng',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          {row.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'scopeType',
      header: 'Phạm vi gán (Scope)',
      width: '180px',
      render: (row) => getScopeBadge(row.scopeType),
    },
    {
      key: 'members',
      header: 'Thành viên',
      width: '130px',
      render: (row) => (
        <button
          type="button"
          onClick={() => setMembersGroupId({ id: row.id, name: row.name, scopeType: row.scopeType })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors"
          title="Nhấp để quản lý thành viên và phân bổ phạm vi"
        >
          <Users className="h-3.5 w-3.5" />
          <span>{row.memberCount} thành viên</span>
        </button>
      ),
    },
    {
      key: 'permissions',
      header: 'Quyền trực tiếp',
      width: '140px',
      render: (row) => (
        <button
          type="button"
          onClick={() => setPermissionsGroupId({ id: row.id, name: row.name })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition-colors"
          title="Nhấp để cấp / chỉnh sửa quyền trực tiếp cho nhóm"
        >
          <Shield className="h-3.5 w-3.5" />
          <span>{row.permissionCount} quyền hạn</span>
        </button>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      width: '110px',
      render: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
            Khóa
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDetailId(row.id)}
            title="Xem chi tiết nhóm"
          >
            <Eye className="h-4 w-4 text-slate-500" />
          </Button>

          <Can permission="identity.group.edit">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingGroup(row);
                setFormOpen(true);
              }}
              title="Chỉnh sửa thông tin nhóm"
            >
              <Edit2 className="h-4 w-4 text-slate-500" />
            </Button>
          </Can>

          <Can permission="identity.group.delete">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeletingGroup(row)}
              disabled={row.isSystem}
              title={row.isSystem ? 'Không thể xóa nhóm hệ thống' : 'Xóa nhóm người dùng'}
            >
              <Trash2 className={`h-4 w-4 ${row.isSystem ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500'}`} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý Nhóm người dùng (Direct GBAC)</h1>
          <p className="text-sm text-slate-500">
            Phân quyền trực tiếp theo mô hình: Người dùng → Thành viên nhóm → Nhóm người dùng → Quyền trực tiếp + Phạm vi dữ liệu (Scope).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setEffectivePermsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <span>Tra cứu quyền hiệu lực</span>
          </Button>

          <Can permission="identity.group.create">
            <Button
              variant="primary"
              onClick={() => {
                setEditingGroup(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo nhóm quyền mới</span>
            </Button>
          </Can>
        </div>
      </div>

      <ListToolbar
        searchTerm={query.searchTerm || ''}
        onSearchChange={(val) => setQuery((prev) => ({ ...prev, searchTerm: val, page: 1 }))}
        searchPlaceholder="Tìm theo mã nhóm, tên nhóm..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <DataGrid<UserGroup>
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          emptyTitle="Chưa có nhóm người dùng nào"
          emptyDescription="Không có nhóm người dùng nào phù hợp với bộ lọc hiện tại."
          page={query.page || 1}
          pageSize={query.pageSize || 10}
          totalItems={data?.totalItems || 0}
          onPageChange={(p) => setQuery((prev) => ({ ...prev, page: p }))}
        />
      </div>

      {/* Form Drawer (Tạo mới / Cập nhật) */}
      {formOpen && (
        <UserGroupFormDrawer
          isOpen={formOpen}
          initialData={editingGroup}
          onClose={() => {
            setFormOpen(false);
            setEditingGroup(null);
          }}
        />
      )}

      {/* Detail Drawer */}
      {detailId && (
        <UserGroupDetailDrawer
          groupId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            const found = data?.items.find((g) => g.id === detailId);
            if (found) {
              setDetailId(null);
              setEditingGroup(found);
              setFormOpen(true);
            }
          }}
        />
      )}

      {/* Quản lý Thành viên & Phạm vi gán (Scope Assignment) */}
      {membersGroupId && (
        <UserGroupMembersDrawer
          groupId={membersGroupId.id}
          groupName={membersGroupId.name}
          groupScopeType={membersGroupId.scopeType}
          onClose={() => setMembersGroupId(null)}
        />
      )}

      {/* Ma trận cấp quyền trực tiếp cho nhóm */}
      {permissionsGroupId && (
        <UserGroupPermissionMatrixDrawer
          groupId={permissionsGroupId.id}
          groupName={permissionsGroupId.name}
          onClose={() => setPermissionsGroupId(null)}
        />
      )}

      {/* Modal Tra cứu quyền hiệu lực chi tiết của User */}
      {effectivePermsModalOpen && (
        <UserEffectivePermissionsModal
          isOpen={effectivePermsModalOpen}
          onClose={() => setEffectivePermsModalOpen(false)}
        />
      )}

      {/* Hộp thoại xác nhận xóa nhóm */}
      <ConfirmDialog
        isOpen={Boolean(deletingGroup)}
        title="Xóa nhóm người dùng"
        message={`Bạn có chắc chắn muốn xóa nhóm "${deletingGroup?.name}" (${deletingGroup?.code})? Toàn bộ liên kết thành viên và quyền gắn với nhóm này sẽ bị thu hồi ngay lập tức.`}
        confirmLabel="Xác nhận xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingGroup) {
            await deleteMutation.mutateAsync(deletingGroup.id);
            setDeletingGroup(null);
          }
        }}
        onClose={() => setDeletingGroup(null)}
      />
    </div>
  );
};
