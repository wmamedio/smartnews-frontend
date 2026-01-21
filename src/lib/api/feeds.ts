import axios from "axios";
import type { Feed, FeedSchedule } from "@/lib/types/feed";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

export interface CreateFeedRequest {
  name: string;
  slug?: string; // URL slug (auto-generated if not provided)
  description?: string; // Use placeholder for drafts pending AI generation (Story 1.3.6)
  type?: "creator" | "editorial"; // Defaults to "creator"
  status?: "draft" | "published" | "archived"; // Defaults to "published"
  category_slugs?: string[]; // Use default placeholder for drafts (Story 1.3.6)
  feed_source_ids: number[]; // Array of feed source IDs (required)
  refresh_schedule?: number; // Schedule frequency (defaults to 0)
}

export interface UpdateFeedRequest {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  category_slugs?: string[];
  feed_source_ids?: number[];
  refresh_schedule?: number;
}

export interface AddFeedItemsRequest {
  feed_id: number;
  item_ids: number[];
}

export interface FeedsListResponse {
  feeds: Feed[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch creator's feeds
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with feeds list
 */
export async function fetchCreatorFeeds(params?: {
  limit?: number;
  offset?: number;
  is_published?: boolean;
}): Promise<FeedsListResponse> {
  const response = await axios.get<Feed[]>(`${API_URL}/feeds/creator/feeds`, {
    withCredentials: true,
  });

  // API returns array directly, wrap it in pagination format for frontend
  const feeds = response.data;
  return {
    feeds: feeds,
    total: feeds.length,
    limit: params?.limit || 50,
    offset: params?.offset || 0,
  };
}

/**
 * Fetch a single feed by ID
 * @param id - Feed ID
 * @returns Promise with feed data
 */
export async function fetchFeed(id: number): Promise<Feed> {
  const response = await axios.get<Feed>(`${API_URL}/feeds/${id}`, {
    withCredentials: true,
  });

  return response.data;
}

/**
 * Create a new feed
 * @param data - Feed creation data
 * @returns Promise with created feed
 */
export async function createFeed(data: CreateFeedRequest): Promise<Feed> {
  try {
    console.log("Creating feed with data:", JSON.stringify(data, null, 2));
    const response = await axios.post<Feed>(`${API_URL}/feeds/`, data, {
      withCredentials: true,
    });

    console.log("Feed created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating feed:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw error;
  }
}

/**
 * Update an existing feed
 * @param data - Feed update data including ID
 * @returns Promise with updated feed
 */
export async function updateFeed(data: UpdateFeedRequest): Promise<Feed> {
  const { id, ...updateData } = data;

  try {
    console.log(`[API] Updating feed ${id} with data:`, JSON.stringify(updateData, null, 2));
    const response = await axios.put<Feed>(`${API_URL}/feeds/${id}`, updateData, {
      withCredentials: true,
    });

    console.log(`[API] Feed ${id} updated successfully`);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error updating feed ${id}:`, error);
    console.error(`[API] Error response:`, error.response?.data);
    console.error(`[API] Error status:`, error.response?.status);
    throw error;
  }
}

/**
 * Delete a feed
 * @param id - Feed ID
 * @returns Promise with success status
 */
export async function deleteFeed(id: number): Promise<void> {
  try {
    await axios.delete(`${API_URL}/feeds/${id}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error(`Error deleting feed ${id}:`, error);
    throw error;
  }
}

/**
 * NOTE: The API does not support adding individual items to feeds.
 * Feeds work with feed sources (RSS, Twitter, etc.) that automatically pull items.
 * These functions are kept for backward compatibility but will need refactoring.
 */

/**
 * @deprecated - API doesn't support this endpoint
 * Add items to a feed (NOT SUPPORTED BY API)
 */
export async function addFeedItems(feedId: number, itemIds: number[]): Promise<void> {
  console.warn(
    "addFeedItems is not supported by the API. Feeds use feed_source_ids instead of individual items."
  );
  // No-op for now to prevent errors
  return Promise.resolve();
}

/**
 * @deprecated - API doesn't support this endpoint
 * Remove an item from a feed (NOT SUPPORTED BY API)
 */
export async function removeFeedItem(feedId: number, itemId: number): Promise<void> {
  console.warn("removeFeedItem is not supported by the API. Items come from feed sources.");
  // No-op for now to prevent errors
  return Promise.resolve();
}

/**
 * Publish a feed
 * @param id - Feed ID
 * @returns Promise with updated feed
 */
export async function publishFeed(id: number): Promise<Feed> {
  try {
    const response = await axios.put<Feed>(
      `${API_URL}/feeds/${id}`,
      { status: "published" },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error publishing feed ${id}:`, error);
    throw error;
  }
}

/**
 * Unpublish a feed (set to draft)
 * @param id - Feed ID
 * @returns Promise with updated feed
 */
export async function unpublishFeed(id: number): Promise<Feed> {
  try {
    const response = await axios.put<Feed>(
      `${API_URL}/feeds/${id}`,
      { status: "draft" },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error unpublishing feed ${id}:`, error);
    throw error;
  }
}

/**
 * Get feed preview URL
 * @param slug - Feed slug
 * @returns Preview URL
 */
export function getFeedPreviewUrl(slug: string): string {
  return `${API_URL}/feeds/${slug}/preview`;
}

/**
 * Get count of ready to publish items for a feed
 * Only counts items from the feed's currently attached sources
 * @param feedId - Feed ID
 * @returns Promise with count of ready_for_publish items
 */
export async function getReadyItemsCount(feedId: number): Promise<number> {
  try {
    // Step 1: Fetch the feed to get current source IDs
    const feedResponse = await axios.get(`${API_URL}/feeds/${feedId}`, {
      withCredentials: true,
    });

    const feed = feedResponse.data;
    const sourceIds = feed.feed_sources?.map((source: any) => source.id) || [];

    if (sourceIds.length === 0) {
      return 0;
    }

    // Step 2: Count items from current sources only
    let totalCount = 0;
    for (const sourceId of sourceIds) {
      const response = await axios.get(`${API_URL}/source-items/`, {
        params: {
          feed_source_id: sourceId,
          status: "ready_for_publish",
          page: 1,
          per_page: 1, // We only need the total count, not the items
        },
        withCredentials: true,
      });
      totalCount += response.data.total || 0;
    }

    return totalCount;
  } catch (error) {
    console.error(`Error fetching ready items count for feed ${feedId}:`, error);
    return 0;
  }
}

/**
 * Send feed immediately to subscribers
 * Creates a newsletter with all ready_for_publish items from the feed's current sources
 * and updates those items to published status
 * @param id - Feed ID (also sent as feed_id in newsletter creation request)
 * @returns Promise with send result including item count and subscriber count
 */
export async function sendFeed(id: number): Promise<{
  success: boolean;
  items_sent: number;
  subscribers_notified: number;
  message: string;
}> {
  try {
    // Step 1: Fetch the feed to get current source IDs
    const feedResponse = await axios.get(`${API_URL}/feeds/${id}`, {
      withCredentials: true,
    });

    const feed = feedResponse.data;
    const sourceIds = feed.feed_sources?.map((source: any) => source.id) || [];

    if (sourceIds.length === 0) {
      return {
        success: true,
        items_sent: 0,
        subscribers_notified: 0,
        message: "No sources attached to this feed",
      };
    }

    // Step 2: Fetch all ready_for_publish items from current sources only
    // Use pagination to fetch all items (max 100 per page)
    let allReadyItems: any[] = [];

    for (const sourceId of sourceIds) {
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const feedItemsResponse = await axios.get(`${API_URL}/source-items/`, {
          params: {
            feed_source_id: sourceId,
            status: "ready_for_publish",
            page: currentPage,
            per_page: 100, // Max allowed by API
          },
          withCredentials: true,
        });

        const items = feedItemsResponse.data.items || [];
        allReadyItems = [...allReadyItems, ...items];

        // Check if there are more pages
        const total = feedItemsResponse.data.total || 0;
        const fetchedCount = currentPage * 100;
        hasMorePages = fetchedCount < total;
        currentPage++;
      }
    }

    const feedItemIds = allReadyItems.map((item: any) => item.id);

    if (feedItemIds.length === 0) {
      return {
        success: true,
        items_sent: 0,
        subscribers_notified: 0,
        message: "No items ready to publish",
      };
    }

    // Step 3: Create newsletter with ready items
    const newsletterResponse = await axios.post(
      `${API_URL}/newsletters/`,
      {
        feed_id: id,
        source_item_ids: feedItemIds, // Backend expects source_item_ids not feed_item_ids
        trigger_type: "manual",
      },
      {
        withCredentials: true,
      }
    );

    // Step 4: Update all items to 'published' status
    await axios.post(
      `${API_URL}/source-items/bulk-action`,
      {
        item_ids: feedItemIds,
        action: "publish",
      },
      {
        withCredentials: true,
      }
    );

    // Return success response
    return {
      success: true,
      items_sent: feedItemIds.length,
      subscribers_notified: newsletterResponse.data.subscribers_count || 0,
      message: `Successfully sent ${feedItemIds.length} items`,
    };
  } catch (error: any) {
    console.error(`Error sending feed ${id}:`, error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
}

/**
 * Get AI-powered description and category suggestions for a feed (Story 1.3.6)
 *
 * Endpoint: GET /feeds/{feed_id}/suggestions
 *
 * @param feedId - The feed ID (must be owned by current creator)
 * @returns AI-generated description and 1-3 category suggestions
 * @throws {AxiosError} If feed not found (404), unauthorized (401), or server error (500)
 */
export async function getFeedSuggestions(feedId: number): Promise<{
  description: string;
  suggested_categories: string[];
  suggested_name?: string;
}> {
  try {
    console.log(`[Story 1.3.6] Fetching AI suggestions for feed ${feedId}`);

    const response = await axios.get(`${API_URL}/feeds/${feedId}/suggestions`, {
      withCredentials: true,
    });

    console.log("[Story 1.3.6] AI suggestions received:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[Story 1.3.6] Failed to get feed suggestions:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw error;
  }
}

// Removed getAllFeedStats function
// Backend will include subscriber_count directly in feed object from /feeds/creator/feeds endpoint

/**
 * Get all feed categories
 * @returns Promise with array of categories
 */
export async function getFeedCategories(): Promise<
  Array<{ id: number; name: string; slug: string }>
> {
  try {
    const response = await axios.get(`${API_URL}/feed-categories/`, {
      params: {
        limit: 100, // Get all categories
        offset: 0,
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch feed categories:", error);
    throw error;
  }
}

/**
 * Create a new feed category
 * @param name - Category name (e.g., "Travel Books")
 * @returns Promise with created category
 */
export async function createFeedCategory(name: string): Promise<{
  id: number;
  name: string;
  slug: string;
}> {
  try {
    console.log(`Creating new category: "${name}"`);

    const response = await axios.post(
      `${API_URL}/feed-categories/`,
      { name },
      {
        withCredentials: true,
      }
    );

    console.log("Category created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create category:", error);
    throw error;
  }
}

/**
 * Add a source to an existing feed
 * Fetches the current feed, appends the new source ID, and updates the feed
 * @param feedId - Feed ID to add the source to
 * @param sourceId - Source ID to add
 * @returns Promise with updated feed
 */
export async function addSourceToFeed(feedId: number, sourceId: number): Promise<Feed> {
  try {
    // Step 1: Fetch current feed to get existing source IDs
    const feed = await fetchFeed(feedId);
    const currentSourceIds = feed.feed_sources?.map((s) => s.id) || [];

    // Step 2: Check if source is already in the feed
    if (currentSourceIds.includes(sourceId)) {
      console.log(`Source ${sourceId} already exists in feed ${feedId}`);
      return feed;
    }

    // Step 3: Update feed with new source ID added
    const updatedFeed = await updateFeed({
      id: feedId,
      feed_source_ids: [...currentSourceIds, sourceId],
    });

    console.log(`Added source ${sourceId} to feed ${feedId}`);
    return updatedFeed;
  } catch (error: any) {
    console.error(`Failed to add source ${sourceId} to feed ${feedId}:`, error);
    throw error;
  }
}
