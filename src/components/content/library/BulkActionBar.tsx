"use client";

import { CheckCircle, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  selectedItemsStatus?: "published" | "unpublished" | "mixed";
  onSelectAll?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onClearSelection?: () => void;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  selectedItemsStatus = "mixed",
  onSelectAll,
  onPublish,
  onDelete,
  onClearSelection,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  const allSelected = selectedCount === totalCount;
  const publishButtonText = selectedItemsStatus === "published" ? "Unpublish" : "Publish";

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom",
        className
      )}
    >
      <Card className="shadow-lg border-2">
        <CardContent className="p-4 flex items-center gap-4">
          {/* Selection Count with Select All */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all items"
            />
            <span className="text-sm font-medium whitespace-nowrap">{selectedCount} selected</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {onPublish && (
              <Button variant="outline" size="sm" onClick={onPublish} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {publishButtonText}
              </Button>
            )}

            <Separator orientation="vertical" className="h-6" />

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Clear Selection */}
          {onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
