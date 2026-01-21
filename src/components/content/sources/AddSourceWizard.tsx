"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  feedSourcesService,
  type FeedSource,
  type SmartImportResponse,
} from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { pullAndRescoreSource } from "@/hooks/useSmartImport";

import { BasicInfoStep } from "./steps/BasicInfoStep";
import { KeywordsStep } from "./steps/KeywordsStep";

interface AddSourceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceCreated?: (sourceId?: number) => void;
  initialUrl?: string;
  /** Pass a source to edit instead of creating a new one */
  source?: FeedSource | null;
  /** Pre-fetched AI keyword suggestions (for edit mode from QuickAddCard) */
  initialSuggestedKeywords?: {
    good: string[];
    bad: string[];
  };
  /** Pre-selected feed ID (from QuickAddCard) - if provided, feed association happens in parent */
  selectedFeedId?: number;
  /** Auto-validate URL and skip to keywords step (for "Create New Feed" from QuickAddCard) */
  autoAdvanceToKeywords?: boolean;
  /** Hide action buttons in toast notifications (useful when already on sources/create pages) */
  hideToastActionButton?: boolean;
  /** Suppress all toast notifications (parent handles toasts) */
  suppressToasts?: boolean;
}

export function AddSourceWizard({
  open,
  onOpenChange,
  onSourceCreated,
  initialUrl = "",
  source = null,
  initialSuggestedKeywords,
  selectedFeedId,
  autoAdvanceToKeywords = false,
  hideToastActionButton = false,
  suppressToasts = false,
}: AddSourceWizardProps) {
  const isEditMode = !!source;
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  const queryClient = useQueryClient();

  // Step 1 state
  const [url, setUrl] = useState(initialUrl);
  const [name, setName] = useState("");

  // Step 2 state
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [suggestedBadKeywords, setSuggestedBadKeywords] = useState<string[]>([]);
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [minRelevanceScore, setMinRelevanceScore] = useState(50);
  const [keywordError, setKeywordError] = useState<string>("");

  // Validation state
  const [isValidating, setIsValidating] = useState(false);

  // Helper to extract URL from source configuration
  const getUrlFromSource = (src: FeedSource): string => {
    if (!src.configuration) return "";
    if (src.source_type === "youtube") {
      // YouTube stores channel handle in configuration.channels
      // Reconstruct full URL for display
      const channel = src.configuration.channels;
      if (channel) {
        // Handle both array and string formats
        const channelHandle = Array.isArray(channel) ? channel[0] : channel;
        // If it's already a full URL, return as-is
        if (channelHandle.startsWith("http")) {
          return channelHandle;
        }
        // Check if handle already has @ prefix
        const handle = channelHandle.startsWith("@") ? channelHandle : `@${channelHandle}`;
        return `https://www.youtube.com/${handle}`;
      }
      return "";
    }
    return src.configuration.url || "";
  };

  // Reset/initialize state when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (isEditMode && source) {
        // Edit mode: pre-fill with source data, start on step 1 (basic info)
        setUrl(getUrlFromSource(source));
        setName(source.name);
        setGoodKeywords(source.good_keywords || []);
        setBadKeywords(source.bad_keywords || []);
        setMinRelevanceScore(source.min_relevance_score ?? 50);
        setCurrentStep(1); // Start on step 1 to allow editing name

        // Set pre-fetched AI keyword suggestions if provided
        if (initialSuggestedKeywords) {
          setSuggestedKeywords(initialSuggestedKeywords.good || []);
          setSuggestedBadKeywords(initialSuggestedKeywords.bad || []);
        }
      } else if (initialUrl) {
        setUrl(initialUrl);
        // If auto-advancing, start directly on step 2
        if (autoAdvanceToKeywords) {
          setCurrentStep(2);
        }
      }
    } else {
      // Reset all state when closing
      setCurrentStep(1);
      setUrl(initialUrl);
      setName("");
      setSuggestedKeywords([]);
      setSuggestedBadKeywords([]);
      setGoodKeywords([]);
      setBadKeywords([]);
      setMinRelevanceScore(50);
      setKeywordError("");
      setHasAutoAdvanced(false);
    }
  }, [open, initialUrl, isEditMode, source, initialSuggestedKeywords, autoAdvanceToKeywords]);

  // Auto-fetch keywords when auto-advancing to step 2
  useEffect(() => {
    const fetchKeywords = async () => {
      if (
        open &&
        autoAdvanceToKeywords &&
        initialUrl &&
        url === initialUrl &&
        !isEditMode &&
        !hasAutoAdvanced &&
        currentStep === 2
      ) {
        setHasAutoAdvanced(true);
        setIsValidating(true);

        // Show loading toast
        const toastId = toast.loading("Loading AI keyword suggestions...");

        try {
          const validation = await feedSourcesService.validateUrl(url);

          if (!validation.is_valid) {
            toast.dismiss(toastId);
            toast.error("Invalid URL", {
              description: validation.message || "Please check the URL and try again",
            });
            // Go back to step 1 if validation fails
            setCurrentStep(1);
            setIsValidating(false);
            return;
          }

          // Set suggested keywords from AI
          if (validation.suggested_keywords) {
            const { good_keywords = [], bad_keywords = [] } = validation.suggested_keywords;
            if (good_keywords.length > 0 || bad_keywords.length > 0) {
              setSuggestedKeywords(good_keywords);
              setSuggestedBadKeywords(bad_keywords);
            }
          }

          toast.dismiss(toastId);
        } catch (error: any) {
          console.error("URL validation failed:", error);
          toast.dismiss(toastId);
          toast.error("Failed to load suggestions", {
            description: "You can still add keywords manually",
          });
        }

        setIsValidating(false);
      }
    };

    fetchKeywords();
  }, [open, autoAdvanceToKeywords, initialUrl, url, isEditMode, hasAutoAdvanced, currentStep]);

  // Validate URL and fetch AI keywords for Step 2
  const validateAndFetchKeywords = async (silent = false) => {
    if (!url.trim()) {
      if (!silent) toast.error("Please enter a URL");
      return false;
    }

    setIsValidating(true);

    try {
      const validation = await feedSourcesService.validateUrl(url);

      console.log("[AddSourceWizard] Validation response:", validation);

      if (!validation.is_valid) {
        if (!silent) {
          toast.error("Invalid URL", {
            description: validation.message || "The URL provided is not valid",
          });
        }
        setIsValidating(false);
        return false;
      }

      // Set suggested keywords from AI
      if (validation.suggested_keywords) {
        const { good_keywords = [], bad_keywords = [] } = validation.suggested_keywords;

        console.log("[AddSourceWizard] AI suggested good keywords:", good_keywords);
        console.log("[AddSourceWizard] AI suggested bad keywords:", bad_keywords);

        if (good_keywords.length > 0 || bad_keywords.length > 0) {
          setSuggestedKeywords(good_keywords);
          setSuggestedBadKeywords(bad_keywords);
        } else {
          console.log("[AddSourceWizard] No suggested keywords from API");
          setSuggestedKeywords([]);
        }
      } else {
        console.log("[AddSourceWizard] No suggested keywords from API");
        setSuggestedKeywords([]);
      }

      setIsValidating(false);
      return true;
    } catch (error: any) {
      console.error("URL validation failed:", error);
      if (!silent) {
        toast.error("Failed to validate URL", {
          description: error.response?.data?.detail || "Please check the URL and try again",
        });
      }
      setIsValidating(false);
      return false;
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate URL before moving to step 2
      const isValid = await validateAndFetchKeywords();
      if (isValid) {
        setCurrentStep(2);
      }
    }
  };

  const handleBackStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Create/Update source mutation - uses smart-import for all new sources
  const saveMutation = useMutation({
    mutationFn: async (data: {
      url?: string;
      name?: string;
      good_keywords?: string[];
      bad_keywords?: string[];
      min_relevance_score?: number;
    }): Promise<{
      source: FeedSource;
      isSmartImport: boolean;
      smartResult?: SmartImportResponse;
    }> => {
      if (isEditMode && source) {
        // Update existing source
        const updatedSource = await feedSourcesService.update(source.id, {
          name: data.name,
          good_keywords: data.good_keywords,
          bad_keywords: data.bad_keywords,
          min_relevance_score: data.min_relevance_score,
        });
        return { source: updatedSource, isSmartImport: false };
      }

      // For new sources, always use smart-import
      // This handles both single content and continuous feeds consistently
      const smartResult = await feedSourcesService.smartImport(data.url!);

      // If it's a continuous feed, we need to update with keywords
      if (
        smartResult.classification === "continuous_feed" &&
        (data.good_keywords?.length || data.bad_keywords?.length || data.min_relevance_score !== 50)
      ) {
        const updatedSource = await feedSourcesService.update(smartResult.feed_source.id, {
          name: data.name || smartResult.feed_source.name,
          good_keywords: data.good_keywords,
          bad_keywords: data.bad_keywords,
          min_relevance_score: data.min_relevance_score,
        });
        return { source: updatedSource, isSmartImport: true, smartResult };
      }

      return { source: smartResult.feed_source, isSmartImport: true, smartResult };
    },
    onSuccess: async ({ source: savedSource, isSmartImport, smartResult }) => {
      // Close dialog immediately - don't wait for pull/rescore
      onOpenChange(false);

      queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
      queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });

      const filterInfo =
        goodKeywords.length > 0 || badKeywords.length > 0
          ? ` with ${goodKeywords.length + badKeywords.length} filter(s)`
          : "";

      if (!suppressToasts) {
        if (isEditMode) {
          toast.success(`Source updated successfully${filterInfo}`);
        } else if (isSmartImport && smartResult) {
          // Handle smart import response
          if (smartResult.classification === "single_content") {
            // Auto-approve single content since it's manually curated
            if (smartResult.is_new && smartResult.source_item?.id) {
              try {
                await feedItemsService.updateStatus(
                  smartResult.source_item.id,
                  "ready_for_publish"
                );
                queryClient.invalidateQueries({ queryKey: ["feed-items"] });
              } catch (err) {
                console.warn("Failed to auto-approve content:", err);
              }
            }

            toast.success(
              smartResult.is_new
                ? `Single content imported and approved: "${smartResult.source_item.title}"`
                : `Content already exists: "${smartResult.source_item.title}"`
            );
          } else {
            // Continuous feed created via smart-import
            toast.success(`Feed source created successfully${filterInfo}`);
          }
        } else {
          toast.success(`Feed source created successfully${filterInfo}`);
        }
      } else if (isSmartImport && smartResult?.classification === "single_content") {
        // Still auto-approve single content even when toasts suppressed
        if (smartResult.is_new && smartResult.source_item?.id) {
          try {
            await feedItemsService.updateStatus(smartResult.source_item.id, "ready_for_publish");
            queryClient.invalidateQueries({ queryKey: ["feed-items"] });
          } catch (err) {
            console.warn("Failed to auto-approve content:", err);
          }
        }
      }

      onSourceCreated?.(savedSource.id);

      // For new continuous feed sources, trigger pull and rescore (skip if suppressToasts - parent handles it)
      if (!isEditMode && smartResult?.classification === "continuous_feed" && !suppressToasts) {
        try {
          await pullAndRescoreSource(savedSource.id, queryClient, {
            showToasts: true,
            hideActionButton: hideToastActionButton,
          });
        } catch {
          // Error already handled in pullAndRescoreSource
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(
        error,
        isEditMode ? "Failed to update source" : "Failed to create feed source"
      );
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async () => {
    // For step 2 (continuous feeds), require at least one include keyword
    if (currentStep === 2 && goodKeywords.length === 0) {
      setKeywordError("At least one include keyword is required");
      toast.error("Include keywords required", {
        description: "Please add at least one keyword to filter content",
      });
      return;
    }
    setKeywordError("");

    saveMutation.mutate({
      url: url.trim(),
      name: name.trim(),
      good_keywords: goodKeywords.length > 0 ? goodKeywords : undefined,
      bad_keywords: badKeywords.length > 0 ? badKeywords : undefined,
      min_relevance_score: minRelevanceScore !== 50 ? minRelevanceScore : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Source: ${source?.name}` : "Add New Source"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update content filtering and keywords"
              : currentStep === 1
                ? "Paste any URL - articles, RSS feeds, YouTube channels, etc."
                : "Configure content filtering and keywords"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isEditMode ? (
            // Edit mode: show basic info and keywords on the same view
            <div className="space-y-4">
              <BasicInfoStep url={url} name={name} onNameChange={setName} isEditMode={true} />
              <KeywordsStep
                suggestedGoodKeywords={suggestedKeywords}
                suggestedBadKeywords={suggestedBadKeywords}
                goodKeywords={goodKeywords}
                badKeywords={badKeywords}
                minRelevanceScore={minRelevanceScore}
                onGoodKeywordsChange={setGoodKeywords}
                onBadKeywordsChange={setBadKeywords}
                onMinRelevanceScoreChange={setMinRelevanceScore}
                isLoadingSuggestions={false}
                keywordError={keywordError}
                isCompact={true}
              />
            </div>
          ) : (
            // Create mode: multi-step wizard
            <>
              {currentStep === 1 && (
                <BasicInfoStep
                  url={url}
                  name={name}
                  onUrlChange={setUrl}
                  onNameChange={setName}
                  isEditMode={false}
                />
              )}

              {currentStep === 2 && (
                <KeywordsStep
                  suggestedGoodKeywords={suggestedKeywords}
                  suggestedBadKeywords={suggestedBadKeywords}
                  goodKeywords={goodKeywords}
                  badKeywords={badKeywords}
                  minRelevanceScore={minRelevanceScore}
                  onGoodKeywordsChange={setGoodKeywords}
                  onBadKeywordsChange={setBadKeywords}
                  onMinRelevanceScoreChange={setMinRelevanceScore}
                  isLoadingSuggestions={isValidating}
                  keywordError={keywordError}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {isEditMode ? (
            // Edit mode: simple Cancel / Save buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            // Create mode: multi-step wizard buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep === 1) {
                    onOpenChange(false);
                  } else {
                    handleBackStep();
                  }
                }}
                disabled={saveMutation.isPending || isValidating}
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              {currentStep === 1 && (
                <Button
                  onClick={handleNextStep}
                  disabled={!name.trim() || !url.trim() || isValidating}
                >
                  {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isValidating ? "Validating..." : "Next: Keywords"}
                </Button>
              )}

              {currentStep === 2 && (
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saveMutation.isPending ? "Creating..." : "Create Source"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
