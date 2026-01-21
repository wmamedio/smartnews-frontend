"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentRatingActionsProps {
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  isVisible: boolean;
  currentStatus?: string; // Current item status to highlight appropriate button
  className?: string;
}

/**
 * Story 1.3.5: Content Rating Actions Overlay
 *
 * Displays thumbs up/down buttons on hover over content cards.
 * Used for interactive content rating and keyword refinement.
 * Modern design with light blur and icon-only styling.
 * Highlights the button matching the current status for visual feedback.
 *
 * @param onThumbsUp - Callback when thumbs up is clicked
 * @param onThumbsDown - Callback when thumbs down is clicked
 * @param isVisible - Whether the overlay is visible (on hover)
 * @param currentStatus - Current item status (published/ready_to_publish/rejected/etc)
 * @param className - Additional CSS classes
 */
export function ContentRatingActions({
  onThumbsUp,
  onThumbsDown,
  isVisible,
  currentStatus,
  className,
}: ContentRatingActionsProps) {
  // Determine which button should be highlighted based on status
  // Both "published" and "ready_to_publish" (or "ready_for_publish") are positive statuses
  const isPositiveStatus =
    currentStatus === "published" ||
    currentStatus === "ready_to_publish" ||
    currentStatus === "ready_for_publish";
  const isNegativeStatus = currentStatus === "rejected";

  return (
    <div
      data-rating-actions
      className={cn(
        "absolute inset-0 bg-white/75 dark:bg-neutral-950/75 backdrop-blur-[0.5px] transition-opacity duration-200 flex items-center justify-center gap-4",
        isVisible ? "!opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Thumbs Up Button - Highlighted if published/ready */}
      <Button
        size="lg"
        variant="ghost"
        className={cn(
          "rounded-full h-14 w-14 p-0 transition-all",
          isPositiveStatus
            ? "bg-primary hover:bg-primary/90 border-2 border-primary shadow-lg scale-110"
            : "bg-background/80 backdrop-blur-sm hover:bg-primary/10 border-2 border-primary/20 hover:border-primary"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onThumbsUp();
        }}
        aria-label="Rate content positively"
      >
        <ThumbsUp
          className={cn(
            "h-7 w-7 transition-colors",
            isPositiveStatus ? "text-primary-foreground" : "text-primary"
          )}
          strokeWidth={2}
        />
      </Button>

      {/* Thumbs Down Button - Highlighted if rejected */}
      <Button
        size="lg"
        variant="ghost"
        className={cn(
          "rounded-full h-14 w-14 p-0 transition-all",
          isNegativeStatus
            ? "bg-destructive hover:bg-destructive/90 border-2 border-destructive shadow-lg scale-110"
            : "bg-background/80 backdrop-blur-sm hover:bg-destructive/10 border-2 border-destructive/20 hover:border-destructive"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onThumbsDown();
        }}
        aria-label="Rate content negatively"
      >
        <ThumbsDown
          className={cn(
            "h-7 w-7 transition-colors",
            isNegativeStatus ? "text-destructive-foreground" : "text-destructive"
          )}
          strokeWidth={2}
        />
      </Button>
    </div>
  );
}
