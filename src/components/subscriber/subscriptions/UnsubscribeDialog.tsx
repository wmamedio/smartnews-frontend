"use client";

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
import type { FeedSubscriptionWithDetails } from "@/lib/types/feed";

interface UnsubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: FeedSubscriptionWithDetails | null;
  onConfirm: (subscriptionId: number) => Promise<void>;
}

export function UnsubscribeDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: UnsubscribeDialogProps) {
  const handleConfirm = async () => {
    if (!subscription) return;
    await onConfirm(subscription.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsubscribe from {subscription?.feed.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer receive updates from this feed. You can always resubscribe later from
            the discovery page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Unsubscribe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
