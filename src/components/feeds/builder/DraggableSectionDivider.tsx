"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DraggableSectionDividerProps {
  id: string;
  title: string;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
}

export function DraggableSectionDivider({
  id,
  title,
  onRename,
  onDelete,
}: DraggableSectionDividerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onRename?.(editValue.trim());
      setIsEditMode(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditMode(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-4 py-6 my-4",
        isDragging && "z-50 opacity-50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag handle. Press Space to grab, Arrow keys to move"
        role="button"
        tabIndex={0}
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Left line */}
      <div className="flex-1 h-px bg-border" />

      {/* Section title or input */}
      {isEditMode ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="w-48 h-8 text-sm font-semibold text-center"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap px-4">
          {title}
        </h3>
      )}

      {/* Right line */}
      <div className="flex-1 h-px bg-border" />

      {/* Actions (visible on hover) */}
      {!isEditMode && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditMode(true)}
            title="Edit section name"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
            title="Delete section"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
