"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw, DollarSign, Users, TrendingUp, CreditCard } from "lucide-react";
import { MetricCard } from "@/components/revenue/dashboard/MetricCard";
import { RevenueChart } from "@/components/revenue/dashboard/RevenueChart";
import { SubscriberChart } from "@/components/revenue/dashboard/SubscriberChart";
import { revenueService } from "@/lib/services/revenue-service";
import { Badge } from "@/components/ui/badge";
import { subDays, format } from "date-fns";

export default function RevenueDashboardPage() {
  // Date range state (default: last 30 days)
  const [dateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch revenue metrics with React Query
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["revenue-metrics"],
    queryFn: () => revenueService.getMetrics(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });

  // Fetch revenue breakdown data
  const {
    data: revenueData,
    isLoading: revenueLoading,
    isError: revenueError,
  } = useQuery({
    queryKey: ["revenue-breakdown", dateRange.start, dateRange.end],
    queryFn: () => revenueService.getBreakdown(dateRange.start, dateRange.end),
    refetchInterval: 30000,
    staleTime: 30000,
  });

  // Fetch subscriber growth data
  const {
    data: subscriberData,
    isLoading: subscriberLoading,
    isError: subscriberError,
  } = useQuery({
    queryKey: ["subscriber-growth", dateRange.start, dateRange.end],
    queryFn: () => revenueService.getSubscriberGrowth(dateRange.start, dateRange.end),
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const isLoading = metricsLoading;
  const isError = metricsError;
  const refetch = () => {
    refetchMetrics();
  };

  // Calculate data freshness
  const getDataFreshness = () => {
    if (!dataUpdatedAt) return null;
    const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (seconds < 30)
      return { status: "live", text: "Updated just now", variant: "default" as const };
    if (seconds < 60)
      return { status: "stale", text: `Updated ${seconds}s ago`, variant: "secondary" as const };
    const minutes = Math.floor(seconds / 60);
    return {
      status: "stale",
      text: `Updated ${minutes}m ago`,
      variant: "secondary" as const,
    };
  };

  const freshness = getDataFreshness();

  const handleExport = async () => {
    try {
      const blob = await revenueService.exportRevenue("csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export revenue data:", error);
    }
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Page controls moved to top of content */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>

          <div className="flex items-center gap-2">
            {/* Real-time indicator */}
            {freshness && (
              <Badge variant={freshness.variant} className="gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${freshness.status === "live" ? "bg-primary animate-pulse" : "bg-secondary"}`}
                />
                {freshness.text}
              </Badge>
            )}

            {/* Export button */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Refresh button */}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Current Month Revenue"
                value={metrics?.current_month ?? 0}
                format="currency"
                trend={
                  metrics
                    ? {
                        value: metrics.growth_rate,
                        direction:
                          metrics.growth_rate > 0
                            ? "up"
                            : metrics.growth_rate < 0
                              ? "down"
                              : "neutral",
                      }
                    : undefined
                }
                variant="animated"
                icon={DollarSign}
                loading={isLoading}
                error={isError}
              />

              <MetricCard
                title="Lifetime Earnings"
                value={metrics?.lifetime_total ?? 0}
                format="currency"
                variant="animated"
                icon={TrendingUp}
                loading={isLoading}
                error={isError}
              />

              <MetricCard
                title="Total Subscribers"
                value={metrics?.subscriber_count ?? 0}
                format="number"
                variant="animated"
                icon={Users}
                loading={isLoading}
                error={isError}
              />

              <MetricCard
                title="Pending Payout"
                value={metrics?.pending_payout ?? 0}
                format="currency"
                variant="animated"
                icon={CreditCard}
                loading={isLoading}
                error={isError}
              />
            </div>

            {/* Additional metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard
                title="Last Month Revenue"
                value={metrics?.last_month ?? 0}
                format="currency"
                loading={isLoading}
                error={isError}
              />

              <MetricCard
                title="Next Payout Date"
                value={
                  metrics?.next_payout_date
                    ? new Date(metrics.next_payout_date).toLocaleDateString()
                    : "N/A"
                }
                loading={isLoading}
                error={isError}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <RevenueChart
                data={revenueData ?? []}
                loading={revenueLoading}
                error={revenueError}
              />

              <SubscriberChart
                data={subscriberData ?? []}
                loading={subscriberLoading}
                error={subscriberError}
              />
            </div>
          </TabsContent>

          <TabsContent value="attribution">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Attribution Tracking</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Attribution features will be added in Phase 3
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Payout History</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Payout management will be added in Phase 4
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projections">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Projections</h3>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Projection calculator will be added in Phase 5
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
