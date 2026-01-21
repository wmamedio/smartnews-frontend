"use client";

import { useRouter } from "next/navigation";
import { Rss, Plus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoFeedsAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: Action type for customized messaging */
  actionType?: "add-source" | "add-content";
}

/**
 * Alert dialog shown when user tries to add a source/content but has no feeds.
 * Offers to create a new feed or cancel.
 */
export function NoFeedsAlert({ open, onOpenChange, actionType = "add-source" }: NoFeedsAlertProps) {
  const router = useRouter();

  const handleCreateFeed = () => {
    onOpenChange(false);
    router.push("/feeds/create");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Rss className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>Create a Feed First</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {actionType === "add-content"
              ? "Before adding content, you need to create at least one feed. Feeds are collections of content that you can share with your subscribers."
              : "Before adding sources, you need to create at least one feed. Sources provide content to your feeds, so you need a feed to associate them with."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Do It Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateFeed}>
            <Plus className="mr-2 h-4 w-4" />
            Create Feed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
