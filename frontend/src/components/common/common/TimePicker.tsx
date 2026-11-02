import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Clock, X, ChevronDown, Check, Sparkles, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export interface TimePickerProps {
  value?: string; // Format "HH:mm" (24-hour)
  onChange?: (val: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  isClearable?: boolean;
  minTime?: string; // "HH:mm"
  maxTime?: string; // "HH:mm"
  step?: number; // Minutes step for quick slots (default: 30)
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  align?: 'start' | 'center' | 'end';
}

const COMMON_PRESETS = [
  { label: '08:30', desc: 'Vào ca sáng' },
  { label: '12:00', desc: 'Nghỉ trưa' },
  { label: '13:30', desc: 'Vào ca chiều' },
  { label: '17:30', desc: 'Tan ca chiều' },
  { label: '18:00', desc: 'Bắt đầu OT' },
  { label: '21:00', desc: 'Hết ca OT' },
];

// Helper: Normalize & validate "HH:mm"
function normalizeTimeString(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Match "H:m", "HH:mm", "HHmm", or "H"
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 3) {
    // e.g. "830" -> 08:30
    const h = parseInt(digitsOnly.slice(0, 1), 10);
    const m = parseInt(digitsOnly.slice(1), 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  } else if (digitsOnly.length === 4) {
    // e.g. "0830" -> 08:30, "1730" -> 17:30
    const h = parseInt(digitsOnly.slice(0, 2), 10);
    const m = parseInt(digitsOnly.slice(2), 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  } else if (digitsOnly.length >= 1 && digitsOnly.length <= 2) {
    const h = parseInt(digitsOnly, 10);
    if (h >= 0 && h < 24) {
      return `${String(h).padStart(2, '0')}:00`;
    }
  }

  return null;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function TimePicker({
  value = '',
  onChange,
  placeholder = 'HH:mm',
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  isClearable = true,
  minTime,
  maxTime,
  step = 30,
  className = '',
  containerClassName = '',
  size = 'md',
  id,
  name,
  align = 'start',
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [typedInput, setTypedInput] = useState(value || '');

  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Sync typedInput when value changes externally
  useEffect(() => {
    setTypedInput(value || '');
  }, [value]);

  const parsed = useMemo(() => {
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length === 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return { hour: h, minute: m };
      }
    }
    return null;
  }, [value]);

  const currentHour = parsed?.hour ?? 8;
  const currentMinute = parsed?.minute ?? 30;

  // Auto-scroll hour & minute into center when drawer/popover opens or mode changes
  useEffect(() => {
    if (open && activeTab === 'custom') {
      const timer = setTimeout(() => {
        if (hourListRef.current) {
          const activeHourEl = hourListRef.current.querySelector<HTMLElement>(`[data-hour="${currentHour}"]`);
          if (activeHourEl) {
            activeHourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        if (minuteListRef.current) {
          const activeMinEl = minuteListRef.current.querySelector<HTMLElement>(`[data-minute="${currentMinute}"]`);
          if (activeMinEl) {
            activeMinEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, activeTab, currentHour, currentMinute]);

  const isTimeDisabled = (tStr: string): boolean => {
    const mins = timeToMinutes(tStr);
    if (minTime && mins < timeToMinutes(minTime)) return true;
    if (maxTime && mins > timeToMinutes(maxTime)) return true;
    return false;
  };

  const handleSelectTime = (newTime: string) => {
    onChange?.(newTime);
    setTypedInput(newTime);
  };

  const handleApplyHour = (h: number) => {
    const hStr = String(h).padStart(2, '0');
    const mStr = String(currentMinute).padStart(2, '0');
    handleSelectTime(`${hStr}:${mStr}`);
  };

  const handleApplyMinute = (m: number) => {
    const hStr = String(currentHour).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    handleSelectTime(`${hStr}:${mStr}`);
  };

  const handleQuickStepMinute = (delta: number) => {
    let nextMinute = currentMinute + delta;
    let nextHour = currentHour;
    if (nextMinute >= 60) {
      nextMinute -= 60;
      nextHour = (nextHour + 1) % 24;
    } else if (nextMinute < 0) {
      nextMinute += 60;
      nextHour = (nextHour - 1 + 24) % 24;
    }
    const hStr = String(nextHour).padStart(2, '0');
    const mStr = String(nextMinute).padStart(2, '0');
    handleSelectTime(`${hStr}:${mStr}`);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    // Round to nearest 5 mins
    const m = String(Math.round(now.getMinutes() / 5) * 5 % 60).padStart(2, '0');
    handleSelectTime(`${h}:${m}`);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange?.('');
    setTypedInput('');
  };

  const handleInputBlur = () => {
    if (!typedInput) {
      onChange?.('');
      return;
    }
    const normalized = normalizeTimeString(typedInput);
    if (normalized) {
      handleSelectTime(normalized);
    } else {
      // Reset back to previous value
      setTypedInput(value || '');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleQuickStepMinute(15);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleQuickStepMinute(-15);
    }
  };

  // Generate standard quick slots (e.g. step = 30 -> 07:00, 07:30, ...)
  const quickSlots = useMemo(() => {
    const slots: { time: string; period: 'morning' | 'afternoon' | 'evening' }[] = [];
    for (let h = 7; h <= 22; h++) {
      for (let m = 0; m < 60; m += step) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
        slots.push({ time, period });
      }
    }
    return slots;
  }, [step]);

  const sizeClasses = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-xs px-3',
    lg: 'h-10 text-sm px-3.5',
  };

  // Period label for active time
  const periodLabel = useMemo(() => {
    if (!parsed) return '';
    const h = parsed.hour;
    if (h >= 5 && h < 12) return 'Buổi sáng';
    if (h >= 12 && h < 18) return 'Buổi chiều';
    return 'Buổi tối';
  }, [parsed]);

  return (
    <div className={cn('relative w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div
            className={cn(
              'group relative flex items-center w-full rounded-lg border transition-all',
              'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
              error
                ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-400/20'
                : open
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              disabled && 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900',
              className
            )}
          >
            {/* Clock Icon Trigger */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Mở bảng chọn giờ"
              className="pl-2.5 pr-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
            >
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </button>

            {/* Direct Editable Text Input */}
            <input
              id={id}
              name={name}
              type="text"
              disabled={disabled}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onClick={() => {
                if (!open) setOpen(true);
              }}
              placeholder={placeholder}
              className={cn(
                'w-full bg-transparent font-mono font-medium outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
                sizeClasses[size]
              )}
            />

            {/* Clear Button */}
            {isClearable && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                title="Xoá giờ đã chọn"
                aria-label="Xoá giờ đã chọn"
                className="p-1 mr-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Chevron */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="pr-2.5 pl-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
            >
              <ChevronDown
                className={cn('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180 text-indigo-500')}
              />
            </button>
          </div>
        </PopoverPrimitive.Anchor>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align={align}
            sideOffset={6}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(
              'z-[70] w-[320px] rounded-2xl border',
              'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
              'border-slate-200/90 dark:border-slate-800 shadow-2xl backdrop-blur-md',
              'p-3 space-y-3',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
          >
            {/* Header: Title + Big Time Display + 'Bây giờ' Quick Action */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {periodLabel || 'Chọn giờ'}
                  </div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{value || '--:--'}</span>
                    {value && (
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-sky-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded">
                        24h
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                title="Chọn thời gian hiện tại"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Hiện tại</span>
              </button>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={cn(
                  'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'presets'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Khung giờ gợi ý</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={cn(
                  'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
                  activeTab === 'custom'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tùy chỉnh Giờ : Phút</span>
              </button>
            </div>

            {/* TAB 1: Fast Presets Grid (Morning, Afternoon, Evening) */}
            {activeTab === 'presets' && (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {/* Morning */}
                <div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>☀️ Buổi sáng</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {quickSlots
                      .filter((s) => s.period === 'morning')
                      .map((s) => {
                        const isSelected = value === s.time;
                        const disabledSlot = isTimeDisabled(s.time);
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={disabledSlot}
                            onClick={() => {
                              handleSelectTime(s.time);
                            }}
                            className={cn(
                              'py-1.5 px-1 rounded-lg text-xs font-mono font-medium transition-all text-center border',
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40',
                              disabledSlot && 'opacity-30 cursor-not-allowed pointer-events-none'
                            )}
                          >
                            {s.time}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Afternoon */}
                <div>
                  <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>🌤️ Buổi chiều</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {quickSlots
                      .filter((s) => s.period === 'afternoon')
                      .map((s) => {
                        const isSelected = value === s.time;
                        const disabledSlot = isTimeDisabled(s.time);
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={disabledSlot}
                            onClick={() => {
                              handleSelectTime(s.time);
                            }}
                            className={cn(
                              'py-1.5 px-1 rounded-lg text-xs font-mono font-medium transition-all text-center border',
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40',
                              disabledSlot && 'opacity-30 cursor-not-allowed pointer-events-none'
                            )}
                          >
                            {s.time}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Evening */}
                <div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>🌙 Buổi tối / Tăng ca</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {quickSlots
                      .filter((s) => s.period === 'evening')
                      .map((s) => {
                        const isSelected = value === s.time;
                        const disabledSlot = isTimeDisabled(s.time);
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={disabledSlot}
                            onClick={() => {
                              handleSelectTime(s.time);
                            }}
                            className={cn(
                              'py-1.5 px-1 rounded-lg text-xs font-mono font-medium transition-all text-center border',
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40',
                              disabledSlot && 'opacity-30 cursor-not-allowed pointer-events-none'
                            )}
                          >
                            {s.time}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Precision Hour & Minute Columns */}
            {activeTab === 'custom' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <span>Giờ (0 - 23)</span>
                  <span>Phút (00 - 55)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 h-[180px]">
                  {/* Hours column */}
                  <div
                    ref={hourListRef}
                    className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1 space-y-1"
                  >
                    {Array.from({ length: 24 }).map((_, h) => {
                      const isSelected = currentHour === h;
                      return (
                        <button
                          key={h}
                          data-hour={h}
                          type="button"
                          onClick={() => handleApplyHour(h)}
                          className={cn(
                            'w-full py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-between',
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                          )}
                        >
                          <span>{String(h).padStart(2, '0')} giờ</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Minutes column */}
                  <div
                    ref={minuteListRef}
                    className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-1 space-y-1"
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const m = i * 5;
                      const isSelected = currentMinute === m;
                      return (
                        <button
                          key={m}
                          data-minute={m}
                          type="button"
                          onClick={() => handleApplyMinute(m)}
                          className={cn(
                            'w-full py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-between',
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                          )}
                        >
                          <span>{String(m).padStart(2, '0')} phút</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine minute steppers (+1m, +5m, -1m, -5m) */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Chỉnh nhanh:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickStepMinute(-5)}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Giảm 5 phút"
                    >
                      -5m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStepMinute(-1)}
                      className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Giảm 1 phút"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStepMinute(1)}
                      className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Tăng 1 phút"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStepMinute(5)}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Tăng 5 phút"
                    >
                      +5m
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Shift Common Badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mốc giờ chuẩn
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {COMMON_PRESETS.map((p) => {
                  const isActive = value === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectTime(p.label)}
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-sky-300 border-indigo-300 dark:border-indigo-700 font-bold'
                          : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                      )}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions: Clear & Done */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {value ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  Xoá giờ
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Hoàn tất</span>
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error ? (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
