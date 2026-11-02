import React from 'react';
import { Search, X } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import { DatePicker, DateTimePicker, type DatePickerProps } from './DatePicker';

export { DatePicker, DateTimePicker, type DatePickerProps };

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  type,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  if (type === 'date' || type === 'datetime-local') {
    const handleDateChange = (val: string, ev?: React.ChangeEvent<HTMLInputElement>) => {
      if (!props.onChange) return;
      const syntheticEvent = ev || ({
        target: { value: val, name: props.name || '' },
        currentTarget: { value: val, name: props.name || '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      (props.onChange as any)(syntheticEvent);
    };

    return (
      <DatePicker
        id={inputId}
        name={props.name}
        label={label}
        error={error}
        helperText={helperText}
        value={props.value as any}
        onChange={handleDateChange}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        className={className}
        showTime={type === 'datetime-local'}
      />
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full px-3.5 py-2 text-sm rounded-lg
            bg-white dark:bg-slate-800 
            border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 shadow-xs'}
            text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            transition-all outline-none
            ${icon ? 'pl-9' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Tìm kiếm...',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-8 py-2 text-xs rounded-lg
          bg-white dark:bg-slate-800/90 
          border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600
          text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
          focus:border-blue-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-blue-500/20 outline-none
          transition-all shadow-xs
        "
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
          title="Xóa tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/60 rounded border border-slate-200 dark:border-slate-600 pointer-events-none">
          /
        </kbd>
      )}
    </div>
  );
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  value?: string | number | null;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  isClearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (val: string, event?: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  containerClassName,
  id,
  name,
  value,
  disabled = false,
  required = false,
  searchable,
  isClearable,
  size = 'md',
  onChange,
  ...props
}: SelectProps & Record<string, any>) {
  const isCustomWidth = className.includes('w-') || className.includes('max-w-');
  const defaultContainerClass = isCustomWidth ? '' : 'w-full';

  // Support both e.target.value and direct string value
  const handleChange = (newVal: string) => {
    if (!onChange) return;
    const eventOrString = new String(newVal) as any;
    eventOrString.target = { value: newVal, name: name || '' };
    eventOrString.currentTarget = { value: newVal, name: name || '' };
    eventOrString.value = newVal;

    const syntheticEvent = {
      target: { value: newVal, name: name || '' },
      currentTarget: { value: newVal, name: name || '' },
      value: newVal,
    } as unknown as React.ChangeEvent<HTMLSelectElement>;

    (onChange as any)(eventOrString, syntheticEvent);
  };

  return (
    <CustomSelect
      id={id}
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      options={options}
      placeholder={placeholder}
      value={value !== undefined ? value : props.defaultValue}
      disabled={disabled}
      required={required}
      searchable={searchable}
      isClearable={isClearable}
      size={size}
      className={className}
      containerClassName={containerClassName ?? defaultContainerClass}
      onChange={handleChange}
    />
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
}

export function Textarea({
  label,
  error,
  showCharCount,
  className = '',
  maxLength,
  value,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        {showCharCount && maxLength && (
          <span className="text-[11px] text-slate-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        maxLength={maxLength}
        value={value}
        className={`
          w-full px-3.5 py-2 text-sm rounded-lg
          bg-white dark:bg-slate-800
          border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
          text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
          focus:border-blue-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-blue-500/20 outline-none
          transition-all
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
