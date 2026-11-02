import type React from 'react';
import type { DataGridColumn } from './types';
import type { CellRange, NormalizedCellRange, SelectOption } from './excelTypes';

/**
 * Converts a 2D string matrix (rows of cells) to a Tab-Separated Values string.
 * Inverse of `parseTsv`. Excel-compatible: cells with newlines/tabs/quotes are
 * wrapped in double quotes, and embedded quotes are escaped by doubling.
 *
 * NOTE: This is a temporary stub added to unblock Vite dep optimization —
 * the original `toTsv` was missing from this file (was being imported in
 * `useExcelGrid.ts` line 20) but never exported. Full unit-test coverage
 * belongs in a separate fix; the function is only used internally by the
 * Excel grid for copy-to-clipboard.
 */
export function toTsv(matrix: string[][]): string {
  if (!Array.isArray(matrix) || matrix.length === 0) return '';
  return matrix
    .map((row) =>
      (row || [])
        .map((cell) => {
          const s = cell == null ? '' : String(cell);
          // Escape cells containing tab, newline, or double quote
          if (/[\t\n\r"]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join('\t')
    )
    .join('\n');
}

/**
 * Extracts options array from a column (supports static array or function of row)
 */
export function getSelectOptions<T = any>(
  col: DataGridColumn<T>,
  row?: T
): SelectOption[] {
  if (!col.editorOptions) return [];
  if (typeof col.editorOptions === 'function') {
    return row ? col.editorOptions(row) : [];
  }
  return col.editorOptions;
}

/**
 * Extracts raw cell value from a row based on column accessor
 */
export function getCellValue<T = any>(row: T, col: DataGridColumn<T>): any {
  if (!row) return undefined;
  if (col.accessorFn) return col.accessorFn(row);
  if (col.accessorKey) return (row as any)[col.accessorKey];
  return (row as any)[col.id];
}

/**
 * Sets raw cell value in a row, returning a new cloned row object.
 * Automatically synchronizes foreign key valueField and labelField if defined.
 */
export function setCellValue<T = any>(
  row: T,
  col: DataGridColumn<T>,
  value: any
): T {
  const newRow = { ...row } as any;
  const key = (col.accessorKey as string) || col.id;
  newRow[key] = value;

  // Smart Lookup / Combobox synchronization
  const options = getSelectOptions(col, row);
  if (options.length > 0) {
    const foundOption = options.find(
      (opt) => opt.value === value || String(opt.value) === String(value) || opt.label === value
    );
    if (foundOption) {
      if (col.onOptionSelect) {
        const partial = col.onOptionSelect(foundOption, newRow);
        if (partial && typeof partial === 'object') {
          Object.assign(newRow, partial);
        }
      } else {
        if (col.valueKey) {
          newRow[col.valueKey] = foundOption.value;
        }
        if (col.labelKey) {
          newRow[col.labelKey] = foundOption.label;
        }
      }
    }
  }

  return newRow;
}

/**
 * Normalizes a range so minRow <= maxRow and minCol <= maxCol.
 * Accepts either CellRange or NormalizedCellRange.
 */
export function normalizeRange(range: CellRange | NormalizedCellRange): NormalizedCellRange {
  if ('minRow' in range) {
    return range;
  }
  return {
    minRow: Math.min(range.startRow, range.endRow),
    maxRow: Math.max(range.startRow, range.endRow),
    minCol: Math.min(range.startCol, range.endCol),
    maxCol: Math.max(range.startCol, range.endCol),
  };
}

/**
 * Checks if a cell coordinate is within a given range
 */
export function isCellInRange(
  rowIndex: number,
  colIndex: number,
  range: CellRange | NormalizedCellRange | null | undefined
): boolean {
  if (!range) return false;
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
  return (
    rowIndex >= minRow &&
    rowIndex <= maxRow &&
    colIndex >= minCol &&
    colIndex <= maxCol
  );
}

/**
 * Checks which perimeter borders of a range a cell touches (for Excel selection border)
 */
export function getCellBorderPlacement(
  rowIndex: number,
  colIndex: number,
  range: CellRange | NormalizedCellRange | null | undefined
): {
  isTop: boolean;
  isBottom: boolean;
  isLeft: boolean;
  isRight: boolean;
  isBottomRight: boolean;
} {
  if (!range) {
    return {
      isTop: false,
      isBottom: false,
      isLeft: false,
      isRight: false,
      isBottomRight: false,
    };
  }
  const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
  const inRange =
    rowIndex >= minRow &&
    rowIndex <= maxRow &&
    colIndex >= minCol &&
    colIndex <= maxCol;

  if (!inRange) {
    return {
      isTop: false,
      isBottom: false,
      isLeft: false,
      isRight: false,
      isBottomRight: false,
    };
  }

  const isTop = rowIndex === minRow;
  const isBottom = rowIndex === maxRow;
  const isLeft = colIndex === minCol;
  const isRight = colIndex === maxCol;

  return {
    isTop,
    isBottom,
    isLeft,
    isRight,
    isBottomRight: isBottom && isRight,
  };
}


/**
 * Checks whether a column or specific cell in a row is editable
 */
export function isCellEditable<T = any>(
  col: DataGridColumn<T>,
  row: T,
  gridEditable: boolean = false
): boolean {
  if (col.readOnly) return false;
  if (typeof col.editable === 'function') {
    return col.editable(row);
  }
  if (typeof col.editable === 'boolean') {
    return col.editable;
  }
  return gridEditable;
}

// Known Vietnamese & English alias dictionaries for standard catalog fields
const STATUS_ALIASES: Record<string, string> = {
  'nháp': 'Draft',
  'bản nháp': 'Draft',
  'soạn thảo': 'Draft',
  'draft': 'Draft',
  'đang làm': 'InProgress',
  'đang thực hiện': 'InProgress',
  'đang phát triển': 'InProgress',
  'đang xử lý': 'InProgress',
  'in progress': 'InProgress',
  'inprogress': 'InProgress',
  'in-progress': 'InProgress',
  'doing': 'InProgress',
  'hoạt động': 'Active',
  'áp dụng': 'Active',
  'hiệu lực': 'Active',
  'active': 'Active',
  'hoàn thành': 'Completed',
  'xong': 'Completed',
  'completed': 'Completed',
  'done': 'Completed',
  'kết thúc': 'Completed',
  'ngừng': 'Deprecated',
  'hết hạn': 'Deprecated',
  'hủy': 'Deprecated',
  'bỏ': 'Deprecated',
  'deprecated': 'Deprecated',
  'ngưng sử dụng': 'Deprecated',
};

const PRIORITY_ALIASES: Record<string, string> = {
  'thấp': 'Low',
  'low': 'Low',
  'vừa': 'Medium',
  'trung bình': 'Medium',
  'medium': 'Medium',
  'bình thường': 'Medium',
  'normal': 'Medium',
  'cao': 'High',
  'high': 'High',
  'khẩn cấp': 'Critical',
  'khẩn': 'Critical',
  'critical': 'Critical',
  'urgent': 'Critical',
  'nghiêm trọng': 'Critical',
};

const COMPLEXITY_ALIASES: Record<string, string> = {
  'đơn giản': 'Simple',
  'dễ': 'Simple',
  'simple': 'Simple',
  'trung bình': 'Medium',
  'vừa': 'Medium',
  'medium': 'Medium',
  'phức tạp': 'Complex',
  'khó': 'Complex',
  'complex': 'Complex',
};

/**
 * Parses Tab-Separated Values (TSV) from clipboard into a 2D string matrix.
 * Handles Excel standard escaping where cells with newlines/tabs are quoted with double quotes.
 * Also auto-detects comma/semicolon CSV if no tabs are present.
 */
export function parseTsv(text: string): string[][] {
  if (!text) return [];

  // Determine delimiter: Excel clipboard is \t, but fallback to semicolon or comma if no \t is found
  let delimiter = '\t';
  if (!text.includes('\t')) {
    if (text.includes(';') && !text.includes(',')) {
      delimiter = ';';
    } else if (text.includes(',')) {
      delimiter = ',';
    }
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Push final cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Automatically coerces pasted or filled string to the target column type.
 * For select/combobox columns, maps labels to values, supports fuzzy Vietnamese aliases.
 */
export function coerceValue(
  value: any,
  col: DataGridColumn<any>,
  existingVal?: any,
  row?: any
): any {
  if (value === null || value === undefined) return value;
  if (col.parseValue) {
    return col.parseValue(String(value));
  }

  let cleanStr = String(value).trim();
  if (cleanStr.startsWith('"') && cleanStr.endsWith('"') && cleanStr.length >= 2) {
    cleanStr = cleanStr.substring(1, cleanStr.length - 1).trim();
  }
  const lowerStr = cleanStr.toLowerCase();

  // If column is select / combobox
  if (col.editorType === 'select' || col.editorOptions) {
    const options = getSelectOptions(col, row);
    if (options.length > 0) {
      // 1. Match by exact value
      const matchVal = options.find((o) => String(o.value).trim().toLowerCase() === lowerStr);
      if (matchVal) return matchVal.value;

      // 2. Match by exact label
      const matchLabel = options.find((o) => o.label.trim().toLowerCase() === lowerStr);
      if (matchLabel) return matchLabel.value;

      // 3. Match by standard alias dictionaries
      if (STATUS_ALIASES[lowerStr]) {
        const targetVal = STATUS_ALIASES[lowerStr];
        const matchAlias = options.find((o) => String(o.value).toLowerCase() === targetVal.toLowerCase());
        if (matchAlias) return matchAlias.value;
      }
      if (PRIORITY_ALIASES[lowerStr]) {
        const targetVal = PRIORITY_ALIASES[lowerStr];
        const matchAlias = options.find((o) => String(o.value).toLowerCase() === targetVal.toLowerCase());
        if (matchAlias) return matchAlias.value;
      }
      if (COMPLEXITY_ALIASES[lowerStr]) {
        const targetVal = COMPLEXITY_ALIASES[lowerStr];
        const matchAlias = options.find((o) => String(o.value).toLowerCase() === targetVal.toLowerCase());
        if (matchAlias) return matchAlias.value;
      }

      // 4. Boolean select options check (e.g. { label: 'Có', value: 'true' })
      const isTruthy = ['có', 'co', 'yes', 'y', 'true', '1', 'x', '✓', 'v'].includes(lowerStr);
      const isFalsy = ['không', 'khong', 'ko', 'k', 'no', 'n', 'false', '0', '—', '-'].includes(lowerStr);
      if (isTruthy) {
        const truthyOpt = options.find((o) =>
          String(o.value).toLowerCase() === 'true' ||
          o.label.toLowerCase() === 'có' ||
          o.label.toLowerCase() === 'yes'
        );
        if (truthyOpt) return truthyOpt.value;
      } else if (isFalsy) {
        const falsyOpt = options.find((o) =>
          String(o.value).toLowerCase() === 'false' ||
          o.label.toLowerCase() === 'không' ||
          o.label.toLowerCase() === 'no'
        );
        if (falsyOpt) return falsyOpt.value;
      }

      // 5. Fuzzy match for composite labels (e.g. "HR — Quản lý nhân sự" matching "HR" or "Nhân sự")
      const fuzzyMatch = options.find((o) => {
        const oLabel = o.label.toLowerCase();
        const oVal = String(o.value).toLowerCase();
        return (
          oLabel.includes(lowerStr) ||
          lowerStr.includes(oVal) ||
          lowerStr.startsWith(oVal + ' ') ||
          lowerStr.startsWith(oVal + '—') ||
          lowerStr.startsWith(oVal + '-')
        );
      });
      if (fuzzyMatch) return fuzzyMatch.value;

      // Fallback: if user pasted empty string, allow clearing
      if (cleanStr === '') return '';

      // Fallback to existing value to prevent invalid corruptions
      return existingVal !== undefined ? existingVal : value;
    }
  }

  // If column type is number or existing value is number
  if (col.editorType === 'number' || (existingVal !== undefined && typeof existingVal === 'number')) {
    if (cleanStr === '') return null;
    const num = Number(cleanStr.replace(/,/g, '').replace(/[^\d.-]/g, ''));
    return isNaN(num) ? value : num;
  }

  // If column type is boolean or existing value is boolean
  if (col.editorType === 'boolean' || (existingVal !== undefined && typeof existingVal === 'boolean')) {
    const isTruthy = ['có', 'co', 'yes', 'y', 'true', '1', 'x', '✓', 'v'].includes(lowerStr);
    const isFalsy = ['không', 'khong', 'ko', 'k', 'no', 'n', 'false', '0', '—', '-'].includes(lowerStr);
    if (isTruthy) return true;
    if (isFalsy) return false;
    return Boolean(value);
  }

  return cleanStr;
}

/**
 * Detects if the first row of a pasted matrix is an Excel header row.
 * Returns an array of target column indices in activeColumns (or null for unmapped columns).
 * Returns null if the first row does not look like a header row.
 */
export function detectHeaderMapping<T = any>(
  firstRow: string[],
  activeColumns: DataGridColumn<T>[]
): (number | null)[] | null {
  if (!firstRow || firstRow.length === 0 || !activeColumns || activeColumns.length === 0) return null;

  const mappings: (number | null)[] = [];
  let matchedHeadersCount = 0;

  const synonyms: Record<string, string[]> = {
    code: ['mã', 'mã chức năng', 'mã code', 'code', 'feature code', 'mã da', 'mã dự án', 'mã kh', 'mã khách hàng'],
    name: ['tên', 'tên chức năng', 'tên dự án', 'tên khách hàng', 'name', 'tiêu đề', 'title'],
    description: ['mô tả', 'mô tả tóm tắt', 'desc', 'description', 'ghi chú', 'chi tiết'],
    modulecode: ['phân hệ', 'mã phân hệ', 'module', 'module code', 'nhóm', 'phân hệ (lookup chính)', 'mã phân hệ (lookup chính)'],
    status: ['trạng thái', 'status', 'tình trạng'],
    priority: ['mức ưu tiên', 'mức độ ưu tiên', 'ưu tiên', 'priority', 'độ ưu tiên'],
    complexity: ['độ phức tạp', 'phức tạp', 'complexity', 'độ khó'],
    estimatedeffort: ['ước lượng', 'ước lượng effort', 'ước lượng effort (giờ)', 'ước lượng (h)', 'giờ', 'effort', 'estimate', 'man-hour'],
    iscore: ['cốt lõi', 'cốt lõi?', 'iscore', 'core'],
    isoptional: ['tùy chọn', 'tuỳ chọn', 'tùy chọn?', 'tuỳ chọn?', 'isoptional', 'optional'],
    tags: ['tags', 'tag', 'nhãn', 'từ khóa'],
  };

  for (let c = 0; c < firstRow.length; c++) {
    const raw = (firstRow[c] || '').trim().toLowerCase();
    if (!raw) {
      mappings.push(null);
      continue;
    }

    const foundColIndex = activeColumns.findIndex((col) => {
      const key = ((col.accessorKey as string) || col.id || '').toLowerCase();
      if (key === raw) return true;

      if (typeof col.header === 'string') {
        const h = col.header.toLowerCase();
        if (h === raw || h.includes(raw) || raw.includes(h)) return true;
      }

      const synList = synonyms[key];
      if (synList && synList.some((s) => s === raw || raw.includes(s) || s.includes(raw))) {
        return true;
      }
      return false;
    });

    if (foundColIndex !== -1) {
      mappings.push(foundColIndex);
      matchedHeadersCount++;
    } else {
      mappings.push(null);
    }
  }

  // If at least 2 columns match known headers (or 1 if the table only has 1 or 2 columns)
  if (matchedHeadersCount >= Math.min(2, firstRow.length)) {
    return mappings;
  }
  return null;
}

/**
 * Converts a 0-based column index to an Excel column letter (0 -> A, 25 -> Z, 26 -> AA, etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Detects number/date/smart-alphanumeric sequence and extrapolates values for Drag-to-Fill
 */
export function extrapolateSequence(
  sourceValues: any[],
  targetCount: number,
  direction: 'forward' | 'backward' = 'forward'
): any[] {
  if (targetCount <= 0 || sourceValues.length === 0) return [];

  // 1. Pure Numbers Sequence
  const areAllNumbers = sourceValues.every((v) => {
    if (v === null || v === undefined || v === '') return false;
    return typeof v === 'number' || (!isNaN(Number(v)) && !isNaN(parseFloat(String(v))));
  });

  if (areAllNumbers) {
    const nums = sourceValues.map(Number);
    let step = 1;
    if (nums.length >= 2) {
      step = (nums[nums.length - 1] - nums[0]) / (nums.length - 1);
    }

    const results: number[] = [];
    if (direction === 'forward') {
      const base = nums[nums.length - 1];
      for (let i = 1; i <= targetCount; i++) {
        results.push(base + step * i);
      }
    } else {
      const base = nums[0];
      for (let i = targetCount; i >= 1; i--) {
        results.push(base - step * i);
      }
    }
    return results;
  }

  // 2. ISO Dates (YYYY-MM-DD) or Vietnamese Dates (DD/MM/YYYY)
  const isIsoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isVnDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  const areAllIsoDates = sourceValues.every(
    (v) => typeof v === 'string' && isIsoDateRegex.test(v.trim())
  );

  if (areAllIsoDates) {
    const dates = sourceValues.map((v) => new Date(v));
    let dayStep = 1;
    if (dates.length >= 2) {
      const diffMs = dates[dates.length - 1].getTime() - dates[0].getTime();
      dayStep = Math.round(diffMs / (1000 * 60 * 60 * 24 * (dates.length - 1))) || 1;
    }

    const results: string[] = [];
    if (direction === 'forward') {
      const lastDate = dates[dates.length - 1];
      for (let i = 1; i <= targetCount; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + dayStep * i);
        results.push(d.toISOString().slice(0, 10));
      }
    } else {
      const firstDate = dates[0];
      for (let i = targetCount; i >= 1; i--) {
        const d = new Date(firstDate);
        d.setDate(d.getDate() - dayStep * i);
        results.push(d.toISOString().slice(0, 10));
      }
    }
    return results;
  }

  const areAllVnDates = sourceValues.every(
    (v) => typeof v === 'string' && isVnDateRegex.test(v.trim())
  );

  if (areAllVnDates) {
    const parseVnDate = (s: string) => {
      const parts = s.trim().split('/');
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    };
    const formatVnDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const dates = sourceValues.map(parseVnDate);
    let dayStep = 1;
    if (dates.length >= 2) {
      const diffMs = dates[dates.length - 1].getTime() - dates[0].getTime();
      dayStep = Math.round(diffMs / (1000 * 60 * 60 * 24 * (dates.length - 1))) || 1;
    }

    const results: string[] = [];
    if (direction === 'forward') {
      const lastDate = dates[dates.length - 1];
      for (let i = 1; i <= targetCount; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + dayStep * i);
        results.push(formatVnDate(d));
      }
    } else {
      const firstDate = dates[0];
      for (let i = targetCount; i >= 1; i--) {
        const d = new Date(firstDate);
        d.setDate(d.getDate() - dayStep * i);
        results.push(formatVnDate(d));
      }
    }
    return results;
  }

  // 3. Smart Alphanumeric Sequence (e.g. "Phase 1", "Task-001", "Giai đoạn 01", "Sprint 1")
  const alphaNumRegex = /^(.*?)(\d+)(.*?)$/;
  const parsedAlpha = sourceValues.map((v) => {
    if (typeof v !== 'string') return null;
    const match = v.match(alphaNumRegex);
    if (!match) return null;
    return {
      prefix: match[1],
      numStr: match[2],
      num: parseInt(match[2], 10),
      suffix: match[3],
      padLength: match[2].length,
    };
  });

  const allAlphaValid = parsedAlpha.every(
    (p) => p !== null && p.prefix === parsedAlpha[0]?.prefix && p.suffix === parsedAlpha[0]?.suffix
  );

  if (allAlphaValid && parsedAlpha[0]) {
    const { prefix, suffix, padLength } = parsedAlpha[0];
    const nums = parsedAlpha.map((p) => p!.num);
    let step = 1;
    if (nums.length >= 2) {
      step = (nums[nums.length - 1] - nums[0]) / (nums.length - 1) || 1;
    }

    const formatAlphaNum = (n: number) => {
      const nStr = String(Math.max(0, n)).padStart(padLength, '0');
      return `${prefix}${nStr}${suffix}`;
    };

    const results: string[] = [];
    if (direction === 'forward') {
      const base = nums[nums.length - 1];
      for (let i = 1; i <= targetCount; i++) {
        results.push(formatAlphaNum(base + step * i));
      }
    } else {
      const base = nums[0];
      for (let i = targetCount; i >= 1; i--) {
        results.push(formatAlphaNum(base - step * i));
      }
    }
    return results;
  }

  // 4. Default: Copy-Fill (Cycle through source values)
  const results: any[] = [];
  if (direction === 'forward') {
    for (let i = 0; i < targetCount; i++) {
      results.push(sourceValues[i % sourceValues.length]);
    }
  } else {
    for (let i = targetCount - 1; i >= 0; i--) {
      results.push(sourceValues[i % sourceValues.length]);
    }
  }
  return results;
}

/**
 * Calculates optimal pixel column width based on column title and sample row contents
 */
export function calculateAutoFitColumnWidth<T = any>(
  col: DataGridColumn<T>,
  data: T[],
  sampleLimit: number = 100
): number {
  const headerText = typeof col.header === 'string' ? col.header : col.id;
  let maxChars = headerText.length + 3; // buffer for sort icon / menu

  const sample = data.slice(0, sampleLimit);
  for (const row of sample) {
    let val: any = undefined;
    if (col.accessorFn) val = col.accessorFn(row);
    else if (col.accessorKey) val = (row as any)[col.accessorKey];
    else val = (row as any)[col.id];

    if (val !== null && val !== undefined) {
      let str = String(val);
      if (col.formatValue) str = col.formatValue(val);
      maxChars = Math.max(maxChars, str.length);
    }
  }

  // Approximate pixel width: ~8.5px per character + 36px horizontal cell padding & badges
  const calculatedWidth = Math.round(maxChars * 8.5) + 36;
  const minW = Math.max(col.minWidth || 60, 60);
  const maxW = col.maxWidth || 800;

  return Math.max(minW, Math.min(maxW, calculatedWidth));
}

/**
 * Recognized uppercase abbreviations / acronyms that should stay in uppercase when formatting headers.
 */
const ACRONYMS = new Set([
  'ID',
  'PM',
  'SP',
  'KPI',
  'DA',
  'HĐ',
  'JIRA',
  'MT',
  'STT',
  'PO',
  'BA',
  'QC',
  'QA',
  'UI',
  'UX',
  'HR',
  'IT',
  'API',
  'URL',
  'AUTO',
  'VCS',
]);

/**
 * Formats a column header to sentence case (Viết thường + In hoa ký tự đầu).
 * E.g.:
 * - "Tên nhiệm vụ" -> "Tên nhiệm vụ"
 * - "tên nhiệm vụ" -> "Tên nhiệm vụ"
 * - "TÊN NHIỆM VỤ" -> "Tên nhiệm vụ"
 * - "MÃ TEMPLATE" -> "Mã template"
 * - "ĐIỂM SP" -> "Điểm SP"
 * - "PM Phụ Trách" -> "PM Phụ Trách"
 * - "ID" -> "ID"
 */
export function formatHeaderTitle(
  header: React.ReactNode,
  mode: 'default' | 'uppercase' | 'none' = 'default'
): React.ReactNode {
  if (typeof header !== 'string') return header;
  const str = header.trim();
  if (!str) return header;

  if (mode === 'uppercase') {
    return str.toUpperCase();
  }

  if (mode === 'none') {
    return header;
  }

  // Preserve recognized acronyms like ID, JIRA, PM, etc.
  if (ACRONYMS.has(str)) {
    return str;
  }

  // Check if entire string consists only of uppercase letters & spaces/punctuation (Vietnamese accents supported)
  const lettersOnly = str.replace(/[^a-zA-ZÀ-Ỹà-ỹ]/g, '');
  const isAllUpper =
    lettersOnly.length > 0 &&
    lettersOnly === lettersOnly.toUpperCase() &&
    lettersOnly !== lettersOnly.toLowerCase();

  if (isAllUpper) {
    // If it's a short token with no spaces and length <= 4, it might be an acronym (e.g. "JIRA", "VCS")
    if (!str.includes(' ') && str.length <= 4) {
      return str;
    }

    // Convert all-caps string to sentence case, preserving any internal acronyms
    const words = str.split(' ');
    const formattedWords = words.map((w, index) => {
      const cleanWord = w.replace(/[^a-zA-ZÀ-Ỹà-ỹ]/g, '');
      if (ACRONYMS.has(cleanWord)) {
        return w;
      }
      const lower = w.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    });
    return formattedWords.join(' ');
  }

  // If starts with a lowercase letter, capitalize first character
  if (/^[a-zà-ỹ]/.test(str)) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return header;
}


