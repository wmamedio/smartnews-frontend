"use client";

import { useState } from "react";
import { Link2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InlineSourcePromptProps {
  onUrlSubmit: (url: string) => void;
}

export function InlineSourcePrompt({ onUrlSubmit }: InlineSourcePromptProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-12 pb-12 px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Link2 className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">
              Let&apos;s add your first source!
            </h3>
            <p className="text-muted-foreground">
              Start by pasting a URL from any website, RSS feed, YouTube channel, or social media.
            </p>
          </div>

          <div className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="Paste your URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg pr-4"
                autoFocus
              />
            </div>
            <Button onClick={handleSubmit} disabled={!url.trim()} size="lg" className="h-12 px-6">
              Next
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            We&apos;ll auto-detect the source type and suggest relevant keywords to filter content
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
