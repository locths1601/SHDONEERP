import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Replace, ChevronDown, ChevronUp, X, Check, ArrowRight } from 'lucide-react';
import type { CellCoord } from './excelTypes';
import type { DataGridColumn } from './types';
import { getCellValue } from './excelUtils';

export interface GridFindReplaceModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'find' | 'replace';
  data: T[];
  columns: DataGridColumn<T>[];
  activeCell: CellCoord | null;
  onNavigateToCell: (coord: CellCoord) => void;
  onReplaceCell: (coord: CellCoord, newValue: any) => void;
  onReplaceAll: (matches: CellCoord[], newValue: any) => void;
}

export const GridFindReplaceModal: React.FC<GridFindReplaceModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'find',
  data,
  columns,
  activeCell,
  onNavigateToCell,
  onReplaceCell,
  onReplaceAll,
}) => {
  const [tab, setTab] = useState<'find' | 'replace'>(initialMode);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchEntireCell, setMatchEntireCell] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialMode);
      setTimeout(() => findInputRef.current?.select(), 50);
    }
  }, [isOpen, initialMode]);

  // Compute all matching cell coordinates
  const matches = useMemo<CellCoord[]>(() => {
    if (!findText.trim() || data.length === 0 || columns.length === 0) return [];

    const result: CellCoord[] = [];
    const query = matchCase ? findText : findText.toLowerCase();

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        if (!col) continue;

        const val = getCellValue(row, col);
        if (val === null || val === undefined) continue;

        let strVal = String(val);
        if (col.formatValue) strVal = col.formatValue(val);
        const compareVal = matchCase ? strVal : strVal.toLowerCase();

        if (matchEntireCell) {
          if (compareVal === query) {
            result.push({ rowIndex: r, colIndex: c });
          }
        } else {
          if (compareVal.includes(query)) {
            result.push({ rowIndex: r, colIndex: c });
          }
        }
      }
    }

    return result;
  }, [data, columns, findText, matchCase, matchEntireCell]);

  // Keep current match index valid and synchronize navigation
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(-1);
    } else {
      // Find if activeCell is already in matches
      const activeIdx = activeCell
        ? matches.findIndex(
            (m) => m.rowIndex === activeCell.rowIndex && m.colIndex === activeCell.colIndex
          )
        : -1;
      const nextIdx = activeIdx >= 0 ? activeIdx : 0;
      setCurrentMatchIndex(nextIdx);
      if (matches[nextIdx]) {
        onNavigateToCell(matches[nextIdx]);
      }
    }
  }, [matches]);

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    onNavigateToCell(matches[nextIdx]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    onNavigateToCell(matches[prevIdx]);
  };

  const handleReplaceOne = () => {
    if (matches.length === 0 || currentMatchIndex < 0) return;
    const target = matches[currentMatchIndex];
    if (target) {
      onReplaceCell(target, replaceText);
    }
  };

  const handleReplaceAllSubmit = () => {
    if (matches.length === 0) return;
    onReplaceAll(matches, replaceText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none animate-in fade-in duration-150">
      <div className="w-[380px] pointer-events-auto rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-xs text-slate-700 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab('find')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                tab === 'find'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => setTab('replace')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                tab === 'replace'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Thay thế
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="mt-3 space-y-2.5" onKeyDown={handleKeyDown}>
          {/* Find Input */}
          <div>
            <div className="relative flex items-center">
              <input
                ref={findInputRef}
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Nội dung cần tìm..."
                className="w-full rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 pl-8 text-xs shadow-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              {findText && (
                <div className="absolute right-2 text-[10px] text-slate-400 font-mono">
                  {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0 khớp'}
                </div>
              )}
            </div>
          </div>

          {/* Replace Input */}
          {tab === 'replace' && (
            <div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Thay thế bằng..."
                  className="w-full rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 pl-8 text-xs shadow-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800"
                />
                <Replace className="absolute left-2.5 h-3.5 w-3.5 text-indigo-400" />
              </div>
            </div>
          )}

          {/* Options: Match Case / Entire Cell */}
          <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Phân biệt hoa/thường</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={matchEntireCell}
                onChange={(e) => setMatchEntireCell(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Toàn bộ ô</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={matches.length === 0}
                onClick={handlePrev}
                title="Trước đó (Shift+Enter)"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>
              <button
                type="button"
                disabled={matches.length === 0}
                onClick={handleNext}
                title="Tiếp theo (Enter)"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Tiếp</span>
              </button>
            </div>

            {tab === 'replace' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={matches.length === 0}
                  onClick={handleReplaceOne}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  Thay thế
                </button>
                <button
                  type="button"
                  disabled={matches.length === 0}
                  onClick={handleReplaceAllSubmit}
                  className="rounded-lg bg-emerald-600 px-3 py-1 font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40"
                >
                  Tất cả ({matches.length})
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
