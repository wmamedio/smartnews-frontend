"use client";

import { Check, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIKeywordSuggestionsProps {
  keywords: string[];
  selectedKeywords: string[];
  onToggle: (keyword: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function AIKeywordSuggestions({
  keywords,
  selectedKeywords,
  onToggle,
  isLoading,
  error,
}: AIKeywordSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>AI is analyzing the source...</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="default">
        <AlertDescription className="text-sm">
          Unable to fetch AI suggestions. You can still manually add keywords below.
        </AlertDescription>
      </Alert>
    );
  }

  if (keywords.length === 0) {
    return (
      <Alert>
        <AlertDescription className="text-sm text-muted-foreground">
          No AI keyword suggestions available for this source. Add your own keywords below to filter
          content.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Suggested Keywords</span>
        <span className="text-xs text-muted-foreground">Based on analyzing the source content</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => {
          const isSelected = selectedKeywords.includes(keyword);
          return (
            <Badge
              key={keyword}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected ? "pr-2" : ""
              }`}
              onClick={() => onToggle(keyword)}
            >
              {isSelected && <Check className="mr-1 h-3 w-3" />}
              {keyword}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
