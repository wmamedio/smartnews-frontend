/**
 * Slug generation utilities for SEO-friendly URLs
 * Story 1.6.2: Public Feed Item Detail Page
 */

/**
 * Generate URL-friendly slug from a title
 * @param title - The title to convert to slug
 * @returns URL-safe slug (lowercase, hyphens, max 60 chars)
 */
export function generateItemSlug(title: string): string {
  if (!title || typeof title !== "string") {
    return "";
  }

  return (
    title
      .toLowerCase()
      .trim()
      // Remove special characters except spaces and hyphens
      .replace(/[^\w\s-]/g, "")
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Remove consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit to 60 characters
      .substring(0, 60)
      // Remove trailing hyphen if substring cut in middle of word
      .replace(/-+$/, "")
  );
}

/**
 * Extract potential content hash from slug or item data
 * Used for matching items when navigating from slug URL
 * @param slug - The item slug from URL
 * @param items - Array of items to search
 * @returns Matching item or undefined
 */
export function findItemBySlug<T extends { title: string; content_hash?: string }>(
  slug: string,
  items: T[]
): T | undefined {
  if (!slug || !items.length) return undefined;

  // Try exact slug match first
  const exactMatch = items.find((item) => generateItemSlug(item.title) === slug);
  if (exactMatch) return exactMatch;

  // Try partial match (slug might be truncated)
  const partialMatch = items.find((item) => generateItemSlug(item.title).startsWith(slug));
  if (partialMatch) return partialMatch;

  return undefined;
}
