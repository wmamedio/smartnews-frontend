"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Target } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedName?: string;
  feedId?: number;
}

export function AuthModal({ open, onOpenChange, feedName, feedId }: AuthModalProps) {
  const returnUrl = feedId ? `/discover?feedId=${feedId}` : "/discover";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {feedName || "this feed"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4 text-center">
          <div className="flex justify-center text-4xl">
            <Target className="h-12 w-12 text-primary" />
          </div>

          <p className="text-sm text-muted-foreground">
            Create a free account or sign in to subscribe and get updates delivered to your
            dashboard.
          </p>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/register/subscriber?redirect=${encodeURIComponent(returnUrl)}`}>
                Sign Up
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href={`/login/subscriber?redirect=${encodeURIComponent(returnUrl)}`}>
                Log In
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">or continue browsing</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
