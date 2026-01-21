"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteFeed } from "@/lib/api/feeds";
import type { Feed } from "@/lib/types/feed";

interface DeleteFeedDialogProps {
  feed: Feed;
  onDeleteSuccess: (feedId: number) => void;
  trigger?: React.ReactNode;
}

export function DeleteFeedDialog({ feed, onDeleteSuccess, trigger }: DeleteFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFeed(feed.id);
      toast.success("Feed deleted successfully", {
        description: `"${feed.name}" has been permanently removed.`,
      });
      setOpen(false);
      onDeleteSuccess(feed.id); // Pass feed ID for optimistic update
    } catch (error: any) {
      console.error("Error deleting feed:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Unable to delete feed. Please try again.";
      toast.error("Failed to delete feed", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" aria-label="Delete feed">
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Feed</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this feed? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Feed name display */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are about to delete: <strong>{feed.name}</strong>
            </AlertDescription>
          </Alert>

          {/* Published feed warning */}
          {feed.status === "published" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This feed is currently <strong>published</strong>. Deleting it will remove access
                for all subscribers.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Feed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
