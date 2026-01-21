"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RefreshCcw, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  format?: "currency" | "number" | "percentage";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  sparkline?: number[];
  variant?: "default" | "trending" | "animated" | "compact";
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
  error?: boolean;
  stale?: boolean;
  onClick?: () => void;
  onRefresh?: () => void;
}

export function MetricCard({
  title,
  value,
  format = "number",
  trend,
  variant = "default",
  icon: Icon,
  className,
  loading = false,
  error = false,
  stale = false,
  onClick,
  onRefresh,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const isAnimated = variant === "animated" || variant === "trending";
  const isCompact = variant === "compact";

  // Animate number counting
  useEffect(() => {
    if (!isAnimated || loading || typeof value !== "number") return;

    const duration = 1200;
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeOutQuart;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isAnimated, loading]);

  // Format the value for display
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;

    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(isAnimated ? displayValue : val);
    }

    if (format === "percentage") {
      return `${(isAnimated ? displayValue : val).toFixed(1)}%`;
    }

    return new Intl.NumberFormat("en-US").format(isAnimated ? Math.round(displayValue) : val);
  };

  // Render trend indicator
  const renderTrend = () => {
    if (!trend) return null;

    const TrendIcon =
      trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;

    const trendColor =
      trend.direction === "up"
        ? "text-primary"
        : trend.direction === "down"
          ? "text-destructive"
          : "text-muted-foreground";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} $
              {Math.abs(trend.value)}% vs previous period
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn("transition-all", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          {Icon && <Skeleton className="h-4 w-4" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-destructive transition-all", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">Failed to load data</div>
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        stale && "opacity-70",
        className
      )}
      onClick={onClick}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isCompact ? "pb-1" : "pb-2"
        )}
      >
        <CardTitle className={cn("font-medium", isCompact ? "text-xs" : "text-sm")}>
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {stale && <Badge variant="outline">Stale</Badge>}
          {Icon && (
            <Icon className={cn("text-muted-foreground", isCompact ? "h-3 w-3" : "h-4 w-4")} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("font-bold", isCompact ? "text-xl" : "text-2xl")}>
          {formatValue(value)}
        </div>
        {trend && !isCompact && <div className="mt-2">{renderTrend()}</div>}
      </CardContent>
    </Card>
  );

  // Wrap with motion for animation
  if (isAnimated && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
