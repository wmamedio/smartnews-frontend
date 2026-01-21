"use client";

import { useState } from "react";
import { Plus, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface KeywordsStepProps {
  suggestedGoodKeywords: string[];
  suggestedBadKeywords: string[];
  goodKeywords: string[];
  badKeywords: string[];
  minRelevanceScore: number;
  onGoodKeywordsChange: (keywords: string[]) => void;
  onBadKeywordsChange: (keywords: string[]) => void;
  onMinRelevanceScoreChange: (score: number) => void;
  isLoadingSuggestions?: boolean;
  suggestionsError?: Error | null;
  keywordError?: string;
  isCompact?: boolean;
}

export function KeywordsStep({
  suggestedGoodKeywords,
  suggestedBadKeywords,
  goodKeywords,
  badKeywords,
  minRelevanceScore,
  onGoodKeywordsChange,
  onBadKeywordsChange,
  onMinRelevanceScoreChange,
  isLoadingSuggestions,
  suggestionsError,
  keywordError,
  isCompact = false,
}: KeywordsStepProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [badKeywordInput, setBadKeywordInput] = useState("");

  // Highlight state for duplicate keywords
  const [highlightedGoodKeyword, setHighlightedGoodKeyword] = useState<string | null>(null);
  const [highlightedBadKeyword, setHighlightedBadKeyword] = useState<string | null>(null);

  const handleAddGoodSuggestion = (keyword: string) => {
    if (!goodKeywords.includes(keyword)) {
      onGoodKeywordsChange([...goodKeywords, keyword]);
    }
  };

  const handleAddBadSuggestion = (keyword: string) => {
    if (!badKeywords.includes(keyword)) {
      onBadKeywordsChange([...badKeywords, keyword]);
    }
  };

  const handleAddGoodKeyword = () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;

    if (goodKeywords.includes(keyword)) {
      // Show toast and highlight existing keyword
      toast.info(`"${keyword}" is already in your include keywords`, {
        duration: 2000,
      });
      setHighlightedGoodKeyword(keyword);
      setTimeout(() => setHighlightedGoodKeyword(null), 2000);
      setKeywordInput("");
      return;
    }

    onGoodKeywordsChange([...goodKeywords, keyword]);
    setKeywordInput("");
  };

  const handleAddBadKeyword = () => {
    const keyword = badKeywordInput.trim();
    if (!keyword) return;

    if (badKeywords.includes(keyword)) {
      // Show toast and highlight existing keyword
      toast.info(`"${keyword}" is already in your exclude keywords`, {
        duration: 2000,
      });
      setHighlightedBadKeyword(keyword);
      setTimeout(() => setHighlightedBadKeyword(null), 2000);
      setBadKeywordInput("");
      return;
    }

    onBadKeywordsChange([...badKeywords, keyword]);
    setBadKeywordInput("");
  };

  const handleRemoveGoodKeyword = (keyword: string) => {
    onGoodKeywordsChange(goodKeywords.filter((k) => k !== keyword));
  };

  const handleRemoveBadKeyword = (keyword: string) => {
    onBadKeywordsChange(badKeywords.filter((k) => k !== keyword));
  };

  return (
    <div className={isCompact ? "space-y-3" : "space-y-6"}>
      {/* POSITIVE KEYWORDS SECTION */}
      <div
        className={`${isCompact ? "space-y-2 p-3" : "space-y-4 p-4"} bg-primary/5 rounded-lg border border-primary/20`}
      >
        <div className="flex items-center gap-2">
          <ThumbsUp className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} text-primary`} />
          <Label className={`${isCompact ? "text-sm" : "text-base"} font-semibold text-foreground`}>
            Include Keywords
          </Label>
          {keywordError && <span className="text-destructive ml-1">*</span>}
        </div>

        {!isCompact && (
          <p className="text-sm text-muted-foreground">Content must relate to these topics</p>
        )}

        {/* AI Suggestions for Good Keywords - filter out already added keywords */}
        {!isLoadingSuggestions &&
          suggestedGoodKeywords.filter((k) => !goodKeywords.includes(k)).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">✨ AI Suggestions</span>
                <span className="text-xs text-muted-foreground">Click to add</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedGoodKeywords
                  .filter((keyword) => !goodKeywords.includes(keyword))
                  .map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => handleAddGoodSuggestion(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

        {/* Manual Input for Good Keywords */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="good-keywords"
              placeholder="e.g., AI, machine learning"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGoodKeyword();
                }
              }}
              className={keywordError ? "border-destructive" : ""}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddGoodKeyword}
              disabled={!keywordInput.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {keywordError && <p className="text-sm text-destructive">{keywordError}</p>}
        </div>

        {/* Added Good Keywords */}
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
                  onClick={() => handleRemoveGoodKeyword(keyword)}
                  className="ml-1 hover:text-primary-foreground/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* NEGATIVE KEYWORDS SECTION */}
      <div
        className={`${isCompact ? "space-y-2 p-3" : "space-y-4 p-4"} bg-destructive/5 rounded-lg border border-destructive/20`}
      >
        <div className="flex items-center gap-2">
          <ThumbsDown className={`${isCompact ? "h-4 w-4" : "h-5 w-5"} text-destructive`} />
          <Label className={`${isCompact ? "text-sm" : "text-base"} font-semibold text-foreground`}>
            Exclude Keywords{" "}
            <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </Label>
        </div>

        {!isCompact && (
          <p className="text-sm text-muted-foreground">
            Filter out content related to these topics
          </p>
        )}

        {/* AI Suggestions for Bad Keywords - filter out already added keywords */}
        {!isLoadingSuggestions &&
          suggestedBadKeywords.filter((k) => !badKeywords.includes(k)).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">✨ AI Suggestions</span>
                <span className="text-xs text-muted-foreground">Click to add</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedBadKeywords
                  .filter((keyword) => !badKeywords.includes(keyword))
                  .map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => handleAddBadSuggestion(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

        {/* Manual Input for Bad Keywords */}
        <div className="flex gap-2">
          <Input
            id="bad-keywords"
            placeholder="e.g., crypto, gambling"
            value={badKeywordInput}
            onChange={(e) => setBadKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddBadKeyword();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddBadKeyword}
            disabled={!badKeywordInput.trim()}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Added Bad Keywords */}
        {badKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badKeywords.map((keyword) => (
              <Badge
                key={keyword}
                className={`bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-300 ${
                  highlightedBadKeyword === keyword
                    ? "ring-2 ring-offset-2 ring-yellow-400 scale-110"
                    : ""
                }`}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveBadKeyword(keyword)}
                  className="ml-1 hover:text-destructive-foreground/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Min Relevance Score */}
      <div className={isCompact ? "space-y-2" : "space-y-3"}>
        <div className="flex items-center justify-between">
          <Label htmlFor="min-score">Minimum Relevance Score</Label>
          <span className="text-sm font-medium text-foreground">{minRelevanceScore}</span>
        </div>
        <Slider
          id="min-score"
          min={0}
          max={100}
          step={5}
          value={[minRelevanceScore]}
          onValueChange={(value) => onMinRelevanceScoreChange(value[0]!)}
          className="w-full [&>span:first-child]:bg-muted [&>[role=slider]]:border-muted-foreground"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Lower = More Content</span>
          <span>Higher = Stricter</span>
        </div>
        {!isCompact && (
          <p className="text-xs text-muted-foreground">
            AI filters out content below this relevance score. Higher values = stricter filtering.
            Default: 50
          </p>
        )}
      </div>
    </div>
  );
}
