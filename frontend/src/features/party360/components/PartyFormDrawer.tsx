import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Building } from 'lucide-react';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { useCreatePersonParty, useCreateOrgParty } from '../hooks/useParties';
import { useLegalEntityLookup } from '../../organization/hooks/useLegalEntities';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PersonFormData {
  code: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  initialRoleType?: string;
  legalEntityId?: string;
}

interface OrgFormData {
  code: string;
  companyName: string;
  tradingName?: string;
  taxId?: string;
  registrationNumber?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  initialRoleType?: string;
  legalEntityId?: string;
}

export const PartyFormDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [partyType, setPartyType] = useState<'Person' | 'Organization'>('Person');

  const createPersonMutation = useCreatePersonParty();
  const createOrgMutation = useCreateOrgParty();
  const { data: legalEntities } = useLegalEntityLookup();

  const {
    register: registerPerson,
    handleSubmit: handlePersonSubmit,
    reset: resetPerson,
    formState: { errors: personErrors },
  } = useForm<PersonFormData>({
    defaultValues: {
      code: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      nationality: 'Việt Nam',
      email: '',
      phoneNumber: '',
      address: '',
      initialRoleType: 'Student',
      legalEntityId: '',
    },
  });

  const {
    register: registerOrg,
    handleSubmit: handleOrgSubmit,
    reset: resetOrg,
    formState: { errors: orgErrors },
  } = useForm<OrgFormData>({
    defaultValues: {
      code: '',
      companyName: '',
      tradingName: '',
      taxId: '',
      registrationNumber: '',
      email: '',
      phoneNumber: '',
      address: '',
      initialRoleType: 'PartnerSchool',
      legalEntityId: '',
    },
  });

  const onPersonSubmit = (data: PersonFormData) => {
    createPersonMutation.mutate(
      {
        ...data,
        legalEntityId: data.legalEntityId || undefined,
      },
      {
        onSuccess: () => {
          resetPerson();
          onClose();
        },
      }
    );
  };

  const onOrgSubmit = (data: OrgFormData) => {
    createOrgMutation.mutate(
      {
        ...data,
        legalEntityId: data.legalEntityId || undefined,
      },
      {
        onSuccess: () => {
          resetOrg();
          onClose();
        },
      }
    );
  };

  const isPending = createPersonMutation.isPending || createOrgMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm mới Hồ sơ Party 360"
      subtitle="Khởi tạo định danh học viên, khách hàng hoặc tổ chức đối tác chung"
      width="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="submit"
            form={partyType === 'Person' ? 'person-form' : 'org-form'}
            size="sm"
            isLoading={isPending}
          >
            Lưu hồ sơ
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Toggle Type */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setPartyType('Person')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              partyType === 'Person'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Cá nhân (Person)
          </button>
          <button
            type="button"
            onClick={() => setPartyType('Organization')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
              partyType === 'Organization'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            Tổ chức (Organization)
          </button>
        </div>

        {partyType === 'Person' ? (
          <form id="person-form" onSubmit={handlePersonSubmit(onPersonSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã định danh <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerPerson('code', { required: 'Mã không được để trống' })}
                  placeholder="VD: STU-2026-001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {personErrors.code && (
                  <p className="text-xs text-red-500 mt-1">{personErrors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò khởi tạo <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerPerson('initialRoleType')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Student">Học viên (Student)</option>
                  <option value="Parent">Phụ huynh (Parent)</option>
                  <option value="Applicant">Ứng viên lao động (Applicant)</option>
                  <option value="ContactPerson">Người liên hệ (ContactPerson)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và đệm <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerPerson('lastName', { required: 'Họ đệm không được để trống' })}
                  placeholder="VD: Nguyễn Văn"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {personErrors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{personErrors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerPerson('firstName', { required: 'Tên không được để trống' })}
                  placeholder="VD: An"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {personErrors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{personErrors.firstName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  {...registerPerson('dateOfBirth')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                <select
                  {...registerPerson('gender')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quốc tịch</label>
                <input
                  {...registerPerson('nationality')}
                  placeholder="Việt Nam"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Thông tin liên hệ & Pháp nhân gắn kết</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email chính</label>
                  <input
                    type="email"
                    {...registerPerson('email')}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    {...registerPerson('phoneNumber')}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  {...registerPerson('address')}
                  placeholder="Số nhà, đường, phường/xã..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pháp nhân quản lý/phục vụ</label>
                <select
                  {...registerPerson('legalEntityId')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Dùng chung toàn hệ sinh thái --</option>
                  {legalEntities?.map((le: any) => (
                    <option key={le.id} value={le.id}>
                      {le.code} - {le.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        ) : (
          <form id="org-form" onSubmit={handleOrgSubmit(onOrgSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã đối tác <span className="text-red-500">*</span>
                </label>
                <input
                  {...registerOrg('code', { required: 'Mã không được để trống' })}
                  placeholder="VD: PARTNER-SEOUL-01"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {orgErrors.code && (
                  <p className="text-xs text-red-500 mt-1">{orgErrors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò khởi tạo <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerOrg('initialRoleType')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="PartnerSchool">Trường đối tác (PartnerSchool)</option>
                  <option value="Agency">Đại lý tuyển sinh (Agency)</option>
                  <option value="Employer">Doanh nghiệp tiếp nhận (Employer)</option>
                  <option value="Vendor">Nhà cung cấp (Vendor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên công ty / tổ chức <span className="text-red-500">*</span>
              </label>
              <input
                {...registerOrg('companyName', { required: 'Tên không được để trống' })}
                placeholder="VD: Trường Đại học Quốc tế Seoul"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {orgErrors.companyName && (
                <p className="text-xs text-red-500 mt-1">{orgErrors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thương mại</label>
                <input
                  {...registerOrg('tradingName')}
                  placeholder="VD: Seoul Tech University"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế</label>
                <input
                  {...registerOrg('taxId')}
                  placeholder="VD: 0102030405"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Thông tin liên hệ & Pháp nhân gắn kết</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email đối tác</label>
                  <input
                    type="email"
                    {...registerOrg('email')}
                    placeholder="contact@partner.edu.kr"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    {...registerOrg('phoneNumber')}
                    placeholder="+82 2-1234-5678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                <input
                  {...registerOrg('address')}
                  placeholder="Địa chỉ trụ sở đối tác..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pháp nhân ký kết / tiếp nhận</label>
                <select
                  {...registerOrg('legalEntityId')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Dùng chung toàn hệ sinh thái --</option>
                  {legalEntities?.map((le: any) => (
                    <option key={le.id} value={le.id}>
                      {le.code} - {le.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        )}
      </div>
    </SideDrawer>
  );
};

