import React, { useState, useMemo } from 'react';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  X,
  Pin,
  AlignJustify,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ColumnDef<T = any> {
  key?: string;
  header?: React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
  accessorKey?: string;
  id?: string;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
  sortable?: boolean;
  pinned?: 'left' | 'right' | false;
  hideable?: boolean;
}

export interface DataTableProps<TData = any> {
  data: TData[];
  columns: ColumnDef<TData>[] | any[];
  keyExtractor?: (item: TData, index: number) => string | number;
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  className?: string;
  emptyText?: string;
  enableSorting?: boolean;
  enableSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableRowHeight?: boolean;
  rowHeight?: 'compact' | 'normal' | 'tall';
  onRowHeightChange?: (height: 'compact' | 'normal' | 'tall') => void;
  toolbarExtra?: React.ReactNode;
}

export function DataTable<TData = any>({
  data = [],
  columns = [],
  keyExtractor,
  loading = false,
  onRowClick,
  pageSize,
  className,
  emptyText = 'Không có dữ liệu.',
  enableSorting = true,
  enableSearch = false,
  enableColumnVisibility = false,
  enableRowHeight = false,
  rowHeight: controlledRowHeight,
  onRowHeightChange,
  toolbarExtra,
}: DataTableProps<TData>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalRowHeight, setInternalRowHeight] = useState<'compact' | 'normal' | 'tall'>('normal');
  const [isRowHeightOpen, setIsRowHeightOpen] = useState(false);

  const rowHeight = controlledRowHeight ?? internalRowHeight;
  const setRowHeight = (h: 'compact' | 'normal' | 'tall') => {
    setInternalRowHeight(h);
    onRowHeightChange?.(h);
  };

  const heightClass =
    rowHeight === 'compact'
      ? 'py-1 text-xs'
      : rowHeight === 'tall'
      ? 'py-3.5 text-sm'
      : 'py-2 text-xs';

  // 1. Column Visibility & Pinning State
  const [visibleColKeys, setVisibleColKeys] = useState<string[]>(() =>
    columns.map((c, i) => c.key || c.accessorKey || c.id || String(i))
  );
  const [pinnedColKeys, setPinnedColKeys] = useState<string[]>(() =>
    columns
      .filter((c) => c.pinned === 'left')
      .map((c, i) => c.key || c.accessorKey || c.id || String(i))
  );

  // 2. Sorting State
  const [sortColKey, setSortColKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const safeData = Array.isArray(data) ? data : [];

  const getColIdentifier = (col: ColumnDef<TData>, index: number) =>
    col.key || col.accessorKey || col.id || String(index);

  const getHeaderTitle = (col: ColumnDef<TData>) => {
    if (typeof col.header === 'string' || typeof col.header === 'number') {
      return col.header;
    }
    if (React.isValidElement(col.header)) {
      return col.header;
    }
    return col.key || col.accessorKey || col.id || '';
  };

  const getRawValue = (item: TData, colKey: string) => {
    if (!item || typeof item !== 'object') return '';
    return (item as any)[colKey] ?? '';
  };

  // Handle header sort cycle: none -> asc -> desc -> none
  const handleSort = (colKey: string) => {
    if (sortColKey === colKey) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortColKey(null);
        setSortDir('asc');
      }
    } else {
      setSortColKey(colKey);
      setSortDir('asc');
    }
  };

  // Toggle Column Visibility
  const toggleVisibility = (colKey: string) => {
    if (visibleColKeys.includes(colKey)) {
      if (visibleColKeys.length <= 1) return; // keep at least 1 column
      setVisibleColKeys(visibleColKeys.filter((k) => k !== colKey));
      setPinnedColKeys(pinnedColKeys.filter((k) => k !== colKey));
    } else {
      setVisibleColKeys([...visibleColKeys, colKey]);
    }
  };

  // Toggle Pin Column
  const togglePin = (colKey: string) => {
    if (pinnedColKeys.includes(colKey)) {
      setPinnedColKeys(pinnedColKeys.filter((k) => k !== colKey));
    } else {
      setPinnedColKeys([...pinnedColKeys, colKey]);
      if (!visibleColKeys.includes(colKey)) {
        setVisibleColKeys([...visibleColKeys, colKey]);
      }
    }
  };

  // Filter & Sort Data
  const processedData = useMemo(() => {
    let result = [...safeData];

    // Search query
    if (enableSearch && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return columns.some((col) => {
          const key = col.key || col.accessorKey || col.id;
          if (!key) return false;
          const val = getRawValue(item, key);
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (enableSorting && sortColKey) {
      result.sort((a, b) => {
        const valA = getRawValue(a, sortColKey);
        const valB = getRawValue(b, sortColKey);

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB), 'vi');
        return sortDir === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [safeData, searchQuery, enableSearch, enableSorting, sortColKey, sortDir, columns]);

  const effectivePageSize = pageSize || (processedData.length > 0 ? processedData.length : 10);
  const totalPages = Math.ceil(processedData.length / effectivePageSize) || 1;

  const paginatedData = useMemo(() => {
    if (!pageSize) return processedData;
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  // Order columns: Pinned left first, then unpinned
  const activeColumns = useMemo(() => {
    const visible = columns.filter((col, idx) => {
      const id = getColIdentifier(col, idx);
      return visibleColKeys.includes(id);
    });

    const pinned = visible.filter((col, idx) => {
      const id = getColIdentifier(col, idx);
      return pinnedColKeys.includes(id);
    });

    const unpinned = visible.filter((col, idx) => {
      const id = getColIdentifier(col, idx);
      return !pinnedColKeys.includes(id);
    });

    return [...pinned, ...unpinned];
  }, [columns, visibleColKeys, pinnedColKeys]);

  // Calculate sticky left offsets
  const { pinnedOffsets, lastPinnedKey } = useMemo(() => {
    const offsets: Record<string, number> = {};
    let currentLeft = 0;
    let lastKey = '';

    activeColumns.forEach((col, idx) => {
      const id = getColIdentifier(col, idx);
      if (pinnedColKeys.includes(id)) {
        offsets[id] = currentLeft;
        let w = 120;
        if (typeof col.width === 'number') w = col.width;
        else if (typeof col.width === 'string' && col.width.endsWith('px')) {
          w = parseInt(col.width, 10);
        }
        currentLeft += w;
        lastKey = id;
      }
    });

    return { pinnedOffsets: offsets, lastPinnedKey: lastKey };
  }, [activeColumns, pinnedColKeys]);

  const renderCellContent = (col: ColumnDef<TData>, item: TData, index: number) => {
    if (col.render) {
      return col.render(item, index);
    }
    if (col.cell) {
      return col.cell({ row: { original: item } });
    }
    const propKey = col.key || col.accessorKey || col.id;
    if (propKey && item && typeof item === 'object') {
      return (item as any)[propKey] ?? '';
    }
    return null;
  };

  const showToolbar = enableSearch || enableColumnVisibility || toolbarExtra;

  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs font-sans',
        className
      )}
    >
      {/* Optional Top Mini Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-1">
            {enableSearch && (
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {toolbarExtra}
          </div>

          {enableColumnVisibility && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>Cột ({visibleColKeys.length}/{columns.length})</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-64 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg text-xs space-y-2 z-50"
              >
                <div className="font-bold text-slate-800 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800">
                  Tùy chỉnh cột
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
                  {columns.map((col, idx) => {
                    const id = getColIdentifier(col, idx);
                    const isVis = visibleColKeys.includes(id);
                    const isPinned = pinnedColKeys.includes(id);

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between py-1 px-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            disabled={col.hideable === false}
                            checked={isVis}
                            onChange={() => toggleVisibility(id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer disabled:opacity-40"
                          />
                          <span
                            className={`text-xs ${
                              isVis
                                ? 'text-slate-800 dark:text-slate-200 font-medium'
                                : 'text-slate-400 line-through'
                            }`}
                          >
                            {getHeaderTitle(col)}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => togglePin(id)}
                          title={isPinned ? 'Bỏ cố định' : 'Cố định bên trái'}
                          className={`p-1 rounded cursor-pointer ${
                            isPinned
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-full">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none shadow-2xs">
            <tr className="divide-x divide-slate-200/80 dark:divide-slate-800">
              {activeColumns.map((col, idx) => {
                const id = getColIdentifier(col, idx);
                const isPinned = pinnedColKeys.includes(id);
                const isLastPinned = id === lastPinnedKey;
                const leftOffset = pinnedOffsets[id];
                const isSortable = enableSorting && col.sortable !== false && Boolean(col.key || col.accessorKey || col.id);

                return (
                  <th
                    key={id}
                    style={{
                      width: col.width,
                      ...(isPinned
                        ? {
                            position: 'sticky',
                            left: `${leftOffset}px`,
                            zIndex: 15,
                          }
                        : {}),
                    }}
                    onClick={() => isSortable && handleSort(col.key || col.accessorKey || col.id || '')}
                    className={cn(
                      'px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 select-none transition-colors group',
                      isSortable && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      isPinned &&
                        `bg-white dark:bg-slate-900 ${
                          isLastPinned
                            ? 'border-r-2 border-r-blue-500/40 dark:border-r-sky-500/40 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)]'
                            : ''
                        }`
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{getHeaderTitle(col)}</span>
                      {isSortable && (
                        sortColKey === (col.key || col.accessorKey || col.id) ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-600 dark:text-sky-400 font-bold shrink-0" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-600 dark:text-sky-400 font-bold shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 shrink-0 transition-opacity" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length} className="py-12 text-center bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => {
                const rowKey = keyExtractor
                  ? keyExtractor(item, index)
                  : (item as any)?.id ?? index;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'divide-x divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {activeColumns.map((col, colIdx) => {
                      const id = getColIdentifier(col, colIdx);
                      const isPinned = pinnedColKeys.includes(id);
                      const isLastPinned = id === lastPinnedKey;
                      const leftOffset = pinnedOffsets[id];

                      return (
                        <td
                          key={id}
                          style={
                            isPinned
                              ? {
                                  position: 'sticky',
                                  left: `${leftOffset}px`,
                                  zIndex: 5,
                                }
                              : undefined
                          }
                          className={cn(
                            'px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 align-middle',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            isPinned &&
                              `bg-white dark:bg-slate-900 ${
                                isLastPinned
                                  ? 'border-r-2 border-r-blue-500/40 dark:border-r-sky-500/40 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)]'
                                  : ''
                              }`
                          )}
                        >
                          {renderCellContent(col, item, index)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="py-16 text-center bg-white dark:bg-slate-900"
                >
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {emptyText}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Pagination / Summary Footer */}
      {pageSize && totalPages > 1 && (
        <div className="sticky bottom-0 z-10 px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div>
            Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, processedData.length)}</strong> trên{' '}
            <strong>{processedData.length}</strong> kết quả
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
