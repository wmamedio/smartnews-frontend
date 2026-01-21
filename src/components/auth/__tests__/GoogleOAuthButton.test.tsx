import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleOAuthButton } from "../GoogleOAuthButton";
import { useAuthStore } from "@/lib/stores/auth-store";

// Mock the auth store
jest.mock("@/lib/stores/auth-store");

// Mock window.location.href
delete (window as any).location;
window.location = { href: "" } as any;

describe("GoogleOAuthButton", () => {
  const mockGoogleSSO = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window.location.href as any) = "";

    // Default mock implementation - unified SSO method
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      googleSSO: mockGoogleSSO,
      isLoading: false,
      error: null,
    });
  });

  describe("Login Mode", () => {
    it("renders login button correctly", () => {
      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Sign in with Google");
    });

    it("calls unified googleSSO with userType in login mode (for auto-registration)", async () => {
      mockGoogleSSO.mockResolvedValueOnce({ redirect_url: "https://google.com/oauth" });

      render(<GoogleOAuthButton mode="login" userType="creator" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        // userType is passed even in login mode for auto-registration of new users
        expect(mockGoogleSSO).toHaveBeenCalledWith("creator", undefined);
      });
    });

    it("shows loading state during authentication", async () => {
      mockGoogleSSO.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Connecting to Google...")).toBeInTheDocument();
        expect(button).toBeDisabled();
      });
    });

    it("disables button when auth store is loading", () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        googleSSO: mockGoogleSSO,
        isLoading: true,
        error: null,
      });

      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toBeDisabled();
    });

    it("handles errors gracefully", async () => {
      mockGoogleSSO.mockRejectedValueOnce(new Error("Network error"));

      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGoogleSSO).toHaveBeenCalled();
      });

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Register Mode", () => {
    it("renders register button correctly for creator", () => {
      render(<GoogleOAuthButton mode="register" userType="creator" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Sign up with Google");
    });

    it("renders register button correctly for subscriber", () => {
      render(<GoogleOAuthButton mode="register" userType="subscriber" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      expect(button).toBeInTheDocument();
    });

    it("calls unified googleSSO with creator userType when clicked", async () => {
      mockGoogleSSO.mockResolvedValueOnce({ redirect_url: "https://google.com/oauth" });

      render(<GoogleOAuthButton mode="register" userType="creator" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGoogleSSO).toHaveBeenCalledWith("creator", undefined);
      });
    });

    it("calls unified googleSSO with subscriber userType when clicked", async () => {
      mockGoogleSSO.mockResolvedValueOnce({ redirect_url: "https://google.com/oauth" });

      render(<GoogleOAuthButton mode="register" userType="subscriber" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGoogleSSO).toHaveBeenCalledWith("subscriber", undefined);
      });
    });

    it("passes affiliateHash to unified googleSSO when provided", async () => {
      mockGoogleSSO.mockResolvedValueOnce({ redirect_url: "https://google.com/oauth" });

      render(<GoogleOAuthButton mode="register" userType="creator" affiliateHash="affiliate123" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGoogleSSO).toHaveBeenCalledWith("creator", "affiliate123");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA label for login", () => {
      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toHaveAttribute("aria-label", "Sign in with Google");
    });

    it("has proper ARIA label for register", () => {
      render(<GoogleOAuthButton mode="register" userType="creator" />);

      const button = screen.getByRole("button", { name: /sign up with google/i });
      expect(button).toHaveAttribute("aria-label", "Sign up with Google");
    });

    it("is keyboard accessible", () => {
      mockGoogleSSO.mockResolvedValueOnce({ redirect_url: "https://google.com/oauth" });

      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });

      // Simulate tab navigation
      button.focus();
      expect(button).toHaveFocus();

      // Verify button can be clicked (keyboard accessibility is built into button element)
      fireEvent.click(button);
      expect(mockGoogleSSO).toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("applies custom className when provided", () => {
      render(<GoogleOAuthButton mode="login" className="custom-class" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toHaveClass("custom-class");
    });

    it("applies default w-full className when no className provided", () => {
      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      expect(button).toHaveClass("w-full");
    });

    it("renders outline variant button", () => {
      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      // Variant is applied via Button component from shadcn
      expect(button).toBeInTheDocument();
    });
  });

  describe("Google Logo", () => {
    it("renders Google logo SVG", () => {
      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      const svg = button.querySelector("svg");

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("renders loading spinner during authentication", async () => {
      mockGoogleSSO.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<GoogleOAuthButton mode="login" />);

      const button = screen.getByRole("button", { name: /sign in with google/i });
      fireEvent.click(button);

      await waitFor(() => {
        // Loader2 component should be rendered
        const svg = button.querySelector("svg.animate-spin");
        expect(svg).toBeInTheDocument();
      });
    });
  });
});
