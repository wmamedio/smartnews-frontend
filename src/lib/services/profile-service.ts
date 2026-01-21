import apiClient from "@/lib/api/client";
import type { ProfileSetupInput } from "@/lib/schemas/profile";

interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface CreatorProfileResponse {
  id: number;
  user_id: number;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export const profileService = {
  /**
   * Get current user profile from both /auth/me and /creator/profile
   */
  async getProfile(): Promise<Partial<ProfileSetupInput>> {
    try {
      // Fetch from both endpoints in parallel
      const [userResponse, creatorResponse] = await Promise.all([
        apiClient.get<UserResponse>("/auth/me"),
        apiClient.get<CreatorProfileResponse>("/creator/profile"),
      ]);

      const user = userResponse.data;
      const creator = creatorResponse.data;

      return {
        // From /auth/me
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        // From /creator/profile
        name: `${user.first_name} ${user.last_name}`, // Default display name
        bio: creator.bio || "",
        avatar: creator.avatar_url || "",
        website: creator.website_url || "",
      };
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  },

  /**
   * Update user profile - saves to both /auth/me and /creator/profile
   */
  async updateProfile(data: ProfileSetupInput) {
    try {
      // Build creator profile payload - only include non-empty values
      const creatorPayload: Record<string, string> = {};
      if (data.bio && data.bio.trim()) {
        creatorPayload.bio = data.bio.trim();
      }
      if (data.avatar && data.avatar.trim()) {
        creatorPayload.avatar_url = data.avatar.trim();
      }
      if (data.website && data.website.trim()) {
        creatorPayload.website_url = data.website.trim();
      }

      // Update both endpoints in parallel
      const [userResponse, creatorResponse] = await Promise.all([
        // Update /auth/me with email, first_name, last_name
        apiClient.put("/auth/me", {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
        }),
        // Update /creator/profile - only if we have data to send
        Object.keys(creatorPayload).length > 0
          ? apiClient.put("/creator/profile", creatorPayload)
          : Promise.resolve({ data: {} }),
      ]);

      return {
        user: userResponse.data,
        creator: creatorResponse.data,
      };
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/creator/profile/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Return the URL of the uploaded avatar
    return response.data.url || response.data.avatar_url;
  },
};
