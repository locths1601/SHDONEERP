import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Filter,
  Layers,
  ArrowUpDown,
  AlignJustify,
  Search,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Palette,
  LayoutGrid,
  KanbanSquare,
  Table2,
} from 'lucide-react';
import {
  DataGridColumn,
  DataGridGroupOption,
  DataGridSortState,
  DataGridFilterCondition,
  FilterOperator,
  RowHeightMode,
  ConditionalColorRule,
} from './types';
import { ConditionalFormattingModal } from './ConditionalFormattingModal';
import { formatHeaderTitle } from './excelUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/common/Button';
import { CrudButton } from '@/components/ui/CrudButton';
import { DatePicker } from '@/components/common/DatePicker';

export interface DataGridToolbarProps<T = any> {
  columns: DataGridColumn<T>[];
  visibleColumnIds: string[];
  onToggleColumnVisibility: (colId: string) => void;
  onShowAllColumns?: () => void;
  onResetColumns?: () => void;

  // Pinning
  pinnedColumnIds?: { left: string[]; right: string[] };
  onTogglePinColumn?: (colId: string) => void;

  // Grouping
  groupOptions?: DataGridGroupOption[];
  groupBy: string;
  onGroupByChange: (groupBy: string) => void;

  // Sorting
  sortState: DataGridSortState;
  onSortChange: (sort: DataGridSortState) => void;

  // Row Height
  rowHeight: RowHeightMode;
  onRowHeightChange: (height: RowHeightMode) => void;

  // Search & Filter
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filters?: DataGridFilterCondition[];
  onFiltersChange?: (filters: DataGridFilterCondition[]) => void;
  columnFilters?: Record<string, string>;
  onColumnFiltersChange?: (filters: Record<string, string>) => void;

  // Counters & Actions
  totalCount: number;
  filteredCount: number;
  onExportCsv?: () => void;
  onImportCsv?: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;

  // Conditional Formatting
  conditionalRules?: ConditionalColorRule[];
  onConditionalRulesChange?: (rules: ConditionalColorRule[]) => void;
  enableConditionalFormatting?: boolean;

  // View modes switcher (Grid / Kanban / Table)
  viewModes?: { key: string; label: string; icon?: React.ReactNode }[];
  activeViewMode?: string;
  onViewModeChange?: (mode: any) => void;

  // Custom slots
  extraLeft?: React.ReactNode;
  extraRight?: React.ReactNode;
  className?: string;

  // Excel Toolbar Additions
  onOpenFindReplace?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}



export function DataGridToolbar<T = any>({
  columns,
  visibleColumnIds,
  onToggleColumnVisibility,
  onShowAllColumns,
  onResetColumns,
  pinnedColumnIds = { left: [], right: [] },
  onTogglePinColumn,
  groupOptions = [],
  groupBy,
  onGroupByChange,
  sortState,
  onSortChange,
  rowHeight,
  onRowHeightChange,
  conditionalRules = [],
  onConditionalRulesChange,
  enableConditionalFormatting = true,
  searchQuery,
  onSearchQueryChange,
  filters = [],
  onFiltersChange,
  columnFilters = {},
  onColumnFiltersChange,
  totalCount,
  filteredCount,
  onExportCsv,
  onImportCsv,
  onAddNew,
  addNewLabel = 'Thêm bản ghi',
  viewModes,
  activeViewMode,
  onViewModeChange,
  extraLeft,
  extraRight,
  className = '',
  onOpenFindReplace,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: DataGridToolbarProps<T>) {

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isRowHeightOpen, setIsRowHeightOpen] = useState(false);
  const [isFormattingOpen, setIsFormattingOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');

  const hideableColumns = columns.filter((col) => col.hideable !== false);
  const filterableColumns = columns.filter((col) => col.filterable !== false);
  const sortableColumns = columns.filter((col) => col.sortable !== false);

  const isGroupActive = groupBy !== 'none' && groupBy !== '';
  const isSortActive = sortState.field !== '' && sortState.field !== 'none';
  const columnFilterCount = Object.keys(columnFilters).filter((k) => !!columnFilters[k]).length;
  const activeFilterCount = filters.length + columnFilterCount + (searchQuery.trim() ? 1 : 0);
  const activeFormattingCount = (conditionalRules || []).filter((r) => r.enabled).length;

  const activeGroupOption = groupOptions.find((g) => g.key === groupBy);


  // Add new filter condition
  const handleAddCondition = () => {
    if (!onFiltersChange || filterableColumns.length === 0) return;
    const newCond: DataGridFilterCondition = {
      id: String(Date.now()),
      field: filterableColumns[0].id,
      operator: 'contains',
      value: '',
    };
    onFiltersChange([...filters, newCond]);
  };

  const handleUpdateCondition = (id: string, updates: Partial<DataGridFilterCondition>) => {
    if (!onFiltersChange) return;
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveCondition = (id: string) => {
    if (!onFiltersChange) return;
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleClearAllFilters = () => {
    if (onFiltersChange) onFiltersChange([]);
    if (onColumnFiltersChange) onColumnFiltersChange({});
    onSearchQueryChange('');
  };

  // Filter columns by columnSearch in visibility popover
  const filteredHideableColumns = hideableColumns.filter((col) => {
    const title = typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id;
    return String(title).toLowerCase().includes(columnSearch.toLowerCase().trim());
  });

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 shrink-0 select-none w-full relative z-10 ${className}`}>
        {/* Flat Grid Control Bar: Sleek h-9.5 height with flat minimalist controls */}
        <div className="h-9 px-2 sm:px-3 flex items-center justify-between gap-1.5 text-xs relative">
          {/* BÊN TRÁI TOOLBAR (Filters & Search) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1 py-0.5">
            {extraLeft}

            {/* Ô Tìm kiếm phẳng nhỏ gọn */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm nhanh..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="h-7 pl-7 pr-6 w-36 sm:w-44 text-xs rounded-md border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 1. Bộ lọc Compact: <CrudButton action="filter" tooltip="Bộ lọc" /> */}
            {filterableColumns.length > 0 && (
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <div className="relative inline-flex shrink-0">
                    <CrudButton
                      action="filter"
                      tooltip="Bộ lọc"
                      size="sm"
                      variant={activeFilterCount > 0 ? 'secondary' : 'ghost'}
                      className={`h-8 w-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs ${
                        activeFilterCount > 0
                          ? 'border-blue-500/80 bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold'
                          : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-blue-600 dark:bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center pointer-events-none shadow-xs">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 sm:w-96 p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                  align="start"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                      <Filter className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      <span>Bộ lọc dữ liệu nâng cao</span>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa tất cả</span>
                      </button>
                    )}
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                    {filters.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs">
                        Chưa có điều kiện lọc nào. Bấm nút bên dưới để thêm điều kiện.
                      </div>
                    ) : (
                      filters.map((cond, idx) => (
                        <div
                          key={cond.id || idx}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                        >
                          {/* Field Selector */}
                          <select
                            value={cond.field}
                            onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value })}
                            className="h-7 px-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none w-28 shrink-0"
                          >
                            {filterableColumns.map((col) => (
                              <option key={col.id} value={col.id}>
                                {typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id}
                              </option>
                            ))}
                          </select>

                          {/* Operator */}
                          <select
                            value={cond.operator}
                            onChange={(e) =>
                              handleUpdateCondition(cond.id, {
                                operator: e.target.value as FilterOperator,
                              })
                            }
                            className="h-7 px-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none w-28 shrink-0"
                          >
                            <option value="contains">Chứa</option>
                            <option value="not_contains">Không chứa</option>
                            <option value="equals">Bằng</option>
                            <option value="not_equals">Khác</option>
                            <option value="starts_with">Bắt đầu bằng</option>
                            <option value="date_between">Từ ngày - Đến ngày</option>
                            <option value="date_from">Từ ngày (&gt;=)</option>
                            <option value="date_to">Đến ngày (&lt;=)</option>
                            <option value="is_empty">Trống</option>
                            <option value="is_not_empty">Không trống</option>
                          </select>

                          {/* Value input (if operator needs value) */}
                          {cond.operator === 'date_between' ? (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <DatePicker
                                value={typeof cond.value === 'object' ? cond.value?.from || '' : ''}
                                onChange={(val) =>
                                  handleUpdateCondition(cond.id, {
                                    value: {
                                      ...(typeof cond.value === 'object' ? cond.value : {}),
                                      from: val,
                                    },
                                  })
                                }
                                placeholder="Từ ngày..."
                                size="sm"
                                isClearable
                                containerClassName="flex-1 min-w-0"
                              />
                              <span className="text-[10px] text-slate-400">→</span>
                              <DatePicker
                                value={typeof cond.value === 'object' ? cond.value?.to || '' : ''}
                                onChange={(val) =>
                                  handleUpdateCondition(cond.id, {
                                    value: {
                                      ...(typeof cond.value === 'object' ? cond.value : {}),
                                      to: val,
                                    },
                                  })
                                }
                                placeholder="Đến ngày..."
                                size="sm"
                                isClearable
                                containerClassName="flex-1 min-w-0"
                              />
                            </div>
                          ) : cond.operator === 'date_from' || cond.operator === 'date_to' ? (
                            <DatePicker
                              value={cond.value || ''}
                              onChange={(val) => handleUpdateCondition(cond.id, { value: val })}
                              placeholder={cond.operator === 'date_from' ? 'Từ ngày...' : 'Đến ngày...'}
                              size="sm"
                              isClearable
                              containerClassName="flex-1 min-w-0"
                            />
                          ) : cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty' ? (
                            <input
                              type="text"
                              value={cond.value || ''}
                              onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                              placeholder="Giá trị..."
                              className="h-7 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none flex-1 min-w-0"
                            />
                          ) : null}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(cond.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Condition Button */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-dashed border-slate-300 dark:border-slate-700 text-blue-600 dark:text-sky-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm điều kiện</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 2. Cột hiển thị & Pinning Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden xl:inline">Cột hiển thị</span>
                  {pinnedColumnIds.left.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Có cột đang được cố định" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                align="start"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 mb-2 px-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Cột hiển thị & Cố định</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-sky-400">
                    {onShowAllColumns && (
                      <button
                        type="button"
                        onClick={onShowAllColumns}
                        className="hover:underline cursor-pointer"
                      >
                        Tất cả
                      </button>
                    )}
                    {onResetColumns && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={onResetColumns}
                          className="hover:underline cursor-pointer"
                        >
                          Đặt lại
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Column Search */}
                {hideableColumns.length > 8 && (
                  <div className="px-1 mb-2">
                    <input
                      type="text"
                      placeholder="Tìm tên cột..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full h-7 px-2 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
                  {filteredHideableColumns.map((col) => {
                    const isVisible = visibleColumnIds.includes(col.id);
                    const isPinned = pinnedColumnIds.left.includes(col.id);

                    return (
                      <div
                        key={col.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <label
                          onClick={() => onToggleColumnVisibility(col.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 mr-2"
                        >
                          {isVisible ? (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 shrink-0" />
                          )}
                          <span className={`text-xs font-medium truncate ${isVisible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                            {typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id}
                          </span>
                        </label>

                        {/* Pin toggle button */}
                        {onTogglePinColumn && (
                          <button
                            type="button"
                            onClick={() => onTogglePinColumn(col.id)}
                            title={isPinned ? 'Bỏ cố định cột này' : 'Cố định cột bên trái (Freeze Left)'}
                            className={`p-1 rounded transition-colors cursor-pointer ${isPinned
                                ? 'text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60'
                                : 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100'
                              }`}
                          >
                            {isPinned ? <Pin className="w-3 h-3 fill-current rotate-45" /> : <PinOff className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* 3. Grouping Popover */}
            {groupOptions.length > 0 && (
              <Popover open={isGroupOpen} onOpenChange={setIsGroupOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${isGroupActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="hidden xl:inline">Gom nhóm</span>
                    {isGroupActive && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-sky-400">
                        ({activeGroupOption?.label})
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                  align="start"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 px-2 py-0.5">
                    Chọn tiêu chí Group by
                  </div>
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onGroupByChange('none');
                        setIsGroupOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-colors cursor-pointer ${!isGroupActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>Không Group by (Bảng phẳng)</span>
                      {!isGroupActive && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {groupOptions.map((opt) => {
                      const isSelected = groupBy === opt.key;
                      const IconComponent = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            onGroupByChange(opt.key);
                            setIsGroupOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-colors cursor-pointer ${isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {IconComponent && <IconComponent className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 4. Sorting Popover */}
            {sortableColumns.length > 0 && (
              <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${isSortActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="hidden xl:inline">Sắp xếp</span>
                    {isSortActive && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-sky-400">
                        ({sortState.direction === 'asc' ? 'A→Z' : 'Z→A'})
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                  align="start"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-100">Sắp xếp dữ liệu</span>
                    {isSortActive && (
                      <button
                        type="button"
                        onClick={() => onSortChange({ field: '', direction: 'asc' })}
                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Hủy sắp xếp
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Cột sắp xếp</label>
                      <select
                        value={sortState.field}
                        onChange={(e) =>
                          onSortChange({
                            ...sortState,
                            field: e.target.value,
                          })
                        }
                        className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Mặc định (Không sắp xếp)</option>
                        {sortableColumns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Thứ tự</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSortChange({ ...sortState, direction: 'asc' })}
                          className={`h-7 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${sortState.direction === 'asc'
                              ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-sky-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                          (A → Z)
                        </button>
                        <button
                          type="button"
                          onClick={() => onSortChange({ ...sortState, direction: 'desc' })}
                          className={`h-7 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${sortState.direction === 'desc'
                              ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-sky-400'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                          (Z → A)
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 5. Tô màu có điều kiện */}
            {enableConditionalFormatting && onConditionalRulesChange && (
              <>
                <button
                  type="button"
                  onClick={() => setIsFormattingOpen(true)}
                  className={`h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${activeFormattingCount > 0
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  title="Tô màu có điều kiện (Conditional Formatting)"
                >
                  <Palette className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="hidden xl:inline">Tô màu</span>
                  {activeFormattingCount > 0 && (
                    <span className="min-w-[15px] h-3.5 px-1 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[9px] font-bold inline-flex items-center justify-center">
                      {activeFormattingCount}
                    </span>
                  )}
                </button>

                <ConditionalFormattingModal
                  open={isFormattingOpen}
                  onOpenChange={setIsFormattingOpen}
                  rules={conditionalRules}
                  onRulesChange={onConditionalRulesChange}
                  columns={columns}
                />
              </>
            )}

            {/* 6. Độ cao hàng */}
            <Popover open={isRowHeightOpen} onOpenChange={setIsRowHeightOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  title="Độ cao hàng"
                >
                  <AlignJustify className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden xl:inline">Độ cao</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                align="start"
              >
                <div className="space-y-0.5">
                  {[
                    { key: 'compact', label: 'Thu nhỏ (32px)' },
                    { key: 'normal', label: 'Tiêu chuẩn (40px)' },
                    { key: 'tall', label: 'Rộng rãi (48px)' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onRowHeightChange(item.key as RowHeightMode);
                        setIsRowHeightOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${rowHeight === item.key
                          ? 'bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-600 dark:text-sky-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      <span>{item.label}</span>
                      {rowHeight === item.key && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* BÊN PHẢI TOOLBAR (View Mode & Main Actions) - CỐ ĐỊNH (PINNED) hoàn toàn không bị ảnh hưởng bởi cuộn */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10 pl-2 sm:pl-3 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.06)] dark:shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.4)]">
            {/* Segmented Switch View Mode (Grid / Kanban / Table) thiết kế liền khối siêu mỏng h-7 text-xs */}
            {viewModes && viewModes.length > 0 && (
              <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-7 shadow-2xs shrink-0">
                {viewModes.map((vm) => {
                  const isActive = activeViewMode === vm.key;
                  return (
                    <Tooltip key={vm.key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onViewModeChange?.(vm.key)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${isActive
                              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-400 shadow-xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                        >
                          {vm.icon ? (
                            vm.icon
                          ) : vm.key === 'grid' ? (
                            <LayoutGrid className="w-3 h-3" />
                          ) : vm.key === 'kanban' ? (
                            <KanbanSquare className="w-3 h-3" />
                          ) : (
                            <Table2 className="w-3 h-3" />
                          )}
                          <span className="hidden xl:inline">{vm.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {vm.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}

            {/* Custom extraRight slot */}
            {extraRight}

            {/* Record Count Badge (khi lọc) */}
            {filteredCount > 0 && filteredCount !== totalCount && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden 2xl:inline whitespace-nowrap px-0.5">
                <strong className="text-blue-600 dark:text-sky-400">{filteredCount}</strong>/{totalCount}
              </span>
            )}

            {/* Undo / Redo Buttons */}
            {(onUndo || onRedo) && (
              <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-700 pr-1 mr-0.5">
                {onUndo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={!canUndo}
                        onClick={onUndo}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-35 shadow-2xs transition-colors cursor-pointer shrink-0"
                        title="Hoàn tác (Ctrl+Z)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Hoàn tác (Ctrl+Z)
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Find & Replace Shortcut Button */}
            {onOpenFindReplace && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenFindReplace}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors cursor-pointer shrink-0"
                    title="Tìm kiếm & Thay thế (Ctrl+F)"
                  >
                    <Search className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Tìm kiếm & Thay thế (Ctrl+F)
                </TooltipContent>
              </Tooltip>
            )}




            {/* Icon Button cho Import */}
            {onImportCsv && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onImportCsv}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors cursor-pointer shrink-0"
                    title="Import dữ liệu Excel/CSV"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Import Excel
                </TooltipContent>
              </Tooltip>
            )}


            {/* Icon Button cho Export CSV */}
            {onExportCsv && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onExportCsv}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors cursor-pointer shrink-0"
                    title="Export Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Export Excel
                </TooltipContent>
              </Tooltip>
            )}

            {/* Nút Primary + Tạo Dự Án nhỏ gọn h-8 px-3 text-xs */}
            {onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs inline-flex items-center shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar (When filters are applied) */}
        {(filters.length > 0 || columnFilterCount > 0) && (
          <div className="px-3 py-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
            <span className="text-slate-400 font-semibold shrink-0">Đang lọc:</span>
            {filters.map((cond) => {
              const col = columns.find((c) => c.id === cond.field);
              const headerTitle = col ? (typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id) : cond.field;
              return (
                <span
                  key={cond.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0"
                >
                  <strong className="font-semibold">{headerTitle}</strong>
                  <span>{cond.operator === 'contains' ? 'chứa' : cond.operator === 'equals' ? '=' : cond.operator}:</span>
                  <span className="font-mono">{cond.value || '""'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            {Object.keys(columnFilters).map((colId) => {
              const val = columnFilters[colId];
              if (!val) return null;
              const col = columns.find((c) => c.id === colId);
              const headerTitle = col ? (typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id) : colId;
              return (
                <span
                  key={colId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0"
                >
                  <strong className="font-semibold">{headerTitle}</strong>
                  <span>: {val}</span>
                  <button
                    type="button"
                    onClick={() => onColumnFiltersChange && onColumnFiltersChange({ ...columnFilters, [colId]: '' })}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-slate-400 hover:text-rose-600 text-[10px] underline cursor-pointer ml-auto shrink-0"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
