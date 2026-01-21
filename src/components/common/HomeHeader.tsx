"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { usePublicPrefetch } from "@/lib/hooks/use-public-prefetch";

export function HomeHeader() {
  const { prefetchDiscover } = usePublicPrefetch();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <Logo href="/" size="lg" />
        <nav className="flex items-center gap-2">
          <Link href="/discover" onMouseEnter={prefetchDiscover} onFocus={prefetchDiscover}>
            <Button variant="ghost">Discover</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register/creator" className="ml-2">
            <Button>Create Your Feed</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
