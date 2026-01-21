// Revenue Service for API calls - Story 1.4

import apiClient from "@/lib/api/client";
import type {
  RevenueMetrics,
  RevenueBreakdown,
  AttributionLink,
  PayoutTransaction,
  RevenueProjection,
  SubscriberGrowth,
} from "@/lib/types/revenue";

class RevenueService {
  /**
   * Get current revenue metrics overview
   */
  async getMetrics(): Promise<RevenueMetrics> {
    const response = await apiClient.get<RevenueMetrics>("/creator/revenue/metrics");
    return response.data;
  }

  /**
   * Get detailed revenue breakdown by date range
   */
  async getBreakdown(startDate?: string, endDate?: string): Promise<RevenueBreakdown[]> {
    const response = await apiClient.get<RevenueBreakdown[]>("/creator/revenue/breakdown", {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  /**
   * Get subscriber growth data
   */
  async getSubscriberGrowth(startDate?: string, endDate?: string): Promise<SubscriberGrowth[]> {
    const response = await apiClient.get<SubscriberGrowth[]>("/creator/revenue/subscribers", {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  /**
   * Get attribution links
   */
  async getAttributionLinks(): Promise<AttributionLink[]> {
    const response = await apiClient.get<AttributionLink[]>("/creator/attribution/links");
    return response.data;
  }

  /**
   * Create new attribution link
   */
  async createAttributionLink(label?: string): Promise<AttributionLink> {
    const response = await apiClient.post<AttributionLink>("/creator/attribution/links", {
      label,
    });
    return response.data;
  }

  /**
   * Get payout history
   */
  async getPayouts(): Promise<PayoutTransaction[]> {
    const response = await apiClient.get<PayoutTransaction[]>("/creator/payouts");
    return response.data;
  }

  /**
   * Get revenue projections
   */
  async getProjections(
    subscriberGrowth: number,
    priceTier: number,
    churnRate: number
  ): Promise<RevenueProjection[]> {
    const response = await apiClient.get<RevenueProjection[]>("/creator/revenue/projections", {
      params: {
        subscriber_growth: subscriberGrowth,
        price_tier: priceTier,
        churn_rate: churnRate,
      },
    });
    return response.data;
  }

  /**
   * Export revenue data to CSV
   */
  async exportRevenue(format: "csv" | "excel" = "csv"): Promise<Blob> {
    const response = await apiClient.get("/creator/revenue/export", {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  }
}

export const revenueService = new RevenueService();
