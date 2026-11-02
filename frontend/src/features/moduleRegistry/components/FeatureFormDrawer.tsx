import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { 
  Feature, 
  FeatureType, 
  FeatureStatus, 
  DataClassification, 
  CreateFeatureRequest, 
  UpdateFeatureRequest 
} from '../types/moduleRegistry';
import { 
  useCreateFeature, 
  useUpdateFeature, 
  useModuleHierarchy, 
  useFeatures 
} from '../hooks/useModuleRegistry';

interface FeatureFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: Feature | null;
  defaultModuleId?: string;
  defaultParentFeatureId?: string;
}

interface FormValues {
  moduleId: string;
  code: string;
  name: string;
  description: string;
  featureType: FeatureType;
  parentFeatureId: string;
  routePath: string;
  apiEndpoint: string;
  componentKey: string;
  icon: string;
  orderIndex: number;
  supportedActions: string;
  status: FeatureStatus;
  ownerTeam: string;
  dataClassification: DataClassification;
  isEnabledGlobal: boolean;
}

const COMMON_FEATURE_ICONS = [
  'ShieldCheck', 'Users', 'Building2', 'Layers', 'Cpu', 'Database',
  'FileText', 'GitBranch', 'History', 'Share2', 'Key', 'Lock', 'CheckSquare'
];

export const FeatureFormDrawer: React.FC<FeatureFormDrawerProps> = ({
  isOpen,
  onClose,
  feature,
  defaultModuleId,
  defaultParentFeatureId,
}) => {
  const isEditing = !!feature;
  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const { data: hierarchy } = useModuleHierarchy();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      moduleId: defaultModuleId || '',
      code: '',
      name: '',
      description: '',
      featureType: 'Screen',
      parentFeatureId: '',
      routePath: '',
      apiEndpoint: '',
      componentKey: '',
      icon: 'Cpu',
      orderIndex: 0,
      supportedActions: '["view", "create", "edit", "delete"]',
      status: 'Active',
      ownerTeam: 'Platform Team',
      dataClassification: 'Internal',
      isEnabledGlobal: true,
    },
  });

  const selectedModuleId = watch('moduleId');
  const { data: siblingFeaturesData } = useFeatures({
    moduleId: selectedModuleId || undefined,
    pageSize: 100,
  });

  useEffect(() => {
    if (isOpen) {
      if (feature) {
        reset({
          moduleId: feature.moduleId,
          code: feature.code,
          name: feature.name,
          description: feature.description || '',
          featureType: feature.featureType,
          parentFeatureId: feature.parentFeatureId || '',
          routePath: feature.routePath || '',
          apiEndpoint: feature.apiEndpoint || '',
          componentKey: feature.componentKey || '',
          icon: feature.icon || 'Cpu',
          orderIndex: feature.orderIndex || 0,
          supportedActions: feature.supportedActions || '["view"]',
          status: feature.status,
          ownerTeam: feature.ownerTeam || 'Platform Team',
          dataClassification: feature.dataClassification || 'Internal',
          isEnabledGlobal: feature.isEnabledGlobal,
        });
      } else {
        reset({
          moduleId: defaultModuleId || (hierarchy && hierarchy.length > 0 ? hierarchy[0].id : ''),
          code: '',
          name: '',
          description: '',
          featureType: 'Screen',
          parentFeatureId: defaultParentFeatureId || '',
          routePath: '',
          apiEndpoint: '',
          componentKey: '',
          icon: 'Cpu',
          orderIndex: 0,
          supportedActions: '["view", "create", "edit", "delete"]',
          status: 'Active',
          ownerTeam: 'Platform Team',
          dataClassification: 'Internal',
          isEnabledGlobal: true,
        });
      }
    }
  }, [isOpen, feature, defaultModuleId, hierarchy, reset]);

  const onSubmit = async (values: FormValues) => {
    const parentId = values.parentFeatureId ? values.parentFeatureId : null;

    if (isEditing && feature) {
      const updateReq: UpdateFeatureRequest = {
        name: values.name,
        description: values.description || undefined,
        featureType: values.featureType,
        parentFeatureId: parentId,
        routePath: values.routePath || undefined,
        apiEndpoint: values.apiEndpoint || undefined,
        componentKey: values.componentKey || undefined,
        icon: values.icon || undefined,
        orderIndex: Number(values.orderIndex),
        supportedActions: values.supportedActions || undefined,
        status: values.status,
        ownerTeam: values.ownerTeam,
        dataClassification: values.dataClassification,
        isEnabledGlobal: values.isEnabledGlobal,
      };
      await updateMutation.mutateAsync({ id: feature.id, request: updateReq });
    } else {
      const createReq: CreateFeatureRequest = {
        moduleId: values.moduleId,
        code: values.code,
        name: values.name,
        description: values.description || undefined,
        featureType: values.featureType,
        parentFeatureId: parentId,
        routePath: values.routePath || undefined,
        apiEndpoint: values.apiEndpoint || undefined,
        componentKey: values.componentKey || undefined,
        icon: values.icon || undefined,
        orderIndex: Number(values.orderIndex),
        supportedActions: values.supportedActions || undefined,
        status: values.status,
        ownerTeam: values.ownerTeam,
        dataClassification: values.dataClassification,
        isEnabledGlobal: values.isEnabledGlobal,
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
      title={isEditing ? 'Cập nhật Tính năng (Feature)' : 'Đăng ký Tính năng mới'}
      subtitle={isEditing ? `Mã tính năng: ${feature?.code}` : 'Đăng ký metadata chức năng, endpoint và phân loại dữ liệu'}
      width="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            {isEditing ? 'Lưu thay đổi' : 'Đăng ký Tính năng'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Module Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Phân hệ Trực thuộc (Module) <span className="text-rose-500">*</span>
          </label>
          <select
            {...register('moduleId', { required: 'Phân hệ là bắt buộc' })}
            disabled={isEditing}
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">-- Chọn phân hệ trực thuộc --</option>
            {hierarchy?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
          {errors.moduleId && <p className="text-xs text-rose-500 mt-1">{errors.moduleId.message}</p>}
        </div>

        {/* Feature Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mã Tính năng (FeatureCode) <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('code', {
              required: 'Mã tính năng là bắt buộc',
              pattern: {
                value: /^[a-z0-9_.]+$/,
                message: 'Chỉ chấp nhận chữ thường, số, dấu chấm và gạch dưới',
              },
            })}
            disabled={isEditing}
            placeholder="Ví dụ: identity.user_groups, org.legal_entities"
            className="w-full px-3 py-2 text-sm font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
          {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code.message}</p>}
          {!isEditing && (
            <p className="text-[11px] text-slate-500 mt-1">Mã định danh duy nhất và ổn định xuyên suốt vòng đời hệ thống.</p>
          )}
        </div>

        {/* Feature Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tên Tính năng <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('name', { required: 'Tên tính năng là bắt buộc' })}
            placeholder="Ví dụ: Quản trị Nhóm quyền & Scope (GBAC)"
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
            rows={2}
            placeholder="Mô tả mục đích và phạm vi sử dụng của chức năng này..."
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Feature Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Loại Tính năng (FeatureType)
            </label>
            <select
              {...register('featureType')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Screen">Screen (Màn hình giao diện)</option>
              <option value="Api">Api (Endpoint dịch vụ)</option>
              <option value="BusinessProcess">BusinessProcess (Quy trình nghiệp vụ)</option>
              <option value="Report">Report (Báo cáo & Phân tích)</option>
              <option value="Component">Component (Thành phần UI/Widget)</option>
              <option value="Service">Service (Dịch vụ nền)</option>
            </select>
          </div>

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
              <option value="Disabled">Disabled (Tắt)</option>
              <option value="Deprecated">Deprecated (Khai tử)</option>
            </select>
          </div>
        </div>

        {/* Parent Feature */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tính năng cha (Phân cấp con nếu áp dụng)
          </label>
          <select
            {...register('parentFeatureId')}
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Tính năng cấp 1 (Không có cha) --</option>
            {siblingFeaturesData?.items
              ?.filter((f) => f.id !== feature?.id)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
          </select>
        </div>

        {/* Technical References */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Thông tin Kỹ thuật (Route & API Reference)
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Route Path (Frontend)
              </label>
              <input
                {...register('routePath')}
                placeholder="/admin/user-groups"
                className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                API Endpoint (Backend)
              </label>
              <input
                {...register('apiEndpoint')}
                placeholder="/api/v1/identity/user-groups"
                className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Component Key
              </label>
              <input
                {...register('componentKey')}
                placeholder="UserGroupList"
                className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Biểu tượng (Icon)
              </label>
              <select
                {...register('icon')}
                className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {COMMON_FEATURE_ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ownership & Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Đội ngũ Phụ trách (Owner Team)
            </label>
            <input
              {...register('ownerTeam')}
              placeholder="Ví dụ: Security Team, Platform Team"
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phân loại Dữ liệu (Classification)
            </label>
            <select
              {...register('dataClassification')}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Public">Public (Công khai)</option>
              <option value="Internal">Internal (Nội bộ tiêu chuẩn)</option>
              <option value="Confidential">Confidential (Bảo mật cao)</option>
              <option value="Restricted">Restricted (Nghiêm ngặt)</option>
            </select>
          </div>
        </div>

        {/* Supported Actions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Danh sách Hành động Hỗ trợ (JSON Array)
          </label>
          <input
            {...register('supportedActions')}
            placeholder='["view", "create", "edit", "delete"]'
            className="w-full px-3 py-2 text-sm font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Định nghĩa các actions được module hỗ trợ (ví dụ: view, create, edit, delete, export, assign, approve).
          </p>
        </div>

        {/* Global Enabled Flag */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input
            type="checkbox"
            id="isEnabledGlobal"
            {...register('isEnabledGlobal')}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="isEnabledGlobal" className="text-xs font-medium text-slate-700 cursor-pointer">
            Kích hoạt tính năng trên toàn hệ thống (Global Enablement Flag)
          </label>
        </div>
      </form>
    </SideDrawer>
  );
};
