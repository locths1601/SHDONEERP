/**
 * Barrel export cho @/components/common
 *
 * Quy tắc dùng (xem .cursor/rules/20-frontend-component-rules.mdc):
 *   import { Card, Button, EmptyState, Skeleton, Can, ConfirmDialog, PageContainer, StatCard } from '@/components/common';
 *
 * KHÔNG import trực tiếp từ file con nếu component nằm trong barrel này.
 * Nếu thêm component mới vào common/, PHẢI export từ đây.
 */

// ===== Layout =====
export { PageContainer } from '@/components/layout/PageContainer';

// ===== Core UI =====
export { Button } from '@/components/common/Button';
export { Card } from '@/components/common/Card';
export { CollapsibleCard } from '@/components/common/CollapsibleCard';
export { Input } from '@/components/common/Input';
export { Modal } from '@/components/common/Modal';
export { SideDrawer } from '@/components/common/SideDrawer';
export { Tabs } from '@/components/common/Tabs';
export { Breadcrumb } from '@/components/common/Breadcrumb';
export { IconButton } from '@/components/common/IconButton';
export { ListToolbar } from '@/components/common/ListToolbar';
export { InfoRow } from '@/components/common/InfoRow';
export { SortableList } from '@/components/common/SortableList';

// ===== Form input =====
export { DatePicker } from '@/components/common/DatePicker';
export { TimePicker } from '@/components/common/TimePicker';
export type { TimePickerProps } from '@/components/common/TimePicker';
export { CustomSelect } from '@/components/common/CustomSelect';
export type { SelectOption, CustomSelectProps } from '@/components/common/CustomSelect';
export { Switch } from '@/components/ui/switch';

// ===== State / feedback =====
export { Skeleton } from '@/components/common/Skeleton';
export { EmptyState } from '@/components/common/EmptyState';
export { ErrorBoundary } from '@/components/common/ErrorBoundary';
export { ConfirmDialog } from '@/components/common/ConfirmDialog';
export { NotificationBell } from '@/components/common/NotificationBell';

// ===== Badges =====
export { Badge } from '@/components/common/Badge';
export { StatusBadge } from '@/components/common/StatusBadge';
export { RoleBadge } from '@/components/common/RoleBadge';
export { GroupBadge } from '@/components/common/GroupBadge';
export { FitGapBadge } from '@/components/common/FitGapBadge';

// ===== Stats / metrics =====
export { StatCard } from '@/components/common/StatCard';

// ===== Data display =====
export { DataTable } from '@/components/common/DataTable';

// ===== User / identity =====
export { UserAvatar } from '@/components/common/UserAvatar';
export { Can } from '@/components/common/Can';
export { RequireAuth } from '@/components/common/RequireAuth';
export { AuthBootstrap } from '@/components/common/AuthBootstrap';
export { ViewProjectButton } from '@/components/common/ViewProjectButton';

// ===== Theme =====
export { ThemeToggle } from '@/components/common/ThemeToggle';
export { ThemeCustomizerModal } from '@/components/common/ThemeCustomizerModal';

// ===== Rich content =====
export { MarkdownEditor } from '@/components/common/MarkdownEditor';
export { JiraRichEditor } from '@/components/common/JiraRichEditor';
export { JiraRichViewer } from '@/components/common/JiraRichViewer';
export { RichDocumentEditor, RichDocumentViewer } from '@/components/rich-editor';


// ===== Onboarding tour =====
export {
  OnboardingTourModal,
  OnboardingFab,
  TourStepDots,
  validateTour,
} from '@/components/common/OnboardingTour';
export type {
  OnboardingTourModalProps,
  OnboardingFabProps,
  OnboardingStep,
  TourDefinition,
} from '@/components/common/OnboardingTour';

// ===== DataGrid (re-export từ sub-barrel) =====
export {
  DataGrid,
  BaseDataGrid,
  DataGridToolbar,
  ExcelCellEditor,
  ConditionalFormattingModal,
  GridFindReplaceModal,
  GridFormulaBar,
  ExcelContextMenu,
  useExcelGrid,
} from '@/components/common/datagrid';

export type {
  DataGridColumn,
  DataGridGroupOption,
  ConditionalColorRule,
  CellChange,
} from '@/components/common/datagrid';
