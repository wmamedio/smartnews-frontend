"use client";

import Image from "next/image";
import { ExternalLink, Calendar, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FeedItem } from "@/lib/types/feed";

interface ContentPreviewDialogProps {
  item: FeedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentPreviewDialog({ item, open, onOpenChange }: ContentPreviewDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(item.published_at), "PPP")}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {item.source}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          {item.image_url && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <Image src={item.image_url} alt={item.title} fill className="object-cover" />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          {/* Content (if available) */}
          {item.content && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Content</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>{item.content}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{item.source}</Badge>
              <span className="text-xs text-muted-foreground">
                Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>

            <Button variant="outline" size="sm" asChild>
              <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
