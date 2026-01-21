"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCreatorFeeds } from "@/lib/api/feeds";

/**
 * Hook to fetch and check creator's feeds
 * Used to determine if user can add sources/content (requires at least one feed)
 */
export function useCreatorFeeds() {
  const query = useQuery({
    queryKey: ["creator-feeds"],
    queryFn: () => fetchCreatorFeeds(),
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  return {
    feeds: query.data?.feeds || [],
    totalFeeds: query.data?.total || 0,
    hasFeeds: (query.data?.total || 0) > 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
