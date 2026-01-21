"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Globe, Calendar } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api/client";

interface CreatorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  created_at: string;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const creatorId = params.id as string;
  // Convert both to strings for comparison (user.id might be number or string)
  // Also check creator_profile_id since that's sometimes used
  const isOwnProfile =
    user?.id?.toString() === creatorId?.toString() ||
    (user as any)?.creator_profile_id?.toString() === creatorId?.toString();

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorId, user?.id]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isOwnProfile && user) {
        // For own profile, fetch from current user endpoints
        const [userResponse, creatorResponse] = await Promise.all([
          apiClient.get("/auth/me"),
          apiClient.get("/creator/profile"),
        ]);

        const userData = userResponse.data;
        const creatorData = creatorResponse.data;

        // Combine data into profile format
        setProfile({
          id: userData.id,
          user_id: userData.id,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email,
          bio: creatorData.bio || "",
          avatar_url: creatorData.avatar_url || "",
          website_url: creatorData.website_url || "",
          created_at: creatorData.created_at || userData.created_at,
        });
      } else {
        // For other users' profiles, fetch from discover endpoint and find by ID
        // Note: The API uses creator_hash, not user ID, for public profiles
        const response = await apiClient.get(`/creators/discover?limit=100`);
        const creators = response.data || [];
        const creator = creators.find(
          (c: any) => c.user_id?.toString() === creatorId || c.id?.toString() === creatorId
        );

        if (creator) {
          setProfile({
            id: creator.id || creator.user_id,
            user_id: creator.user_id,
            first_name: creator.first_name || creator.name?.split(" ")[0] || "",
            last_name: creator.last_name || creator.name?.split(" ").slice(1).join(" ") || "",
            email: creator.email || "",
            bio: creator.bio || "",
            avatar_url: creator.avatar_url || "",
            website_url: creator.website_url || "",
            created_at: creator.created_at || "",
          });
        } else {
          setError("Creator not found");
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || "Profile not found"}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={user ? "/dashboard" : "/discover"}>
                {user ? "Back to Dashboard" : "Back to Discovery"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = `${profile.first_name} ${profile.last_name}`.trim() || "Creator";
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader className="space-y-6">
          {/* Profile Header with Edit Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={displayName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {profile.bio && <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>}
              </div>
            </div>

            {isOwnProfile && (
              <Button asChild>
                <Link href="/settings/profile">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            )}
          </div>

          {/* Profile Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
                {profile.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="py-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">About</h2>
              {profile.bio ? (
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isOwnProfile
                    ? "Add a bio to tell people about yourself"
                    : "This creator hasn't added a bio yet"}
                </p>
              )}
            </div>

            {/* Placeholder for future content sections */}
            {/* TODO: Add creator's content feed, stats, etc. */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
