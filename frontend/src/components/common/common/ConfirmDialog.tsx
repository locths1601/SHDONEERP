import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function ConfirmDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  onConfirm,
  destructive = false,
  variant,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  secondaryLabel,
  onSecondary,
}: {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  destructive?: boolean;
  variant?: 'danger' | 'default' | 'warning';
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  /**
   * Optional middle action (e.g. "Chọn ngày khác"). When set, three buttons
   * render in the footer: [Cancel] [Secondary] [Confirm]. When absent, the
   * original 2-button layout is used.
   */
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const isActualOpen = open ?? isOpen ?? false;
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen && onClose) {
      onClose();
    }
  };
  const isDestructive = destructive || variant === 'danger';
  const finalConfirmLabel = confirmLabel || confirmText || 'Xác nhận';
  const finalCancelLabel = cancelLabel || cancelText || 'Hủy bỏ';
  const hasSecondary = !!secondaryLabel && !!onSecondary;

  return (
    <AlertDialog open={isActualOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {hasSecondary ? (
          // 3-button footer: cancel (left) | secondary (middle) | confirm (right)
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <AlertDialogCancel>{finalCancelLabel}</AlertDialogCancel>
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
            <AlertDialogAction
              onClick={onConfirm}
              className={isDestructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {finalConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter>
            <AlertDialogCancel>{finalCancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={isDestructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {finalConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
