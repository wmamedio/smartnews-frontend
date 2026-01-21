"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, Lock, Palette, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Social",
    href: "/settings/social-connections",
    icon: Share2,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: Shield,
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Lock,
  },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <Tabs value={pathname} className="w-full">
      <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 h-auto">
        {settingsNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <TabsTrigger
              key={item.href}
              value={item.href}
              asChild
              className="flex-col gap-1 h-auto py-2"
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.title}</span>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
