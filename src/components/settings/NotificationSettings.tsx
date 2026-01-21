"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";

const notificationSchema = z.object({
  email_new_subscriber: z.boolean(),
  email_revenue_milestone: z.boolean(),
  email_content_published: z.boolean(),
  email_weekly_digest: z.boolean(),
  push_enabled: z.boolean(),
  marketing_emails: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof notificationSchema>;

interface NotificationGroup {
  title: string;
  description: string;
  settings: Array<{
    name: keyof NotificationPreferences;
    label: string;
    description: string;
  }>;
}

const notificationGroups: NotificationGroup[] = [
  {
    title: "Email Notifications",
    description: "Receive updates via email",
    settings: [
      {
        name: "email_new_subscriber",
        label: "New Subscriber",
        description: "Get notified when someone subscribes to your feed",
      },
      {
        name: "email_revenue_milestone",
        label: "Revenue Milestones",
        description: "Alerts when you reach earning targets",
      },
      {
        name: "email_content_published",
        label: "Content Published",
        description: "Confirmation when your feed goes live",
      },
      {
        name: "email_weekly_digest",
        label: "Weekly Digest",
        description: "Summary of your week's performance",
      },
    ],
  },
  {
    title: "Push Notifications",
    description: "Browser notifications for real-time updates",
    settings: [
      {
        name: "push_enabled",
        label: "Enable browser notifications",
        description: "Receive push notifications in your browser",
      },
    ],
  },
  {
    title: "Marketing & Updates",
    description: "Stay informed about new features",
    settings: [
      {
        name: "marketing_emails",
        label: "Product updates and announcements",
        description: "Occasional emails about new features and improvements",
      },
    ],
  },
];

interface NotificationSettingsProps {
  initialData?: Partial<NotificationPreferences>;
  onSubmit: (data: NotificationPreferences) => Promise<void>;
}

export function NotificationSettings({ initialData = {}, onSubmit }: NotificationSettingsProps) {
  const form = useForm<NotificationPreferences>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_new_subscriber: initialData.email_new_subscriber ?? true,
      email_revenue_milestone: initialData.email_revenue_milestone ?? true,
      email_content_published: initialData.email_content_published ?? true,
      email_weekly_digest: initialData.email_weekly_digest ?? false,
      push_enabled: initialData.push_enabled ?? false,
      marketing_emails: initialData.marketing_emails ?? false,
    },
  });

  const handleSubmit = async (data: NotificationPreferences) => {
    try {
      await onSubmit(data);
      toast.success("Notification preferences saved", {
        description: "Your notification settings have been updated.",
      });
      form.reset(data); // Reset form with new values to clear isDirty
    } catch (error) {
      toast.error("Failed to save preferences", {
        description: error instanceof Error ? error.message : "Please try again.",
        action: {
          label: "Retry",
          onClick: () => form.handleSubmit(handleSubmit)(),
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {notificationGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {group.settings.map((setting) => (
                <FormField
                  key={setting.name}
                  control={form.control}
                  name={setting.name}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1 pr-4">
                        <FormLabel className="text-base">{setting.label}</FormLabel>
                        <FormDescription>{setting.description}</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </form>
    </Form>
  );
}
