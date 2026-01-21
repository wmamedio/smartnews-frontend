"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Calendar, Clock, Globe, Tag, FileText, List, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WizardNavigation } from "./WizardNavigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { createFeed, updateFeed, getFeedCategories } from "@/lib/api/feeds";
import { feedSchedulesService } from "@/lib/api/services/feed-schedules.service";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { FREQUENCY_MINUTES } from "@/lib/types/feed";
import type { Feed } from "@/lib/types/feed";
import { convertUTCToLocalTime } from "@/lib/utils/schedule-formatter";
import { toast } from "sonner";

interface ReviewStepProps {
  onBack: () => void;
  onCancel?: () => void;
  existingFeed?: Feed;
  isEditMode?: boolean; // Story 1.3.6 AC #15: Edit wizard support
}

export function ReviewStep({
  onBack,
  onCancel,
  existingFeed,
  isEditMode = false,
}: ReviewStepProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { feed, feedId, selectedSourceIds, schedule, resetFeed } = useFeedBuilderStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for slug lookup
  const { data: categories } = useQuery({
    queryKey: ["feed-categories"],
    queryFn: getFeedCategories,
    staleTime: 10 * 60 * 1000,
  });

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      // Validate all required fields
      if (!feed.name || feed.name.length < 3) {
        throw new Error("Feed name must be at least 3 characters");
      }
      if (!feed.slug || feed.slug.length < 3) {
        throw new Error("Feed URL must be at least 3 characters");
      }
      if (!feed.description || feed.description.length < 10) {
        throw new Error("Description must be at least 10 characters");
      }
      if (!feed.category) {
        throw new Error("Please select a category");
      }
      if (selectedSourceIds.length === 0) {
        throw new Error("Please select at least one source");
      }

      console.log("[Story 1.3.6] Publishing feed from ReviewStep");
      console.log("Feed category:", feed.category);
      console.log("Categories loaded:", categories);

      // Find category slug from name - categories must exist (no creation allowed)
      const selectedCategory = categories?.find(
        (cat) =>
          cat.name.toLowerCase() === feed.category?.toLowerCase() ||
          cat.slug.toLowerCase() === feed.category?.toLowerCase()
      );

      if (!selectedCategory) {
        throw new Error(
          `Category "${feed.category}" not found. Please select a valid category from the list.`
        );
      }

      const categorySlug = selectedCategory.slug;
      console.log(`Using existing category: "${selectedCategory.name}" with slug: ${categorySlug}`);

      // Prepare feed payload with correct category slug
      const feedPayload = {
        name: feed.name,
        slug: feed.slug,
        description: feed.description,
        category_slugs: [categorySlug], // Use the resolved slug
        feed_source_ids: selectedSourceIds,
        refresh_schedule: 0,
        status: "published" as const,
      };

      console.log(feedId ? "Updating feed" : "Creating feed", "with payload:", feedPayload);

      // Either update existing draft or create new one
      const savedFeed = feedId
        ? await updateFeed({
            id: feedId,
            ...feedPayload,
          })
        : await createFeed(feedPayload);

      // Create schedule if configured
      if (schedule) {
        try {
          console.log("[Story 1.3.4] Creating schedule for feed:", savedFeed.id);
          console.log("[Story 1.3.4] Schedule data being sent:", JSON.stringify(schedule, null, 2));
          const createdSchedule = await feedSchedulesService.createFeedSchedule(
            savedFeed.id,
            schedule
          );
          console.log("[Story 1.3.4] Schedule created successfully:", createdSchedule);
        } catch (scheduleError: any) {
          console.error("[Story 1.3.4] Failed to create schedule:", scheduleError);
          console.error("[Story 1.3.4] Error response:", scheduleError.response?.data);
          console.error("[Story 1.3.4] Error status:", scheduleError.response?.status);
          toast.error("Feed published, but schedule creation failed", {
            description:
              scheduleError.response?.data?.detail ||
              "You can configure the schedule later in feed settings.",
          });
        }
      } else {
        console.log("[Story 1.3.4] No schedule configured (manual delivery mode)");
      }

      // Invalidate feeds cache to update list and specific feed data
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
      // Also invalidate the specific feed cache so edit page gets fresh data
      if (feedId) {
        queryClient.invalidateQueries({ queryKey: ["feed", feedId] });
      } else if (savedFeed?.id) {
        queryClient.invalidateQueries({ queryKey: ["feed", savedFeed.id] });
      }

      // Success!
      toast.success("Feed published successfully!");

      // Reset wizard state
      resetFeed();

      // Navigate to feeds page
      router.push("/feeds");
    } catch (err: any) {
      console.error("[Story 1.3.6] Error publishing feed:", err);
      const errorMessage = extractErrorMessage(err, "Failed to publish feed");
      setError(errorMessage);
      toast.error("Failed to publish feed", {
        description: errorMessage,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Calculate summary data
  const feedUrl = feed.slug ? `https://smartnews.example/f/${feed.slug}` : "";
  const scheduleEnabled = !!schedule;
  const isAutomaticDelivery = scheduleEnabled; // Automatic delivery when schedule is enabled

  // Day names mapping
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const formatDaysOfWeek = (days?: number[]) => {
    if (!days || days.length === 0) return "";
    const sortedDays = [...days].sort((a, b) => a - b);
    return sortedDays.map((day) => dayNames[day]).join(", ");
  };

  // Format frequency for display (Story 1.3.4)
  const getFrequencyLabel = (frequencyMinutes: number): string => {
    switch (frequencyMinutes) {
      case FREQUENCY_MINUTES.daily:
        return "Daily";
      case FREQUENCY_MINUTES.weekly:
        return "Weekly";
      case FREQUENCY_MINUTES.biweekly:
        return "Bi-weekly";
      case FREQUENCY_MINUTES.monthly:
        return "Monthly";
      default:
        return "Custom";
    }
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Review & Publish</CardTitle>
          <CardDescription>Review your feed details before saving</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Feed Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Feed Information</h3>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{feed.name}</p>
                  <p className="text-sm text-muted-foreground">{feed.description}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Category: {feed.category}</p>
                </div>
              </div>

              {feedUrl && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-mono break-all text-muted-foreground">{feedUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Sources Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <List className="w-5 h-5" />
              Sources
            </h3>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-semibold">{selectedSourceIds.length}</span>{" "}
                  {selectedSourceIds.length === 1 ? "source" : "sources"} selected
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Publishing Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Publishing Settings</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm font-medium">Delivery Mode</span>
                <Badge variant={isAutomaticDelivery ? "default" : "secondary"}>
                  {isAutomaticDelivery ? "Automatic Delivery" : "Manual Delivery"}
                </Badge>
              </div>

              {scheduleEnabled && schedule && (
                <>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Delivery Schedule</p>
                      <p className="text-sm text-muted-foreground">
                        {getFrequencyLabel(schedule.frequency)}
                        {(schedule.frequency === FREQUENCY_MINUTES.weekly ||
                          schedule.frequency === FREQUENCY_MINUTES.biweekly) &&
                          schedule.delivery_days &&
                          schedule.delivery_days.length > 0 && (
                            <span className="block mt-1">
                              {formatDaysOfWeek(schedule.delivery_days)}
                            </span>
                          )}
                        {schedule.frequency === FREQUENCY_MINUTES.monthly && (
                          <span className="block mt-1">
                            {schedule.delivery_day_of_month === -1
                              ? "Last day of month"
                              : `Day ${schedule.delivery_day_of_month} of month`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Send Time</p>
                      <p className="text-sm text-muted-foreground">
                        {convertUTCToLocalTime(schedule.delivery_time, schedule.timezone)} (your
                        local time)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {!scheduleEnabled && (
                <Alert>
                  <AlertDescription>
                    Manual delivery mode: You&apos;ll send updates to your subscribers when
                    you&apos;re ready using the &quot;Send Now&quot; feature.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack}
        onNext={handlePublish}
        nextLabel="Publish Feed"
        isNextDisabled={isPublishing}
        isNextLoading={isPublishing}
      />
    </>
  );
}
