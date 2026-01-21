/**
 * Social Service
 * Handles social media connections and OAuth flows
 */

import apiClient from "@/lib/api/client";

export interface SocialConnection {
  provider: "youtube" | "twitter" | "reddit";
  isConnected: boolean;
  username?: string;
  followerCount?: number;
  lastSyncedAt?: string;
  profileUrl?: string;
}

export interface SocialAccountStatus {
  connected: boolean;
  followers_count: number;
  engagement_rate: number;
  connected_at?: string;
}

export interface SocialStatusResponse {
  social_accounts: {
    youtube?: SocialAccountStatus;
    twitter?: SocialAccountStatus;
    reddit?: SocialAccountStatus;
  };
}

export interface SocialStats {
  provider: string;
  followers: number;
  lastSynced: string;
}

export const socialService = {
  /**
   * Get all social connections for the current user
   */
  async getConnections(): Promise<SocialConnection[]> {
    try {
      const response = await apiClient.get<SocialStatusResponse>("/social/status");

      // Transform backend response to frontend format
      const providers: Array<"youtube" | "twitter" | "reddit"> = ["youtube", "twitter", "reddit"];

      return providers.map((provider) => {
        const account = response.data.social_accounts[provider];

        if (account && account.connected) {
          return {
            provider,
            isConnected: true,
            username: provider, // Backend doesn't provide username yet
            followerCount: account.followers_count,
            lastSyncedAt: account.connected_at,
          };
        }

        return {
          provider,
          isConnected: false,
        };
      });
    } catch (error) {
      console.error("Failed to fetch social connections:", error);
      // Return default disconnected state for all providers
      return [
        { provider: "youtube", isConnected: false },
        { provider: "twitter", isConnected: false },
        { provider: "reddit", isConnected: false },
      ];
    }
  },

  /**
   * Initiate OAuth connection for a provider
   * Opens OAuth flow in popup window
   */
  async connect(provider: string): Promise<void> {
    try {
      // Get OAuth redirect URL from backend
      const response = await apiClient.get<{ authUrl: string }>(`/social/${provider}/redirect`);

      // Open OAuth in popup
      const popup = window.open(
        response.data.authUrl,
        "oauth",
        "width=600,height=600,left=200,top=200"
      );

      // Wait for OAuth completion
      return new Promise((resolve, reject) => {
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            reject(new Error("OAuth window closed"));
          }
        }, 1000);

        window.addEventListener("message", (event) => {
          if (event.data.type === "oauth-success") {
            clearInterval(checkPopup);
            popup?.close();
            resolve();
          } else if (event.data.type === "oauth-error") {
            clearInterval(checkPopup);
            popup?.close();
            reject(new Error(event.data.error));
          }
        });
      });
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Disconnect a social account
   */
  async disconnect(provider: string): Promise<void> {
    try {
      await apiClient.delete(`/social/${provider}`);
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Refresh stats for a connected account
   */
  async refreshStats(provider: string): Promise<SocialStats> {
    try {
      const response = await apiClient.post<SocialStats>(`/social/${provider}/refresh`);
      return response.data;
    } catch (error) {
      console.error(`Failed to refresh stats for ${provider}:`, error);
      throw error;
    }
  },
};
