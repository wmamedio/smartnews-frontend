"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Download, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { PrivacySettings as PrivacySettingsType } from "@/lib/services/preferences-service";

const privacySchema = z.object({
  profile_visibility: z.enum(["public", "private"]),
  show_subscriber_count: z.boolean(),
  show_revenue_stats: z.boolean(),
});

interface PrivacySettingsProps {
  initialData?: Partial<PrivacySettingsType>;
  onSubmit: (data: PrivacySettingsType) => Promise<void>;
  onDataExport?: () => Promise<void>;
  onCookieSettings?: () => void;
}

export function PrivacySettings({
  initialData = {},
  onSubmit,
  onDataExport,
  onCookieSettings,
}: PrivacySettingsProps) {
  const form = useForm<PrivacySettingsType>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      profile_visibility: initialData.profile_visibility ?? "public",
      show_subscriber_count: initialData.show_subscriber_count ?? true,
      show_revenue_stats: initialData.show_revenue_stats ?? false,
    },
  });

  const handleSubmit = async (data: PrivacySettingsType) => {
    try {
      await onSubmit(data);
      toast.success("Privacy settings saved", {
        description: "Your privacy preferences have been updated.",
      });
      form.reset(data); // Reset form with new values to clear isDirty
    } catch (error) {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "Please try again.",
        action: {
          label: "Retry",
          onClick: () => form.handleSubmit(handleSubmit)(),
        },
      });
    }
  };

  const handleDataExport = async () => {
    if (!onDataExport) return;

    try {
      await onDataExport();
      toast.success("Data export requested", {
        description: "You'll receive an email with your data export within 24 hours.",
      });
    } catch (error) {
      toast.error("Failed to request data export", {
        description: "Please try again later.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Profile Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Visibility</CardTitle>
            <CardDescription>Control who can see your creator profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="profile_visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <RadioGroupItem value="public" />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">Public</FormLabel>
                          <FormDescription>
                            Anyone can view your profile and subscribe
                          </FormDescription>
                        </div>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <RadioGroupItem value="private" />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">Private</FormLabel>
                          <FormDescription>Only visible to subscribers</FormDescription>
                        </div>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="show_subscriber_count"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <div className="space-y-1 pr-4">
                    <FormLabel className="text-base">Show Subscriber Count</FormLabel>
                    <FormDescription>
                      Display subscriber count on your public profile
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_revenue_stats"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <div className="space-y-1 pr-4">
                    <FormLabel className="text-base">Show Revenue Statistics</FormLabel>
                    <FormDescription>Display earnings on your public profile</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Data & Privacy Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>Manage your data and privacy preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Download Your Data</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get a copy of your profile, feeds, and activity
                </p>
              </div>
              <Button variant="outline" onClick={handleDataExport} disabled={!onDataExport}>
                <Download className="mr-2 h-4 w-4" />
                Request Export
              </Button>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Cookie Preferences</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage cookie and tracking settings
                </p>
              </div>
              <Button variant="outline" onClick={onCookieSettings} disabled={!onCookieSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Cookies
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
