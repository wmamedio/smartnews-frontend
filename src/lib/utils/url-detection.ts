import type { SourceType } from "@/lib/api/services/feed-sources.service";

/**
 * URL detection result with confidence score
 */
export interface URLDetectionResult {
  type: SourceType;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

/**
 * Detects the content type based on URL patterns
 * @param url - The URL to analyze
 * @returns Detection result with type and confidence
 */
export function detectUrlType(url: string): URLDetectionResult {
  // Return early if empty or invalid
  if (!url || url.trim().length === 0) {
    return {
      type: "manual_url",
      confidence: "low",
    };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // RSS Feed detection FIRST (before platform detection)
    // This ensures YouTube RSS feeds (youtube.com/feeds/videos.xml) are detected as RSS
    if (
      pathname.includes("/rss") ||
      pathname.includes("/feeds/") ||
      pathname.includes("/atom") ||
      pathname.endsWith(".rss") ||
      pathname.endsWith(".xml") ||
      pathname.endsWith("/feed.xml") ||
      urlObj.search.includes("feed=rss")
    ) {
      return {
        type: "rss",
        confidence: "high",
        reason: "Detected RSS feed path",
      };
    }

    // Check for common RSS feed indicators in query params
    if (urlObj.search.includes("format=rss") || urlObj.search.includes("type=rss")) {
      return {
        type: "rss",
        confidence: "medium",
        reason: "Detected RSS in query parameters",
      };
    }

    // YouTube detection (after RSS check)
    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be") ||
      hostname.includes("youtube-nocookie.com")
    ) {
      return {
        type: "youtube",
        confidence: "high",
        reason: "Detected YouTube domain",
      };
    }

    // X (Twitter) detection
    if (
      hostname.includes("x.com") ||
      hostname.includes("twitter.com") ||
      hostname.includes("t.co")
    ) {
      return {
        type: "twitter",
        confidence: "high",
        reason: "Detected X (Twitter) domain",
      };
    }

    // Reddit detection
    if (hostname.includes("reddit.com") || hostname.includes("redd.it")) {
      return {
        type: "reddit",
        confidence: "high",
        reason: "Detected Reddit domain",
      };
    }

    // Default to manual_url (single content) for any other valid URL
    return {
      type: "manual_url",
      confidence: "high",
      reason: "Single content (article, blog post, or web page)",
    };
  } catch {
    // Invalid URL, return manual_url with low confidence
    return {
      type: "manual_url",
      confidence: "low",
      reason: "Invalid URL format",
    };
  }
}

/**
 * Get a user-friendly label for the detected content type
 * @param result - Detection result
 * @returns Friendly label string
 */
export function getDetectionLabel(result: URLDetectionResult): string {
  const typeLabels: Record<SourceType, string> = {
    youtube: "YouTube Video",
    twitter: "X Post",
    reddit: "Reddit Post",
    rss: "RSS Feed",
    manual_url: "Single Content",
    csv: "CSV File",
    bookmarks: "Bookmarks",
  };

  return typeLabels[result.type] || "Single Content";
}

/**
 * Check if a URL is likely a video platform
 * @param url - The URL to check
 * @returns True if it's a known video platform
 */
export function isVideoUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const videoPlatforms = [
      "youtube.com",
      "youtu.be",
      "vimeo.com",
      "dailymotion.com",
      "twitch.tv",
      "tiktok.com",
    ];
    return videoPlatforms.some((platform) => hostname.includes(platform));
  } catch {
    return false;
  }
}

/**
 * Check if a URL is likely a social media platform
 * @param url - The URL to check
 * @returns True if it's a known social media platform
 */
export function isSocialMediaUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const socialPlatforms = [
      "x.com",
      "twitter.com",
      "facebook.com",
      "instagram.com",
      "reddit.com",
      "linkedin.com",
      "threads.net",
      "bluesky.social",
    ];
    return socialPlatforms.some((platform) => hostname.includes(platform));
  } catch {
    return false;
  }
}
