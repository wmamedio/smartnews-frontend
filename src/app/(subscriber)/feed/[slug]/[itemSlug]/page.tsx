"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, ExternalLink, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PublicHeader } from "@/components/subscriber/shared/PublicHeader";
import { FeedInfoSidebar } from "@/components/subscriber/feed-item/FeedInfoSidebar";
import { RelatedContentSection } from "@/components/subscriber/feed-item/RelatedContentSection";
import { getPublicItem, getFeedBySlug } from "@/lib/api/services/discovery.service";
import type { PublicFeed, PublicFeedItem } from "@/lib/types/feed";

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    // youtube.com/watch?v=VIDEO_ID
    if (hostname === "youtube.com" && urlObj.pathname === "/watch") {
      return urlObj.searchParams.get("v");
    }

    // youtube.com/shorts/VIDEO_ID
    if (hostname === "youtube.com" && urlObj.pathname.startsWith("/shorts/")) {
      return urlObj.pathname.split("/shorts/")[1]?.split("?")[0] || null;
    }

    // youtube.com/embed/VIDEO_ID
    if (hostname === "youtube.com" && urlObj.pathname.startsWith("/embed/")) {
      return urlObj.pathname.split("/embed/")[1]?.split("?")[0] || null;
    }

    // youtu.be/VIDEO_ID
    if (hostname === "youtu.be") {
      return urlObj.pathname.slice(1).split("?")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

export default function FeedItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedSlug = params.slug as string;
  const itemSlug = params.itemSlug as string;

  const [feed, setFeed] = useState<PublicFeed | null>(null);
  const [item, setItem] = useState<PublicFeedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch item directly via new endpoint and feed details for sidebar
  const fetchData = useCallback(async () => {
    if (!feedSlug || !itemSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch item and feed in parallel
      const [itemData, feedData] = await Promise.all([
        getPublicItem(feedSlug, itemSlug),
        getFeedBySlug(feedSlug),
      ]);

      setItem(itemData);
      setFeed(feedData);
    } catch (err: unknown) {
      console.error("Failed to load feed item:", err);
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 404
      ) {
        setError("Item not found");
      } else {
        setError("Failed to load content");
        toast.error("Failed to load content");
      }
    } finally {
      setIsLoading(false);
    }
  }, [feedSlug, itemSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between py-4 mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Back link skeleton */}
        <Skeleton className="h-6 w-32 mb-6" />

        {/* Two-column layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-4">
        {/* Public Header */}
        <PublicHeader />

        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {error === "Item not found" ? "Content Not Found" : "Error"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {error === "Item not found"
                ? "The content you're looking for doesn't exist or has been removed."
                : "Something went wrong while loading this content."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/discover")}>Browse Feeds</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - render item detail
  if (!item || !feed) {
    return null;
  }

  // Extract domain from link for display
  const sourceDomain = item.link ? new URL(item.link).hostname.replace("www.", "") : null;

  // Extract YouTube video ID if applicable
  const youtubeVideoId = item.link ? extractYouTubeVideoId(item.link) : null;
  const isYouTubeContent = !!youtubeVideoId;

  // Get author/creator name from item or feed
  const authorName = item.author || item.feed.creator?.name;

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
            <BreadcrumbLink asChild>
              <Link href={`/feed/${feedSlug}`}>{item.feed.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Column (2/3 width on desktop) */}
        <article className="lg:col-span-2 space-y-6">
          {/* YouTube Embed or Thumbnail */}
          {isYouTubeContent ? (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : item.thumbnail ? (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 800px"
              />
            </div>
          ) : null}

          {/* Item Title */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{item.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {/* Published date */}
            {item.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={item.published_at}>
                  {format(new Date(item.published_at), "MMMM d, yyyy")}
                </time>
              </div>
            )}

            {/* Author/Creator name */}
            {authorName && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
              </div>
            )}

            {/* Feed badge */}
            <Link href={`/feed/${feedSlug}`}>
              <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                {item.feed.name}
              </Badge>
            </Link>
          </div>

          {/* Description */}
          {item.description && (
            <div className="prose prose-sm sm:prose max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          )}

          {/* Read More / Watch on YouTube button */}
          {item.link && (
            <div className="pt-4">
              <Button asChild size="lg">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    isYouTubeContent ? `Watch on YouTube` : `Read full article at ${sourceDomain}`
                  }
                >
                  {isYouTubeContent ? "Watch on YouTube" : "Read Full Article"}
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              {sourceDomain && (
                <p className="text-xs text-muted-foreground mt-2">
                  Opens {sourceDomain} in a new tab
                </p>
              )}
            </div>
          )}
        </article>

        {/* Sidebar - Right Column (1/3 width on desktop) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Feed Info & Subscribe */}
            <FeedInfoSidebar feed={feed} />

            {/* Related Content */}
            <RelatedContentSection currentItemId={item.id} feed={feed} feedSlug={feedSlug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
