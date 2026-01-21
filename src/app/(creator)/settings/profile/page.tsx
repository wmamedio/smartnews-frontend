"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { profileService } from "@/lib/services/profile-service";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { ProfileSetupInput } from "@/lib/schemas/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const [initialData, setInitialData] = useState<Partial<ProfileSetupInput> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await profileService.getProfile();
      setInitialData(profile);
    } catch (error) {
      console.error("Failed to load profile:", error);
      // If profile doesn't exist yet, provide empty defaults
      setInitialData({
        email: "",
        first_name: "",
        last_name: "",
        name: "",
        bio: "",
        avatar: "",
        website: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: ProfileSetupInput) => {
    await profileService.updateProfile(data);
    // Update user in auth store
    if (user) {
      setUser({
        ...user,
        profile: {
          ...user.profile,
          ...data,
        },
      });
    }
    // Reload profile data to reflect changes
    await loadProfile();
  };

  const handleAvatarUpload = async (file: File) => {
    return await profileService.uploadAvatar(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with View Public Profile link */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your public profile and personal information
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/creator/${user?.id}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Profile
          </Link>
        </Button>
      </div>

      <ProfileForm
        initialData={initialData || undefined}
        onSubmit={handleSubmit}
        onAvatarUpload={handleAvatarUpload}
      />
    </div>
  );
}
