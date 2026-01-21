import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";
import { useAuthStore } from "@/lib/stores/auth-store";

// Mock the modules
jest.mock("@/lib/stores/auth-store");

describe("LoginPage", () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();
  const mockPush = jest.fn();
  const mockGetState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      register: jest.fn(),
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });

    // Mock getState for redirect logic
    (useAuthStore as unknown as { getState: jest.Mock }).getState = mockGetState;

    const router = require("next/navigation");
    router.useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it("renders login form with all required fields", () => {
    render(<LoginPage />);

    expect(screen.getByText("Dive Back In")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("redirects creator with completed onboarding to creator dashboard", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    mockGetState.mockReturnValue({
      user: {
        id: "1",
        email: "creator@example.com",
        user_type: "creator",
        isVerified: true,
        profile: {
          name: "Test Creator",
          bio: "Test bio",
          categories: ["Technology", "Design"],
        },
      },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Fill in the form with test data
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "TestPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "TestPass123!",
        rememberMe: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error message when login fails", () => {
    const errorMessage = "Invalid credentials";

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      register: jest.fn(),
      isLoading: false,
      error: errorMessage,
      clearError: mockClearError,
    });

    render(<LoginPage />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("shows loading state when submitting", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      register: jest.fn(),
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: /Signing in/ });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = screen.getByLabelText("Show password");

    // Initially password should be hidden
    expect(passwordInput.type).toBe("password");

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput.type).toBe("text");
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument();

    // Click to hide password again
    await user.click(screen.getByLabelText("Hide password"));
    expect(passwordInput.type).toBe("password");
  });

  it("displays error from auth store", () => {
    const errorMessage = "Invalid credentials";

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
      register: jest.fn(),
      isLoading: false,
      error: errorMessage,
      clearError: mockClearError,
    });

    render(<LoginPage />);

    // Error should be displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("links to registration page", () => {
    render(<LoginPage />);

    const signUpLink = screen.getByRole("link", { name: "Sign up" });
    expect(signUpLink).toHaveAttribute("href", "/register/subscriber");
  });

  it("links to forgot password page", () => {
    render(<LoginPage />);

    const forgotPasswordLink = screen.getByRole("link", { name: "Forgot password?" });
    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
  });

  it("handles login submission error gracefully", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Network error"));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "TestPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      // Router push should not be called on error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
