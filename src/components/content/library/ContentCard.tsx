"use client";

import { Calendar, FileText, XCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/api/services/feed-items.service";
import { ContentRatingActions } from "@/components/content/preview/ContentRatingActions";

interface ContentCardProps {
  item: FeedItem;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit?: (item: FeedItem) => void;
  onPublish?: (item: FeedItem) => void;
  onArchive?: (item: FeedItem) => void;
  onDelete?: (item: FeedItem) => void;
  enableRating?: boolean; // Story 1.3.5: Enable rating overlay
  onRatingChange?: (itemId: number, newStatus: string) => void; // Story 1.3.5: Rating callback
  showSourceBadge?: boolean; // Show source name badge (for multi-source feeds)
  isHovered?: boolean; // Story 1.3.5: For showing rating overlay
  onThumbsUp?: () => void; // Story 1.3.5: Thumbs up callback
  onThumbsDown?: () => void; // Story 1.3.5: Thumbs down callback
  disableSelection?: boolean; // Story 0.1: Disable selection in preview step
  onPreview?: (item: FeedItem) => void; // Story 1.6.2: Open preview modal
}

export function ContentCard({
  item,
  isSelected,
  onSelect,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
  enableRating = false,
  onRatingChange,
  showSourceBadge = false,
  isHovered = false,
  onThumbsUp,
  onThumbsDown,
  disableSelection = false,
  onPreview,
}: ContentCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on checkbox area, rating buttons, or other interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("[data-checkbox-area]") ||
        e.target.closest("[data-rating-actions]") ||
        e.target.closest("button"))
    ) {
      return;
    }

    // Open preview on card click
    if (onPreview) {
      onPreview(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter key opens preview
    if (e.key === "Enter" && onPreview) {
      e.preventDefault();
      onPreview(item);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected && !disableSelection && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Content card: ${item.title}`}
    >
      {/* Selection Checkbox - Top Left with larger click area */}
      {!disableSelection && (
        <div
          data-checkbox-area
          className="absolute top-0 left-0 z-20 p-3 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(item.id)}
            className="bg-background/80 backdrop-blur-sm border-muted-foreground"
            aria-label={`Select ${item.title}`}
          />
        </div>
      )}

      {/* Thumbnail Image Area */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            className={cn(
              "object-cover w-full h-full group-hover:scale-105 transition-transform duration-200",
              // Apply opacity to image only for pending/rejected/published items
              (item.status === "pending" ||
                item.status === "rejected" ||
                item.status === "published") &&
                "opacity-40"
            )}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center h-full",
              (item.status === "pending" ||
                item.status === "rejected" ||
                item.status === "published") &&
                "opacity-40"
            )}
          >
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Status Badges - Top Right Corner */}
        {item.status === "pending" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 shadow-lg bg-muted text-muted-foreground border-none text-xs"
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">Pending</span>
            </Badge>
          </div>
        )}
        {item.status === "rejected" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="destructive"
              className="flex items-center gap-1.5 shadow-lg bg-destructive text-destructive-foreground border-none text-xs"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Rejected</span>
            </Badge>
          </div>
        )}
        {item.status === "published" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="flex items-center gap-1.5 shadow-md backdrop-blur-sm bg-primary text-primary-foreground border-primary text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Sent</span>
            </Badge>
          </div>
        )}

        {/* Rating Overlay - Only on image area (disabled for published items) */}
        {enableRating && onThumbsUp && onThumbsDown && item.status !== "published" && (
          <ContentRatingActions
            isVisible={isHovered}
            onThumbsUp={onThumbsUp}
            onThumbsDown={onThumbsDown}
            currentStatus={item.status}
          />
        )}
      </div>

      {/* Card Content */}
      <CardHeader className="p-4">
        <h3 className="text-sm font-medium line-clamp-2 mb-1">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </CardHeader>

      {/* Card Footer - Metadata & Actions */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {item.published_at
                ? format(new Date(item.published_at), "MMM d, yyyy")
                : format(new Date(item.created_at), "MMM d, yyyy")}
            </span>
          </div>
          {showSourceBadge && item.feed_source?.name && (
            <span className="text-muted-foreground/60 truncate max-w-[120px]">
              · {item.feed_source.name}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
