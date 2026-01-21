"use client";

import { useEffect } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BasicInfoStepProps {
  url: string;
  name: string;
  onUrlChange?: (url: string) => void;
  onNameChange: (name: string) => void;
  isEditMode?: boolean;
}

export function BasicInfoStep({
  url,
  name,
  onUrlChange,
  onNameChange,
  isEditMode = false,
}: BasicInfoStepProps) {
  // Auto-generate name from URL if empty
  useEffect(() => {
    if (!name && url) {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace("www.", "");
        const generatedName = hostname
          .split(".")
          .slice(0, -1)
          .join(" ")
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        onNameChange(generatedName);
      } catch {
        // Invalid URL, skip auto-generation
      }
    }
  }, [url, name, onNameChange]);

  // Edit mode: compact card-like layout matching KeywordsStep
  if (isEditMode) {
    return (
      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold text-foreground">Source Details</Label>
        </div>

        {/* URL row - first */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Source URL</Label>
          <div className="flex items-center gap-2">
            <div className="max-w-[400px] flex items-center h-8 rounded-md border border-input bg-black/5 px-3 text-sm text-muted-foreground">
              <span className="truncate">{url || "No URL"}</span>
            </div>
            {url && url.startsWith("http") && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                title="Open URL in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Source Name */}
        <div className="space-y-1">
          <Label htmlFor="source-name" className="text-xs text-muted-foreground">
            Source Name
          </Label>
          <Input
            id="source-name"
            placeholder="e.g., Tech News Feed"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-8"
          />
        </div>
      </div>
    );
  }

  // Create mode: card layout matching edit mode style
  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-semibold text-foreground">Source Details</Label>
      </div>

      {/* URL row - first, so user pastes URL */}
      <div className="space-y-1">
        <Label htmlFor="source-url" className="text-xs text-muted-foreground">
          Source URL
        </Label>
        <Input
          id="source-url"
          type="url"
          placeholder="https://example.com/feed or youtube.com/@channel"
          value={url}
          onChange={(e) => onUrlChange?.(e.target.value)}
          className="h-8"
        />
        <p className="text-xs text-muted-foreground">
          Paste any URL - we&apos;ll auto-detect the content type
        </p>
      </div>

      {/* Source Name */}
      <div className="space-y-1">
        <Label htmlFor="source-name" className="text-xs text-muted-foreground">
          Source Name
        </Label>
        <Input
          id="source-name"
          placeholder="e.g., Tech News Feed"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  );
}
