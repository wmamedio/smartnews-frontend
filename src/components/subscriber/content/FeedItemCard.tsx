"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { CreatorFeedItemResponse } from "@/lib/types/feed";

interface FeedItemCardProps {
  item: CreatorFeedItemResponse;
}

export function FeedItemCard({ item }: FeedItemCardProps) {
  const publishedDate = format(new Date(item.created_at), "MMM d, yyyy");

  const handleReadMore = () => {
    if (item.url || item.source_url) {
      window.open(item.url || item.source_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-2">{item.title}</CardTitle>
        <CardDescription>{publishedDate}</CardDescription>
      </CardHeader>

      {item.description && (
        <CardContent>
          <p className="line-clamp-4 text-sm text-muted-foreground">{item.description}</p>
        </CardContent>
      )}

      {(item.url || item.source_url) && (
        <CardFooter>
          <Button variant="link" className="h-auto p-0" onClick={handleReadMore}>
            Read More
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
