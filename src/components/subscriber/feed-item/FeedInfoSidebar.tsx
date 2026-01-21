"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, ArrowRight, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  createFeedSubscription,
  getMySubscriptions,
} from "@/lib/api/services/subscriptions.service";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { PublicFeed } from "@/lib/types/feed";

interface FeedInfoSidebarProps {
  feed: PublicFeed | null;
  isLoading?: boolean;
}

export function FeedInfoSidebar({ feed, isLoading }: FeedInfoSidebarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAuthenticated = isMounted && !!Cookies.get("access_token");
  const isSubscriber = user?.user_type === "subscriber";

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!feed || !isAuthenticated || !isSubscriber) {
        setIsCheckingSubscription(false);
        return;
      }

      try {
        const subscriptions = await getMySubscriptions();
        const isUserSubscribed = subscriptions.some(
          (sub) => sub.feed_id === feed.id && sub.is_active
        );
        setIsSubscribed(isUserSubscribed);
      } catch {
        // Silently handle - user may not be authenticated
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [feed, isAuthenticated, isSubscriber]);

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      // Redirect to subscriber registration with return URL
      const redirectUrl = encodeURIComponent(`/discover?feedId=${feed?.id}`);
      router.push(`/register/subscriber?redirect=${redirectUrl}`);
      return;
    }
    handleSubscribe();
  };

  const handleSubscribe = async () => {
    if (!feed) return;

    setIsSubscribing(true);
    try {
      await createFeedSubscription({ feed_id: feed.id });
      setIsSubscribed(true);
      toast.success("Subscribed successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to subscribe to feed";
      toast.error(errorMessage);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading || !feed) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          <Link href={`/feed/${feed.slug}`} className="hover:text-primary transition-colors">
            {feed.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feed description */}
        {feed.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{feed.description}</p>
        )}

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2">
          {feed.categories?.[0] && (
            <Badge variant="secondary" className="text-xs">
              {feed.categories[0].name}
            </Badge>
          )}
          {feed.update_frequency && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="mr-1 h-3 w-3" />
              {feed.update_frequency}
            </Badge>
          )}
          {feed.subscriber_count > 0 && (
            <Badge variant="outline" className="text-xs">
              <Users className="mr-1 h-3 w-3" />
              {formatNumber(feed.subscriber_count)} subscribers
            </Badge>
          )}
        </div>

        {/* Subscribe button or Subscribed badge */}
        {isMounted && !isCheckingSubscription && (
          <div className="pt-2">
            {isSubscribed ? (
              <Button
                variant="secondary"
                disabled
                className="w-full"
                aria-label={`You are subscribed to ${feed.name}`}
              >
                <Check className="mr-2 h-4 w-4" />
                Subscribed
              </Button>
            ) : (
              <Button
                onClick={handleSubscribeClick}
                disabled={isSubscribing}
                className="w-full"
                aria-label={`Subscribe to ${feed.name}`}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe FREE
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Loading state for subscription check */}
        {isMounted && isCheckingSubscription && <Skeleton className="h-10 w-full" />}

        {/* Link to feed page */}
        <div className="pt-2 border-t">
          <Link
            href={`/feed/${feed.slug}`}
            className="text-sm text-primary hover:underline inline-flex items-center"
          >
            View all newsletters
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format large numbers (e.g., 2400 → "2.4K")
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
