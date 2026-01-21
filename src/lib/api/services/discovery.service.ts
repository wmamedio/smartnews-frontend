/**
 * Public Feed Discovery API Service (Story 1.6)
 * Handles public feed browsing (no authentication required)
 */

import apiClient from "../client";
import type {
  PublicFeed,
  FeedCategoryInfo,
  DiscoverFeedsParams,
  CreatorFeedItemResponse,
  PublicFeedItem,
} from "@/lib/types/feed";

/**
 * Discover public feeds (unauthenticated endpoint)
 * GET /public/feeds/discover
 */
export async function discoverFeeds(params?: DiscoverFeedsParams): Promise<PublicFeed[]> {
  const response = await apiClient.get<{ feeds: PublicFeed[] }>("/public/feeds/discover", {
    params: {
      query: params?.query,
      category: params?.category,
      creator: params?.creator,
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    },
  });
  return response.data.feeds;
}

/**
 * Get trending feeds (unauthenticated endpoint)
 * GET /public/feeds/trending
 */
export async function getTrendingFeeds(limit: number = 10): Promise<PublicFeed[]> {
  const response = await apiClient.get<{ feeds: PublicFeed[] } | PublicFeed[]>(
    "/public/feeds/trending",
    {
      params: { limit },
    }
  );
  // Handle both response formats (array or object with feeds property)
  return Array.isArray(response.data) ? response.data : response.data.feeds;
}

/**
 * Get all available feed categories
 * GET /public/feeds/categories
 */
export async function getFeedCategories(): Promise<FeedCategoryInfo[]> {
  const response = await apiClient.get<{ categories: FeedCategoryInfo[] } | FeedCategoryInfo[]>(
    "/public/feeds/categories"
  );
  // Handle both response formats (array or object with categories property)
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return (response.data as any).categories || [];
}

/**
 * Preview a specific feed by slug (unauthenticated endpoint)
 * GET /public/feeds/{slug}/preview
 */
export async function previewFeed(slug: string): Promise<any> {
  const response = await apiClient.get(`/public/feeds/${slug}/preview`);
  return response.data;
}

/**
 * Get creator's top feed items (for viewing subscribed feed content)
 * GET /creators/{creator_hash}/feed-items
 */
export async function getCreatorFeedItems(
  creatorHash: string,
  params?: {
    limit?: number;
    status?: string;
  }
): Promise<CreatorFeedItemResponse[]> {
  const response = await apiClient.get<CreatorFeedItemResponse[]>(
    `/creators/${creatorHash}/feed-items`,
    {
      params: {
        limit: params?.limit || 10,
        status: params?.status || "published",
      },
    }
  );
  return response.data;
}

/**
 * Get creator public stats
 * GET /creators/{creator_hash}/stats
 */
export async function getCreatorStats(creatorHash: string): Promise<any> {
  const response = await apiClient.get(`/creators/${creatorHash}/stats`);
  return response.data;
}

/**
 * Newsletter Item interface
 */
export interface NewsletterItem {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  slug: string;
}

/**
 * Newsletter interface
 */
export interface Newsletter {
  id: number;
  subject: string;
  trigger_type: string;
  total_recipients: number;
  total_viewed: number;
  view_rate: number;
  sent_at: string;
  item_count: number;
  items: NewsletterItem[];
}

/**
 * Newsletters Response interface
 */
export interface NewslettersResponse {
  newsletters: Newsletter[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get feed details by slug (public endpoint)
 * GET /public/feeds/{slug}/preview
 */
export async function getFeedBySlug(slug: string): Promise<PublicFeed> {
  const response = await apiClient.get<PublicFeed>(`/public/feeds/${slug}/preview`);
  return response.data;
}

/**
 * Get feed newsletters (public preview)
 * GET /newsletters/feeds/{feed_id}/newsletters
 */
export async function getFeedNewsletters(
  feedId: number,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<NewslettersResponse> {
  const response = await apiClient.get<NewslettersResponse>(
    `/newsletters/feeds/${feedId}/newsletters`,
    {
      params: {
        limit: params?.limit || 10,
        offset: params?.offset || 0,
      },
    }
  );
  return response.data;
}

/**
 * Get public feed item by feed slug and item slug
 * GET /public/feeds/{feed_slug}/items/{item_slug}
 */
export async function getPublicItem(feedSlug: string, itemSlug: string): Promise<PublicFeedItem> {
  const response = await apiClient.get<PublicFeedItem>(
    `/public/feeds/${feedSlug}/items/${itemSlug}`
  );
  return response.data;
}
