import React, { useState } from 'react';
import { 
  Key, 
  Globe, 
  ExternalLink, 
  Code, 
  Tag, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2 
} from 'lucide-react';
import { SideDrawer, ConfirmDialog } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Skeleton } from '../../../components/common/Skeleton';
import { Can } from '../../../components/common/AuthGuards';
import { 
  useFeature, 
  useRemoveFeatureAction 
} from '../hooks/useModuleRegistry';
import { 
  FeatureStatus, 
  FeatureType, 
  DataClassification, 
  FeatureActionPermission 
} from '../types/moduleRegistry';
import { ActionMappingDrawer } from './ActionMappingDrawer';

interface FeatureDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  featureId: string | null;
  onEdit?: () => void;
}

export const FeatureDetailDrawer: React.FC<FeatureDetailDrawerProps> = ({
  isOpen,
  onClose,
  featureId,
  onEdit,
}) => {
  const { data: feature, isLoading } = useFeature(featureId);
  const removeActionMutation = useRemoveFeatureAction();

  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<FeatureActionPermission | null>(null);
  const [deletingAction, setDeletingAction] = useState<FeatureActionPermission | null>(null);

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Hoạt động (Active)</span>;
      case 'Beta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Thử nghiệm (Beta)</span>;
      case 'Deprecated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Sắp khai tử (Deprecated)</span>;
      case 'Disabled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">Vô hiệu hóa (Disabled)</span>;
    }
  };

  const getTypeBadge = (type: FeatureType) => {
    switch (type) {
      case 'Screen':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Màn hình (Screen)</span>;
      case 'Component':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Thành phần (Component)</span>;
      case 'Report':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Báo cáo (Report)</span>;
      case 'Api':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">API Endpoint</span>;
      case 'BusinessProcess':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200">Nghiệp vụ (Process)</span>;
      case 'Service':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">Dịch vụ (Service)</span>;
    }
  };

  const getClassificationBadge = (cls: DataClassification) => {
    switch (cls) {
      case 'Public':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Công khai (Public)</span>;
      case 'Internal':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Nội bộ (Internal)</span>;
      case 'Confidential':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Bảo mật (Confidential)</span>;
      case 'Restricted':
        return <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Tuyệt mật (Restricted)</span>;
    }
  };

  const handleDeleteActionConfirm = async () => {
    if (!featureId || !deletingAction) return;
    try {
      await removeActionMutation.mutateAsync({
        featureId,
        actionMappingId: deletingAction.id,
      });
      setDeletingAction(null);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết Tính năng & Phân quyền"
        subtitle={feature ? `${feature.moduleCode} / ${feature.code}` : undefined}
        width="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">
              {feature?.actions?.length || 0} hành động được thiết lập
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Can permission="system.feature.manage">
                {onEdit && (
                  <Button variant="primary" onClick={onEdit}>
                    Chỉnh sửa thông tin
                  </Button>
                )}
              </Can>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !feature ? (
          <div className="p-8 text-center text-slate-500">
            Không tìm thấy thông tin tính năng.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                      {feature.code}
                    </span>
                    {getTypeBadge(feature.featureType)}
                    {getStatusBadge(feature.status)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{feature.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 block">Thuộc phân hệ</span>
                  <span className="text-sm font-semibold text-blue-600 font-mono">
                    {feature.moduleCode} - {feature.moduleName}
                  </span>
                </div>
              </div>

              {feature.description && (
                <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                  {feature.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Đội ngũ phụ trách:</span>
                  <span className="font-medium text-slate-800">{feature.ownerTeam || 'Chưa gán'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phân loại dữ liệu:</span>
                  <span className="mt-0.5 block">{getClassificationBadge(feature.dataClassification)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Thứ tự hiển thị:</span>
                  <span className="font-mono font-medium text-slate-800">{feature.orderIndex}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phạm vi toàn hệ thống:</span>
                  <span className={`font-semibold ${feature.isEnabledGlobal ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {feature.isEnabledGlobal ? 'Có kích hoạt' : 'Tùy chọn'}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Thông số Kỹ thuật & Routing
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Frontend Route Path
                  </span>
                  <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {feature.routePath || 'N/A'}
                  </code>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    Backend API Endpoint
                  </span>
                  <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-blue-700">
                    {feature.apiEndpoint || 'N/A'}
                  </code>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    Component Key
                  </span>
                  <code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-purple-700">
                    {feature.componentKey || 'N/A'}
                  </code>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Supported Actions (CSVs)
                  </span>
                  <span className="text-slate-700 font-mono">
                    {feature.supportedActions || 'view, create, edit, delete'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Permission Mappings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Hành động & Ánh xạ Mã quyền (GBAC)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mỗi tính năng định nghĩa các hành động cụ thể và liên kết tới mã quyền kiểm soát truy cập
                  </p>
                </div>
                <Can permission="system.feature.manage">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingAction(null);
                      setActionDrawerOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Thêm hành động
                  </Button>
                </Can>
              </div>

              {(!feature.actions || feature.actions.length === 0) ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Chưa có hành động nào được cấu hình</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Nhấn "Thêm hành động" để thiết lập mã quyền cho tính năng này.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {feature.actions.map((act) => (
                    <div key={act.id} className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {act.actionCode}
                          </span>
                          <span className="text-sm font-medium text-slate-900">{act.actionName}</span>
                          {act.isDefault && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.2 rounded border border-blue-200">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400">Ánh xạ quyền:</span>
                          <span className="font-mono font-semibold text-indigo-700 bg-indigo-50/70 px-1.5 py-0.5 rounded border border-indigo-100">
                            {act.permissionCode}
                          </span>
                          {act.permissionId && (
                            <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                              Catalog ID
                            </span>
                          )}
                        </div>
                        {act.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                        )}
                      </div>

                      <Can permission="system.feature.manage">
                        <div className="flex items-center gap-1 shrink-0 ml-4">
                          <button
                            onClick={() => {
                              setEditingAction(act);
                              setActionDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Chỉnh sửa hành động"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingAction(act)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Gỡ bỏ hành động"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Can>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit info */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ngày tạo: {feature.createdAtUtc ? new Date(feature.createdAtUtc).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
              <span>
                Cập nhật lần cuối: {feature.updatedAtUtc ? new Date(feature.updatedAtUtc).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
          </div>
        )}
      </SideDrawer>

      {/* Action Mapping Drawer */}
      <ActionMappingDrawer
        isOpen={actionDrawerOpen}
        onClose={() => {
          setActionDrawerOpen(false);
          setEditingAction(null);
        }}
        featureId={featureId}
        actionMapping={editingAction}
      />

      {/* Action Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingAction}
        onClose={() => setDeletingAction(null)}
        onConfirm={handleDeleteActionConfirm}
        title="Gỡ bỏ Hành động & Mã quyền"
        message={`Bạn có chắc chắn muốn xóa hành động "${deletingAction?.actionCode} - ${deletingAction?.actionName}" khỏi tính năng này không?`}
        confirmLabel="Xóa hành động"
        variant="danger"
        isLoading={removeActionMutation.isPending}
      />
    </>
  );
};
