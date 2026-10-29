import React, { useState } from 'react';
import { X, GraduationCap, AlertCircle } from 'lucide-react';
import { useCreateApplication } from '../hooks/useStudents';
import { useLegalEntitiesPaged } from '../../organization/hooks/useLegalEntities';

interface ApplicationCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentPartyId: string;
  studentName: string;
}

export const ApplicationCreateDrawer: React.FC<ApplicationCreateDrawerProps> = ({
  isOpen,
  onClose,
  studentPartyId,
  studentName,
}) => {
  const [formData, setFormData] = useState({
    applicationCode: '',
    legalEntityId: '',
    targetMarket: 'Hàn Quốc',
    intakeTerm: '2026-Kỳ Thu',
    programName: 'Du học tiếng Hàn D4-1',
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: legalEntitiesData } = useLegalEntitiesPaged({ page: 1, pageSize: 50 });
  const createApplicationMutation = useCreateApplication(studentPartyId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.legalEntityId) {
      setErrorMsg('Vui lòng chọn Pháp nhân tiếp nhận hồ sơ.');
      return;
    }

    try {
      await createApplicationMutation.mutateAsync({
        applicationCode: formData.applicationCode.trim() || undefined,
        studentPartyId,
        legalEntityId: formData.legalEntityId,
        targetMarket: formData.targetMarket.trim(),
        intakeTerm: formData.intakeTerm.trim(),
        programName: formData.programName.trim(),
        notes: formData.notes.trim() || undefined,
      });

      onClose();
    } catch {
      // toast in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Mở hồ sơ du học & tuyển sinh mới</h2>
              <p className="text-xs text-gray-500">Học viên: <span className="font-semibold text-gray-800">{studentName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pháp nhân tiếp nhận <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.legalEntityId}
              onChange={(e) => setFormData({ ...formData, legalEntityId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn pháp nhân phụ trách --</option>
              {legalEntitiesData?.items?.map((le) => (
                <option key={le.id} value={le.id}>
                  {le.name} ({le.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Thị trường du học *</label>
              <select
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Hàn Quốc">Hàn Quốc</option>
                <option value="CHLB Đức">CHLB Đức</option>
                <option value="Nhật Bản">Nhật Bản</option>
                <option value="Úc">Úc</option>
                <option value="Đài Loan">Đài Loan</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kỳ tuyển sinh *</label>
              <input
                type="text"
                required
                placeholder="2026-Kỳ Thu hoặc 09/2026"
                value={formData.intakeTerm}
                onChange={(e) => setFormData({ ...formData, intakeTerm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Chương trình đào tạo / Visa *</label>
            <input
              type="text"
              required
              placeholder="VD: Du học tiếng Hàn D4-1, Du học nghề Đức Điều dưỡng..."
              value={formData.programName}
              onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mã hồ sơ (tùy chọn)</label>
            <input
              type="text"
              placeholder="APP-YYYYMMDD-XXXX (tự sinh nếu để trống)"
              value={formData.applicationCode}
              onChange={(e) => setFormData({ ...formData, applicationCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú mục tiêu học viên</label>
            <textarea
              rows={2}
              placeholder="Ghi chú nguyện vọng trường, học bổng hoặc yêu cầu visa đặc thù..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 text-xs text-gray-500 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
            Hệ thống sẽ <strong>tự động tạo danh mục 9 checklist tài liệu tiêu chuẩn</strong> (Hộ chiếu, CCCD, Khai sinh, Học bạ, Bằng cấp, Chứng minh tài chính, Khám sức khỏe, Ảnh thẻ) cho hồ sơ này.
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createApplicationMutation.isPending}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createApplicationMutation.isPending ? 'Đang khởi tạo...' : 'Tạo hồ sơ du học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
