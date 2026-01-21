import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailUpdateForm } from "../EmailUpdateForm";
import { toast } from "sonner";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("EmailUpdateForm", () => {
  const mockOnSubmit = jest.fn();
  const currentEmail = "current@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders current email address", () => {
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Current Email")).toBeInTheDocument();
      expect(screen.getByText(currentEmail)).toBeInTheDocument();
    });

    it("renders in collapsed state initially", () => {
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("button", { name: "Change Email" })).toBeInTheDocument();
      // Form fields should not be visible
      expect(screen.queryByLabelText(/New Email Address/i)).not.toBeInTheDocument();
    });

    it("renders settings card with title and description", () => {
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(
        screen.getByText("Update your email address for account notifications")
      ).toBeInTheDocument();
    });
  });

  describe("Form Expansion", () => {
    it("expands form when button is clicked", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      const expandButton = screen.getByRole("button", { name: "Change Email" });
      await user.click(expandButton);

      // Form fields should now be visible
      expect(screen.getByLabelText(/New Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Verify Password/i)).toBeInTheDocument();
    });

    it("shows cancel and submit buttons when expanded", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Update Email" })).toBeInTheDocument();
    });

    it("shows security description for password field", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      expect(screen.getByText("Required for security")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows error when new email is invalid", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      // Use an email format that definitely fails validation
      await user.type(newEmailInput, "not an email");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: /Update Email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      });
    });

    it("shows error when password is empty", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      await user.type(newEmailInput, "newemail@example.com");

      const submitButton = screen.getByRole("button", { name: /Update Email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password is required for security/i)).toBeInTheDocument();
      });
    });

    it("validates email format correctly", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const invalidEmails = ["notanemail", "@example.com", "test@", "test@.com"];

      for (const email of invalidEmails) {
        await user.clear(newEmailInput);
        await user.type(newEmailInput, email);
        await user.click(screen.getByRole("button", { name: /Update Email/i }));

        await waitFor(() => {
          expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          newEmail: "newemail@example.com",
          password: "Password123!",
        });
      });
    });

    it("shows success toast on successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Email update requested!",
          expect.objectContaining({
            description: "Please check your inbox to verify your new email address.",
          })
        );
      });
    });

    it("resets form after successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/Verify Password/i) as HTMLInputElement;

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(newEmailInput.value).toBe("");
        expect(passwordInput.value).toBe("");
      });
    });

    it("shows error toast on submission failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Password is incorrect";
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "WrongPassword!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to update email",
          expect.objectContaining({
            description: errorMessage,
          })
        );
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      // Check for loading spinner and disabled state
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("collapses form and resets fields when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "newemail@example.com");
      await user.type(passwordInput, "Password123!");

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      // Form should collapse
      expect(screen.queryByLabelText(/New Email Address/i)).not.toBeInTheDocument();
      // Expand button should be visible again
      expect(screen.getByRole("button", { name: "Change Email" })).toBeInTheDocument();
    });

    it("clears form data when canceled", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      // Expand and fill form
      await user.click(screen.getByRole("button", { name: "Change Email" }));
      await user.type(screen.getByLabelText(/New Email Address/i), "newemail@example.com");
      await user.type(screen.getByLabelText(/Verify Password/i), "Password123!");

      // Cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Expand again - fields should be empty
      await user.click(screen.getByRole("button", { name: "Change Email" }));
      const newEmailInput = screen.getByLabelText(/New Email Address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/Verify Password/i) as HTMLInputElement;

      expect(newEmailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("has proper autocomplete attributes", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      expect(newEmailInput).toHaveAttribute("autocomplete", "email");
      expect(newEmailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("marks required fields with asterisk", async () => {
      const user = userEvent.setup();
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      // Check for asterisks in labels
      expect(screen.getByText(/New Email Address/i).textContent).toContain("*");
      expect(screen.getByText(/Verify Password/i).textContent).toContain("*");
    });

    it("displays current email in accessible format", () => {
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      const currentEmailLabel = screen.getByText("Current Email");
      const currentEmailValue = screen.getByText(currentEmail);

      expect(currentEmailLabel).toBeInTheDocument();
      expect(currentEmailValue).toBeInTheDocument();
    });
  });

  describe("Email Validation Edge Cases", () => {
    it("accepts valid email with subdomain", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "user@mail.example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("accepts valid email with plus sign", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<EmailUpdateForm currentEmail={currentEmail} onSubmit={mockOnSubmit} />);

      await user.click(screen.getByRole("button", { name: "Change Email" }));

      const newEmailInput = screen.getByLabelText(/New Email Address/i);
      const passwordInput = screen.getByLabelText(/Verify Password/i);

      await user.type(newEmailInput, "user+tag@example.com");
      await user.type(passwordInput, "Password123!");

      const submitButton = screen.getByRole("button", { name: "Update Email" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });
});
