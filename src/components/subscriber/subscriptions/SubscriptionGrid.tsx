"use client";

import { FeedCard } from "../shared/FeedCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedSubscriptionWithDetails } from "@/lib/types/feed";

interface SubscriptionGridProps {
  subscriptions: FeedSubscriptionWithDetails[];
  isLoading?: boolean;
  onViewContent: (subscription: FeedSubscriptionWithDetails) => void;
  onEditFrequency: (subscription: FeedSubscriptionWithDetails) => void;
  onUnsubscribe: (subscription: FeedSubscriptionWithDetails) => void;
}

export function SubscriptionGrid({
  subscriptions,
  isLoading,
  onViewContent,
  onEditFrequency,
  onUnsubscribe,
}: SubscriptionGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <SubscriptionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subscriptions.map((subscription) => (
        <FeedCard
          key={subscription.id}
          mode="subscription"
          subscription={subscription}
          onViewContent={onViewContent}
          onEditFrequency={onEditFrequency}
          onUnsubscribe={onUnsubscribe}
        />
      ))}
    </div>
  );
}

function SubscriptionCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
