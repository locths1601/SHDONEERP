import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { IconButton } from '@/components/common/IconButton';
import { useHasPermission } from '@/hooks/usePermission';

/**
 * ViewProjectButton — Icon "Xem" mở trang chi tiết dự án ở **tab mới** (không rời trang hiện tại).
 *
 * Permission: `project.view` (gate qua `useHasPermission`).
 *   - Có quyền (hoặc admin group) → window.open('/projects/{id}', '_blank', 'noopener,noreferrer').
 *   - Không có quyền → toast.error("Bạn không có quyền truy cập dự án") và KHÔNG mở tab.
 *   - Nếu trình duyệt chặn popup (window.open trả về null) → fallback `navigate()` tại tab hiện tại
 *     và toast.warning để người dùng biết.
 *
 * Dùng ở bất kỳ UI nào hiển thị record dự án (RevenueSchedulesTable, CashflowTab, ...).
 * Tuân thủ A11y: icon-only → có `aria-label` qua IconButton.
 *
 * Props:
 *   - projectId: number | string (bắt buộc)
 *   - size, className: optional style override
 *   - label: optional override tooltip/aria-label (mặc định "Xem chi tiết dự án (tab mới)")
 *   - onDenied: optional callback khi bị từ chối (trước toast, dùng cho analytics/log)
 */
export interface ViewProjectButtonProps {
  projectId: number | string | null | undefined;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
  onDenied?: () => void;
}

export function ViewProjectButton({
  projectId,
  size = 'sm',
  className,
  label = 'Xem chi tiết dự án (tab mới)',
  onDenied,
}: ViewProjectButtonProps) {
  const canView = useHasPermission('project.view');

  // Guard: nếu không có projectId hợp lệ thì disable button, không hiển thị.
  if (projectId === null || projectId === undefined || projectId === '') {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    // Quan trọng: nếu button nằm trong 1 link/row có handler khác, chặn bubble.
    e.stopPropagation();
    e.preventDefault();

    if (!canView) {
      onDenied?.();
      toast.error('Bạn không có quyền truy cập dự án');
      return;
    }

    const path = `/projects/${projectId}`;

    // Mở trong tab mới với noopener+noreferrer để:
    // - Bảo mật: tab mới không có quyền truy cập window.opener (chống tabnabbing).
    // - Performance: tách biệt browsing context.
    // Sử dụng relative path để browser giữ nguyên origin → JWT cookie / session context được chia sẻ.
    const newWindow = window.open(path, '_blank', 'noopener,noreferrer');

    // Fallback khi popup bị chặn (browser setting hoặc extension): mở tại tab hiện tại
    // và thông báo để người dùng biết.
    if (!newWindow) {
      toast.warning('Trình duyệt đang chặn popup — đã mở tại tab hiện tại. Hãy bật popup cho site này để dùng tab mới.');
      window.location.href = path;
    }
  };

  return (
    <IconButton
      icon={Eye}
      label={label}
      variant="ghost"
      size={size}
      onClick={handleClick}
      aria-label={label}
      className={
        'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 ' +
        (className ?? '')
      }
    />
  );
}

export default ViewProjectButton;
