"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MiniChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  valueFormatter?: (value: number) => string;
  color?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  loading?: boolean;
}

export function MiniChart({
  title,
  data,
  valueFormatter = (v) => v.toString(),
  color = "hsl(var(--primary))",
  trend,
  loading,
}: MiniChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="rounded-lg border bg-background p-2 shadow-lg">
        <p className="text-xs font-semibold">
          {format(new Date(payload[0].payload.date), "MMM dd")}
        </p>
        <p className="text-xs">{valueFormatter(payload[0].value)}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs ${trend.direction === "up" ? "text-primary" : "text-destructive"}`}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mt-1">{valueFormatter(latestValue)}</div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`mini-gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#mini-gradient-${title})`}
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
