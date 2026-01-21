"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, User, ThumbsUp, ThumbsDown, Play } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentPreviewItem {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  link: string;
  published_at?: string;
  author?: string;
  status?: string;
  feed_source?: {
    id: number;
    name: string;
    source_type: string;
  };
  feeds?: Array<string | { id: number; name: string; slug: string }>;
}

interface ContentPreviewModalProps {
  item: ContentPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enableRating?: boolean;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if it's a YouTube URL
    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
      return null;
    }

    // youtu.be/VIDEO_ID
    if (hostname.includes("youtu.be")) {
      return urlObj.pathname.slice(1) || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.searchParams.has("v")) {
      return urlObj.searchParams.get("v");
    }

    // youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
    const pathMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
    if (pathMatch) {
      return pathMatch[2];
    }

    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function ContentPreviewModal({
  item,
  open,
  onOpenChange,
  enableRating = false,
  onThumbsUp,
  onThumbsDown,
}: ContentPreviewModalProps) {
  if (!item) return null;

  // Extract domain from link for display
  let sourceDomain: string | null = null;
  try {
    sourceDomain = item.link ? new URL(item.link).hostname.replace("www.", "") : null;
  } catch {
    sourceDomain = null;
  }

  // Check if this is YouTube content
  const youtubeVideoId = item.link ? getYouTubeVideoId(item.link) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Content Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 overflow-y-auto flex-1 min-h-0">
          {/* YouTube Thumbnail with Play Button (opens YouTube directly to avoid embed restrictions) */}
          {youtubeVideoId ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-full aspect-video overflow-hidden rounded-lg bg-black block group cursor-pointer"
            >
              {/* YouTube thumbnail - use maxresdefault or hqdefault */}
              <Image
                src={
                  item.thumbnail || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`
                }
                alt={item.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 672px"
                onError={(e) => {
                  // Fallback to hqdefault if maxresdefault fails
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes("maxresdefault")) {
                    target.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
                  }
                }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-colors shadow-lg">
                  <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>
              {/* Watch on YouTube hint */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Watch on YouTube
              </div>
            </a>
          ) : item.thumbnail ? (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          ) : null}

          {/* Title */}
          <h2 className="text-xl font-bold leading-tight">{item.title}</h2>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Published date */}
            {item.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={item.published_at}>
                  {format(new Date(item.published_at), "MMMM d, yyyy")}
                </time>
              </div>
            )}

            {/* Author */}
            {item.author && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{item.author}</span>
              </div>
            )}

            {/* Source name */}
            {item.feed_source?.name && (
              <Badge variant="secondary" className="text-xs">
                {item.feed_source.name}
              </Badge>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions - Sticky at bottom */}
        <div className="pt-4 border-t flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4">
            {/* Rating Buttons - Left side */}
            {enableRating && onThumbsUp && onThumbsDown && item.status !== "published" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-9 px-3 gap-2 transition-all",
                    item.status === "ready_to_publish" || item.status === "ready_for_publish"
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "hover:bg-primary/10 hover:border-primary hover:text-primary"
                  )}
                  onClick={onThumbsUp}
                  aria-label="Rate content positively"
                >
                  <ThumbsUp className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden sm:inline">
                    {item.status === "ready_to_publish" || item.status === "ready_for_publish"
                      ? "Approved"
                      : "Approve"}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-9 px-3 gap-2 transition-all",
                    item.status === "rejected"
                      ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90"
                      : "hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                  )}
                  onClick={onThumbsDown}
                  aria-label="Rate content negatively"
                >
                  <ThumbsDown className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden sm:inline">
                    {item.status === "rejected" ? "Rejected" : "Reject"}
                  </span>
                </Button>
              </div>
            )}

            {/* Spacer when no rating buttons */}
            {(!enableRating || !onThumbsUp || !onThumbsDown || item.status === "published") && (
              <div />
            )}

            {/* Open Source Button - Right side */}
            <Button asChild className="w-full sm:w-auto">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open source at ${sourceDomain}`}
              >
                Open Source
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
