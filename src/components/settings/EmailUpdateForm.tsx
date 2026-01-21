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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { emailUpdateSchema, type EmailUpdateInput } from "@/lib/schemas/settings";
import { SettingsCard } from "./SettingsCard";
import { toast } from "sonner";

interface EmailUpdateFormProps {
  currentEmail: string;
  onSubmit: (data: EmailUpdateInput) => Promise<void>;
}

export function EmailUpdateForm({ currentEmail, onSubmit }: EmailUpdateFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmailUpdateInput>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  const handleSubmit = async (data: EmailUpdateInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Email update requested!", {
        description: "Please check your inbox to verify your new email address.",
      });
      form.reset();
    } catch (error) {
      console.error("Email update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update email";
      toast.error("Failed to update email", {
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

  return (
    <SettingsCard
      title="Email Address"
      description="Update your email address for account notifications"
    >
      <div className="space-y-4">
        {/* Current Email Display */}
        <div className="rounded-lg bg-muted/20 p-4 border">
          <Label className="text-xs text-muted-foreground">Current Email</Label>
          <p className="font-medium">{currentEmail}</p>
        </div>

        {/* Update Form */}
        {!isExpanded ? (
          <Button onClick={() => setIsExpanded(true)} className="w-48">
            Change Email
          </Button>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-4">
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      New Email Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Verify Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="current-password" />
                    </FormControl>
                    <FormDescription>Required for security</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsExpanded(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Email
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </SettingsCard>
  );
}
