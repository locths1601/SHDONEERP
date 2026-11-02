import React from 'react';
import { ConditionalColorRule, Operator, ColorScope, DataGridColumn } from './types';

// =====================================================================
// Operator Metadata & Grouping
// =====================================================================

export interface OperatorOption {
  value: Operator;
  label: string;
  category: 'text' | 'date' | 'number' | 'general';
  requiresValue: boolean;
}

export const OPERATOR_OPTIONS: OperatorOption[] = [
  // General / Empty
  { value: 'is_empty', label: 'Để trống (Rỗng)', category: 'general', requiresValue: false },
  { value: 'is_not_empty', label: 'Không để trống', category: 'general', requiresValue: false },

  // Text
  { value: 'contains', label: 'Chứa từ khóa', category: 'text', requiresValue: true },
  { value: 'not_contains', label: 'Không chứa từ khóa', category: 'text', requiresValue: true },
  { value: 'equals', label: 'Bằng (=)', category: 'text', requiresValue: true },
  { value: 'not_equals', label: 'Khác (≠)', category: 'text', requiresValue: true },

  // Date
  { value: 'is_today', label: 'Hôm nay', category: 'date', requiresValue: false },
  { value: 'is_yesterday', label: 'Hôm qua', category: 'date', requiresValue: false },
  { value: 'is_tomorrow', label: 'Ngày mai', category: 'date', requiresValue: false },
  { value: 'before', label: 'Trước ngày', category: 'date', requiresValue: true },
  { value: 'after', label: 'Sau ngày', category: 'date', requiresValue: true },

  // Number
  { value: 'greater_than', label: 'Lớn hơn (>)', category: 'number', requiresValue: true },
  { value: 'less_than', label: 'Nhỏ hơn (<)', category: 'number', requiresValue: true },
];

export const OPERATOR_LABEL_MAP: Record<Operator, string> = OPERATOR_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  },
  {} as Record<Operator, string>
);

// =====================================================================
// Color Presets (Pastel Enterprise Palette)
// =====================================================================

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  borderColor: string;
  textColorLight: string;
  darkBg: string;
}

export const PRESET_COLORS: ColorPreset[] = [
  {
    id: 'mint',
    name: 'Xanh ngọc (Mint)',
    hex: '#E6FFFA',
    borderColor: '#81E6D9',
    textColorLight: '#0D9488',
    darkBg: 'rgba(13, 148, 136, 0.22)',
  },
  {
    id: 'sky',
    name: 'Xanh dương (Sky)',
    hex: '#E6F7FF',
    borderColor: '#91CAFF',
    textColorLight: '#0284C7',
    darkBg: 'rgba(2, 132, 199, 0.22)',
  },
  {
    id: 'emerald',
    name: 'Xanh lá (Emerald)',
    hex: '#DCFCE7',
    borderColor: '#86EFAC',
    textColorLight: '#16A34A',
    darkBg: 'rgba(22, 163, 74, 0.22)',
  },
  {
    id: 'amber',
    name: 'Vàng cam (Amber)',
    hex: '#FEF3C7',
    borderColor: '#FCD34D',
    textColorLight: '#D97706',
    darkBg: 'rgba(217, 119, 6, 0.22)',
  },
  {
    id: 'rose',
    name: 'Hồng / Đỏ (Rose)',
    hex: '#FFF0F6',
    borderColor: '#FFADD2',
    textColorLight: '#E11D48',
    darkBg: 'rgba(225, 29, 72, 0.22)',
  },
  {
    id: 'purple',
    name: 'Tím nhạt (Purple)',
    hex: '#EDE9FE',
    borderColor: '#C4B5FD',
    textColorLight: '#7C3AED',
    darkBg: 'rgba(124, 58, 237, 0.22)',
  },
  {
    id: 'orange',
    name: 'Cam nhạt (Orange)',
    hex: '#FFEDD5',
    borderColor: '#FDBA74',
    textColorLight: '#EA580C',
    darkBg: 'rgba(234, 88, 12, 0.22)',
  },
  {
    id: 'slate',
    name: 'Xám nhẹ (Slate)',
    hex: '#F1F5F9',
    borderColor: '#CBD5E1',
    textColorLight: '#475569',
    darkBg: 'rgba(71, 85, 105, 0.25)',
  },
];

// =====================================================================
// Helper Utilities for Date & Value Comparison
// =====================================================================

function parseDateToMidnight(d: any): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getTodayMidnight(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Evaluates whether a raw cell value satisfies an operator & rule value
 */
export function matchesCondition(cellValue: any, operator: Operator, ruleValue: any): boolean {
  const isCellEmpty =
    cellValue === null ||
    cellValue === undefined ||
    (typeof cellValue === 'string' && cellValue.trim() === '') ||
    (Array.isArray(cellValue) && cellValue.length === 0);

  // 1. Empty / Not Empty
  if (operator === 'is_empty') return isCellEmpty;
  if (operator === 'is_not_empty') return !isCellEmpty;

  if (isCellEmpty) return false;

  // 2. Date Operators
  if (
    operator === 'is_today' ||
    operator === 'is_yesterday' ||
    operator === 'is_tomorrow' ||
    operator === 'before' ||
    operator === 'after'
  ) {
    const cellDate = parseDateToMidnight(cellValue);
    if (!cellDate) return false;

    const today = getTodayMidnight();

    if (operator === 'is_today') {
      return cellDate.getTime() === today.getTime();
    }
    if (operator === 'is_yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return cellDate.getTime() === yesterday.getTime();
    }
    if (operator === 'is_tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return cellDate.getTime() === tomorrow.getTime();
    }
    if (operator === 'before') {
      const targetDate = parseDateToMidnight(ruleValue);
      return targetDate ? cellDate.getTime() < targetDate.getTime() : false;
    }
    if (operator === 'after') {
      const targetDate = parseDateToMidnight(ruleValue);
      return targetDate ? cellDate.getTime() > targetDate.getTime() : false;
    }
  }

  // 3. Number Operators
  if (operator === 'greater_than' || operator === 'less_than') {
    const numCell = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue).replace(/,/g, ''));
    const numRule = typeof ruleValue === 'number' ? ruleValue : parseFloat(String(ruleValue).replace(/,/g, ''));

    if (isNaN(numCell) || isNaN(numRule)) return false;

    if (operator === 'greater_than') return numCell > numRule;
    if (operator === 'less_than') return numCell < numRule;
  }

  // 4. Text / General Operators
  const strCell = String(cellValue).trim().toLowerCase();
  const strRule = String(ruleValue ?? '').trim().toLowerCase();

  switch (operator) {
    case 'equals':
      return strCell === strRule;
    case 'not_equals':
      return strCell !== strRule;
    case 'contains':
      return strCell.includes(strRule);
    case 'not_contains':
      return !strCell.includes(strRule);
    default:
      return false;
  }
}

/**
 * Extracts cell value from row according to Column accessor
 */
export function extractCellValue<T = any>(row: T, fieldKey: string, columns: DataGridColumn<T>[]): any {
  const col = columns.find((c) => c.id === fieldKey || c.accessorKey === fieldKey);
  if (col) {
    if (col.accessorFn) return col.accessorFn(row);
    if (col.accessorKey) return (row as any)[col.accessorKey];
  }
  return (row as any)[fieldKey];
}

/**
 * Helper to build inline styles supporting both Light and Dark mode
 */
export function getStyleFromColor(color: string): {
  backgroundColor: string;
  borderColor?: string;
} {
  const preset = PRESET_COLORS.find(
    (p) => p.hex.toLowerCase() === color.toLowerCase() || p.id === color
  );

  if (preset) {
    // Check if dark mode is active on document
    const isDark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    return {
      backgroundColor: isDark ? preset.darkBg : preset.hex,
      borderColor: preset.borderColor,
    };
  }

  // Fallback for custom hex or arbitrary color
  return {
    backgroundColor: color,
  };
}

export interface EvaluatedRowFormatting {
  rowStyle?: React.CSSProperties;
  rowBorderColor?: string;
  cellStyles: Record<string, React.CSSProperties>;
}

/**
 * Evaluates all enabled conditional formatting rules for a given row.
 * Handles both whole-row ('row') and specific-column scopes.
 */
export function evaluateConditionalRules<T = any>(
  row: T,
  rules: ConditionalColorRule[],
  columns: DataGridColumn<T>[]
): EvaluatedRowFormatting {
  const result: EvaluatedRowFormatting = {
    cellStyles: {},
  };

  if (!rules || rules.length === 0) return result;

  // Process enabled rules in order
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const cellVal = extractCellValue(row, rule.field, columns);
    const isMatched = matchesCondition(cellVal, rule.operator, rule.value);

    if (isMatched) {
      const colorStyles = getStyleFromColor(rule.color);

      if (rule.scope === 'row') {
        // Apply to whole row (first matching rule takes precedence, or latest overrides)
        result.rowStyle = {
          backgroundColor: colorStyles.backgroundColor,
        };
        if (colorStyles.borderColor) {
          result.rowBorderColor = colorStyles.borderColor;
        }
      } else {
        // Specific column cell scope
        result.cellStyles[rule.scope] = {
          backgroundColor: colorStyles.backgroundColor,
        };
      }
    }
  }

  return result;
}
