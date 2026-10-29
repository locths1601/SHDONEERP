import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useCreateStudent } from '../hooks/useStudents';
import { useLegalEntitiesPaged } from '../../organization/hooks/useLegalEntities';

interface StudentCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentCreateDrawer: React.FC<StudentCreateDrawerProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    code: '',
    legalEntityId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Nam',
    nationality: 'Việt Nam',
    primaryPhone: '',
    primaryEmail: '',
    address: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: legalEntitiesData } = useLegalEntitiesPaged({ page: 1, pageSize: 50 });
  const createStudentMutation = useCreateStudent();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.lastName.trim() || !formData.firstName.trim()) {
      setValidationError('Vui lòng nhập đầy đủ Họ đệm và Tên học viên.');
      return;
    }

    if (!formData.legalEntityId) {
      setValidationError('Vui lòng chọn Pháp nhân quản lý hồ sơ.');
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        code: formData.code.trim() || undefined,
        legalEntityId: formData.legalEntityId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        gender: formData.gender,
        nationality: formData.nationality.trim(),
        primaryPhone: formData.primaryPhone.trim() || undefined,
        primaryEmail: formData.primaryEmail.trim() || undefined,
        address: formData.address.trim() || undefined,
      });

      onClose();
    } catch {
      // toast is handled in mutation hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tiếp nhận hồ sơ học viên mới</h2>
              <p className="text-xs text-gray-500">Khởi tạo định danh Party 360 với vai trò Học viên (Student)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="create-student-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Họ và tên đệm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tên gọi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="An"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mã học viên (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="HV-2026-XXXX (tự sinh nếu để trống)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pháp nhân quản lý <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.legalEntityId}
                onChange={(e) => setFormData({ ...formData, legalEntityId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn pháp nhân --</option>
                {legalEntitiesData?.items?.map((le) => (
                  <option key={le.id} value={le.id}>
                    {le.name} ({le.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quốc tịch</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0912 345 678"
                value={formData.primaryPhone}
                onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="hocvien@email.com"
                value={formData.primaryEmail}
                onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ thường trú / Hộ khẩu</label>
            <input
              type="text"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="create-student-form"
            disabled={createStudentMutation.isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            {createStudentMutation.isPending ? 'Đang khởi tạo...' : 'Xác nhận tạo hồ sơ'}
          </button>
        </div>
      </div>
    </div>
  );
};
