"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendFeed, getReadyItemsCount } from "@/lib/api/feeds";
import type { Feed } from "@/lib/types/feed";

interface SendFeedDialogProps {
  feed: Feed;
  trigger?: React.ReactNode;
  onSendSuccess?: () => void;
}

export function SendFeedDialog({ feed, trigger, onSendSuccess }: SendFeedDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    items_sent: number;
    subscribers_notified: number;
    message: string;
  } | null>(null);

  // Fetch count of ready items when dialog opens
  const { data: readyItemsCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ["ready-items-count", feed.id],
    queryFn: () => getReadyItemsCount(feed.id),
    enabled: isConfirmOpen && !sendResult, // Only fetch when dialog is open and not yet sent
  });

  const sendMutation = useMutation({
    mutationFn: () => sendFeed(feed.id),
    onSuccess: (result) => {
      setSendResult(result);
      toast.success(`Feed sent to ${result.subscribers_notified} subscribers!`);
      onSendSuccess?.();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || "Failed to send feed";
      toast.error(errorMsg);
    },
  });

  const handleSend = () => {
    sendMutation.mutate();
  };

  // Reset send result when dialog closes
  useEffect(() => {
    if (!isConfirmOpen) {
      setSendResult(null);
      sendMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmOpen]);

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Feed Now?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {/* Success State */}
                {sendResult && (
                  <Alert className="border-primary bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground">
                      <div className="font-semibold mb-1">Feed sent successfully!</div>
                      <ul className="text-sm space-y-1">
                        <li>• {sendResult.items_sent} items sent</li>
                        <li>• {sendResult.subscribers_notified} subscribers notified</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Confirmation State */}
                {!sendResult && (
                  <>
                    <p>
                      You&apos;re about to send <strong>{feed.name}</strong> to all subscribers.
                    </p>

                    {isLoadingCount ? (
                      <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription className="text-sm">
                          Checking ready items...
                        </AlertDescription>
                      </Alert>
                    ) : readyItemsCount === 0 ? (
                      <Alert className="border-secondary bg-secondary/10">
                        <AlertCircle className="h-4 w-4 text-secondary" />
                        <AlertDescription className="text-foreground">
                          <strong>No items ready to send.</strong> Please add items with status
                          &quot;ready_for_publish&quot; before sending.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription className="text-sm">
                          <div className="font-semibold mb-2">
                            {readyItemsCount} {readyItemsCount === 1 ? "item" : "items"} ready to
                            send
                          </div>
                          This will immediately send all ready items to your subscribers via email.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {sendResult ? (
              <AlertDialogAction onClick={() => setIsConfirmOpen(false)}>Close</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={sendMutation.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSend}
                  disabled={sendMutation.isPending || isLoadingCount || readyItemsCount === 0}
                  className="bg-primary"
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </>
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
