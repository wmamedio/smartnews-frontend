"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type FeedSource } from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { addSourceToFeed } from "@/lib/api/feeds";
import { AddSourceWizard } from "@/components/content/sources/AddSourceWizard";
import { FeedSelector } from "@/components/feeds/FeedSelector";
import { useSmartImport, pullAndRescoreSource } from "@/hooks/useSmartImport";
import { useCreatorFeeds } from "@/hooks/useCreatorFeeds";

export function QuickAddCard() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<number | "new" | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Get user's feeds
  const { feeds, isLoading: isLoadingFeeds } = useCreatorFeeds();

  // Auto-select the most recent non-draft feed
  useEffect(() => {
    if (feeds.length > 0 && !selectedFeedId) {
      // Find the most recent feed that's not a draft (published feeds first)
      const publishedFeeds = feeds.filter((f) => f.status !== "draft");
      if (publishedFeeds.length > 0) {
        // Sort by updated_at descending to get most recent
        const sortedFeeds = [...publishedFeeds].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setSelectedFeedId(sortedFeeds[0].id);
      } else if (feeds.length > 0) {
        // Fallback to first feed if all are drafts
        setSelectedFeedId(feeds[0].id);
      }
    }
  }, [feeds, selectedFeedId]);

  // State for AddSourceWizard when continuous feed is detected
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSource, setWizardSource] = useState<FeedSource | null>(null);
  const [wizardFeedId, setWizardFeedId] = useState<number | undefined>();
  const [wizardSuggestedKeywords, setWizardSuggestedKeywords] = useState<{
    good: string[];
    bad: string[];
  }>({ good: [], bad: [] });

  const { importUrl, isPending } = useSmartImport({
    onSingleContentSuccess: async (result) => {
      // Add source to the selected feed (only if a numeric feed ID is selected)
      if (selectedFeedId && selectedFeedId !== "new" && result.feed_source?.id) {
        try {
          await addSourceToFeed(selectedFeedId, result.feed_source.id);

          // For single content, also update item status to published
          if (result.is_new && result.source_item?.id) {
            await feedItemsService.updateStatus(result.source_item.id, "published");
          }

          queryClient.invalidateQueries({ queryKey: ["feeds"] });
          queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
        } catch (err) {
          console.error("Failed to add source to feed:", err);
          toast.error("Content imported but failed to add to feed");
        }
      }

      // Reset form after successful single content import
      setUrl("");
      inputRef.current?.focus();
    },
    onContinuousFeedDetected: (source, suggestedKeywords) => {
      // Set suggested keywords, source, and feed ID for wizard
      setWizardSuggestedKeywords(suggestedKeywords);
      setWizardSource(source);
      // Only set feed ID if it's a numeric ID (not "new")
      setWizardFeedId(selectedFeedId !== "new" ? selectedFeedId : undefined);
      setWizardOpen(true);

      // Reset form
      setUrl("");
    },
    // Don't auto-approve - we'll set to published after adding to feed
    autoApproveSingleContent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFeedId) {
      toast.error("Please select a feed first");
      return;
    }

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

    // If "Create New Feed" is selected, navigate to feed creation wizard
    if (selectedFeedId === "new") {
      router.push(`/feeds/create?url=${encodeURIComponent(url.trim())}`);
      return;
    }

    importUrl(url);
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      // Reset wizard state when closing
      setWizardSource(null);
      setWizardFeedId(undefined);
      setWizardSuggestedKeywords({ good: [], bad: [] });
      inputRef.current?.focus();
    }
  };

  const handleSourceCreated = async (sourceId?: number) => {
    // Refresh data after wizard completes
    queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
    queryClient.invalidateQueries({ queryKey: ["feed-items"] });

    // Add source to the selected feed (silently - no toast yet)
    if (sourceId && wizardFeedId) {
      try {
        await addSourceToFeed(wizardFeedId, sourceId);
        queryClient.invalidateQueries({ queryKey: ["feeds"] });
        queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
      } catch (err) {
        console.error("Failed to add source to feed:", err);
        toast.error("Source created but failed to add to feed");
        return;
      }
    }

    // For continuous feeds, trigger pull and rescore with single toast at end
    if (sourceId && wizardSource) {
      try {
        await pullAndRescoreSource(sourceId, queryClient, { showToasts: false });
        toast.success("Source added! Content is being imported.");
      } catch {
        // Error already shown by pullAndRescoreSource
      }
    }
  };

  // Only show feed selector when URL has content
  const isFeedSelectorVisible = url.trim().length > 0;

  return (
    <>
      <Card className="border-primary/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Quick Add Content
          </CardTitle>
          <CardDescription>
            Add articles, YouTube videos, or RSS feeds. AI helps you curate and review before
            publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* URL input */}
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url-input"
                ref={inputRef}
                type="url"
                placeholder="https://example.com/article..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                className="pl-9 h-10"
              />
            </div>

            {/* Feed selector - shown after URL is focused or has content */}
            {isFeedSelectorVisible && (
              <div className="space-y-1.5">
                <Label htmlFor="feed-select" className="text-xs text-muted-foreground">
                  Add to feed
                </Label>
                <FeedSelector
                  value={selectedFeedId}
                  onValueChange={setSelectedFeedId}
                  placeholder="Select a feed"
                  disabled={isPending || isLoadingFeeds}
                  showCreateOption={true}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending || !url.trim() || !selectedFeedId}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Content to Feed
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AddSourceWizard for continuous feeds - opens in edit mode */}
      <AddSourceWizard
        open={wizardOpen}
        onOpenChange={handleWizardClose}
        onSourceCreated={handleSourceCreated}
        source={wizardSource}
        initialSuggestedKeywords={wizardSuggestedKeywords}
        selectedFeedId={wizardFeedId}
        suppressToasts
      />
    </>
  );
}
