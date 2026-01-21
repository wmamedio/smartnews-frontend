"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Plus, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { feedSourcesService, type FeedSource } from "@/lib/api/services/feed-sources.service";
import { extractErrorMessage } from "@/lib/utils/error-handler";

interface CreateSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSourceCreated?: (sourceId?: number) => void;
  source?: FeedSource; // Optional: if provided, edit mode
  skipPreview?: boolean;
}

export function CreateSourceDialog({
  open,
  onOpenChange,
  onSourceCreated,
  source,
  skipPreview = false,
}: CreateSourceDialogProps) {
  const isEditMode = !!source;
  const queryClient = useQueryClient();

  // Keyword filtering state
  const [goodKeywords, setGoodKeywords] = useState<string[]>([]);
  const [badKeywords, setBadKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [badKeywordInput, setBadKeywordInput] = useState("");
  const [keywordError, setKeywordError] = useState<string>("");

  // Highlight state for duplicate keywords
  const [highlightedGoodKeyword, setHighlightedGoodKeyword] = useState<string | null>(null);
  const [highlightedBadKeyword, setHighlightedBadKeyword] = useState<string | null>(null);

  // Relevance score state
  const [minRelevanceScore, setMinRelevanceScore] = useState(50);

  type FormData = {
    name: string;
    url?: string;
  };
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      url: "",
    },
  });

  // Helper to extract URL from source configuration
  const getUrlFromSource = (src: FeedSource): string => {
    if (!src.configuration) return "";
    if (src.source_type === "youtube") {
      const channel = src.configuration.channels;
      if (channel) {
        const channelHandle = Array.isArray(channel) ? channel[0] : channel;
        if (channelHandle.startsWith("http")) {
          return channelHandle;
        }
        const handle = channelHandle.startsWith("@") ? channelHandle : `@${channelHandle}`;
        return `https://www.youtube.com/${handle}`;
      }
      return "";
    }
    return src.configuration.url || "";
  };

  // Pre-populate form when editing (edit mode)
  useEffect(() => {
    if (source && open) {
      // Update form values
      form.setValue("name", source.name);
      form.setValue("url", getUrlFromSource(source));

      // Update other state
      setGoodKeywords(source.good_keywords || []);
      setBadKeywords(source.bad_keywords || []);
      setMinRelevanceScore(source.min_relevance_score || 50);
    }
  }, [source, open, form]);

  // Reset error state when dialog is closed
  useEffect(() => {
    if (!open) {
      setKeywordError("");
      // Reset form when closing (only in create mode)
      if (!isEditMode) {
        form.reset();
        setGoodKeywords([]);
        setBadKeywords([]);
        setMinRelevanceScore(50);
      }
    }
  }, [open, isEditMode, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditMode && source) {
        // Update existing source
        return feedSourcesService.update(source.id, data);
      } else {
        // Create new source via smart-import
        const smartResult = await feedSourcesService.smartImport(data.url);

        // If it's a continuous feed, update with keywords
        if (
          smartResult.classification === "continuous_feed" &&
          (data.good_keywords?.length ||
            data.bad_keywords?.length ||
            data.min_relevance_score !== 50)
        ) {
          return feedSourcesService.update(smartResult.feed_source.id, {
            name: data.name || smartResult.feed_source.name,
            good_keywords: data.good_keywords,
            bad_keywords: data.bad_keywords,
            min_relevance_score: data.min_relevance_score,
          });
        }

        return smartResult.feed_source;
      }
    },
    onSuccess: (savedSource: FeedSource) => {
      queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
      queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });

      // Trigger initial content pull in background (only for new sources)
      if (!isEditMode) {
        (async () => {
          try {
            await feedSourcesService.pullContent(savedSource.id, false);
            // After pull completes, trigger rescore-all to extract keywords
            try {
              await feedSourcesService.rescoreAll(savedSource.id);
              queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
              queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });
            } catch (rescoreError) {
              console.warn("Pull succeeded but rescore failed:", rescoreError);
            }
          } catch (pullError) {
            console.warn("Source created but initial pull failed:", pullError);
          }
        })();
      }

      // Build success message
      const filterInfo =
        goodKeywords.length > 0 || badKeywords.length > 0
          ? ` with ${goodKeywords.length + badKeywords.length} filter(s)`
          : "";

      if (isEditMode) {
        toast.success(`Source updated successfully${filterInfo}`);
      } else {
        toast.success(`Feed source created successfully${filterInfo}`);
      }

      // Reset form and state (only for create mode)
      if (!isEditMode) {
        form.reset();
        setGoodKeywords([]);
        setBadKeywords([]);
        setKeywordInput("");
        setBadKeywordInput("");
        setMinRelevanceScore(50);
      }

      setKeywordError("");
      onOpenChange(false);

      // Notify parent component
      onSourceCreated?.(savedSource.id);
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(
        error,
        isEditMode ? "Failed to update source" : "Failed to create feed source"
      );
      toast.error(errorMessage);
    },
  });

  const onSubmit = async (data: FormData) => {
    // Validate that at least one include keyword is provided
    if (goodKeywords.length === 0) {
      setKeywordError("At least one include keyword is required");
      toast.error("Include keywords required", {
        description: "Please add at least one keyword to filter content",
      });
      return;
    }
    setKeywordError("");

    // Validate URL first if provided
    if (data.url) {
      try {
        const validation = await feedSourcesService.validateUrl(data.url);
        if (!validation.is_valid) {
          toast.error("Invalid URL", {
            description: validation.message || "The URL provided is not valid",
          });
          return;
        }
      } catch (error: any) {
        console.error("URL validation failed:", error);
        toast.error("Failed to validate URL", {
          description: error.response?.data?.detail || "Please check the URL and try again",
        });
        return;
      }
    }

    createMutation.mutate({
      name: data.name,
      url: data.url,
      good_keywords: goodKeywords.length > 0 ? goodKeywords : undefined,
      bad_keywords: badKeywords.length > 0 ? badKeywords : undefined,
      min_relevance_score: minRelevanceScore !== 50 ? minRelevanceScore : undefined,
    });
  };

  // Helper to add good keyword with duplicate detection
  const addGoodKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    if (goodKeywords.includes(trimmed)) {
      // Show toast and highlight existing keyword
      toast.info(`"${trimmed}" is already in your include keywords`, {
        duration: 2000,
      });
      setHighlightedGoodKeyword(trimmed);
      setTimeout(() => setHighlightedGoodKeyword(null), 2000);
      setKeywordInput("");
      return;
    }

    setGoodKeywords([...goodKeywords, trimmed]);
    setKeywordInput("");
    if (keywordError) setKeywordError("");
  };

  // Helper to add bad keyword with duplicate detection
  const addBadKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    if (badKeywords.includes(trimmed)) {
      // Show toast and highlight existing keyword
      toast.info(`"${trimmed}" is already in your exclude keywords`, {
        duration: 2000,
      });
      setHighlightedBadKeyword(trimmed);
      setTimeout(() => setHighlightedBadKeyword(null), 2000);
      setBadKeywordInput("");
      return;
    }

    setBadKeywords([...badKeywords, trimmed]);
    setBadKeywordInput("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? `Edit Source: ${source?.name}` : "Add New Feed Source"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update content filtering and keywords"
                : "Paste any URL - we'll auto-detect the content type."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Source Name - Only show in create mode, edit mode shows it in the title */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="source-name">Source Name</Label>
                <Input
                  id="source-name"
                  placeholder="e.g., Tech News Feed"
                  {...form.register("name")}
                  disabled={createMutation.isPending}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            )}

            {/* URL Field - Editable in create mode, read-only in edit mode */}
            <div className="space-y-2">
              <Label htmlFor="source-url">Source URL</Label>
              {isEditMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="max-w-[400px] rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground truncate">
                      {getUrlFromSource(source!) || "No URL"}
                    </div>
                    {getUrlFromSource(source!) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          window.open(getUrlFromSource(source!), "_blank", "noopener,noreferrer")
                        }
                        title="Open URL in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL cannot be changed after creation
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Paste any URL - we&apos;ll auto-detect the type
                  </p>
                  <Input
                    id="source-url"
                    type="url"
                    placeholder="https://example.com/feed or youtube.com/@channel"
                    {...form.register("url")}
                    disabled={createMutation.isPending}
                  />
                  {form.formState.errors.url && (
                    <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
                  )}
                </>
              )}
            </div>

            {/* Good Keywords */}
            <div className="space-y-2">
              <Label htmlFor="good-keywords">Include Keywords</Label>
              <p className="text-xs text-muted-foreground">Content must relate to these topics</p>
              <div className="flex gap-2">
                <Input
                  id="good-keywords"
                  placeholder="e.g., AI, machine learning"
                  value={keywordInput}
                  onChange={(e) => {
                    setKeywordInput(e.target.value);
                    if (keywordError) setKeywordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGoodKeyword(keywordInput);
                    }
                  }}
                  disabled={createMutation.isPending}
                  className={keywordError ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addGoodKeyword(keywordInput)}
                  disabled={!keywordInput.trim() || createMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywordError && <p className="text-sm text-destructive">{keywordError}</p>}
              {goodKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {goodKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      className={`bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ${
                        highlightedGoodKeyword === keyword
                          ? "ring-2 ring-offset-2 ring-yellow-400 scale-110"
                          : ""
                      }`}
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => setGoodKeywords(goodKeywords.filter((k) => k !== keyword))}
                        className="ml-1 hover:text-primary-foreground/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bad Keywords */}
            <div className="space-y-2">
              <Label htmlFor="bad-keywords">Exclude Keywords (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Filter out content related to these topics
              </p>
              <div className="flex gap-2">
                <Input
                  id="bad-keywords"
                  placeholder="e.g., crypto, gambling"
                  value={badKeywordInput}
                  onChange={(e) => setBadKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBadKeyword(badKeywordInput);
                    }
                  }}
                  disabled={createMutation.isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addBadKeyword(badKeywordInput)}
                  disabled={!badKeywordInput.trim() || createMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {badKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="destructive"
                      className={`transition-all duration-300 ${
                        highlightedBadKeyword === keyword
                          ? "ring-2 ring-offset-2 ring-yellow-400 scale-110"
                          : ""
                      }`}
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => setBadKeywords(badKeywords.filter((k) => k !== keyword))}
                        className="ml-1 hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Min Relevance Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-score">Minimum Relevance Score</Label>
                <span className="text-sm font-medium text-primary">{minRelevanceScore}</span>
              </div>
              <Slider
                id="min-score"
                min={0}
                max={100}
                step={5}
                value={[minRelevanceScore]}
                onValueChange={(value) => setMinRelevanceScore(value[0]!)}
                disabled={createMutation.isPending}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                AI filters out content below this relevance score. Higher values = stricter
                filtering. Default: 50
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Source"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
