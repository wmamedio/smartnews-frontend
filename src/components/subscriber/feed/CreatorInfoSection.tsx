"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicFeed } from "@/lib/types/feed";

interface CreatorInfoSectionProps {
  feed: PublicFeed;
}

export function CreatorInfoSection({ feed }: CreatorInfoSectionProps) {
  // Extract creator initials for avatar fallback
  const creatorName = feed.creator?.name || "Unknown Creator";
  const creatorInitials =
    creatorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* Creator Avatar */}
          <Avatar className="h-20 w-20 ring-4 ring-primary/20 ring-offset-2 ring-offset-background transition-transform hover:scale-105">
            <AvatarImage src={feed.creator?.avatar_url || undefined} alt={creatorName} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {creatorInitials}
            </AvatarFallback>
          </Avatar>

          {/* Creator Info */}
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold leading-tight">{creatorName}</h2>

            {feed.creator?.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                {feed.creator.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
