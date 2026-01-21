"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, InfoIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ContentCard } from "@/components/content/library/ContentCard";
import { KeywordRefinementDialog } from "@/components/content/preview/KeywordRefinementDialog";
import { WizardNavigation } from "./WizardNavigation";
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { feedItemsService, type FeedItem } from "@/lib/api/services/feed-items.service";
import { useContentRating } from "@/hooks/useContentRating";
import { toast } from "sonner";

interface FeedPreviewStepProps {
  onNext?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

/**
 * Story 1.3.5: Feed Preview Step (Step 4 of 5)
 *
 * Allows creators to preview content from selected sources before finalizing the feed.
 * Shows ready_to_publish items by default with option to show rejected content.
 * Integrates thumbs up/down rating and keyword refinement workflow.
 */
export function FeedPreviewStep({ onNext, onBack, onCancel }: FeedPreviewStepProps) {
  const { selectedSourceIds, feedId } = useFeedBuilderStore();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  // Content rating hook - centralizes all rating logic
  const {
    handleRating: baseHandleRating,
    handleAddKeywords,
    keywordDialogOpen,
    setKeywordDialogOpen,
    keywordDialogData,
  } = useContentRating({
    feedId: feedId || undefined,
    invalidateQueryKeys: [],
    onRatingSuccess: (item, rating) => {
      // Update local state after successful rating
      const newStatus = rating === "up" ? "ready_for_publish" : "rejected";
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
    },
  });

  // Wrap rating handler to ensure FeedItem type compatibility
  const handleRating = (item: FeedItem, rating: "up" | "down") => {
    baseHandleRating(item, rating);
  };

  const fetchItems = useCallback(async () => {
    if (selectedSourceIds.length === 0) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch items from all selected sources
      const allItems: FeedItem[] = [];
      for (const sourceId of selectedSourceIds) {
        const response = await feedItemsService.getAll({
          feed_source_id: sourceId,
          per_page: 50,
        });
        allItems.push(...response.items);
      }
      setItems(allItems);
    } catch (err) {
      console.error("Failed to fetch feed items:", err);
      setError("Failed to load content preview. Please try again.");
      toast.error("Failed to load content preview");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSourceIds]);

  // Fetch items from all selected sources
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Memoized no-op function for disabled selection
  const handleSelect = useCallback(() => {
    // Do nothing - selection is disabled in preview step
  }, []);

  // Filter items based on showRejected toggle
  const filteredItems = showRejected
    ? items
    : items.filter((item) => item.status === "ready_for_publish");

  const readyCount = items.filter((item) => item.status === "ready_for_publish").length;
  const rejectedCount = items.filter((item) => item.status === "rejected").length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Preview Your Feed</CardTitle>
          <CardDescription>
            Review and rate content from your selected sources before publishing. Hover over cards
            to rate content.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Show Rejected Content Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="show-rejected" checked={showRejected} onCheckedChange={setShowRejected} />
              <Label htmlFor="show-rejected" className="cursor-pointer">
                Show Rejected Content
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              {showRejected ? (
                <>
                  Showing {readyCount} ready + {rejectedCount} rejected items
                </>
              ) : (
                <>Showing {readyCount} items ready to publish</>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Empty State - No Sources */}
          {!isLoading && !error && selectedSourceIds.length === 0 && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                No sources selected. Go back to Step 2 to add sources to your feed.
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State - No Content */}
          {!isLoading && !error && selectedSourceIds.length > 0 && items.length === 0 && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                No content has been imported from your sources yet. Content will appear here after
                the first sync.
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State - No Ready Items */}
          {!isLoading &&
            !error &&
            items.length > 0 &&
            filteredItems.length === 0 &&
            !showRejected && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  No content ready to publish yet. Add sources or adjust filters to see content.
                </AlertDescription>
              </Alert>
            )}

          {/* Content Grid */}
          {!isLoading && !error && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  <ContentCard
                    item={item}
                    isSelected={false}
                    onSelect={handleSelect}
                    showSourceBadge={selectedSourceIds.length > 1}
                    enableRating={true}
                    isHovered={hoveredItemId === item.id}
                    onThumbsUp={() => handleRating(item, "up")}
                    onThumbsDown={() => handleRating(item, "down")}
                    disableSelection={true} // Story 0.1: Disable selection in preview step
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack}
        onNext={onNext}
        backLabel="Back"
        nextLabel="Next: Publishing"
      />

      {/* Keyword Refinement Dialog */}
      {keywordDialogData && (
        <KeywordRefinementDialog
          open={keywordDialogOpen}
          onOpenChange={setKeywordDialogOpen}
          keywords={keywordDialogData.keywords}
          mode={keywordDialogData.mode}
          onAddKeywords={handleAddKeywords}
          sourceName={keywordDialogData.sourceName}
          feedId={feedId || undefined}
        />
      )}
    </>
  );
}
