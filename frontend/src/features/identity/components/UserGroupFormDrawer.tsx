import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/common/Button';
import { UserGroup, ScopeType, CreateUserGroupRequest, UpdateUserGroupRequest } from '../types/userGroup';
import { useCreateUserGroup, useUpdateUserGroup } from '../hooks/useUserGroups';

interface UserGroupFormDrawerProps {
  isOpen: boolean;
  initialData?: UserGroup | null;
  onClose: () => void;
}

export const UserGroupFormDrawer: React.FC<UserGroupFormDrawerProps> = ({
  isOpen,
  initialData,
  onClose,
}) => {
  const isEditing = Boolean(initialData);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('Global');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateUserGroup();
  const updateMutation = useUpdateUserGroup();

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description || '');
      setScopeType(initialData.scopeType);
      setIsActive(initialData.isActive);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setScopeType('Global');
      setIsActive(true);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isEditing && !code.trim()) {
      newErrors.code = 'Mã nhóm không được để trống';
    } else if (!isEditing && !/^[A-Z0-9_]{3,30}$/.test(code.trim().toUpperCase())) {
      newErrors.code = 'Mã nhóm từ 3-30 ký tự (chữ in hoa, số và gạch dưới)';
    }

    if (!name.trim()) {
      newErrors.name = 'Tên nhóm không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && initialData) {
      const updateReq: UpdateUserGroupRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
        rowVersionBase64: initialData.rowVersionBase64 || '',
      };
      await updateMutation.mutateAsync({ id: initialData.id, request: updateReq });
      onClose();
    } else {
      const createReq: CreateUserGroupRequest = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        scopeType,
        isActive,
      };
      await createMutation.mutateAsync(createReq);
      onClose();
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm transition-opacity flex justify-end">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Chỉnh sửa nhóm người dùng' : 'Tạo mới nhóm người dùng'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Cập nhật thông tin nhóm ${initialData?.code}`
                : 'Định nghĩa nhóm người dùng và phạm vi dữ liệu cấp quyền'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Mã nhóm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mã nhóm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isEditing}
              placeholder="VD: ACADEMIC_COORDINATOR, ADMISSION_TEAM"
              className={`w-full px-3 py-2 text-sm rounded-md border font-mono uppercase transition-colors ${
                errors.code ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
              } ${isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
            />
            {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
            {!isEditing && (
              <p className="text-[11px] text-slate-500 mt-1">Mã định danh duy nhất trong hệ thống, không thể đổi sau khi tạo.</p>
            )}
          </div>

          {/* Tên nhóm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên nhóm quyền <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Điều phối Học vụ Đào tạo, Ban Tuyển sinh"
              className={`w-full px-3 py-2 text-sm rounded-md border transition-colors ${
                errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-indigo-200'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Scope Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phạm vi áp dụng dữ liệu (Data Scope) <span className="text-rose-500">*</span>
            </label>
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as ScopeType)}
              disabled={isEditing}
              className={`w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:ring-indigo-200 ${
                isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
              }`}
            >
              <option value="Global">Toàn cầu (Global) — Toàn bộ tập đoàn / hệ thống</option>
              <option value="LegalEntity">Pháp nhân (Legal Entity) — Giới hạn theo công ty pháp nhân</option>
              <option value="BusinessUnit">Khối Đào tạo / BU — Giới hạn theo khối / ngành đào tạo</option>
              <option value="Branch">Cơ sở / Campus — Giới hạn theo chi nhánh / cơ sở đào tạo</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {scopeType === 'Global' && 'Nhóm có thể được cấp quyền quản trị xuyên suốt mọi pháp nhân và đơn vị.'}
              {scopeType === 'LegalEntity' && 'Khi thêm thành viên vào nhóm, bạn sẽ chọn pháp nhân cụ thể mà thành viên được phép truy cập.'}
              {scopeType === 'BusinessUnit' && 'Khi thêm thành viên, bạn sẽ chọn khối đào tạo (BU) trực thuộc pháp nhân.'}
              {scopeType === 'Branch' && 'Khi thêm thành viên, bạn sẽ phân bổ chính xác cơ sở / campus trực thuộc đơn vị.'}
            </p>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả trách nhiệm & chức năng
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục đích nhóm, phân công nhiệm vụ và phạm vi nghiệp vụ..."
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:ring-indigo-200"
            />
          </div>

          {/* Kích hoạt */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">Kích hoạt hoạt động của nhóm</span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6.5 mt-0.5">
              Khi bị vô hiệu hóa, mọi thành viên trong nhóm sẽ mất hiệu lực các quyền gắn với nhóm này.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo nhóm người dùng'}
          </Button>
        </div>
      </div>
    </div>
  );
};

