"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardNavigation } from "./WizardNavigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";

// Form validation schema
const basicInfoSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
    .min(3, "Slug must be at least 3 characters"),
  cover_image: z.string().optional(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoStepProps {
  onNext?: () => void;
  onBack?: (() => void) | null;
  onCancel: () => void;
  onPublish?: () => Promise<void>;
}

export function BasicInfoStep({ onNext, onBack, onCancel, onPublish }: BasicInfoStepProps) {
  const { feed, updateFeed } = useFeedBuilderStore();
  const [isSlugManual, setIsSlugManual] = useState(false);

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: feed.name || "",
      slug: feed.slug || "",
      cover_image: feed.cover_image || "",
    },
  });

  // Reset form when feed data changes
  useEffect(() => {
    if (feed.id) {
      form.reset({
        name: feed.name || "",
        slug: feed.slug || "",
        cover_image: feed.cover_image || "",
      });
    }
  }, [feed.id, feed.name, feed.slug, feed.cover_image, form]);

  // Auto-generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  };

  // Watch name field for auto-slug generation
  const watchName = form.watch("name");

  useEffect(() => {
    if (!isSlugManual && watchName) {
      const newSlug = generateSlug(watchName);
      form.setValue("slug", newSlug);
    }
  }, [watchName, isSlugManual, form]);

  const onSubmit = async (data: BasicInfoFormValues) => {
    // Update store with form data
    updateFeed(data);

    // If onPublish is provided, this is final step in create flow - publish the feed
    if (onPublish) {
      await onPublish();
      return;
    }

    // Otherwise, move to next step (edit flow)
    onNext?.();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Feed Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Feed Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tech News Daily" {...field} autoFocus />
                    </FormControl>
                    <FormDescription>
                      You&apos;ll describe your feed and choose a category after selecting sources
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Feed URL/Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feed URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground px-3 py-2 border border-r-0 rounded-l-md bg-muted">
                              smartnews.example/f/
                            </span>
                            <Input
                              {...field}
                              className="rounded-l-none"
                              disabled={!isSlugManual}
                              placeholder="tech-news-daily"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSlugManual(!isSlugManual)}
                      >
                        {isSlugManual ? "Auto" : "Edit"}
                      </Button>
                    </div>
                    <FormDescription>
                      {isSlugManual ? "Manually editing URL slug" : "Auto-generated from feed name"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack || undefined}
        onNext={form.handleSubmit(onSubmit)}
        nextLabel={onPublish ? "Publish Feed" : onNext ? "Continue" : undefined}
      />
    </>
  );
}
