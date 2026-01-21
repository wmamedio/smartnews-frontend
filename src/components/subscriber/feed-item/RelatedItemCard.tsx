"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsletterItem } from "@/lib/api/services/discovery.service";
import { usePublicPrefetch } from "@/lib/hooks/use-public-prefetch";

interface RelatedItemCardProps {
  item: NewsletterItem;
  feedSlug: string;
  feedName?: string;
}

export function RelatedItemCard({ item, feedSlug, feedName }: RelatedItemCardProps) {
  const { prefetchFeedItemPage } = usePublicPrefetch();
  // Use backend's slug instead of generating from title
  const itemSlug = item.slug;
  const itemUrl = `/feed/${feedSlug}/${itemSlug}`;

  const handleMouseEnter = () => {
    prefetchFeedItemPage(feedSlug, itemSlug);
  };

  return (
    <Link href={itemUrl} aria-label={`View ${item.title}`} onMouseEnter={handleMouseEnter}>
      <Card className="group cursor-pointer overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200">
        <CardContent className="p-3 flex gap-3">
          {/* Thumbnail */}
          {item.thumbnail && (
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="80px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            {feedName && <p className="text-xs text-muted-foreground mt-1 truncate">{feedName}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
