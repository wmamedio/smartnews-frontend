"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedItemCard } from "./RelatedItemCard";
import { getFeedNewsletters, type NewsletterItem } from "@/lib/api/services/discovery.service";
import type { PublicFeed } from "@/lib/types/feed";

interface RelatedContentSectionProps {
  currentItemId: number;
  feed: PublicFeed | null;
  feedSlug: string;
}

interface RelatedItem extends NewsletterItem {
  feedName?: string;
  feedSlug: string;
}

export function RelatedContentSection({
  currentItemId,
  feed,
  feedSlug,
}: RelatedContentSectionProps) {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!feed) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch newsletters from same feed
        const response = await getFeedNewsletters(feed.id, {
          limit: 5,
          offset: 0,
        });

        // Collect all items from newsletters, excluding current item
        const allItems: RelatedItem[] = [];

        for (const newsletter of response.newsletters) {
          if (newsletter.items) {
            for (const item of newsletter.items) {
              // Skip current item
              if (item.id === currentItemId) continue;

              // Add to related items with feed context
              allItems.push({
                ...item,
                feedName: feed.name,
                feedSlug: feedSlug,
              });

              // Limit to 4 items
              if (allItems.length >= 4) break;
            }
          }
          if (allItems.length >= 4) break;
        }

        setRelatedItems(allItems);
      } catch (error) {
        console.error("Failed to fetch related content:", error);
        setRelatedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedContent();
  }, [currentItemId, feed, feedSlug]);

  // Don't render if no related items and not loading
  if (!isLoading && relatedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Related Content</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border">
              <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {relatedItems.map((item) => (
            <RelatedItemCard
              key={item.id}
              item={item}
              feedSlug={item.feedSlug}
              feedName={item.feedName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
