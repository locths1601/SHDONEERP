import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Layers, 
  Boxes, 
  FolderTree, 
  Key 
} from 'lucide-react';
import { ModuleList } from '../../features/moduleRegistry/components/ModuleList';
import { FeatureList } from '../../features/moduleRegistry/components/FeatureList';
import { FeatureHierarchyTree } from '../../features/moduleRegistry/components/FeatureHierarchyTree';
import { ActionPermissionMappingViewer } from '../../features/moduleRegistry/components/ActionPermissionMappingViewer';

export type RegistryTab = 'modules' | 'features' | 'hierarchy' | 'mappings';

interface ModuleRegistryPageProps {
  initialTab?: RegistryTab;
}

export const ModuleRegistryPage: React.FC<ModuleRegistryPageProps> = ({ 
  initialTab = 'modules' 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as RegistryTab | null;
  const [activeTab, setActiveTab] = useState<RegistryTab>(tabParam || initialTab);

  useEffect(() => {
    if (tabParam && ['modules', 'features', 'hierarchy', 'mappings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: RegistryTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Module & Feature Registry
            </h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              FND-04 Enterprise
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Danh mục metadata nghiệp vụ tập trung: Quản lý Modules, Features, Actions và Ánh xạ Quyền hạn (GBAC) của toàn bộ SHD OneERP.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('modules')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'modules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Phân hệ Nghiệp vụ (Modules)</span>
          </button>

          <button
            onClick={() => handleTabChange('features')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'features'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Tính năng (Features)</span>
          </button>

          <button
            onClick={() => handleTabChange('hierarchy')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hierarchy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Cây Phân cấp Hệ thống</span>
          </button>

          <button
            onClick={() => handleTabChange('mappings')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'mappings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Ánh xạ Mã quyền (GBAC Map)</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'modules' && <ModuleList />}
        {activeTab === 'features' && <FeatureList />}
        {activeTab === 'hierarchy' && <FeatureHierarchyTree />}
        {activeTab === 'mappings' && <ActionPermissionMappingViewer />}
      </div>
    </div>
  );
};
