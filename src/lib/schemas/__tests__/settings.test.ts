import {
  passwordChangeSchema,
  emailUpdateSchema,
  accountDeletionSchema,
  notificationPreferencesSchema,
  privacySettingsSchema,
  calculatePasswordStrength,
} from "../settings";

describe("Settings Schemas", () => {
  describe("passwordChangeSchema", () => {
    it("validates correct password change data", () => {
      const validData = {
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
        confirmPassword: "NewPass123!",
      };

      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects when current password is empty", () => {
      const invalidData = {
        currentPassword: "",
        newPassword: "NewPass123!",
        confirmPassword: "NewPass123!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Current password is required");
      }
    });

    it("rejects new password shorter than 8 characters", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "Short1!",
        confirmPassword: "Short1!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 8 characters");
      }
    });

    it("rejects new password without uppercase letter", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "newpass123!",
        confirmPassword: "newpass123!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("uppercase letter");
      }
    });

    it("rejects new password without lowercase letter", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "NEWPASS123!",
        confirmPassword: "NEWPASS123!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("lowercase letter");
      }
    });

    it("rejects new password without number", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "NewPassword!",
        confirmPassword: "NewPassword!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("number");
      }
    });

    it("rejects new password without special character", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("special character");
      }
    });

    it("rejects when passwords don't match", () => {
      const invalidData = {
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
        confirmPassword: "DifferentPass123!",
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("don't match");
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });
  });

  describe("emailUpdateSchema", () => {
    it("validates correct email update data", () => {
      const validData = {
        newEmail: "newemail@example.com",
        password: "SecurePass123!",
      };

      const result = emailUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const invalidData = {
        newEmail: "invalid-email",
        password: "SecurePass123!",
      };

      const result = emailUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid email");
      }
    });

    it("rejects when password is empty", () => {
      const invalidData = {
        newEmail: "newemail@example.com",
        password: "",
      };

      const result = emailUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Password is required");
      }
    });
  });

  describe("accountDeletionSchema", () => {
    it("validates correct account deletion data", () => {
      const validData = {
        confirmText: "DELETE",
        password: "SecurePass123!",
      };

      const result = accountDeletionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects when confirmText is not 'DELETE'", () => {
      const invalidData = {
        confirmText: "delete", // lowercase
        password: "SecurePass123!",
      };

      const result = accountDeletionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('type "DELETE"');
      }
    });

    it("rejects when confirmText is empty", () => {
      const invalidData = {
        confirmText: "",
        password: "SecurePass123!",
      };

      const result = accountDeletionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects when password is empty", () => {
      const invalidData = {
        confirmText: "DELETE",
        password: "",
      };

      const result = accountDeletionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Password is required");
      }
    });
  });

  describe("notificationPreferencesSchema", () => {
    it("validates with all default values", () => {
      const validData = {
        email_new_subscriber: true,
        email_revenue_milestone: true,
        email_content_published: true,
        email_weekly_digest: true,
        push_enabled: false,
        marketing_emails: false,
      };

      const result = notificationPreferencesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("validates with custom boolean values", () => {
      const customData = {
        email_new_subscriber: false,
        email_revenue_milestone: false,
        email_content_published: true,
        email_weekly_digest: false,
        push_enabled: true,
        marketing_emails: true,
      };

      const result = notificationPreferencesSchema.safeParse(customData);
      expect(result.success).toBe(true);
    });

    it("applies default values when not provided", () => {
      const result = notificationPreferencesSchema.parse({});
      expect(result.email_new_subscriber).toBe(true);
      expect(result.email_revenue_milestone).toBe(true);
      expect(result.email_content_published).toBe(true);
      expect(result.email_weekly_digest).toBe(true);
      expect(result.push_enabled).toBe(false);
      expect(result.marketing_emails).toBe(false);
    });
  });

  describe("privacySettingsSchema", () => {
    it("validates correct privacy settings", () => {
      const validData = {
        profile_visibility: "public" as const,
        show_subscriber_count: true,
        show_revenue_stats: false,
      };

      const result = privacySettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("validates private profile visibility", () => {
      const validData = {
        profile_visibility: "private" as const,
        show_subscriber_count: false,
        show_revenue_stats: false,
      };

      const result = privacySettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid profile_visibility value", () => {
      const invalidData = {
        profile_visibility: "invalid",
        show_subscriber_count: true,
        show_revenue_stats: false,
      };

      const result = privacySettingsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("applies default values when not provided", () => {
      const result = privacySettingsSchema.parse({});
      expect(result.profile_visibility).toBe("public");
      expect(result.show_subscriber_count).toBe(true);
      expect(result.show_revenue_stats).toBe(false);
    });
  });

  describe("calculatePasswordStrength", () => {
    it("returns weak for empty password", () => {
      const result = calculatePasswordStrength("");
      expect(result.level).toBe("weak");
      expect(result.label).toBe("Weak");
      expect(result.score).toBe(0);
    });

    it("returns weak for short simple password", () => {
      const result = calculatePasswordStrength("pass");
      expect(result.level).toBe("weak");
      expect(result.score).toBeLessThanOrEqual(3);
    });

    it("returns medium for password with mixed characters", () => {
      const result = calculatePasswordStrength("Pass1234");
      // Pass1234 scores: length>=8 (1), lowercase (1), uppercase (1), number (1) = 4 points = medium
      expect(result.level).toBe("medium");
      expect(result.score).toBeGreaterThan(3);
      expect(result.score).toBeLessThanOrEqual(5);
    });

    it("returns strong for long password with all character types", () => {
      const result = calculatePasswordStrength("VerySecure123!@#");
      expect(result.level).toBe("strong");
      expect(result.label).toBe("Strong");
      expect(result.score).toBeGreaterThan(5);
    });

    it("gives higher score for longer passwords", () => {
      const short = calculatePasswordStrength("Pass1!");
      const medium = calculatePasswordStrength("Password123!");
      const long = calculatePasswordStrength("VeryLongPassword123!");

      expect(long.score).toBeGreaterThan(medium.score);
      expect(medium.score).toBeGreaterThan(short.score);
    });

    it("gives higher score for passwords with all character types", () => {
      const noSpecial = calculatePasswordStrength("Password123");
      const withSpecial = calculatePasswordStrength("Password123!");

      expect(withSpecial.score).toBeGreaterThan(noSpecial.score);
    });

    it("correctly identifies weak passwords", () => {
      const weakPasswords = ["password", "12345678", "abcdefgh"];
      weakPasswords.forEach((pwd) => {
        const result = calculatePasswordStrength(pwd);
        expect(result.level).toBe("weak");
      });
    });

    it("correctly identifies medium passwords", () => {
      const mediumPasswords = ["Password1", "Pass123!", "Abc12345"];
      mediumPasswords.forEach((pwd) => {
        const result = calculatePasswordStrength(pwd);
        expect(result.level).toBe("medium");
      });
    });

    it("correctly identifies strong passwords", () => {
      const strongPasswords = [
        "VerySecurePassword123!",
        "MyStr0ng!P@ssw0rd",
        "C0mpl3x!P@ssW0rd#2024",
      ];
      strongPasswords.forEach((pwd) => {
        const result = calculatePasswordStrength(pwd);
        expect(result.level).toBe("strong");
      });
    });
  });
});
