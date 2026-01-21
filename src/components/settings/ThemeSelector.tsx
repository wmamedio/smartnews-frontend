"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const themes = [
  {
    value: "light",
    label: "Light",
    description: "Light theme with bright colors",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark theme for low-light environments",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Automatically match your device theme",
    icon: Monitor,
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4">
        {themes.map((t) => (
          <div
            key={t.value}
            className="flex items-center space-x-4 rounded-lg border border-border p-4 animate-pulse"
          >
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup value={theme} onValueChange={setTheme} className="grid gap-4">
      {themes.map((t) => {
        const Icon = t.icon;
        const isSelected = theme === t.value;

        return (
          <Label
            key={t.value}
            htmlFor={`theme-${t.value}`}
            className={cn(
              "flex items-center space-x-4 rounded-lg border border-border p-4 cursor-pointer transition-all",
              "hover:bg-accent/5 hover:border-primary",
              isSelected && "border-primary bg-accent/5 shadow-sm"
            )}
          >
            <RadioGroupItem value={t.value} id={`theme-${t.value}`} className="sr-only" />
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/25 bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className={cn("font-medium", isSelected && "text-primary")}>{t.label}</div>
              <div className="text-sm text-muted-foreground">{t.description}</div>
            </div>
            {isSelected && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              </div>
            )}
          </Label>
        );
      })}
    </RadioGroup>
  );
}
