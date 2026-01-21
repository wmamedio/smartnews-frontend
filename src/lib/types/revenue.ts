// Revenue data types for Story 1.4

export interface RevenueMetrics {
  current_month: number;
  last_month: number;
  lifetime_total: number;
  pending_payout: number;
  next_payout_date: string;
  subscriber_count: number;
  growth_rate: number;
}

export interface RevenueBreakdown {
  date: string;
  gross_revenue: number;
  platform_fee: number;
  net_revenue: number;
  new_subscribers: number;
  lost_subscribers: number;
}

export interface AttributionLink {
  id: string;
  url: string;
  label?: string;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  created_at: string;
}

export interface PayoutTransaction {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "processing";
  method: string;
  stripe_transaction_id?: string;
}

export interface RevenueProjection {
  month: string;
  projected_revenue: number;
  confidence_min: number;
  confidence_max: number;
}

export interface SubscriberGrowth {
  date: string;
  total_subscribers: number;
  new_subscribers: number;
  churned_subscribers: number;
}
