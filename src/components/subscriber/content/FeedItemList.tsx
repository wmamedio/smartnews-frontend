"use client";

import { FeedItemCard } from "./FeedItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreatorFeedItemResponse } from "@/lib/types/feed";

interface FeedItemListProps {
  items: CreatorFeedItemResponse[];
  isLoading?: boolean;
}

export function FeedItemList({ items, isLoading }: FeedItemListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-5xl">📰</div>
        <h3 className="mb-2 text-lg font-semibold">No content yet</h3>
        <p className="text-sm text-muted-foreground">
          The creator hasn&apos;t published anything yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
