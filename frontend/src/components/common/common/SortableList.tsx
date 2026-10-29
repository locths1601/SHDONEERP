import { ReactNode, CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string | number;
  children: ReactNode;
  disabled?: boolean;
  showHandle?: boolean;
  className?: string;
  handleClassName?: string;
}

export function SortableItem({
  id,
  children,
  disabled = false,
  showHandle = true,
  className = '',
  handleClassName = '',
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'shadow-lg ring-2 ring-emerald-400 dark:ring-emerald-600 rounded-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        {showHandle && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            className={`shrink-0 mt-1.5 p-0.5 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${handleClassName}`}
            title="Kéo để sắp xếp lại"
            aria-label="Kéo để sắp xếp"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SortableList — wraps multiple SortableItem with a single DndContext
// ─────────────────────────────────────────────────────────────────────────

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableListProps<T extends { id: string | number }> {
  items: T[];
  onReorder: (orderedIds: (string | number)[]) => void;
  disabled?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function SortableList<T extends { id: string | number }>({
  items,
  onReorder,
  disabled = false,
  renderItem,
  className = '',
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((it) => it.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((it) => it.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, idx) => (
            <SortableItem key={item.id} id={item.id} disabled={disabled}>
              {renderItem(item, idx)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
