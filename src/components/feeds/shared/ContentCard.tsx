"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/types/feed";

interface ContentCardProps {
  item: FeedItem;
  isSelected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  variant?: "grid" | "list";
  showCheckbox?: boolean;
}

// Helper function to get initials from title
function getTitleInitials(title: string): string {
  const words = title.trim().toUpperCase().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3);
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("");
}

// Helper function to generate consistent color from title
function getTitleColor(title: string): string {
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-primary/80",
    "bg-secondary/80",
    "bg-primary/60",
    "bg-secondary/60",
    "bg-muted-foreground",
    "bg-accent",
  ];
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function ContentCard({
  item,
  isSelected = false,
  onSelect,
  onPreview,
  variant = "grid",
  showCheckbox = true,
}: ContentCardProps) {
  if (variant === "list") {
    return (
      <Card
        className={cn(
          "flex items-center gap-4 p-4 cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
        onClick={onSelect}
      >
        {showCheckbox && <Checkbox checked={isSelected} className="flex-shrink-0" />}

        {/* Thumbnail or fallback */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.title} fill className="object-cover" />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center text-white font-bold text-sm",
                getTitleColor(item.title)
              )}
            >
              {getTitleInitials(item.title)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{item.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })} • {item.source}
          </p>
        </div>

        {onPreview && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </Card>
    );
  }

  // Grid variant
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <div className="relative">
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            className="absolute top-2 left-2 z-10 bg-background shadow-sm"
          />
        )}

        {item.image_url ? (
          <div className="relative aspect-video bg-muted overflow-hidden">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div
            className={cn(
              "aspect-video flex items-center justify-center text-white font-bold text-3xl",
              getTitleColor(item.title)
            )}
          >
            {getTitleInitials(item.title)}
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm line-clamp-2 leading-snug">{item.title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
        </p>
      </CardContent>

      {onPreview && (
        <CardFooter className="p-4 pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
