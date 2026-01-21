/**
 * Custom hook to fetch feed schedules (Story 1.3.4 workaround)
 *
 * TEMPORARY: This hook fetches schedules individually for each feed
 * using GET /feeds/{id}/schedule until backend updates /feeds endpoint
 * to include schedule data.
 *
 * TODO: Remove this hook once backend returns schedules in /feeds response
 */

import { useQueries } from "@tanstack/react-query";
import { feedSchedulesService } from "@/lib/api/services/feed-schedules.service";
import type { DeliveryScheduleResponse } from "@/lib/types/feed";

interface UseFeedSchedulesOptions {
  feedIds: number[];
  enabled?: boolean;
}

interface FeedScheduleData {
  feedId: number;
  schedule: DeliveryScheduleResponse | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch schedules for multiple feeds in parallel
 *
 * @param options.feedIds - Array of feed IDs to fetch schedules for
 * @param options.enabled - Whether queries are enabled (default: true)
 * @returns Array of feed schedule data with loading states
 *
 * @example
 * ```tsx
 * const feeds = [{ id: 1 }, { id: 2 }];
 * const schedules = useFeedSchedules({
 *   feedIds: feeds.map(f => f.id)
 * });
 *
 * // Get schedule for specific feed
 * const schedule = schedules.find(s => s.feedId === 1)?.schedule;
 * ```
 */
export function useFeedSchedules({ feedIds, enabled = true }: UseFeedSchedulesOptions) {
  const queries = useQueries({
    queries: feedIds.map((feedId) => ({
      queryKey: ["feed-schedule", feedId],
      queryFn: () => feedSchedulesService.getFeedSchedule(feedId),
      enabled,
      // Cache for 5 minutes to reduce API calls
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't retry on 404 (schedule doesn't exist)
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    })),
  });

  // Transform query results into a more convenient format
  const scheduleData: FeedScheduleData[] = queries.map((query, index) => ({
    feedId: feedIds[index],
    schedule: query.data || null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  }));

  return scheduleData;
}

/**
 * Get schedule for a specific feed from schedules array
 *
 * @param schedules - Array of feed schedules from useFeedSchedules
 * @param feedId - Feed ID to find schedule for
 * @returns Schedule data or null
 */
export function getFeedSchedule(
  schedules: FeedScheduleData[],
  feedId: number
): DeliveryScheduleResponse | null {
  return schedules.find((s) => s.feedId === feedId)?.schedule || null;
}
