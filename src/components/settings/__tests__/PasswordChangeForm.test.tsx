import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordChangeForm } from "../PasswordChangeForm";
import { toast } from "sonner";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("PasswordChangeForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders in collapsed state initially", () => {
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
      // Form fields should not be visible
      expect(screen.queryByLabelText(/Current Password/i)).not.toBeInTheDocument();
    });

    it("renders settings card with title and description", () => {
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument();
      expect(
        screen.getByText("Ensure your account is using a strong password")
      ).toBeInTheDocument();
    });
  });

  describe("Form Expansion", () => {
    it("expands form when button is clicked", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      const expandButton = screen.getByRole("button", { name: "Change Password" });
      await user.click(expandButton);

      // Form fields should now be visible
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });

    it("shows cancel and submit buttons when expanded", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Change Password/i })).toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggles", () => {
    it("toggles current password visibility", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole("button", { name: /Show password|Hide password/i });
      const currentPasswordToggle = toggleButtons[0];

      // Initially hidden
      expect(currentPasswordInput.type).toBe("password");

      // Click to show
      await user.click(currentPasswordToggle);
      expect(currentPasswordInput.type).toBe("text");

      // Click to hide again
      await user.click(currentPasswordToggle);
      expect(currentPasswordInput.type).toBe("password");
    });

    it("toggles new password visibility independently", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const newPasswordInput = screen.getByLabelText(/^New Password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole("button", { name: /Show password|Hide password/i });
      const newPasswordToggle = toggleButtons[1];

      expect(newPasswordInput.type).toBe("password");
      await user.click(newPasswordToggle);
      expect(newPasswordInput.type).toBe("text");
    });

    it("toggles confirm password visibility independently", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password/i
      ) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole("button", { name: /Show password|Hide password/i });
      const confirmPasswordToggle = toggleButtons[2];

      expect(confirmPasswordInput.type).toBe("password");
      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput.type).toBe("text");
    });
  });

  describe("Password Strength Indicator", () => {
    it("does not show strength indicator when new password is empty", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      expect(screen.queryByText(/Password Strength:/i)).not.toBeInTheDocument();
    });

    it("shows weak strength for simple password", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      await user.type(newPasswordInput, "password");

      await waitFor(() => {
        expect(screen.getByText(/Password Strength:/i)).toBeInTheDocument();
        expect(screen.getByText(/Weak/i)).toBeInTheDocument();
      });
    });

    it("shows medium strength for moderately complex password", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      await user.type(newPasswordInput, "Password123");

      await waitFor(() => {
        expect(screen.getByText(/Password Strength:/i)).toBeInTheDocument();
        expect(screen.getByText(/Medium/i)).toBeInTheDocument();
      });
    });

    it("shows strong strength for complex password", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      await user.type(newPasswordInput, "VerySecurePassword123!");

      await waitFor(() => {
        const strengthText = screen.getByText(/Password Strength:/i);
        expect(strengthText).toBeInTheDocument();
        // Check that "Strong" appears in the same container as "Password Strength:"
        expect(strengthText.textContent).toMatch(/Strong/i);
      });
    });
  });

  describe("Form Validation", () => {
    it("shows error when current password is empty", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Current password is required/i)).toBeInTheDocument();
      });
    });

    it("shows error when new password is too short", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "Short1!");
      await user.type(confirmPasswordInput, "Short1!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("shows error when passwords don't match", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "DifferentPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/don't match/i)).toBeInTheDocument();
      });
    });

    it("shows error when new password doesn't meet complexity requirements", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "password123"); // missing uppercase and special char
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.queryAllByText(/Must contain/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "NewPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          currentPassword: "OldPass123!",
          newPassword: "NewPass123!",
          confirmPassword: "NewPass123!",
        });
      });
    });

    it("shows success toast on successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "NewPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Password changed successfully!",
          expect.objectContaining({
            description: "You can now use your new password to log in.",
          })
        );
      });
    });

    it("resets form after successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText(/^New Password/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(
        /Confirm New Password/i
      ) as HTMLInputElement;

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "NewPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(currentPasswordInput.value).toBe("");
        expect(newPasswordInput.value).toBe("");
        expect(confirmPasswordInput.value).toBe("");
      });
    });

    it("shows error toast on submission failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Current password is incorrect";
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "WrongPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "NewPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to change password",
          expect.objectContaining({
            description: errorMessage,
          })
        );
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");
      await user.type(confirmPasswordInput, "NewPass123!");

      const submitButton = screen.getByRole("button", { name: /Change Password/i });
      await user.click(submitButton);

      // Check for loading spinner
      expect(screen.getByRole("button", { name: /Change Password/i })).toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("collapses form and resets fields when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);

      await user.type(currentPasswordInput, "OldPass123!");
      await user.type(newPasswordInput, "NewPass123!");

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      // Form should collapse
      expect(screen.queryByLabelText(/Current Password/i)).not.toBeInTheDocument();
      // Expand button should be visible again
      expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
    });

    it("clears form data when canceled", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      // Expand and fill form
      await user.click(screen.getByRole("button", { name: "Change Password" }));
      await user.type(screen.getByLabelText(/Current Password/i), "OldPass123!");
      await user.type(screen.getByLabelText(/^New Password/i), "NewPass123!");

      // Cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Expand again - fields should be empty
      await user.click(screen.getByRole("button", { name: "Change Password" }));
      const currentPasswordInput = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText(/^New Password/i) as HTMLInputElement;

      expect(currentPasswordInput.value).toBe("");
      expect(newPasswordInput.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("has proper autocomplete attributes", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      const newPasswordInput = screen.getByLabelText(/^New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

      expect(currentPasswordInput).toHaveAttribute("autocomplete", "current-password");
      expect(newPasswordInput).toHaveAttribute("autocomplete", "new-password");
      expect(confirmPasswordInput).toHaveAttribute("autocomplete", "new-password");
    });

    it("marks required fields with asterisk", async () => {
      const user = userEvent.setup();
      render(<PasswordChangeForm onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Password" }));

      // Check for asterisks in labels (using text content)
      expect(screen.getByText(/Current Password/i).textContent).toContain("*");
      expect(screen.getByText(/^New Password/i).textContent).toContain("*");
      expect(screen.getByText(/Confirm New Password/i).textContent).toContain("*");
    });
  });
});
