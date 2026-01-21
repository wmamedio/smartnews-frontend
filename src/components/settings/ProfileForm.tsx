"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { profileSetupSchema, type ProfileSetupInput } from "@/lib/schemas/profile";
import { AvatarUploader } from "./AvatarUploader";
import { SettingsCard } from "./SettingsCard";
import { toast } from "sonner";

interface ProfileFormProps {
  initialData?: Partial<ProfileSetupInput>;
  onSubmit: (data: ProfileSetupInput) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<string>;
}

export function ProfileForm({ initialData, onSubmit, onAvatarUpload }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      email: initialData?.email || "",
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      name:
        initialData?.name ||
        `${initialData?.first_name || ""} ${initialData?.last_name || ""}`.trim(),
      bio: initialData?.bio || "",
      avatar: initialData?.avatar || "",
      website: initialData?.website || "",
      categories: initialData?.categories || [],
    },
  });

  const handleSubmit = async (data: ProfileSetupInput) => {
    setIsSubmitting(true);
    try {
      // Auto-generate display name from first_name + last_name if not explicitly set
      const submissionData = {
        ...data,
        name: `${data.first_name} ${data.last_name}`.trim(),
      };

      await onSubmit(submissionData);
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved.",
      });
      form.reset(submissionData); // Reset form with new data to clear dirty state
    } catch (error: any) {
      console.error("🔴 Profile update error:", error);

      // Extract error message from axios error response
      let errorMessage = "Please try again";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 422) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Failed to update profile", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => form.handleSubmit(handleSubmit)(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
  };

  const handleAvatarUpload = async (file: File) => {
    const url = await onAvatarUpload(file);
    form.setValue("avatar", url, { shouldDirty: true });
    return url;
  };

  const bioLength = form.watch("bio")?.length || 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          toast.error("Validation failed", {
            description: Object.values(errors)
              .map((err) => err.message)
              .join(", "),
          });
        })}
        className="space-y-6"
      >
        <SettingsCard title="Personal Information" description="Update your profile information">
          <div className="space-y-6">
            {/* Avatar Upload */}
            <AvatarUploader
              currentAvatar={form.watch("avatar")}
              onUpload={handleAvatarUpload}
              initials={
                `${form.watch("first_name")?.[0] || ""}${form.watch("last_name")?.[0] || ""}`.toUpperCase() ||
                "CN"
              }
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="you@example.com" />
                  </FormControl>
                  <FormDescription>Your primary email address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* First Name & Last Name - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself..."
                      className="min-h-24 resize-none"
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>Brief description for your profile</FormDescription>
                    <span className="text-xs text-muted-foreground">{bioLength}/500</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsCard>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty || isSubmitting}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
