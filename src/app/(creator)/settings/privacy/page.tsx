"use client";

import { useEffect, useState } from "react";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { preferencesService } from "@/lib/services/preferences-service";
import type { PrivacySettings as PrivacySettingsType } from "@/lib/services/preferences-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PrivacySettingsPage() {
  const [initialData, setInitialData] = useState<Partial<PrivacySettingsType> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const preferences = await preferencesService.getPreferences();
      setInitialData(preferences.privacy);
    } catch (error) {
      console.error("Failed to load privacy settings:", error);
      // Use default values if loading fails
      setInitialData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: PrivacySettingsType) => {
    await preferencesService.updatePrivacy(data);
  };

  const handleDataExport = async () => {
    await preferencesService.requestDataExport();
  };

  const handleCookieSettings = () => {
    // TODO: Implement cookie settings dialog
    console.log("Cookie settings clicked");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Privacy Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control your data and profile visibility
        </p>
      </div>

      <PrivacySettings
        initialData={initialData || undefined}
        onSubmit={handleSubmit}
        onDataExport={handleDataExport}
        onCookieSettings={handleCookieSettings}
      />
    </div>
  );
}
