"use client";

import * as React from "react";
import { Moon, Sun, Monitor, X, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DevThemeSwitcher() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Check URL params for theme override
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get("theme");
    if (themeParam && ["light", "dark", "system"].includes(themeParam)) {
      setTheme(themeParam);
    }
  }, [setTheme]);

  // Only show in development
  if (!mounted || process.env.NODE_ENV === "production") {
    return null;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  // Hide completely when hidden (until page refresh)
  if (isHidden) {
    return null;
  }

  // Collapsed view - just show icon
  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-16 left-[14px] z-50 h-10 w-10 p-0 bg-card border-2 rounded-lg shadow-lg backdrop-blur opacity-10 hover:opacity-100 transition-opacity duration-200"
        title="Theme settings"
      >
        {currentTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
    );
  }

  // Expanded view - show full panel
  return (
    <div className="fixed bottom-16 left-[14px] z-50 flex items-center gap-2 p-3 bg-card border-2 rounded-lg shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="mr-2">
          DEV MODE
        </Badge>

        <div className="flex gap-1">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTheme("light");
              // Update URL param
              const url = new URL(window.location.href);
              url.searchParams.set("theme", "light");
              window.history.replaceState({}, "", url);
            }}
            className="h-8"
          >
            <Sun className="h-4 w-4 mr-1" />
            Light
          </Button>

          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTheme("dark");
              // Update URL param
              const url = new URL(window.location.href);
              url.searchParams.set("theme", "dark");
              window.history.replaceState({}, "", url);
            }}
            className="h-8"
          >
            <Moon className="h-4 w-4 mr-1" />
            Dark
          </Button>

          <Button
            variant={theme === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTheme("system");
              // Update URL param
              const url = new URL(window.location.href);
              url.searchParams.delete("theme");
              window.history.replaceState({}, "", url);
            }}
            className="h-8"
          >
            <Monitor className="h-4 w-4 mr-1" />
            System
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-6 w-6 p-0 hover:bg-muted"
          title="Collapse theme switcher"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
