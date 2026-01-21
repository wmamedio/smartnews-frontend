"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Show only the icon (no text) */
  iconOnly?: boolean;
}

const sizeClasses = {
  sm: {
    text: "text-lg",
    icon: "h-4 w-4",
  },
  md: {
    text: "text-xl",
    icon: "h-5 w-5",
  },
  lg: {
    text: "text-2xl",
    icon: "h-6 w-6",
  },
};

export function Logo({
  href = "/login/subscriber",
  className,
  size = "md",
  iconOnly = false,
}: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const sizes = sizeClasses[size];

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 transition-opacity duration-200",
        mounted ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <Newspaper className={cn("text-primary", sizes.icon)} />
      {!iconOnly && (
        <span className={cn("font-bold", sizes.text)}>
          <span className="text-foreground">Smart</span>
          <span className="text-primary">News</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-70 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
