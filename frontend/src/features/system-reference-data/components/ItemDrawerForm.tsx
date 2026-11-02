import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { ReferenceDataItem, CreateItemPayload, UpdateItemPayload } from '../types/referenceData';
import { useCreateItem, useUpdateItem } from '../hooks/useItems';

interface ItemDrawerFormProps {
  isOpen: boolean;
  onClose: () => void;
  catalogId: string;
  catalogCode: string;
  catalogName: string;
  item?: ReferenceDataItem | null;
  existingItems: ReferenceDataItem[];
  onConflict: () => void;
}

interface FormValues {
  code: string;
  name: string;
  value: string;
  displayOrder: number;
  parentItemId: string;
  metadataJson: string;
}

export const ItemDrawerForm: React.FC<ItemDrawerFormProps> = ({
  isOpen,
  onClose,
  catalogId,
  catalogCode,
  catalogName,
  item,
  existingItems,
  onConflict,
}) => {
  const isEditing = Boolean(item);
  const createMutation = useCreateItem(catalogId);
  const updateMutation = useUpdateItem(catalogId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      value: '',
      displayOrder: 0,
      parentItemId: '',
      metadataJson: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          code: item.code,
          name: item.name,
          value: item.value || '',
          displayOrder: item.displayOrder,
          parentItemId: item.parentItemId || '',
          metadataJson: item.metadataJson || '',
        });
      } else {
        reset({
          code: '',
          name: '',
          value: '',
          displayOrder: existingItems.length > 0 ? (Math.max(...existingItems.map((i) => i.displayOrder)) + 1) : 1,
          parentItemId: '',
          metadataJson: '',
        });
      }
    }
  }, [isOpen, item, existingItems, reset]);

  // Lọc danh sách mục cha hợp lệ: cùng catalog và khác bản thân khi đang chỉnh sửa
  const availableParentItems = existingItems.filter(
    (i) => (!isEditing || i.id !== item?.id) && i.isActive
  );

  const onSubmit = async (values: FormValues) => {
    // Kiểm tra định dạng JSON nếu có nhập
    if (values.metadataJson && values.metadataJson.trim()) {
      try {
        JSON.parse(values.metadataJson.trim());
      } catch {
        setError('metadataJson', {
          type: 'manual',
          message: 'MetadataJson phải là chuỗi JSON hợp lệ (ví dụ: {"key": "value"}).',
        });
        return;
      }
    }

    try {
      if (isEditing && item) {
        const payload: UpdateItemPayload = {
          name: values.name.trim(),
          value: values.value.trim() || undefined,
          displayOrder: Number(values.displayOrder) || 0,
          parentItemId: values.parentItemId ? values.parentItemId : null,
          metadataJson: values.metadataJson.trim() || null,
          rowVersion: item.rowVersionBase64,
        };

        await updateMutation.mutateAsync({ itemId: item.id, payload });
        onClose();
      } else {
        const payload: CreateItemPayload = {
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          value: values.value.trim() || undefined,
          displayOrder: Number(values.displayOrder) || 0,
          parentItemId: values.parentItemId ? values.parentItemId : null,
          metadataJson: values.metadataJson.trim() || null,
        };

        await createMutation.mutateAsync(payload);
        onClose();
      }
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        onClose();
        onConflict();
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa giá trị danh mục' : 'Thêm mới giá trị danh mục'}
      subtitle={`Thuộc nhóm: [${catalogCode}] ${catalogName}`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo giá trị'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Mã giá trị */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mã giá trị (Code) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={isEditing}
            placeholder="VD: D4_VISA, VN_NATIONALITY"
            {...register('code', {
              required: 'Mã giá trị không được để trống.',
              pattern: {
                value: /^[A-Za-z0-9_.-]+$/,
                message: 'Mã chỉ được chứa chữ cái, số, dấu gạch dưới, gạch ngang và chấm.',
              },
              maxLength: {
                value: 50,
                message: 'Mã giá trị tối đa 50 ký tự.',
              },
            })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 uppercase ${
              isEditing
                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                : errors.code
                ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.code && (
            <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
          )}
          {isEditing && (
            <p className="mt-1 text-xs text-slate-400">
              Mã giá trị là bất biến sau khi tạo để bảo vệ tính toàn vẹn dữ liệu.
            </p>
          )}
        </div>

        {/* Tên giá trị */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tên hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="VD: Visa Du học Hàn Quốc D4-1"
            {...register('name', {
              required: 'Tên giá trị không được để trống.',
              maxLength: {
                value: 200,
                message: 'Tên giá trị tối đa 200 ký tự.',
              },
            })}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Giá trị nghiệp vụ */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Giá trị nghiệp vụ (Value)
          </label>
          <input
            type="text"
            placeholder="VD: D4-1, VN, KR (Dùng cho mapping code tích hợp)"
            {...register('value', {
              maxLength: {
                value: 500,
                message: 'Giá trị nghiệp vụ tối đa 500 ký tự.',
              },
            })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        {/* Thứ tự hiển thị & Mục cha */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              min={0}
              {...register('displayOrder', { valueAsNumber: true })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Thuộc mục cha (Parent)
            </label>
            <select
              {...register('parentItemId')}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
            >
              <option value="">-- Không có (Cấp gốc) --</option>
              {availableParentItems.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  [{parent.code}] {parent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metadata JSON */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Metadata mở rộng (JSON tùy chọn)
          </label>
          <textarea
            rows={3}
            placeholder='VD: {"isoCode": "VNM", "currency": "VND"}'
            {...register('metadataJson')}
            className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 ${
              errors.metadataJson
                ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.metadataJson ? (
            <p className="mt-1 text-xs text-red-500">{errors.metadataJson.message}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Định dạng JSON hợp lệ dùng cho các thiết lập đặc thù phân hệ.
            </p>
          )}
        </div>
      </form>
    </SideDrawer>
  );
};

