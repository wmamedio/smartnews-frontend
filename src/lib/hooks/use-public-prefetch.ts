"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  discoverFeeds,
  getFeedBySlug,
  getFeedNewsletters,
  getFeedCategories,
  getPublicItem,
} from "@/lib/api/services/discovery.service";

/**
 * Hook for prefetching public page data on hover
 * Provides instant navigation by preloading API data
 */
export function usePublicPrefetch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  /**
   * Prefetch discover page data (feeds list + categories)
   */
  const prefetchDiscover = useCallback(() => {
    // Prefetch route
    router.prefetch("/discover");

    // Prefetch discover feeds
    queryClient.prefetchQuery({
      queryKey: ["public-discover-feeds"],
      queryFn: () => discoverFeeds({ limit: 50 }),
      staleTime: 60 * 1000, // 1 minute
    });

    // Prefetch categories
    queryClient.prefetchQuery({
      queryKey: ["public-feed-categories"],
      queryFn: getFeedCategories,
      staleTime: 5 * 60 * 1000, // 5 minutes (categories change rarely)
    });
  }, [queryClient, router]);

  /**
   * Prefetch a specific feed page data
   */
  const prefetchFeedPage = useCallback(
    (feedSlug: string) => {
      // Prefetch route
      router.prefetch(`/feed/${feedSlug}`);

      // Prefetch feed details
      queryClient.prefetchQuery({
        queryKey: ["public-feed", feedSlug],
        queryFn: () => getFeedBySlug(feedSlug),
        staleTime: 60 * 1000,
      });
    },
    [queryClient, router]
  );

  /**
   * Prefetch a specific feed item page data
   * Uses the direct item lookup endpoint for efficient prefetching
   */
  const prefetchFeedItemPage = useCallback(
    (feedSlug: string, itemSlug: string) => {
      // Prefetch route
      router.prefetch(`/feed/${feedSlug}/${itemSlug}`);

      // Prefetch item directly using new endpoint
      queryClient.prefetchQuery({
        queryKey: ["public-feed-item", feedSlug, itemSlug],
        queryFn: () => getPublicItem(feedSlug, itemSlug),
        staleTime: 60 * 1000,
      });

      // Prefetch feed details (needed for sidebar)
      queryClient.prefetchQuery({
        queryKey: ["public-feed", feedSlug],
        queryFn: () => getFeedBySlug(feedSlug),
        staleTime: 60 * 1000,
      });
    },
    [queryClient, router]
  );

  return {
    prefetchDiscover,
    prefetchFeedPage,
    prefetchFeedItemPage,
  };
}
