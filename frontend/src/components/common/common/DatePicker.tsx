import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  format,
  parseISO,
  isValid,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isBefore,
  isAfter,
  startOfDay,
  addDays,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string | Date | null;
  onChange?: (val: string, event?: React.ChangeEvent<HTMLInputElement>) => void;
  showTime?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  isClearable?: boolean;
  minDate?: string | Date;
  maxDate?: string | Date;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  align?: 'start' | 'center' | 'end';
  triggerContent?: React.ReactNode;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const COMMON_TIMES = ['08:00', '09:00', '10:00', '11:30', '13:30', '15:00', '17:00', '18:00'];

// Parse incoming value or typed string into a valid Date in local time
export function parseValueToDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isValid(val) ? val : null;
  
  const rawStr = String(val).trim();
  if (!rawStr || rawStr.startsWith('0000-') || rawStr.startsWith('0001-01-01')) return null;

  // 0. Chuỗi ISO chứa timezone 'Z' hoặc offset '+07:00' (ví dụ từ backend / toISOString)
  // PHẢI được parse theo timezone để quy đổi chính xác ra ngày local của người dùng
  if (rawStr.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(rawStr)) {
    const parsedIso = parseISO(rawStr);
    if (isValid(parsedIso) && parsedIso.getFullYear() > 1900) return parsedIso;
    const standardDate = new Date(rawStr);
    if (isValid(standardDate) && standardDate.getFullYear() > 1900) return standardDate;
  }

  // 1. Format DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional HH:mm)
  const dmyMatch = rawStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[T ](\d{1,2}):(\d{2}))?/);

  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    if (month >= 0 && month < 12 && day >= 1 && day <= 31 && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      const d = new Date(year, month, day, hour, minute);
      if (isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }

  // 2. 8-digit DDMMYYYY (e.g. 15102026)
  const eightDigitsMatch = rawStr.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (eightDigitsMatch) {
    const day = parseInt(eightDigitsMatch[1], 10);
    const month = parseInt(eightDigitsMatch[2], 10) - 1;
    const year = parseInt(eightDigitsMatch[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }

  // 3. Format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const ymdMatch = rawStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    if (month >= 0 && month < 12 && day >= 1 && day <= 31 && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      const d = new Date(year, month, day, hour, minute);
      if (isValid(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }

  // 4. Fallback parseISO or standard new Date
  const parsedIso = parseISO(rawStr);
  if (isValid(parsedIso)) return parsedIso;

  const standardDate = new Date(rawStr);
  if (isValid(standardDate)) return standardDate;

  return null;
}

export function formatDateForDisplay(d: Date | null | undefined, showTime = false): string {
  if (!d || !isValid(d)) return '';
  try {
    return showTime ? format(d, 'dd/MM/yyyy HH:mm', { locale: vi }) : format(d, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return '';
  }
}

export function DatePicker({
  value,
  onChange,
  showTime = false,
  placeholder,
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  isClearable = true,
  minDate,
  maxDate,
  className = '',
  containerClassName = 'w-full',
  size = 'md',
  id,
  name,
  align = 'start',
  triggerContent,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsedDate = useMemo(() => parseValueToDate(value), [value]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parsedDate);

  // Text inside the editable input
  const [inputValue, setInputValue] = useState<string>(() => formatDateForDisplay(parsedDate, showTime));
  const isFocusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  // Current view date in calendar
  const [viewDate, setViewDate] = useState<Date>(() => parsedDate || new Date());
  // Mode for quick picker in header: 'calendar' | 'months' | 'years'
  const [viewMode, setViewMode] = useState<'calendar' | 'months' | 'years'>('calendar');

  // Time state for showTime mode
  const [selectedHour, setSelectedHour] = useState<number>(() => (parsedDate ? getHours(parsedDate) : 9));
  const [selectedMinute, setSelectedMinute] = useState<number>(() => (parsedDate ? getMinutes(parsedDate) : 0));

  // Sync internal state when external value changes
  useEffect(() => {
    setSelectedDate(parsedDate);
    if (!isFocusedRef.current) {
      setInputValue(formatDateForDisplay(parsedDate, showTime));
    }
    if (parsedDate) {
      setViewDate(parsedDate);
      setSelectedHour(getHours(parsedDate));
      setSelectedMinute(getMinutes(parsedDate));
    }
  }, [parsedDate, showTime]);

  const minParsed = useMemo(() => parseValueToDate(minDate), [minDate]);
  const maxParsed = useMemo(() => parseValueToDate(maxDate), [maxDate]);

  // Generate days in calendar month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    // Start of week: Monday (weekStartsOn: 1)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  // Format value to return to parent: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const emitChange = (newDate: Date | null) => {
    if (!onChange) return;
    let formattedStr = '';
    if (newDate && isValid(newDate)) {
      if (showTime) {
        formattedStr = format(newDate, "yyyy-MM-dd'T'HH:mm");
      } else {
        formattedStr = format(newDate, 'yyyy-MM-dd');
      }
    }

    const syntheticEvent = {
      target: { value: formattedStr, name: name || '' },
      currentTarget: { value: formattedStr, name: name || '' },
      value: formattedStr,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    onChange(formattedStr, syntheticEvent);
  };

  const isDayDisabled = (day: Date) => {
    const dayStart = startOfDay(day);
    if (minParsed && isBefore(dayStart, startOfDay(minParsed))) return true;
    if (maxParsed && isAfter(dayStart, startOfDay(maxParsed))) return true;
    return false;
  };

  const handleSelectDay = (day: Date) => {
    let finalDate = day;
    if (showTime) {
      finalDate = setHours(setMinutes(day, selectedMinute), selectedHour);
      setSelectedDate(finalDate);
      setViewDate(finalDate);
      setInputValue(formatDateForDisplay(finalDate, true));
      emitChange(finalDate);
    } else {
      setSelectedDate(finalDate);
      setViewDate(finalDate);
      setInputValue(formatDateForDisplay(finalDate, false));
      emitChange(finalDate);
      setOpen(false);
    }
  };

  const handleApplyTime = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const baseDate = selectedDate || parsedDate || viewDate || new Date();
    const updated = setHours(setMinutes(baseDate, minute), hour);
    setSelectedDate(updated);
    setInputValue(formatDateForDisplay(updated, true));
    emitChange(updated);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedDate(null);
    setInputValue('');
    emitChange(null);
  };

  const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek' | 'now') => {
    const now = new Date();
    let target = now;
    if (preset === 'tomorrow') target = addDays(now, 1);
    if (preset === 'nextWeek') target = addDays(now, 7);

    if (showTime) {
      if (preset === 'now') {
        setSelectedHour(getHours(now));
        setSelectedMinute(getMinutes(now));
        target = now;
      } else {
        target = setHours(setMinutes(target, selectedMinute), selectedHour);
      }
      setSelectedDate(target);
      setViewDate(target);
      setInputValue(formatDateForDisplay(target, true));
      emitChange(target);
    } else {
      setSelectedDate(target);
      setViewDate(target);
      setInputValue(formatDateForDisplay(target, false));
      emitChange(target);
      setOpen(false);
    }
  };

  // Commit text input to state & parent
  const commitInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setSelectedDate(null);
      setInputValue('');
      emitChange(null);
      return;
    }

    const p = parseValueToDate(trimmed);
    if (p && isValid(p) && !isDayDisabled(p)) {
      setSelectedDate(p);
      setViewDate(p);
      setInputValue(formatDateForDisplay(p, showTime));
      emitChange(p);
    } else {
      // Revert to previously valid date or clear
      if (selectedDate && isValid(selectedDate)) {
        setInputValue(formatDateForDisplay(selectedDate, showTime));
      } else {
        setInputValue('');
        emitChange(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    const trimmed = newVal.trim();
    if (!trimmed) {
      setSelectedDate(null);
      emitChange(null);
      return;
    }

    // Check if input forms a complete date pattern
    const isComplete =
      /^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(trimmed) ||
      /^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(trimmed) ||
      /^\d{8}$/.test(trimmed);

    if (isComplete) {
      const p = parseValueToDate(trimmed);
      if (p && isValid(p) && !isDayDisabled(p)) {
        setSelectedDate(p);
        setViewDate(p);
        emitChange(p);
      }
    }
  };

  const handleInputFocus = () => {
    isFocusedRef.current = true;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    // If moving focus to an element inside the popover (e.g. clicking calendar nav), don't commit/revert yet
    if (
      popoverContentRef.current &&
      e.relatedTarget &&
      popoverContentRef.current.contains(e.relatedTarget as Node)
    ) {
      return;
    }
    commitInput();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if ((e.key === 'ArrowDown' && e.altKey) || (e.key === 'ArrowDown' && !open)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleInputClick = () => {
    if (!open && !disabled) {
      setOpen(true);
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs rounded-md',
    md: 'h-9 px-2.5 text-xs sm:text-sm rounded-lg',
    lg: 'h-11 px-3 text-sm sm:text-base rounded-xl',
  }[size];

  // Year range for quick year selection
  const currentYear = viewDate.getFullYear();
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 7; y <= currentYear + 7; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  return (
    <div className={cn('relative', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        {triggerContent ? (
          <PopoverPrimitive.Trigger asChild disabled={disabled}>
            <button
              type="button"
              id={id}
              disabled={disabled}
              className={className}
            >
              {triggerContent}
            </button>
          </PopoverPrimitive.Trigger>
        ) : (
          <PopoverPrimitive.Anchor asChild>
            <div
              className={cn(
                'group relative flex items-center w-full transition-all outline-none',
                'bg-white dark:bg-slate-800/90 hover:bg-slate-50/80 dark:hover:bg-slate-800',
                'border text-slate-800 dark:text-slate-100 shadow-2xs',
                error
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : open
                  ? 'border-blue-500 dark:border-sky-400 ring-2 ring-blue-500/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus-within:border-blue-500 dark:focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-blue-500/20',
                disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900 pointer-events-none',
                sizeClasses,
                className
              )}
            >
              {/* Calendar / Clock Button (Trigger) */}
              <PopoverPrimitive.Trigger asChild disabled={disabled}>
                <button
                  type="button"
                  disabled={disabled}
                  tabIndex={-1}
                  className="p-0.5 -ml-0.5 mr-1.5 text-blue-500 hover:text-blue-600 dark:text-sky-400 dark:hover:text-sky-300 transition-colors focus:outline-none shrink-0"
                  title="Mở lịch chọn ngày"
                  aria-label="Mở lịch chọn ngày"
                >
                  {showTime ? (
                    <Clock className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  ) : (
                    <CalendarIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  )}
                </button>
              </PopoverPrimitive.Trigger>

              {/* Direct text input for dd/MM/yyyy */}
              <input
                ref={inputRef}
                type="text"
                id={id}
                name={name}
                autoComplete="off"
                disabled={disabled}
                required={required}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onClick={handleInputClick}
                placeholder={placeholder || (showTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy')}
                className="w-full min-w-0 bg-transparent border-0 p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 text-inherit font-medium tabular-nums"
              />

              {/* Clear button (X) */}
              {isClearable && inputValue && !disabled && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear(e);
                  }}
                  tabIndex={-1}
                  className="p-1 -mr-1 ml-1 rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  title="Xoá ngày đã chọn"
                  aria-label="Xoá ngày đã chọn"
                >
                  <X className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                </button>
              )}
            </div>
          </PopoverPrimitive.Anchor>
        )}

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={popoverContentRef}
            align={align}
            sideOffset={6}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(
              'z-50 w-auto min-w-[310px] sm:min-w-[325px] p-3.5 rounded-2xl border',
              'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
              'border-slate-200/90 dark:border-slate-800 shadow-2xl backdrop-blur-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
          >
            {/* Header: Month / Year / Nav buttons */}
            <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'months' ? 'calendar' : 'months')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1',
                    viewMode === 'months'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  )}
                >
                  {MONTH_NAMES[viewDate.getMonth()]}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'years' ? 'calendar' : 'years')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 font-mono',
                    viewMode === 'years'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  )}
                >
                  {viewDate.getFullYear()}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewDate((prev) => subMonths(prev, 1));
                    setViewMode('calendar');
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewDate(new Date());
                    setViewMode('calendar');
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Về tháng hiện tại"
                >
                  Nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewDate((prev) => addMonths(prev, 1));
                    setViewMode('calendar');
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode: Month Grid Selector */}
            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES.map((mName, idx) => {
                  const isCurrent = viewDate.getMonth() === idx;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        const updated = new Date(viewDate.getFullYear(), idx, 1);
                        setViewDate(updated);
                        setViewMode('calendar');
                      }}
                      className={cn(
                        'py-2 px-1 text-xs font-semibold rounded-xl transition-all',
                        isCurrent
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View Mode: Year Grid Selector */}
            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-2 py-2 max-h-56 overflow-y-auto pr-1">
                {yearOptions.map((y) => {
                  const isCurrent = viewDate.getFullYear() === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        const updated = new Date(y, viewDate.getMonth(), 1);
                        setViewDate(updated);
                        setViewMode('calendar');
                      }}
                      className={cn(
                        'py-2 px-1 text-xs font-semibold rounded-xl font-mono transition-all',
                        isCurrent
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View Mode: Normal Calendar Grid */}
            {viewMode === 'calendar' && (
              <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {WEEKDAY_NAMES.map((wd, i) => (
                    <div
                      key={wd}
                      className={cn(
                        'h-7 flex items-center justify-center text-[11px] font-bold tracking-wider',
                        i === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isCurMonth = isSameMonth(day, viewDate);
                    const today = isToday(day);
                    const disabledDay = isDayDisabled(day);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={disabledDay}
                        onClick={() => handleSelectDay(day)}
                        className={cn(
                          'h-8 w-8 sm:h-9 sm:w-9 mx-auto flex items-center justify-center text-xs rounded-xl font-medium transition-all relative',
                          // Selected state
                          isSelected &&
                            'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105 z-10',
                          // Unselected today state
                          !isSelected && today && 'font-bold text-blue-600 dark:text-sky-400 ring-1.5 ring-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30',
                          // Other days in current month
                          !isSelected && !today && isCurMonth && 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800',
                          // Days in surrounding months
                          !isSelected && !isCurMonth && 'text-slate-300 dark:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/40',
                          // Disabled state
                          disabledDay && 'opacity-25 cursor-not-allowed hover:bg-transparent pointer-events-none'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Picker Section (if showTime) */}
            {showTime && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Thời gian</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                    {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Giờ</label>
                    <select
                      value={selectedHour}
                      onChange={(e) => handleApplyTime(parseInt(e.target.value, 10), selectedMinute)}
                      className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')} giờ
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Phút</label>
                    <select
                      value={selectedMinute}
                      onChange={(e) => handleApplyTime(selectedHour, parseInt(e.target.value, 10))}
                      className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = i * 5;
                        return (
                          <option key={m} value={m}>
                            {String(m).padStart(2, '0')} phút
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Common quick time buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {COMMON_TIMES.map((t) => {
                    const [h, m] = t.split(':').map(Number);
                    const isSelectedTime = selectedHour === h && selectedMinute === m;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleApplyTime(h, m)}
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors',
                          isSelectedTime
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('now')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-sky-300 font-medium ml-auto"
                  >
                    Bây giờ
                  </button>
                </div>
              </div>
            )}

            {/* Quick Presets Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('today')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('tomorrow')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Ngày mai
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClear();
                      setOpen(false);
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                  >
                    Xoá
                  </button>
                )}
                {showTime && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                  >
                    Xong
                  </button>
                )}
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error ? (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export function DateTimePicker(props: Omit<DatePickerProps, 'showTime'>) {
  return <DatePicker {...props} showTime={true} placeholder={props.placeholder || 'dd/MM/yyyy HH:mm'} />;
}
