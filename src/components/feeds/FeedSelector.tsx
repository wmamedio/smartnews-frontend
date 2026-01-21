"use client";

import { Rss, Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatorFeeds } from "@/hooks/useCreatorFeeds";

interface FeedSelectorProps {
  /** Currently selected feed ID (or "new" for Create New Feed) */
  value?: number | "new";
  /** Callback when feed selection changes */
  onValueChange: (feedId: number | "new") => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional className for the trigger */
  className?: string;
  /** Show "Create New Feed" option */
  showCreateOption?: boolean;
}

/**
 * A dropdown selector for choosing a feed from the user's feeds.
 * Uses the useCreatorFeeds hook to fetch available feeds.
 */
export function FeedSelector({
  value,
  onValueChange,
  placeholder = "Select a feed",
  disabled = false,
  className,
  showCreateOption = false,
}: FeedSelectorProps) {
  const { feeds, isLoading } = useCreatorFeeds();

  // Filter out draft feeds - only show published/active feeds
  const publishedFeeds = feeds.filter((f) => f.status !== "draft");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 border rounded-md text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading feeds...
      </div>
    );
  }

  const handleValueChange = (val: string) => {
    if (val === "new") {
      onValueChange("new");
    } else {
      onValueChange(parseInt(val, 10));
    }
  };

  // Get display text for selected value
  const getSelectedText = () => {
    if (value === "new") {
      return "Create New Feed";
    }
    if (value) {
      return publishedFeeds.find((f) => f.id === value)?.name;
    }
    return undefined;
  };

  // Allow selecting "Create New Feed" even if no feeds exist
  const isDisabled = disabled || (!showCreateOption && publishedFeeds.length === 0);

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange} disabled={isDisabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value === "new" ? (
            <div className="flex items-center gap-2 text-primary">
              <Plus className="h-3 w-3" />
              Create New Feed
            </div>
          ) : (
            getSelectedText()
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {publishedFeeds.length === 0 && !showCreateOption ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No published feeds available
          </div>
        ) : (
          <>
            {publishedFeeds.map((feed) => (
              <SelectItem key={feed.id} value={feed.id.toString()}>
                <div className="flex items-center gap-2">
                  <Rss className="h-3 w-3 text-muted-foreground" />
                  {feed.name}
                </div>
              </SelectItem>
            ))}
            {showCreateOption && (
              <>
                {publishedFeeds.length > 0 && <SelectSeparator />}
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    Create New Feed
                  </div>
                </SelectItem>
              </>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
