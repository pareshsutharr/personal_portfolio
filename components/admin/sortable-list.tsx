"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Generic drag-and-drop list. Persists optimistically: `onReorder` receives
 * the new id order after a drop; roll back by re-passing `items` if it fails.
 *
 *   <SortableList items={rows} onReorder={(ids) => run(ids)} renderItem={(row, handle) => (...)} />
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  disabled,
}: {
  items: T[];
  onReorder: (ids: string[], next: T[]) => void;
  renderItem: (item: T, handle: React.ReactNode, index: number) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = React.useMemo(() => items.map((i) => i.id), [items]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    const next = arrayMove(items, from, to);
    onReorder(
      next.map((i) => i.id),
      next,
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn("divide-y divide-line-800 rounded-md border border-line-800", className)}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id} disabled={disabled}>
              {(handle) => renderItem(item, handle, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Drag to reorder"
      className={cn(
        "flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-xs text-fg-500 hover:text-fg-100 active:cursor-grabbing",
        disabled && "cursor-not-allowed opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-3 bg-surface-900 px-3 py-2.5",
        isDragging && "z-10 bg-surface-800 shadow-lg",
      )}
    >
      {children(handle)}
    </li>
  );
}
