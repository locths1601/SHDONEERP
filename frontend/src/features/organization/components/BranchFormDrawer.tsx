import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { branchService } from '../services/branchService';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '../branches';
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches';

interface FormValues {
  legalEntityId: string;
  businessUnitId: string;
  code: string;
  name: string;
  address: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch | null;
}

const statusCodes: Record<string, number> = { Active: 1, Inactive: 2, UnderLiquidation: 3 };

export const BranchFormDrawer: React.FC<Props> = ({ isOpen, onClose, branch }) => {
  const isEdit = Boolean(branch);
  const [selectedLegalEntityId, setSelectedLegalEntityId] = useState<string>('');

  const legalEntities = useQuery({
    queryKey: ['legal-entity-lookup'],
    queryFn: branchService.getLegalEntities,
    enabled: isOpen && !isEdit,
  });

  const businessUnits = useQuery({
    queryKey: ['business-units-for-branch', selectedLegalEntityId],
    queryFn: () => branchService.getBusinessUnits(selectedLegalEntityId || undefined),
    enabled: isOpen && Boolean(selectedLegalEntityId),
  });

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const watchedLegalEntityId = watch('legalEntityId');

  useEffect(() => {
    if (watchedLegalEntityId) {
      setSelectedLegalEntityId(watchedLegalEntityId);
    }
  }, [watchedLegalEntityId]);

  useEffect(() => {
    if (branch) {
      setSelectedLegalEntityId(branch.legalEntityId);
      reset({
        legalEntityId: branch.legalEntityId,
        businessUnitId: branch.businessUnitId ?? '',
        code: branch.code,
        name: branch.name,
        address: branch.address ?? '',
        status: branch.status,
      });
    } else {
      setSelectedLegalEntityId('');
      reset({
        legalEntityId: '',
        businessUnitId: '',
        code: '',
        name: '',
        address: '',
        status: 'Active',
      });
    }
  }, [branch, reset, isOpen]);

  const onSubmit = (values: FormValues) => {
    const status = statusCodes[values.status] ?? 1;
    const buId = values.businessUnitId ? values.businessUnitId : null;

    if (branch) {
      const request: UpdateBranchRequest = {
        businessUnitId: buId,
        name: values.name.trim(),
        address: values.address?.trim() || null,
        status,
        rowVersionBase64: branch.rowVersionBase64 ?? '',
      };
      updateMutation.mutate({ id: branch.id, request }, { onSuccess: onClose });
      return;
    }

    const request: CreateBranchRequest = {
      legalEntityId: values.legalEntityId,
      businessUnitId: buId,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      address: values.address?.trim() || null,
      status,
    };
    createMutation.mutate(request, { onSuccess: onClose });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa cơ sở / chi nhánh' : 'Tạo mới cơ sở / chi nhánh'}
      subtitle={isEdit ? `Mã cơ sở: ${branch?.code}` : 'Đăng ký cơ sở hoặc chi nhánh đào tạo thuộc tổ chức'}
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
        {!isEdit && (
          <div>
            <label htmlFor="branch-legal-entity" className="mb-1 block text-xs font-semibold text-slate-700">
              Pháp nhân chủ quản <span className="text-red-500">*</span>
            </label>
            <select
              id="branch-legal-entity"
              {...register('legalEntityId', { required: 'Vui lòng chọn pháp nhân' })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={legalEntities.isLoading}
            >
              <option value="">-- Chọn pháp nhân --</option>
              {legalEntities.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
            {errors.legalEntityId && (
              <p className="mt-1 text-xs text-red-600">{errors.legalEntityId.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="branch-business-unit" className="mb-1 block text-xs font-semibold text-slate-700">
            Đơn vị kinh doanh trực thuộc (tùy chọn)
          </label>
          <select
            id="branch-business-unit"
            {...register('businessUnitId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            disabled={!selectedLegalEntityId || businessUnits.isLoading}
          >
            <option value="">-- Trực thuộc trực tiếp Pháp nhân (không qua BU) --</option>
            {businessUnits.data?.items?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>
          {!selectedLegalEntityId && !isEdit && (
            <p className="mt-1 text-xs text-slate-400">Chọn pháp nhân trước để hiển thị danh sách đơn vị kinh doanh.</p>
          )}
        </div>

        <div>
          <label htmlFor="branch-code" className="mb-1 block text-xs font-semibold text-slate-700">
            Mã cơ sở / chi nhánh <span className="text-red-500">*</span>
          </label>
          <input
            id="branch-code"
            type="text"
            disabled={isEdit}
            {...register('code', {
              required: 'Mã cơ sở là bắt buộc',
              maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
              pattern: { value: /^[A-Za-z0-9_]+$/, message: 'Chỉ chấp nhận chữ cái, số và dấu gạch dưới' },
            })}
            placeholder="VD: HN_CAMPUS_01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
          />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
        </div>

        <div>
          <label htmlFor="branch-name" className="mb-1 block text-xs font-semibold text-slate-700">
            Tên cơ sở / chi nhánh đào tạo <span className="text-red-500">*</span>
          </label>
          <input
            id="branch-name"
            type="text"
            {...register('name', {
              required: 'Tên cơ sở là bắt buộc',
              maxLength: { value: 200, message: 'Tối đa 200 ký tự' },
            })}
            placeholder="VD: Cơ sở Cầu Giấy - Viện Quốc tế"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="branch-address" className="mb-1 block text-xs font-semibold text-slate-700">
            Địa chỉ cơ sở đào tạo
          </label>
          <input
            id="branch-address"
            type="text"
            {...register('address', {
              maxLength: { value: 500, message: 'Địa chỉ tối đa 500 ký tự' },
            })}
            placeholder="VD: Số 123 Cầu Giấy, P. Dịch Vọng, TP. Hà Nội"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
        </div>

        <div>
          <label htmlFor="branch-status" className="mb-1 block text-xs font-semibold text-slate-700">
            Trạng thái hoạt động
          </label>
          <select
            id="branch-status"
            {...register('status')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="Active">Hoạt động (Active)</option>
            <option value="Inactive">Tạm ngưng (Inactive)</option>
            <option value="UnderLiquidation">Đang giải thể (UnderLiquidation)</option>
          </select>
        </div>
      </form>
    </SideDrawer>
  );
};

