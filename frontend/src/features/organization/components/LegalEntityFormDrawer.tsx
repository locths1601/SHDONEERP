import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { LegalEntityDto, CreateLegalEntityRequest, UpdateLegalEntityRequest } from '../types';
import { useCreateLegalEntity, useUpdateLegalEntity } from '../hooks/useLegalEntities';

interface FormData {
  code: string;
  name: string;
  tradingName: string;
  taxCode: string;
  phoneNumber: string;
  email: string;
  website: string;
  address: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entityToEdit?: LegalEntityDto | null;
}

export const LegalEntityFormDrawer: React.FC<Props> = ({ isOpen, onClose, entityToEdit }) => {
  const isEdit = !!entityToEdit;
  const createMutation = useCreateLegalEntity();
  const updateMutation = useUpdateLegalEntity();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    if (entityToEdit) {
      reset({
        code: entityToEdit.code,
        name: entityToEdit.name,
        tradingName: entityToEdit.tradingName || '',
        taxCode: entityToEdit.taxCode || '',
        phoneNumber: entityToEdit.phoneNumber || '',
        email: entityToEdit.email || '',
        website: entityToEdit.website || '',
        address: entityToEdit.address || '',
        status: entityToEdit.status,
      });
    } else {
      reset({
        code: '',
        name: '',
        tradingName: '',
        taxCode: '',
        phoneNumber: '',
        email: '',
        website: '',
        address: '',
        status: 'Active',
      });
    }
  }, [entityToEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const statusMap: Record<string, number> = {
      Active: 1,
      Inactive: 2,
      UnderLiquidation: 3,
    };

    if (isEdit && entityToEdit) {
      const updatePayload: UpdateLegalEntityRequest = {
        name: data.name,
        tradingName: data.tradingName || undefined,
        taxCode: data.taxCode || undefined,
        address: data.address || undefined,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
        status: statusMap[data.status] || 1,
        rowVersionBase64: entityToEdit.rowVersionBase64 || '',
      };

      await updateMutation.mutateAsync({ id: entityToEdit.id, data: updatePayload });
      onClose();
    } else {
      const createPayload: CreateLegalEntityRequest = {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        tradingName: data.tradingName || undefined,
        taxCode: data.taxCode || undefined,
        address: data.address || undefined,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        website: data.website || undefined,
        status: statusMap[data.status] || 1,
      };

      await createMutation.mutateAsync(createPayload);
      onClose();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa Pháp nhân' : 'Đăng ký Pháp nhân mới'}
      subtitle={isEdit ? `Mã pháp nhân: ${entityToEdit?.code}` : 'Khai báo đơn vị pháp lý mới trong hệ sinh thái SHD'}
      width="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mã Pháp nhân <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={isEdit}
            {...register('code', {
              required: 'Mã pháp nhân không được để trống',
              pattern: {
                value: /^[A-Z0-9_]+$/i,
                message: 'Chỉ chấp nhận chữ cái, số và dấu gạch dưới',
              },
            })}
            placeholder="Ví dụ: SHD_CORP"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none uppercase disabled:bg-slate-100 disabled:text-slate-500"
          />
          {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên đầy đủ của Pháp nhân <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name', { required: 'Tên pháp nhân không được để trống' })}
            placeholder="Ví dụ: Công ty Cổ phần Tập đoàn SHD"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên thương mại / Viết tắt</label>
            <input
              type="text"
              {...register('tradingName')}
              placeholder="Ví dụ: SHD Group"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế</label>
            <input
              type="text"
              {...register('taxCode')}
              placeholder="0108999999"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              {...register('phoneNumber')}
              placeholder="024.7777.8888"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email liên hệ</label>
            <input
              type="email"
              {...register('email')}
              placeholder="contact@shdcorp.vn"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
          <input
            type="text"
            {...register('website')}
            placeholder="https://shdcorp.vn"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ trụ sở</label>
          <textarea
            rows={2}
            {...register('address')}
            placeholder="Địa chỉ đăng ký kinh doanh chính thức..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái hoạt động</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
          >
            <option value="Active">Đang hoạt động (Active)</option>
            <option value="Inactive">Tạm ngưng (Inactive)</option>
            <option value="UnderLiquidation">Đang làm thủ tục giải thể (UnderLiquidation)</option>
          </select>
        </div>
      </form>
    </SideDrawer>
  );
};
