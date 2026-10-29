import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { DataGridColumn } from './types';
import type { SelectOption } from './excelTypes';
import { getSelectOptions } from './excelUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Check, ChevronDown, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addDays,
} from 'date-fns';

interface Props<T = any> {
  row: T;
  column: DataGridColumn<T>;
  initialValue: any;
  onChange?: (val: any, selectedOption?: SelectOption) => void;
  onCommit: (
    newValue: any,
    nextAction?: 'stay' | 'down' | 'up' | 'left' | 'right',
    selectedOption?: SelectOption
  ) => void;
  onCancel: () => void;
  onPasteMatrix?: (clipboardText: string) => void;
}

export function ExcelCellEditor<T = any>({
  row,
  column,
  initialValue,
  onChange,
  onCommit,
  onCancel,
  onPasteMatrix,
}: Props<T>) {
  const editorValRef = useRef(initialValue);

  // If column has custom editor function
  if (column.editor) {
    return (
      <div
        className="absolute inset-0 z-40 bg-white dark:bg-slate-900 flex items-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {column.editor({
          row,
          column,
          value: initialValue,
          onChange: (v) => {
            editorValRef.current = v;
            onChange?.(v);
          },
          onCommit: (action) => onCommit(editorValRef.current, action),
          onCancel,
          autoFocus: true,
        })}
      </div>
    );
  }

  // If column is select / combobox / dropdown
  const selectOptions = getSelectOptions(column, row);
  if (column.editorType === 'select' || selectOptions.length > 0) {
    return (
      <SmartComboboxCellEditor
        row={row}
        column={column}
        options={selectOptions}
        initialValue={initialValue}
        onChange={onChange}
        onCommit={onCommit}
        onCancel={onCancel}
        onPasteMatrix={onPasteMatrix}
      />
    );
  }

  // If column is boolean
  if (column.editorType === 'boolean') {
    return (
      <BooleanCellEditor
        initialValue={initialValue}
        onChange={onChange}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
  }

  // If column is date
  if (column.editorType === 'date') {
    return (
      <DateCellEditor
        row={row}
        column={column}
        initialValue={initialValue}
        onChange={onChange}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    );
  }

  // Standard text / number editor
  return (
    <StandardCellEditor
      column={column}
      initialValue={initialValue}
      onChange={onChange}
      onCommit={onCommit}
      onCancel={onCancel}
      onPasteMatrix={onPasteMatrix}
    />
  );
}

/**
 * Modern Smart Combobox Cell Editor with Search, Keyboard Navigation, and Instant Commit
 */
function SmartComboboxCellEditor<T = any>({
  row,
  column,
  options,
  initialValue,
  onChange,
  onCommit,
  onCancel,
  onPasteMatrix,
}: {
  row: T;
  column: DataGridColumn<T>;
  options: SelectOption[];
  initialValue: any;
  onChange?: (val: any, selectedOption?: SelectOption) => void;
  onCommit: (newValue: any, nextAction?: any, selectedOption?: SelectOption) => void;
  onCancel: () => void;
  onPasteMatrix?: (clipboardText: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const isCommittedRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const currentOption = useMemo(() => {
    return options.find(
      (opt) =>
        opt.value === initialValue ||
        String(opt.value) === String(initialValue) ||
        opt.label === initialValue ||
        (row && column.valueKey && opt.value === (row as any)[column.valueKey])
    );
  }, [options, initialValue, row, column]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        String(opt.value).toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, search]);

  // Enable mouse wheel scrolling inside dropdown list even when rendered in modals / sheets with scroll locks
  useEffect(() => {
    const el = listRef.current;
    const popoverEl = popoverContentRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (el.scrollHeight > el.clientHeight) {
        e.preventDefault();
        el.scrollTop += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    popoverEl?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      popoverEl?.removeEventListener('wheel', handleWheel);
    };
  }, [open, filteredOptions]);

  // Initialize highlight index to currentOption if not searching
  useEffect(() => {
    if (!search.trim() && currentOption) {
      const idx = filteredOptions.findIndex((opt) => opt.value === currentOption.value);
      setHighlightIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightIndex(0);
    }
  }, [filteredOptions, search, currentOption]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option-item]');
      const activeEl = items[highlightIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const handleSelectOption = (opt: SelectOption) => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    setOpen(false);
    onChange?.(opt.value, opt);
    onCommit(opt.value, 'stay', opt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredOptions.length > 0 && filteredOptions[highlightIndex]) {
        handleSelectOption(filteredOptions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      // If user typed a search query and picked an item, commit that; otherwise preserve existing value
      const valToCommit = search.trim() && filteredOptions[highlightIndex]
        ? filteredOptions[highlightIndex].value
        : (currentOption ? currentOption.value : initialValue);
      const optToCommit = search.trim() && filteredOptions[highlightIndex]
        ? filteredOptions[highlightIndex]
        : currentOption;
      onCommit(valToCommit, e.shiftKey ? 'left' : 'right', optToCommit);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && !isCommittedRef.current) {
          onCancel();
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="absolute inset-0 z-40 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-sky-500 shadow-md flex items-center justify-between px-2 cursor-pointer select-none rounded-sm"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">
            {currentOption ? currentOption.label : initialValue || '— Chọn —'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 ml-1" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        ref={popoverContentRef}
        align="start"
        sideOffset={2}
        className="w-64 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50 animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDown}
        onWheel={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => {
          if (isCommittedRef.current) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (!isCommittedRef.current) {
            onCancel();
          }
        }}
      >
        {/* Search input if more than 4 options */}
        {options.length > 4 && (
          <div className="relative mb-1.5">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text/plain');
                if (onPasteMatrix && (text.includes('\n') || text.includes('\r') || text.includes('\t'))) {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onPasteMatrix(text);
                }
              }}
              className="w-full h-7 pl-7 pr-6 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        <div
          ref={listRef}
          className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
        >
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Không tìm thấy lựa chọn nào
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected =
                opt.value === initialValue ||
                String(opt.value) === String(initialValue) ||
                opt.label === initialValue ||
                (row && column.valueKey && opt.value === (row as any)[column.valueKey]);
              const isHighlighted = index === highlightIndex;

              return (
                <div
                  key={String(opt.value)}
                  data-option-item
                  role="option"
                  tabIndex={-1}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(e) => {
                    // Prevent blur from closing before selection is recorded
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOption(opt);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOption(opt);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                      : isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-slate-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.color && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    {opt.badgeClass ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${opt.badgeClass}`}>
                        {opt.label}
                      </span>
                    ) : (
                      <div className="min-w-0">
                        <span className="truncate block">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-muted-foreground truncate block">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 ml-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Boolean Checkbox Cell Editor
 */
function BooleanCellEditor({
  initialValue,
  onChange,
  onCommit,
  onCancel,
}: {
  initialValue: any;
  onChange?: (val: any) => void;
  onCommit: (newValue: any, nextAction?: any) => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(Boolean(initialValue));
  const isCommittedRef = useRef(false);

  const commitValue = (next: boolean, nextAction: any = 'stay') => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    onCommit(next, nextAction);
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-sky-500 shadow-md flex items-center justify-center p-1 rounded-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        autoFocus
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          onChange?.(next);
          commitValue(next, 'stay');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitValue(checked, 'down');
          } else if (e.key === 'Escape') {
            e.preventDefault();
            if (!isCommittedRef.current) {
              isCommittedRef.current = true;
              onCancel();
            }
          }
        }}
        onBlur={() => commitValue(checked, 'stay')}
        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
      />
    </div>
  );
}

/**
 * Helper to parse any date input to valid Date
 */
function parseDateCell(str: any): Date | null {
  if (!str) return null;
  if (str instanceof Date) return isValid(str) ? str : null;
  const s = String(str).trim();
  if (!s || s.startsWith('0000-') || s.startsWith('0001-01-01')) return null;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (isValid(d) && d.getDate() === day && d.getMonth() === month) return d;
  }

  // YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(year, month, day);
    if (isValid(d) && d.getDate() === day && d.getMonth() === month) return d;
  }

  const fallback = new Date(s);
  return isValid(fallback) ? fallback : null;
}

/**
 * Modern Interactive Date Picker Cell Editor with Calendar, Quick Presets, and Direct Typing
 */
function DateCellEditor<T = any>({
  column,
  initialValue,
  onChange,
  onCommit,
  onCancel,
}: {
  row: T;
  column: DataGridColumn<T>;
  initialValue: any;
  onChange?: (val: any) => void;
  onCommit: (newValue: any, nextAction?: any) => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(true);
  const isCommittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => parseDateCell(initialValue), [initialValue]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => initialDate);
  const [viewDate, setViewDate] = useState<Date>(() => initialDate || new Date());
  const [textValue, setTextValue] = useState<string>(() => {
    if (initialDate && isValid(initialDate)) {
      return format(initialDate, 'dd/MM/yyyy');
    }
    return initialValue ? String(initialValue) : '';
  });

  const commitDate = (date: Date | null, nextAction: 'stay' | 'down' | 'up' | 'left' | 'right' = 'stay') => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    setOpen(false);

    let resultVal: any = '';
    if (date && isValid(date)) {
      const iso = format(date, 'yyyy-MM-dd');
      resultVal = column.parseValue ? column.parseValue(iso) : iso;
    }

    onChange?.(resultVal);
    onCommit(resultVal, nextAction);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    setViewDate(day);
    commitDate(day, 'stay');
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'clear') => {
    if (preset === 'clear') {
      setSelectedDate(null);
      commitDate(null, 'stay');
      return;
    }
    const target = preset === 'today' ? new Date() : addDays(new Date(), 1);
    setSelectedDate(target);
    setViewDate(target);
    commitDate(target, 'stay');
  };

  // Calendar days grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const parsed = parseDateCell(textValue);
      commitDate(parsed, e.shiftKey ? 'up' : 'down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const parsed = parseDateCell(textValue);
      commitDate(parsed, e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      onCancel();
    }
  };

  // Prevent scroll lock interference
  useEffect(() => {
    const popoverEl = popoverContentRef.current;
    if (!popoverEl) return;
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    popoverEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      popoverEl.removeEventListener('wheel', handleWheel);
    };
  }, [open]);

  const monthYearLabel = useMemo(() => {
    const m = viewDate.getMonth() + 1;
    const y = viewDate.getFullYear();
    return `Tháng ${m}, ${y}`;
  }, [viewDate]);

  const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && !isCommittedRef.current) {
          const parsed = parseDateCell(textValue);
          if (parsed) {
            commitDate(parsed, 'stay');
          } else {
            onCancel();
          }
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="absolute inset-0 z-40 bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-sky-500 shadow-md flex items-center justify-between px-2 cursor-pointer select-none rounded-sm"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="dd/mm/yyyy"
            value={textValue}
            onChange={(e) => {
              setTextValue(e.target.value);
              const p = parseDateCell(e.target.value);
              if (p) {
                setSelectedDate(p);
                setViewDate(p);
              }
            }}
            onKeyDown={handleKeyDown}
            className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 font-mono outline-none border-none p-0"
          />
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 ml-1 pointer-events-none" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        ref={popoverContentRef}
        align="start"
        sideOffset={4}
        className="w-68 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50 animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleKeyDown}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Calendar Header with Month/Year and Navigation */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 pl-1">
            {monthYearLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewDate((prev) => subMonths(prev, 1));
              }}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewDate((prev) => addMonths(prev, 1));
              }}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-[10px] font-bold text-slate-400 uppercase py-0.5">
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((day, idx) => {
            const isCurrMonth = isSameMonth(day, viewDate);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isTodayDay = isToday(day);

            return (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectDay(day);
                }}
                className={`h-7 w-7 rounded-md text-xs font-medium transition-all flex items-center justify-center mx-auto cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isTodayDay
                    ? 'border border-blue-500 text-blue-600 dark:text-sky-400 font-bold'
                    : isCurrMonth
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Quick presets footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 text-[11px]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickPreset('today');
            }}
            className="text-blue-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickPreset('tomorrow');
            }}
            className="text-slate-600 dark:text-slate-300 font-medium hover:underline cursor-pointer"
          >
            Ngày mai
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickPreset('clear');
            }}
            className="text-rose-500 font-medium hover:underline cursor-pointer"
          >
            Xóa ngày
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Standard Text / Number / Date Cell Editor
 */
function StandardCellEditor<T = any>({
  column,
  initialValue,
  onChange,
  onCommit,
  onCancel,
  onPasteMatrix,
}: {
  column: DataGridColumn<T>;
  initialValue: any;
  onChange?: (val: any) => void;
  onCommit: (newValue: any, nextAction?: any) => void;
  onCancel: () => void;
  onPasteMatrix?: (clipboardText: string) => void;
}) {
  const isNumber = column.editorType === 'number';
  const isDate = column.editorType === 'date';

  const [value, setValue] = useState<any>(() => {
    if (initialValue === null || initialValue === undefined) return '';
    if (isDate) {
      if (column.formatValue) {
        return column.formatValue(initialValue);
      }
      const str = String(initialValue).trim();
      const dmy = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
      if (dmy) {
        return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
      }
      const ymd = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
      if (ymd) {
        return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1]}`;
      }
    }
    return initialValue;
  });

  const valueRef = useRef(value);
  valueRef.current = value;
  const isCommittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitValue = useCallback(
    (nextAction: 'stay' | 'down' | 'up' | 'left' | 'right' = 'stay') => {
      if (isCommittedRef.current) return;
      isCommittedRef.current = true;
      onCommit(valueRef.current, nextAction);
    },
    [onCommit]
  );

  const cancelEdit = useCallback(() => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    };
    focusInput();
    const frameId = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      const el = e.currentTarget as HTMLInputElement;
      const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
      if (atEnd || !el.value) {
        e.preventDefault();
        e.stopPropagation();
        commitValue('right');
        return;
      }
      e.stopPropagation();
      return;
    }

    if (e.key === 'ArrowLeft') {
      const el = e.currentTarget as HTMLInputElement;
      const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
      if (atStart || !el.value) {
        e.preventDefault();
        e.stopPropagation();
        commitValue('left');
        return;
      }
      e.stopPropagation();
      return;
    }

    if (e.key === 'Home' || e.key === 'End') {
      e.stopPropagation();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      commitValue('up');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      commitValue('down');
      return;
    }

    if (e.key === 'Enter') {
      if ((e.nativeEvent as any).isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      commitValue(e.shiftKey ? 'up' : 'down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      commitValue(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (onPasteMatrix && (text.includes('\n') || text.includes('\r') || text.includes('\t'))) {
      e.preventDefault();
      e.stopPropagation();
      onPasteMatrix(text);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-white dark:bg-slate-900 flex items-center p-0 shadow-md ring-2 ring-blue-600 dark:ring-sky-500 rounded-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        autoFocus
        type="text"
        inputMode={isNumber ? 'numeric' : undefined}
        placeholder={isDate ? 'dd/mm/yyyy' : isNumber ? '0' : ''}
        value={value ?? ''}
        onChange={(e) => {
          valueRef.current = e.target.value;
          setValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => commitValue('stay')}
        className={`w-full h-full text-xs px-2 bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none font-sans ${
          isNumber ? 'text-right font-mono' : isDate ? 'font-mono' : ''
        }`}
      />
      {isDate && (
        <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0 pointer-events-none" />
      )}
    </div>
  );
}
