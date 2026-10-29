import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  Plus,
  Shield,
  CheckCircle2,
  X,
} from 'lucide-react';
import { StudentDetailDto } from '../types';
import { useAddRelationship } from '../hooks/useStudents';

interface StudentOverviewTabProps {
  student: StudentDetailDto;
}

export const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({ student }) => {
  const [isAddRelOpen, setIsAddRelOpen] = useState(false);
  const [relForm, setRelForm] = useState({
    relationshipType: 'Father',
    relatedPersonName: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    occupation: '',
    address: '',
    isEmergencyContact: true,
    isLegalGuardian: false,
    isFinancialSponsor: true,
    notes: '',
  });

  const addRelationshipMutation = useAddRelationship(student.id);

  const handleAddRelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relForm.relatedPersonName.trim()) return;

    try {
      await addRelationshipMutation.mutateAsync({
        relationshipType: relForm.relationshipType,
        relatedPersonName: relForm.relatedPersonName.trim(),
        phoneNumber: relForm.phoneNumber.trim() || undefined,
        email: relForm.email.trim() || undefined,
        nationalId: relForm.nationalId.trim() || undefined,
        occupation: relForm.occupation.trim() || undefined,
        address: relForm.address.trim() || undefined,
        isEmergencyContact: relForm.isEmergencyContact,
        isLegalGuardian: relForm.isLegalGuardian,
        isFinancialSponsor: relForm.isFinancialSponsor,
        notes: relForm.notes.trim() || undefined,
      });
      setIsAddRelOpen(false);
      setRelForm({
        relationshipType: 'Mother',
        relatedPersonName: '',
        phoneNumber: '',
        email: '',
        nationalId: '',
        occupation: '',
        address: '',
        isEmergencyContact: false,
        isLegalGuardian: false,
        isFinancialSponsor: false,
        notes: '',
      });
    } catch {
      // toast in hook
    }
  };

  const getRelationshipLabel = (type: string) => {
    switch (type) {
      case 'Father': return 'Bố đẻ';
      case 'Mother': return 'Mẹ đẻ';
      case 'Guardian': return 'Người giám hộ';
      case 'Sponsor': return 'Người bảo lãnh tài chính';
      case 'Spouse': return 'Vợ / Chồng';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-gray-800 font-semibold text-sm">
            <User className="w-4 h-4 text-blue-600" />
            <span>Thông tin nhân thân</span>
          </div>
          <dl className="grid grid-cols-2 gap-y-3 text-xs">
            <div>
              <dt className="text-gray-400">Họ và tên</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">{student.fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Mã định danh</dt>
              <dd className="font-semibold text-gray-900 mt-0.5">{student.code}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Ngày sinh</dt>
              <dd className="text-gray-800 mt-0.5">
                {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Giới tính</dt>
              <dd className="text-gray-800 mt-0.5">{student.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Quốc tịch</dt>
              <dd className="text-gray-800 mt-0.5">{student.nationality || 'Việt Nam'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Trạng thái hồ sơ</dt>
              <dd className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {student.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Roles & Organization Management */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-gray-800 font-semibold text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Pháp nhân & Vai trò hệ sinh thái</span>
          </div>
          <div className="space-y-3">
            {student.roles.map((r) => (
              <div key={r.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                      {r.roleType}
                    </span>
                    <span>{r.legalEntityName || 'Toàn hệ sinh thái'}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Vai trò chủ quản nghiệp vụ đào tạo & tuyển sinh</div>
                </div>
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                </span>
              </div>
            ))}

            {/* Contact summary */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Phương thức liên hệ chính</div>
              <div className="space-y-1.5 text-xs text-gray-600">
                {student.contactMethods.length === 0 ? (
                  <div className="text-gray-400 italic">Chưa có thông tin liên hệ</div>
                ) : (
                  student.contactMethods.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      {c.contactType === 'Phone' ? <Phone className="w-3.5 h-3.5 text-gray-400" /> : <Mail className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="font-medium text-gray-800">{c.value}</span>
                      {c.isPrimary && <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">Chính</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relationships / Family & Guardians Section */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Thân nhân, Người giám hộ & Người bảo trợ tài chính ({student.relationships.length})</span>
          </div>
          <button
            onClick={() => setIsAddRelOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Bổ sung thân nhân
          </button>
        </div>

        {student.relationships.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Chưa có thông tin người giám hộ hoặc thân nhân. Bấm nút phía trên để bổ sung thông tin phục vụ xét duyệt hồ sơ visa.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {student.relationships.map((rel) => (
              <div key={rel.id} className="p-4 bg-gray-50/60 rounded-xl border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                    {getRelationshipLabel(rel.relationshipType)}
                  </span>
                  <div className="flex gap-1">
                    {rel.isEmergencyContact && (
                      <span title="Khẩn cấp" className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                        SOS
                      </span>
                    )}
                    {rel.isFinancialSponsor && (
                      <span title="Bảo trợ tài chính" className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                        Bảo lãnh
                      </span>
                    )}
                    {rel.isLegalGuardian && (
                      <span title="Giám hộ pháp lý" className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">
                        Giám hộ
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-sm text-gray-900">{rel.relatedPersonName}</div>
                  <div className="text-xs text-gray-500">{rel.occupation || 'Nghề nghiệp: Chưa cập nhật'}</div>
                </div>

                <div className="pt-2 border-t border-gray-200/80 space-y-1 text-xs text-gray-600">
                  {rel.phoneNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{rel.phoneNumber}</span>
                    </div>
                  )}
                  {rel.nationalId && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span>CCCD: {rel.nationalId}</span>
                    </div>
                  )}
                  {rel.address && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="line-clamp-1">{rel.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Relationship */}
      {isAddRelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Bổ sung thân nhân / người giám hộ</h3>
              <button onClick={() => setIsAddRelOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRelSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mối quan hệ</label>
                  <select
                    value={relForm.relationshipType}
                    onChange={(e) => setRelForm({ ...relForm, relationshipType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Father">Bố đẻ</option>
                    <option value="Mother">Mẹ đẻ</option>
                    <option value="Guardian">Người giám hộ</option>
                    <option value="Sponsor">Người bảo trợ tài chính</option>
                    <option value="Spouse">Vợ / Chồng</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên thân nhân *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn B"
                    value={relForm.relatedPersonName}
                    onChange={(e) => setRelForm({ ...relForm, relatedPersonName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={relForm.phoneNumber}
                    onChange={(e) => setRelForm({ ...relForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số CCCD / Hộ chiếu</label>
                  <input
                    type="text"
                    placeholder="0010xxxxxx"
                    value={relForm.nationalId}
                    onChange={(e) => setRelForm({ ...relForm, nationalId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nghề nghiệp</label>
                  <input
                    type="text"
                    placeholder="Kinh doanh / Cán bộ..."
                    value={relForm.occupation}
                    onChange={(e) => setRelForm({ ...relForm, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="parent@email.com"
                    value={relForm.email}
                    onChange={(e) => setRelForm({ ...relForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  placeholder="Địa chỉ cư trú"
                  value={relForm.address}
                  onChange={(e) => setRelForm({ ...relForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-4 text-xs font-medium text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relForm.isEmergencyContact}
                    onChange={(e) => setRelForm({ ...relForm, isEmergencyContact: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Liên hệ khẩn cấp
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relForm.isFinancialSponsor}
                    onChange={(e) => setRelForm({ ...relForm, isFinancialSponsor: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Bảo trợ tài chính
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relForm.isLegalGuardian}
                    onChange={(e) => setRelForm({ ...relForm, isLegalGuardian: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  Giám hộ pháp lý
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRelOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addRelationshipMutation.isPending}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addRelationshipMutation.isPending ? 'Đang lưu...' : 'Lưu thân nhân'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
