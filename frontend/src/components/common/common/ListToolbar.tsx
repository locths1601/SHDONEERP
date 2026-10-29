import React, { ReactNode } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  MoreHorizontal,
  RotateCcw,
  X,
  LayoutGrid,
  KanbanSquare,
  Table2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SearchInput } from '@/components/common/Input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface FilterChipItem {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface ViewModeItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface SecondaryActionItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  tooltip?: string;
}

export interface PrimaryActionItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

export interface ListToolbarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  searchRef?: React.RefObject<HTMLDivElement | null>;
  searchWidthClass?: string;

  // Primary filter (rendered directly on row 1)
  primaryFilter?: ReactNode;

  // Secondary filters (rendered inside popover)
  secondaryFilters?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  popoverTitle?: string;

  // Active filter chips (rendered on conditional 2nd row)
  filterChips?: FilterChipItem[];

  // View modes (Grid / Kanban / Table)
  viewModes?: ViewModeItem[];
  activeViewMode?: string;
  onViewModeChange?: (mode: string) => void;

  // Density (compact / normal)
  density?: 'compact' | 'normal';
  onDensityChange?: (density: 'compact' | 'normal') => void;

  // Actions
  primaryAction?: PrimaryActionItem;
  secondaryActions?: SecondaryActionItem[];
  extraActions?: ReactNode;

  className?: string;
}

export function ListToolbar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  searchRef,
  searchWidthClass = 'w-44 sm:w-56 md:w-64',
  primaryFilter,
  secondaryFilters,
  activeFilterCount = 0,
  onResetFilters,
  popoverTitle = 'Bộ lọc nâng cao',
  filterChips = [],
  viewModes,
  activeViewMode,
  onViewModeChange,
  density,
  onDensityChange,
  primaryAction,
  secondaryActions = [],
  extraActions,
  className = '',
}: ListToolbarProps) {
  const hasFilterChips = filterChips.length > 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
        {/* ROW 1: Compact, Single-Row Main Toolbar (48px) với nhóm nút chính bên phải CỐ ĐỊNH (Pinned) */}
        <div className="h-12 px-3 sm:px-4 flex items-center justify-between gap-2 text-xs relative">
          {/* Left Group: Search + Primary Filter + Filter Popover - Cuộn ngang độc lập nếu thiếu chiều rộng */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scrollbar-none py-1">
            {/* Search Input */}
            {onSearchChange && (
              <div ref={searchRef as any} className={`shrink-0 ${searchWidthClass}`}>
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Primary Filter (e.g. Status) */}
            {primaryFilter && <div className="shrink-0">{primaryFilter}</div>}

            {/* More Filters Popover Trigger */}
            {secondaryFilters && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2.5 text-xs font-semibold gap-1.5 shrink-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all ${
                      activeFilterCount > 0
                        ? 'border-blue-500/80 text-blue-600 dark:text-sky-400 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Bộ lọc</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 dark:bg-sky-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-80 sm:w-96 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {popoverTitle}
                      </h4>
                      {activeFilterCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {activeFilterCount} đang áp dụng
                        </span>
                      )}
                    </div>
                    {onResetFilters && activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Đặt lại
                      </button>
                    )}
                  </div>

                  {/* Secondary filter inputs container */}
                  <div className="space-y-3">{secondaryFilters}</div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Right Group: CỐ ĐỊNH (PINNED) hoàn toàn không bị ảnh hưởng bởi cuộn */}
          <div className="flex items-center gap-1.5 shrink-0 z-10 pl-2 sm:pl-3 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.06)] dark:shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.4)]">
            {/* View Mode Switcher (Icon-only with Tooltip on laptops, short text on wide screens) */}
            {viewModes && viewModes.length > 0 && (
              <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-7 shadow-2xs">
                {viewModes.map((vm) => {
                  const isActive = activeViewMode === vm.key;
                  return (
                    <Tooltip key={vm.key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onViewModeChange?.(vm.key)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            isActive
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

            {/* Density Toggle (Icon with tooltip) */}
            {density && onDensityChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onDensityChange(density === 'compact' ? 'normal' : 'compact')}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
                  >
                    {density === 'compact' ? (
                      <Minimize2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {density === 'compact' ? 'Đang ở chế độ Thu gọn (Compact) - Bấm để đổi sang Tiêu chuẩn' : 'Đang ở chế độ Tiêu chuẩn (Normal) - Bấm để đổi sang Thu gọn'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Extra custom actions slot */}
            {extraActions}

            {/* Secondary Actions */}
            {secondaryActions.length > 0 && (
              <>
                {/* Icon-only actions are compact and displayed on all screens */}
                <div className="flex items-center gap-1.5">
                  {secondaryActions
                    .filter((act) => act.iconOnly)
                    .map((act, idx) => (
                      <TooltipProvider key={idx}>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={act.onClick}
                              disabled={act.disabled}
                              className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0"
                            >
                              {act.icon}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {act.tooltip || act.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                </div>

                {/* Text-based Secondary Actions (if any) */}
                {secondaryActions.some((act) => !act.iconOnly) && (
                  <>
                    <div className="hidden 2xl:flex items-center gap-1.5">
                      {secondaryActions
                        .filter((act) => !act.iconOnly)
                        .map((act, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={act.onClick}
                            disabled={act.disabled}
                            className="h-8 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                          >
                            {act.icon}
                            <span>{act.label}</span>
                          </Button>
                        ))}
                    </div>

                    <div className="2xl:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            title="Thao tác khác"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          {secondaryActions
                            .filter((act) => !act.iconOnly)
                            .map((act, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={act.onClick}
                                disabled={act.disabled}
                                className="gap-2 cursor-pointer py-2"
                              >
                                {act.icon}
                                <span>{act.label}</span>
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Primary Action Button */}
            {primaryAction && (
              <Button
                type="button"
                size="sm"
                onClick={primaryAction.onClick}
                className={`h-8 px-3 text-xs font-bold gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 whitespace-nowrap ${primaryAction.className || ''}`}
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </Button>
            )}
          </div>
        </div>

        {/* ROW 2: Conditional Active Filter Chips (Only rendered when chips exist) */}
        {hasFilterChips && (
          <div className="px-3 py-1 bg-blue-50/40 dark:bg-blue-950/20 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center flex-wrap gap-1.5 text-xs animate-in fade-in-50 duration-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-0.5">
              Đang lọc:
            </span>

            {filterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-sky-300 text-[11px] font-semibold shadow-2xs"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  title="Xóa bộ lọc này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="ml-auto text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer py-0.5"
              >
                <X className="w-3 h-3" />
                Xóa tất cả
              </button>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ListToolbar;
