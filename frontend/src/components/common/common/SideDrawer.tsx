import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'half' | '3/4' | 'wide' | '4xl' | '5xl' | 'full' | 'reading';
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  headerActions?: React.ReactNode;
  customHeader?: React.ReactNode;
  hideDefaultHeader?: boolean;
  hideDefaultClose?: boolean;
}

const WIDTH_CLASSES: Record<string, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
  half: 'w-full sm:w-[50vw] sm:max-w-[50vw]',
  '3/4': 'w-full sm:w-[75vw] sm:max-w-[75vw]',
  wide: 'w-full sm:w-[85vw] sm:max-w-[85vw]',
  '4xl': 'w-full sm:w-[90vw] sm:max-w-[90vw]',
  '5xl': 'w-full sm:w-[95vw] sm:max-w-[95vw]',
  full: 'w-full sm:w-screen sm:max-w-none',
  reading: 'w-full sm:w-[100vw] lg:w-[90vw] lg:max-w-[90vw] xl:w-[80vw] xl:max-w-[1440px]',
};

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  width = 'xl',
  footer,
  children,
  className = '',
  bodyClassName,
  headerClassName,
  headerActions,
  customHeader,
  hideDefaultHeader = false,
  hideDefaultClose = false,
}: SideDrawerProps) {
  const widthCls = WIDTH_CLASSES[width] || WIDTH_CLASSES.xl;
  const shouldHideClose = hideDefaultClose || Boolean(customHeader);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          'w-full h-[100dvh] max-h-[100dvh] overflow-hidden p-0 flex flex-col bg-background border-l border-border shadow-2xl z-50',
          widthCls,
          shouldHideClose && '[&>button:last-child]:hidden',
          className
        )}
      >
        {/* Header */}
        {!hideDefaultHeader && (
          customHeader ? (
            customHeader
          ) : (title || icon || subtitle) ? (
            <SheetHeader className={cn("border-b border-border/80 px-6 py-4 bg-muted/40 shrink-0", headerClassName)}>
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  {icon && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    {typeof title === 'string' ? (
                      <SheetTitle className="text-base font-bold text-foreground truncate">
                        {title}
                      </SheetTitle>
                    ) : (
                      title
                    )}
                    {subtitle && (
                      <SheetDescription asChild className="text-xs text-muted-foreground truncate mt-0.5">
                        <div>{subtitle}</div>
                      </SheetDescription>
                    )}
                  </div>
                </div>
                {headerActions && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {headerActions}
                  </div>
                )}
              </div>
            </SheetHeader>
          ) : null
        )}

        {/* Content Body */}
        <div className={bodyClassName ?? "flex-1 overflow-y-auto p-6 space-y-4"}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-3.5 bg-slate-50/60 dark:bg-slate-800/40 shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default SideDrawer;
