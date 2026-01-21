"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  feedItemsService,
  type FeedItem,
  type FeedItemStatus,
} from "@/lib/api/services/feed-items.service";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import {
  shouldSkipKeywordDialog,
  shouldSkipKeywordDialogLibrary,
} from "@/lib/utils/keyword-dialog-preferences";

/**
 * Data for the keyword refinement dialog
 */
export interface KeywordDialogData {
  keywords: string[];
  mode: "good" | "bad";
  itemId: number;
  sourceId: number;
  sourceName: string;
  existingKeywords: string[];
}

/**
 * Options for the useContentRating hook
 */
export interface UseContentRatingOptions {
  /** Feed ID for "skip dialog for this feed today" feature */
  feedId?: number;
  /** Whether this is used in the Library context (for skip preference) */
  isLibraryContext?: boolean;
  /** Query keys to invalidate after rating */
  invalidateQueryKeys?: string[][];
  /** Callback after successful rating (before dialog opens) */
  onRatingSuccess?: (item: FeedItem, rating: "up" | "down") => void;
}

/**
 * Hook for content rating functionality with keyword extraction and refinement.
 *
 * This hook centralizes the rating logic used across:
 * - ContentCardGrid (Library page)
 * - FeedPreviewStep (Feed wizard)
 * - Dashboard page
 *
 * Features:
 * - Updates item status (ready_for_publish or rejected)
 * - Extracts keywords via rescore if needed
 * - Filters out existing source keywords from suggestions
 * - Manages keyword dialog state
 * - Adds keywords to source
 *
 * @example
 * ```tsx
 * const {
 *   handleRating,
 *   handleAddKeywords,
 *   keywordDialogOpen,
 *   setKeywordDialogOpen,
 *   keywordDialogData,
 * } = useContentRating({
 *   isLibraryContext: true,
 *   invalidateQueryKeys: [["feed-items"]],
 * });
 *
 * // In JSX:
 * <ContentCard onThumbsUp={() => handleRating(item, "up")} />
 * <KeywordRefinementDialog
 *   open={keywordDialogOpen}
 *   onOpenChange={setKeywordDialogOpen}
 *   keywords={keywordDialogData?.keywords || []}
 *   mode={keywordDialogData?.mode || "good"}
 *   onAddKeywords={handleAddKeywords}
 *   sourceName={keywordDialogData?.sourceName}
 * />
 * ```
 */
export function useContentRating(options: UseContentRatingOptions = {}) {
  const { feedId, isLibraryContext = false, invalidateQueryKeys = [], onRatingSuccess } = options;

  const queryClient = useQueryClient();

  // Dialog state
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false);
  const [keywordDialogData, setKeywordDialogData] = useState<KeywordDialogData | null>(null);

  // Track keywords that have been added during this session (per source)
  // This prevents showing the same keyword again after it's been added
  const [addedKeywordsBySource, setAddedKeywordsBySource] = useState<Map<number, Set<string>>>(
    new Map()
  );

  /**
   * Handle rating a content item (thumbs up/down)
   */
  const handleRating = async (item: FeedItem, rating: "up" | "down") => {
    const newStatus: FeedItemStatus = rating === "up" ? "ready_for_publish" : "rejected";
    const originalStatus = item.status;

    try {
      // Step 1: Update item status
      await feedItemsService.updateStatus(item.id, newStatus);

      // Step 2: Fetch item with keywords
      let itemWithKeywords = await feedItemsService.getWithKeywords(item.id);

      // Step 2b: If keywords are empty AND item was originally pending, trigger rescore
      if (!itemWithKeywords.keywords || itemWithKeywords.keywords.length === 0) {
        if (originalStatus === "pending") {
          console.log(`No keywords found for pending item ${item.id}, triggering rescore...`);
          toast.info("Extracting keywords...", { duration: 2000 });
          try {
            itemWithKeywords = await feedItemsService.rescoreAndWaitForKeywords(item.id);
            console.log("Rescore complete, keywords:", itemWithKeywords.keywords);

            // Rescore may change status - restore user's intended status
            if (itemWithKeywords.status !== newStatus) {
              console.log(
                `Rescore changed status to ${itemWithKeywords.status}, restoring: ${newStatus}`
              );
              await feedItemsService.updateStatus(item.id, newStatus);
            }
          } catch (rescoreError) {
            console.error("Rescore failed:", rescoreError);
          }
        }
      }

      // Step 3: Invalidate queries to refresh lists
      for (const queryKey of invalidateQueryKeys) {
        queryClient.invalidateQueries({ queryKey });
      }
      // Always invalidate feed-items as a default
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });

      // Callback for custom handling (e.g., updating local state)
      onRatingSuccess?.(item, rating);

      // Step 4: Check if keyword dialog should be skipped
      const shouldSkip = feedId
        ? shouldSkipKeywordDialog(feedId)
        : isLibraryContext
          ? shouldSkipKeywordDialogLibrary()
          : false;

      if (shouldSkip) {
        console.log("Skipping keyword dialog (user preference)");
      } else if (itemWithKeywords.keywords && itemWithKeywords.keywords.length > 0) {
        // Fetch existing source keywords to filter them out
        let existingKeywords: string[] = [];
        try {
          const source = await feedSourcesService.getById(item.feed_source_id);
          existingKeywords = [...(source.good_keywords || []), ...(source.bad_keywords || [])];
          console.log("Existing source keywords:", existingKeywords);
        } catch (err) {
          console.warn("Failed to fetch source keywords:", err);
        }

        // Also get keywords added during this session for this source
        const sessionAddedKeywords = addedKeywordsBySource.get(item.feed_source_id) || new Set();

        // Filter out keywords that already exist OR were added this session (case-insensitive)
        const newKeywords = itemWithKeywords.keywords.filter(
          (kw) =>
            !existingKeywords.some((existing) => existing.toLowerCase() === kw.toLowerCase()) &&
            !sessionAddedKeywords.has(kw.toLowerCase())
        );

        // Only show dialog if there are new keywords to suggest
        if (newKeywords.length > 0) {
          setKeywordDialogData({
            keywords: newKeywords,
            mode: rating === "up" ? "good" : "bad",
            itemId: item.id,
            sourceId: item.feed_source_id,
            sourceName: item.feed_source?.name || "Unknown Source",
            existingKeywords,
          });
          setKeywordDialogOpen(true);
        } else {
          toast.info("Content rated. Keywords already configured for this source.");
        }
      } else {
        toast.info("Content rated. No keywords found to add.");
      }

      // Show rating toast
      if (rating === "up") {
        toast.success("Content marked as ready to publish");
      } else {
        toast.error("Content marked as rejected");
      }
    } catch (err) {
      console.error("Failed to rate content:", err);
      toast.error("Failed to update content rating. Please try again.");
    }
  };

  /**
   * Handle adding selected keywords to the source
   */
  const handleAddKeywords = async (selectedKeywords: string[]) => {
    if (!keywordDialogData) return;

    try {
      // Fetch current source to get existing keywords
      const source = await feedSourcesService.getById(keywordDialogData.sourceId);

      // Merge keywords based on mode
      const updatedKeywords =
        keywordDialogData.mode === "good"
          ? {
              good_keywords: [...new Set([...(source.good_keywords || []), ...selectedKeywords])],
            }
          : {
              bad_keywords: [...new Set([...(source.bad_keywords || []), ...selectedKeywords])],
            };

      // Update source
      await feedSourcesService.update(keywordDialogData.sourceId, updatedKeywords);

      // Track added keywords so they won't show again in this session
      setAddedKeywordsBySource((prev) => {
        const updated = new Map(prev);
        const existingSet = updated.get(keywordDialogData.sourceId) || new Set();
        selectedKeywords.forEach((kw) => existingSet.add(kw.toLowerCase()));
        updated.set(keywordDialogData.sourceId, existingSet);
        return updated;
      });

      toast.success(
        `Added ${selectedKeywords.length} keyword${selectedKeywords.length !== 1 ? "s" : ""} to ${keywordDialogData.sourceName}. Changes will only affect future content.`
      );
    } catch (err) {
      console.error("Failed to update source keywords:", err);
      toast.error("Failed to add keywords to source. Please try again.");
    }
  };

  return {
    // Rating function
    handleRating,
    // Keyword dialog state
    keywordDialogOpen,
    setKeywordDialogOpen,
    keywordDialogData,
    // Keyword handler
    handleAddKeywords,
  };
}
