import Link from "next/link";
import { User, Shield, Bell, Lock, Palette, Share2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const settingsCards = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your public profile and personal information",
    href: "/settings/profile",
  },
  {
    icon: Share2,
    title: "Social Connections",
    description: "Connect your social media accounts to import content",
    href: "/settings/social-connections",
  },
  {
    icon: Shield,
    title: "Account Security",
    description: "Password, email, and account security settings",
    href: "/settings/account",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the theme and visual preferences",
    href: "/settings/appearance",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Email and push notification preferences",
    href: "/settings/notifications",
  },
  {
    icon: Lock,
    title: "Privacy",
    description: "Control your data and profile visibility",
    href: "/settings/privacy",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer h-full group">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-primary group-hover:text-accent-foreground" />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed group-hover:text-accent-foreground/80">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
