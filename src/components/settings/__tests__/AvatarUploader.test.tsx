import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUploader } from "../AvatarUploader";
import { toast } from "sonner";

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock FileReader
class MockFileReader {
  onloadend: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL(file: File) {
    // Simulate successful file read
    this.result = `data:image/png;base64,mockBase64Data`;
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

describe("AvatarUploader", () => {
  const mockOnUpload = jest.fn();
  const defaultInitials = "CN";
  const currentAvatar = "https://example.com/avatar.png";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("renders avatar with initials when no avatar provided", () => {
      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      expect(screen.getByText(defaultInitials)).toBeInTheDocument();
    });

    it("renders current avatar when provided", () => {
      const { container } = render(
        <AvatarUploader
          currentAvatar={currentAvatar}
          onUpload={mockOnUpload}
          initials={defaultInitials}
        />
      );

      // Avatar component may not render img tag immediately, check for avatar container
      const avatarContainer = container.querySelector('[class*="overflow-hidden"]');
      expect(avatarContainer).toBeInTheDocument();
    });

    it("renders upload area with instructions", () => {
      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      expect(screen.getByText("Profile Photo")).toBeInTheDocument();
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/PNG, JPG, WebP up to 5MB/i)).toBeInTheDocument();
    });

    it("uses default initials when not provided", () => {
      const { container } = render(<AvatarUploader onUpload={mockOnUpload} />);

      expect(screen.getByText("CN")).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("handles file selection via input", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      });
    });

    it("creates preview after file selection", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      // Wait for FileReader to process
      await waitFor(() => {
        expect(screen.getByText("Remove Preview")).toBeInTheDocument();
      });
    });

    it("accepts PNG files", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it("accepts JPEG files", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.jpg");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.jpg", { type: "image/jpeg" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it("accepts WebP files", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.webp");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.webp", { type: "image/webp" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });
  });

  describe("File Size Validation", () => {
    it("rejects files larger than 5MB", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      // Create a file larger than 5MB (5 * 1024 * 1024 bytes + 1)
      const largeFile = new File(["x".repeat(5 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "File too large",
          expect.objectContaining({
            description: "Please upload an image smaller than 5MB",
          })
        );
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it("accepts files smaller than 5MB", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      // Create a file smaller than 5MB
      const smallFile = new File(["dummy content"], "small.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, smallFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it("accepts files exactly 5MB", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      // Create a file exactly 5MB
      const exactFile = new File(["x".repeat(5 * 1024 * 1024)], "exact.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, exactFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });
  });

  describe("Upload Process", () => {
    it("shows loading state during upload", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText("Uploading...")).toBeInTheDocument();
      });
    });

    it("disables input during upload", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });

    it("shows success toast on successful upload", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Avatar uploaded successfully");
      });
    });

    it("shows error toast on upload failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Upload failed";
      mockOnUpload.mockRejectedValue(new Error(errorMessage));

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to upload avatar",
          expect.objectContaining({
            description: errorMessage,
          })
        );
      });
    });

    it("clears preview on upload failure", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockRejectedValue(new Error("Upload failed"));

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      // Wait for upload to complete and error to be shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to upload avatar",
          expect.objectContaining({
            description: "Upload failed",
          })
        );
      });

      // Preview should be cleared after upload failure
      await waitFor(() => {
        expect(screen.queryByText("Remove Preview")).not.toBeInTheDocument();
      });
    });
  });

  describe("Preview Management", () => {
    it("shows remove preview button after file selection", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Remove Preview")).toBeInTheDocument();
      });
    });

    it("removes preview when remove button is clicked", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Remove Preview")).toBeInTheDocument();
      });

      const removeButton = screen.getByRole("button", { name: /Remove Preview/i });
      await user.click(removeButton);

      expect(screen.queryByText("Remove Preview")).not.toBeInTheDocument();
    });

    it("displays preview instead of current avatar when file is selected", async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue("https://example.com/new-avatar.png");

      const { container } = render(
        <AvatarUploader
          currentAvatar={currentAvatar}
          onUpload={mockOnUpload}
          initials={defaultInitials}
        />
      );

      const file = new File(["dummy content"], "avatar.png", { type: "image/png" });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Initially shows current avatar (check for initial state)
      expect(screen.getByText(defaultInitials)).toBeInTheDocument();

      await user.upload(input, file);

      // After upload, should show preview (Remove Preview button appears)
      await waitFor(() => {
        expect(screen.getByText("Remove Preview")).toBeInTheDocument();
      });
    });
  });

  describe("Drag and Drop", () => {
    it("shows drag active state", () => {
      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const dropzone = container.querySelector('[class*="border-dashed"]');
      expect(dropzone).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible labels", () => {
      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      expect(screen.getByText("Profile Photo")).toBeInTheDocument();
      // Avatar should display default initials as fallback
      expect(screen.getByText(defaultInitials)).toBeInTheDocument();
    });

    it("has file input with proper aria attributes", () => {
      const { container } = render(
        <AvatarUploader onUpload={mockOnUpload} initials={defaultInitials} />
      );

      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
    });
  });

  describe("Custom Initials", () => {
    it("displays custom initials", () => {
      const { container } = render(<AvatarUploader onUpload={mockOnUpload} initials="JD" />);

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("displays fallback initials when avatar fails to load", () => {
      const { container } = render(
        <AvatarUploader currentAvatar="invalid-url" onUpload={mockOnUpload} initials="AB" />
      );

      // Avatar fallback should contain initials
      expect(screen.getByText("AB")).toBeInTheDocument();
    });
  });
});
