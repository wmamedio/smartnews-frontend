"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getFeedBySlug,
  getFeedNewsletters,
  discoverFeeds,
  type Newsletter,
  type NewsletterItem,
} from "@/lib/api/services/discovery.service";
import {
  createFeedSubscription,
  getMySubscriptions,
} from "@/lib/api/services/subscriptions.service";
import type { PublicFeed } from "@/lib/types/feed";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ExternalLink, Calendar, Eye, Check, Unlock, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import Cookies from "js-cookie";
import { useAuthStore } from "@/lib/stores/auth-store";
import { CreatorInfoSection } from "@/components/subscriber/feed/CreatorInfoSection";
import { cn } from "@/lib/utils";
import { PublicHeader } from "@/components/subscriber/shared/PublicHeader";
import { usePublicPrefetch } from "@/lib/hooks/use-public-prefetch";

const ITEMS_PER_PAGE = 10;
const MAX_AUTO_LOADS = 3;
const PREVIEW_NEWSLETTER_LIMIT = 1;
const PREVIEW_ITEMS_LIMIT = 6; // 5 clean cards + 1 with overlay

export default function FeedPage() {
  const params = useParams();
  const router = useRouter();
  const feedSlug = params.slug as string;
  const { user } = useAuthStore();

  const [feed, setFeed] = useState<PublicFeed | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [autoLoadCount, setAutoLoadCount] = useState(0);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  const [total, setTotal] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Check if user is authenticated
  const isAuthenticated = isMounted && !!Cookies.get("access_token");

  // Check if user is a subscriber (not a creator)
  const isSubscriber = user?.user_type === "subscriber";

  // Preview mode detection: show preview if user is NOT subscribed AND (not authenticated OR not a subscriber)
  const isPreviewMode = !isSubscribed && (!isAuthenticated || !isSubscriber);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch feed details (only once)
  useEffect(() => {
    const fetchFeedDetails = async () => {
      try {
        const feedData = await getFeedBySlug(feedSlug);
        setFeed(feedData);
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to load feed details");
        router.push("/discover");
      }
    };

    if (feedSlug) {
      fetchFeedDetails();
    }
  }, [feedSlug, router]);

  // Check subscription status (only for authenticated subscribers, not creators)
  useEffect(() => {
    const checkSubscription = async () => {
      // Only check subscriptions if:
      // 1. Feed is loaded
      // 2. User is authenticated
      // 3. User is a subscriber (not a creator)
      if (!feed || !isAuthenticated || !isSubscriber) return;

      try {
        const subscriptions = await getMySubscriptions();
        const isUserSubscribed = subscriptions.some((sub) => sub.feed_id === feed.id);
        setIsSubscribed(isUserSubscribed);
      } catch (error) {
        // Silently handle subscription check errors (expected for non-subscriber users)
      }
    };

    checkSubscription();
  }, [feed, isAuthenticated, isSubscriber]);

  // Fetch newsletters
  const fetchNewsletters = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      if (!feed) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        // In preview mode, limit to 1 newsletter and always offset 0
        const limit = isPreviewMode ? PREVIEW_NEWSLETTER_LIMIT : ITEMS_PER_PAGE;
        const adjustedOffset = isPreviewMode ? 0 : offset;

        const response = await getFeedNewsletters(feed.id, {
          limit,
          offset: adjustedOffset,
        });

        if (append) {
          setNewsletters((prev) => [...prev, ...response.newsletters]);
        } else {
          setNewsletters(response.newsletters);
        }

        setTotal(response.total);
        // In preview mode, disable infinite scroll
        setHasMore(isPreviewMode ? false : offset + response.newsletters.length < response.total);
      } catch (error: any) {
        toast.error("Failed to load newsletters");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [feed, isPreviewMode]
  );

  // Initial load newsletters after feed is loaded
  useEffect(() => {
    if (feed) {
      fetchNewsletters();
    }
  }, [feed, fetchNewsletters]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !showLoadMoreButton &&
          autoLoadCount < MAX_AUTO_LOADS
        ) {
          // Auto-load more
          const nextOffset = newsletters.length;
          fetchNewsletters(nextOffset, true);
          setAutoLoadCount((prev) => prev + 1);

          // Show "Load More" button after 3 auto-loads
          if (autoLoadCount + 1 >= MAX_AUTO_LOADS) {
            setShowLoadMoreButton(true);
          }
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [newsletters, hasMore, isLoadingMore, showLoadMoreButton, autoLoadCount, fetchNewsletters]);

  // Handle manual "Load More" click
  const handleLoadMore = () => {
    const nextOffset = newsletters.length;
    fetchNewsletters(nextOffset, true);
    setShowLoadMoreButton(false); // Reset for next set of auto-loads
    setAutoLoadCount(0); // Reset counter
  };

  // Handle subscribe button click
  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      // Redirect to subscriber registration with return URL
      const redirectUrl = encodeURIComponent(`/discover?feedId=${feed?.id}`);
      router.push(`/register/subscriber?redirect=${redirectUrl}`);
      return;
    }

    handleSubscribe();
  };

  // Handle actual subscription
  const handleSubscribe = async () => {
    if (!feed) return;

    setIsSubscribing(true);
    try {
      await createFeedSubscription({ feed_id: feed.id });
      setIsSubscribed(true);
      toast.success("Subscribed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to subscribe to feed");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading || !feed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between py-4 mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="mb-6 h-6 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-4">
      {/* Public Header */}
      <PublicHeader feedId={feed.id} feedName={feed.name} />

      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/discover">Discover</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{feed.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content - Left Column (3/4 width) */}
        <div className="lg:col-span-3">
          {/* Feed Header */}
          <div className="mb-6">
            {/* Title row with Subscribe button on far right */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{feed.name}</h1>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  {feed.update_frequency || "Daily"}
                </Badge>
              </div>

              {/* Subscribe button or Subscribed badge */}
              <div className="flex-shrink-0">
                {isSubscribed ? (
                  <Button variant="secondary" disabled size="sm">
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Subscribed
                  </Button>
                ) : (
                  <Button onClick={handleSubscribeClick} disabled={isSubscribing} size="sm">
                    {isSubscribing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe FREE
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Description - full width below title */}
            {feed.description && (
              <p className="text-sm text-muted-foreground">{feed.description}</p>
            )}
          </div>

          {/* Newsletters */}
          {newsletters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-5xl">📭</div>
              <h3 className="mb-2 text-lg font-semibold">No newsletters yet</h3>
              <p className="text-sm text-muted-foreground">
                This feed hasn&apos;t published any newsletters yet. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {newsletters.map((newsletter) => (
                  <NewsletterCard
                    key={newsletter.id}
                    newsletter={newsletter}
                    isPreviewMode={isPreviewMode}
                    onSubscribeClick={handleSubscribeClick}
                    feedSlug={feedSlug}
                  />
                ))}
              </div>

              {/* Infinite scroll trigger - Only for subscribed users */}
              {!isPreviewMode && hasMore && !showLoadMoreButton && (
                <div ref={observerTarget} className="h-4" />
              )}

              {/* Loading more indicator */}
              {!isPreviewMode && isLoadingMore && (
                <div className="mt-6 flex justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              )}

              {/* Load More button */}
              {!isPreviewMode && showLoadMoreButton && hasMore && !isLoadingMore && (
                <div className="mt-8 flex justify-center">
                  <Button onClick={handleLoadMore} variant="outline" size="lg">
                    Load More Newsletters
                  </Button>
                </div>
              )}

              {/* End of list */}
              {!isPreviewMode && !hasMore && newsletters.length > 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  You&apos;ve reached the end — {total} newsletters
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Creator Info (1/4 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <CreatorInfoSection feed={feed} />

            {/* Other Feeds Section */}
            <OtherFeedsSection currentFeed={feed} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Newsletter Card Component
 */
function NewsletterCard({
  newsletter,
  isPreviewMode,
  onSubscribeClick,
  feedSlug,
}: {
  newsletter: Newsletter;
  isPreviewMode?: boolean;
  onSubscribeClick?: () => void;
  feedSlug: string;
}) {
  // Limit items in preview mode
  const displayItems = isPreviewMode
    ? newsletter.items?.slice(0, PREVIEW_ITEMS_LIMIT)
    : newsletter.items;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 mb-2">
          <CardTitle className="flex-1">{newsletter.subject}</CardTitle>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            <Calendar className="mr-1 h-3 w-3" />
            {format(new Date(newsletter.sent_at), "MMM dd, yyyy")}
          </Badge>
        </div>
        {!isPreviewMode && newsletter.total_viewed > 0 && (
          <CardDescription>
            <Badge variant="outline" className="text-xs">
              <Eye className="mr-1 h-3 w-3" />
              {newsletter.view_rate.toFixed(0)}% viewed
            </Badge>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {displayItems && displayItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayItems.map((item, index) => (
              <NewsletterItemCardView
                key={item.id}
                item={item}
                isLastPreviewItem={isPreviewMode && index === displayItems.length - 1}
                totalItems={newsletter.item_count}
                onSubscribeClick={onSubscribeClick}
                feedSlug={feedSlug}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Newsletter Item Card View (Grid)
 */
function NewsletterItemCardView({
  item,
  isLastPreviewItem,
  totalItems,
  onSubscribeClick,
  feedSlug,
}: {
  item: NewsletterItem;
  isLastPreviewItem?: boolean;
  totalItems?: number;
  onSubscribeClick?: () => void;
  feedSlug: string;
}) {
  const router = useRouter();
  const { prefetchFeedItemPage } = usePublicPrefetch();
  // Use backend's slug instead of generating from title
  const itemSlug = item.slug;
  const itemUrl = `/feed/${feedSlug}/${itemSlug}`;

  const handleCardClick = () => {
    if (!isLastPreviewItem) {
      router.push(itemUrl);
    }
  };

  const handleMouseEnter = () => {
    if (!isLastPreviewItem) {
      prefetchFeedItemPage(feedSlug, itemSlug);
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col h-full",
        isLastPreviewItem ? "cursor-default" : "cursor-pointer"
      )}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      role={isLastPreviewItem ? undefined : "link"}
      aria-label={isLastPreviewItem ? undefined : `View ${item.title}`}
    >
      {/* Teaser overlay - Only on last preview item */}
      {isLastPreviewItem && (
        <div
          className="absolute inset-0 bg-background flex flex-col items-center justify-center p-6 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Unlock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-center">See Full Content</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Subscribe for <strong className="text-foreground">FREE</strong> to access all{" "}
            <strong className="text-foreground">{totalItems} newsletters</strong> and full content
          </p>
          <Button
            size="sm"
            className="min-w-[200px]"
            onClick={(e) => {
              e.stopPropagation();
              onSubscribeClick?.();
            }}
          >
            Subscribe FREE
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {item.thumbnail && (
        <div className="relative h-40 w-full overflow-hidden flex-shrink-0">
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      )}
      <CardContent className="p-4 flex flex-col flex-1">
        <h5 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-primary transition-colors">
          {item.title}
        </h5>
        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground mt-2">{item.description}</p>
        )}
        <span className="inline-flex items-center text-xs text-primary mt-auto pt-2">
          Read More
          <ArrowRight className="ml-1 h-3 w-3" />
        </span>
      </CardContent>
    </Card>
  );
}

/**
 * Other Feeds Section - Shows feeds from same creator or other creators
 */
function OtherFeedsSection({ currentFeed }: { currentFeed: PublicFeed }) {
  const [otherFeeds, setOtherFeeds] = useState<PublicFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatorFeeds, setShowCreatorFeeds] = useState(false);

  useEffect(() => {
    const fetchOtherFeeds = async () => {
      try {
        setIsLoading(true);

        // First, try to get other feeds from the same creator
        const creatorFeeds = await discoverFeeds({
          limit: 10,
        });

        // Filter: same creator, different feed
        const sameCreatorFeeds = creatorFeeds.filter(
          (feed) => feed.creator?.id === currentFeed.creator?.id && feed.id !== currentFeed.id
        );

        if (sameCreatorFeeds.length > 0) {
          setOtherFeeds(sameCreatorFeeds.slice(0, 3));
          setShowCreatorFeeds(true);
        } else {
          // If no feeds from same creator, get feeds from similar categories
          const categoryIds = currentFeed.categories?.map((cat) => cat.id) || [];
          const similarFeeds = creatorFeeds.filter(
            (feed) =>
              feed.id !== currentFeed.id &&
              feed.categories?.some((cat) => categoryIds.includes(cat.id))
          );

          if (similarFeeds.length > 0) {
            setOtherFeeds(similarFeeds.slice(0, 3));
          } else {
            // Fallback: show any other feeds
            const anyOtherFeeds = creatorFeeds.filter((feed) => feed.id !== currentFeed.id);
            setOtherFeeds(anyOtherFeeds.slice(0, 3));
          }
          setShowCreatorFeeds(false);
        }
      } catch (error) {
        console.error("Failed to fetch other feeds:", error);
        setOtherFeeds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtherFeeds();
  }, [currentFeed]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (otherFeeds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {showCreatorFeeds ? "More from this creator" : "Similar Streams"}
      </h3>
      <div className="space-y-3">
        {otherFeeds.map((feed) => (
          <OtherFeedCard key={feed.id} feed={feed} />
        ))}
      </div>
    </div>
  );
}

/**
 * Other Feed Card - Compact card for sidebar
 */
function OtherFeedCard({ feed }: { feed: PublicFeed }) {
  const router = useRouter();
  const { prefetchFeedPage } = usePublicPrefetch();

  const handleClick = () => {
    router.push(`/feed/${feed.slug}`);
  };

  const handleMouseEnter = () => {
    if (feed.slug) {
      prefetchFeedPage(feed.slug);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="w-full text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
    >
      <h4 className="font-medium text-sm mb-1 line-clamp-1">{feed.name}</h4>
      {feed.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{feed.description}</p>
      )}
      {feed.subscriber_count > 0 && (
        <div className="text-xs text-muted-foreground">
          {formatNumber(feed.subscriber_count)} subscribers
        </div>
      )}
    </button>
  );
}

/**
 * Format large numbers (e.g., 2400 → "2.4K", 1500000 → "1.5M")
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
