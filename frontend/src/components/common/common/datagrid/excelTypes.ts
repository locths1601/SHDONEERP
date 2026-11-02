import React from 'react';
import type { DataGridColumn } from './types';

export interface CellCoord {
  rowIndex: number;
  colIndex: number;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface NormalizedCellRange {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export interface CellChange<T = any> {
  row: T;
  rowKey: string;
  rowIndex: number;
  column: DataGridColumn<T>;
  field: string;
  oldValue: any;
  newValue: any;
  selectedOption?: SelectOption;
}

export interface CellEditorProps<T = any> {
  row: T;
  column: DataGridColumn<T>;
  value: any;
  onChange: (newValue: any) => void;
  onCommit: (nextAction?: 'stay' | 'down' | 'up' | 'left' | 'right') => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export type ColumnEditorType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'custom';

export interface SelectOption {
  label: string;
  value: any;
  description?: string;
  badgeClass?: string;
  color?: string;
  icon?: React.ReactNode;
}

export interface HistoryEntry<T = any> {
  id: string;
  timestamp: number;
  description: string;
  changes: CellChange<T>[];
}

export interface ExcelGridOptions<T = any> {
  enableExcelMode?: boolean;
  editable?: boolean;
  onCellsChange?: (changes: CellChange<T>[]) => void;
  onBatchUpdate?: (updatedData: T[]) => void;
  allowDragToFill?: boolean;
  allowClipboard?: boolean;
  allowHistory?: boolean;
  onAutoAddRows?: (count: number) => T[];
  editOnSingleClick?: boolean;
}
