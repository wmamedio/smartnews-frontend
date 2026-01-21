import apiClient from "../client";

/**
 * Dashboard overview response from backend
 */
export interface DashboardOverview {
  total_subscribers: number;
  new_subscribers_today: number;
  new_subscribers_this_week: number;
  new_subscribers_this_month: number;
  subscriber_growth_rate: number;
  estimated_monthly_revenue_cents: number;
  estimated_monthly_revenue_usd: number;
  total_feeds: number;
  published_feeds: number;
  draft_feeds: number;
  archived_feeds: number;
  total_content_items: number;
  total_content_views: number;
  average_engagement_rate: number;
  cached_at: string;
  cache_expires_at: string;
}

/**
 * Individual feed statistics
 */
export interface FeedStats {
  feed_id: number;
  subscriber_count: number;
  total_deliveries: number;
  last_delivery_at: string | null;
  next_scheduled_delivery: string | null;
}

/**
 * Feeds stats response from backend
 */
export interface FeedsStatsResponse {
  feeds: FeedStats[];
  cached_at: string;
  cache_expires_at: string;
}

class DashboardService {
  /**
   * Get creator dashboard overview statistics
   */
  async getOverview(): Promise<DashboardOverview> {
    const response = await apiClient.get<DashboardOverview>("/creator/dashboard/overview");
    return response.data;
  }

  /**
   * Get statistics for all feeds
   */
  async getFeedsStats(): Promise<FeedsStatsResponse> {
    const response = await apiClient.get<FeedsStatsResponse>("/creator/dashboard/feeds/stats");
    return response.data;
  }
}

export const dashboardService = new DashboardService();
