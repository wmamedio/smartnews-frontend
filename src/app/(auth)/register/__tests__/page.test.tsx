import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../creator/page";
import { useAuthStore } from "@/lib/stores/auth-store";

// Mock the modules
jest.mock("@/lib/stores/auth-store");

describe("RegisterPage", () => {
  const mockRegister = jest.fn();
  const mockClearError = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });

    const nav = require("next/navigation");
    nav.useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
    nav.useSearchParams.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
    }));
  });

  it("renders registration form with all required fields", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Create a Creator Account")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Creator Account" })).toBeInTheDocument();
  });

  it("submits form with valid data for creator", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service/ });
    const submitButton = screen.getByRole("button", { name: "Create Creator Account" });

    // Fill in the form
    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "SecurePass123!");
    await user.type(confirmPasswordInput, "SecurePass123!");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockRegister).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        user_type: "creator",
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("validates password confirmation match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service/ });
    const submitButton = screen.getByRole("button", { name: "Create Creator Account" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "SecurePass123!");
    await user.type(confirmPasswordInput, "DifferentPass123!");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it("shows password strength indicator", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText("Password");

    // Type weak password
    await user.type(passwordInput, "weak");
    expect(screen.getByText("Very Weak")).toBeInTheDocument();

    // Clear and type strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, "StrongP@ssw0rd123!");
    expect(screen.getByText("Very Strong")).toBeInTheDocument();
  });

  it("requires terms acceptance", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const submitButton = screen.getByRole("button", { name: "Create Creator Account" });

    // Fill form without accepting terms
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "SecurePass123!");
    await user.type(confirmPasswordInput, "SecurePass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("You must accept the terms and conditions")).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it("displays error message when registration fails", () => {
    const errorMessage = "Email already exists";

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: errorMessage,
      clearError: mockClearError,
    });

    render(<RegisterPage />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("shows loading state when submitting", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<RegisterPage />);

    const submitButton = screen.getByRole("button", { name: /Creating account/ });
    expect(submitButton).toBeDisabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const passwordContainer = passwordInput.closest("div");
    const toggleButton = passwordContainer!.querySelector(
      'button[aria-label*="password"]'
    ) as HTMLButtonElement;

    // Initially password should be hidden
    expect(passwordInput.type).toBe("password");

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });

  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const confirmPasswordInput = screen.getByLabelText("Confirm Password") as HTMLInputElement;
    const toggleButtons = screen.getAllByLabelText("Show password");
    const confirmToggle = toggleButtons[1]; // Second toggle is for confirm password

    // Initially password should be hidden
    expect(confirmPasswordInput.type).toBe("password");

    // Click to show password
    await user.click(confirmToggle);
    expect(confirmPasswordInput.type).toBe("text");
  });

  it("links to login page", () => {
    render(<RegisterPage />);

    const signInLink = screen.getByRole("link", { name: "Sign in" });
    expect(signInLink).toHaveAttribute("href", "/login/creator");
  });

  it("validates password requirements", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service/ });
    const submitButton = screen.getByRole("button", { name: "Create Creator Account" });

    // Test with weak password
    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "weak");
    await user.type(confirmPasswordInput, "weak");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  it("handles registration submission error gracefully", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error("Network error"));

    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /I agree to the Terms of Service/ });
    const submitButton = screen.getByRole("button", { name: "Create Creator Account" });

    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "SecurePass123!");
    await user.type(confirmPasswordInput, "SecurePass123!");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      // Router push should not be called on error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
