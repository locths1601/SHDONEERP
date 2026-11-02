import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FolderTree, 
  Key, 
  Globe, 
  Plus, 
  Eye, 
  ShieldCheck, 
  Building2, 
  Users, 
  Database, 
  FileText, 
  GitBranch, 
  History, 
  Cpu, 
  Search 
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Can } from '../../../components/common/AuthGuards';
import { Skeleton } from '../../../components/common/Skeleton';
import { 
  FeatureHierarchy, 
  FeatureType, 
  FeatureStatus, 
  Feature 
} from '../types/moduleRegistry';
import { 
  useFeatureHierarchy, 
  useModuleHierarchy 
} from '../hooks/useModuleRegistry';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';
import { FeatureFormDrawer } from './FeatureFormDrawer';

export const FeatureHierarchyTree: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [detailFeatureId, setDetailFeatureId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [parentFeatureForCreate, setParentFeatureForCreate] = useState<string | undefined>(undefined);

  const { data: moduleHierarchy, isLoading: loadingModules } = useModuleHierarchy();
  const { data: featureNodes, isLoading: loadingFeatures } = useFeatureHierarchy(
    selectedModuleId || undefined
  );

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    if (!featureNodes) return;
    const allIds: Record<string, boolean> = {};
    const recurse = (nodes: FeatureHierarchy[]) => {
      nodes.forEach((n) => {
        allIds[n.id] = true;
        if (n.children?.length) recurse(n.children);
      });
    };
    recurse(featureNodes);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const getTypeBadge = (type: FeatureType) => {
    switch (type) {
      case 'Screen':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Screen</span>;
      case 'Component':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Component</span>;
      case 'Report':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Report</span>;
      case 'Api':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Api</span>;
      case 'BusinessProcess':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">Process</span>;
      case 'Service':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">Service</span>;
    }
  };

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active" />;
      case 'Beta':
        return <span className="inline-block w-2 h-2 rounded-full bg-amber-500" title="Beta" />;
      case 'Deprecated':
        return <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title="Deprecated" />;
      case 'Disabled':
        return <span className="inline-block w-2 h-2 rounded-full bg-slate-400" title="Disabled" />;
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Building2': return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'Users': return <Users className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Database': return <Database className="w-3.5 h-3.5 text-amber-600" />;
      case 'FileText': return <FileText className="w-3.5 h-3.5 text-purple-600" />;
      case 'GitBranch': return <GitBranch className="w-3.5 h-3.5 text-pink-600" />;
      case 'History': return <History className="w-3.5 h-3.5 text-slate-600" />;
      case 'Cpu': return <Cpu className="w-3.5 h-3.5 text-cyan-600" />;
      default: return <Globe className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  // Filter tree recursively based on searchTerm
  const filterNodes = (nodes: FeatureHierarchy[]): FeatureHierarchy[] => {
    if (!searchTerm.trim()) return nodes;
    const term = searchTerm.toLowerCase();

    return nodes
      .map((node) => {
        const matchesSelf =
          node.code.toLowerCase().includes(term) ||
          node.name.toLowerCase().includes(term) ||
          (node.routePath && node.routePath.toLowerCase().includes(term));
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        if (matchesSelf || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter((n): n is FeatureHierarchy => n !== null);
  };

  const filteredTree = featureNodes ? filterNodes(featureNodes) : [];

  const renderTreeNode = (node: FeatureHierarchy, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? (depth < 1); // Expand top-level by default

    return (
      <div key={node.id} className="relative">
        <div
          className={`group flex items-center justify-between p-2 rounded-xl transition border text-sm ${
            depth === 0
              ? 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-xs'
              : 'bg-slate-50/60 hover:bg-white border-slate-200/60'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded hover:bg-slate-200 text-slate-500 transition"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 shrink-0" />
            )}

            <div className="p-1 bg-slate-100 rounded border border-slate-200 shrink-0">
              {renderIcon(node.icon || '')}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/80 px-1.5 py-0.5 rounded">
                {node.code}
              </span>
              <span className="font-semibold text-slate-900 truncate">{node.name}</span>
              {getTypeBadge(node.featureType)}
              {getStatusBadge(node.status)}
            </div>

            {node.routePath && (
              <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {node.routePath}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
              title={`${node.actionCount} hành động đã cấu hình`}
            >
              <Key className="w-3 h-3" />
              {node.actionCount}
            </span>

            <button
              onClick={() => setDetailFeatureId(node.id)}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>

            <Can permission="system.feature.manage">
              <button
                onClick={() => {
                  setParentFeatureForCreate(node.id);
                  setEditingFeature(null);
                  setFormOpen(true);
                }}
                className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                title="Thêm tính năng con"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Can>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 relative">
            {/* Guide line */}
            <div
              className="absolute left-[11px] top-0 bottom-2 w-px bg-slate-200"
              style={{ left: `${depth * 24 + 11}px` }}
            />
            {node.children.map((child: FeatureHierarchy) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Lọc theo Phân hệ:</span>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Toàn bộ hệ thống</option>
              {moduleHierarchy?.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.code} - {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tính năng trong cây..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Mở rộng tất cả
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Thu gọn tất cả
          </Button>
          <Can permission="system.feature.manage">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setParentFeatureForCreate(undefined);
                setEditingFeature(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Thêm tính năng
            </Button>
          </Can>
        </div>
      </div>

      {/* Tree View */}
      {loadingFeatures || loadingModules ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6 ml-6" />
          <Skeleton className="h-10 w-4/6 ml-12" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-200 text-center">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Chưa có cây phân cấp tính năng</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Không tìm thấy tính năng nào phù hợp với điều kiện lọc hoặc phân hệ này chưa được gán tính năng.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTree.map((rootNode) => renderTreeNode(rootNode, 0))}
        </div>
      )}

      {/* Detail Drawer */}
      <FeatureDetailDrawer
        isOpen={!!detailFeatureId}
        onClose={() => setDetailFeatureId(null)}
        featureId={detailFeatureId}
      />

      {/* Form Drawer */}
      <FeatureFormDrawer
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFeature(null);
          setParentFeatureForCreate(undefined);
        }}
        feature={editingFeature}
        defaultModuleId={selectedModuleId}
        defaultParentFeatureId={parentFeatureForCreate}
      />
    </div>
  );
};
