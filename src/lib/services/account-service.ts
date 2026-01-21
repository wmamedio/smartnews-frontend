import axios from "axios";
import type { PasswordChangeInput, EmailUpdateInput } from "@/lib/schemas/settings";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://50.116.23.104:8000";

export const accountService = {
  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeInput) {
    const response = await axios.post(
      `${API_BASE_URL}/auth/change-password`,
      {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  /**
   * Update user email
   */
  async updateEmail(data: EmailUpdateInput) {
    const response = await axios.post(
      `${API_BASE_URL}/auth/update-email`,
      {
        new_email: data.newEmail,
        password: data.password,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  },

  /**
   * Delete user account
   */
  async deleteAccount(password: string) {
    const response = await axios.delete(`${API_BASE_URL}/auth/account`, {
      data: { password },
      withCredentials: true,
    });
    return response.data;
  },
};
