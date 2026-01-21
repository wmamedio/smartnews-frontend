// Feed type definitions based on Story 1.3 specification

// Category interface matching backend API
export interface FeedCategoryObject {
  id?: number;
  name: string;
  slug: string;
  description?: string;
}

// Feed source interface matching backend API
export interface FeedSourceObject {
  id: number;
  name: string;
  url: string;
  type: string;
  description?: string;
}

export interface Feed {
  id: number;
  creator_id?: number;
  creator_hash: string;
  name: string;
  slug: string;
  description: string;
  // Legacy single category field (for backward compatibility)
  category?: string;
  // API returns categories as array of objects
  categories?: FeedCategoryObject[];
  // API returns feed_sources as array of objects
  feed_sources?: FeedSourceObject[];
  is_published: boolean;
  status: "published" | "draft" | "archived";
  schedule?: DeliveryScheduleResponse | null; // Backend now returns full schedule object
  subscriber_count?: number; // Number of subscribers (from backend)
  items_count?: number; // Number of items in feed (from backend)
  cover_image?: string;
  refresh_schedule?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Legacy schedule interface (for backward compatibility)
export interface FeedSchedule {
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  send_time: string; // HH:mm format
  timezone: string;
  days_of_week?: number[]; // For weekly frequency (0=Sunday, 6=Saturday)
}

/**
 * Delivery schedule creation request (Story 1.3.4)
 * Matches backend API POST /feeds/{feed_id}/schedule
 */
export interface DeliveryScheduleCreate {
  frequency: number; // Minutes: 1440=daily, 10080=weekly, 20160=bi-weekly, 43200=monthly
  delivery_time: string; // HH:MM format (24-hour)
  delivery_days?: number[]; // [0-6] for weekly/bi-weekly (0=Sunday, 6=Saturday)
  delivery_day_of_month?: number; // 1-31 or -1 for "last day" (monthly only)
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
  is_active: boolean; // Whether schedule is active
}

/**
 * Delivery schedule response from backend (Story 1.3.4)
 * Returned by GET /feeds/{feed_id}/schedule
 */
export interface DeliveryScheduleResponse extends DeliveryScheduleCreate {
  id: number;
  feed_id: number;
  next_scheduled_at?: string; // ISO timestamp of next delivery
  last_sent_at?: string; // ISO timestamp of last delivery
  created_at: string;
  updated_at: string;
}

/**
 * Schedule preview response (Story 1.3.4)
 * Returned by POST /feeds/{feed_id}/schedule/preview
 */
export interface DeliverySchedulePreviewResponse {
  preview_dates: string[]; // Array of ISO timestamps for next 5 deliveries
}

/**
 * Frequency values in minutes for delivery schedules
 */
export const FREQUENCY_MINUTES = {
  daily: 1440,
  weekly: 10080,
  biweekly: 20160,
  monthly: 43200,
} as const;

export type FrequencyType = keyof typeof FREQUENCY_MINUTES;

export interface FeedItem {
  id: number;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  source_url: string;
  source: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface FeedSection {
  id: string;
  title: string;
  order: number;
}

// Unified content item that can be either a feed item or section divider
export type FeedContentItem =
  | { type: "item"; data: FeedItem }
  | { type: "section"; data: FeedSection };

export interface FeedBuilderState {
  feed: Partial<Feed>;
  items: FeedItem[];
  sections: FeedSection[];
  isDirty: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Wizard step type
export type WizardStep = 1 | 2 | 3 | 4 | 5;

// Category options (from API or predefined)
export const FEED_CATEGORIES = [
  "Technology",
  "Business",
  "Science",
  "Health",
  "Entertainment",
  "Sports",
  "Politics",
  "Education",
  "Lifestyle",
  "Other",
] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];

// ========================================
// Subscriber Discovery & Experience Types (Story 1.6)
// ========================================

/**
 * Public feed category (from /api/public/feeds/categories)
 */
export interface FeedCategoryInfo {
  slug: string;
  name: string;
  description?: string;
  feed_count: number;
}

/**
 * Creator info nested in subscription responses (from backend)
 */
export interface CreatorInfo {
  id: number;
  hash: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
}

/**
 * Feed response nested in subscription details
 */
export interface FeedResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  category?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Public creator info (nested in PublicFeed)
 */
export interface PublicCreator {
  id: number;
  hash: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website_url?: string | null;
}

/**
 * Public feed for discovery (from /api/public/feeds/discover)
 */
export interface PublicFeed {
  id: number;
  name: string;
  slug: string;
  description: string;
  creator_id: number;
  creator: PublicCreator;
  categories: FeedCategoryObject[];
  status: string;
  published_at: string;
  subscriber_count: number;
  item_count: number; // Note: Public endpoints use item_count, not items_count
  update_frequency: string; // e.g., "Daily", "Weekly", "Monthly", "Manual"
}

/**
 * Feed subscription creation request (POST /feed-subscriptions/)
 */
export interface FeedSubscriptionCreate {
  feed_id: number;
  attribution_code?: string;
}

/**
 * Feed subscription response (from API)
 */
export interface FeedSubscriptionResponse {
  id: number;
  subscriber_id: number;
  feed_id: number;
  delivery_method: string;
  delivery_frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Feed subscription with full details (GET /feed-subscriptions/)
 */
export interface FeedSubscriptionWithDetails extends FeedSubscriptionResponse {
  feed: FeedResponse;
  creator: CreatorInfo;
}

/**
 * Feed subscription preferences update (PUT /feed-subscriptions/{id}/preferences)
 */
export interface FeedSubscriptionUpdate {
  delivery_method?: string;
  delivery_frequency?: string;
}

/**
 * Creator feed item response (GET /creators/{creator_hash}/feed-items)
 * Note: This public endpoint keeps the /feed-items naming convention
 */
export interface CreatorFeedItemResponse {
  id: number;
  content_hash: string;
  title: string;
  description?: string;
  url?: string;
  source_url?: string;
  status: string;
  relevance_score?: number;
  created_at: string;
  updated_at: string;
  feed_source_id?: number;
}

/**
 * Discovery query parameters
 */
export interface DiscoverFeedsParams {
  query?: string;
  category?: string;
  creator?: string;
  limit?: number;
  offset?: number;
}

// ========================================
// Public Feed Item Types (Story 1.6.2)
// ========================================

/**
 * Creator info nested in public feed item response
 * GET /public/feeds/{feed_slug}/items/{item_slug}
 */
export interface PublicItemCreator {
  id: number;
  hash: string;
  name: string;
  avatar_url?: string;
}

/**
 * Feed info nested in public feed item response
 * GET /public/feeds/{feed_slug}/items/{item_slug}
 */
export interface PublicItemFeed {
  id: number;
  name: string;
  slug: string;
  creator: PublicItemCreator;
}

/**
 * Public feed item response
 * GET /public/feeds/{feed_slug}/items/{item_slug}
 */
export interface PublicFeedItem {
  id: number;
  title: string;
  description?: string;
  link: string;
  thumbnail?: string;
  author?: string;
  published_at: string;
  slug: string;
  feed: PublicItemFeed;
}
