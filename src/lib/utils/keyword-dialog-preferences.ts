/**
 * Utility for managing "Don't ask again today" preferences for keyword dialogs
 * Stores preferences in localStorage with feed-specific or library-wide keys
 */

const STORAGE_KEY_PREFIX = "keyword_dialog_skip_";
const LIBRARY_KEY = "keyword_dialog_skip_library";

interface SkipPreference {
  feedId?: number;
  context?: "library";
  expiresAt: string; // ISO timestamp for end of day
}

/**
 * Get the end of day timestamp (23:59:59.999 of current day)
 */
function getEndOfDayTimestamp(): string {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay.toISOString();
}

/**
 * Check if keyword dialog should be skipped for a specific feed today
 * @param feedId - The feed ID to check
 * @returns true if dialog should be skipped, false otherwise
 */
export function shouldSkipKeywordDialog(feedId: number): boolean {
  if (typeof window === "undefined") return false; // SSR safety

  const key = `${STORAGE_KEY_PREFIX}${feedId}`;
  const stored = localStorage.getItem(key);

  if (!stored) return false;

  try {
    const preference: SkipPreference = JSON.parse(stored);
    const now = new Date();
    const expiresAt = new Date(preference.expiresAt);

    // Check if preference has expired (past end of day)
    if (now > expiresAt) {
      localStorage.removeItem(key); // Clean up expired preference
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to parse keyword dialog preference:", error);
    localStorage.removeItem(key); // Clean up corrupted data
    return false;
  }
}

/**
 * Set preference to skip keyword dialog for a specific feed until end of day
 * @param feedId - The feed ID to skip dialogs for
 */
export function setSkipKeywordDialog(feedId: number): void {
  if (typeof window === "undefined") return; // SSR safety

  const preference: SkipPreference = {
    feedId,
    expiresAt: getEndOfDayTimestamp(),
  };

  const key = `${STORAGE_KEY_PREFIX}${feedId}`;
  localStorage.setItem(key, JSON.stringify(preference));

  console.log(`Keyword dialog will be skipped for feed ${feedId} until end of day`);
}

/**
 * Clear skip preference for a specific feed (useful for testing)
 * @param feedId - The feed ID to clear preference for
 */
export function clearSkipKeywordDialog(feedId: number): void {
  if (typeof window === "undefined") return; // SSR safety

  const key = `${STORAGE_KEY_PREFIX}${feedId}`;
  localStorage.removeItem(key);
}

/**
 * Check if keyword dialog should be skipped for the Library page today
 * @returns true if dialog should be skipped, false otherwise
 */
export function shouldSkipKeywordDialogLibrary(): boolean {
  if (typeof window === "undefined") return false; // SSR safety

  const stored = localStorage.getItem(LIBRARY_KEY);

  if (!stored) return false;

  try {
    const preference: SkipPreference = JSON.parse(stored);
    const now = new Date();
    const expiresAt = new Date(preference.expiresAt);

    // Check if preference has expired (past end of day)
    if (now > expiresAt) {
      localStorage.removeItem(LIBRARY_KEY); // Clean up expired preference
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to parse keyword dialog preference:", error);
    localStorage.removeItem(LIBRARY_KEY); // Clean up corrupted data
    return false;
  }
}

/**
 * Set preference to skip keyword dialog for the Library page until end of day
 */
export function setSkipKeywordDialogLibrary(): void {
  if (typeof window === "undefined") return; // SSR safety

  const preference: SkipPreference = {
    context: "library",
    expiresAt: getEndOfDayTimestamp(),
  };

  localStorage.setItem(LIBRARY_KEY, JSON.stringify(preference));

  console.log("Keyword dialog will be skipped for Library page until end of day");
}

/**
 * Clear skip preference for the Library page (useful for testing)
 */
export function clearSkipKeywordDialogLibrary(): void {
  if (typeof window === "undefined") return; // SSR safety

  localStorage.removeItem(LIBRARY_KEY);
}

/**
 * Clean up all expired preferences (optional, for maintenance)
 */
export function cleanupExpiredPreferences(): void {
  if (typeof window === "undefined") return; // SSR safety

  const now = new Date();

  // Clean up feed-specific preferences
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const preference: SkipPreference = JSON.parse(stored);
          const expiresAt = new Date(preference.expiresAt);

          if (now > expiresAt) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    }
  }

  // Clean up library preference
  const libraryStored = localStorage.getItem(LIBRARY_KEY);
  if (libraryStored) {
    try {
      const preference: SkipPreference = JSON.parse(libraryStored);
      const expiresAt = new Date(preference.expiresAt);
      if (now > expiresAt) {
        localStorage.removeItem(LIBRARY_KEY);
      }
    } catch (error) {
      localStorage.removeItem(LIBRARY_KEY);
    }
  }
}
