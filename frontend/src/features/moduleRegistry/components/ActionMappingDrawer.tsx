import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { 
  FeatureActionPermission, 
  CreateFeatureActionRequest, 
  UpdateFeatureActionRequest 
} from '../types/moduleRegistry';
import { useAddFeatureAction, useUpdateFeatureAction } from '../hooks/useModuleRegistry';

interface ActionMappingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  featureId: string | null;
  actionMapping?: FeatureActionPermission | null;
}

interface FormValues {
  actionCode: string;
  actionName: string;
  permissionCode: string;
  description: string;
  isDefault: boolean;
}

const COMMON_ACTION_TEMPLATES = [
  { code: 'view', name: 'Xem / Tra cứu', permSuffix: 'view' },
  { code: 'create', name: 'Tạo mới', permSuffix: 'create' },
  { code: 'edit', name: 'Chỉnh sửa', permSuffix: 'edit' },
  { code: 'delete', name: 'Xóa / Đổi trạng thái', permSuffix: 'delete' },
  { code: 'export', name: 'Xuất dữ liệu', permSuffix: 'export' },
  { code: 'assign', name: 'Phân bổ / Gán quyền', permSuffix: 'assign' },
  { code: 'approve', name: 'Phê duyệt', permSuffix: 'approve' },
];

export const ActionMappingDrawer: React.FC<ActionMappingDrawerProps> = ({
  isOpen,
  onClose,
  featureId,
  actionMapping,
}) => {
  const isEditing = !!actionMapping;
  const addMutation = useAddFeatureAction();
  const updateMutation = useUpdateFeatureAction();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      actionCode: '',
      actionName: '',
      permissionCode: '',
      description: '',
      isDefault: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (actionMapping) {
        reset({
          actionCode: actionMapping.actionCode,
          actionName: actionMapping.actionName,
          permissionCode: actionMapping.permissionCode,
          description: actionMapping.description || '',
          isDefault: actionMapping.isDefault,
        });
      } else {
        reset({
          actionCode: '',
          actionName: '',
          permissionCode: '',
          description: '',
          isDefault: true,
        });
      }
    }
  }, [isOpen, actionMapping, reset]);

  const handleApplyTemplate = (tpl: typeof COMMON_ACTION_TEMPLATES[0]) => {
    setValue('actionCode', tpl.code);
    setValue('actionName', tpl.name);
  };

  const onSubmit = async (values: FormValues) => {
    if (!featureId) return;

    if (isEditing && actionMapping) {
      const updateReq: UpdateFeatureActionRequest = {
        actionName: values.actionName,
        permissionCode: values.permissionCode,
        description: values.description || undefined,
        isDefault: values.isDefault,
      };
      await updateMutation.mutateAsync({
        featureId,
        actionMappingId: actionMapping.id,
        request: updateReq,
      });
    } else {
      const createReq: CreateFeatureActionRequest = {
        actionCode: values.actionCode,
        actionName: values.actionName,
        permissionCode: values.permissionCode,
        description: values.description || undefined,
        isDefault: values.isDefault,
      };
      await addMutation.mutateAsync({
        featureId,
        request: createReq,
      });
    }
    onClose();
  };

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Sửa Ánh xạ Hành động & Quyền' : 'Gắn Hành động (Action) vào Tính năng'}
      subtitle="Thiết lập Module → Feature → Action → PermissionCode"
      width="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Thêm ánh xạ'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Template Buttons */}
        {!isEditing && (
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Mẫu hành động nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ACTION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                >
                  {tpl.code} ({tpl.name})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mã Hành động (ActionCode) <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('actionCode', {
              required: 'Mã hành động là bắt buộc',
              pattern: {
                value: /^[a-z0-9_]+$/,
                message: 'Chỉ chấp nhận chữ thường, số và gạch dưới',
              },
            })}
            disabled={isEditing}
            placeholder="Ví dụ: view, create, edit, delete, export, assign"
            className="w-full px-3 py-2 text-sm font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
          {errors.actionCode && <p className="text-xs text-rose-500 mt-1">{errors.actionCode.message}</p>}
        </div>

        {/* Action Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tên Hành động hiển thị <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('actionName', { required: 'Tên hành động là bắt buộc' })}
            placeholder="Ví dụ: Xem danh sách và chi tiết"
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.actionName && <p className="text-xs text-rose-500 mt-1">{errors.actionName.message}</p>}
        </div>

        {/* Permission Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mã Quyền thực thi (PermissionCode) <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('permissionCode', {
              required: 'Mã quyền là bắt buộc',
              pattern: {
                value: /^[a-z0-9_.]+$/,
                message: 'Ví dụ: identity.user.view, org.branch.create',
              },
            })}
            placeholder="Ví dụ: identity.group.view, org.legal_entity.create"
            className="w-full px-3 py-2 text-sm font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.permissionCode && <p className="text-xs text-rose-500 mt-1">{errors.permissionCode.message}</p>}
          <p className="text-[11px] text-slate-500 mt-1">
            Hệ thống tự động liên kết với Permission ID trong catalog quyền nếu mã quyền đã được tạo.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mô tả hành động
          </label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Ghi chú nghiệp vụ của hành động..."
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Is Default Checkbox */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            id="isDefaultAction"
            {...register('isDefault')}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="isDefaultAction" className="text-xs font-medium text-slate-700 cursor-pointer">
            Hành động mặc định khi truy cập tính năng (ví dụ: view)
          </label>
        </div>
      </form>
    </SideDrawer>
  );
};
