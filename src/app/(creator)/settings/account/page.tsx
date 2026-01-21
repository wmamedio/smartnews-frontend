"use client";

import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { EmailUpdateForm } from "@/components/settings/EmailUpdateForm";
import { AccountDeletion } from "@/components/settings/AccountDeletion";
import { accountService } from "@/lib/services/account-service";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { PasswordChangeInput, EmailUpdateInput } from "@/lib/schemas/settings";

export default function AccountSettingsPage() {
  const { user, logout } = useAuthStore();

  const handlePasswordChange = async (data: PasswordChangeInput) => {
    await accountService.changePassword(data);
  };

  const handleEmailUpdate = async (data: EmailUpdateInput) => {
    await accountService.updateEmail(data);
  };

  const handleAccountDeletion = async (password: string) => {
    await accountService.deleteAccount(password);
    // Logout after account deletion
    await logout();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your password, email, and security settings
        </p>
      </div>

      {/* Password Change */}
      <PasswordChangeForm onSubmit={handlePasswordChange} />

      {/* Email Update */}
      <EmailUpdateForm currentEmail={user?.email || ""} onSubmit={handleEmailUpdate} />

      {/* Account Deletion */}
      <AccountDeletion onDelete={handleAccountDeletion} />
    </div>
  );
}
