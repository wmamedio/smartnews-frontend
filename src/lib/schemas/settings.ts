import { z } from "zod";

// Password change schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// Email update schema
export const emailUpdateSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required for security"),
});

export type EmailUpdateInput = z.infer<typeof emailUpdateSchema>;

// Account deletion schema
export const accountDeletionSchema = z.object({
  confirmText: z.string().refine((val) => val === "DELETE", {
    message: 'Please type "DELETE" to confirm',
  }),
  password: z.string().min(1, "Password is required"),
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email_new_subscriber: z.boolean().default(true),
  email_revenue_milestone: z.boolean().default(true),
  email_content_published: z.boolean().default(true),
  email_weekly_digest: z.boolean().default(true),
  push_enabled: z.boolean().default(false),
  marketing_emails: z.boolean().default(false),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// Privacy settings schema
export const privacySettingsSchema = z.object({
  profile_visibility: z.enum(["public", "private"]).default("public"),
  show_subscriber_count: z.boolean().default(true),
  show_revenue_stats: z.boolean().default(false),
});

export type PrivacySettings = z.infer<typeof privacySettingsSchema>;

// Password strength calculator
export type PasswordStrength = {
  level: "weak" | "medium" | "strong";
  label: string;
  score: number;
};

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (!password) {
    return { level: "weak", label: "Weak", score: 0 };
  }

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Determine strength level
  if (score <= 3) {
    return { level: "weak", label: "Weak", score };
  } else if (score <= 5) {
    return { level: "medium", label: "Medium", score };
  } else {
    return { level: "strong", label: "Strong", score };
  }
}
