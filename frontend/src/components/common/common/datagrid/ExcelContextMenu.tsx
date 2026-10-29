import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Plus,
  ArrowUpToLine,
  ArrowDownToLine,
  Pin,
  PinOff,
  MoveHorizontal,
  Search,
  Check,
  Undo2,
  Redo2,
  X,
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ExcelContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onClear?: () => void;
  onInsertRowAbove?: () => void;
  onInsertRowBelow?: () => void;
  onDeleteRow?: () => void;
  onAutoFitColumn?: () => void;
  onAutoFitAllColumns?: () => void;
  onTogglePinColumn?: () => void;
  isColumnPinned?: boolean;
  onOpenFindReplace?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedRowCount?: number;
  selectedCellCount?: number;
}

export const ExcelContextMenu: React.FC<ExcelContextMenuProps> = ({
  position,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onInsertRowAbove,
  onInsertRowBelow,
  onDeleteRow,
  onAutoFitColumn,
  onAutoFitAllColumns,
  onTogglePinColumn,
  isColumnPinned = false,
  onOpenFindReplace,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  selectedRowCount = 1,
  selectedCellCount = 1,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!position) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Viewport bounding adjustments to keep menu fully visible
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuW = 240;
  const menuH = 340;

  const left = position.x + menuW > screenW ? Math.max(10, screenW - menuW - 12) : position.x;
  const top = position.y + menuH > screenH ? Math.max(10, screenH - menuH - 12) : position.y;

  return (
    <div
      ref={menuRef}
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 min-w-[220px] max-w-[260px] rounded-xl border border-slate-200/80 bg-white/95 p-1.5 text-xs text-slate-700 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200"
    >
      {/* Undo / Redo */}
      {(onUndo || onRedo) && (
        <div className="flex items-center gap-1 border-b border-slate-100 pb-1 mb-1 dark:border-slate-800">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => {
              onUndo?.();
              onClose();
            }}
            className="flex flex-1 items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Undo2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Hoàn tác</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => {
              onRedo?.();
              onClose();
            }}
            className="flex flex-1 items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Redo2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Làm lại</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+Y</span>
          </button>
        </div>
      )}

      {/* Clipboard Group */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onCut?.();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Scissors className="h-3.5 w-3.5 text-amber-500" />
            <span>Cắt (Cut)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Ctrl+X</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onCopy?.();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Copy className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sao chép (Copy)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Ctrl+C</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onPaste?.();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <ClipboardPaste className="h-3.5 w-3.5 text-blue-500" />
            <span>Dán (Paste)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Ctrl+V</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClear?.();
            onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Xóa nội dung</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Del</span>
        </button>
      </div>

      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

      {/* Row Operations (if supported) */}
      {(onInsertRowAbove || onInsertRowBelow || onDeleteRow) && (
        <div className="space-y-0.5">
          {onInsertRowAbove && (
            <button
              type="button"
              onClick={() => {
                onInsertRowAbove();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <ArrowUpToLine className="h-3.5 w-3.5 text-indigo-500" />
              <span>Chèn dòng phía trên</span>
            </button>
          )}

          {onInsertRowBelow && (
            <button
              type="button"
              onClick={() => {
                onInsertRowBelow();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <ArrowDownToLine className="h-3.5 w-3.5 text-indigo-500" />
              <span>Chèn dòng phía dưới</span>
            </button>
          )}

          {onDeleteRow && (
            <button
              type="button"
              onClick={() => {
                onDeleteRow();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa dòng đã chọn</span>
            </button>
          )}

          <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
        </div>
      )}

      {/* Column and Table Operations */}
      <div className="space-y-0.5">
        {onAutoFitColumn && (
          <button
            type="button"
            onClick={() => {
              onAutoFitColumn();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            <MoveHorizontal className="h-3.5 w-3.5 text-teal-500" />
            <span>Tự căn chỉnh độ rộng cột này</span>
          </button>
        )}

        {onAutoFitAllColumns && (
          <button
            type="button"
            onClick={() => {
              onAutoFitAllColumns();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            <MoveHorizontal className="h-3.5 w-3.5 text-sky-500" />
            <span>Tự căn chỉnh tất cả cột theo tiêu đề</span>
          </button>
        )}

        {onTogglePinColumn && (
          <button
            type="button"
            onClick={() => {
              onTogglePinColumn();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isColumnPinned ? (
              <>
                <PinOff className="h-3.5 w-3.5 text-slate-500" />
                <span>Bỏ ghim cột này</span>
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5 text-amber-500" />
                <span>Ghim cố định cột này</span>
              </>
            )}
          </button>
        )}

        {onOpenFindReplace && (
          <button
            type="button"
            onClick={() => {
              onOpenFindReplace();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-purple-500" />
              <span>Tìm kiếm & Thay thế</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+F</span>
          </button>
        )}
      </div>
    </div>
  );
};
