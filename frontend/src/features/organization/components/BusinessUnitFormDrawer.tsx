import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { businessUnitService } from '../services/businessUnitService';
import { BusinessUnit, CreateBusinessUnitRequest, UpdateBusinessUnitRequest } from '../businessUnits';
import { useCreateBusinessUnit, useUpdateBusinessUnit } from '../hooks/useBusinessUnits';

interface FormValues {
  legalEntityId: string;
  code: string;
  name: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  businessUnit?: BusinessUnit | null;
}

const statusCodes: Record<string, number> = { Active: 1, Inactive: 2, UnderLiquidation: 3 };

export const BusinessUnitFormDrawer: React.FC<Props> = ({ isOpen, onClose, businessUnit }) => {
  const isEdit = Boolean(businessUnit);
  const legalEntities = useQuery({
    queryKey: ['legal-entity-lookup'],
    queryFn: businessUnitService.getLegalEntities,
    enabled: isOpen && !isEdit,
  });
  const createMutation = useCreateBusinessUnit();
  const updateMutation = useUpdateBusinessUnit();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    reset({
      legalEntityId: businessUnit?.legalEntityId ?? '',
      code: businessUnit?.code ?? '',
      name: businessUnit?.name ?? '',
      status: businessUnit?.status ?? 'Active',
    });
  }, [businessUnit, reset, isOpen]);

  const onSubmit = (values: FormValues) => {
    const status = statusCodes[values.status] ?? 1;
    if (businessUnit) {
      const request: UpdateBusinessUnitRequest = {
        name: values.name.trim(),
        status,
        rowVersionBase64: businessUnit.rowVersionBase64 ?? '',
      };
      updateMutation.mutate({ id: businessUnit.id, request }, { onSuccess: onClose });
      return;
    }

    const request: CreateBusinessUnitRequest = {
      legalEntityId: values.legalEntityId,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      status,
    };
    createMutation.mutate(request, { onSuccess: onClose });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa đơn vị kinh doanh' : 'Tạo đơn vị kinh doanh'}
      subtitle={isEdit ? `Mã đơn vị: ${businessUnit?.code}` : 'Đơn vị kinh doanh thuộc một pháp nhân được cấp quyền'}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>Hủy</Button>
          <Button size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {!isEdit && (
          <div>
            <label htmlFor="business-unit-legal-entity" className="mb-1 block text-xs font-semibold text-slate-700">
              Pháp nhân <span className="text-red-500">*</span>
            </label>
            <select
              id="business-unit-legal-entity"
              {...register('legalEntityId', { required: 'Vui lòng chọn pháp nhân' })}
              disabled={legalEntities.isLoading || legalEntities.isError}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Chọn pháp nhân</option>
              {legalEntities.data?.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.code} — {entity.name}</option>
              ))}
            </select>
            {legalEntities.isError && <p role="alert" className="mt-1 text-xs text-red-600">Không tải được danh sách pháp nhân.</p>}
            {errors.legalEntityId && <p role="alert" className="mt-1 text-xs text-red-600">{errors.legalEntityId.message}</p>}
          </div>
        )}

        {!isEdit && (
          <div>
            <label htmlFor="business-unit-code" className="mb-1 block text-xs font-semibold text-slate-700">
              Mã đơn vị <span className="text-red-500">*</span>
            </label>
            <input
              id="business-unit-code"
              {...register('code', {
                required: 'Mã đơn vị không được để trống',
                maxLength: { value: 50, message: 'Mã đơn vị tối đa 50 ký tự' },
                pattern: { value: /^[A-Za-z0-9_]+$/, message: 'Chỉ dùng chữ cái, chữ số và dấu gạch dưới' },
              })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
              autoComplete="off"
            />
            {errors.code && <p role="alert" className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>
        )}

        <div>
          <label htmlFor="business-unit-name" className="mb-1 block text-xs font-semibold text-slate-700">
            Tên đơn vị <span className="text-red-500">*</span>
          </label>
          <input
            id="business-unit-name"
            {...register('name', {
              required: 'Tên đơn vị không được để trống',
              maxLength: { value: 200, message: 'Tên đơn vị tối đa 200 ký tự' },
            })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.name && <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="business-unit-status" className="mb-1 block text-xs font-semibold text-slate-700">Trạng thái</label>
          <select id="business-unit-status" {...register('status')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Tạm ngưng</option>
            <option value="UnderLiquidation">Đang giải thể</option>
          </select>
        </div>
      </form>
    </SideDrawer>
  );
};
