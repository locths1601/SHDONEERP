import React, { useState, useMemo, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreVertical,
  Pin,
  PinOff,
  EyeOff,
  Filter,
  X,
  Search,
  Undo2,
  Redo2,
  CheckSquare,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import {
  DataGridProps,
  DataGridColumn,
  DataGridGroup,
  RowHeightMode,
  DataGridSortState,
  DataGridFilterCondition,
  ConditionalColorRule,
} from './types';
import { evaluateConditionalRules } from './conditionalFormatting';
import { DataGridToolbar } from './DataGridToolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useExcelGrid } from './useExcelGrid';
import { ExcelCellEditor } from './ExcelCellEditor';
import {
  getCellBorderPlacement,
  isCellEditable,
  calculateAutoFitColumnWidth,
  getColumnLetter,
  getCellValue,
  isCellInRange,
  formatHeaderTitle,
} from './excelUtils';
import { GridFindReplaceModal } from './GridFindReplaceModal';
import { ExcelContextMenu, ContextMenuPosition } from './ExcelContextMenu';


export function BaseDataGrid<T = any>({
  data = [],
  columns = [],
  keyExtractor = (item: any, idx: number) => String(item?.id ?? item?.key ?? item?.code ?? idx),

  // Sizing
  rowHeight: controlledRowHeight,
  onRowHeightChange: controlledOnRowHeightChange,
  className = '',

  // Selection
  selectable = true,
  selectedIds: controlledSelectedIds,
  onSelectionChange: controlledOnSelectionChange,
  showStt = true,

  // Grouping
  groupBy: controlledGroupBy,
  onGroupByChange: controlledOnGroupByChange,
  defaultGroupBy,
  groupOptions = [],
  defaultCollapsedGroups = {},
  onAddRowToGroup,
  renderGroupHeader,

  // Sorting
  sortState: controlledSortState,
  onSortChange: controlledOnSortChange,

  // Filters & Search
  searchQuery: controlledSearchQuery,
  onSearchQueryChange: controlledOnSearchQueryChange,
  filters: controlledFilters,
  onFiltersChange: controlledOnFiltersChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange: controlledOnColumnFiltersChange,

  // Column Visibility & Pinning
  visibleColumnIds: controlledVisibleColumnIds,
  onVisibleColumnIdsChange: controlledOnVisibleColumnIdsChange,
  pinnedColumnIds: controlledPinnedColumnIds,
  onPinnedColumnIdsChange: controlledOnPinnedColumnIdsChange,

  // Row Styling & Interaction
  conditionalRules: controlledConditionalRules,
  defaultConditionalRules,
  onConditionalRulesChange: controlledOnConditionalRulesChange,
  enableConditionalFormatting = true,
  gridStorageKey,
  rowHighlight,
  onRowClick,
  onRowDoubleClick,
  renderRowActions,

  // Loading & Empty
  loading = false,
  isError = false,
  errorMessage = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  emptyText = 'Không tìm thấy dữ liệu phù hợp.',

  // Footer & Pagination
  enableFooter = true,
  enablePagination = true,
  page: controlledPage,
  pageSize: controlledPageSize = 25,
  onPageChange: controlledOnPageChange,
  onPageSizeChange: controlledOnPageSizeChange,
  pageSizeOptions = [15, 25, 50, 100],
  footerSummary,

  // Toolbar
  enableToolbar = true,
  toolbarExtraLeft,
  toolbarExtraRight,
  onExportCsv,
  onImportCsv,
  onAddNew,
  addNewLabel = 'Thêm bản ghi',
  viewModes,
  activeViewMode,
  onViewModeChange,

  // Excel Interactivity & Advanced Features
  enableExcelMode = true,
  editable: controlledEditable,
  onCellsChange,
  onBatchUpdate,
  onAutoAddRows,
  allowDragToFill = true,
  allowClipboard = true,
  allowHistory = true,
  editOnSingleClick = false,
  gridRef,
  showColumnLetters = true,
  onInsertRowAbove,
  onInsertRowBelow,
  onDeleteRow,

  // Find & Replace (opt-in; default hidden)
  enableFindReplace = false,


  // Column Resizing & Reordering
  enableColumnResizing = true,
  columnWidths: controlledColumnWidths,
  onColumnWidthsChange: controlledOnColumnWidthsChange,
  enableColumnReordering = true,
  columnOrder: controlledColumnOrder,
  onColumnOrderChange: controlledOnColumnOrderChange,
  headerCase = 'default',
}: DataGridProps<T>) {

  const tableContainerRef = useRef<HTMLDivElement>(null);
  // Pagination internal state
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(controlledPageSize);
  // 1. Internal state fallbacks (for uncontrolled usage)
  const [internalConditionalRules, setInternalConditionalRules] = useState<ConditionalColorRule[]>(() => {
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`ezhr_datagrid_rules_${gridStorageKey}`);
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return defaultConditionalRules ?? [];
  });

  useEffect(() => {
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`ezhr_datagrid_rules_${gridStorageKey}`);
        if (saved !== null) {
          setInternalConditionalRules(JSON.parse(saved));
          return;
        }
      } catch (e) {
        // ignore
      }
      if (defaultConditionalRules) {
        setInternalConditionalRules(defaultConditionalRules);
      }
    }
  }, [gridStorageKey]);

  const conditionalRules = controlledConditionalRules ?? internalConditionalRules;
  const setConditionalRules = (newRules: ConditionalColorRule[]) => {
    if (controlledOnConditionalRulesChange) {
      controlledOnConditionalRulesChange(newRules);
    } else {
      setInternalConditionalRules(newRules);
    }
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`ezhr_datagrid_rules_${gridStorageKey}`, JSON.stringify(newRules));
      } catch (e) {
        // ignore
      }
    }
  };

  const [internalRowHeight, setInternalRowHeight] = useState<RowHeightMode>('normal');
  const [internalGroupBy, setInternalGroupBy] = useState<string>(defaultGroupBy ?? 'none');
  const [internalSortState, setInternalSortState] = useState<DataGridSortState>({
    field: '',
    direction: 'asc',
  });
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalFilters, setInternalFilters] = useState<DataGridFilterCondition[]>([]);
  const [internalColumnFilters, setInternalColumnFilters] = useState<Record<string, string>>({});
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  // Default visible columns: exclude those with hidden: true
  const [internalVisibleColumnIds, setInternalVisibleColumnIds] = useState<string[]>(() =>
    columns.filter((c) => !c.hidden).map((c) => c.id)
  );

  // Default pinned columns: those with pinned: 'left'
  const [internalPinnedColumnIds, setInternalPinnedColumnIds] = useState<{ left: string[]; right: string[] }>(() => {
    const left: string[] = [];
    const right: string[] = [];
    columns.forEach((c) => {
      if (c.pinned === 'left') left.push(c.id);
      else if (c.pinned === 'right') right.push(c.id);
    });
    return { left, right };
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    defaultCollapsedGroups
  );

  // Effective state resolution
  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const setPage = controlledOnPageChange ?? setInternalPage;
  const setPageSize = controlledOnPageSizeChange ?? setInternalPageSize;

  const rowHeight = controlledRowHeight ?? internalRowHeight;
  const setRowHeight = controlledOnRowHeightChange ?? setInternalRowHeight;

  const groupBy = controlledGroupBy ?? internalGroupBy;
  const setGroupBy = controlledOnGroupByChange ?? setInternalGroupBy;

  const sortState = controlledSortState ?? internalSortState;
  const setSortState = controlledOnSortChange ?? setInternalSortState;

  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const setSearchQuery = controlledOnSearchQueryChange ?? setInternalSearchQuery;

  const filters = controlledFilters ?? internalFilters;
  const setFilters = controlledOnFiltersChange ?? setInternalFilters;

  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const setColumnFilters = controlledOnColumnFiltersChange ?? setInternalColumnFilters;

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const setSelectedIds = controlledOnSelectionChange ?? setInternalSelectedIds;

  const visibleColumnIds = controlledVisibleColumnIds ?? internalVisibleColumnIds;
  const setVisibleColumnIds =
    controlledOnVisibleColumnIdsChange ?? setInternalVisibleColumnIds;

  const pinnedColumnIds = controlledPinnedColumnIds ?? internalPinnedColumnIds;
  const setPinnedColumnIds =
    controlledOnPinnedColumnIdsChange ?? setInternalPinnedColumnIds;

  // 1b. Column Widths (Resizing) with LocalStorage persistence
  const [internalColumnWidths, setInternalColumnWidths] = useState<Record<string, number>>(() => {
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`ezhr_datagrid_widths_${gridStorageKey}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const columnWidths = controlledColumnWidths ?? internalColumnWidths;
  const setColumnWidths = (
    widthsOrUpdater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)
  ) => {
    if (typeof widthsOrUpdater === 'function') {
      setInternalColumnWidths((prev) => {
        const next = widthsOrUpdater(prev);
        if (gridStorageKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`ezhr_datagrid_widths_${gridStorageKey}`, JSON.stringify(next));
          } catch (e) {}
        }
        controlledOnColumnWidthsChange?.(next);
        return next;
      });
    } else {
      setInternalColumnWidths(widthsOrUpdater);
      if (gridStorageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`ezhr_datagrid_widths_${gridStorageKey}`, JSON.stringify(widthsOrUpdater));
        } catch (e) {}
      }
      controlledOnColumnWidthsChange?.(widthsOrUpdater);
    }
  };

  // Helper to extract pixel width for a column
  const getColWidthNumber = useCallback(
    (col: DataGridColumn<T>): number => {
      const clamp = (val: number) => {
        let res = val;
        if (col.minWidth && res < col.minWidth) res = col.minWidth;
        if (col.maxWidth && res > col.maxWidth) res = col.maxWidth;
        return res;
      };

      if (columnWidths[col.id] !== undefined) {
        return clamp(columnWidths[col.id]);
      }
      if (typeof col.width === 'number') {
        return clamp(col.width);
      }
      if (typeof col.width === 'string') {
        if (col.width.endsWith('px')) {
          const parsed = parseInt(col.width, 10);
          if (!isNaN(parsed)) return clamp(parsed);
        }
        const twMap: Record<string, number> = {
          'w-12': 48,
          'w-14': 56,
          'w-16': 64,
          'w-20': 80,
          'w-24': 96,
          'w-28': 112,
          'w-32': 128,
          'w-36': 144,
          'w-40': 160,
          'w-44': 176,
          'w-48': 192,
          'w-52': 208,
          'w-56': 224,
          'w-60': 240,
          'w-64': 256,
          'w-72': 288,
          'w-80': 320,
          'w-96': 384,
        };
        if (twMap[col.width]) return clamp(twMap[col.width]);
      }
      return clamp(144);
    },
    [columnWidths]
  );

  // 1c. Column Order (Drag and Drop Reordering) with LocalStorage persistence
  const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(() => {
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`ezhr_datagrid_order_${gridStorageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return columns.map((c) => c.id);
  });

  useEffect(() => {
    setInternalColumnOrder((prev) => {
      const existing = new Set(prev);
      const newCols = columns.filter((c) => !existing.has(c.id)).map((c) => c.id);
      if (newCols.length > 0) {
        return [...prev, ...newCols];
      }
      return prev;
    });
  }, [columns]);

  const currentColumnOrder = controlledColumnOrder ?? internalColumnOrder;
  const setColumnOrder = (order: string[]) => {
    setInternalColumnOrder(order);
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`ezhr_datagrid_order_${gridStorageKey}`, JSON.stringify(order));
      } catch (e) {}
    }
    controlledOnColumnOrderChange?.(order);
  };

  // Column Resizing interactive state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [currentResizingWidth, setCurrentResizingWidth] = useState<number | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent, colId: string) => {
    if (!enableColumnResizing) return;
    e.preventDefault();
    e.stopPropagation();

    const col = columns.find((c) => c.id === colId);
    if (!col) return;

    const startX = e.clientX;
    const startW = getColWidthNumber(col);
    setResizingColId(colId);
    setCurrentResizingWidth(startW);

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const minW = Math.max(col.minWidth || 50, 40);
      const maxW = col.maxWidth || 1200;
      const newW = Math.max(minW, Math.min(maxW, Math.round(startW + deltaX)));

      setCurrentResizingWidth(newW);
      setColumnWidths((prev) => ({
        ...prev,
        [colId]: newW,
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setResizingColId(null);
      setCurrentResizingWidth(null);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeDoubleClick = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    const autoWidth = calculateAutoFitColumnWidth(col, data);
    setColumnWidths((prev) => ({
      ...prev,
      [colId]: autoWidth,
    }));
  };


  // Drag-and-Drop Column Reordering interactive state
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    colId: string;
    position: 'before' | 'after';
  } | null>(null);

  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    if (!enableColumnReordering || resizingColId) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', colId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColId(colId);
  };

  const handleColDragOver = (e: React.DragEvent, colId: string) => {
    if (!enableColumnReordering || !draggedColId || draggedColId === colId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const isBefore = mouseX < rect.width / 2;

    setDropIndicator({
      colId,
      position: isBefore ? 'before' : 'after',
    });
  };

  const handleColDragLeave = (e: React.DragEvent, colId: string) => {
    if (dropIndicator?.colId === colId) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      ) {
        setDropIndicator(null);
      }
    }
  };

  const handleColDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (!enableColumnReordering || !draggedColId || draggedColId === colId) {
      setDraggedColId(null);
      setDropIndicator(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const isBefore = mouseX < rect.width / 2;

    const newOrder = [...currentColumnOrder];
    const sourceIdx = newOrder.indexOf(draggedColId);
    if (sourceIdx !== -1) {
      newOrder.splice(sourceIdx, 1);
    }
    const targetIdx = newOrder.indexOf(colId);
    if (targetIdx !== -1) {
      const insertIdx = isBefore ? targetIdx : targetIdx + 1;
      newOrder.splice(insertIdx, 0, draggedColId);
    }

    setColumnOrder(newOrder);
    setDraggedColId(null);
    setDropIndicator(null);
  };

  const handleColDragEnd = () => {
    setDraggedColId(null);
    setDropIndicator(null);
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters, columnFilters, groupBy]);

  // Toggle single column visibility
  const toggleColumnVisibility = (colId: string) => {
    if (visibleColumnIds.includes(colId)) {
      setVisibleColumnIds(visibleColumnIds.filter((id) => id !== colId));
    } else {
      setVisibleColumnIds([...visibleColumnIds, colId]);
    }
  };

  const showAllColumns = () => {
    setVisibleColumnIds(columns.map((c) => c.id));
  };

  const resetColumns = () => {
    setVisibleColumnIds(columns.filter((c) => !c.hidden).map((c) => c.id));
    setColumnOrder(columns.map((c) => c.id));
    setColumnWidths({});
    if (gridStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`ezhr_datagrid_order_${gridStorageKey}`);
        localStorage.removeItem(`ezhr_datagrid_widths_${gridStorageKey}`);
      } catch (e) {}
    }
  };

  // Toggle pin column (freeze left)
  const togglePinColumn = (colId: string) => {
    if (pinnedColumnIds.left.includes(colId)) {
      setPinnedColumnIds({
        ...pinnedColumnIds,
        left: pinnedColumnIds.left.filter((id) => id !== colId),
      });
    } else {
      setPinnedColumnIds({
        ...pinnedColumnIds,
        left: [...pinnedColumnIds.left, colId],
      });
    }
  };

  // Direct header sort cycle: none -> asc -> desc -> none
  const handleHeaderSort = (field: string) => {
    if (sortState.field !== field) {
      setSortState({ field, direction: 'asc' });
    } else if (sortState.direction === 'asc') {
      setSortState({ field, direction: 'desc' });
    } else {
      setSortState({ field: '', direction: 'asc' });
    }
  };

  // 2. Filter & Search Processing
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let result = [...data];

    // Global Search query across row values
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        return columns.some((col) => {
          let val: any = undefined;
          if (col.accessorFn) val = col.accessorFn(row);
          else if (col.accessorKey) val = (row as any)[col.accessorKey];

          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Per-column quick filters
    Object.keys(columnFilters).forEach((colId) => {
      const filterVal = columnFilters[colId]?.toLowerCase().trim();
      if (!filterVal) return;

      const col = columns.find((c) => c.id === colId);
      result = result.filter((row) => {
        let val: any = undefined;
        if (col?.accessorFn) val = col.accessorFn(row);
        else if (col?.accessorKey) val = (row as any)[col.accessorKey];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(filterVal);
      });
    });

    // Multi-condition advanced filters
    if (filters && filters.length > 0) {
      result = result.filter((row) => {
        return filters.every((cond) => {
          const col = columns.find((c) => c.id === cond.field);
          let rawVal: any = col?.accessorFn
            ? col.accessorFn(row)
            : col?.accessorKey
            ? (row as any)[col.accessorKey]
            : (row as any)[cond.field];

          const valStr = String(rawVal ?? '').toLowerCase();
          const targetStr = String(cond.value ?? '').toLowerCase();

          switch (cond.operator) {
            case 'contains':
              return valStr.includes(targetStr);
            case 'not_contains':
              return !valStr.includes(targetStr);
            case 'equals':
              return valStr === targetStr;
            case 'not_equals':
              return valStr !== targetStr;
            case 'starts_with':
              return valStr.startsWith(targetStr);
            case 'ends_with':
              return valStr.endsWith(targetStr);
            case 'is_empty':
              return rawVal === null || rawVal === undefined || rawVal === '';
            case 'is_not_empty':
              return rawVal !== null && rawVal !== undefined && rawVal !== '';
            case 'gt':
              return Number(rawVal) > Number(cond.value);
            case 'lt':
              return Number(rawVal) < Number(cond.value);
            case 'date_from':
              if (!cond.value || !rawVal) return true;
              return String(rawVal).slice(0, 10) >= String(cond.value).slice(0, 10);
            case 'date_to':
              if (!cond.value || !rawVal) return true;
              return String(rawVal).slice(0, 10) <= String(cond.value).slice(0, 10);
            case 'date_between': {
              if (!rawVal) return false;
              const dateVal = String(rawVal).slice(0, 10);
              const fromVal = typeof cond.value === 'object' ? cond.value?.from : (Array.isArray(cond.value) ? cond.value[0] : '');
              const toVal = typeof cond.value === 'object' ? cond.value?.to : (Array.isArray(cond.value) ? cond.value[1] : '');
              if (fromVal && dateVal < String(fromVal).slice(0, 10)) return false;
              if (toVal && dateVal > String(toVal).slice(0, 10)) return false;
              return true;
            }
            default:
              return true;
          }
        });
      });
    }

    // 3. Sorting
    if (sortState.field && sortState.field !== 'none') {
      const col = columns.find((c) => c.id === sortState.field);
      result.sort((a, b) => {
        let valA: any = col?.accessorFn
          ? col.accessorFn(a)
          : col?.accessorKey
          ? (a as any)[col.accessorKey]
          : (a as any)[sortState.field];
        let valB: any = col?.accessorFn
          ? col.accessorFn(b)
          : col?.accessorKey
          ? (b as any)[col.accessorKey]
          : (b as any)[sortState.field];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortState.direction === 'asc' ? valA - valB : valB - valA;
        }

        const cmp = String(valA).localeCompare(String(valB), 'vi');
        return sortState.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, columns, searchQuery, columnFilters, filters, sortState]);

  // 4. Grouping Data & Pagination Slicing
  const groupedData = useMemo<DataGridGroup<T>[]>(() => {
    if (!groupBy || groupBy === 'none') {
      const itemsToRender = enablePagination
        ? filteredData.slice((page - 1) * pageSize, page * pageSize)
        : filteredData;
      return [{ groupKey: '__all__', groupLabel: 'Tất cả bản ghi', items: itemsToRender }];
    }

    const groupOpt = groupOptions.find((g) => g.key === groupBy);
    const map = new Map<string, { label: string; items: T[]; avatarName?: string; avatarColor?: string }>();

    filteredData.forEach((row) => {
      let key = '';
      let label = '';
      let avatarName: string | undefined = undefined;
      let avatarColor: string | undefined = undefined;

      if (groupOpt?.getGroupKey) {
        key = groupOpt.getGroupKey(row) || 'Khác';
      } else {
        const col = columns.find((c) => c.id === groupBy);
        const rawVal = col?.accessorFn
          ? col.accessorFn(row)
          : col?.accessorKey
          ? (row as any)[col.accessorKey]
          : (row as any)[groupBy];
        key = rawVal ? String(rawVal) : 'Chưa phân loại';
      }

      if (groupOpt?.getGroupLabel) {
        label = groupOpt.getGroupLabel(row) || key;
      } else {
        label = key;
      }

      if (groupOpt?.getGroupAvatar) {
        const av = groupOpt.getGroupAvatar(row);
        avatarName = av?.name;
        avatarColor = av?.color;
      }

      if (!map.has(key)) {
        map.set(key, { label, items: [], avatarName, avatarColor });
      }
      map.get(key)!.items.push(row);
    });

    let groups = Array.from(map.entries()).map(([key, val]) => ({
      groupKey: key,
      groupLabel: val.label,
      items: val.items,
      avatarName: val.avatarName || val.label,
      avatarColor: val.avatarColor,
    }));

    if (groupOpt?.sortGroups) {
      groups.sort(groupOpt.sortGroups);
    } else if (groupOpt?.groupOrder && groupOpt.groupOrder.length > 0) {
      const orderMap = new Map<string, number>();
      groupOpt.groupOrder.forEach((k, idx) => {
        orderMap.set(k.toLowerCase().trim(), idx);
      });

      const getOrderIndex = (key: string, label: string) => {
        const k = key.toLowerCase().trim();
        const l = label.toLowerCase().trim();
        if (orderMap.has(k)) return orderMap.get(k)!;
        if (orderMap.has(l)) return orderMap.get(l)!;
        return 9999;
      };

      groups.sort((a, b) => {
        const indexA = getOrderIndex(a.groupKey, a.groupLabel);
        const indexB = getOrderIndex(b.groupKey, b.groupLabel);
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        return a.groupLabel.localeCompare(b.groupLabel, 'vi');
      });
    }

    return groups;
  }, [filteredData, groupBy, groupOptions, columns]);

  // Selection helpers
  const selectedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    selectedIds.forEach((id) => {
      map[id] = true;
    });
    return map;
  }, [selectedIds]);

  const toggleSelectRow = (id: string) => {
    if (selectedMap[id]) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((item, idx) => keyExtractor(item, idx)));
    }
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Visible columns ordered according to currentColumnOrder with Pinned Left columns first!
  const activeColumns = useMemo(() => {
    const normalizedCols = columns.map((c) => ({
      ...c,
      id: c.id || (c as any).key || '',
      accessorKey: c.accessorKey || (c as any).key || c.id,
    }));
    const colMap = new Map(normalizedCols.map((c) => [c.id, c]));
    const ordered: DataGridColumn<T>[] = [];
    currentColumnOrder.forEach((id) => {
      const c = colMap.get(id);
      if (c) {
        ordered.push(c);
        colMap.delete(id);
      }
    });
    normalizedCols.forEach((c) => {
      if (colMap.has(c.id)) {
        ordered.push(c);
      }
    });

    const visible = ordered.filter((col) => visibleColumnIds.includes(col.id));
    const pinnedLeft = visible.filter((col) => pinnedColumnIds.left.includes(col.id));
    const pinnedRight = visible.filter(
      (col) => pinnedColumnIds.right?.includes(col.id) || col.pinned === 'right'
    );
    const unpinned = visible.filter(
      (col) =>
        !pinnedColumnIds.left.includes(col.id) &&
        !pinnedColumnIds.right?.includes(col.id) &&
        col.pinned !== 'right'
    );
    return [...pinnedLeft, ...unpinned, ...pinnedRight];
  }, [columns, currentColumnOrder, visibleColumnIds, pinnedColumnIds]);

  // Calculate sticky left offsets for pinned left columns
  const { pinnedLeftOffsets, lastPinnedLeftId } = useMemo(() => {
    const offsets: Record<string, number> = {};
    let currentLeft = (selectable || showStt) ? 48 : 0; // checkbox/STT column width is 48px

    let lastId = '';
    activeColumns.forEach((col) => {
      if (pinnedColumnIds.left.includes(col.id)) {
        offsets[col.id] = currentLeft;
        const widthNum = getColWidthNumber(col);
        currentLeft += widthNum;
        lastId = col.id;
      }
    });

    return { pinnedLeftOffsets: offsets, lastPinnedLeftId: lastId };
  }, [activeColumns, pinnedColumnIds, selectable, showStt, getColWidthNumber]);

  // Calculate sticky right offsets for pinned right columns
  const { pinnedRightOffsets, firstPinnedRightId } = useMemo(() => {
    const offsets: Record<string, number> = {};
    let currentRight = 0;
    const rightCols = [...activeColumns]
      .filter((c) => pinnedColumnIds.right?.includes(c.id) || c.pinned === 'right')
      .reverse();

    let firstId = '';
    rightCols.forEach((col) => {
      offsets[col.id] = currentRight;
      currentRight += getColWidthNumber(col);
      firstId = col.id;
    });

    return { pinnedRightOffsets: offsets, firstPinnedRightId: firstId };
  }, [activeColumns, pinnedColumnIds, getColWidthNumber]);

  // Flat array of currently displayed/expanded rows for Excel 2D coordinate mapping
  const displayRows = useMemo(() => {
    const list: T[] = [];
    groupedData.forEach((group) => {
      const isCollapsed = collapsedGroups[group.groupKey];
      if (!isCollapsed) {
        list.push(...group.items);
      }
    });
    return list;
  }, [groupedData, collapsedGroups]);

  const visualRowIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    displayRows.forEach((row, idx) => {
      map.set(keyExtractor(row, idx), idx);
    });
    return map;
  }, [displayRows, keyExtractor]);

  // Excel Interactivity Master Hook (Range selection, copy/paste, drag-to-fill, inline edit, undo/redo)
  const excelGrid = useExcelGrid<T>({
    data: displayRows,
    activeColumns,
    keyExtractor,
    containerRef: tableContainerRef,
    enableExcelMode,
    editable: controlledEditable,
    onCellsChange,
    onBatchUpdate,
    onAutoAddRows,
    allowDragToFill,
    allowClipboard,
    allowHistory,
    editOnSingleClick,
  });

  // Imperative handle for parent to force commit active editor, or trigger undo/redo
  useImperativeHandle(
    gridRef,
    () => ({
      commitEditing: () => {
        excelGrid.commitCurrentEditor();
      },
      undo: () => {
        excelGrid.undo();
      },
      redo: () => {
        excelGrid.redo();
      },
      canUndo: excelGrid.canUndo,
      canRedo: excelGrid.canRedo,
    }),
    [excelGrid]
  );

  // Undo / Redo Toolbar Controls
  const excelUndoRedoToolbar = enableExcelMode ? (
    <div className="flex items-center gap-0.5 mr-1 shrink-0">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={!excelGrid.canUndo}
              onClick={excelGrid.undo}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Hoàn tác (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={!excelGrid.canRedo}
              onClick={excelGrid.redo}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Làm lại (Ctrl+Y)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
    </div>
  ) : null;

  // Find/Replace & Context Menu states
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);
  const [findReplaceMode, setFindReplaceMode] = useState<'find' | 'replace'>('find');
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    targetCell?: { rowIndex: number; colIndex: number };
    targetRowIndex?: number;
    targetColId?: string;
  } | null>(null);

  const handleOpenFind = useCallback(() => {
    setFindReplaceMode('find');
    setIsFindReplaceOpen(true);
  }, []);

  const handleOpenReplace = useCallback(() => {
    setFindReplaceMode('replace');
    setIsFindReplaceOpen(true);
  }, []);

  // Master key listener on container for Ctrl+F / Ctrl+H
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      if (enableFindReplace) {
        e.preventDefault();
        handleOpenFind();
      }
      // When disabled, let the browser handle native find/replace.
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      if (enableFindReplace) {
        e.preventDefault();
        handleOpenReplace();
      }
      return;
    }
    excelGrid.handleKeyDown(e);
  };


  const handleCellContextMenu = (
    e: React.MouseEvent,
    rowIndex: number,
    colIndex: number,
    colId: string
  ) => {
    if (!enableExcelMode) return;
    e.preventDefault();
    e.stopPropagation();

    if (!excelGrid.normalizedRange || !isCellInRange(rowIndex, colIndex, excelGrid.normalizedRange)) {
      excelGrid.navigateToCell({ rowIndex, colIndex });
    }

    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetCell: { rowIndex, colIndex },
      targetRowIndex: rowIndex,
      targetColId: colId,
    });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, colId: string) => {
    if (!enableExcelMode) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetColId: colId,
    });
  };

  // Height class mapping
  const heightClass =
    rowHeight === 'compact'
      ? 'h-8 text-xs'
      : rowHeight === 'tall'
      ? 'h-12 text-sm'
      : 'h-10 text-xs';

  // Helper to format width style & sticky left
  const getColStyle = (col: DataGridColumn<T>, isHeader: boolean): React.CSSProperties => {
    const style: React.CSSProperties = {};

    const widthPx = getColWidthNumber(col);
    style.width = `${widthPx}px`;
    style.minWidth = `${col.minWidth || Math.min(widthPx, 40)}px`;
    if (col.maxWidth) {
      style.maxWidth = `${col.maxWidth}px`;
    }

    // Sticky Left Pinning
    if (pinnedColumnIds.left.includes(col.id)) {
      style.position = 'sticky';
      style.left = `${pinnedLeftOffsets[col.id] ?? 0}px`;
      style.zIndex = isHeader ? 30 : 15;
    }

    // Sticky Right Pinning
    const isPinnedRight = pinnedColumnIds.right?.includes(col.id) || col.pinned === 'right';
    if (isPinnedRight) {
      style.position = 'sticky';
      style.right = `${pinnedRightOffsets[col.id] ?? 0}px`;
      style.zIndex = isHeader ? 31 : 16;
    }

    return style;
  };

  const getColWidthClass = (col: DataGridColumn<T>): string => {
    if (columnWidths[col.id] !== undefined) {
      return '';
    }
    if (typeof col.width === 'string' && col.width.startsWith('w-')) {
      return col.width;
    }
    if (!col.width) {
      return 'w-36';
    }
    return '';
  };

  return (
    <div
      className={`w-full flex-1 h-full min-h-0 flex flex-col bg-white dark:bg-slate-950 font-sans select-none overflow-hidden ${className}`}
    >
      {/* 1. Reusable Toolbar with Filter, Sort, Visibility, Pinning */}
      {enableToolbar && (
        <DataGridToolbar
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onToggleColumnVisibility={toggleColumnVisibility}
          onShowAllColumns={showAllColumns}
          onResetColumns={resetColumns}
          pinnedColumnIds={pinnedColumnIds}
          onTogglePinColumn={togglePinColumn}
          groupOptions={groupOptions}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          sortState={sortState}
          onSortChange={setSortState}
          rowHeight={rowHeight}
          onRowHeightChange={setRowHeight}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          totalCount={data.length}
          filteredCount={filteredData.length}
          onExportCsv={onExportCsv}
          onImportCsv={onImportCsv}
          onAddNew={onAddNew}
          addNewLabel={addNewLabel}
          viewModes={viewModes}
          activeViewMode={activeViewMode}
          onViewModeChange={onViewModeChange}
          onOpenFindReplace={enableFindReplace ? handleOpenFind : undefined}
          onUndo={excelGrid.undo}
          onRedo={excelGrid.redo}
          canUndo={excelGrid.canUndo}
          canRedo={excelGrid.canRedo}
          extraLeft={
            <>
              {excelUndoRedoToolbar}
              {toolbarExtraLeft}
            </>
          }
          extraRight={toolbarExtraRight}
          conditionalRules={conditionalRules}
          onConditionalRulesChange={setConditionalRules}
          enableConditionalFormatting={enableConditionalFormatting}
        />
      )}

      {/* 2. Main Scrollable Table Area */}

      <div
        ref={tableContainerRef}
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        onPaste={(e) => {
          e.preventDefault();
          excelGrid.handlePaste(e.clipboardData.getData('text/plain'));
        }}
        onCopy={(e) => {
          if (excelGrid.normalizedRange && !excelGrid.editingCell) {
            e.preventDefault();
            excelGrid.handleCopy();
          }
        }}
        className="flex-1 overflow-auto scrollbar-thin bg-white dark:bg-slate-950 flex flex-col outline-none focus:outline-none"
      >

        <div className="min-w-fit flex-1 flex flex-col bg-white dark:bg-slate-950">
          {/* STICKY TABLE HEADER: h-9 font-semibold bg-slate-50/95 dark:bg-slate-900 */}
          <div
            className={`sticky top-0 z-20 h-9 flex items-center bg-slate-50/95 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300 divide-x divide-slate-200/60 dark:divide-slate-800/60 shadow-2xs ${
              headerCase === 'uppercase' ? 'uppercase tracking-wider text-[11px]' : 'normal-case tracking-normal text-xs'
            }`}
          >
            {/* Selection Checkbox & STT (Always Pinned Left: 0) */}
            {(selectable || showStt) && (
              <div
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 32,
                }}
                className={`w-12 h-9 flex items-center shrink-0 bg-slate-50 dark:bg-slate-900 ${
                  selectable && showStt ? 'justify-between px-2' : 'justify-center'
                } ${
                  pinnedColumnIds.left.length === 0 ? 'border-r border-slate-200/60 dark:border-slate-800/60' : ''
                }`}
              >
                {selectable ? (
                  <Checkbox
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                    onCheckedChange={toggleSelectAll}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                ) : null}
                {showStt && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium select-none pr-0.5">
                    #
                  </span>
                )}
              </div>
            )}

            {/* Columns Header with Direct Sort, Drag & Drop Reordering, Column Resizing & Action Menu */}
            {activeColumns.map((col, colIndex) => {
              const IconComp = col.icon;
              const widthClass = getColWidthClass(col);
              const colStyle = getColStyle(col, true);
              const isPinned = pinnedColumnIds.left.includes(col.id);
              const isLastPinned = col.id === lastPinnedLeftId;
              const isPinnedRight = pinnedColumnIds.right?.includes(col.id) || col.pinned === 'right';
              const isFirstPinnedRight = col.id === firstPinnedRightId;
              const isSorted = sortState.field === col.id;
              const hasColFilter = !!columnFilters[col.id];
              const isDragging = draggedColId === col.id;
              const isResizing = resizingColId === col.id;
              const hasDropBefore = Boolean(dropIndicator) && dropIndicator?.colId === col.id && dropIndicator?.position === 'before';
              const hasDropAfter = Boolean(dropIndicator) && dropIndicator?.colId === col.id && dropIndicator?.position === 'after';

              return (
                <div
                  key={col.id}
                  style={colStyle}
                  draggable={enableColumnReordering && !resizingColId}
                  onDragStart={(e) => handleColDragStart(e, col.id)}
                  onDragOver={(e) => handleColDragOver(e, col.id)}
                  onDragLeave={(e) => handleColDragLeave(e, col.id)}
                  onDrop={(e) => handleColDrop(e, col.id)}
                  onDragEnd={handleColDragEnd}
                  onContextMenu={(e) => handleHeaderContextMenu(e, col.id)}
                  className={`group/col relative h-9 px-2 flex items-center justify-between shrink-0 font-semibold text-xs transition-colors select-none ${
                    isPinned
                      ? 'shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] bg-slate-50/95 dark:bg-slate-900'
                      : isPinnedRight
                      ? 'shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] bg-slate-50/95 dark:bg-slate-900'
                      : 'bg-slate-50/95 dark:bg-slate-900'
                  } hover:bg-slate-100/70 dark:hover:bg-slate-800/50 ${isLastPinned ? 'border-r-2 border-r-blue-500/40 dark:border-r-blue-400/40' : ''} ${
                    isFirstPinnedRight ? 'border-l-2 border-l-blue-500/40 dark:border-l-blue-400/40' : ''
                  } ${widthClass} ${
                    col.headerClassName || ''
                  } ${
                    isDragging
                      ? 'opacity-40 border-2 border-dashed border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                      : ''
                  }`}
                >
                  {/* Drop Indicator Guide Marker */}
                  {hasDropBefore && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-600 dark:bg-sky-400 z-50 pointer-events-none shadow-[0_0_8px_rgba(37,99,235,0.8)]">
                      <div className="absolute -top-1 -left-[3px] w-2.5 h-2.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
                      <div className="absolute -bottom-1 -left-[3px] w-2.5 h-2.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
                    </div>
                  )}
                  {hasDropAfter && (
                    <div className="absolute top-0 bottom-0 right-0 w-1 bg-blue-600 dark:bg-sky-400 z-50 pointer-events-none shadow-[0_0_8px_rgba(37,99,235,0.8)]">
                      <div className="absolute -top-1 -left-[3px] w-2.5 h-2.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
                      <div className="absolute -bottom-1 -left-[3px] w-2.5 h-2.5 bg-blue-600 dark:bg-sky-400 rounded-full" />
                    </div>
                  )}

                  {/* Left part: Drag Handle, Icon, Header text, Click to sort or Shift+Click to select column */}
                  <div
                    onClick={(e) => {
                      if (e.shiftKey || e.altKey) {
                        excelGrid.handleColHeaderClick(e, colIndex);
                      } else {
                        col.sortable !== false && handleHeaderSort(col.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100 ${
                      col.align === 'center'
                        ? 'justify-center'
                        : col.align === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    {/* Excel Column Letter Badge (A, B, C...) */}
                    {showColumnLetters && (
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-medium select-none mr-0.5">
                        {getColumnLetter(colIndex)}
                      </span>
                    )}

                    {/* Column Drag Handle Affordance Icon */}
                    {enableColumnReordering && (
                      <span title="Kéo thả để đổi vị trí cột" className="inline-flex shrink-0">
                        <GripVertical
                          className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover/col:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-0.5"
                        />
                      </span>
                    )}

                    {IconComp && <IconComp className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className="truncate">
                      {formatHeaderTitle(col.header, headerCase)}
                    </span>

                    {/* Active or Hover Sort Icon */}
                    {isSorted ? (
                      <span className="text-blue-600 dark:text-sky-400 shrink-0">
                        {sortState.direction === 'asc' ? (
                          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                        )}
                      </span>
                    ) : (
                      col.sortable !== false && (
                        <span className="opacity-0 group-hover/col:opacity-40 hover:!opacity-90 transition-opacity text-slate-400 shrink-0">
                          <ArrowUpDown className="w-2.5 h-2.5" />
                        </span>
                      )
                    )}

                    {/* Active Quick Filter Indicator */}
                    {hasColFilter && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 shrink-0" title={`Lọc: ${columnFilters[col.id]}`} />
                    )}
                  </div>

                  {/* Right part: Column Action Menu Popover (3-dots) */}
                  <div draggable={false} onMouseDown={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover/col:opacity-100 transition-opacity cursor-pointer shrink-0 ml-1"
                          title="Tùy chọn cột"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-56 p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
                        align="start"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-100 px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                          Cột: {typeof col.header === 'string' ? formatHeaderTitle(col.header, headerCase) : col.id}
                        </div>

                        {/* Select column in Excel mode */}
                        {enableExcelMode && (
                          <button
                            type="button"
                            onClick={() => excelGrid.handleColHeaderClick({} as any, colIndex)}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer text-slate-600 dark:text-slate-300 mb-1"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chọn toàn bộ cột này</span>
                          </button>
                        )}

                        {/* Reset custom column width */}
                        {columnWidths[col.id] !== undefined && (
                          <button
                            type="button"
                            onClick={() => {
                              setColumnWidths((prev) => {
                                const next = { ...prev };
                                delete next[col.id];
                                return next;
                              });
                            }}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer text-slate-600 dark:text-slate-300 mb-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                            <span>Đặt lại độ rộng ({columnWidths[col.id]}px)</span>
                          </button>
                        )}

                        {/* Sort options */}
                        {col.sortable !== false && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSortState({ field: col.id, direction: 'asc' })}
                              className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                                <span>Sắp xếp A → Z (Tăng dần)</span>
                              </span>
                              {isSorted && sortState.direction === 'asc' && (
                                <Check className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSortState({ field: col.id, direction: 'desc' })}
                              className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                                <span>Sắp xếp Z → A (Giảm dần)</span>
                              </span>
                              {isSorted && sortState.direction === 'desc' && (
                                <Check className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </button>
                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          </>
                        )}

                        {/* Pin/Freeze Left Option */}
                        <button
                          type="button"
                          onClick={() => togglePinColumn(col.id)}
                          className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            {isPinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Bỏ ghim cột này</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ghim cố định sang trái</span>
                              </>
                            )}
                          </span>
                          {isPinned && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>

                        {/* Hide Column Option */}
                        {col.hideable !== false && (
                          <button
                            type="button"
                            onClick={() => toggleColumnVisibility(col.id)}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ẩn cột này</span>
                          </button>
                        )}

                        {/* Quick Column Filter Box */}
                        {col.filterable !== false && (
                          <>
                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                            <div className="px-1 py-1">
                              <label className="text-[10px] text-slate-400 font-semibold mb-1 block">
                                Lọc nhanh cột này
                              </label>
                              <div className="relative">
                                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Nhập giá trị lọc..."
                                  value={columnFilters[col.id] || ''}
                                  onChange={(e) =>
                                    setColumnFilters({
                                      ...columnFilters,
                                      [col.id]: e.target.value,
                                    })
                                  }
                                  className="w-full h-7 pl-6 pr-6 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                {columnFilters[col.id] && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setColumnFilters({
                                        ...columnFilters,
                                        [col.id]: '',
                                      })
                                    }
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Column Resizing Handle */}
                  {enableColumnResizing && (
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, col.id)}
                      onDoubleClick={(e) => handleResizeDoubleClick(e, col.id)}
                      draggable={false}
                      title="Kéo để đổi độ rộng, nhấp đúp để đặt lại mặc định"
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-40 select-none flex items-center justify-center group/resizer hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors ${
                        isResizing ? 'bg-blue-500/30' : ''
                      }`}
                    >
                      <div
                        className={`w-[2px] rounded-full transition-colors ${
                          isResizing
                            ? 'bg-blue-600 dark:bg-sky-400 h-full shadow-[0_0_6px_rgba(37,99,235,0.8)]'
                            : 'h-4 bg-transparent group-hover/resizer:bg-blue-500 dark:group-hover/resizer:bg-sky-400'
                        }`}
                      />
                      {/* Floating Width Indicator Tooltip */}
                      {isResizing && (
                        <div className="absolute bottom-full mb-1 right-0 px-1.5 py-0.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-mono rounded shadow pointer-events-none z-50 whitespace-nowrap border border-slate-700">
                          {currentResizingWidth}px
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Flexible buffer space */}
            <div className="flex-1 h-9 px-2 flex items-center" />
          </div>

          {/* TABLE BODY CONTENT */}
          <div className="flex-1 bg-white dark:bg-slate-950">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Đang tải dữ liệu...</span>
              </div>
            ) : isError ? (
              <div className="h-48 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Không thể tải dữ liệu
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    {errorMessage}
                  </p>
                </div>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Thử lại
                  </button>
                )}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
                <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                <span className="text-xs font-medium">{emptyText}</span>
              </div>
            ) : (
              groupedData.map((group) => {
                const isGroupHeaderVisible = groupBy !== 'none' && group.groupKey !== '__all__';
                const isCollapsed = collapsedGroups[group.groupKey];

                return (
                  <div
                    key={group.groupKey}
                    className="border-b border-slate-200/80 dark:border-slate-800"
                  >
                    {/* Collapsible Group Header Row */}
                    {isGroupHeaderVisible && (
                      <div
                        onClick={() => toggleGroupCollapse(group.groupKey)}
                        className="sticky top-9 z-10 flex items-center h-8 px-2.5 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer border-y border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors select-none shadow-2xs"
                      >
                        {renderGroupHeader ? (
                          renderGroupHeader({
                            group,
                            isCollapsed,
                            toggleCollapse: () => toggleGroupCollapse(group.groupKey),
                            groupOption: groupOptions.find((g) => g.key === groupBy),
                          })
                        ) : (
                          <>
                            <button
                              type="button"
                              className="p-0.5 mr-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Optional User Avatar for PIC or Category */}
                            <UserAvatar
                              name={group.avatarName || group.groupLabel}
                              className="h-5 w-5 text-[10px] shrink-0 mr-2 shadow-2xs"
                            />

                            <span className="truncate">{group.groupLabel}</span>

                            {/* Badge count */}
                            <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {group.items.length} bản ghi
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Group Rows */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {group.items.map((row, index) => {
                          const rowKey = keyExtractor(row, index);
                          const isSelected = !!selectedMap[rowKey];
                          const highlight = rowHighlight ? rowHighlight(row) : null;
                          const evaluatedFormatting = evaluateConditionalRules(row, conditionalRules, columns);

                          let rowBgClass =
                            'bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-blue-950/20';

                          if (highlight?.isWarning) {
                            rowBgClass =
                              'bg-rose-50/90 hover:bg-rose-100 dark:bg-[#1c121e] dark:hover:bg-[#281528] border-l-2 border-l-rose-500';
                          } else if (highlight?.isDueSoon) {
                            rowBgClass =
                              'bg-amber-50/80 hover:bg-amber-100 dark:bg-[#1b1510] dark:hover:bg-[#271d14] border-l-2 border-l-amber-500';
                          } else if (highlight?.className) {
                            rowBgClass = highlight.className;
                          }

                          const finalRowStyle: React.CSSProperties = {
                            ...highlight?.style,
                            ...evaluatedFormatting.rowStyle,
                          };

                          if (evaluatedFormatting.rowBorderColor) {
                            finalRowStyle.borderLeft = `3px solid ${evaluatedFormatting.rowBorderColor}`;
                          }

                          const visualRowIndex = visualRowIndexMap.get(rowKey) ?? index;

                          return (
                            <div
                              key={rowKey}
                              style={finalRowStyle}
                              onClick={() => onRowClick?.(row)}
                              onDoubleClick={() => onRowDoubleClick?.(row)}
                              className={`group flex items-center divide-x divide-slate-100 dark:divide-slate-800/60 transition-colors ${heightClass} ${rowBgClass}`}
                            >
                              {/* Selection checkbox & STT (Always Pinned Left: 0) */}
                              {(selectable || showStt) && (
                                <div
                                  style={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 16,
                                  }}
                                  onClick={(e) => {
                                    tableContainerRef.current?.focus({ preventScroll: true });
                                    excelGrid.handleRowHeaderClick(e, visualRowIndex);
                                  }}
                                  className={`relative w-12 h-full flex items-center shrink-0 bg-inherit cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 ${
                                    selectable && showStt ? 'justify-between px-2' : 'justify-center'
                                  } ${
                                    pinnedColumnIds.left.length === 0 ? 'border-r border-slate-100 dark:border-slate-800/60' : ''
                                  }`}
                                  title="Bấm để chọn toàn bộ hàng này"
                                >
                                  {/* Solid base layer so horizontally scrolling content never bleeds through */}
                                  <div className="absolute inset-0 -z-10 bg-white dark:bg-slate-900 pointer-events-none" />
                                  {selectable && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelectRow(rowKey)}
                                        className="h-3.5 w-3.5 shrink-0"
                                      />
                                    </div>
                                  )}
                                  {showStt && (
                                    <span className="text-[11px] text-slate-400 font-mono pr-0.5 select-none font-medium">
                                      {visualRowIndex + 1}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Column Cells (With Sticky Left for Pinned Columns) */}
                              {activeColumns.map((col, colIndex) => {
                                const widthClass = getColWidthClass(col);
                                const colStyle = getColStyle(col, false);
                                const isPinned = pinnedColumnIds.left.includes(col.id);
                                const isLastPinned = col.id === lastPinnedLeftId;
                                const isPinnedRight = pinnedColumnIds.right?.includes(col.id) || col.pinned === 'right';
                                const isFirstPinnedRight = col.id === firstPinnedRightId;
                                const isDropdownCol = col.editorType === 'select' || Boolean(col.editorOptions);
                                const cellFormattingStyle = isDropdownCol ? undefined : evaluatedFormatting.cellStyles[col.id];
                                const finalColStyle: React.CSSProperties = {
                                  ...colStyle,
                                  ...cellFormattingStyle,
                                };

                                let rawVal: any = undefined;
                                if (col.accessorFn) rawVal = col.accessorFn(row);
                                else if (col.accessorKey) rawVal = (row as any)[col.accessorKey];

                                const isEditing =
                                  excelGrid.editingCell?.rowIndex === visualRowIndex &&
                                  excelGrid.editingCell?.colIndex === colIndex;

                                const excelCellClasses = excelGrid.getExcelCellClasses(
                                  visualRowIndex,
                                  colIndex
                                );

                                const borders = getCellBorderPlacement(
                                  visualRowIndex,
                                  colIndex,
                                  excelGrid.normalizedRange
                                );

                                const isEditableCell = isCellEditable(col, row, excelGrid.isGridEditable);
                                const isSelectColumn = isEditableCell && (col.editorType === 'select' || !!col.editorOptions);
                                const isActiveCell =
                                  excelGrid.activeCell?.rowIndex === visualRowIndex &&
                                  excelGrid.activeCell?.colIndex === colIndex;

                                return (
                                  <div
                                    key={col.id}
                                    style={finalColStyle}
                                    onMouseDown={(e) => {
                                      if (!isEditableCell) {
                                        tableContainerRef.current?.focus({ preventScroll: true });
                                      }
                                      excelGrid.handleCellMouseDown(e, visualRowIndex, colIndex);
                                    }}
                                    onClick={() => {
                                      if (!isEditableCell) {
                                        tableContainerRef.current?.focus({ preventScroll: true });
                                      }
                                      excelGrid.handleCellClick(visualRowIndex, colIndex);
                                    }}
                                    onMouseEnter={() => {
                                      excelGrid.handleCellMouseEnter(visualRowIndex, colIndex);
                                    }}
                                    onDoubleClick={(e) => {
                                      if (isEditableCell) {
                                        e.stopPropagation();
                                        excelGrid.startEditing({ rowIndex: visualRowIndex, colIndex });
                                      }
                                    }}
                                    onContextMenu={(e) => {
                                      handleCellContextMenu(e, visualRowIndex, colIndex, col.id);
                                    }}
                                    className={`group/cell relative h-full px-2.5 flex items-center shrink-0 bg-inherit select-none transition-colors ${
                                      isPinned
                                        ? 'shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]'
                                        : isPinnedRight
                                        ? 'shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] border-l border-l-slate-200/80 dark:border-l-slate-800'
                                        : ''
                                    } ${
                                      isLastPinned
                                        ? 'border-r-2 border-r-blue-500/40 dark:border-r-blue-400/40'
                                        : ''
                                    } ${
                                      isFirstPinnedRight
                                        ? 'border-l-2 border-l-blue-500/40 dark:border-l-blue-400/40'
                                        : ''
                                    } ${
                                      col.align === 'center'
                                        ? 'justify-center text-center'
                                        : col.align === 'right'
                                        ? 'justify-end text-right font-mono'
                                        : 'justify-start'
                                    } ${widthClass} ${col.cellClassName || ''} ${excelCellClasses}`}
                                  >
                                    {/* Solid base layer for pinned sticky columns so horizontally scrolling content never bleeds through */}
                                    {(isPinned || isPinnedRight) && (
                                      <div className="absolute inset-0 -z-10 bg-white dark:bg-slate-900 pointer-events-none" />
                                    )}

                                    {isEditing ? (
                                      <ExcelCellEditor
                                        row={row}
                                        column={col}
                                        initialValue={excelGrid.editingInitialValue !== undefined ? excelGrid.editingInitialValue : rawVal}
                                        onChange={excelGrid.handleEditorValueChange}
                                        onCommit={(val, nextAction, selectedOpt) => {
                                          excelGrid.commitEditing(val, nextAction, selectedOpt);
                                        }}
                                        onCancel={excelGrid.cancelEditing}
                                        onPasteMatrix={(text) => {
                                          excelGrid.cancelEditing();
                                          tableContainerRef.current?.focus({ preventScroll: true });
                                          excelGrid.handlePaste(text);
                                        }}
                                      />
                                    ) : (
                                      <>
                                        <div className="flex-1 min-w-0 flex items-center overflow-hidden">
                                          {col.cell ? (
                                            col.cell({
                                              row,
                                              value: rawVal,
                                              index,
                                              isSelected,
                                            })
                                          ) : (col as any).render ? (
                                            (col as any).render(rawVal, row, index)
                                          ) : (
                                            <span className="truncate text-slate-700 dark:text-slate-300">
                                              {rawVal !== null && rawVal !== undefined
                                                ? col.formatValue
                                                  ? col.formatValue(rawVal)
                                                  : String(rawVal)
                                                : '—'}
                                            </span>
                                          )}
                                        </div>

                                        {/* Dropdown Affordance Chevron Button for Select Columns */}
                                        {enableExcelMode && isSelectColumn && col.showDropdownAffordance !== false && (
                                          <button
                                            type="button"
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              excelGrid.startEditing({ rowIndex: visualRowIndex, colIndex });
                                            }}
                                            className={`ml-1 p-0.5 rounded transition-all shrink-0 cursor-pointer ${
                                              isActiveCell
                                                ? 'opacity-100 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow-2xs'
                                                : 'opacity-0 group-hover/cell:opacity-80 hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                                            }`}
                                            title="Nhấp để chọn từ danh sách"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {/* Excel Fill Handle (Bottom-Right corner of selection range or active cell) */}
                                    {borders.isBottomRight && !isEditing && (
                                      <div
                                        onMouseDown={excelGrid.handleFillHandleMouseDown}
                                        className="absolute -bottom-[4px] -right-[4px] w-2 h-2 bg-emerald-600 dark:bg-emerald-400 border border-white dark:border-slate-900 cursor-crosshair z-40 shadow-xs hover:scale-125 transition-transform"
                                        title="Kéo để điền tự động (Drag to fill)"
                                      />
                                    )}
                                  </div>
                                );
                              })}

                              {/* Flexible buffer & Row Actions on hover */}
                              <div className="flex-1 h-full px-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {renderRowActions && renderRowActions(row)}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Row Button at group bottom */}
                        {onAddRowToGroup && (
                          <div
                            onClick={() => onAddRowToGroup(group.groupKey)}
                            className="flex items-center h-7 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors border-t border-dashed border-slate-200 dark:border-slate-800"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            <span className="text-[11px] font-semibold">
                              Thêm bản ghi vào nhóm {group.groupLabel}...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* STICKY SUMMARY FOOTER (Cố định ở đáy card, không bị cuộn ngang) */}
      {enableFooter && (
        <div className="shrink-0 z-20 px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shadow-xs flex-wrap sm:flex-nowrap gap-2">
          {footerSummary ? (
            footerSummary({
              totalRecords: data.length,
              filteredRecords: filteredData.length,
              selectedCount: selectedIds.length,
              data,
            })
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span>
                  Tổng số bản ghi:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {data.length}
                  </strong>
                </span>
                {filteredData.length !== data.length && (
                  <>
                    <span>•</span>
                    <span>
                      Đang hiển thị:{' '}
                      <strong className="text-blue-600 dark:text-sky-400">
                        {filteredData.length}
                      </strong>
                    </span>
                  </>
                )}
                {selectedIds.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-sky-400 font-semibold">
                      Đã chọn: {selectedIds.length} dòng
                    </span>
                  </>
                )}
                {pinnedColumnIds.left.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Đang cố định: {pinnedColumnIds.left.length} cột
                    </span>
                  </>
                )}
              </div>

              {/* Status Statistics for Selected Range (Excel-like Sum, Avg, Count, Min, Max) */}
              {excelGrid.rangeStats && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/70 text-emerald-900 dark:text-emerald-200 text-[11px] font-mono shadow-xs overflow-x-auto select-none">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Vùng chọn:
                  </span>
                  <span className="shrink-0">
                    Số ô chọn: <strong className="text-emerald-950 dark:text-white font-bold">{excelGrid.rangeStats.totalCells}</strong>
                  </span>
                  {excelGrid.rangeStats.numericCount > 0 && (
                    <>
                      <span className="text-emerald-400 dark:text-emerald-600">•</span>
                      <span className="shrink-0">
                        Tổng (Sum): <strong className="text-emerald-950 dark:text-white font-bold">{excelGrid.rangeStats.sum?.toLocaleString()}</strong>
                      </span>
                      <span className="text-emerald-400 dark:text-emerald-600">•</span>
                      <span className="shrink-0">
                        Trung bình (Avg): <strong className="text-emerald-950 dark:text-white font-bold">{excelGrid.rangeStats.average}</strong>
                      </span>
                      {excelGrid.rangeStats.min !== null && (
                        <>
                          <span className="text-emerald-400 dark:text-emerald-600">•</span>
                          <span className="shrink-0">
                            Min: <strong className="text-emerald-950 dark:text-white font-bold">{excelGrid.rangeStats.min.toLocaleString()}</strong>
                          </span>
                        </>
                      )}
                      {excelGrid.rangeStats.max !== null && (
                        <>
                          <span className="text-emerald-400 dark:text-emerald-600">•</span>
                          <span className="shrink-0">
                            Max: <strong className="text-emerald-950 dark:text-white font-bold">{excelGrid.rangeStats.max.toLocaleString()}</strong>
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {enablePagination && (!groupBy || groupBy === 'none') && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Số hàng:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        setPage(1);
                      }}
                      className="h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {pageSizeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt} / trang
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-slate-500">
                    {filteredData.length === 0 ? (
                      '0 - 0 / 0'
                    ) : (
                      `${(page - 1) * pageSize + 1} - ${Math.min(
                        page * pageSize,
                        filteredData.length
                      )} / ${filteredData.length}`
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {page} / {Math.max(1, Math.ceil(filteredData.length / pageSize))}
                    </span>
                    <button
                      type="button"
                      disabled={page >= Math.ceil(filteredData.length / pageSize)}
                      onClick={() =>
                        setPage(
                          Math.min(
                            Math.ceil(filteredData.length / pageSize),
                            page + 1
                          )
                        )
                      }
                      className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 hidden xl:block shrink-0">
                ezHR Smart Data Grid
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. Excel Right-Click Context Menu */}
      {contextMenu && (
        <ExcelContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onCut={excelGrid.handleCut}
          onCopy={excelGrid.handleCopy}
          onPaste={excelGrid.handlePaste}
          onClear={excelGrid.handleClearValues}
          onInsertRowAbove={
            onInsertRowAbove
              ? () => {
                  const rIdx = contextMenu.targetRowIndex ?? excelGrid.activeCell?.rowIndex ?? 0;
                  onInsertRowAbove(rIdx);
                }
              : undefined
          }
          onInsertRowBelow={
            onInsertRowBelow
              ? () => {
                  const rIdx = (contextMenu.targetRowIndex ?? excelGrid.activeCell?.rowIndex ?? 0) + 1;
                  onInsertRowBelow(rIdx);
                }
              : undefined
          }
          onDeleteRow={
            onDeleteRow
              ? () => {
                  const rIdx = contextMenu.targetRowIndex ?? excelGrid.activeCell?.rowIndex ?? 0;
                  onDeleteRow(rIdx);
                }
              : undefined
          }
          onAutoFitColumn={
            contextMenu.targetColId
              ? () => {
                  const targetCol = columns.find((c) => c.id === contextMenu.targetColId);
                  if (targetCol) {
                    const autoW = calculateAutoFitColumnWidth(targetCol, data);
                    setColumnWidths((prev) => ({
                      ...prev,
                      [targetCol.id]: autoW,
                    }));
                  }
                }
              : undefined
          }
          onTogglePinColumn={
            contextMenu.targetColId
              ? () => togglePinColumn(contextMenu.targetColId!)
              : undefined
          }
          isColumnPinned={
            contextMenu.targetColId
              ? pinnedColumnIds.left.includes(contextMenu.targetColId)
              : false
          }
          onOpenFindReplace={enableFindReplace ? handleOpenFind : undefined}
          onUndo={excelGrid.undo}
          onRedo={excelGrid.redo}
          canUndo={excelGrid.canUndo}
          canRedo={excelGrid.canRedo}
        />
      )}

      {/* 4. Find & Replace Modal (Ctrl+F / Ctrl+H) — opt-in, hidden by default */}
      {enableFindReplace && (
        <GridFindReplaceModal
          isOpen={isFindReplaceOpen}
          onClose={() => setIsFindReplaceOpen(false)}
          initialMode={findReplaceMode}
          data={displayRows}
          columns={activeColumns}
          activeCell={excelGrid.activeCell}
          onNavigateToCell={excelGrid.navigateToCell}
          onReplaceCell={excelGrid.handleReplaceCell}
          onReplaceAll={excelGrid.handleReplaceAll}
        />
      )}
    </div>
  );
}
export default BaseDataGrid;

