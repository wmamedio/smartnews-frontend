"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, FileText, Calendar, Eye, MoreVertical } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import type { PublicFeed, FeedSubscriptionWithDetails } from "@/lib/types/feed";
import { usePublicPrefetch } from "@/lib/hooks/use-public-prefetch";

/**
 * Safely formats a date string, handling invalid dates gracefully
 */
function formatSafeDate(dateString: string | undefined | null, formatString: string): string {
  if (!dateString) return "N/A";

  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, formatString);
    }

    const nativeDate = new Date(dateString);
    if (isValid(nativeDate)) {
      return format(nativeDate, formatString);
    }

    return "N/A";
  } catch (error) {
    console.warn("Failed to parse date:", dateString, error);
    return "N/A";
  }
}

/**
 * Formats delivery frequency to proper case
 */
function formatFrequency(frequency: string | undefined | null): string {
  if (!frequency) return "N/A";
  return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
}

/**
 * Format count for display (1000 -> 1k)
 */
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Get creator avatar URL with proper API base URL handling
 */
function getAvatarUrl(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl) return undefined;
  return avatarUrl.startsWith("http")
    ? avatarUrl
    : `${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`;
}

// Discovery mode props
interface DiscoveryModeProps {
  mode: "discovery";
  feed: PublicFeed;
  isSubscribed?: boolean;
  onSubscribeClick: (feedId: number) => void;
  onPreviewClick: (feedId: number) => void;
}

// Subscription mode props
interface SubscriptionModeProps {
  mode: "subscription";
  subscription: FeedSubscriptionWithDetails;
  onViewContent: (subscription: FeedSubscriptionWithDetails) => void;
  onEditFrequency: (subscription: FeedSubscriptionWithDetails) => void;
  onUnsubscribe: (subscription: FeedSubscriptionWithDetails) => void;
}

type FeedCardProps = DiscoveryModeProps | SubscriptionModeProps;

export function FeedCard(props: FeedCardProps) {
  const { prefetchFeedPage } = usePublicPrefetch();

  // Extract common data based on mode
  const feedName = props.mode === "discovery" ? props.feed.name : props.subscription.feed.name;

  const feedDescription =
    props.mode === "discovery" ? props.feed.description : props.subscription.feed.description;

  const creator = props.mode === "discovery" ? props.feed.creator : props.subscription.creator;

  const avatarUrl = getAvatarUrl(creator.avatar_url);

  const creatorName =
    props.mode === "discovery"
      ? props.feed.creator.name || `Creator ${props.feed.creator.hash.substring(0, 8)}`
      : `Creator ${props.subscription.creator.hash.substring(0, 8)}`;

  // Handle prefetch on hover (only for discovery mode with a slug)
  const handleMouseEnter = () => {
    if (props.mode === "discovery" && props.feed.slug) {
      prefetchFeedPage(props.feed.slug);
    }
  };

  return (
    <Card
      className="flex h-full flex-col transition-shadow hover:shadow-lg cursor-pointer"
      onClick={
        props.mode === "subscription"
          ? () => props.onViewContent(props.subscription)
          : () => props.onPreviewClick(props.feed.id)
      }
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader
        className={
          props.mode === "subscription"
            ? "flex flex-row items-start justify-between space-y-0 pb-3"
            : "space-y-3"
        }
      >
        <div className={props.mode === "subscription" ? "space-y-2" : undefined}>
          <CardTitle className="line-clamp-2">{feedName}</CardTitle>

          {/* Creator Info + Categories */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className={props.mode === "discovery" ? "h-6 w-6" : "h-5 w-5"}>
                <AvatarImage src={avatarUrl} alt={creatorName} />
                <AvatarFallback className="text-xs">
                  {creator.hash.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardDescription className="line-clamp-1 text-xs">{creatorName}</CardDescription>
            </div>
            {/* Categories - aligned right (discovery mode only) */}
            {props.mode === "discovery" &&
              props.feed.categories &&
              props.feed.categories.length > 0 && (
                <span className="text-xs text-muted-foreground truncate max-w-[40%]">
                  {props.feed.categories.map((cat) => cat.name).join(", ")}
                </span>
              )}
          </div>
        </div>

        {/* Subscription mode: Dropdown menu */}
        {props.mode === "subscription" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => props.onViewContent(props.subscription)}>
                <Eye className="mr-2 h-4 w-4" />
                View Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onEditFrequency(props.subscription)}>
                <Calendar className="mr-2 h-4 w-4" />
                Edit Frequency
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => props.onUnsubscribe(props.subscription)}
                className="text-destructive focus:text-destructive"
              >
                Unsubscribe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className={props.mode === "discovery" ? "flex-1 space-y-3" : "space-y-2"}>
        {feedDescription && (
          <p
            className={`line-clamp-${props.mode === "discovery" ? "3" : "2"} text-sm text-muted-foreground`}
          >
            {feedDescription}
          </p>
        )}

        {/* Discovery mode: Stats */}
        {props.mode === "discovery" && (
          <>
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                {props.feed.update_frequency}
              </Badge>

              {props.feed.item_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="mr-1 h-3 w-3" />
                  {formatCount(props.feed.item_count)} items
                </Badge>
              )}

              {props.feed.subscriber_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {formatCount(props.feed.subscriber_count)} subscribers
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Subscription mode: Frequency + Status */}
        {props.mode === "subscription" && (
          <div className="flex flex-wrap gap-2">
            {props.subscription.delivery_frequency && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                {formatFrequency(props.subscription.delivery_frequency)}
              </Badge>
            )}

            {!props.subscription.is_active && (
              <Badge variant="destructive" className="text-xs">
                Paused
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Discovery mode: Action buttons */}
      {props.mode === "discovery" && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              props.onPreviewClick(props.feed.id);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          {props.isSubscribed ? (
            <Button variant="secondary" className="flex-1" disabled>
              Subscribed
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                props.onSubscribeClick(props.feed.id);
              }}
            >
              Subscribe
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
