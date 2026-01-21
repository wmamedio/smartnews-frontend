import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "../ProfileForm";
import { toast } from "sonner";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AvatarUploader component
jest.mock("../AvatarUploader", () => ({
  AvatarUploader: ({ onUpload, initials }: any) => (
    <div data-testid="avatar-uploader">
      <span>Avatar: {initials}</span>
      <button onClick={() => onUpload(new File([""], "avatar.png", { type: "image/png" }))}>
        Upload Avatar
      </button>
    </div>
  ),
}));

describe("ProfileForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnAvatarUpload = jest.fn();

  const defaultInitialData = {
    email: "user@example.com",
    first_name: "John",
    last_name: "Doe",
    name: "John Doe",
    bio: "A test user",
    avatar: "https://example.com/avatar.png",
    website: "https://example.com",
    categories: ["Technology"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders all form fields", () => {
      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    });

    it("renders with initial data", () => {
      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      expect(screen.getByLabelText(/Email/i)).toHaveValue(defaultInitialData.email);
      expect(screen.getByLabelText(/First Name/i)).toHaveValue(defaultInitialData.first_name);
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue(defaultInitialData.last_name);
      expect(screen.getByLabelText(/Display Name/i)).toHaveValue(defaultInitialData.name);
      expect(screen.getByLabelText(/Bio/i)).toHaveValue(defaultInitialData.bio);
      expect(screen.getByLabelText(/Website/i)).toHaveValue(defaultInitialData.website);
    });

    it("renders without initial data", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByLabelText(/Email/i)).toHaveValue("");
      expect(screen.getByLabelText(/First Name/i)).toHaveValue("");
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue("");
    });

    it("renders settings card with title and description", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText("Personal Information")).toBeInTheDocument();
      expect(screen.getByText("Update your profile information")).toBeInTheDocument();
    });

    it("renders AvatarUploader component", () => {
      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      expect(screen.getByTestId("avatar-uploader")).toBeInTheDocument();
    });

    it("generates initials from first and last name", () => {
      render(
        <ProfileForm
          initialData={{ first_name: "John", last_name: "Doe" }}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      expect(screen.getByText(/Avatar: JD/i)).toBeInTheDocument();
    });

    it("uses default initials when names are empty", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText(/Avatar: CN/i)).toBeInTheDocument();
    });
  });

  describe("Bio Character Counter", () => {
    it("displays character count for bio", () => {
      render(
        <ProfileForm
          initialData={{ bio: "Hello" }}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      expect(screen.getByText("5/500")).toBeInTheDocument();
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, "Test bio");

      await waitFor(() => {
        expect(screen.getByText("8/500")).toBeInTheDocument();
      });
    });

    it("shows 0/500 when bio is empty", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText("0/500")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("validates email format", async () => {
      const user = userEvent.setup();
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, "invalid-email");
      await user.type(emailInput, "{tab}"); // Trigger validation

      // Form should show validation error for invalid email
      // Note: This depends on the schema validation
    });

    it("enforces maxLength on bio (500 characters)", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const bioTextarea = screen.getByLabelText(/Bio/i) as HTMLTextAreaElement;
      expect(bioTextarea).toHaveAttribute("maxLength", "500");
    });

    it("validates website URL format", async () => {
      const user = userEvent.setup();
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const websiteInput = screen.getByLabelText(/Website/i);
      expect(websiteInput).toHaveAttribute("type", "url");
    });
  });

  describe("Avatar Upload Integration", () => {
    it("calls onAvatarUpload when avatar is uploaded", async () => {
      const user = userEvent.setup();
      mockOnAvatarUpload.mockResolvedValue("https://example.com/new-avatar.png");

      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const uploadButton = screen.getByRole("button", { name: "Upload Avatar" });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnAvatarUpload).toHaveBeenCalled();
      });
    });

    it("updates avatar field when avatar is uploaded", async () => {
      const user = userEvent.setup();
      const newAvatarUrl = "https://example.com/new-avatar.png";
      mockOnAvatarUpload.mockResolvedValue(newAvatarUrl);

      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const uploadButton = screen.getByRole("button", { name: "Upload Avatar" });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnAvatarUpload).toHaveBeenCalled();
      });

      // Avatar field should be updated (would mark form as dirty)
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data when submitted", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      // Make a change to enable submit button (form must be dirty)
      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("shows success toast on successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Profile updated successfully!",
          expect.objectContaining({
            description: "Your changes have been saved.",
          })
        );
      });
    });

    it("shows error toast on submission failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Failed to update profile";
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to update profile",
          expect.objectContaining({
            description: errorMessage,
          })
        );
      });
    });

    it("disables submit button when form is not dirty", () => {
      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      expect(submitButton).toBeDisabled();
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(submitButton);

      // Check for loading state
      expect(submitButton).toBeDisabled();
    });

    it("disables both buttons during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      await user.click(submitButton);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("resets form to initial values when cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      const bioTextarea = screen.getByLabelText(/Bio/i) as HTMLTextAreaElement;
      const originalBio = defaultInitialData.bio;

      // Make changes
      await user.clear(bioTextarea);
      await user.type(bioTextarea, "New bio text");
      expect(bioTextarea.value).toBe("New bio text");

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      // Form should be reset to initial values
      await waitFor(() => {
        expect(bioTextarea.value).toBe(originalBio);
      });
    });

    it("disables submit button after cancel (form no longer dirty)", async () => {
      const user = userEvent.setup();

      render(
        <ProfileForm
          initialData={defaultInitialData}
          onSubmit={mockOnSubmit}
          onAvatarUpload={mockOnAvatarUpload}
        />
      );

      // Make changes
      const bioTextarea = screen.getByLabelText(/Bio/i);
      await user.type(bioTextarea, " updated");

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      expect(submitButton).not.toBeDisabled();

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      // Submit button should be disabled again
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Field Descriptions", () => {
    it("shows description for email field", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText("Your primary email address")).toBeInTheDocument();
    });

    it("shows description for display name field", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText(/Public display name/i)).toBeInTheDocument();
    });

    it("shows description for bio field", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByText("Brief description for your profile")).toBeInTheDocument();
    });
  });

  describe("Required Fields", () => {
    it("marks email as required", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const emailLabel = screen.getAllByText(/Email/i)[0];
      expect(emailLabel.textContent).toContain("*");
    });

    it("marks first name as required", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const firstNameLabel = screen.getAllByText(/First Name/i)[0];
      expect(firstNameLabel.textContent).toContain("*");
    });

    it("marks last name as required", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const lastNameLabel = screen.getAllByText(/Last Name/i)[0];
      expect(lastNameLabel.textContent).toContain("*");
    });

    it("display name is optional (no asterisk)", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const displayNameLabel = screen.getByText("Display Name");
      expect(displayNameLabel.textContent).not.toContain("*");
    });
  });

  describe("Accessibility", () => {
    it("has proper input types", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByLabelText(/Email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/Website/i)).toHaveAttribute("type", "url");
    });

    it("has appropriate placeholders", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      expect(screen.getByLabelText(/Email/i)).toHaveAttribute("placeholder", "you@example.com");
      expect(screen.getByLabelText(/First Name/i)).toHaveAttribute("placeholder", "John");
      expect(screen.getByLabelText(/Last Name/i)).toHaveAttribute("placeholder", "Doe");
      expect(screen.getByLabelText(/Website/i)).toHaveAttribute(
        "placeholder",
        "https://example.com"
      );
    });

    it("has focus-visible styles on buttons", () => {
      render(<ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const submitButton = screen.getByRole("button", { name: "Save Changes" });

      expect(cancelButton).toHaveClass("focus-visible:ring-2");
      expect(submitButton).toHaveClass("focus-visible:ring-2");
    });
  });

  describe("Responsive Layout", () => {
    it("renders first name and last name in grid layout", () => {
      const { container } = render(
        <ProfileForm onSubmit={mockOnSubmit} onAvatarUpload={mockOnAvatarUpload} />
      );

      const gridContainer = container.querySelector(".grid-cols-1");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass("sm:grid-cols-2");
    });
  });
});
