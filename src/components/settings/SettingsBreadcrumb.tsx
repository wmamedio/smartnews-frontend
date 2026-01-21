"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function SettingsBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Dashboard
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href="/settings"
        className="hover:text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Settings
      </Link>
      {segments.length > 1 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {segments[segments.length - 1].charAt(0).toUpperCase() +
              segments[segments.length - 1].slice(1)}
          </span>
        </>
      )}
    </div>
  );
}
