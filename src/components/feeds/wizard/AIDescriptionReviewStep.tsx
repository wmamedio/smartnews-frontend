"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, AlertCircle, Check, Loader2, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WizardNavigation } from "./WizardNavigation";
import { Badge } from "@/components/ui/badge";
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { getFeedSuggestions, getFeedCategories, createFeed, updateFeed } from "@/lib/api/feeds";
import { feedSchedulesService } from "@/lib/api/services/feed-schedules.service";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import type { Feed } from "@/lib/types/feed";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIDescriptionReviewStepProps {
  onNext?: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  existingFeed?: Feed;
  isEditMode?: boolean; // Story 1.3.6 AC #15: Edit wizard support
}

/**
 * AIDescriptionReviewStep - Story 1.3.6
 *
 * Previously final wizard step (Step 5), now Step 4.
 * AI-powered description and category suggestions.
 * AI suggestions are prefetched in PublishSettingsStep for zero perceived wait time.
 */
export function AIDescriptionReviewStep({
  onNext,
  onBack,
  onSaveDraft,
  onCancel,
  existingFeed,
  isEditMode = false, // Story 1.3.6 AC #15: Default to create mode
}: AIDescriptionReviewStepProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    feed,
    feedId,
    selectedSourceIds,
    schedule,
    resetFeed,
    updateFeed: updateBuilderFeed,
  } = useFeedBuilderStore();

  const [name, setName] = useState(feed.name || "");
  const [slug, setSlug] = useState(feed.slug || "");
  const [description, setDescription] = useState(feed.description || "");
  const [category, setCategory] = useState(feed.category || "");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Fetch AI suggestions (data should already be cached from Step 4 prefetch)
  // Story 0.1: Skip auto-fetch in edit mode - only fetch when user clicks "Re-generate"
  const {
    data: suggestions,
    isLoading,
    isError,
    error: suggestionsError,
    refetch,
  } = useQuery({
    queryKey: ["feed-suggestions", feedId],
    queryFn: () => getFeedSuggestions(feedId!),
    enabled: !!feedId && !isEditMode, // Story 0.1: Don't auto-fetch in edit mode
    retry: 2,
    staleTime: 5 * 60 * 1000, // Match prefetch cache time
  });

  // Fetch all available categories from API
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["feed-categories"],
    queryFn: getFeedCategories,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Sort categories alphabetically (A-Z)
  const categories = categoriesData
    ? [...categoriesData].sort((a, b) => a.name.localeCompare(b.name))
    : undefined;

  // Auto-generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  };

  // Auto-populate name/slug/description/category from feed data
  useEffect(() => {
    if (feed.name && !name) {
      setName(feed.name);
    }
    if (feed.slug && !slug) {
      setSlug(feed.slug);
    }
    if (feed.description && !description) {
      setDescription(feed.description);
    }
    if (feed.category && !category) {
      setCategory(feed.category);
    }
  }, [feed.name, feed.slug, feed.description, feed.category, name, slug, description, category]);

  // Story 0.1: In edit mode, populate from existingFeed directly
  useEffect(() => {
    if (isEditMode && existingFeed) {
      if (existingFeed.name && !name) {
        setName(existingFeed.name);
      }
      if (existingFeed.slug && !slug) {
        setSlug(existingFeed.slug);
      }
      if (existingFeed.description && !description) {
        setDescription(existingFeed.description);
      }
      if (existingFeed.categories && existingFeed.categories.length > 0 && !category) {
        setCategory(existingFeed.categories[0].name);
      }
    }
  }, [isEditMode, existingFeed, name, slug, description, category]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isSlugManual && name) {
      const newSlug = generateSlug(name);
      setSlug(newSlug);
    }
  }, [name, isSlugManual]);

  // Auto-populate with AI suggestions when loaded
  useEffect(() => {
    if (suggestions) {
      // Auto-populate name if suggested and field is empty
      if (suggestions.suggested_name && !name) {
        setName(suggestions.suggested_name);
        updateBuilderFeed({ name: suggestions.suggested_name });
      }
      // Auto-populate description if field is empty
      if (suggestions.description && !description) {
        setDescription(suggestions.description);
        updateBuilderFeed({ description: suggestions.description });
      }
      // Auto-populate category if field is empty
      if (!category && suggestions.suggested_categories.length > 0) {
        const firstCategory = suggestions.suggested_categories[0];
        setCategory(firstCategory);
        updateBuilderFeed({ category: firstCategory });
      }
    }
  }, [suggestions, name, description, category, updateBuilderFeed]);

  const handleNameChange = (value: string) => {
    setName(value);
    updateBuilderFeed({ name: value });
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    updateBuilderFeed({ slug: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    updateBuilderFeed({ description: value });
  };

  const handleCategoryChange = (value: string) => {
    // Capitalize first letter of each word for display consistency
    const formattedValue = value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    setCategory(formattedValue);
    updateBuilderFeed({ category: formattedValue });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      // Validate required fields
      if (!name || name.length < 3) {
        throw new Error("Feed name must be at least 3 characters");
      }
      if (!slug || slug.length < 3) {
        throw new Error("Feed URL must be at least 3 characters");
      }
      if (!description || description.length < 10) {
        throw new Error("Description must be at least 10 characters");
      }
      if (!category) {
        throw new Error("Please select a category");
      }

      // Story 1.3.6: If onNext is provided, this is Step 4 (not final step)
      // Just update store (no backend save) and move to next step (Review)
      if (onNext) {
        updateBuilderFeed({
          name,
          slug,
          description,
          category,
        });
        // No backend save here - only save in Step 5 (ReviewStep)
        onNext();
        return;
      }

      // Otherwise, this is final step in edit mode - validate all fields for publishing
      if (selectedSourceIds.length === 0) {
        throw new Error("Please select at least one source");
      }

      console.log("[Story 1.3.6] Publishing feed with AI-approved data");
      console.log("Category selected:", category);
      console.log("Categories loaded:", categories);

      // Wait for categories to load if still loading
      if (isLoadingCategories) {
        throw new Error("Categories are still loading. Please try again in a moment.");
      }

      // Find category slug - categories must exist (no creation allowed)
      const existingCategory = categories?.find(
        (cat) =>
          cat.name.toLowerCase() === category.toLowerCase() ||
          cat.slug.toLowerCase() === category.toLowerCase()
      );

      if (!existingCategory) {
        throw new Error(
          `Category "${category}" not found. Please select a valid category from the list.`
        );
      }

      const categorySlug = existingCategory.slug;
      console.log(`Using existing category: "${existingCategory.name}" with slug: ${categorySlug}`);

      // Update existing draft feed or create new one
      let savedFeed: Feed;

      if (feedId) {
        // UPDATE existing draft with AI-approved data
        const updatePayload = {
          id: feedId,
          name: name,
          slug: slug,
          description: description, // AI-approved description
          category_slugs: [categorySlug], // AI-approved category (or newly created)
          feed_source_ids: selectedSourceIds,
          refresh_schedule: 0,
          status: "published" as const,
        };

        console.log(`Updating draft feed ${feedId} with AI-approved data:`, updatePayload);
        savedFeed = await updateFeed(updatePayload);
        console.log("Draft feed updated successfully:", savedFeed);
      } else {
        // CREATE new feed (shouldn't happen, but fallback)
        console.log("No feedId found, creating new feed");
        savedFeed = await createFeed({
          name: name,
          slug: slug,
          description: description,
          category_slugs: [categorySlug],
          feed_source_ids: selectedSourceIds,
          refresh_schedule: 0,
          status: "published",
        });
      }

      // Create schedule if configured
      if (schedule) {
        try {
          await feedSchedulesService.createFeedSchedule(savedFeed.id, schedule);
          console.log("[Story 1.3.6] Schedule created successfully");
        } catch (scheduleError) {
          console.error("[Story 1.3.6] Failed to create schedule:", scheduleError);
          toast.error("Feed published, but schedule creation failed", {
            description: "You can configure the schedule later in feed settings.",
          });
        }
      }

      // Invalidate feed queries
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });

      // Success!
      toast.success("Feed published successfully!");

      // Reset wizard state
      resetFeed();

      // Navigate to feeds page
      router.push("/feeds");
    } catch (error: any) {
      console.error("[Story 1.3.6] Failed to publish feed:", error);
      const errorMessage = extractErrorMessage(error, "Failed to publish feed");
      setError(errorMessage);
      toast.error("Failed to publish feed", {
        description: errorMessage,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* AI Suggestions Card - Story 1.3.6 */}
        <Card>
          <CardHeader>
            {/* Only show AI suggestions header in create mode, not edit mode */}
            {!existingFeed && (
              <>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Generated Suggestions</CardTitle>
                </div>
                <CardDescription>
                  Based on your feed name and sources. You can edit before publishing.
                </CardDescription>
              </>
            )}
            {existingFeed && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feed Details</CardTitle>
                    <CardDescription>Review and update your feed information</CardDescription>
                  </div>
                  {/* Story 1.3.6 AC #15: Re-generate AI Suggestions button */}
                  {isEditMode && feedId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("[Story 1.3.6 AC #15] Re-generating AI suggestions...");
                        refetch();
                        toast.info("Regenerating AI suggestions...");
                      }}
                      disabled={isLoading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isLoading ? "Generating..." : "Re-generate AI"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Skeleton className="h-24 w-full mt-2" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Skeleton className="h-10 w-full mt-2" />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI suggestions...
                </p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to generate AI suggestions</AlertTitle>
                <AlertDescription>
                  {extractErrorMessage(suggestionsError, "Unknown error")}. You can enter manually
                  below.
                  <Button variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Success State - Editable Fields */}
            {!isLoading && (
              <>
                {/* Feed Name */}
                <div>
                  <Label htmlFor="feed-name">
                    Feed Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="feed-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Tech News Daily"
                    maxLength={100}
                    className="mt-2"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {!isError && suggestions?.suggested_name
                      ? "AI-generated, edit as needed"
                      : "Give your feed a clear, descriptive name"}
                  </p>
                </div>

                {/* Feed URL/Slug */}
                <div>
                  <Label htmlFor="feed-slug">Feed URL</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground px-3 py-2 border border-r-0 rounded-l-md bg-muted">
                          smartnews.example/f/
                        </span>
                        <Input
                          id="feed-slug"
                          value={slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="tech-news-daily"
                          maxLength={100}
                          disabled={!isSlugManual}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSlugManual(!isSlugManual)}
                    >
                      {isSlugManual ? "Auto" : "Edit"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSlugManual ? "Manually editing URL slug" : "Auto-generated from feed name"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="ai-description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="ai-description"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe your feed..."
                    maxLength={500}
                    rows={4}
                    className="resize-none mt-2"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {!isError && suggestions
                        ? "AI-generated, edit as needed"
                        : "Enter feed description"}
                    </p>
                    <p className="text-sm text-muted-foreground">{description.length}/500</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={categoryComboboxOpen} onOpenChange={setCategoryComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="ai-category"
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryComboboxOpen}
                        className="w-full justify-between mt-2"
                      >
                        {category || "Select a category..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command
                        filter={(value, search) => {
                          // Custom filter to show all items that match the search
                          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                          return 0;
                        }}
                      >
                        <CommandInput
                          placeholder="Search categories..."
                          className="h-9 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            {isLoadingCategories ? (
                              <CommandItem disabled>Loading categories...</CommandItem>
                            ) : (
                              <>
                                {categories?.map((cat) => (
                                  <CommandItem
                                    key={cat.slug}
                                    value={cat.name}
                                    onSelect={(currentValue) => {
                                      handleCategoryChange(currentValue);
                                      setCategoryComboboxOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        category?.toLowerCase() === cat.name.toLowerCase()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {cat.name}
                                  </CommandItem>
                                ))}
                              </>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestions && suggestions.suggested_categories.length > 0
                      ? `AI suggested: ${suggestions.suggested_categories.join(", ")}`
                      : "Search and select from existing categories"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack}
        onNext={handlePublish}
        nextLabel={onNext ? "Next: Review" : "Publish Feed"}
        isNextDisabled={
          isPublishing ||
          !name ||
          name.length < 3 ||
          !slug ||
          slug.length < 3 ||
          !description ||
          description.length < 10 ||
          !category ||
          (onNext ? false : selectedSourceIds.length === 0)
        }
        isNextLoading={isPublishing}
      />
    </>
  );
}
