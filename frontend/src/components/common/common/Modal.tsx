import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/common/IconButton';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  zIndex = 'z-50',
  contentClassName = 'p-4 sm:p-6',
  headerActions,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    '4xl': 'max-w-[92vw]',
    full: 'max-w-[96vw]',
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-white dark:bg-slate-900 
          border border-slate-200 dark:border-slate-800
          rounded-xl shadow-2xl overflow-hidden
          flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10
          animate-in fade-in zoom-in-95 duration-150
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="min-w-0 pr-3">
            {typeof title === 'string' ? (
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h2>
            ) : (
              title
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerActions}
            <IconButton
              icon={<X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
              label="Đóng (Esc)"
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto text-slate-700 dark:text-slate-200 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
