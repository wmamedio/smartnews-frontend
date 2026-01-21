"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/types/feed";

interface DraggableItemProps {
  id: string | number; // Sortable ID (can be prefixed like "item-123")
  item: FeedItem;
  onRemove: () => void;
  onPreview: () => void;
}

// Helper function to get initials from title
function getTitleInitials(title: string): string {
  const words = title.trim().toUpperCase().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3);
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("");
}

// Helper function to generate consistent color from title
function getTitleColor(title: string): string {
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-primary/80",
    "bg-secondary/80",
    "bg-primary/60",
    "bg-secondary/60",
    "bg-muted-foreground",
    "bg-accent",
  ];
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function DraggableItem({ id, item, onRemove, onPreview }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative mb-4 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow",
        isDragging && "shadow-lg z-50 ring-2 ring-primary"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag handle. Press Space to grab, Arrow keys to move"
        role="button"
        tabIndex={0}
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="ml-8 mr-8">
        <div className="flex gap-4">
          {/* Thumbnail or fallback */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
            {item.image_url ? (
              <Image src={item.image_url} alt={item.title} fill className="object-cover" />
            ) : (
              <div
                className={cn(
                  "w-full h-full flex items-center justify-center text-white font-bold text-lg",
                  getTitleColor(item.title)
                )}
              >
                {getTitleInitials(item.title)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })} •{" "}
              {item.source}
            </div>
          </div>
        </div>
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
