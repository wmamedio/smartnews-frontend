"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import { cn } from "@/lib/utils";

export function FloatingQuickAdd() {
  const [url, setUrl] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's feeds
  const { data: feedsData } = useQuery({
    queryKey: ["creator-feeds"],
    queryFn: () => fetchCreatorFeeds({ limit: 100 }),
  });

  // Handle URL change
  const handleUrlChange = (value: string) => {
    setUrl(value);
  };

  // Handle focus - expand the form
  const handleFocus = () => {
    setIsExpanded(true);
  };

  // Handle blur - collapse if empty and dropdown not open
  const handleBlur = () => {
    // Keep expanded if there's content OR dropdown is open
    if (!url.trim() && !isDropdownOpen) {
      setIsExpanded(false);
    }
  };

  // Clear/Reset handler
  const handleClear = () => {
    setUrl("");
    setSelectedFeedId(null);
    setIsExpanded(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a URL");
      inputRef.current?.focus();
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Use smart-import for all URLs - it handles type detection automatically
      const result = await feedSourcesService.smartImport(url);

      toast.success("Source added successfully!", {
        description:
          result.classification === "single_content"
            ? `Imported: "${result.source_item.title}"`
            : "Added to your source library. Use it to create feeds.",
        action: {
          label: "View in Library",
          onClick: () => {
            window.location.href = "/content/library";
          },
        },
        duration: 5000,
      });

      // Reset form
      setUrl("");
      setSelectedFeedId(null);
      setIsExpanded(false);
    } catch (error: any) {
      console.error("Failed to add source:", error);
      toast.error("Failed to add source", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show controls when focused OR when there's content OR dropdown is open
  const showControls = isExpanded || url.trim().length > 0 || isDropdownOpen;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        showControls ? "w-[95%] max-w-3xl" : "w-[90%] max-w-[480px]"
      )}
    >
      <div className="rounded-xl border-2 border-primary bg-background shadow-2xl shadow-primary/20 backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <form
          onSubmit={handleSubmit}
          className={cn("transition-all duration-300 ease-in-out", showControls ? "p-2" : "p-0")}
        >
          {/* Desktop: Single Row Layout */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              {/* URL Input */}
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="url-input"
                  ref={inputRef}
                  type="url"
                  placeholder="Paste any URL - articles, RSS, YouTube, etc..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={cn(
                    "pl-11 pr-10 h-11 text-base",
                    "transition-all duration-200",
                    "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input",
                    showControls ? "border-2 border-input" : "border-none"
                  )}
                />
                {/* Clear button - Show when there's content */}
                {url.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear input"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Feed Selector - Show when focused or has content */}
              {showControls && (
                <div className="transition-all duration-200 w-[200px] flex-shrink-0">
                  <Select
                    value={selectedFeedId || "library"}
                    onValueChange={(value) => setSelectedFeedId(value === "library" ? null : value)}
                    disabled={isSubmitting}
                    onOpenChange={setIsDropdownOpen}
                  >
                    <SelectTrigger className="w-[200px] h-11">
                      <SelectValue placeholder="Select feed..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="library">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Library (No Feed)</span>
                        </div>
                      </SelectItem>
                      {feedsData?.feeds?.map((feed) => (
                        <SelectItem key={feed.id} value={feed.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feed.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Add Button - Show when focused or has content */}
              {showControls && (
                <div className="transition-all duration-200 flex-shrink-0">
                  <Button type="submit" disabled={isSubmitting} className="h-11 px-6">
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Progressive Disclosure Layout */}
          <div className="md:hidden">
            {/* URL Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="url-input-mobile"
                ref={inputRef}
                type="url"
                placeholder="Paste any URL to add content..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={cn(
                  "pl-11 pr-10 h-12 text-base",
                  "border-2 border-input",
                  "transition-all duration-200",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
                )}
              />
              {/* Clear button - Show when there's content */}
              {url.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Expanded Content - Show when focused or has content (Mobile Only) */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                showControls
                  ? "grid-rows-[1fr] opacity-100 mt-3"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-3">
                  {/* Feed Selector */}
                  <Select
                    value={selectedFeedId || "library"}
                    onValueChange={(value) => setSelectedFeedId(value === "library" ? null : value)}
                    disabled={isSubmitting}
                    onOpenChange={setIsDropdownOpen}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select feed..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="library">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Library (No Feed)</span>
                        </div>
                      </SelectItem>
                      {feedsData?.feeds?.map((feed) => (
                        <SelectItem key={feed.id} value={feed.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feed.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Add Button */}
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Source
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
