import apiClient from "../client";

/**
 * Feed item status enum
 * Matches: FeedItemStatus from backend
 */
export type FeedItemStatus =
  | "pending"
  | "ready_for_publish"
  | "published"
  | "rejected"
  | "draft"
  | "scheduled";

/**
 * Nested feed source info in feed item response
 * Matches: FeedSourceInfo
 */
export interface FeedSourceInfo {
  id: number;
  name: string;
  source_type: string;
}

/**
 * Feed item response from backend
 * Matches: FeedItemResponse
 */
export interface FeedItem {
  id: number;
  feed_source_id: number;
  feed_source: FeedSourceInfo; // Nested object from backend
  title: string;
  description?: string;
  link: string; // Backend uses 'link' not 'url'
  thumbnail?: string;
  status: FeedItemStatus;
  external_id?: string;
  author?: string;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  content_hash: string;
  content_url?: string;
  meta_data?: Record<string, any>;
  feeds?: Array<string | { id: number; name: string; slug: string }>; // Feed names or objects this item belongs to
  feed_ids?: number[]; // Feed IDs this item belongs to
  keywords?: string[]; // Extracted keywords from content
}

/**
 * Feed item with extracted keywords
 * Used for keyword refinement workflow
 * Note: Now just an alias since FeedItem includes keywords
 */
export interface FeedItemWithKeywords extends FeedItem {
  // keywords already in FeedItem
}

/**
 * Create feed item request (for manual entry)
 */
export interface CreateFeedItemDTO {
  feed_source_id: number;
  title: string;
  description?: string;
  link: string;
  author?: string;
  published_at?: string;
  status?: FeedItemStatus;
}

/**
 * Update feed item request
 * Matches: UpdateFeedItemRequest
 */
export interface UpdateFeedItemDTO {
  title?: string;
  description?: string;
  status?: FeedItemStatus;
  author?: string;
  thumbnail?: string;
  meta_data?: Record<string, any>;
}

export interface FeedItemFilters {
  search?: string;
  feed_source_id?: number;
  feed_id?: number; // Story 1.3.5: Filter by feed
  source_type?: string; // Filter by source type (rss, youtube, manual_url, etc.)
  status?: FeedItemStatus;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedFeedItems {
  items: FeedItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Bulk action request
 * Matches: BulkActionRequest
 */
export interface BulkActionDTO {
  item_ids: number[];
  action: string; // Backend accepts any string action
}

/**
 * Bulk action response
 */
export interface BulkActionResponse {
  success: boolean;
  updated_count: number;
  message?: string;
}

class FeedItemsService {
  /**
   * Get paginated feed items with optional filters
   */
  async getAll(filters?: FeedItemFilters): Promise<PaginatedFeedItems> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.feed_source_id) params.append("feed_source_id", filters.feed_source_id.toString());
    if (filters?.feed_id) params.append("feed_id", filters.feed_id.toString()); // Story 1.3.5
    if (filters?.source_type) params.append("source_type", filters.source_type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.per_page) params.append("per_page", filters.per_page.toString());

    const response = await apiClient.get<PaginatedFeedItems>(`/source-items/?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a single feed item by ID
   */
  async getById(id: number): Promise<FeedItem> {
    const response = await apiClient.get<FeedItem>(`/source-items/${id}`);
    return response.data;
  }

  /**
   * Create a new feed item manually
   * Note: Backend may not have manual creation endpoint, use pull instead
   */
  async create(data: CreateFeedItemDTO): Promise<FeedItem> {
    const response = await apiClient.post<FeedItem>("/source-items/", data);
    return response.data;
  }

  /**
   * Update an existing feed item
   */
  async update(id: number, data: UpdateFeedItemDTO): Promise<FeedItem> {
    const response = await apiClient.put<FeedItem>(`/source-items/${id}`, data);
    return response.data;
  }

  /**
   * Delete a feed item
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/source-items/${id}`);
  }

  /**
   * Perform bulk action on multiple items
   * Matches: POST /source-items/bulk-action
   */
  async bulkAction(data: BulkActionDTO): Promise<BulkActionResponse> {
    const response = await apiClient.post<BulkActionResponse>("/source-items/bulk-action", data);
    return response.data;
  }

  /**
   * Helper: Bulk publish items
   * Sets status to "ready_for_publish"
   */
  async bulkPublish(itemIds: number[]): Promise<BulkActionResponse> {
    // Try updating status directly instead of using bulk-action endpoint
    return this.bulkUpdateStatus(itemIds, "ready_for_publish");
  }

  /**
   * Helper: Bulk archive items
   * Sets status to "rejected" (archived state)
   */
  async bulkArchive(itemIds: number[]): Promise<BulkActionResponse> {
    // Try updating status directly instead of using bulk-action endpoint
    return this.bulkUpdateStatus(itemIds, "rejected");
  }

  /**
   * Helper: Bulk update status for multiple items
   * Alternative approach if bulk-action endpoint doesn't work
   */
  private async bulkUpdateStatus(
    itemIds: number[],
    status: FeedItemStatus
  ): Promise<BulkActionResponse> {
    try {
      // Try individual updates
      let updated_count = 0;
      for (const id of itemIds) {
        try {
          await this.update(id, { status });
          updated_count++;
        } catch (error) {
          console.error(`Failed to update item ${id}:`, error);
        }
      }

      return {
        success: true,
        updated_count,
        message: `Updated ${updated_count} of ${itemIds.length} items`,
      };
    } catch (error) {
      console.error("Bulk update failed:", error);
      throw error;
    }
  }

  /**
   * Helper: Bulk delete items
   */
  async bulkDelete(itemIds: number[]): Promise<BulkActionResponse> {
    return this.bulkAction({ item_ids: itemIds, action: "delete" });
  }

  /**
   * Get feed item by content hash
   * Public endpoint (no auth required)
   */
  async getByHash(contentHash: string): Promise<FeedItem> {
    const response = await apiClient.get<FeedItem>(`/source-items/by-hash/${contentHash}`);
    return response.data;
  }

  /**
   * Get statistics for a feed source
   */
  async getSourceStats(feedSourceId: number): Promise<{
    feed_source_id: number;
    feed_source_name: string;
    total_items: number;
    stats_by_status: Record<string, number>;
    last_sync_at: string | null;
    is_active: boolean;
  }> {
    const response = await apiClient.get(`/source-items/${feedSourceId}/stats`);
    return response.data;
  }

  /**
   * Story 1.3.5: Update feed item status only
   * Used for thumbs up/down rating workflow
   */
  async updateStatus(id: number, status: FeedItemStatus): Promise<FeedItem> {
    const response = await apiClient.put<FeedItem>(`/source-items/${id}`, { status });
    return response.data;
  }

  /**
   * Story 1.3.5: Get feed item with extracted keywords
   * Used for keyword refinement after rating
   */
  async getWithKeywords(id: number): Promise<FeedItemWithKeywords> {
    const response = await apiClient.get<FeedItemWithKeywords>(`/source-items/${id}`);
    return response.data;
  }

  /**
   * Trigger rescoring for a source item to extract keywords
   * Returns a task ID that can be polled for completion
   */
  async rescore(id: number): Promise<{ message: string; task_id: string; source_item_id: number }> {
    const response = await apiClient.post<{
      message: string;
      task_id: string;
      source_item_id: number;
    }>(`/source-items/${id}/rescore`);
    return response.data;
  }

  /**
   * Check the status of a background task
   */
  async getTaskStatus(taskId: string): Promise<{
    task_id: string;
    status: "PENDING" | "SUCCESS" | "FAILURE";
    result?: {
      status: string;
      feed_item_id: number;
      relevance_score: number;
    };
  }> {
    const response = await apiClient.get(`/tasks/test/${taskId}`);
    return response.data;
  }

  /**
   * Rescore an item and wait for keywords to be extracted
   * Polls the task status until complete, then returns the updated item
   * @param id - Source item ID
   * @param maxAttempts - Maximum polling attempts (default 10)
   * @param pollInterval - Interval between polls in ms (default 500)
   */
  async rescoreAndWaitForKeywords(
    id: number,
    maxAttempts = 10,
    pollInterval = 500
  ): Promise<FeedItemWithKeywords> {
    // Trigger rescore
    const { task_id } = await this.rescore(id);

    // Poll for task completion
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const taskStatus = await this.getTaskStatus(task_id);

      if (taskStatus.status === "SUCCESS") {
        // Task complete, fetch updated item with keywords
        return this.getWithKeywords(id);
      }

      if (taskStatus.status === "FAILURE") {
        throw new Error("Keyword extraction failed");
      }

      // Still pending, continue polling
    }

    // Max attempts reached, return item anyway (might not have keywords)
    console.warn(`Rescore task ${task_id} did not complete within ${maxAttempts} attempts`);
    return this.getWithKeywords(id);
  }
}

export const feedItemsService = new FeedItemsService();
