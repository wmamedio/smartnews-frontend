"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  setSkipKeywordDialog,
  setSkipKeywordDialogLibrary,
} from "@/lib/utils/keyword-dialog-preferences";

interface KeywordRefinementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: string[];
  mode: "good" | "bad";
  onAddKeywords: (selectedKeywords: string[]) => Promise<void>;
  sourceName?: string;
  feedId?: number; // For "Don't ask again today" feature (feed context)
  isLibraryContext?: boolean; // For Library page context
}

/**
 * Story 1.3.5: Keyword Refinement Dialog
 *
 * Displays extracted keywords from rated content and allows user to
 * select which keywords to add to the source's good_keywords or bad_keywords.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param keywords - Array of extracted keywords from the content
 * @param mode - "good" (thumbs up) or "bad" (thumbs down)
 * @param onAddKeywords - Callback when user confirms keyword selection
 * @param sourceName - Name of the source being updated (optional, for display)
 */
export function KeywordRefinementDialog({
  open,
  onOpenChange,
  keywords,
  mode,
  onAddKeywords,
  sourceName,
  feedId,
  isLibraryContext = false,
}: KeywordRefinementDialogProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom keywords state
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  // "Don't ask again today" toggle state
  const [dontAskAgainToday, setDontAskAgainToday] = useState(false);

  // Debug: Log when dialog opens
  useEffect(() => {
    if (open) {
      console.log("DEBUG: KeywordRefinementDialog opened with:", {
        open,
        keywords,
        mode,
        sourceName,
      });
    }
  }, [open, keywords, mode, sourceName]);

  // Reset custom keywords and toggle when dialog closes
  useEffect(() => {
    if (!open) {
      setCustomKeywordInput("");
      setCustomKeywords([]);
      setDontAskAgainToday(false); // Reset toggle for next time
    }
  }, [open]);

  const handleToggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const handleAddCustomKeyword = () => {
    const keyword = customKeywordInput.trim().toLowerCase();
    if (keyword && !customKeywords.includes(keyword) && !keywords.includes(keyword)) {
      setCustomKeywords([...customKeywords, keyword]);
      setSelectedKeywords((prev) => new Set([...prev, keyword])); // Auto-select custom keywords
      setCustomKeywordInput("");
    }
  };

  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter((k) => k !== keyword));
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      next.delete(keyword);
      return next;
    });
  };

  const handleAddKeywords = async () => {
    // Save "don't ask again" preference if enabled
    if (dontAskAgainToday) {
      if (feedId) {
        setSkipKeywordDialog(feedId);
      } else if (isLibraryContext) {
        setSkipKeywordDialogLibrary();
      }
    }

    // Combine selected extracted keywords and custom keywords
    const allSelectedKeywords = Array.from(selectedKeywords);

    if (allSelectedKeywords.length === 0) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddKeywords(allSelectedKeywords);
      setSelectedKeywords(new Set()); // Reset selection
      setCustomKeywords([]); // Reset custom keywords
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add keywords:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Save "don't ask again" preference if enabled
    if (dontAskAgainToday) {
      if (feedId) {
        setSkipKeywordDialog(feedId);
      } else if (isLibraryContext) {
        setSkipKeywordDialogLibrary();
      }
    }

    setSelectedKeywords(new Set());
    onOpenChange(false);
  };

  const title = mode === "good" ? "Add Good Keywords to Source?" : "Add Bad Keywords to Source?";
  const descriptionBase =
    mode === "good"
      ? "Found keywords from content you liked. Select any to improve AI filtering."
      : "Found keywords from content you disliked. Select any to help AI avoid similar content.";

  const description =
    keywords.length > 0
      ? `${descriptionBase} (${selectedKeywords.size} selected)`
      : descriptionBase;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {sourceName && (
            <p className="text-sm text-muted-foreground mt-1">
              Source: <span className="font-medium">{sourceName}</span>
            </p>
          )}
        </DialogHeader>

        {/* Keywords Selection */}
        {keywords.length > 0 ? (
          <div className="space-y-3">
            {/* Keywords as Badges */}
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => {
                const isSelected = selectedKeywords.has(keyword);
                return (
                  <Badge
                    key={keyword}
                    variant={isSelected ? (mode === "bad" ? "destructive" : "default") : "outline"}
                    className={cn(
                      "cursor-pointer transition-all duration-200 px-3 py-1.5 text-sm",
                      !isSelected && "hover:scale-105",
                      !isSelected &&
                        mode === "good" &&
                        "hover:bg-primary/10 hover:border-primary/50",
                      !isSelected &&
                        mode === "bad" &&
                        "hover:bg-destructive/10 hover:border-destructive/50",
                      isSelected && "shadow-sm"
                    )}
                    onClick={() => handleToggleKeyword(keyword)}
                  >
                    {keyword}
                  </Badge>
                );
              })}
            </div>
          </div>
        ) : (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>No keywords found for this content.</AlertDescription>
          </Alert>
        )}

        {/* Custom Keywords Input */}
        <div className="space-y-3 pt-2 border-t">
          <Label htmlFor="custom-keyword" className="text-sm font-medium">
            Add Custom Keywords
          </Label>
          <p className="text-xs text-muted-foreground">
            Add your own keywords that you think are relevant
          </p>
          <div className="flex gap-2">
            <Input
              id="custom-keyword"
              placeholder={mode === "good" ? "e.g., innovation, startup" : "e.g., spam, clickbait"}
              value={customKeywordInput}
              onChange={(e) => setCustomKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomKeyword();
                }
              }}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomKeyword}
              disabled={!customKeywordInput.trim() || isSubmitting}
              variant={mode === "bad" ? "destructive" : "default"}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Display Custom Keywords */}
          {customKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant={mode === "bad" ? "destructive" : "default"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm shadow-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomKeyword(keyword)}
                    className="hover:opacity-70 transition-opacity ml-1"
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Keyword changes will only affect future content imported from
            this source. Existing content will not be re-evaluated.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-4">
          {/* Don't Ask Again Toggle - Left side */}
          {(feedId || isLibraryContext) && (
            <div className="flex items-center space-x-2 mr-auto">
              <Switch
                id="dont-ask-again"
                checked={dontAskAgainToday}
                onCheckedChange={setDontAskAgainToday}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="dont-ask-again"
                className="text-sm font-normal cursor-pointer text-muted-foreground"
              >
                {feedId ? "Don't ask again today for this feed" : "Don't ask again today"}
              </Label>
            </div>
          )}

          {/* Buttons - Right side */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </Button>
            <Button
              onClick={handleAddKeywords}
              disabled={selectedKeywords.size === 0 || isSubmitting}
              variant={mode === "bad" ? "destructive" : "default"}
            >
              {isSubmitting ? "Adding..." : "Add Keywords"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
