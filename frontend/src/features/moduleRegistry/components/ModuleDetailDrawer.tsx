import React from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Building2, 
  Users, 
  Database, 
  FileText, 
  GitBranch, 
  History, 
  Cpu, 
  Calendar, 
  Boxes, 
  Link2,
  FolderTree
} from 'lucide-react';
import { SideDrawer } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Skeleton } from '../../../components/common/Skeleton';
import { useModule } from '../hooks/useModuleRegistry';
import { ModuleStatus, DependencyType } from '../types/moduleRegistry';

interface ModuleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string | null;
  onEdit?: () => void;
  onManageDependencies?: () => void;
}

export const ModuleDetailDrawer: React.FC<ModuleDetailDrawerProps> = ({
  isOpen,
  onClose,
  moduleId,
  onEdit,
  onManageDependencies,
}) => {
  const { data: module, isLoading } = useModule(moduleId);

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Hoạt động (Active)</span>;
      case 'Beta':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Thử nghiệm (Beta)</span>;
      case 'Deprecated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Sắp khai tử (Deprecated)</span>;
      case 'Inactive':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">Vô hiệu hóa (Inactive)</span>;
    }
  };

  const getDepBadge = (type: DependencyType) => {
    switch (type) {
      case 'Required':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Bắt buộc</span>;
      case 'Optional':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Tùy chọn</span>;
      case 'Extension':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Mở rộng</span>;
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'Users': return <Users className="w-5 h-5 text-emerald-600" />;
      case 'Database': return <Database className="w-5 h-5 text-amber-600" />;
      case 'FileText': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'GitBranch': return <GitBranch className="w-5 h-5 text-pink-600" />;
      case 'History': return <History className="w-5 h-5 text-slate-600" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-cyan-600" />;
      default: return <Layers className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết Phân hệ Nghiệp vụ"
      subtitle={module ? `Mã: ${module.code} | v${module.version}` : 'Metadata Phân hệ'}
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onManageDependencies && (
            <Button variant="outline" size="sm" onClick={onManageDependencies}>
              <Link2 className="w-4 h-4 mr-1.5" /> Quản lý phụ thuộc
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {onEdit && (
              <Button variant="primary" size="sm" onClick={onEdit}>
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading || !module ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-200">
              {renderIcon(module.icon)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{module.name}</h4>
                {getStatusBadge(module.status)}
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-600">
                <span className="font-semibold bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800">{module.code}</span>
                <span>•</span>
                <span>Phiên bản: v{module.version}</span>
                <span>•</span>
                <span>Thứ tự: #{module.orderIndex}</span>
              </div>
              {module.description && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                  {module.description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Phân hệ cha (Trực thuộc)
              </span>
              {module.parentModuleName ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <FolderTree className="w-4 h-4 text-slate-500" />
                  <span>{module.parentModuleName}</span>
                  <span className="text-xs text-slate-500 font-mono">({module.parentModuleCode})</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">Phân hệ gốc (Cấp cao nhất)</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Thời hạn Hiệu lực
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Từ {module.effectiveFromUtc ? new Date(module.effectiveFromUtc).toLocaleDateString('vi-VN') : 'Mặc định'}</span>
                {module.effectiveToUtc && <span>- Đến {new Date(module.effectiveToUtc).toLocaleDateString('vi-VN')}</span>}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
              <span className="text-xl font-bold text-blue-700 block">{module.featureCount}</span>
              <span className="text-[11px] font-medium text-blue-600">Tính năng đăng ký</span>
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
              <span className="text-xl font-bold text-indigo-700 block">{module.dependencyCount}</span>
              <span className="text-[11px] font-medium text-indigo-600">Phân hệ phụ thuộc</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xl font-bold text-slate-700 block">{module.childModules?.length || 0}</span>
              <span className="text-[11px] font-medium text-slate-600">Phân hệ con</span>
            </div>
          </div>

          {/* Dependencies Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-slate-500" />
                Quan hệ Phụ thuộc (Module Dependencies)
              </h5>
              <span className="text-xs text-slate-500">{module.dependencies.length} liên kết</span>
            </div>
            {module.dependencies.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Phân hệ này độc lập, không yêu cầu phụ thuộc bắt buộc nào.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {module.dependencies.map((dep) => (
                  <div key={dep.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{dep.dependsOnModuleName}</span>
                        <span className="font-mono text-[11px] text-slate-500">({dep.dependsOnModuleCode})</span>
                        {getDepBadge(dep.dependencyType)}
                      </div>
                      {dep.minVersion && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Yêu cầu tối thiểu: v{dep.minVersion}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(dep.createdAtUtc).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Child Modules Section */}
          {module.childModules && module.childModules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  Phân hệ Con trực thuộc
                </h5>
                <span className="text-xs text-slate-500">{module.childModules.length} phân hệ</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {module.childModules.map((child) => (
                  <div key={child.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{child.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">({child.code})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-600">v{child.version}</span>
                      {getStatusBadge(child.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Timestamps */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Tạo ngày: {new Date(module.createdAtUtc).toLocaleString('vi-VN')}</span>
            {module.updatedAtUtc && <span>Sửa lần cuối: {new Date(module.updatedAtUtc).toLocaleString('vi-VN')}</span>}
          </div>
        </div>
      )}
    </SideDrawer>
  );
};
