import React, { useState, useEffect, useRef } from 'react';
import { getColumnLetter, formatHeaderTitle } from './excelUtils';
import type { CellCoord } from './excelTypes';
import type { DataGridColumn } from './types';
import { Search, Undo2, Redo2, Lock, Check, X, Edit3, HelpCircle } from 'lucide-react';

export interface GridFormulaBarProps<T = any> {
  activeCell: CellCoord | null;
  activeColumn?: DataGridColumn<T> | null;
  activeRow?: T | null;
  cellValue: any;
  isEditable: boolean;
  onValueCommit: (newValue: any) => void;
  onOpenFindReplace?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const GridFormulaBar: React.FC<GridFormulaBarProps> = ({
  activeCell,
  activeColumn,
  activeRow,
  cellValue,
  isEditable,
  onValueCommit,
  onOpenFindReplace,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with cellValue when active cell changes
  useEffect(() => {
    if (cellValue === null || cellValue === undefined) {
      setInputValue('');
    } else {
      setInputValue(String(cellValue));
    }
    setIsEditingFormula(false);
  }, [activeCell, cellValue]);

  const columnLabel = activeColumn
    ? typeof activeColumn.header === 'string'
      ? formatHeaderTitle(activeColumn.header)
      : activeColumn.id
    : 'Chưa chọn ô';

  const rowNumber = activeCell ? activeCell.rowIndex + 1 : null;
  const colLetter = activeCell ? getColumnLetter(activeCell.colIndex) : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onValueCommit(inputValue);
      setIsEditingFormula(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : '');
      setIsEditingFormula(false);
      inputRef.current?.blur();
    }
  };

  const handleCommit = () => {
    onValueCommit(inputValue);
    setIsEditingFormula(false);
  };

  const handleCancel = () => {
    setInputValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : '');
    setIsEditingFormula(false);
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-200/90 bg-slate-50/90 px-3 py-1.5 text-xs text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
      {/* Vị trí ô & Tên cột thân thiện (Không dùng mã khó hiểu) */}
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800">
        <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
        {activeCell ? (
          <div className="flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[140px] truncate">
              {columnLabel}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              (Dòng {rowNumber})
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Chưa chọn ô</span>
        )}
      </div>

      {/* Ô Nhập & Xem nhanh nội dung */}
      <div className="relative flex flex-1 items-center min-w-[200px]">
        <input
          ref={inputRef}
          type="text"
          disabled={!activeCell || !isEditable}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsEditingFormula(true);
          }}
          onFocus={() => setIsEditingFormula(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            !activeCell
              ? '👉 Nhấp chọn một ô bất kỳ trong bảng để xem / sửa nội dung tại đây'
              : !isEditable
              ? '🔒 Ô này chỉ xem (Không cho phép chỉnh sửa)'
              : '✍️ Nhập hoặc sửa nội dung tại đây (Bấm Enter để Lưu)...'
          }
          className={`w-full rounded-lg border px-3 py-1 text-xs transition-all outline-none ${
            isEditingFormula
              ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 dark:bg-slate-950 dark:border-sky-400'
              : 'border-slate-200 bg-white/90 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950/60'
          } ${
            !isEditable && activeCell
              ? 'cursor-not-allowed bg-slate-100 text-slate-500 dark:bg-slate-800/60'
              : ''
          }`}
        />

        {/* Nút bấm Lưu & Hủy có nhãn rõ ràng cho người dùng không rành phím tắt */}
        {isEditingFormula && isEditable && (
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={handleCommit}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-2xs hover:bg-emerald-700 cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>Lưu</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Hủy</span>
            </button>
          </div>
        )}

        {!isEditable && activeCell && (
          <div className="absolute right-2.5 text-slate-400 flex items-center gap-1 text-[10px]">
            <Lock className="h-3 w-3 text-slate-400" />
            <span className="hidden sm:inline">Chỉ đọc</span>
          </div>
        )}
      </div>

      {/* Các nút công cụ bổ trợ có chú thích tiếng Việt */}
      <div className="flex items-center gap-1 shrink-0">
        {onOpenFindReplace && (
          <button
            type="button"
            onClick={onOpenFindReplace}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
            title="Tìm và thay thế dữ liệu trong bảng (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Tìm kiếm</span>
          </button>
        )}

        {(onUndo || onRedo) && (
          <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-0.5">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              title="Hoàn tác thao tác trước (Ctrl+Z)"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              title="Làm lại thao tác vừa hủy (Ctrl+Y)"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

