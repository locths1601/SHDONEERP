import React, { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';
import { StudentDetailDto } from '../types';
import { useAddIdentification } from '../hooks/useStudents';

interface StudentIdentificationsTabProps {
  student: StudentDetailDto;
}

export const StudentIdentificationsTab: React.FC<StudentIdentificationsTabProps> = ({ student }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    idType: 'CitizenId',
    idNumber: '',
    issueDate: '',
    expiryDate: '',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    isPrimary: false,
  });

  const addIdentMutation = useAddIdentification(student.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idNumber.trim()) return;

    try {
      await addIdentMutation.mutateAsync({
        idType: formData.idType,
        idNumber: formData.idNumber.trim(),
        issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        issuePlace: formData.issuePlace.trim() || undefined,
        isPrimary: formData.isPrimary,
      });
      setIsOpen(false);
      setFormData({
        idType: 'Passport',
        idNumber: '',
        issueDate: '',
        expiryDate: '',
        issuePlace: 'Cục Quản lý xuất nhập cảnh',
        isPrimary: false,
      });
    } catch {
      // toast in hook
    }
  };

  const getIdTypeLabel = (type: string) => {
    switch (type) {
      case 'CitizenId': return 'Căn cước công dân (CCCD)';
      case 'Passport': return 'Hộ chiếu (Passport)';
      case 'BirthCertificate': return 'Giấy khai sinh';
      case 'StudentId': return 'Thẻ học sinh / sinh viên';
      default: return type;
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Giấy tờ & Định danh pháp lý ({student.identifications.length})</h3>
          <p className="text-xs text-gray-500">Thông tin CCCD, Hộ chiếu đối soát và thẩm định hồ sơ visa</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Bổ sung giấy tờ
        </button>
      </div>

      {student.identifications.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-xs">
          Chưa có giấy tờ định danh nào được lưu trữ cho học viên này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {student.identifications.map((ident) => (
            <div
              key={ident.id}
              className={`p-4 rounded-xl border transition ${
                ident.isPrimary ? 'bg-blue-50/40 border-blue-200' : 'bg-gray-50/60 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  {getIdTypeLabel(ident.idType)}
                </span>
                {ident.isPrimary && (
                  <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded font-semibold">
                    Chính
                  </span>
                )}
              </div>

              <div className="font-mono text-base font-bold text-gray-900 tracking-wider mb-2">
                {ident.idNumber}
              </div>

              <div className="space-y-1 text-xs text-gray-500 border-t border-gray-200/60 pt-2">
                <div className="flex items-center justify-between">
                  <span>Ngày cấp:</span>
                  <span className="font-medium text-gray-700">
                    {ident.issueDate ? new Date(ident.issueDate).toLocaleDateString('vi-VN') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hạn dùng:</span>
                  <span className="font-medium text-gray-700">
                    {ident.expiryDate ? new Date(ident.expiryDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <span className="flex-shrink-0">Nơi cấp:</span>
                  <span className="font-medium text-gray-700 text-right line-clamp-1">
                    {ident.issuePlace || '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Thêm giấy tờ định danh</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Loại giấy tờ</label>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="CitizenId">Căn cước công dân (CCCD)</option>
                  <option value="Passport">Hộ chiếu (Passport)</option>
                  <option value="BirthCertificate">Giấy khai sinh</option>
                  <option value="StudentId">Thẻ học sinh / sinh viên</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số giấy tờ *</label>
                <input
                  type="text"
                  required
                  placeholder="001099xxxxxx hoặc Cxxxxxxx"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày cấp</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nơi cấp</label>
                <input
                  type="text"
                  placeholder="Cục Cảnh sát QLHC về TTXH / Cục QLXNC"
                  value={formData.issuePlace}
                  onChange={(e) => setFormData({ ...formData, issuePlace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Đặt làm giấy tờ định danh chính
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addIdentMutation.isPending}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addIdentMutation.isPending ? 'Đang lưu...' : 'Lưu giấy tờ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
