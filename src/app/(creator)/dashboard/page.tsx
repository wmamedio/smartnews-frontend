"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Settings,
  BarChart3,
  FileText,
  Plus,
  BookOpen,
  ExternalLink,
  Edit,
  ArrowRight,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { profileService } from "@/lib/services/profile-service";
import type { ProfileSetupInput } from "@/lib/schemas/profile";
import { QuickAddCard } from "@/components/dashboard/QuickAddCard";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { SendFeedDialog } from "@/components/feeds/dialogs/SendFeedDialog";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import { cn } from "@/lib/utils";
import { ContentRatingActions } from "@/components/content/preview/ContentRatingActions";
import { KeywordRefinementDialog } from "@/components/content/preview/KeywordRefinementDialog";
import { useContentRating } from "@/hooks/useContentRating";
import { toast } from "sonner";

export default function CreatorDashboardPage() {
  const { user, isLoading, isLoggingOut, isHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState<Partial<ProfileSetupInput> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);

  // Wait for component to be ready before enabling queries
  // This prevents race conditions on page refresh
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure auth cookies are fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Rating functionality state
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  // Content rating hook - centralizes all rating logic
  const {
    handleRating,
    handleAddKeywords,
    keywordDialogOpen,
    setKeywordDialogOpen,
    keywordDialogData,
  } = useContentRating({
    invalidateQueryKeys: [["recent-feed-items"]],
  });

  // Feed scroll navigation
  const feedScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = useCallback(() => {
    if (feedScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = feedScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollFeeds = (direction: "left" | "right") => {
    if (feedScrollRef.current) {
      const scrollAmount = 200;
      feedScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Fetch dashboard overview statistics
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isFetching: isFetchingOverview,
    error: overviewError,
  } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const data = await dashboardService.getOverview();
      return data;
    },
    enabled: !!user && isHydrated && isReady, // Wait for auth to fully initialize
    retry: 2, // Retry twice on failure (helps with race conditions on refresh)
    retryDelay: 500, // Wait 500ms between retries
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider fresh for 30 seconds (prevents excessive refetches)
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false,
  });

  // Fetch user's feeds
  const {
    data: feedsData,
    isLoading: isLoadingFeeds,
    error: feedsError,
  } = useQuery({
    queryKey: ["creator-feeds-dashboard"],
    queryFn: async () => {
      return await fetchCreatorFeeds({ limit: 10, is_published: true });
    },
    enabled: !!user && isHydrated && isReady,
    retry: 2,
    retryDelay: 500,
  });

  // All published (non-draft) feeds
  const publishedFeeds = useMemo(() => {
    if (!feedsData?.feeds) return [];
    return feedsData.feeds.filter((feed) => feed.status !== "draft");
  }, [feedsData?.feeds]);

  // Filter feeds to only show published feeds with ready_for_publish items
  const feedsWithContent = useMemo(() => {
    return publishedFeeds.filter((feed) => (feed.items_count || 0) > 0);
  }, [publishedFeeds]);

  // Get selected feed or default to most recent
  const mostRecentFeed = useMemo(() => {
    if (feedsWithContent.length === 0) return null;
    if (selectedFeedId) {
      return feedsWithContent.find((feed) => feed.id === selectedFeedId) || feedsWithContent[0];
    }
    return feedsWithContent[0];
  }, [feedsWithContent, selectedFeedId]);

  // Initialize selected feed when feeds load
  useEffect(() => {
    if (feedsWithContent.length > 0 && !selectedFeedId) {
      setSelectedFeedId(feedsWithContent[0].id);
    }
  }, [feedsWithContent, selectedFeedId]);

  // Check scroll position when feeds load
  useEffect(() => {
    if (feedsWithContent.length > 0) {
      checkScrollPosition();
      const scrollContainer = feedScrollRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", checkScrollPosition);
        return () => scrollContainer.removeEventListener("scroll", checkScrollPosition);
      }
    }
  }, [feedsWithContent, checkScrollPosition]);

  // Fetch feed items for the next feed
  const { data: recentFeedItems, isLoading: isLoadingFeedItems } = useQuery({
    queryKey: ["recent-feed-items", mostRecentFeed?.id],
    queryFn: async () => {
      return await feedItemsService.getAll({
        feed_id: mostRecentFeed?.id,
        status: "ready_for_publish",
        per_page: 5,
        page: 1,
      });
    },
    enabled: !!mostRecentFeed,
  });

  // Check if user just signed up (from sessionStorage)
  useEffect(() => {
    const justSignedUp = sessionStorage.getItem("justSignedUp");
    if (justSignedUp === "true") {
      setIsNewUser(true);
      sessionStorage.removeItem("justSignedUp"); // Clear flag after reading
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Calculate stats from overview data
  const stats = useMemo(() => {
    if (!overview) {
      return {
        totalFeeds: 0,
        totalSubscribers: 0,
        totalRevenue: 0,
        revenueChange: 0,
        subscribersChange: 0,
      };
    }

    return {
      totalFeeds: overview.total_feeds,
      totalSubscribers: overview.total_subscribers,
      totalRevenue: overview.estimated_monthly_revenue_usd,
      revenueChange: overview.subscriber_growth_rate,
      subscribersChange: overview.subscriber_growth_rate,
    };
  }, [overview]);

  // Show logging out state (prevents "Access Denied" flash during redirect)
  if (isLoggingOut) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Logging out...</p>
        </div>
      </div>
    );
  }

  // Show loading state during other operations
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show "Access Denied" if not logging out (shouldn't happen with middleware, but defensive)
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access your dashboard.</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Extract first name from user profile
  const getFirstName = () => {
    // Check profileData first (more detailed)
    if (profileData?.first_name) {
      return profileData.first_name;
    }
    // Fallback to user.profile.name
    if (user.profile?.name) {
      const firstName = user.profile.name.split(" ")[0];
      return firstName;
    }
    // Last resort: check user email before defaulting
    if (user.email) {
      return user.email.split("@")[0];
    }
    return "Creator";
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6 pb-32">
        {/* Page header with title and optional controls */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isNewUser ? "Welcome" : "Welcome back"}, {getFirstName()}!
            </h1>
            <p className="text-muted-foreground">
              {isNewUser
                ? "Let's get started building your creator presence."
                : "Here's what's happening with your content today."}
            </p>
          </div>
        </div>

        {/* Error Alert for Overview Data - Only show if not retrying */}
        {overviewError && !isFetchingOverview && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>
              Failed to load dashboard statistics. Please try refreshing the page or logging in
              again.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Prompt - Show only if name or bio is missing (avatar is optional) */}
        {profileData &&
          (!(profileData.name || (profileData.first_name && profileData.last_name)) ||
            !profileData.bio) && (
            <Alert className="mb-8">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Complete your profile to unlock revenue estimation and attract more subscribers
                  </span>
                </div>
                <Button asChild size="sm" variant="default">
                  <Link href="/settings/profile">Complete Profile</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

        {/* Main Content Grid: Feed Content (left) + Stats & Profile (right) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] mb-8">
          {/* Conditionally show content based on feed state */}
          {!isLoadingFeeds && mostRecentFeed ? (
            /* Case 1: Has feeds with content - Show feed tabs and items */
            <Card>
              <CardHeader className="space-y-4">
                {/* Section Title */}
                <CardTitle>Your Feeds</CardTitle>

                {/* Feed Selector + Actions Row */}
                {feedsWithContent.length > 0 && (
                  <Tabs
                    value={selectedFeedId?.toString()}
                    onValueChange={(id) => setSelectedFeedId(Number(id))}
                  >
                    <div className="flex items-center gap-3">
                      {/* Tabs Container with Scroll Indicators */}
                      <div className="relative flex-1 min-w-0">
                        {/* Left fade indicator */}
                        {canScrollLeft && (
                          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none rounded-l-md" />
                        )}

                        {/* Scrollable Tabs List */}
                        <div
                          ref={feedScrollRef}
                          className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
                        >
                          <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted/50 p-1 gap-2 w-auto">
                            {feedsWithContent.map((feed) => (
                              <TabsTrigger
                                key={feed.id}
                                value={feed.id.toString()}
                                className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
                                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                                  "data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-accent-foreground"
                                )}
                              >
                                <span className="mr-2">{feed.name}</span>
                                <Badge
                                  variant={selectedFeedId === feed.id ? "secondary" : "outline"}
                                  className={cn(
                                    "h-5 px-1.5 text-xs font-normal",
                                    selectedFeedId === feed.id
                                      ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                                      : ""
                                  )}
                                >
                                  {feed.items_count || 0}
                                </Badge>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>

                        {/* Right fade indicator */}
                        {canScrollRight && (
                          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none rounded-r-md" />
                        )}
                      </div>

                      {/* Action Buttons Group */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Navigation Buttons - Only show if content overflows */}
                        {(canScrollLeft || canScrollRight) && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => scrollFeeds("left")}
                              disabled={!canScrollLeft}
                              aria-label="Scroll feeds left"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => scrollFeeds("right")}
                              disabled={!canScrollRight}
                              aria-label="Scroll feeds right"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        )}

                        {/* Send Now Button */}
                        {!mostRecentFeed.schedule && (
                          <SendFeedDialog
                            feed={mostRecentFeed}
                            trigger={
                              <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10"
                                aria-label="Send feed now"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </Tabs>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingFeedItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentFeedItems && recentFeedItems.items.length > 0 ? (
                  <div className="space-y-4">
                    {recentFeedItems.items.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="relative border rounded-lg p-4 hover:bg-accent/30 transition-colors overflow-hidden"
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-semibold text-base line-clamp-2 flex-1">
                                {item.title}
                              </h4>
                              {item.feed_source?.name && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {item.feed_source.name}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                {item.description}
                              </p>
                            )}
                            {item.published_at && (
                              <span className="text-xs text-muted-foreground mt-2 block">
                                {new Date(item.published_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {item.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                          )}
                        </div>

                        {/* Rating Overlay - Covers entire card */}
                        <ContentRatingActions
                          isVisible={hoveredItemId === item.id}
                          onThumbsUp={() => handleRating(item, "up")}
                          onThumbsDown={() => handleRating(item, "down")}
                          currentStatus={item.status}
                        />
                      </div>
                    ))}
                    <Button asChild className="w-full" variant="outline">
                      <Link
                        href={`/content/library?feed_id=${mostRecentFeed.id}&status=ready_for_publish`}
                      >
                        View Full Feed
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>No content in this feed yet.</p>
                    <Button asChild className="mt-4" variant="outline" size="sm">
                      <Link href={`/feeds/${mostRecentFeed.id}/edit?step=1`}>
                        Add Content Sources
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : !isLoadingFeeds && publishedFeeds.length > 0 ? (
            /* Case 2: Has published feeds but no content ready - Show Quick Add as main action */
            <QuickAddCard />
          ) : (
            /* Case 3: No published feeds - Show "Create your first feed" */
            <Card className="overflow-hidden border-2 border-primary/20">
              <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-6">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

                <CardHeader className="relative p-0 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Ready to Create?</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Launch your first feed and start sharing content with your audience
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative p-0 pt-2">
                  <Button
                    className="w-full justify-center h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    variant="default"
                    asChild
                  >
                    <Link href="/feeds/create">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Your First Feed
                    </Link>
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    It only takes a few minutes to get started
                  </p>
                </CardContent>
              </div>
            </Card>
          )}

          {/* Right Column: Quick Add + Stats + Profile */}
          <div className="space-y-6">
            {/* Quick Add Content - Show only when user has feeds WITH content (not shown when Quick Add is in main section) */}
            {feedsData?.feeds && feedsData.feeds.length > 0 && feedsWithContent.length > 0 && (
              <QuickAddCard />
            )}

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Feeds</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingOverview || !overview ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.totalFeeds}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingOverview || !overview ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                      <p className="text-xs text-muted-foreground">
                        {overview?.new_subscribers_this_month
                          ? `+${overview.new_subscribers_this_month} this month`
                          : "No new subscribers this month"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoadingOverview ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        $
                        {(stats.totalRevenue || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">Estimated monthly</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    {/* Profile Header Skeleton */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>

                    {/* Bio Skeleton */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </div>
                ) : profileData ? (
                  <>
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profileData.avatar} alt={profileData.name || "Profile"} />
                        <AvatarFallback className="text-lg">
                          {profileData.first_name?.[0] || ""}
                          {profileData.last_name?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {profileData.name || `${profileData.first_name} ${profileData.last_name}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">{profileData.email}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {profileData.bio ? (
                      <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No bio added yet. Add one to tell others about yourself.
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/creator/${user?.id}`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </Button>
                      <Button variant="default" size="sm" asChild className="flex-1">
                        <Link href="/settings/profile">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Failed to load profile data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Keyword Refinement Dialog */}
      {keywordDialogData && (
        <KeywordRefinementDialog
          open={keywordDialogOpen}
          onOpenChange={setKeywordDialogOpen}
          keywords={keywordDialogData.keywords}
          mode={keywordDialogData.mode}
          onAddKeywords={handleAddKeywords}
          sourceName={keywordDialogData.sourceName}
        />
      )}
    </>
  );
}
