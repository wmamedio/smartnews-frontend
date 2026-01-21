"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { bulkUrlImportSchema, type BulkUrlImportInput } from "@/lib/schemas/content";

interface BulkUrlInputProps {
  feedSourceId: number;
  onSuccess?: () => void;
}

export function BulkUrlInput({ feedSourceId, onSuccess }: BulkUrlInputProps) {
  const queryClient = useQueryClient();
  const [urlCount, setUrlCount] = useState(0);

  type FormData = { urls: string; feed_source_id: number };
  const form = useForm<FormData>({
    defaultValues: {
      urls: "",
      feed_source_id: feedSourceId,
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: { urls: string[]; feed_source_id: number }) => {
      // Backend doesn't have bulk create endpoint, create items individually
      const results = [];
      for (const url of data.urls) {
        try {
          const item = await feedItemsService.create({
            feed_source_id: data.feed_source_id,
            title: url, // Will be updated when content is fetched
            link: url,
          });
          results.push(item);
        } catch (error) {
          console.error(`Failed to create item for URL: ${url}`, error);
        }
      }
      return { count: results.length, items: results };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      toast.success(`Successfully imported ${data.count} items`);
      form.reset();
      setUrlCount(0);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to import URLs");
    },
  });

  const onSubmit = (data: FormData) => {
    const urlList = data.urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    bulkImportMutation.mutate({
      urls: urlList,
      feed_source_id: feedSourceId,
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    form.setValue("urls", value);
    const lines = value.split("\n").filter((line) => line.trim().length > 0);
    setUrlCount(lines.length);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk URL Import</CardTitle>
        <CardDescription>
          Paste multiple URLs (one per line) to import them all at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="urls">URLs</Label>
              <span className="text-xs text-muted-foreground">{urlCount} URLs</span>
            </div>
            <Textarea
              id="urls"
              placeholder={
                "https://example.com/article1\nhttps://example.com/article2\nhttps://example.com/article3"
              }
              rows={10}
              {...form.register("urls")}
              onChange={handleTextareaChange}
              className="font-mono text-sm"
            />
            {form.formState.errors.urls && (
              <p className="text-sm text-destructive">{form.formState.errors.urls.message}</p>
            )}
          </div>

          <Button type="submit" disabled={bulkImportMutation.isPending || urlCount === 0}>
            {bulkImportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {urlCount > 0 ? `${urlCount} URLs` : "URLs"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
