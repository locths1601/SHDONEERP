/**
 * DataGridActionsCell.tsx
 * Canonical shared action cell component for BaseDataGrid (Spec §13)
 * Standardizes View / Preview / Edit / Delete / ExternalLink buttons across all tables.
 *
 * Vibrant Theme-Aware Palette:
 *  - Preview (Eye): Adapts dynamically to User's Active Theme (--primary)
 *  - Detail (ExternalLink): Sky Blue / Cyan
 *  - Edit (Pencil): Warm Golden Amber
 *  - Delete (Trash2): Rose Red (Destructive)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Can } from '@/components/common/Can';
import { cn } from '@/lib/utils';

export type DataGridActionsVariant = 'theme-pills' | 'ghost';

export interface DataGridActionPermissions {
  preview?: string | string[];
  edit?: string | string[];
  delete?: string | string[];
  detail?: string | string[];
}

export interface DataGridCustomAction {
  id: string;
  label?: string;
  tooltip?: string;
  icon: React.ComponentType<{ className?: string }> | React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  permission?: string | string[];
  disabled?: boolean;
  className?: string;
}

export interface DataGridActionsCellProps {
  /** Quick preview callback (e.g. open Drawer / Modal) */
  onPreview?: (e: React.MouseEvent) => void;

  /** Edit callback (e.g. open Edit Drawer / Modal) */
  onEdit?: (e: React.MouseEvent) => void;

  /** Delete callback (e.g. trigger delete confirmation dialog) */
  onDelete?: (e: React.MouseEvent) => void;

  /** Direct navigation link or route (e.g. /tickets/123, /customers/456) */
  detailUrl?: string;

  /** Custom detail click handler instead of react-router Link */
  onDetail?: (e: React.MouseEvent) => void;

  /** Visual variant: 'theme-pills' (vibrant colorful chips) or 'ghost' (minimal icons) */
  variant?: DataGridActionsVariant;

  /** Permission strings or arrays to guard each action */
  permissions?: DataGridActionPermissions;

  /** Custom tooltips for each action button */
  tooltips?: {
    preview?: string;
    edit?: string;
    delete?: string;
    detail?: string;
  };

  /** Disabled flags for each action */
  disabled?: {
    preview?: boolean;
    edit?: boolean;
    delete?: boolean;
    detail?: boolean;
  };

  /** Additional custom action buttons */
  customActions?: DataGridCustomAction[];

  /** Extra custom React elements */
  children?: React.ReactNode;

  /** Container class overrides */
  className?: string;
}

export const DataGridActionsCell: React.FC<DataGridActionsCellProps> = ({
  onPreview,
  onEdit,
  onDelete,
  detailUrl,
  onDetail,
  variant = 'theme-pills',
  permissions = {},
  tooltips = {},
  disabled = {},
  customActions = [],
  children,
  className,
}) => {
  const isPill = variant === 'theme-pills';

  const previewTooltip = tooltips.preview || 'Xem nhanh';
  const editTooltip = tooltips.edit || 'Chỉnh sửa';
  const deleteTooltip = tooltips.delete || 'Xóa bản ghi';
  const detailTooltip = tooltips.detail || 'Mở toàn màn hình';

  // 1. Preview Button Styles (Adapts to Active Theme Primary)
  const previewClass = isPill
    ? cn(
        'h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs transition-all duration-150',
        'bg-primary/10 text-primary border-primary/25',
        'hover:bg-primary/20 hover:border-primary/40 hover:scale-110 active:scale-95',
        'dark:bg-primary/20 dark:text-primary dark:border-primary/35 dark:hover:bg-primary/30',
        'cursor-pointer'
      )
    : 'p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer';

  // 2. Detail Button Styles (Sky/Cyan Accent)
  const detailClass = isPill
    ? cn(
        'h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs transition-all duration-150',
        'bg-sky-50 text-sky-600 border-sky-200/70',
        'hover:bg-sky-100 hover:text-sky-700 hover:border-sky-300 hover:scale-110 active:scale-95',
        'dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50 dark:hover:bg-sky-900/60 dark:hover:text-sky-300',
        'cursor-pointer inline-flex'
      )
    : 'p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer';

  // 3. Edit Button Styles (Warm Golden Amber)
  const editClass = isPill
    ? cn(
        'h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs transition-all duration-150',
        'bg-amber-50 text-amber-700 border-amber-200/70',
        'hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 hover:scale-110 active:scale-95',
        'dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/60 dark:hover:text-amber-300',
        'cursor-pointer'
      )
    : 'p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer';

  // 4. Delete Button Styles (Rose / Crimson Red)
  const deleteClass = isPill
    ? cn(
        'h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs transition-all duration-150',
        'bg-rose-50 text-rose-600 border-rose-200/70',
        'hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 hover:scale-110 active:scale-95',
        'dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/60 dark:hover:text-rose-300',
        'cursor-pointer'
      )
    : 'p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:scale-105 active:scale-95 transition-all cursor-pointer';

  const renderButtonWithTooltip = (
    content: React.ReactNode,
    tooltipText: string,
    key?: string
  ) => {
    return (
      <Tooltip key={key} delayDuration={150}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-[11px] bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700 px-2 py-0.5 rounded shadow-md z-50 pointer-events-none"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'flex items-center justify-end gap-1.5 w-full select-none',
          isPill ? 'opacity-90 group-hover:opacity-100 transition-opacity' : 'opacity-85 group-hover:opacity-100 transition-opacity',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Quick Preview Button (Drawer/Modal - Theme Primary Color) */}
        {onPreview && (
          <Can permission={permissions.preview}>
            {renderButtonWithTooltip(
              <button
                type="button"
                disabled={disabled.preview}
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.(e);
                }}
                className={cn(
                  previewClass,
                  disabled.preview && 'opacity-40 cursor-not-allowed hover:scale-100'
                )}
                aria-label={previewTooltip}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>,
              previewTooltip,
              'action-preview'
            )}
          </Can>
        )}

        {/* 2. Direct Detail Link (External Link - Sky Accent Color) */}
        {detailUrl && (
          <Can permission={permissions.detail}>
            {renderButtonWithTooltip(
              <Link
                to={detailUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  onDetail?.(e);
                }}
                className={cn(
                  detailClass,
                  disabled.detail && 'opacity-40 pointer-events-none'
                )}
                aria-label={detailTooltip}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>,
              detailTooltip,
              'action-detail-link'
            )}
          </Can>
        )}

        {/* 2b. Custom Detail Click Handler (if no detailUrl) */}
        {!detailUrl && onDetail && (
          <Can permission={permissions.detail}>
            {renderButtonWithTooltip(
              <button
                type="button"
                disabled={disabled.detail}
                onClick={onDetail}
                className={cn(
                  detailClass,
                  disabled.detail && 'opacity-40 cursor-not-allowed hover:scale-100'
                )}
                aria-label={detailTooltip}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>,
              detailTooltip,
              'action-detail-btn'
            )}
          </Can>
        )}

        {/* 3. Edit Action Button (Warm Golden Amber Color) */}
        {onEdit && (
          <Can permission={permissions.edit}>
            {renderButtonWithTooltip(
              <button
                type="button"
                disabled={disabled.edit}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(e);
                }}
                className={cn(
                  editClass,
                  disabled.edit && 'opacity-40 cursor-not-allowed hover:scale-100'
                )}
                aria-label={editTooltip}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>,
              editTooltip,
              'action-edit'
            )}
          </Can>
        )}

        {/* 4. Delete Action Button (Rose Red Destructive Color) */}
        {onDelete && (
          <Can permission={permissions.delete}>
            {renderButtonWithTooltip(
              <button
                type="button"
                disabled={disabled.delete}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(e);
                }}
                className={cn(
                  deleteClass,
                  disabled.delete && 'opacity-40 cursor-not-allowed hover:scale-100'
                )}
                aria-label={deleteTooltip}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>,
              deleteTooltip,
              'action-delete'
            )}
          </Can>
        )}

        {/* 5. Custom Domain Actions */}
        {customActions.map((action) => {
          const IconComp = action.icon;
          const tooltip = action.tooltip || action.label || '';
          const customClass = isPill
            ? cn(
                'h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs transition-all duration-150',
                'bg-slate-100/90 text-slate-600 border-slate-200/80',
                'hover:bg-slate-200 hover:text-slate-900 hover:scale-110 active:scale-95',
                'dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80 dark:hover:bg-slate-700 dark:hover:text-slate-100',
                'cursor-pointer',
                action.className
              )
            : cn(
                'p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer',
                action.className
              );

          const btn = (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                customClass,
                action.disabled && 'opacity-40 cursor-not-allowed hover:scale-100'
              )}
              aria-label={tooltip}
            >
              {typeof IconComp === 'function' ? (
                <IconComp className="w-3.5 h-3.5" />
              ) : (
                IconComp
              )}
            </button>
          );

          if (tooltip) {
            return (
              <Can key={action.id} permission={action.permission}>
                {renderButtonWithTooltip(btn, tooltip, action.id)}
              </Can>
            );
          }

          return (
            <Can key={action.id} permission={action.permission}>
              {btn}
            </Can>
          );
        })}

        {/* 6. Children pass-through */}
        {children}
      </div>
    </TooltipProvider>
  );
};

export default DataGridActionsCell;
