"use client";

import { FeedCard } from "../shared/FeedCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicFeed } from "@/lib/types/feed";

interface FeedGridProps {
  feeds: PublicFeed[];
  isLoading?: boolean;
  subscribedFeedIds?: Set<number>;
  onSubscribeClick: (feedId: number) => void;
  onPreviewClick: (feedId: number) => void;
}

export function FeedGrid({
  feeds,
  isLoading,
  subscribedFeedIds = new Set(),
  onSubscribeClick,
  onPreviewClick,
}: FeedGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-5xl">📭</div>
        <h3 className="mb-2 text-lg font-semibold">No feeds found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {feeds.map((feed) => (
        <FeedCard
          key={feed.id}
          mode="discovery"
          feed={feed}
          isSubscribed={subscribedFeedIds.has(feed.id)}
          onSubscribeClick={onSubscribeClick}
          onPreviewClick={onPreviewClick}
        />
      ))}
    </div>
  );
}

function FeedCardSkeleton() {
  return (
    <div className="flex h-full flex-col space-y-3 rounded-lg border p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
