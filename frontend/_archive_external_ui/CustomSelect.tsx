import React, { useState, useRef, useEffect, useId } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  statusColor?: string; // CSS color string or Tailwind bg class (e.g., '#22c55e' or 'bg-emerald-500')
  avatar?: string;
  disabled?: boolean;
  group?: string;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value?: string | number | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  isClearable?: boolean;
  className?: string;
  containerClassName?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  id?: string;
  name?: string;
}

function normalizeSearchText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = '— Chọn —',
  label,
  error,
  helperText,
  disabled = false,
  searchable,
  isClearable = false,
  className = '',
  containerClassName = 'w-full',
  dropdownClassName = '',
  align = 'left',
  size = 'md',
  required = false,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Determine selected option safely
  const selectedOption = (value !== undefined && value !== null && value !== '')
    ? options.find((opt) => String(opt.value) === String(value))
    : undefined;

  // Determine if search input should be visible
  const showSearch = searchable !== undefined ? searchable : options.length > 4;

  // Filter options based on search query with Vietnamese accent-insensitive matching
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const queryNorm = normalizeSearchText(query);

    const matchLabel = opt.label.toLowerCase().includes(query) || normalizeSearchText(opt.label).includes(queryNorm);
    const matchSublabel = opt.sublabel
      ? opt.sublabel.toLowerCase().includes(query) || normalizeSearchText(opt.sublabel).includes(queryNorm)
      : false;
    const matchValue = String(opt.value).toLowerCase().includes(query);
    return matchLabel || matchSublabel || matchValue;
  });


  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, showSearch]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    if (onChange) {
      onChange(String(option.value));
    }
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (onChange) {
      onChange('');
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Render status color indicator
  const renderStatusDot = (color?: string) => {
    if (!color) return null;
    const isTailwindClass = color.startsWith('bg-');
    return (
      <span
        className={`w-2 h-2 rounded-full inline-block shrink-0 ${isTailwindClass ? color : ''}`}
        style={!isTailwindClass ? { backgroundColor: color } : undefined}
      />
    );
  };

  // Size specific styling
  const sizeClasses = {
    sm: 'py-1 px-2.5 text-xs rounded-md min-h-[30px]',
    md: 'py-2 px-3 text-xs rounded-lg min-h-[36px]',
    lg: 'py-2.5 px-3.5 text-sm rounded-lg min-h-[42px]',
  }[size];

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className={`relative ${containerClassName}`} ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {/* Trigger Button */}
        <PopoverPrimitive.Trigger asChild>
          <button
            id={selectId}
            type="button"
            disabled={disabled}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`
              w-full flex items-center justify-between gap-2 text-left font-medium
              bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100
              border transition-all duration-150 outline-none shadow-xs
              ${
                error
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : isOpen
                  ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
                  : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }
              ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40' : 'cursor-pointer'}
              ${sizeClasses}
              ${className}
            `}
          >
            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
              {selectedOption ? (
                <>
                  {selectedOption.avatar && (
                    <img
                      src={selectedOption.avatar}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                  )}
                  {renderStatusDot(selectedOption.statusColor)}
                  {selectedOption.icon && (
                    <span className="shrink-0 text-slate-500 dark:text-slate-400">
                      {selectedOption.icon}
                    </span>
                  )}
                  <span className="truncate text-slate-900 dark:text-slate-100 font-medium">
                    {selectedOption.label}
                  </span>
                  {selectedOption.sublabel && (
                    <span className="truncate text-[11px] text-slate-400 font-normal">
                      ({selectedOption.sublabel})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 truncate">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {isClearable && selectedOption && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
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
                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Xóa lựa chọn (bỏ chọn)"
                  aria-label="Xóa lựa chọn"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
                }`}
              />
            </div>
          </button>
        </PopoverPrimitive.Trigger>

        {/* Portal Dropdown Menu */}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align={align === 'right' ? 'end' : 'start'}
            sideOffset={4}
            collisionPadding={8}
            onOpenAutoFocus={(e) => {
              if (showSearch) {
                e.preventDefault();
                setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 50);
              }
            }}
            className={`
              z-50 overflow-hidden
              bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
              border border-slate-200 dark:border-slate-800
              rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/50
              max-h-64 flex flex-col min-w-[var(--radix-popover-trigger-width)]
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
              data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
              data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2
              ${dropdownClassName}
            `}
          >
            {/* Sticky Search Header */}
            {showSearch && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="relative flex items-center min-w-0">
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="
                      w-full min-w-0 pl-8 pr-7 py-1.5 text-xs rounded-lg
                      bg-white dark:bg-slate-800
                      border border-slate-200 dark:border-slate-700
                      text-slate-800 dark:text-slate-100 placeholder-slate-400
                      focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 outline-none
                      transition-all
                    "
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div
              ref={listRef}
              className="overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar max-h-52"
              role="listbox"
            >
              {isClearable && selectedOption && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear(e);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer border-b border-slate-100 dark:border-slate-800 mb-1 font-medium"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>-- Bỏ chọn (để trống) --</span>
                </button>
              )}
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  Không tìm thấy kết quả
                </div>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={String(opt.value) + index}
                      type="button"
                      disabled={opt.disabled}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(opt);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg
                        transition-colors text-left cursor-pointer
                        ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : isHighlighted
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }
                        ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {opt.avatar && (
                          <img
                            src={opt.avatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        )}
                        {renderStatusDot(opt.statusColor)}
                        {opt.icon && (
                          <span className="shrink-0 opacity-75">{opt.icon}</span>
                        )}
                        <div className="truncate flex flex-col">
                          <span className="truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>

        {error ? (
          <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    </PopoverPrimitive.Root>
  );
}
