"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Inbox } from "lucide-react";

export function EmptySubscriptions() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-10 w-10 text-muted-foreground" />
      </div>

      <h3 className="mb-2 text-lg font-semibold">No subscriptions yet</h3>

      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        You haven&apos;t subscribed to any feeds yet. Browse feeds to get started and receive
        curated content.
      </p>

      <Button asChild>
        <Link href="/discover">Browse Feeds</Link>
      </Button>
    </div>
  );
}
