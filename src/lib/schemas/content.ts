import { z } from "zod";

// Feed Source Schemas
export const createFeedSourceSchema = z.object({
  source_type: z.enum(["rss", "url", "social_media"], {
    message: "Please select a source type",
  }),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().optional().default(true),
});

export const updateFeedSourceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

// Feed Item Schemas
export const createFeedItemSchema = z.object({
  feed_source_id: z.number().positive("Feed source is required"),
  title: z.string().min(1, "Title is required").max(300, "Title must be less than 300 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  url: z.string().url("Please enter a valid URL"),
  author: z.string().max(100, "Author must be less than 100 characters").optional(),
  published_at: z.string().datetime().optional(),
  status: z.enum(["pending", "published", "archived"]).default("pending"),
});

export const updateFeedItemSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title must be less than 300 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  status: z.enum(["pending", "published", "archived"]).optional(),
  author: z.string().max(100, "Author must be less than 100 characters").optional(),
});

// Bulk URL Import Schema
export const bulkUrlImportSchema = z.object({
  urls: z
    .string()
    .min(1, "Please enter at least one URL")
    .transform((val) =>
      val
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
    )
    .pipe(
      z
        .array(z.string().url("Each line must be a valid URL"))
        .min(1, "Please enter at least one valid URL")
    ),
  feed_source_id: z.number().positive("Please select a feed source"),
});

// Single URL Import Schema
export const urlImportSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  feed_source_id: z.number().positive("Please select a feed source"),
});

// RSS Feed Import Schema
export const rssImportSchema = z.object({
  name: z
    .string()
    .min(1, "Feed name is required")
    .max(100, "Name must be less than 100 characters"),
  url: z.string().url("Please enter a valid RSS feed URL"),
  is_active: z.boolean().default(true),
});

// File Upload Schema
export const fileUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Please select a file")
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine((file) => {
      const validTypes = [
        "text/xml",
        "application/xml",
        "text/csv",
        "application/vnd.ms-excel",
        "text/html",
      ];
      return validTypes.includes(file.type) || file.name.endsWith(".opml");
    }, "File must be OPML, CSV, or HTML"),
});

// Bulk Action Schema
export const bulkActionSchema = z.object({
  item_ids: z.array(z.number()).min(1, "Please select at least one item"),
  action: z.enum(["publish", "archive", "delete"], {
    message: "Please select an action",
  }),
});

// Type exports
export type CreateFeedSourceInput = z.infer<typeof createFeedSourceSchema>;
export type UpdateFeedSourceInput = z.infer<typeof updateFeedSourceSchema>;
export type CreateFeedItemInput = z.infer<typeof createFeedItemSchema>;
export type UpdateFeedItemInput = z.infer<typeof updateFeedItemSchema>;
export type BulkUrlImportInput = z.infer<typeof bulkUrlImportSchema>;
export type UrlImportInput = z.infer<typeof urlImportSchema>;
export type RssImportInput = z.infer<typeof rssImportSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
