"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useMemo } from "react";
import type { RevenueBreakdown } from "@/lib/types/revenue";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export interface RevenueChartProps {
  data: RevenueBreakdown[];
  loading?: boolean;
  error?: boolean;
  className?: string;
}

type ChartType = "line" | "area" | "bar";
type ViewMode = "gross" | "net" | "both";

export function RevenueChart({ data, loading, error, className }: RevenueChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [viewMode, setViewMode] = useState<ViewMode>("gross");

  // Transform data for charts
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      grossRevenue: item.gross_revenue,
      netRevenue: item.net_revenue,
      platformFee: item.platform_fee,
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{payload[0].payload.date}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              ${entry.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleExportChart = async () => {
    // Placeholder for chart export functionality
    console.log("Export chart as PNG");
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-destructive">
            Failed to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>No revenue data available yet</p>
            <p className="text-sm">Data will appear once you have subscribers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Revenue Trend</CardTitle>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="gross" className="text-xs">
                Gross
              </TabsTrigger>
              <TabsTrigger value="net" className="text-xs">
                Net
              </TabsTrigger>
              <TabsTrigger value="both" className="text-xs">
                Both
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Chart Type Toggle */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <TabsList className="h-8">
              <TabsTrigger value="line" className="text-xs">
                Line
              </TabsTrigger>
              <TabsTrigger value="area" className="text-xs">
                Area
              </TabsTrigger>
              <TabsTrigger value="bar" className="text-xs">
                Bar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Export Button */}
          <Button variant="outline" size="sm" onClick={handleExportChart}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          {chartType === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {(viewMode === "gross" || viewMode === "both") && (
                <Line
                  type="monotone"
                  dataKey="grossRevenue"
                  name="Gross Revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              )}
              {(viewMode === "net" || viewMode === "both") && (
                <Line
                  type="monotone"
                  dataKey="netRevenue"
                  name="Net Revenue"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              )}
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {(viewMode === "gross" || viewMode === "both") && (
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  name="Gross Revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorGross)"
                  strokeWidth={2}
                  animationDuration={800}
                />
              )}
              {(viewMode === "net" || viewMode === "both") && (
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  name="Net Revenue"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#colorNet)"
                  strokeWidth={2}
                  animationDuration={800}
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {(viewMode === "gross" || viewMode === "both") && (
                <Bar
                  dataKey="grossRevenue"
                  name="Gross Revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              )}
              {(viewMode === "net" || viewMode === "both") && (
                <Bar
                  dataKey="netRevenue"
                  name="Net Revenue"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
