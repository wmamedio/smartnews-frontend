"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, Lock, Palette, Share2 } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your public profile",
  },
  {
    title: "Social Connections",
    href: "/settings/social-connections",
    icon: Share2,
    description: "Connect social media accounts",
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: Shield,
    description: "Password and security",
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    description: "Theme and visual preferences",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email and push settings",
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Lock,
    description: "Data and visibility",
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      <div className="px-3 py-2">
        <h2 className="mb-2 text-lg font-semibold">Settings</h2>
      </div>
      <SidebarMenu>
        {settingsNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={item.href}>
                  <Icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
