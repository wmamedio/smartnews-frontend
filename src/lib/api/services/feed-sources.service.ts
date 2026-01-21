import apiClient from "../client";

/**
 * Source types supported by the backend
 */
export type SourceType =
  | "twitter"
  | "youtube"
  | "reddit"
  | "rss"
  | "manual_url"
  | "csv"
  | "bookmarks";

/**
 * Feed source response from backend
 * Matches: app__routers__feed_sources__FeedSourceResponse
 */
export interface FeedSource {
  id: number;
  name: string;
  source_type: SourceType;
  configuration: Record<string, any>; // Flexible config object (e.g., { url: "..." })
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_sync_at?: string;
  good_keywords?: string[]; // Include keywords - content must relate to these
  bad_keywords?: string[]; // Exclude keywords - filter out content related to these
  min_relevance_score?: number; // 0-100, AI filters content below this score
  sync_schedule?: number; // How often to check source for new content (in minutes)
  item_count: number; // Total number of items from this source
}

/**
 * Create feed source request
 * Matches: CreateFeedSourceRequest
 */
export interface CreateFeedSourceDTO {
  name: string;
  source_type: SourceType;
  configuration: Record<string, any>; // e.g., { url: "https://..." } for RSS
  good_keywords?: string[]; // Optional: Include keywords for AI filtering
  bad_keywords?: string[]; // Optional: Exclude keywords for AI filtering
  min_relevance_score?: number; // Optional: 0-100, default 50
  sync_schedule?: number; // Optional: Sync frequency in minutes (0=immediate, 1440=daily, 10080=weekly, 43200=monthly)
}

/**
 * Update feed source request
 * Matches: UpdateFeedSourceRequest
 */
export interface UpdateFeedSourceDTO {
  name?: string;
  source_type?: SourceType;
  configuration?: Record<string, any>;
  is_active?: boolean;
  good_keywords?: string[]; // Optional: Include keywords for AI filtering
  bad_keywords?: string[]; // Optional: Exclude keywords for AI filtering
  min_relevance_score?: number; // Optional: 0-100, default 50
  sync_schedule?: number; // Optional: Sync frequency in minutes
}

/**
 * Pull content response
 * Matches: PullFeedResponse
 */
export interface PullContentResponse {
  task_id: string;
  status: string;
  message: string;
}

/**
 * Smart import response - creates both source and item for single content
 */
export interface SmartImportResponse {
  feed_source: FeedSource;
  source_item: {
    id: number;
    title: string;
    description: string;
    link: string;
    thumbnail: string | null;
    author: string | null;
    status: string;
    published_at: string;
    created_at: string;
  };
  classification: "single_content" | "continuous_feed";
  detected_type: SourceType;
  is_new: boolean;
}

class FeedSourcesService {
  /**
   * Get all feed sources
   */
  async getAll(): Promise<FeedSource[]> {
    const response = await apiClient.get<FeedSource[]>("/feed-sources/");
    return response.data;
  }

  /**
   * Get a single feed source by ID
   */
  async getById(id: number): Promise<FeedSource> {
    const response = await apiClient.get<FeedSource>(`/feed-sources/${id}`);
    return response.data;
  }

  /**
   * Create a new feed source
   */
  async create(data: CreateFeedSourceDTO): Promise<FeedSource> {
    const response = await apiClient.post<FeedSource>("/feed-sources/", data);
    return response.data;
  }

  /**
   * Update an existing feed source
   */
  async update(id: number, data: UpdateFeedSourceDTO): Promise<FeedSource> {
    const response = await apiClient.put<FeedSource>(`/feed-sources/${id}`, data);
    return response.data;
  }

  /**
   * Delete a feed source
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/feed-sources/${id}`);
  }

  /**
   * Get connected social media accounts
   */
  async getConnectedSocialAccounts(): Promise<FeedSource[]> {
    const response = await apiClient.get<FeedSource[]>("/feed-sources/social-media/connected");
    return response.data;
  }

  /**
   * Trigger content pull from a feed source
   * @param feedSourceId - ID of the feed source to pull
   * @param asyncMode - If true, runs as background task; if false, runs synchronously
   */
  async pullContent(feedSourceId: number, asyncMode: boolean = true): Promise<PullContentResponse> {
    const response = await apiClient.post<PullContentResponse>(
      `/source-items/${feedSourceId}/pull`,
      null,
      {
        params: { async_mode: asyncMode },
      }
    );
    return response.data;
  }

  /**
   * Trigger rescoring for all items from a feed source
   * This extracts keywords and calculates relevance scores
   * @param feedSourceId - ID of the feed source to rescore
   */
  async rescoreAll(feedSourceId: number): Promise<{
    message: string;
    task_id: string;
    feed_source_id: number;
  }> {
    const response = await apiClient.post<{
      message: string;
      task_id: string;
      feed_source_id: number;
    }>(`/source-items/feed-sources/${feedSourceId}/rescore-all`);
    return response.data;
  }

  /**
   * Validate a URL before creating a source
   * @param url - The URL to validate
   * @returns Validation result with is_valid flag, optional message, and AI-suggested keywords
   */
  async validateUrl(url: string): Promise<{
    is_valid: boolean;
    message?: string;
    url?: string;
    suggested_keywords?: {
      good_keywords: string[];
      bad_keywords: string[];
    };
  }> {
    const response = await apiClient.post<{
      is_valid: boolean;
      message?: string;
      url?: string;
      suggested_keywords?: {
        good_keywords: string[];
        bad_keywords: string[];
      };
    }>("/feed-sources/validate-url", null, {
      params: { url },
    });
    return response.data;
  }

  /**
   * Smart import a URL - auto-classifies and creates source + item for single content
   * @param url - The URL to import
   * @returns Smart import response with source, item, and classification
   */
  async smartImport(url: string): Promise<SmartImportResponse> {
    const response = await apiClient.post<SmartImportResponse>("/feed-sources/smart-import", {
      url,
    });
    return response.data;
  }

  /**
   * Helper: Create an RSS feed source
   * @param name - Display name for the feed
   * @param url - RSS feed URL
   * @returns Created feed source
   */
  async createRSSFeed(name: string, url: string): Promise<FeedSource> {
    return this.create({
      name,
      source_type: "rss",
      configuration: { url },
    });
  }

  /**
   * Helper: Create a manual URL source
   * @param name - Display name for the source
   * @param url - URL to track
   * @returns Created feed source
   */
  async createManualUrl(name: string, url: string): Promise<FeedSource> {
    return this.create({
      name,
      source_type: "manual_url",
      configuration: { url },
    });
  }

  /**
   * Helper: Batch create RSS feeds from URLs
   * Note: Backend doesn't have OPML upload endpoint, so we create sources individually
   * @param feeds - Array of {name, url} objects
   * @returns Promise resolving to created sources and errors
   */
  async createBulkRSSFeeds(feeds: Array<{ name: string; url: string }>): Promise<{
    count: number;
    sources: FeedSource[];
    errors: Array<{ name: string; error: string }>;
  }> {
    const sources: FeedSource[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const feed of feeds) {
      try {
        const source = await this.createRSSFeed(feed.name, feed.url);
        sources.push(source);
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || error.message || "Unknown error";
        console.error(`Failed to create feed: ${feed.name}`, errorMessage);
        errors.push({ name: feed.name, error: errorMessage });
      }
    }

    return {
      count: sources.length,
      sources,
      errors,
    };
  }
}

export const feedSourcesService = new FeedSourcesService();
