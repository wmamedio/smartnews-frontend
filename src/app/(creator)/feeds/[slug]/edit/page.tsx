"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StepProgress } from "@/components/feeds/wizard/StepProgress";
import { SourceSelectionStep } from "@/components/feeds/wizard/SourceSelectionStep";
import { FeedPreviewStep } from "@/components/feeds/wizard/FeedPreviewStep";
import { PublishSettingsStep } from "@/components/feeds/wizard/PublishSettingsStep";
import { AIDescriptionReviewStep } from "@/components/feeds/wizard/AIDescriptionReviewStep"; // Story 1.3.6
import { ReviewStep } from "@/components/feeds/wizard/ReviewStep"; // Story 1.3.6
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { fetchFeed, updateFeed, getFeedCategories } from "@/lib/api/feeds";
import { feedSchedulesService } from "@/lib/api/services/feed-schedules.service";
import type { WizardStep } from "@/lib/types/feed";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DeleteFeedDialog } from "@/components/feeds/dialogs/DeleteFeedDialog";

function EditFeedContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const feedId = parseInt(params.slug as string, 10);
  const {
    feed,
    setFeed,
    setFeedId,
    selectedSourceIds,
    setSelectedSources,
    setSchedule,
    resetFeed,
  } = useFeedBuilderStore();

  // Redirect if feedId is invalid
  useEffect(() => {
    if (isNaN(feedId)) {
      console.error("Invalid feed ID in URL:", params.slug);
      router.push("/feeds");
    }
  }, [feedId, params.slug, router]);

  // Handle successful deletion
  const handleDeleteSuccess = (deletedFeedId: number) => {
    resetFeed(); // Clear wizard state
    router.push("/feeds"); // Navigate back to list
  };

  // Reset feed builder only on unmount to prevent race condition
  useEffect(() => {
    return () => {
      resetFeed(); // Cleanup on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps intentional - only cleanup on unmount

  // Fetch existing feed data
  const {
    data: existingFeed,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feed", feedId],
    queryFn: () => fetchFeed(feedId),
    enabled: !!feedId,
    staleTime: 0, // Always consider data stale to get fresh sources
    refetchOnMount: "always", // Always refetch when component mounts
  });

  // Fetch categories for slug lookup
  const { data: categories } = useQuery({
    queryKey: ["feed-categories"],
    queryFn: getFeedCategories,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Fetch schedule separately (backend may not include it in /feeds/{id} response)
  const { data: feedSchedule } = useQuery({
    queryKey: ["feed-schedule", feedId],
    queryFn: () => feedSchedulesService.getFeedSchedule(feedId),
    enabled: !!feedId,
  });

  // Load feed data into store when fetched
  // Only populate on initial load or when navigating to a different feed
  useEffect(() => {
    if (!existingFeed) return;

    // Only populate if: different feed OR first load (feed.id is undefined)
    if (feed.id !== existingFeed.id || !feed.id) {
      setFeed({
        id: existingFeed.id,
        name: existingFeed.name,
        slug: existingFeed.slug,
        description: existingFeed.description,
        category: existingFeed.categories?.[0]?.name || "", // Use name, not slug (for dropdown matching)
        is_published: existingFeed.status === "published",
        schedule: existingFeed.schedule,
      });

      // Story 1.3.6: Set feedId for AI suggestions in edit mode
      setFeedId(existingFeed.id);

      // Set selected sources from API response
      if (existingFeed.feed_sources && existingFeed.feed_sources.length > 0) {
        const sourceIds = existingFeed.feed_sources.map((source: any) => source.id);
        setSelectedSources(sourceIds);
      } else {
        // Clear sources if feed has none
        setSelectedSources([]);
      }
    }
  }, [existingFeed, feed.id, setFeed, setFeedId, setSelectedSources]);

  // Load schedule separately (Story 1.3.4)
  // This is needed because the /feeds/{id} endpoint may not include the schedule
  useEffect(() => {
    if (feedSchedule !== undefined) {
      // feedSchedule is null if no schedule exists, or the schedule object if it does
      setSchedule(feedSchedule);
      console.log("[Story 1.3.4] Schedule loaded for edit:", feedSchedule);
    }
  }, [feedSchedule, setSchedule]);

  // Get current step from URL or default to 1
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    stepParam ? (parseInt(stepParam) as WizardStep) : 1
  );

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Update URL when step changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("step", currentStep.toString());
    router.push(`/feeds/${feedId}/edit?${newSearchParams.toString()}`, {
      scroll: false,
    });
  }, [currentStep, router, searchParams, feedId]);

  const handleNextStep = () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Move to next step (Story 1.3.5: 5 steps)
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step as WizardStep);
  };

  const handleCancel = () => {
    // Reset store and go back
    resetFeed();
    router.push("/feeds");
  };

  const handleSaveDraft = async () => {
    try {
      // Validate minimum required fields
      if (!feed.name || !feed.description || !feed.category) {
        toast.error("Missing required information", {
          description: "Please complete the basic information before saving.",
        });
        return;
      }

      // Validate that sources are selected
      if (selectedSourceIds.length === 0) {
        toast.error("No sources selected", {
          description: "Please select at least one source before saving.",
        });
        return;
      }

      // Find the category slug from the category name
      const selectedCategory = categories?.find(
        (cat) => cat.name.toLowerCase() === feed.category?.toLowerCase()
      );

      if (!selectedCategory) {
        toast.error("Invalid category", {
          description: `Category "${feed.category}" not found. Please select a valid category.`,
        });
        return;
      }

      console.log(
        `Edit: Using category "${selectedCategory.name}" with slug: "${selectedCategory.slug}"`
      );

      // Update feed with current data
      await updateFeed({
        id: feedId,
        name: feed.name,
        description: feed.description,
        category_slugs: [selectedCategory.slug],
        feed_source_ids: selectedSourceIds,
        status: "published",
      });

      // Invalidate feeds cache to update list
      queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["feed", feedId] });

      // Show success and redirect
      toast.success("Changes saved successfully!", {
        description: `"${feed.name}" has been updated.`,
      });
      router.push("/feeds");
    } catch (error: any) {
      console.error("Error saving feed:", error);
      const errorMessage =
        error.response?.data?.detail || error.response?.data?.message || "Please try again.";
      toast.error("Failed to save changes", {
        description: errorMessage,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-5xl mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load feed data. Please try again or go back to the feeds list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-5xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Feed</h1>
            <p className="text-muted-foreground">
              Update your feed sources, filters, and publishing settings
            </p>
          </div>
          {existingFeed && (
            <div className="flex items-center gap-2">
              <DeleteFeedDialog
                feed={existingFeed}
                onDeleteSuccess={handleDeleteSuccess}
                trigger={
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Feed
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Step Progress (Story 1.3.5: 5 steps) */}
        <StepProgress
          currentStep={currentStep}
          totalSteps={5}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Content (Story 1.3.6: 5-step wizard - Sources First, Basic Info Last) */}
        <div className="mt-8">
          {currentStep === 1 && (
            <SourceSelectionStep onNext={handleNextStep} onBack={null} onCancel={handleCancel} />
          )}
          {currentStep === 2 && (
            <FeedPreviewStep
              onNext={handleNextStep}
              onBack={handlePreviousStep}
              onCancel={handleCancel}
            />
          )}
          {currentStep === 3 && (
            <PublishSettingsStep
              feedId={feedId}
              onNext={handleNextStep}
              onBack={handlePreviousStep}
              onCancel={handleCancel}
            />
          )}
          {currentStep === 4 && (
            <AIDescriptionReviewStep
              onNext={handleNextStep}
              onBack={handlePreviousStep}
              onCancel={handleCancel}
              existingFeed={existingFeed}
              isEditMode={true}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep
              onBack={handlePreviousStep}
              onCancel={handleCancel}
              existingFeed={existingFeed}
              isEditMode={true}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function EditFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl mx-auto py-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <EditFeedContent />
    </Suspense>
  );
}
