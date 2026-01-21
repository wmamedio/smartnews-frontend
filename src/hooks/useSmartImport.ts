"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  feedSourcesService,
  type SmartImportResponse,
  type FeedSource,
} from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";

/**
 * Result from smart import with keyword suggestions
 */
export interface SmartImportResult {
  smartImport: SmartImportResponse;
  suggestedKeywords: {
    good: string[];
    bad: string[];
  };
}

/**
 * Options for the useSmartImport hook
 */
export interface UseSmartImportOptions {
  /** Called when a single content is successfully imported */
  onSingleContentSuccess?: (result: SmartImportResponse) => void;
  /** Called when a continuous feed is detected - typically opens a wizard for keyword config */
  onContinuousFeedDetected?: (
    source: FeedSource,
    suggestedKeywords: { good: string[]; bad: string[] }
  ) => void;
  /** Called on any error */
  onError?: (error: any) => void;
  /** Whether to show toast notifications (default: true) */
  showToasts?: boolean;
  /** Whether to auto-approve single content (default: true) */
  autoApproveSingleContent?: boolean;
}

/**
 * Hook for smart importing URLs
 *
 * This hook provides a unified way to import URLs using the smart-import endpoint.
 * It handles:
 * - Auto-detection of URL type (single content vs continuous feed)
 * - Auto-approval of single content
 * - Fetching AI keyword suggestions for continuous feeds
 * - Query invalidation
 *
 * @example
 * ```tsx
 * const { importUrl, isPending } = useSmartImport({
 *   onSingleContentSuccess: (result) => {
 *     // Handle single content imported
 *   },
 *   onContinuousFeedDetected: (source, keywords) => {
 *     // Open wizard for keyword configuration
 *   },
 * });
 *
 * // Later:
 * importUrl("https://example.com/article");
 * ```
 */
export function useSmartImport(options: UseSmartImportOptions = {}) {
  const {
    onSingleContentSuccess,
    onContinuousFeedDetected,
    onError,
    showToasts = true,
    autoApproveSingleContent = true,
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (url: string): Promise<SmartImportResult> => {
      // Use smart-import endpoint for all URLs
      const result = await feedSourcesService.smartImport(url);

      // Auto-approve single content since it's manually curated
      if (
        autoApproveSingleContent &&
        result.classification === "single_content" &&
        result.is_new &&
        result.source_item?.id
      ) {
        await feedItemsService.updateStatus(result.source_item.id, "ready_for_publish");
      }

      // For continuous feeds, fetch AI keyword suggestions
      let suggestedKeywords = { good: [] as string[], bad: [] as string[] };
      if (result.classification === "continuous_feed") {
        try {
          const validation = await feedSourcesService.validateUrl(url);
          if (validation.suggested_keywords) {
            suggestedKeywords = {
              good: validation.suggested_keywords.good_keywords || [],
              bad: validation.suggested_keywords.bad_keywords || [],
            };
          }
        } catch (err) {
          console.warn("Failed to fetch keyword suggestions:", err);
        }
      }

      return { smartImport: result, suggestedKeywords };
    },
    onSuccess: ({ smartImport: result, suggestedKeywords }) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
      queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      queryClient.invalidateQueries({ queryKey: ["recent-feed-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });

      // Handle continuous feed - call callback for wizard opening
      if (result.classification === "continuous_feed") {
        if (showToasts) {
          const keywordCount = suggestedKeywords.good.length + suggestedKeywords.bad.length;
          toast.info(
            keywordCount > 0
              ? `Detected ${result.detected_type} feed with ${keywordCount} AI keyword suggestions.`
              : `Detected ${result.detected_type} feed: "${result.feed_source.name}". Configure keywords to filter content.`,
            { duration: 4000 }
          );
        }

        onContinuousFeedDetected?.(result.feed_source, suggestedKeywords);
        return;
      }

      // Single content - show success message
      const title = result.source_item?.title || "Content";
      if (showToasts) {
        toast.success(
          result.is_new ? `Content imported: "${title}"` : `Content already exists: "${title}"`,
          {
            action: {
              label: "View in Library",
              onClick: () => {
                window.location.href = "/content/library";
              },
            },
            duration: 5000,
          }
        );
      }

      onSingleContentSuccess?.(result);
    },
    onError: (error: any) => {
      console.error("Smart import failed:", error);
      if (showToasts) {
        toast.error("Failed to import content", {
          description: error.response?.data?.detail || "Please check the URL and try again",
        });
      }
      onError?.(error);
    },
  });

  return {
    /** Trigger smart import for a URL */
    importUrl: mutation.mutate,
    /** Trigger smart import and return promise */
    importUrlAsync: mutation.mutateAsync,
    /** Whether import is in progress */
    isPending: mutation.isPending,
    /** Whether import was successful */
    isSuccess: mutation.isSuccess,
    /** Whether import failed */
    isError: mutation.isError,
    /** Error from last import */
    error: mutation.error,
    /** Result from last successful import */
    data: mutation.data,
    /** Reset mutation state */
    reset: mutation.reset,
  };
}

/**
 * Helper to trigger pull and rescore after source creation/update
 * Call this after a continuous feed source is configured with keywords
 */
export async function pullAndRescoreSource(
  sourceId: number,
  queryClient: ReturnType<typeof useQueryClient>,
  options: { showToasts?: boolean; hideActionButton?: boolean } = {}
): Promise<void> {
  const { showToasts = true, hideActionButton = false } = options;

  if (showToasts) {
    toast.info("Pulling content from source...", { duration: 3000 });
  }

  try {
    // Pull content from the source (sync mode for immediate feedback)
    await feedSourcesService.pullContent(sourceId, false);

    // Rescore all items to apply keyword filtering
    await feedSourcesService.rescoreAll(sourceId);

    // Refresh queries to show new content
    queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
    queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });
    queryClient.invalidateQueries({ queryKey: ["feed-items"] });
    queryClient.invalidateQueries({ queryKey: ["recent-feed-items"] });

    if (showToasts) {
      toast.success("Source configured! Content is being imported.", {
        action: hideActionButton
          ? undefined
          : {
              label: "View Sources",
              onClick: () => {
                window.location.href = "/content/sources";
              },
            },
        duration: 5000,
      });
    }
  } catch (err) {
    console.error("Failed to pull/rescore source:", err);
    if (showToasts) {
      toast.error("Source saved, but content pull failed. Try pulling manually from Sources page.");
    }
    throw err;
  }
}
