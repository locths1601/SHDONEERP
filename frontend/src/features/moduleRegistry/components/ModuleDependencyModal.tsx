import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link2, Trash2, Plus } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { useModule, useModuleHierarchy, useAddModuleDependency, useRemoveModuleDependency } from '../hooks/useModuleRegistry';
import { DependencyType } from '../types/moduleRegistry';

interface ModuleDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string | null;
}

interface FormValues {
  dependsOnModuleId: string;
  dependencyType: DependencyType;
  minVersion: string;
}

export const ModuleDependencyModal: React.FC<ModuleDependencyModalProps> = ({
  isOpen,
  onClose,
  moduleId,
}) => {
  const { data: module } = useModule(moduleId);
  const { data: hierarchy } = useModuleHierarchy();
  const addMutation = useAddModuleDependency();
  const removeMutation = useRemoveModuleDependency();
  const [showAddForm, setShowAddForm] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      dependsOnModuleId: '',
      dependencyType: 'Required',
      minVersion: '1.0.0',
    },
  });

  const onAddSubmit = async (values: FormValues) => {
    if (!moduleId || !values.dependsOnModuleId) return;

    await addMutation.mutateAsync({
      moduleId,
      request: {
        dependsOnModuleId: values.dependsOnModuleId,
        dependencyType: values.dependencyType,
        minVersion: values.minVersion || undefined,
      },
    });

    reset();
    setShowAddForm(false);
  };

  const handleRemove = async (dependencyId: string) => {
    if (!moduleId) return;
    await removeMutation.mutateAsync({ moduleId, dependencyId });
  };

  const availableModules = hierarchy?.filter(
    (m) => m.id !== moduleId && !module?.dependencies.some((d) => d.dependsOnModuleId === m.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản lý Phụ thuộc Phân hệ"
      description={`Cấu hình các phân hệ mà [${module?.name || '...'}] phụ thuộc trực tiếp`}
      maxWidth="lg"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Current Dependencies List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách Phụ thuộc hiện có
            </span>
            {!showAddForm && (
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm phụ thuộc
              </Button>
            )}
          </div>

          {module?.dependencies.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              Phân hệ này hiện chưa khai báo quan hệ phụ thuộc nào.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {module?.dependencies.map((dep) => (
                <div key={dep.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50/70 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{dep.dependsOnModuleName}</span>
                      <span className="font-mono text-[11px] text-slate-500">({dep.dependsOnModuleCode})</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        dep.dependencyType === 'Required'
                          ? 'bg-rose-100 text-rose-800'
                          : dep.dependencyType === 'Extension'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {dep.dependencyType}
                      </span>
                    </div>
                    {dep.minVersion && (
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        Phiên bản tối thiểu: v{dep.minVersion}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(dep.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Xóa phụ thuộc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Dependency Form */}
        {showAddForm && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-blue-600" />
              Thêm Phụ thuộc mới
            </h6>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Chọn Phân hệ Phụ thuộc <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('dependsOnModuleId', { required: true })}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn phân hệ mục tiêu --</option>
                  {availableModules?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Loại phụ thuộc
                  </label>
                  <select
                    {...register('dependencyType')}
                    className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Required">Required (Bắt buộc phải có)</option>
                    <option value="Optional">Optional (Tùy chọn linh hoạt)</option>
                    <option value="Extension">Extension (Plugin / Mở rộng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Phiên bản tối thiểu
                  </label>
                  <input
                    {...register('minVersion')}
                    placeholder="1.0.0"
                    className="w-full px-3 py-1.5 text-xs font-mono border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Hủy
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit(onAddSubmit)} isLoading={addMutation.isPending}>
                  Lưu phụ thuộc
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
