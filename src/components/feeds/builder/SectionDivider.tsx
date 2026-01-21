"use client";

import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SectionDividerProps {
  id: string;
  title: string;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

export function SectionDivider({
  id,
  title,
  onRename,
  onDelete,
  isEditing = false,
}: SectionDividerProps) {
  const [isEditMode, setIsEditMode] = useState(isEditing);
  const [editValue, setEditValue] = useState(title);

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
    <div className="group relative flex items-center gap-4 py-6 my-4">
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
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          {title}
        </h3>
      )}

      {/* Right line */}
      <div className="flex-1 h-px bg-border" />

      {/* Actions (visible on hover) */}
      {!isEditMode && (
        <div className="absolute right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => setIsEditMode(true)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
