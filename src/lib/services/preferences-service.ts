/**
 * Preferences Service
 * Handles user preferences for notifications and privacy settings
 *
 * NOTE: Backend preferences API is not yet implemented.
 * This service uses localStorage as a temporary solution.
 * When backend endpoints are available, update API calls accordingly.
 */

import apiClient from "@/lib/api/client";
import type { NotificationPreferences } from "@/components/settings/NotificationSettings";

export interface PrivacySettings {
  profile_visibility: "public" | "private";
  show_subscriber_count: boolean;
  show_revenue_stats: boolean;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    email_new_subscriber: true,
    email_revenue_milestone: true,
    email_content_published: true,
    email_weekly_digest: false,
    push_enabled: false,
    marketing_emails: false,
  },
  privacy: {
    profile_visibility: "public",
    show_subscriber_count: true,
    show_revenue_stats: false,
  },
};

// localStorage keys
const STORAGE_KEY = "smartfeed_user_preferences";

/**
 * Get preferences from localStorage
 */
function getLocalPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to parse stored preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to localStorage
 */
function saveLocalPreferences(preferences: UserPreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

export const preferencesService = {
  /**
   * Get all user preferences
   * Falls back to localStorage if API is not available
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      // Try to fetch from API first
      const response = await apiClient.get<UserPreferences>("/creator/preferences");
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist (404), use localStorage
      if (error?.response?.status === 404) {
        console.info("Preferences API not available, using local storage");
        return getLocalPreferences();
      }

      // For other errors, log and return local preferences
      console.error("Failed to fetch preferences:", error);
      return getLocalPreferences();
    }
  },

  /**
   * Update notification preferences
   * Falls back to localStorage if API is not available
   */
  async updateNotifications(
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    try {
      // Try to update via API
      const response = await apiClient.put<NotificationPreferences>(
        "/creator/preferences/notifications",
        preferences
      );
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist (404), save to localStorage
      if (error?.response?.status === 404) {
        console.info("Preferences API not available, using local storage");
        const current = getLocalPreferences();
        const updated = { ...current, notifications: preferences };
        saveLocalPreferences(updated);
        return preferences;
      }

      // For other errors, still save locally but log the error
      console.error("Failed to update notification preferences via API:", error);
      const current = getLocalPreferences();
      const updated = { ...current, notifications: preferences };
      saveLocalPreferences(updated);
      return preferences;
    }
  },

  /**
   * Update privacy settings
   * Falls back to localStorage if API is not available
   */
  async updatePrivacy(settings: PrivacySettings): Promise<PrivacySettings> {
    try {
      // Try to update via API
      const response = await apiClient.put<PrivacySettings>(
        "/creator/preferences/privacy",
        settings
      );
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist (404), save to localStorage
      if (error?.response?.status === 404) {
        console.info("Preferences API not available, using local storage");
        const current = getLocalPreferences();
        const updated = { ...current, privacy: settings };
        saveLocalPreferences(updated);
        return settings;
      }

      // For other errors, still save locally but log the error
      console.error("Failed to update privacy settings via API:", error);
      const current = getLocalPreferences();
      const updated = { ...current, privacy: settings };
      saveLocalPreferences(updated);
      return settings;
    }
  },

  /**
   * Request data export
   * TODO: Backend endpoint not implemented yet
   */
  async requestDataExport(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>("/creator/data-export");
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist, return a placeholder message
      if (error?.response?.status === 404) {
        console.info("Data export API not available yet");
        return {
          message: "Data export feature is coming soon. Your data export request has been noted.",
        };
      }

      console.error("Failed to request data export:", error);
      throw error;
    }
  },
};
