"use client";

import { useId } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
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
import { cn } from "@/lib/utils";

/** Rows only move up and down. */
const lockToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type SortableListProps<T extends { id: string }> = {
  items: T[];
  /** Called with the reordered array after a drop that changed the order. */
  onReorder: (next: T[]) => void;
  /** Renders one row. Place `handle` where the grab handle should appear. */
  renderItem: (item: T, handle: React.ReactNode, index: number) => React.ReactNode;
  /** Accessible name for each item's handle, e.g. the item's title. */
  getLabel: (item: T) => string;
  disabled?: boolean;
  /** Render as a numbered list when the position itself is meaningful. */
  as?: "ul" | "ol";
  className?: string;
  itemClassName?: string;
};

/**
 * Vertical drag-and-drop list. Rows are dragged by their grip handle (mouse or
 * touch), or with the keyboard: focus a handle, press Space, use the arrow
 * keys, then Space again to drop (Escape cancels).
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  getLabel,
  disabled,
  as: List = "ul",
  className,
  itemClassName,
}: SortableListProps<T>) {
  // A stable id keeps dnd-kit's generated aria attributes identical on the
  // server and the client (avoids a hydration mismatch).
  const id = useId();
  const sensors = useSensors(
    // A small distance threshold so clicks on the handle don't start a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[lockToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy} disabled={disabled}>
        <List className={className}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id} label={getLabel(item)} disabled={disabled} className={itemClassName}>
              {(handle) => renderItem(item, handle, index)}
            </SortableRow>
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  disabled,
  className,
  children,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  className?: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}`}
      disabled={disabled}
      className={cn(
        "grid h-9 w-6 shrink-0 touch-none place-items-center rounded text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative bg-background",
        isDragging && "z-10 rounded-md shadow-lg ring-1 ring-border",
        className,
      )}
    >
      {children(handle)}
    </li>
  );
}
