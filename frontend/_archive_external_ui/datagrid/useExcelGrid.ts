import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DataGridColumn } from './types';
import type {
  CellCoord,
  CellRange,
  NormalizedCellRange,
  CellChange,
  HistoryEntry,
  ExcelGridOptions,
  SelectOption,
} from './excelTypes';
import {
  normalizeRange,
  isCellInRange,
  getCellBorderPlacement,
  getCellValue,
  setCellValue,
  isCellEditable,
  parseTsv,
  toTsv,
  coerceValue,
  extrapolateSequence,
  detectHeaderMapping,
} from './excelUtils';

interface UseExcelGridProps<T = any> extends ExcelGridOptions<T> {
  data: T[];
  activeColumns: DataGridColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function useExcelGrid<T = any>({
  data,
  activeColumns,
  keyExtractor,
  containerRef,
  enableExcelMode = true,
  editable: controlledEditable,
  onCellsChange,
  onBatchUpdate,
  onAutoAddRows,
  allowDragToFill = true,
  allowClipboard = true,
  allowHistory = true,
  editOnSingleClick = false,
}: UseExcelGridProps<T>) {
  // If controlledEditable is undefined, check if any column is editable or onCellsChange provided
  const isGridEditable = useMemo(() => {
    if (typeof controlledEditable === 'boolean') return controlledEditable;
    if (onCellsChange || onBatchUpdate) return true;
    return activeColumns.some((col) => col.editable !== undefined);
  }, [controlledEditable, onCellsChange, onBatchUpdate, activeColumns]);

  // 1. Selection & Focus State
  const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionAnchor, setSelectionAnchor] = useState<CellCoord | null>(null);
  const draggedRef = useRef(false);

  // 2. Drag-to-fill state
  const [fillHandleDrag, setFillHandleDrag] = useState<{
    sourceRange: NormalizedCellRange;
    currentCoord: CellCoord;
  } | null>(null);

  // 3. Copied & Cut range (Marching ants animation)
  const [copiedRange, setCopiedRange] = useState<NormalizedCellRange | null>(null);
  const [isCutOperation, setIsCutOperation] = useState<boolean>(false);

  // 4. Editing state
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [editingInitialValue, setEditingInitialValue] = useState<any>(undefined);
  const editingCellRef = useRef<CellCoord | null>(null);
  const latestEditorValueRef = useRef<{ value: any; selectedOption?: SelectOption } | undefined>(undefined);

  // 5. History (Undo / Redo)
  const [undoStack, setUndoStack] = useState<HistoryEntry<T>[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry<T>[]>([]);

  // Ref to always access current data inside handlers
  const dataRef = useRef<T[]>(data);
  dataRef.current = data;

  const activeColumnsRef = useRef<DataGridColumn<T>[]>(activeColumns);
  activeColumnsRef.current = activeColumns;

  // Normalized current selection range
  const normalizedRange = useMemo<NormalizedCellRange | null>(() => {
    if (!selectionRange) {
      if (activeCell) {
        return {
          minRow: activeCell.rowIndex,
          maxRow: activeCell.rowIndex,
          minCol: activeCell.colIndex,
          maxCol: activeCell.colIndex,
        };
      }
      return null;
    }
    return normalizeRange(selectionRange);
  }, [selectionRange, activeCell]);

  // Calculate Drag-to-fill Preview Range
  const fillPreviewRange = useMemo<NormalizedCellRange | null>(() => {
    if (!fillHandleDrag) return null;
    const { sourceRange, currentCoord } = fillHandleDrag;
    const { minRow, maxRow, minCol, maxCol } = sourceRange;
    const { rowIndex, colIndex } = currentCoord;

    // Determine direction: horizontal or vertical based on displacement
    const verticalDiff = rowIndex > maxRow ? rowIndex - maxRow : rowIndex < minRow ? minRow - rowIndex : 0;
    const horizontalDiff = colIndex > maxCol ? colIndex - maxCol : colIndex < minCol ? minCol - colIndex : 0;

    if (verticalDiff >= horizontalDiff && verticalDiff > 0) {
      // Dragging vertically
      if (rowIndex > maxRow) {
        return { minRow: maxRow + 1, maxRow: rowIndex, minCol, maxCol };
      } else if (rowIndex < minRow) {
        return { minRow: rowIndex, maxRow: minRow - 1, minCol, maxCol };
      }
    } else if (horizontalDiff > 0) {
      // Dragging horizontally
      if (colIndex > maxCol) {
        return { minRow, maxRow, minCol: maxCol + 1, maxCol: colIndex };
      } else if (colIndex < minCol) {
        return { minRow, maxRow, minCol: colIndex, maxCol: minCol - 1 };
      }
    }

    return null;
  }, [fillHandleDrag]);

  // Execute Batch Changes with Undo History
  const applyCellChanges = useCallback(
    (changes: CellChange<T>[], description = 'Thay đổi ô') => {
      if (changes.length === 0) return;

      if (allowHistory) {
        const historyItem: HistoryEntry<T> = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          description,
          changes,
        };
        setUndoStack((prev) => [...prev.slice(-30), historyItem]);
        setRedoStack([]); // Clear redo stack on new action
      }

      const rowMap = new Map<string, T>();
      dataRef.current.forEach((r, idx) => {
        rowMap.set(keyExtractor(r, idx), r);
      });

      changes.forEach((ch) => {
        const existing = rowMap.get(ch.rowKey);
        if (existing) {
          const updated = setCellValue(existing, ch.column, ch.newValue);
          rowMap.set(ch.rowKey, updated);
        }
      });

      const updatedData = dataRef.current.map((r, idx) => rowMap.get(keyExtractor(r, idx)) || r);
      dataRef.current = updatedData;

      // Dispatch to consumer: prefer onBatchUpdate if provided, else onCellsChange
      if (onBatchUpdate) {
        onBatchUpdate(updatedData);
      } else if (onCellsChange) {
        onCellsChange(changes);
      }
    },
    [allowHistory, onCellsChange, onBatchUpdate, keyExtractor]
  );

  // Undo Handler
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    // Apply reverse changes (newValue -> oldValue)
    const reverseChanges = lastAction.changes.map((ch) => ({
      ...ch,
      oldValue: ch.newValue,
      newValue: ch.oldValue,
    }));

    if (onBatchUpdate) {
      const rowMap = new Map<string, T>();
      dataRef.current.forEach((r, idx) => {
        rowMap.set(keyExtractor(r, idx), r);
      });

      reverseChanges.forEach((ch) => {
        const existing = rowMap.get(ch.rowKey);
        if (existing) {
          const updated = setCellValue(existing, ch.column, ch.newValue);
          rowMap.set(ch.rowKey, updated);
        }
      });

      const updated = dataRef.current.map((r, idx) => rowMap.get(keyExtractor(r, idx)) || r);
      dataRef.current = updated;
      onBatchUpdate(updated);
    } else if (onCellsChange) {
      onCellsChange(reverseChanges);
    }
  }, [undoStack, onCellsChange, onBatchUpdate, keyExtractor]);

  // Redo Handler
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const actionToRedo = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, actionToRedo]);

    if (onBatchUpdate) {
      const rowMap = new Map<string, T>();
      dataRef.current.forEach((r, idx) => {
        rowMap.set(keyExtractor(r, idx), r);
      });

      actionToRedo.changes.forEach((ch) => {
        const existing = rowMap.get(ch.rowKey);
        if (existing) {
          const updated = setCellValue(existing, ch.column, ch.newValue);
          rowMap.set(ch.rowKey, updated);
        }
      });

      const updated = dataRef.current.map((r, idx) => rowMap.get(keyExtractor(r, idx)) || r);
      dataRef.current = updated;
      onBatchUpdate(updated);
    } else if (onCellsChange) {
      onCellsChange(actionToRedo.changes);
    }
  }, [redoStack, onCellsChange, onBatchUpdate, keyExtractor]);

  // Clear Selection
  const clearSelection = useCallback(() => {
    setActiveCell(null);
    setSelectionRange(null);
    setCopiedRange(null);
    setIsCutOperation(false);
    setEditingCell(null);
  }, []);

  // Jump to specific coordinate
  const navigateToCell = useCallback((coord: CellCoord) => {
    setActiveCell(coord);
    setSelectionRange({
      startRow: coord.rowIndex,
      startCol: coord.colIndex,
      endRow: coord.rowIndex,
      endCol: coord.colIndex,
    });
  }, []);

  // Start Editing Cell
  const startEditing = useCallback(
    (coord?: CellCoord, initialTypedValue?: any) => {
      const target = coord || activeCell;
      if (!target) return;
      const row = dataRef.current[target.rowIndex];
      const col = activeColumnsRef.current[target.colIndex];
      if (!row || !col) return;
      if (!isCellEditable(col, row, isGridEditable)) return;

      const currentEditing = editingCellRef.current;
      // If already editing this exact same cell and no new initial typed value, preserve current editor state
      if (
        currentEditing &&
        currentEditing.rowIndex === target.rowIndex &&
        currentEditing.colIndex === target.colIndex &&
        initialTypedValue === undefined
      ) {
        return;
      }

      if (coord) {
        setActiveCell(coord);
        setSelectionRange({
          startRow: coord.rowIndex,
          startCol: coord.colIndex,
          endRow: coord.rowIndex,
          endCol: coord.colIndex,
        });
      }

      const rawVal = initialTypedValue !== undefined ? initialTypedValue : getCellValue(row, col);
      editingCellRef.current = target;
      latestEditorValueRef.current = { value: rawVal };
      setEditingInitialValue(initialTypedValue);
      setEditingCell(target);
    },
    [activeCell, isGridEditable]
  );

  // Realtime Editor Keystroke Value Tracker
  const handleEditorValueChange = useCallback((val: any, selectedOption?: SelectOption) => {
    latestEditorValueRef.current = { value: val, selectedOption };
  }, []);

  // Commit Editing Cell
  const commitEditing = useCallback(
    (
      newValue?: any,
      nextAction: 'stay' | 'down' | 'up' | 'left' | 'right' = 'stay',
      selectedOption?: SelectOption
    ) => {
      const targetCell = editingCellRef.current || editingCell;
      if (!targetCell) return;
      const { rowIndex, colIndex } = targetCell;
      const row = dataRef.current[rowIndex];
      const col = activeColumnsRef.current[colIndex];

      editingCellRef.current = null;
      setEditingInitialValue(undefined);
      setEditingCell(null);

      const valueToUse = newValue !== undefined ? newValue : latestEditorValueRef.current?.value;
      const optionToUse = selectedOption || latestEditorValueRef.current?.selectedOption;
      latestEditorValueRef.current = undefined;

      if (row && col && isCellEditable(col, row, isGridEditable)) {
        const oldValue = getCellValue(row, col);
        const coerced = coerceValue(valueToUse, col, oldValue, row);

        if (coerced !== oldValue) {
          const change: CellChange<T> = {
            row,
            rowKey: keyExtractor(row, rowIndex),
            rowIndex,
            column: col,
            field: (col.accessorKey as string) || col.id,
            oldValue,
            newValue: coerced,
            selectedOption: optionToUse,
          };
          applyCellChanges([change], 'Chỉnh sửa ô');
        }
      }

      // Move active cell according to nextAction
      const maxR = dataRef.current.length - 1;
      const maxC = activeColumnsRef.current.length - 1;
      let nextCoord: CellCoord | null = null;

      if (nextAction === 'down') {
        if (rowIndex < maxR) {
          nextCoord = { rowIndex: rowIndex + 1, colIndex };
        } else if (onAutoAddRows) {
          const added = onAutoAddRows(1);
          if (added && added.length > 0) {
            dataRef.current = [...dataRef.current, ...added];
            nextCoord = { rowIndex: rowIndex + 1, colIndex };
          }
        }
      } else if (nextAction === 'up' && rowIndex > 0) {
        nextCoord = { rowIndex: rowIndex - 1, colIndex };
      } else if (nextAction === 'right' && colIndex < maxC) {
        nextCoord = { rowIndex, colIndex: colIndex + 1 };
      } else if (nextAction === 'left' && colIndex > 0) {
        nextCoord = { rowIndex, colIndex: colIndex - 1 };
      }

      if (nextCoord) {
        setActiveCell(nextCoord);
        setSelectionRange({
          startRow: nextCoord.rowIndex,
          startCol: nextCoord.colIndex,
          endRow: nextCoord.rowIndex,
          endCol: nextCoord.colIndex,
        });
        if (editOnSingleClick) {
          const nextCol = activeColumnsRef.current[nextCoord.colIndex];
          const isSelectCol = nextCol && (nextCol.editorType === 'select' || !!nextCol.editorOptions);
          // Only auto-open text/number editor so Tab smoothly traverses columns without disruptive popovers
          if (!isSelectCol) {
            startEditing(nextCoord);
          } else {
            containerRef?.current?.focus({ preventScroll: true });
          }
        } else {
          containerRef?.current?.focus({ preventScroll: true });
        }
      }
    },
    [editingCell, isGridEditable, keyExtractor, applyCellChanges, editOnSingleClick, startEditing, onAutoAddRows, containerRef]
  );

  // Commit Current Active Editor (Callable imperatively)
  const commitCurrentEditor = useCallback(() => {
    const targetCell = editingCellRef.current || editingCell;
    if (targetCell) {
      const val = latestEditorValueRef.current?.value;
      const opt = latestEditorValueRef.current?.selectedOption;
      commitEditing(val, 'stay', opt);
    }
  }, [editingCell, commitEditing]);

  // Cancel Editing Cell
  const cancelEditing = useCallback(() => {
    editingCellRef.current = null;
    latestEditorValueRef.current = undefined;
    setEditingInitialValue(undefined);
    setEditingCell(null);
  }, []);

  // Single cell replace for Find & Replace
  const handleReplaceCell = useCallback(
    (coord: CellCoord, newValue: any) => {
      const row = dataRef.current[coord.rowIndex];
      const col = activeColumnsRef.current[coord.colIndex];
      if (!row || !col || !isCellEditable(col, row, isGridEditable)) return;

      const oldValue = getCellValue(row, col);
      const coerced = coerceValue(newValue, col, oldValue, row);

      if (coerced !== oldValue) {
        const change: CellChange<T> = {
          row,
          rowKey: keyExtractor(row, coord.rowIndex),
          rowIndex: coord.rowIndex,
          column: col,
          field: (col.accessorKey as string) || col.id,
          oldValue,
          newValue: coerced,
        };
        applyCellChanges([change], 'Thay thế giá trị ô');
      }
    },
    [isGridEditable, keyExtractor, applyCellChanges]
  );

  // Batch replace all for Find & Replace
  const handleReplaceAll = useCallback(
    (matches: CellCoord[], newValue: any) => {
      const changes: CellChange<T>[] = [];
      matches.forEach((coord) => {
        const row = dataRef.current[coord.rowIndex];
        const col = activeColumnsRef.current[coord.colIndex];
        if (!row || !col || !isCellEditable(col, row, isGridEditable)) return;

        const oldValue = getCellValue(row, col);
        const coerced = coerceValue(newValue, col, oldValue, row);

        if (coerced !== oldValue) {
          changes.push({
            row,
            rowKey: keyExtractor(row, coord.rowIndex),
            rowIndex: coord.rowIndex,
            column: col,
            field: (col.accessorKey as string) || col.id,
            oldValue,
            newValue: coerced,
          });
        }
      });

      if (changes.length > 0) {
        applyCellChanges(changes, `Thay thế tất cả (${changes.length} ô)`);
      }
    },
    [isGridEditable, keyExtractor, applyCellChanges]
  );

  // Cell Mouse Down (Selection Anchor)
  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
      if (!enableExcelMode) return;
      if (e.button !== 0) return;
      draggedRef.current = false;

      // If currently editing a cell, commit it before changing selection!
      const currentEditing = editingCellRef.current || editingCell;
      if (currentEditing) {
        if (currentEditing.rowIndex !== rowIndex || currentEditing.colIndex !== colIndex) {
          const valToCommit = latestEditorValueRef.current?.value;
          const optToCommit = latestEditorValueRef.current?.selectedOption;
          commitEditing(valToCommit, 'stay', optToCommit);
        } else {
          return;
        }
      }

      if (e.shiftKey && activeCell) {
        // Shift + Click extends selection from activeCell
        setSelectionRange({
          startRow: activeCell.rowIndex,
          startCol: activeCell.colIndex,
          endRow: rowIndex,
          endCol: colIndex,
        });
      } else {
        // Single Cell Focus
        const coord = { rowIndex, colIndex };
        setActiveCell(coord);
        setSelectionAnchor(coord);
        setSelectionRange({
          startRow: rowIndex,
          startCol: colIndex,
          endRow: rowIndex,
          endCol: colIndex,
        });
        setIsSelecting(true);
      }
    },
    [enableExcelMode, editingCell, activeCell, commitEditing]
  );

  // Cell Click (Single-Click Edit Activation when enabled)
  const handleCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!enableExcelMode) return;
      if (editOnSingleClick) {
        // Prevent editing ONLY if the user was dragging to select multiple cells
        if (draggedRef.current) {
          return;
        }
        const row = dataRef.current[rowIndex];
        const col = activeColumnsRef.current[colIndex];
        if (row && col && isCellEditable(col, row, isGridEditable)) {
          startEditing({ rowIndex, colIndex });
        }
      }
    },
    [enableExcelMode, editOnSingleClick, isGridEditable, startEditing]
  );

  // Cell Mouse Enter (Drag to select range)
  const handleCellMouseEnter = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (!enableExcelMode) return;

      if (fillHandleDrag) {
        setFillHandleDrag((prev) =>
          prev ? { ...prev, currentCoord: { rowIndex, colIndex } } : null
        );
        return;
      }

      if (isSelecting && selectionAnchor) {
        if (selectionAnchor.rowIndex !== rowIndex || selectionAnchor.colIndex !== colIndex) {
          draggedRef.current = true;
        }
        setSelectionRange({
          startRow: selectionAnchor.rowIndex,
          startCol: selectionAnchor.colIndex,
          endRow: rowIndex,
          endCol: colIndex,
        });
      }
    },
    [enableExcelMode, fillHandleDrag, isSelecting, selectionAnchor]
  );

  // Row Header Click (Select entire row)
  const handleRowHeaderClick = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      if (!enableExcelMode) return;
      const maxCol = activeColumnsRef.current.length - 1;
      if (e.shiftKey && activeCell) {
        setSelectionRange({
          startRow: activeCell.rowIndex,
          startCol: 0,
          endRow: rowIndex,
          endCol: maxCol,
        });
      } else {
        setActiveCell({ rowIndex, colIndex: 0 });
        setSelectionRange({
          startRow: rowIndex,
          startCol: 0,
          endRow: rowIndex,
          endCol: maxCol,
        });
      }
    },
    [enableExcelMode, activeCell]
  );

  // Col Header Click (Select entire column)
  const handleColHeaderClick = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      if (!enableExcelMode) return;
      const maxRow = dataRef.current.length - 1;
      if (e.shiftKey && activeCell) {
        setSelectionRange({
          startRow: 0,
          startCol: activeCell.colIndex,
          endRow: maxRow,
          endCol: colIndex,
        });
      } else {
        setActiveCell({ rowIndex: 0, colIndex });
        setSelectionRange({
          startRow: 0,
          startCol: colIndex,
          endRow: maxRow,
          endCol: colIndex,
        });
      }
    },
    [enableExcelMode, activeCell]
  );

  // Fill Handle Mouse Down
  const handleFillHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enableExcelMode || !allowDragToFill) return;
      e.stopPropagation();
      e.preventDefault();

      if (normalizedRange) {
        setFillHandleDrag({
          sourceRange: normalizedRange,
          currentCoord: {
            rowIndex: normalizedRange.maxRow,
            colIndex: normalizedRange.maxCol,
          },
        });
      }
    },
    [enableExcelMode, allowDragToFill, normalizedRange]
  );

  // Global Mouse Up Listener for Selection & Fill Drag Finish
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }

      if (fillHandleDrag && fillPreviewRange) {
        const { sourceRange } = fillHandleDrag;
        const preview = fillPreviewRange;
        setFillHandleDrag(null);

        // Execute Drag-to-Fill logic
        const changes: CellChange<T>[] = [];
        const isVertical = preview.minRow !== sourceRange.minRow || preview.maxRow !== sourceRange.maxRow;

        if (isVertical) {
          const isForward = preview.minRow > sourceRange.maxRow;
          const targetRowCount = preview.maxRow - preview.minRow + 1;

          for (let c = preview.minCol; c <= preview.maxCol; c++) {
            const col = activeColumnsRef.current[c];
            if (!col) continue;

            const sourceVals: any[] = [];
            for (let r = sourceRange.minRow; r <= sourceRange.maxRow; r++) {
              const row = dataRef.current[r];
              if (row) sourceVals.push(getCellValue(row, col));
            }

            const filledVals = extrapolateSequence(
              sourceVals,
              targetRowCount,
              isForward ? 'forward' : 'backward'
            );

            for (let i = 0; i < targetRowCount; i++) {
              const r = preview.minRow + i;
              const targetRow = dataRef.current[r];
              if (!targetRow || !isCellEditable(col, targetRow, isGridEditable)) continue;

              const oldVal = getCellValue(targetRow, col);
              const newVal = coerceValue(filledVals[i], col, oldVal);
              changes.push({
                row: targetRow,
                rowKey: keyExtractor(targetRow, r),
                rowIndex: r,
                column: col,
                field: (col.accessorKey as string) || col.id,
                oldValue: oldVal,
                newValue: newVal,
              });
            }
          }
        } else {
          // Horizontal fill
          const isForward = preview.minCol > sourceRange.maxCol;
          const targetColCount = preview.maxCol - preview.minCol + 1;

          for (let r = preview.minRow; r <= preview.maxRow; r++) {
            const row = dataRef.current[r];
            if (!row) continue;

            const sourceVals: any[] = [];
            for (let c = sourceRange.minCol; c <= sourceRange.maxCol; c++) {
              const col = activeColumnsRef.current[c];
              if (col) sourceVals.push(getCellValue(row, col));
            }

            const filledVals = extrapolateSequence(
              sourceVals,
              targetColCount,
              isForward ? 'forward' : 'backward'
            );

            for (let j = 0; j < targetColCount; j++) {
              const c = preview.minCol + j;
              const col = activeColumnsRef.current[c];
              if (!col || !isCellEditable(col, row, isGridEditable)) continue;

              const oldVal = getCellValue(row, col);
              const newVal = coerceValue(filledVals[j], col, oldVal);
              changes.push({
                row,
                rowKey: keyExtractor(row, r),
                rowIndex: r,
                column: col,
                field: (col.accessorKey as string) || col.id,
                oldValue: oldVal,
                newValue: newVal,
              });
            }
          }
        }

        if (changes.length > 0) {
          applyCellChanges(changes, 'Kéo điền tự động (Auto-fill)');
          setSelectionRange({
            startRow: Math.min(sourceRange.minRow, preview.minRow),
            startCol: Math.min(sourceRange.minCol, preview.minCol),
            endRow: Math.max(sourceRange.maxRow, preview.maxRow),
            endCol: Math.max(sourceRange.maxCol, preview.maxCol),
          });
        }
      } else if (fillHandleDrag) {
        setFillHandleDrag(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [
    isSelecting,
    fillHandleDrag,
    fillPreviewRange,
    isGridEditable,
    keyExtractor,
    applyCellChanges,
  ]);

  // Copy to Clipboard (TSV Excel format)
  const handleCopy = useCallback(async () => {
    if (!enableExcelMode || !allowClipboard || !normalizedRange) return;
    const { minRow, maxRow, minCol, maxCol } = normalizedRange;

    const matrix: any[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = dataRef.current[r];
      const rowVals: any[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const col = activeColumnsRef.current[c];
        rowVals.push(row && col ? getCellValue(row, col) : '');
      }
      matrix.push(rowVals);
    }

    const tsvText = toTsv(matrix);
    try {
      await navigator.clipboard.writeText(tsvText);
      setCopiedRange(normalizedRange);
      setIsCutOperation(false);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  }, [enableExcelMode, allowClipboard, normalizedRange]);

  // Cut to Clipboard
  const handleCut = useCallback(async () => {
    if (!enableExcelMode || !allowClipboard || !normalizedRange) return;
    await handleCopy();
    setIsCutOperation(true);
  }, [enableExcelMode, allowClipboard, normalizedRange, handleCopy]);

  // Paste from Clipboard
  const handlePaste = useCallback(
    async (pastedText?: string, targetCoord?: CellCoord) => {
      if (!enableExcelMode || !allowClipboard) return;
      if (editingCellRef.current || editingCell) {
        commitEditing(undefined, 'stay');
      }

      let text = pastedText;
      if (!text) {
        try {
          text = await navigator.clipboard.readText();
        } catch (e) {
          console.error('Clipboard read failed:', e);
          return;
        }
      }

      if (!text) return;
      const matrix = parseTsv(text);
      if (matrix.length === 0 || matrix[0].length === 0) return;

      const target =
        targetCoord
          ? {
              minRow: targetCoord.rowIndex,
              maxRow: targetCoord.rowIndex,
              minCol: targetCoord.colIndex,
              maxCol: targetCoord.colIndex,
            }
          : normalizedRange ||
            (activeCell
              ? {
                  minRow: activeCell.rowIndex,
                  maxRow: activeCell.rowIndex,
                  minCol: activeCell.colIndex,
                  maxCol: activeCell.colIndex,
                }
              : dataRef.current.length > 0
              ? { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 }
              : null);
      if (!target) return;

      // Smart Header Detection: check if first row contains column headers
      const headerMapping = matrix.length > 1 ? detectHeaderMapping(matrix[0], activeColumnsRef.current) : null;
      const hasHeaderRow = headerMapping !== null;
      const effectiveMatrix = hasHeaderRow ? matrix.slice(1) : matrix;
      const clipRows = effectiveMatrix.length;
      if (clipRows === 0) return;
      const clipCols = matrix[0].length;
      const changes: CellChange<T>[] = [];

      // If cut operation, clear source cells first
      if (isCutOperation && copiedRange) {
        for (let r = copiedRange.minRow; r <= copiedRange.maxRow; r++) {
          const row = dataRef.current[r];
          if (!row) continue;
          for (let c = copiedRange.minCol; c <= copiedRange.maxCol; c++) {
            const col = activeColumnsRef.current[c];
            if (!col || !isCellEditable(col, row, isGridEditable)) continue;
            const oldVal = getCellValue(row, col);
            if (oldVal !== null && oldVal !== undefined && oldVal !== '') {
              changes.push({
                row,
                rowKey: keyExtractor(row, r),
                rowIndex: r,
                column: col,
                field: (col.accessorKey as string) || col.id,
                oldValue: oldVal,
                newValue: null,
              });
            }
          }
        }
        setIsCutOperation(false);
        setCopiedRange(null);
      }

      // Smart Paste Case 1: 1 cell copied into multiple selected cells (Fill all)
      if (
        !hasHeaderRow &&
        clipRows === 1 &&
        clipCols === 1 &&
        (target.maxRow > target.minRow || target.maxCol > target.minCol)
      ) {
        const singleVal = effectiveMatrix[0][0];
        for (let r = target.minRow; r <= target.maxRow; r++) {
          const row = dataRef.current[r];
          if (!row) continue;
          for (let c = target.minCol; c <= target.maxCol; c++) {
            const col = activeColumnsRef.current[c];
            if (!col || !isCellEditable(col, row, isGridEditable)) continue;

            const oldVal = getCellValue(row, col);
            const newVal = coerceValue(singleVal, col, oldVal, row);
            changes.push({
              row,
              rowKey: keyExtractor(row, r),
              rowIndex: r,
              column: col,
              field: (col.accessorKey as string) || col.id,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }
      } else if (hasHeaderRow && headerMapping) {
        // Smart Paste Case 2: Multi-cell matrix with Header mapping
        const neededRows = target.minRow + clipRows - dataRef.current.length;
        if (neededRows > 0 && onAutoAddRows) {
          const added = onAutoAddRows(neededRows);
          if (added && added.length > 0) {
            dataRef.current = [...dataRef.current, ...added];
          }
        }

        for (let r = 0; r < clipRows; r++) {
          const targetR = target.minRow + r;
          if (targetR >= dataRef.current.length) break;
          const row = dataRef.current[targetR];
          if (!row) continue;

          for (let c = 0; c < headerMapping.length; c++) {
            const targetColIndex = headerMapping[c];
            if (targetColIndex === null || targetColIndex === undefined) continue;
            if (targetColIndex >= activeColumnsRef.current.length) break;
            const col = activeColumnsRef.current[targetColIndex];
            if (!col || !isCellEditable(col, row, isGridEditable)) continue;

            const rawVal = effectiveMatrix[r][c];
            const oldVal = getCellValue(row, col);
            const newVal = coerceValue(rawVal, col, oldVal, row);
            changes.push({
              row,
              rowKey: keyExtractor(row, targetR),
              rowIndex: targetR,
              column: col,
              field: (col.accessorKey as string) || col.id,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }
      } else {
        // Smart Paste Case 3: Positional multi-cell matrix from Excel/Sheets
        const neededRows = target.minRow + clipRows - dataRef.current.length;
        if (neededRows > 0 && onAutoAddRows) {
          const added = onAutoAddRows(neededRows);
          if (added && added.length > 0) {
            dataRef.current = [...dataRef.current, ...added];
          }
        }

        for (let r = 0; r < clipRows; r++) {
          const targetR = target.minRow + r;
          if (targetR >= dataRef.current.length) break;
          const row = dataRef.current[targetR];
          if (!row) continue;

          for (let c = 0; c < clipCols; c++) {
            const targetC = target.minCol + c;
            if (targetC >= activeColumnsRef.current.length) break;
            const col = activeColumnsRef.current[targetC];
            if (!col || !isCellEditable(col, row, isGridEditable)) continue;

            const rawVal = effectiveMatrix[r][c];
            const oldVal = getCellValue(row, col);
            const newVal = coerceValue(rawVal, col, oldVal, row);
            changes.push({
              row,
              rowKey: keyExtractor(row, targetR),
              rowIndex: targetR,
              column: col,
              field: (col.accessorKey as string) || col.id,
              oldValue: oldVal,
              newValue: newVal,
            });
          }
        }
      }

      if (changes.length > 0) {
        applyCellChanges(changes, 'Dán dữ liệu (Paste)');
        const endRow = Math.min(dataRef.current.length - 1, target.minRow + clipRows - 1);
        const endCol = Math.min(activeColumnsRef.current.length - 1, target.minCol + clipCols - 1);
        setSelectionRange({
          startRow: target.minRow,
          startCol: target.minCol,
          endRow,
          endCol,
        });
      }
    },
    [
      enableExcelMode,
      allowClipboard,
      editingCell,
      normalizedRange,
      activeCell,
      isCutOperation,
      copiedRange,
      isGridEditable,
      keyExtractor,
      applyCellChanges,
      onAutoAddRows,
    ]
  );

  // Clear Values in Selection (Delete / Backspace)
  const handleClearValues = useCallback(() => {
    if (!enableExcelMode || !normalizedRange) return;
    const { minRow, maxRow, minCol, maxCol } = normalizedRange;
    const changes: CellChange<T>[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      const row = dataRef.current[r];
      if (!row) continue;
      for (let c = minCol; c <= maxCol; c++) {
        const col = activeColumnsRef.current[c];
        if (!col || !isCellEditable(col, row, isGridEditable)) continue;

        const oldVal = getCellValue(row, col);
        if (oldVal !== null && oldVal !== undefined && oldVal !== '') {
          changes.push({
            row,
            rowKey: keyExtractor(row, r),
            rowIndex: r,
            column: col,
            field: (col.accessorKey as string) || col.id,
            oldValue: oldVal,
            newValue: null,
          });
        }
      }
    }

    if (changes.length > 0) {
      applyCellChanges(changes, 'Xóa giá trị (Clear)');
    }
  }, [enableExcelMode, normalizedRange, isGridEditable, keyExtractor, applyCellChanges]);

  // Master KeyDown Handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enableExcelMode) return;

      // When editing cell, let editor handle keys
      if (editingCell) return;

      const maxRow = dataRef.current.length - 1;
      const maxCol = activeColumnsRef.current.length - 1;

      // Cut: Ctrl+X / Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
        return;
      }

      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Select All: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (maxRow >= 0 && maxCol >= 0) {
          setActiveCell({ rowIndex: 0, colIndex: 0 });
          setSelectionRange({
            startRow: 0,
            startCol: 0,
            endRow: maxRow,
            endCol: maxCol,
          });
        }
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Jump to Top-Left: Ctrl+Home
      if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
        e.preventDefault();
        if (maxRow >= 0 && maxCol >= 0) {
          navigateToCell({ rowIndex: 0, colIndex: 0 });
        }
        return;
      }

      // Jump to Bottom-Right: Ctrl+End
      if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
        e.preventDefault();
        if (maxRow >= 0 && maxCol >= 0) {
          navigateToCell({ rowIndex: maxRow, colIndex: maxCol });
        }
        return;
      }

      // Home: Jump to first column of current row
      if (e.key === 'Home' && activeCell) {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectionRange({
            startRow: selectionRange ? selectionRange.startRow : activeCell.rowIndex,
            startCol: activeCell.colIndex,
            endRow: selectionRange ? selectionRange.endRow : activeCell.rowIndex,
            endCol: 0,
          });
        } else {
          navigateToCell({ rowIndex: activeCell.rowIndex, colIndex: 0 });
        }
        return;
      }

      // End: Jump to last column of current row
      if (e.key === 'End' && activeCell) {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectionRange({
            startRow: selectionRange ? selectionRange.startRow : activeCell.rowIndex,
            startCol: activeCell.colIndex,
            endRow: selectionRange ? selectionRange.endRow : activeCell.rowIndex,
            endCol: maxCol,
          });
        } else {
          navigateToCell({ rowIndex: activeCell.rowIndex, colIndex: maxCol });
        }
        return;
      }

      // Escape: clear copied range / selection
      if (e.key === 'Escape') {
        e.preventDefault();
        if (copiedRange) {
          setCopiedRange(null);
          setIsCutOperation(false);
        } else {
          clearSelection();
        }
        return;
      }

      // Delete or Backspace: clear cell contents
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleClearValues();
        return;
      }

      // Enter / Space / Alt+Down: Start editing or open dropdown
      if (e.key === 'Enter' || e.key === ' ' || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        if (activeCell) {
          startEditing(activeCell);
        }
        return;
      }

      // F2: Excel shortcut to start editing
      if (e.key === 'F2') {
        e.preventDefault();
        if (activeCell) {
          startEditing(activeCell);
        }
        return;
      }

      // Alphanumeric keys & Vietnamese IME: start editing directly with typed character (Excel style - no lost keystrokes!)
      if (
        (e.key.length === 1 || e.key === 'Process' || (e.nativeEvent as any)?.isComposing) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        activeCell
      ) {
        const row = dataRef.current[activeCell.rowIndex];
        const col = activeColumnsRef.current[activeCell.colIndex];
        if (row && col && isCellEditable(col, row, isGridEditable)) {
          startEditing(activeCell, e.key === 'Process' ? undefined : e.key);
          return;
        }
      }

      // Navigation: Arrow Keys, Tab
      if (!activeCell) return;
      const { rowIndex, colIndex } = activeCell;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) {
          const currentEndRow = selectionRange ? selectionRange.endRow : rowIndex;
          const nextEndRow = Math.max(0, currentEndRow - 1);
          setSelectionRange({
            startRow: activeCell.rowIndex,
            startCol: selectionRange ? selectionRange.startCol : colIndex,
            endRow: nextEndRow,
            endCol: selectionRange ? selectionRange.endCol : colIndex,
          });
        } else if (rowIndex > 0) {
          const next = { rowIndex: rowIndex - 1, colIndex };
          setActiveCell(next);
          setSelectionRange({ startRow: next.rowIndex, startCol: next.colIndex, endRow: next.rowIndex, endCol: next.colIndex });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          const currentEndRow = selectionRange ? selectionRange.endRow : rowIndex;
          const nextEndRow = Math.min(maxRow, currentEndRow + 1);
          setSelectionRange({
            startRow: activeCell.rowIndex,
            startCol: selectionRange ? selectionRange.startCol : colIndex,
            endRow: nextEndRow,
            endCol: selectionRange ? selectionRange.endCol : colIndex,
          });
        } else if (rowIndex < maxRow) {
          const next = { rowIndex: rowIndex + 1, colIndex };
          setActiveCell(next);
          setSelectionRange({ startRow: next.rowIndex, startCol: next.colIndex, endRow: next.rowIndex, endCol: next.colIndex });
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          const currentEndCol = selectionRange ? selectionRange.endCol : colIndex;
          const nextEndCol = Math.max(0, currentEndCol - 1);
          setSelectionRange({
            startRow: selectionRange ? selectionRange.startRow : rowIndex,
            startCol: activeCell.colIndex,
            endRow: selectionRange ? selectionRange.endRow : rowIndex,
            endCol: nextEndCol,
          });
        } else if (colIndex > 0) {
          const next = { rowIndex, colIndex: colIndex - 1 };
          setActiveCell(next);
          setSelectionRange({ startRow: next.rowIndex, startCol: next.colIndex, endRow: next.rowIndex, endCol: next.colIndex });
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          const currentEndCol = selectionRange ? selectionRange.endCol : colIndex;
          const nextEndCol = Math.min(maxCol, currentEndCol + 1);
          setSelectionRange({
            startRow: selectionRange ? selectionRange.startRow : rowIndex,
            startCol: activeCell.colIndex,
            endRow: selectionRange ? selectionRange.endRow : rowIndex,
            endCol: nextEndCol,
          });
        } else if (colIndex < maxCol) {
          const next = { rowIndex, colIndex: colIndex + 1 };
          setActiveCell(next);
          setSelectionRange({ startRow: next.rowIndex, startCol: next.colIndex, endRow: next.rowIndex, endCol: next.colIndex });
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        let next: CellCoord | null = null;
        if (e.shiftKey) {
          if (colIndex > 0) {
            next = { rowIndex, colIndex: colIndex - 1 };
          } else if (rowIndex > 0) {
            next = { rowIndex: rowIndex - 1, colIndex: maxCol };
          }
        } else {
          if (colIndex < maxCol) {
            next = { rowIndex, colIndex: colIndex + 1 };
          } else if (rowIndex < maxRow) {
            next = { rowIndex: rowIndex + 1, colIndex: 0 };
          }
        }
        if (next) {
          setActiveCell(next);
          setSelectionRange({ startRow: next.rowIndex, startCol: next.colIndex, endRow: next.rowIndex, endCol: next.colIndex });
          if (editOnSingleClick) {
            const nextCol = activeColumnsRef.current[next.colIndex];
            const isSelect = nextCol && (nextCol.editorType === 'select' || !!nextCol.editorOptions);
            if (!isSelect) {
              startEditing(next);
            }
          }
        }
        return;
      }
    },
    [
      enableExcelMode,
      editingCell,
      handleCut,
      handleCopy,
      handlePaste,
      undo,
      redo,
      copiedRange,
      clearSelection,
      handleClearValues,
      activeCell,
      startEditing,
      isGridEditable,
      selectionRange,
      navigateToCell,
    ]
  );

  // Status statistics for range (Sum, Average, Count, Min, Max)
  const rangeStats = useMemo(() => {
    if (!normalizedRange) return null;
    const { minRow, maxRow, minCol, maxCol } = normalizedRange;
    const totalCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (totalCells <= 1) return null;

    let numericCount = 0;
    let nonEmptyCount = 0;
    let sum = 0;
    let min: number | null = null;
    let max: number | null = null;

    for (let r = minRow; r <= maxRow; r++) {
      const row = dataRef.current[r];
      if (!row) continue;
      for (let c = minCol; c <= maxCol; c++) {
        const col = activeColumnsRef.current[c];
        if (!col) continue;
        const val = getCellValue(row, col);

        if (val !== null && val !== undefined && val !== '') {
          nonEmptyCount++;
        }

        if (typeof val === 'number') {
          numericCount++;
          sum += val;
          min = min === null ? val : Math.min(min, val);
          max = max === null ? val : Math.max(max, val);
        } else if (val !== null && val !== undefined && val !== '' && !isNaN(Number(val))) {
          const num = Number(val);
          numericCount++;
          sum += num;
          min = min === null ? num : Math.min(min, num);
          max = max === null ? num : Math.max(max, num);
        }
      }
    }

    return {
      totalCells,
      nonEmptyCount,
      numericCount,
      sum: numericCount > 0 ? sum : null,
      average: numericCount > 0 ? +(sum / numericCount).toFixed(2) : null,
      min,
      max,
    };
  }, [normalizedRange]);

  // Visual helper: returns Excel CSS classes for a given cell coordinate
  const getExcelCellClasses = useCallback(
    (rowIndex: number, colIndex: number): string => {
      if (!enableExcelMode) return '';

      const isActive =
        activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;
      const inSelection = isCellInRange(rowIndex, colIndex, normalizedRange);
      const inFillPreview = isCellInRange(rowIndex, colIndex, fillPreviewRange);
      const inCopied = isCellInRange(rowIndex, colIndex, copiedRange);

      let classes = '';

      const isRangeSelection =
        Boolean(normalizedRange) &&
        (normalizedRange!.maxRow > normalizedRange!.minRow ||
          normalizedRange!.maxCol > normalizedRange!.minCol);

      if (inSelection && isRangeSelection) {
        if (isActive && !editingCell) {
          classes += ' !bg-emerald-500/10 dark:!bg-emerald-500/15';
        } else {
          classes += ' !bg-emerald-500/20 dark:!bg-emerald-500/30 text-emerald-950 dark:text-emerald-50 font-medium';
        }
        const borders = getCellBorderPlacement(rowIndex, colIndex, normalizedRange);
        if (borders.isTop) classes += ' !border-t-2 !border-t-emerald-600 dark:!border-t-emerald-400';
        if (borders.isBottom) classes += ' !border-b-2 !border-b-emerald-600 dark:!border-b-emerald-400';
        if (borders.isLeft) classes += ' !border-l-2 !border-l-emerald-600 dark:!border-l-emerald-400';
        if (borders.isRight) classes += ' !border-r-2 !border-r-emerald-600 dark:!border-r-emerald-400';
      }

      if (inFillPreview) {
        classes += ' !bg-emerald-600/30 dark:!bg-emerald-500/40';
        const borders = getCellBorderPlacement(rowIndex, colIndex, fillPreviewRange);
        if (borders.isTop) classes += ' !border-t-2 !border-dashed !border-t-emerald-600 dark:!border-t-emerald-400';
        if (borders.isBottom) classes += ' !border-b-2 !border-dashed !border-b-emerald-600 dark:!border-b-emerald-400';
        if (borders.isLeft) classes += ' !border-l-2 !border-dashed !border-l-emerald-600 dark:!border-l-emerald-400';
        if (borders.isRight) classes += ' !border-r-2 !border-dashed !border-r-emerald-600 dark:!border-r-emerald-400';
      }

      if (inCopied) {
        const borders = getCellBorderPlacement(rowIndex, colIndex, copiedRange);
        if (borders.isTop) classes += ' !border-t-2 !border-dashed !border-t-emerald-600 dark:!border-t-emerald-400 animate-pulse';
        if (borders.isBottom) classes += ' !border-b-2 !border-dashed !border-b-emerald-600 dark:!border-b-emerald-400 animate-pulse';
        if (borders.isLeft) classes += ' !border-l-2 !border-dashed !border-l-emerald-600 dark:!border-l-emerald-400 animate-pulse';
        if (borders.isRight) classes += ' !border-r-2 !border-dashed !border-r-emerald-600 dark:!border-r-emerald-400 animate-pulse';
      }

      if (isActive && !editingCell) {
        classes += ' ring-2 ring-inset ring-emerald-600 dark:ring-emerald-400 z-20';
      }

      return classes;
    },
    [
      enableExcelMode,
      activeCell,
      normalizedRange,
      fillPreviewRange,
      copiedRange,
      editingCell,
    ]
  );

  return {
    activeCell,
    selectionRange,
    normalizedRange,
    isSelecting,
    copiedRange,
    isCutOperation,
    fillHandleDrag,
    fillPreviewRange,
    editingCell,
    editingInitialValue,
    isGridEditable,
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    rangeStats,
    handleCellMouseDown,
    handleCellClick,
    handleCellMouseEnter,
    handleRowHeaderClick,
    handleColHeaderClick,
    handleFillHandleMouseDown,
    handleKeyDown,
    handleCut,
    handleCopy,
    handlePaste,
    handleClearValues,
    startEditing,
    commitEditing,
    commitCurrentEditor,
    cancelEditing,
    handleEditorValueChange,
    navigateToCell,
    handleReplaceCell,
    handleReplaceAll,
    undo,
    redo,
    clearSelection,
    getExcelCellClasses,
  };
}

