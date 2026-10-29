import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Module, ModuleStatus, CreateModuleRequest, UpdateModuleRequest } from '../types/moduleRegistry';
import { useCreateModule, useUpdateModule, useModuleHierarchy } from '../hooks/useModuleRegistry';

interface ModuleFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  module?: Module | null;
}

interface FormValues {
  code: string;
  name: string;
  description: string;
  version: string;
  orderIndex: number;
  icon: string;
  status: ModuleStatus;
  parentModuleId: string;
  effectiveFromUtc: string;
  effectiveToUtc: string;
}

const COMMON_ICONS = [
  'Layers', 'ShieldCheck', 'Building2', 'Users', 'Database', 
  'FileText', 'GitBranch', 'History', 'Cpu', 'Boxes', 'Settings', 'Briefcase'
];

export const ModuleFormDrawer: React.FC<ModuleFormDrawerProps> = ({ isOpen, onClose, module }) => {
  const isEditing = !!module;
  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();
  const { data: hierarchy } = useModuleHierarchy();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      version: '1.0.0',
      orderIndex: 0,
      icon: 'Layers',
      status: 'Active',
      parentModuleId: '',
      effectiveFromUtc: '',
      effectiveToUtc: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (module) {
        reset({
          code: module.code,
          name: module.name,
          description: module.description || '',
          version: module.version || '1.0.0',
          orderIndex: module.orderIndex || 0,
          icon: module.icon || 'Layers',
          status: module.status || 'Active',
          parentModuleId: module.parentModuleId || '',
          effectiveFromUtc: module.effectiveFromUtc ? module.effectiveFromUtc.substring(0, 10) : '',
          effectiveToUtc: module.effectiveToUtc ? module.effectiveToUtc.substring(0, 10) : '',
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          version: '1.0.0',
          orderIndex: 0,
          icon: 'Layers',
          status: 'Active',
          parentModuleId: '',
          effectiveFromUtc: '',
          effectiveToUtc: '',
        });
      }
    }
  }, [isOpen, module, reset]);

  const onSubmit = async (values: FormValues) => {
    const parentId = values.parentModuleId ? values.parentModuleId : null;
    const fromDate = values.effectiveFromUtc ? new Date(values.effectiveFromUtc).toISOString() : null;
    const toDate = values.effectiveToUtc ? new Date(values.effectiveToUtc).toISOString() : null;

    if (isEditing && module) {
      const updateReq: UpdateModuleRequest = {
        name: values.name,
        description: values.description || undefined,
        version: values.version,
        orderIndex: Number(values.orderIndex),
        icon: values.icon,
        status: values.status,
        parentModuleId: parentId,
        effectiveFromUtc: fromDate,
        effectiveToUtc: toDate,
      };
      await updateMutation.mutateAsync({ id: module.id, request: updateReq });
    } else {
      const createReq: CreateModuleRequest = {
        code: values.code,
        name: values.name,
        description: values.description || undefined,
        version: values.version,
        orderIndex: Number(values.orderIndex),
        icon: values.icon,
        status: values.status,
        parentModuleId: parentId,
        effectiveFromUtc: fromDate,
        effectiveToUtc: toDate,
      };
      await createMutation.mutateAsync(createReq);
    }
    onClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Cập nhật Phân hệ (Module)' : 'Đăng ký Phân hệ mới'}
      subtitle={isEditing ? `Mã phân hệ: ${module?.code}` : 'Đăng ký metadata phân hệ nghiệp vụ vào Registry tập trung'}
      width="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo phân hệ'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Module Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mã Phân hệ (ModuleCode) <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('code', {
              required: 'Mã phân hệ là bắt buộc',
              pattern: {
                value: /^[A-Za-z0-9_]+$/,
                message: 'Chỉ cho phép chữ cái, chữ số và gạch dưới',
              },
            })}
            disabled={isEditing}
            placeholder="Ví dụ: FINANCE, HR, ACADEMIC"
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 uppercase font-mono"
          />
          {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code.message}</p>}
          {!isEditing && (
            <p className="text-[11px] text-slate-500 mt-1">Mã định danh duy nhất, không thể thay đổi sau khi tạo.</p>
          )}
        </div>

        {/* Module Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tên Phân hệ <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('name', { required: 'Tên phân hệ là bắt buộc' })}
            placeholder="Ví dụ: Phân hệ Quản trị Tài chính Kế toán"
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mô tả nghiệp vụ
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Mô tả phạm vi nghiệp vụ và trách nhiệm chính của phân hệ..."
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Version */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phiên bản (SemVer) <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('version', {
                required: 'Phiên bản là bắt buộc',
                pattern: {
                  value: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/,
                  message: 'Ví dụ: 1.0.0 hoặc 1.2.0-beta',
                },
              })}
              placeholder="1.0.0"
              className="w-full px-3 py-2 text-sm font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.version && <p className="text-xs text-rose-500 mt-1">{errors.version.message}</p>}
          </div>

          {/* Order Index */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              {...register('orderIndex')}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Active">Active (Hoạt động)</option>
              <option value="Beta">Beta (Thử nghiệm)</option>
              <option value="Deprecated">Deprecated (Sắp khai tử)</option>
              <option value="Inactive">Inactive (Vô hiệu hóa)</option>
            </select>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Biểu tượng (Icon)
            </label>
            <select
              {...register('icon')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {COMMON_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Parent Module */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Phân hệ cha (Trực thuộc)
          </label>
          <select
            {...register('parentModuleId')}
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Phân hệ gốc (Cấp cao nhất) --</option>
            {hierarchy
              ?.filter((m) => m.id !== module?.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">Dùng để phân cấp menu hoặc tổ chức nhóm module con.</p>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hiệu lực từ ngày
            </label>
            <input
              type="date"
              {...register('effectiveFromUtc')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Đến ngày (Tùy chọn)
            </label>
            <input
              type="date"
              {...register('effectiveToUtc')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </form>
    </SideDrawer>
  );
};
