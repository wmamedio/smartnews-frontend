"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedCategoryInfo } from "@/lib/types/feed";

interface CategoryFilterProps {
  categories: FeedCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading,
}: CategoryFilterProps) {
  const [open, setOpen] = React.useState(false);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Only show categories that have feeds (if feed_count is available)
  const categoriesWithFeeds = categories.filter(
    (cat) => cat.feed_count === undefined || cat.feed_count > 0
  );

  // Get the display name for the selected category
  const getSelectedLabel = () => {
    if (!selectedCategory) return "All Categories";
    const category = categoriesWithFeeds.find((cat) => cat.slug === selectedCategory);
    return category ? category.name : "All Categories";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 aria-expanded:border-input"
        >
          {getSelectedLabel()}
          <div className="ml-2 flex items-center gap-1">
            {selectedCategory && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear category selection"
                className="rounded-sm opacity-50 hover:opacity-100 hover:bg-muted p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryChange("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onCategoryChange("");
                  }
                }}
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            className="h-9 focus:ring-0 focus:outline-none"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onCategoryChange("");
                  setOpen(false);
                }}
              >
                All Categories
                <Check
                  className={cn("ml-auto h-4 w-4", !selectedCategory ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
              {categoriesWithFeeds.map((category) => (
                <CommandItem
                  key={category.slug}
                  value={category.name}
                  onSelect={() => {
                    onCategoryChange(category.slug);
                    setOpen(false);
                  }}
                >
                  {category.name}
                  {category.feed_count !== undefined && category.feed_count > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({category.feed_count})
                    </span>
                  )}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCategory === category.slug ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
