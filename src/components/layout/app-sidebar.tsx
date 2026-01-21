"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Rss,
  DollarSign,
  Settings,
  HelpCircle,
  User,
  LogOut,
  FileText,
  Library,
  ExternalLink,
  Newspaper,
} from "lucide-react";

import { useAuthStore } from "@/lib/stores/auth-store";
import { profileService } from "@/lib/services/profile-service";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Feeds",
    url: "/feeds",
    icon: Rss,
  },
  {
    title: "Sources",
    url: "/content/sources",
    icon: FileText,
  },
  {
    title: "Library",
    url: "/content/library",
    icon: Library,
  },
  // {
  //   title: "Revenue",
  //   url: "/revenue",
  //   icon: DollarSign,
  // },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { isMobile, state } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = state === "collapsed";

  // Prefetch data on hover for instant navigation
  const handlePrefetch = React.useCallback(
    (url: string) => {
      // Always prefetch the route
      router.prefetch(url);

      // Also prefetch the data for each route
      if (url === "/feeds") {
        queryClient.prefetchQuery({
          queryKey: ["creator-feeds"],
          queryFn: () => fetchCreatorFeeds(),
          staleTime: 30 * 1000, // 30 seconds
        });
      } else if (url === "/content/sources") {
        queryClient.prefetchQuery({
          queryKey: ["feed-sources"],
          queryFn: () => feedSourcesService.getAll(),
          staleTime: 30 * 1000,
        });
      } else if (url === "/content/library") {
        // Prefetch first page of library items with default filters
        queryClient.prefetchQuery({
          queryKey: ["feed-items", { page: 1, per_page: 5 }],
          queryFn: () => feedItemsService.getAll({ page: 1, per_page: 5 }),
          staleTime: 30 * 1000,
        });
      }
      // Dashboard has more complex queries with dynamic feed selection,
      // so we skip data prefetch for it (route prefetch still works)
    },
    [router, queryClient]
  );

  // Fetch full profile data
  const { data: profileData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => profileService.getProfile(),
    enabled: !!user,
    retry: false, // Don't retry on 401 errors
    meta: {
      errorMessage: "Failed to load profile",
    },
  });

  const handleLogout = () => {
    logout();
  };

  // Extract first name from user profile
  const getFirstName = () => {
    // Check profileData first (most detailed)
    if (profileData?.first_name) {
      return profileData.first_name;
    }
    // Fallback to user.profile.name
    if (user?.profile?.name) {
      return user.profile.name.split(" ")[0];
    }
    // Last resort: check user email before defaulting
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Creator";
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4 lg:px-6 pt-8 pb-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 transition-opacity duration-200 hover:opacity-70 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-xl font-bold">
              <span className="text-foreground">Smart</span>
              <span className="text-primary">News</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <Link
                        href={item.url}
                        onMouseEnter={() => handlePrefetch(item.url)}
                        onFocus={() => handlePrefetch(item.url)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Secondary items section removed - Settings and Help now in User Menu */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profile?.avatar} alt={user?.profile?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.profile?.name?.slice(0, 2).toUpperCase() ||
                        user?.email?.slice(0, 2).toUpperCase() ||
                        "CN"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{getFirstName()}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.profile?.avatar} alt={user?.profile?.name} />
                      <AvatarFallback className="rounded-lg">
                        {user?.profile?.name?.slice(0, 2).toUpperCase() ||
                          user?.email?.slice(0, 2).toUpperCase() ||
                          "CN"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{getFirstName()}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/creator/${user?.id}`} target="_blank" rel="noopener noreferrer">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                    <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/help">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
