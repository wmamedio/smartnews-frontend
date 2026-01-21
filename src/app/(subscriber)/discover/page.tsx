"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { FeedGrid } from "@/components/subscriber/discovery/FeedGrid";
import { SearchBar } from "@/components/subscriber/discovery/SearchBar";
import { CategoryFilter } from "@/components/subscriber/discovery/CategoryFilter";
import { PublicHeader } from "@/components/subscriber/shared/PublicHeader";
import {
  discoverFeeds,
  getFeedCategories,
  getFeedNewsletters,
} from "@/lib/api/services/discovery.service";
import {
  createFeedSubscription,
  getMySubscriptions,
} from "@/lib/api/services/subscriptions.service";
import type { PublicFeed, FeedCategoryInfo } from "@/lib/types/feed";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useSearchParams, useRouter } from "next/navigation";
import { sampleFeeds, sampleCategories } from "@/lib/data/sample-feeds";

function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [feeds, setFeeds] = useState<PublicFeed[]>([]);
  const [categories, setCategories] = useState<FeedCategoryInfo[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [subscribedFeedIds, setSubscribedFeedIds] = useState<Set<number>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Check if user is authenticated (only on client to prevent hydration mismatch)
  const isAuthenticated = isMounted && !!Cookies.get("access_token");

  // Set mounted state and check if localhost
  useEffect(() => {
    setIsMounted(true);
    setIsLocalhost(
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    );
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      // Use sample data immediately on localhost
      if (isLocalhost) {
        console.log("Running on localhost, using sample categories");
        setCategories(sampleCategories);
        setIsLoadingCategories(false);
        return;
      }

      try {
        const data = await getFeedCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error: any) {
        // Silently fall back to sample data on timeout or connection errors
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          console.log("Server unavailable, using sample categories");
        } else {
          console.error("Failed to fetch categories:", error);
        }
        setCategories(sampleCategories);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isMounted) {
      fetchCategories();
    }
  }, [isLocalhost, isMounted]);

  // Fetch subscribed feeds if authenticated
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!isAuthenticated) {
        setSubscribedFeedIds(new Set());
        return;
      }

      try {
        const subscriptions = await getMySubscriptions();
        const feedIds = new Set(subscriptions.map((sub) => sub.feed_id));
        setSubscribedFeedIds(feedIds);
      } catch (error: unknown) {
        // Silently fail if 403 (not authenticated) or other auth errors
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 403 || err.response?.status === 401) {
          setSubscribedFeedIds(new Set());
        } else {
          console.error("Failed to fetch subscriptions:", error);
        }
      }
    };

    fetchSubscriptions();
  }, [isAuthenticated]);

  // Fetch feeds with filters - only show feeds that have sent newsletters
  const fetchFeeds = useCallback(async () => {
    setIsLoadingFeeds(true);

    // Use sample data immediately on localhost
    if (isLocalhost) {
      console.log("Running on localhost, using sample feeds");
      let filteredFeeds = sampleFeeds;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredFeeds = filteredFeeds.filter(
          (feed) =>
            feed.name.toLowerCase().includes(query) ||
            feed.description.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategory) {
        filteredFeeds = filteredFeeds.filter((feed) =>
          feed.categories.some((cat) => cat.slug === selectedCategory)
        );
      }

      setFeeds(filteredFeeds);
      setIsLoadingFeeds(false);
      return;
    }

    try {
      const data = await discoverFeeds({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        limit: 50, // Fetch more to account for filtering
      });

      // Filter out feeds with no content items first
      const feedsWithContent = (Array.isArray(data) ? data : []).filter(
        (feed) => feed.item_count > 0
      );

      // Check which feeds have sent newsletters (in parallel)
      const feedsWithNewsletterStatus = await Promise.all(
        feedsWithContent.map(async (feed) => {
          try {
            const response = await getFeedNewsletters(feed.id, { limit: 1 });
            return { feed, hasNewsletters: response.total > 0 };
          } catch {
            return { feed, hasNewsletters: false };
          }
        })
      );

      // Only keep feeds that have sent at least one newsletter
      const feedsWithNewsletters = feedsWithNewsletterStatus
        .filter((item) => item.hasNewsletters)
        .map((item) => item.feed);

      setFeeds(feedsWithNewsletters);
    } catch (error: any) {
      // Silently fall back to sample data on timeout or connection errors
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.log("Server unavailable, using sample feeds");
      } else {
        console.error("Failed to fetch feeds:", error);
      }

      // Use sample data as fallback
      let filteredFeeds = sampleFeeds;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredFeeds = filteredFeeds.filter(
          (feed) =>
            feed.name.toLowerCase().includes(query) ||
            feed.description.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategory) {
        filteredFeeds = filteredFeeds.filter((feed) =>
          feed.categories.some((cat) => cat.slug === selectedCategory)
        );
      }

      setFeeds(filteredFeeds);
    } finally {
      setIsLoadingFeeds(false);
    }
  }, [searchQuery, selectedCategory, isLocalhost]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Handle auto-subscribe from redirect after login
  useEffect(() => {
    const feedId = searchParams.get("feedId");
    if (feedId && isAuthenticated) {
      const id = parseInt(feedId, 10);
      if (!isNaN(id) && !subscribedFeedIds.has(id)) {
        handleSubscribe(id);
      }
    }
  }, [searchParams, isAuthenticated, subscribedFeedIds]);

  // Handle subscribe button click
  const handleSubscribeClick = (feedId: number) => {
    if (!isAuthenticated) {
      // Redirect to subscriber registration with return URL
      const redirectUrl = encodeURIComponent(`/discover?feedId=${feedId}`);
      router.push(`/register/subscriber?redirect=${redirectUrl}`);
      return;
    }

    handleSubscribe(feedId);
  };

  // Handle actual subscription
  const handleSubscribe = async (feedId: number) => {
    try {
      // Subscribe to feed
      await createFeedSubscription({ feed_id: feedId });

      // Update subscribed feeds
      setSubscribedFeedIds((prev) => new Set(prev).add(feedId));

      toast.success("Subscribed successfully!");
    } catch (error: unknown) {
      console.error("Failed to subscribe:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to subscribe to feed");
    }
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handle preview click
  const handlePreviewClick = (feedId: number) => {
    const feed = feeds.find((f) => f.id === feedId);
    if (feed) {
      console.log("Preview feed:", { id: feed.id, slug: feed.slug, feed });
      if (!feed.slug) {
        console.error("Feed has no slug, using ID instead");
        toast.error("Feed slug is missing, please try again");
        return;
      }
      router.push(`/feed/${feed.slug}`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-4">
      {/* Public Header */}
      <PublicHeader />

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Discover Feeds</h1>
        <p className="text-muted-foreground">
          Browse and subscribe to curated content feeds from creators
        </p>
      </div>

      {/* Search Bar and Category Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={handleSearchChange} />
        </div>
        <div className="w-full sm:w-72 lg:w-80">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isLoading={isLoadingCategories}
          />
        </div>
      </div>

      {/* Feed Grid */}
      <FeedGrid
        feeds={feeds}
        isLoading={isLoadingFeeds}
        subscribedFeedIds={subscribedFeedIds}
        onSubscribeClick={handleSubscribeClick}
        onPreviewClick={handlePreviewClick}
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8">Loading...</div>}>
      <DiscoverPageContent />
    </Suspense>
  );
}
