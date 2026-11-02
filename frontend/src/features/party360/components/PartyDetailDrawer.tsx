import React from 'react';
import { User, Building, Mail, Phone, MapPin, Shield, Calendar, Globe } from 'lucide-react';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { usePartyDetail } from '../hooks/useParties';
import { formatDate } from '../../../lib/utils';
import { Skeleton } from '../../../components/common/Skeleton';

interface Props {
  partyId: string | null;
  onClose: () => void;
}

export const PartyDetailDrawer: React.FC<Props> = ({ partyId, onClose }) => {
  const { data: party, isLoading, error } = usePartyDetail(partyId);

  return (
    <SideDrawer
      isOpen={!!partyId}
      onClose={onClose}
      title={party?.fullName || party?.companyName || 'Hồ sơ Party 360'}
      subtitle={`Mã: ${party?.code || '—'} | ${party?.partyType === 'Person' ? 'Cá nhân' : 'Tổ chức'}`}
      width="lg"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : error || !party ? (
        <div className="text-center py-12 text-slate-500">
          <p>Không thể tải thông tin hồ sơ hoặc hồ sơ không tồn tại.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status & Type Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {party.partyType === 'Person' ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Định danh Party</span>
                <span className="text-sm font-semibold text-slate-800">{party.code}</span>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                party.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {party.status === 'Active' ? 'Hoạt động' : party.status}
            </span>
          </div>

          {/* Thông tin cốt lõi */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              {party.partyType === 'Person' ? 'Thông tin cá nhân' : 'Thông tin pháp lý tổ chức'}
            </h4>
            {party.partyType === 'Person' ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Họ và tên</span>
                  <span className="font-medium text-slate-800">{party.fullName || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Ngày sinh</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {party.dateOfBirth ? formatDate(party.dateOfBirth) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Giới tính</span>
                  <span className="font-medium text-slate-800">
                    {party.gender === 'Male' ? 'Nam' : party.gender === 'Female' ? 'Nữ' : party.gender || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Quốc tịch</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {party.nationality || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">Tên công ty / đơn vị</span>
                  <span className="font-medium text-slate-800">{party.companyName || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Tên thương mại</span>
                  <span className="font-medium text-slate-800">{party.tradingName || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Mã số thuế</span>
                  <span className="font-medium text-slate-800 font-mono">{party.taxId || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Số ĐKKD</span>
                  <span className="font-medium text-slate-800 font-mono">{party.registrationNumber || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vai trò trong hệ sinh thái (Roles & Legal Entities) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Vai trò & Pháp nhân phục vụ ({party.roles?.length || 0})
            </h4>
            {party.roles && party.roles.length > 0 ? (
              <div className="space-y-2">
                {party.roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        {role.roleType}
                      </span>
                      <span className="text-slate-600">
                        {role.legalEntityName
                          ? `${role.legalEntityCode} - ${role.legalEntityName}`
                          : 'Toàn hệ sinh thái SHD'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDate(role.createdAtUtc)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có vai trò nào được gán.</p>
            )}
          </div>

          {/* Phương thức liên lạc */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Kênh liên hệ ({party.contactMethods?.length || 0})
            </h4>
            {party.contactMethods && party.contactMethods.length > 0 ? (
              <div className="space-y-2">
                {party.contactMethods.map((cm) => (
                  <div
                    key={cm.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      {cm.contactType === 'Email' ? (
                        <Mail className="w-4 h-4 text-slate-400" />
                      ) : cm.contactType === 'Phone' ? (
                        <Phone className="w-4 h-4 text-slate-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-800">{cm.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cm.isPrimary && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Mặc định
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{cm.contactType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có thông tin liên hệ.</p>
            )}
          </div>

          {/* Nhật ký kiểm toán */}
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
            <span>Khởi tạo: {formatDate(party.createdAtUtc)}</span>
            {party.updatedAtUtc && <span>Cập nhật: {formatDate(party.updatedAtUtc)}</span>}
          </div>
        </div>
      )}
    </SideDrawer>
  );
};

