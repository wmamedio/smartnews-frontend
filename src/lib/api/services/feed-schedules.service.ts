import apiClient from "../client";
import type {
  DeliveryScheduleCreate,
  DeliveryScheduleResponse,
  DeliverySchedulePreviewResponse,
} from "@/lib/types/feed";

/**
 * Feed Schedules Service (Story 1.3.4)
 * Manages delivery schedule CRUD operations for feeds
 *
 * Backend endpoints:
 * - POST /feeds/{feed_id}/schedule - Create/update schedule
 * - GET /feeds/{feed_id}/schedule - Get schedule
 * - DELETE /feeds/{feed_id}/schedule - Delete schedule
 * - POST /feeds/{feed_id}/schedule/preview - Preview schedule
 */
class FeedSchedulesService {
  /**
   * Create or update a feed delivery schedule
   * Backend uses upsert logic (creates if doesn't exist, updates if exists)
   *
   * @param feedId - ID of the feed
   * @param data - Schedule configuration
   * @returns Created/updated schedule with next_scheduled_at
   *
   * @example
   * ```typescript
   * const schedule = await feedSchedulesService.createFeedSchedule(123, {
   *   frequency: 10080, // Weekly
   *   delivery_time: "09:00",
   *   delivery_days: [1, 3, 5], // Mon, Wed, Fri
   *   timezone: "America/Los_Angeles",
   *   is_active: true
   * });
   * ```
   */
  async createFeedSchedule(
    feedId: number,
    data: DeliveryScheduleCreate
  ): Promise<DeliveryScheduleResponse> {
    const response = await apiClient.post<DeliveryScheduleResponse>(
      `/feeds/${feedId}/schedule`,
      data
    );
    return response.data;
  }

  /**
   * Get the delivery schedule for a feed
   * Returns null if no schedule exists (404 from backend)
   *
   * @param feedId - ID of the feed
   * @returns Schedule data or null if not found
   *
   * @example
   * ```typescript
   * const schedule = await feedSchedulesService.getFeedSchedule(123);
   * if (schedule) {
   *   console.log(`Next delivery: ${schedule.next_scheduled_at}`);
   * }
   * ```
   */
  async getFeedSchedule(feedId: number): Promise<DeliveryScheduleResponse | null> {
    try {
      const response = await apiClient.get<DeliveryScheduleResponse>(`/feeds/${feedId}/schedule`);
      return response.data;
    } catch (error: any) {
      // Return null if schedule doesn't exist (404)
      if (error.response?.status === 404) {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Delete a feed delivery schedule
   * Removes the automatic sending schedule from a feed
   *
   * @param feedId - ID of the feed
   * @returns void
   *
   * @example
   * ```typescript
   * await feedSchedulesService.deleteFeedSchedule(123);
   * // Schedule removed, feed will no longer auto-send
   * ```
   */
  async deleteFeedSchedule(feedId: number): Promise<void> {
    await apiClient.delete(`/feeds/${feedId}/schedule`);
  }

  /**
   * Preview the next 5 delivery times for a schedule configuration
   * Useful for showing users when their content will be sent before saving
   *
   * @param feedId - ID of the feed
   * @param data - Schedule configuration to preview
   * @returns Array of ISO timestamp strings for next 5 deliveries
   *
   * @example
   * ```typescript
   * const preview = await feedSchedulesService.previewFeedSchedule(123, {
   *   frequency: 10080, // Weekly
   *   delivery_time: "09:00",
   *   delivery_days: [1, 3, 5], // Mon, Wed, Fri
   *   timezone: "America/Los_Angeles",
   *   is_active: true
   * });
   * // preview.preview_dates = ["2025-01-27T09:00:00-08:00", ...]
   * ```
   */
  async previewFeedSchedule(
    feedId: number,
    data: DeliveryScheduleCreate
  ): Promise<DeliverySchedulePreviewResponse> {
    const response = await apiClient.post<DeliverySchedulePreviewResponse>(
      `/feeds/${feedId}/schedule/preview`,
      data
    );
    return response.data;
  }
}

// Export singleton instance
export const feedSchedulesService = new FeedSchedulesService();
