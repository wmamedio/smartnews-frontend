"use client";

import { useEffect, useState } from "react";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { preferencesService } from "@/lib/services/preferences-service";
import type { NotificationPreferences } from "@/components/settings/NotificationSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NotificationSettingsPage() {
  const [initialData, setInitialData] = useState<Partial<NotificationPreferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const preferences = await preferencesService.getPreferences();
      setInitialData(preferences.notifications);
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
      // Use default values if loading fails
      setInitialData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: NotificationPreferences) => {
    await preferencesService.updateNotifications(data);
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
            <Skeleton className="h-12 w-full" />
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
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how you receive updates and alerts
        </p>
      </div>

      <NotificationSettings initialData={initialData || undefined} onSubmit={handleSubmit} />
    </div>
  );
}
