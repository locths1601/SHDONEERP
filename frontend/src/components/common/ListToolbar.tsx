import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ListToolbarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  filters?: React.ReactNode;
  primaryAction?: React.ReactNode;
}

export const ListToolbar: React.FC<ListToolbarProps> = ({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm nhanh...',
  onRefresh,
  isRefreshing,
  filters,
  primaryAction,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition"
            />
          </div>
        )}
        {filters}
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Làm mới dữ liệu"
          >
            Làm mới
          </Button>
        )}
        {primaryAction}
      </div>
    </div>
  );
};
