"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StepProgress } from "@/components/feeds/wizard/StepProgress";
import { SourceSelectionStep } from "@/components/feeds/wizard/SourceSelectionStep";
import { PublishSettingsStep } from "@/components/feeds/wizard/PublishSettingsStep";
import { FeedPreviewStep } from "@/components/feeds/wizard/FeedPreviewStep"; // Story 1.3.5
import { AIDescriptionReviewStep } from "@/components/feeds/wizard/AIDescriptionReviewStep"; // Story 1.3.6
import { ReviewStep } from "@/components/feeds/wizard/ReviewStep"; // Story 1.3.6
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { createFeed, updateFeed, getFeedCategories, deleteFeed } from "@/lib/api/feeds";
import type { WizardStep } from "@/lib/types/feed";

function CreateFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { feed, feedId, selectedSourceIds, setFeedId, resetFeed } = useFeedBuilderStore();

  // Get current step from URL or default to 1
  const stepParam = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    stepParam ? (parseInt(stepParam) as WizardStep) : 1
  );

  // Get initial URL from query params (from QuickAddCard "Create New Feed")
  const initialUrl = searchParams.get("url") || "";

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Update URL when step changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("step", currentStep.toString());
    router.push(`/feeds/create?${newSearchParams.toString()}`, {
      scroll: false,
    });
  }, [currentStep, router, searchParams]);

  const handleNextStep = async () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    // Story 1.3.6: Auto-save draft after Step 2 (Preview - previously Step 3)
    if (currentStep === 2 && !feedId) {
      try {
        console.log("[Story 1.3.6] Auto-saving draft after Step 2 (Preview)...");

        // Fetch available categories to use a valid placeholder
        const categories = await getFeedCategories();
        const placeholderCategory = categories.length > 0 ? categories[0].slug : "general";
        console.log("[Story 1.3.6] Using placeholder category:", placeholderCategory);

        // Generate unique draft name with timestamp to avoid conflicts
        const draftName = `Draft Feed ${Date.now()}`;
        console.log("[Story 1.3.6] Using draft name:", draftName);

        // Create draft feed with minimal data (Story 1.3.6)
        // Include placeholder description and category - will be updated in Step 4 & 5
        const draftFeed = await createFeed({
          name: draftName, // Unique placeholder - will be set in Step 5
          description: "Draft - Description pending AI generation", // Placeholder - will be set in Step 4
          type: "creator",
          category_slugs: [placeholderCategory], // Use first available category as placeholder
          feed_source_ids: selectedSourceIds,
          status: "draft",
        });

        // Store feed ID for AI suggestions
        setFeedId(draftFeed.id);

        console.log("[Story 1.3.6] Draft saved successfully. Feed ID:", draftFeed.id);
        toast.success("Draft saved");
      } catch (error) {
        console.error("[Story 1.3.6] Failed to save draft:", error);
        // Continue anyway - user can still complete wizard without AI suggestions
        toast.error("Failed to save draft", {
          description: "You can continue, but AI suggestions may not be available.",
        });
      }
    }

    // Move to next step (Story 1.3.5: Updated from 4 to 5)
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

  const handleCancel = async () => {
    // Delete draft feed if one was created during wizard
    if (feedId) {
      try {
        console.log("[Wizard] Cleaning up draft feed:", feedId);
        await deleteFeed(feedId);
        console.log("[Wizard] Draft feed deleted");
      } catch (error) {
        console.error("[Wizard] Failed to delete draft feed:", error);
        // Continue with cancel anyway
      }
    }

    // Reset wizard state
    resetFeed();

    // Navigate back to feeds list
    router.push("/feeds");
  };

  return (
    <>
      <div className="container max-w-5xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create New Feed</h1>
          <p className="text-muted-foreground">
            Select sources, configure filters, and set up your automated content feed
          </p>
        </div>

        {/* Step Progress (Story 1.3.5: Updated to 5 steps) */}
        <StepProgress
          currentStep={currentStep}
          totalSteps={5}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Content (Story 1.3.6: 5-step wizard - Sources First, Basic Info Last) */}
        <div className="mt-8">
          {currentStep === 1 && (
            <SourceSelectionStep
              onNext={handleNextStep}
              onBack={null}
              onCancel={handleCancel}
              initialUrl={initialUrl}
            />
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
            />
          )}
          {currentStep === 5 && <ReviewStep onBack={handlePreviousStep} onCancel={handleCancel} />}
        </div>
      </div>
    </>
  );
}

export default function CreateFeedPage() {
  return (
    <Suspense fallback={<div className="container max-w-5xl mx-auto py-6">Loading...</div>}>
      <CreateFeedContent />
    </Suspense>
  );
}
