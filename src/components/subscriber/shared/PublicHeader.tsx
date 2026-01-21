"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, ChevronsUpDown } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

interface PublicHeaderProps {
  /** Optional feed ID for subscription redirect after login */
  feedId?: number;
  /** Optional feed name for auth modal context (kept for API compatibility) */
  feedName?: string;
}

export function PublicHeader({ feedId }: PublicHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // Check if user is authenticated (only on client to prevent hydration mismatch)
  const isAuthenticated = isMounted && !!Cookies.get("access_token");

  // Build redirect URL for after sign-up/login
  const getRedirectUrl = () => {
    if (feedId) {
      return `/discover?feedId=${feedId}`;
    }
    return pathname || "/discover";
  };

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email || "User";
  };

  // Handle manage subscriptions click
  const handleManageSubscriptions = () => {
    if (!isAuthenticated) {
      const redirectUrl = encodeURIComponent("/subscriptions");
      router.push(`/login/subscriber?redirect=${redirectUrl}`);
    } else {
      router.push("/subscriptions");
    }
  };

  // Handle logout click
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  };

  // Handle sign in click - redirect directly to subscriber registration
  const handleSignIn = () => {
    const redirectUrl = encodeURIComponent(getRedirectUrl());
    router.push(`/register/subscriber?redirect=${redirectUrl}`);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b mb-6">
      {/* Logo */}
      <Logo size="lg" href="/" />

      {/* User Info & Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto gap-2 px-2 py-1.5 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url || undefined} alt={getUserDisplayName()} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{getUserDisplayName()}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleManageSubscriptions}>
                <span>Manage Subscriptions</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleSignIn} variant="outline" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sign In to Subscribe</span>
            <span className="sm:hidden">Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}
