import { z } from "zod";

export const profileSetupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().optional(),
  categories: z.array(z.string()).max(5, "Maximum 5 categories allowed").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
});

export const creatorApplicationSchema = z.object({
  experience: z.enum(["beginner", "intermediate", "expert"]),
  contentTypes: z.array(z.string()).min(1, "Please select at least one content type"),
  expectedFrequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  motivation: z
    .string()
    .min(50, "Please tell us more about your motivation (minimum 50 characters)")
    .max(1000, "Motivation must be less than 1000 characters"),
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type CreatorApplicationInput = z.infer<typeof creatorApplicationSchema>;

// Available categories for content creators
export const CONTENT_CATEGORIES = [
  "Technology",
  "Science",
  "Business",
  "Health & Fitness",
  "Lifestyle",
  "Education",
  "Entertainment",
  "News & Politics",
  "Sports",
  "Travel",
  "Food & Cooking",
  "Art & Design",
  "Music",
  "Gaming",
  "Fashion",
  "Personal Development",
  "Finance",
  "Marketing",
  "Environment",
  "History",
] as const;

// Content types for creator application
export const CONTENT_TYPES = [
  "Articles & Blog Posts",
  "Video Content",
  "Podcasts",
  "Social Media Posts",
  "Newsletters",
  "Research Papers",
  "Infographics",
  "Tutorials",
  "Reviews",
  "News & Updates",
] as const;
