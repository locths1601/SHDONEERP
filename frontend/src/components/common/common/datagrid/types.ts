import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type RowHeightMode = 'compact' | 'normal' | 'tall' | 'relaxed';

export interface DataGridRef {
  commitEditing: () => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface DataGridSortState {
  field: string;
  direction: SortDirection;
}

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'lt'
  | 'date_from'
  | 'date_to'
  | 'date_between';

export interface DataGridFilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  label?: string;
}

// =====================================================================
// Conditional Formatting Types (Tô màu có điều kiện)
// =====================================================================

export type ColorScope = 'row' | string; // 'row' = tô cả hàng, hoặc fieldKey = tô riêng cột đó

export type Operator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'is_today'
  | 'is_yesterday'
  | 'is_tomorrow' // Cho kiểu Date
  | 'greater_than'
  | 'less_than'; // Cho kiểu Number

export interface ConditionalColorRule {
  id: string;
  color: string; // Hex color code hoặc Tailwind class (VD: #E6F7FF, #E6FFFA, #FFF0F6)
  scope: ColorScope; // Vùng áp dụng (Toàn bộ dòng / Cột cụ thể)
  field: string; // Trường dữ liệu chọn để so sánh (VD: 'sprint_start_date', 'status', 'priority')
  operator: Operator; // Thao tác so sánh (trước, sau, bằng, chứa, hôm nay...)
  value: any; // Giá trị so sánh (VD: 'hôm nay', 'High', 10, '2026-09-29')
  enabled: boolean;
}

export interface DataGridGroupOption {
  key: string;
  label: string;
  icon?: LucideIcon;
  getGroupKey?: (row: any) => string;
  getGroupLabel?: (row: any) => string;
  getGroupAvatar?: (row: any) => { name: string; color?: string };
  groupOrder?: string[];
  sortGroups?: (a: DataGridGroup<any>, b: DataGridGroup<any>) => number;
}

export interface DataGridColumn<T = any> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => any;
  width?: number | string; // e.g. 120 (px) or 'w-36' or '140px'
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  cell?: (props: {
    row: T;
    value: any;
    index: number;
    isSelected: boolean;
  }) => React.ReactNode;
  icon?: LucideIcon;
  sortable?: boolean; // default true
  filterable?: boolean; // default true
  groupable?: boolean;
  hideable?: boolean; // default true
  hidden?: boolean; // default false
  pinned?: 'left' | 'right' | false; // initial freeze position
  headerClassName?: string;
  cellClassName?: string;

  // Excel Mode & Editing
  editable?: boolean | ((row: T) => boolean);
  editorType?: import('./excelTypes').ColumnEditorType;
  editorOptions?:
    | import('./excelTypes').SelectOption[]
    | ((row: T) => import('./excelTypes').SelectOption[]);
  editor?: (props: import('./excelTypes').CellEditorProps<T>) => React.ReactNode;
  readOnly?: boolean;
  formatValue?: (val: any) => string;
  parseValue?: (val: string) => any;
  valueKey?: keyof T | string;
  labelKey?: keyof T | string;
  onOptionSelect?: (option: import('./excelTypes').SelectOption, row: T) => Partial<T> | void;
  showDropdownAffordance?: boolean;
}

export interface DataGridGroup<T = any> {
  groupKey: string;
  groupLabel: string;
  items: T[];
  avatarName?: string;
  avatarColor?: string;
}

export interface DataGridProps<T = any> {
  data: T[];
  columns: DataGridColumn<T>[];
  keyExtractor?: (item: T, index: number) => string;

  // View & Sizing
  rowHeight?: RowHeightMode;
  onRowHeightChange?: (height: RowHeightMode) => void;
  className?: string;

  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showStt?: boolean;

  // Grouping
  groupBy?: string; // column id or 'none'
  onGroupByChange?: (groupBy: string) => void;
  defaultGroupBy?: string;
  groupOptions?: DataGridGroupOption[];
  defaultCollapsedGroups?: Record<string, boolean>;
  onAddRowToGroup?: (groupKey: string) => void;
  renderGroupHeader?: (props: {
    group: DataGridGroup<T>;
    isCollapsed: boolean;
    toggleCollapse: () => void;
    groupOption?: DataGridGroupOption;
  }) => React.ReactNode;

  // Sorting
  sortState?: DataGridSortState;
  onSortChange?: (sort: DataGridSortState) => void;

  // Filters & Search
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  filters?: DataGridFilterCondition[];
  onFiltersChange?: (filters: DataGridFilterCondition[]) => void;
  columnFilters?: Record<string, string>; // per-column quick filters
  onColumnFiltersChange?: (filters: Record<string, string>) => void;

  // Column Visibility & Pinning
  visibleColumnIds?: string[];
  onVisibleColumnIdsChange?: (ids: string[]) => void;
  pinnedColumnIds?: { left: string[]; right: string[] };
  onPinnedColumnIdsChange?: (pinned: { left: string[]; right: string[] }) => void;

  // Row Styling & Interaction
  conditionalRules?: ConditionalColorRule[];
  defaultConditionalRules?: ConditionalColorRule[];
  onConditionalRulesChange?: (rules: ConditionalColorRule[]) => void;
  enableConditionalFormatting?: boolean; // default true
  gridStorageKey?: string; // key for auto-saving conditional rules in localStorage
  rowHighlight?: (row: T) => {
    className?: string;
    style?: React.CSSProperties;
    isWarning?: boolean;
    isDueSoon?: boolean;
  } | undefined | null;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  renderRowActions?: (row: T) => React.ReactNode;

  // Loading & Empty States
  loading?: boolean;
  /** Set true when TanStack Query / useQuery hit an error (e.g. backend unreachable). */
  isError?: boolean;
  /** Human-readable message shown in the error state. */
  errorMessage?: string;
  /** Called when the user clicks the retry button in the error state. */
  onRetry?: () => void;
  emptyText?: string;

  // Summary Footer & Pagination
  enableFooter?: boolean;
  enablePagination?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  footerSummary?: (props: {
    totalRecords: number;
    filteredRecords: number;
    selectedCount: number;
    data: T[];
  }) => React.ReactNode;

  // Built-in Toolbar integration
  enableToolbar?: boolean;
  toolbarExtraLeft?: React.ReactNode;
  toolbarFilters?: React.ReactNode;
  toolbarExtraRight?: React.ReactNode;
  customFilterChips?: React.ReactNode;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  onImportCsv?: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  viewModes?: { key: string; label: string; icon?: React.ReactNode }[];
  activeViewMode?: string;
  onViewModeChange?: (mode: any) => void;

  // Excel Interactivity & Advanced Features
  enableExcelMode?: boolean; // Default true: enables Excel cell focus, range selection, copy/paste, shortcuts
  editable?: boolean; // Enable inline editing in grid
  onCellsChange?: (changes: import('./excelTypes').CellChange<T>[]) => void;
  onBatchUpdate?: (updatedData: T[]) => void;
  onAutoAddRows?: (count: number) => T[];
  allowDragToFill?: boolean; // Default true: enables bottom-right drag-to-fill handle
  allowClipboard?: boolean; // Default true: enables Ctrl+C / Ctrl+V TSV interoperability
  allowHistory?: boolean; // Default true: enables Ctrl+Z Undo / Ctrl+Y Redo
  /**
   * Default false: hides the "Tìm kiếm & Thay thế" (Find & Replace) entry points
   * — toolbar/formula bar buttons, context menu item, and Ctrl+F / Ctrl+H shortcut.
   * When false, browser native Ctrl+F still works as a fallback.
   * Set to true to opt-in and re-enable the modal at a specific call site.
   */
  enableFindReplace?: boolean;
  editOnSingleClick?: boolean; // Automatically activates inline editor on single click
  gridRef?: React.Ref<DataGridRef>;
  showColumnLetters?: boolean; // Displays Excel column letters (A, B, C...) on headers
  onInsertRowAbove?: (rowIndex: number) => void;
  onInsertRowBelow?: (rowIndex: number) => void;
  onDeleteRow?: (rowIndex: number) => void;


  // Column Resizing & Reordering
  enableColumnResizing?: boolean; // Default true: allows dragging header borders to resize columns
  columnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  enableColumnReordering?: boolean; // Default true: allows drag-and-drop column headers to reorder
  columnOrder?: string[];
  onColumnOrderChange?: (columnIds: string[]) => void;

  /**
   * Header text case formatting mode.
   * - 'default': Sentence case (Viết thường + in hoa chữ cái đầu, ví dụ: "Tên nhiệm vụ")
   * - 'uppercase': Chữ in hoa (ALL CAPS, ví dụ: "TÊN NHIỆM VỤ")
   * - 'none': Giữ nguyên hoàn toàn không format
   * @default 'default'
   */
  headerCase?: 'default' | 'uppercase' | 'none';
}


export * from './excelTypes';
