import axios from "axios";
import type { FeedItem } from "@/lib/types/feed";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

export interface FetchFeedItemsParams {
  limit?: number;
  offset?: number;
  search?: string;
  source?: string;
  category?: string;
  sort_by?: "created_at" | "published_at" | "title";
  sort_order?: "asc" | "desc";
}

export interface FeedItemsResponse {
  items: FeedItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch feed items from the API
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with feed items and pagination info
 */
export async function fetchFeedItems(
  params: FetchFeedItemsParams = {}
): Promise<FeedItemsResponse> {
  try {
    const response = await axios.get<FeedItemsResponse>(`${API_URL}/source-items/`, {
      params: {
        limit: params.limit || 50,
        offset: params.offset || 0,
        search: params.search,
        source: params.source,
        category: params.category,
        sort_by: params.sort_by || "published_at",
        sort_order: params.sort_order || "desc",
      },
      withCredentials: true, // Include cookies for authentication
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching feed items:", error);
    // Return empty result on error
    return {
      items: [],
      total: 0,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };
  }
}

/**
 * Fetch a single feed item by ID
 * @param id - Feed item ID
 * @returns Promise with feed item data
 */
export async function fetchFeedItem(id: number): Promise<FeedItem | null> {
  try {
    const response = await axios.get<FeedItem>(`${API_URL}/source-items/${id}`, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching feed item ${id}:`, error);
    return null;
  }
}
