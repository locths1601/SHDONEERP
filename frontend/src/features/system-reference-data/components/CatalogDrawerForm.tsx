import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Catalog } from '../types/referenceData';
import { useCreateCatalog, useUpdateCatalog } from '../hooks/useCatalogs';
import { useAuthStore } from '../../../stores/authStore';

interface CatalogDrawerFormProps {
  isOpen: boolean;
  onClose: () => void;
  catalog?: Catalog | null;
  onConflict: () => void;
}

interface FormValues {
  code: string;
  name: string;
  description: string;
  ownerModule: string;
  isSystem: boolean;
}

const MODULE_OPTIONS = [
  { value: 'SYSTEM', label: 'SYSTEM — Quản trị Hệ thống' },
  { value: 'ADMISSION', label: 'ADMISSION — Tuyển sinh & Visa' },
  { value: 'PARTY', label: 'PARTY — Chủ thể & Hồ sơ 360' },
  { value: 'CRM', label: 'CRM — Khách hàng & Thương mại' },
  { value: 'ORG', label: 'ORG — Pháp nhân & Tổ chức' },
  { value: 'FINANCE', label: 'FINANCE — Tài chính Kế toán' },
];

export const CatalogDrawerForm: React.FC<CatalogDrawerFormProps> = ({
  isOpen,
  onClose,
  catalog,
  onConflict,
}) => {
  const isEditing = Boolean(catalog);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin);

  const createMutation = useCreateCatalog();
  const updateMutation = useUpdateCatalog();

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
      ownerModule: 'SYSTEM',
      isSystem: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (catalog) {
        reset({
          code: catalog.code,
          name: catalog.name,
          description: catalog.description || '',
          ownerModule: catalog.ownerModule,
          isSystem: catalog.isSystem,
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          ownerModule: 'SYSTEM',
          isSystem: false,
        });
      }
    }
  }, [isOpen, catalog, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing && catalog) {
      try {
        await updateMutation.mutateAsync({
          id: catalog.id,
          payload: {
            name: values.name,
            description: values.description,
            rowVersion: catalog.rowVersionBase64,
          },
        });
        onClose();
      } catch (err: any) {
        if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
          onClose();
          onConflict();
        }
      }
    } else {
      try {
        await createMutation.mutateAsync({
          code: values.code,
          name: values.name,
          description: values.description,
          ownerModule: values.ownerModule,
          isSystem: values.isSystem,
        });
        onClose();
      } catch {
        // Error already handled in hook toast
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa nhóm danh mục' : 'Thêm mới nhóm danh mục'}
      subtitle={
        isEditing
          ? `Mã: ${catalog?.code} | Chế độ: ${catalog?.managementModeLabel}`
          : 'Tạo nhóm danh mục dùng chung mới cho toàn hệ thống'
      }
      width="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Mã nhóm danh mục */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mã nhóm danh mục (Code) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isEditing}
            placeholder="Vd: KOREA_VISA_STATUS, COUNTRY..."
            className={`w-full px-3.5 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono ${
              isEditing
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : errors.code
                ? 'border-rose-400 bg-rose-50/20'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            {...register('code', {
              required: !isEditing ? 'Mã nhóm danh mục không được để trống' : false,
              pattern: !isEditing
                ? {
                    value: /^[A-Za-z0-9_.-]+$/,
                    message: 'Mã chỉ được chứa chữ cái, số, dấu chấm, dấu gạch ngang và gạch dưới',
                  }
                : undefined,
              minLength: { value: 2, message: 'Tối thiểu 2 ký tự' },
              maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
            })}
          />
          {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code.message}</p>}
          {isEditing && (
            <p className="text-xs text-slate-500 mt-1 italic">
              Mã danh mục là khóa bất biến (immutable) để đảm bảo toàn vẹn dữ liệu tham chiếu.
            </p>
          )}
        </div>

        {/* Tên nhóm danh mục */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên nhóm danh mục <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Vd: Trạng thái hồ sơ Visa Hàn Quốc"
            className={`w-full px-3.5 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 hover:border-slate-400'
            }`}
            {...register('name', {
              required: 'Tên nhóm danh mục không được để trống',
              minLength: { value: 2, message: 'Tối thiểu 2 ký tự' },
              maxLength: { value: 150, message: 'Tối đa 150 ký tự' },
            })}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Phân hệ sở hữu */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Phân hệ sở hữu (Owner Module) <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isEditing}
            className={`w-full px-3.5 py-2 text-sm border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isEditing
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-300 hover:border-slate-400 bg-white'
            }`}
            {...register('ownerModule', { required: 'Vui lòng chọn phân hệ sở hữu' })}
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mô tả nghiệp vụ
          </label>
          <textarea
            rows={3}
            placeholder="Nhập mô tả mục đích sử dụng nhóm danh mục..."
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
            {...register('description', { maxLength: { value: 500, message: 'Tối đa 500 ký tự' } })}
          />
          {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Chế độ quản trị (chỉ hiển thị khi tạo và user là Admin) */}
        {!isEditing && isAdmin && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                {...register('isSystem')}
              />
              <span className="text-xs font-semibold text-slate-700">
                Nhóm hệ thống cốt lõi (SYSTEM_CONTROLLED)
              </span>
            </label>
            <p className="text-xs text-slate-500 ml-6 mt-0.5">
              Nếu chọn, nhóm này sẽ bị khóa đổi mã và cấm ngừng sử dụng để bảo vệ luồng nghiệp vụ lõi.
            </p>
          </div>
        )}
      </form>
    </SideDrawer>
  );
};

