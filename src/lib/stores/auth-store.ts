import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: "creator" | "subscriber";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  isVerified?: boolean;
  profile?: {
    name?: string;
    bio?: string;
    avatar?: string;
    avatar_url?: string;
    categories?: string[];
  };
  avatar_url?: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface LoginDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  user_type: "creator" | "subscriber";
}

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  isHydrated: boolean; // True after Zustand has restored state from storage
  error: string | null;

  login: (credentials: LoginDTO) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;

  // Unified SSO OAuth methods
  googleSSO: (
    userType?: "creator" | "subscriber",
    affiliateHash?: string
  ) => Promise<{ redirect_url: string }>;
  handleGoogleCallback: (code: string, state: string) => Promise<void>;
}

// Direct backend API URL - CORS is properly configured on backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

// Check if current route is public and shouldn't redirect on auth failure
const isPublicRoute = (): boolean => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  const publicRoutes = [
    "/discover",
    "/creator/",
    "/feed/",
    "/",
    "/login",
    "/register",
    "/auth/google",
  ];
  return publicRoutes.some((route) => path.startsWith(route));
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      isHydrated: false,
      error: null,

      login: async (credentials: LoginDTO) => {
        set({ isLoading: true, error: null });
        try {
          // Try URL-encoded form data for FastAPI OAuth2 compatibility
          const params = new URLSearchParams();
          params.append("username", credentials.email);
          params.append("password", credentials.password);

          // Use direct backend API with credentials
          const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true,
          });

          // Check if login was successful
          if (response.status !== 200 || !response.data.access_token) {
            throw new Error("Invalid credentials");
          }

          const { access_token, refresh_token, user } = response.data;

          // Store tokens
          const tokens = { access: access_token, refresh: refresh_token };
          set({
            tokens,
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set cookies for httpOnly security (if backend supports it)
          if (credentials.rememberMe) {
            Cookies.set("access_token", access_token, {
              expires: 7,
              secure: true,
              sameSite: "strict",
            });
            Cookies.set("refresh_token", refresh_token, {
              expires: 7,
              secure: true,
              sameSite: "strict",
            });
          } else {
            Cookies.set("access_token", access_token, { secure: true, sameSite: "strict" });
            Cookies.set("refresh_token", refresh_token, { secure: true, sameSite: "strict" });
          }

          // Set default auth header
          axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        } catch (error: any) {
          let errorMessage = "Invalid email or password";

          if (error.response?.data?.detail) {
            if (typeof error.response.data.detail === "string") {
              errorMessage = error.response.data.detail;
            } else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail
                .map((err: any) => err.msg || err)
                .join(", ");
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterDTO) => {
        set({ isLoading: true, error: null });
        try {
          // Transform frontend data to backend format
          const backendPayload: Record<string, string | undefined> = {
            email: data.email,
            password: data.password,
            user_type: data.user_type,
          };

          // Only include name fields if provided (optional for subscribers)
          if (data.firstName) backendPayload.first_name = data.firstName;
          if (data.lastName) backendPayload.last_name = data.lastName;

          await axios.post(`${API_BASE_URL}/auth/register`, backendPayload, {
            withCredentials: true,
          });

          // Auto-login after successful registration
          await get().login({
            email: data.email,
            password: data.password,
          });
        } catch (error: any) {
          let errorMessage = "Registration failed";

          if (error.response?.data?.detail) {
            if (typeof error.response.data.detail === "string") {
              errorMessage = error.response.data.detail;
            } else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail
                .map((err: any) => err.msg || err)
                .join(", ");
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        // Set logging out state immediately to prevent UI flashing
        set({ isLoggingOut: true, isLoading: true });

        try {
          // Call logout endpoint first
          const token = get().tokens?.access || Cookies.get("access_token");
          if (token) {
            await axios.post(`${API_BASE_URL}/auth/logout`, null, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
              validateStatus: () => true, // Don't throw on any status
            });
          }
        } catch {
          // Silently fail logout API call
        } finally {
          // Clear tokens
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          delete axios.defaults.headers.common["Authorization"];

          // Clear state
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
            isLoggingOut: true, // Keep this true during redirect
          });

          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      },

      refreshToken: async () => {
        const refreshToken = get().tokens?.refresh || Cookies.get("refresh_token");

        if (!refreshToken) {
          // Clear state and redirect to login (unless on public page)
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
            isLoggingOut: isPublicRoute() ? false : true, // Set to prevent UI flashing only if redirecting
          });
          if (typeof window !== "undefined" && !isPublicRoute()) {
            window.location.href = "/login";
          }
          return;
        }

        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            },
            {
              withCredentials: true,
            }
          );

          const { access_token } = response.data;

          set((state) => ({
            tokens: state.tokens ? { ...state.tokens, access: access_token } : null,
          }));

          Cookies.set("access_token", access_token, { secure: true, sameSite: "strict" });
          axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        } catch (error) {
          // Token refresh failed - clear everything and redirect (unless on public page)
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          delete axios.defaults.headers.common["Authorization"];

          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
            isLoggingOut: isPublicRoute() ? false : true, // Set to prevent UI flashing only if redirecting
          });

          if (typeof window !== "undefined" && !isPublicRoute()) {
            window.location.href = "/login";
          }
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            withCredentials: true,
          });
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Session invalid - clear tokens and redirect to login (unless on public page)
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          delete axios.defaults.headers.common["Authorization"];

          set({
            user: null,
            tokens: null,
            isLoading: false,
            isAuthenticated: false,
            isLoggingOut: isPublicRoute() ? false : true, // Set to prevent UI flashing only if redirecting
          });

          if (typeof window !== "undefined" && !isPublicRoute()) {
            window.location.href = "/login";
          }
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User) => set({ user }),

      // Unified SSO OAuth - Single flow for register and login
      googleSSO: async (userType?: "creator" | "subscriber", affiliateHash?: string) => {
        set({ isLoading: true, error: null });
        try {
          // Store user type for later use in callback (optional, for backward compatibility)
          if (userType) {
            sessionStorage.setItem("oauth_user_type", userType);
          }

          // Build query params for unified endpoint
          const params = new URLSearchParams();
          if (userType) {
            params.append("user_type", userType);
          }
          if (affiliateHash) {
            params.append("affiliate_hash", affiliateHash);
          }

          console.log("Unified SSO - Calling backend with query params:", params.toString());

          // Call unified backend endpoint to get Google OAuth URL
          const response = await axios.post(
            `${API_BASE_URL}/auth/sso/authenticate${params.toString() ? "?" + params.toString() : ""}`,
            {},
            { withCredentials: true }
          );

          // Extract and store the state from backend's OAuth URL
          const redirectUrl = response.data.redirect_url || response.data.url;
          if (redirectUrl) {
            // Parse state from the OAuth URL to validate on callback
            try {
              const url = new URL(redirectUrl);
              const backendState = url.searchParams.get("state");
              if (backendState) {
                // Store state EXACTLY as backend provided it - no modification
                sessionStorage.setItem("oauth_state", backendState);
                console.log("Unified SSO - Stored backend state (raw):", backendState);
              }
            } catch (e) {
              console.warn("Could not parse state from OAuth URL:", e);
            }

            set({ isLoading: false });
            return { redirect_url: redirectUrl };
          } else {
            throw new Error("No OAuth URL returned from server");
          }
        } catch (error: any) {
          let errorMessage = "Failed to initiate Google SSO";

          if (error.response?.data?.detail) {
            if (typeof error.response.data.detail === "string") {
              errorMessage = error.response.data.detail;
            } else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail
                .map((err: any) => err.msg || err)
                .join(", ");
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Handle Google OAuth callback (Unified SSO)
      handleGoogleCallback: async (code: string, state: string) => {
        set({ isLoading: true, error: null });
        try {
          // Validate OAuth state parameter against what we stored from backend
          const storedState = sessionStorage.getItem("oauth_state");
          const storedUserType = sessionStorage.getItem("oauth_user_type");
          console.log("Unified SSO State Validation:");
          console.log("  - Received from Google:", state);
          console.log("  - Stored from backend:", storedState);
          console.log("  - Match:", state === storedState);
          console.log("  - User type:", storedUserType);

          if (!storedState || state !== storedState) {
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_user_type");
            throw new Error(`Invalid OAuth state parameter. State mismatch detected.`);
          }

          // Exchange authorization code for tokens via unified endpoint
          console.log(
            "Sending to unified callback:",
            `${API_BASE_URL}/auth/sso/callback?code=...&state=${state}`
          );
          const response = await axios.get(
            `${API_BASE_URL}/auth/sso/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
            { withCredentials: true }
          );

          const { access_token, refresh_token, user, is_new_user } = response.data;

          // Store tokens
          const tokens = { access: access_token, refresh: refresh_token };
          set({
            tokens,
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set cookies for httpOnly security
          Cookies.set("access_token", access_token, {
            expires: 7,
            secure: true,
            sameSite: "strict",
          });
          Cookies.set("refresh_token", refresh_token, {
            expires: 7,
            secure: true,
            sameSite: "strict",
          });

          // Set default auth header
          axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

          // Set flag for new user welcome message (from unified endpoint response)
          if (is_new_user) {
            sessionStorage.setItem("justSignedUp", "true");
          }

          // Clean up OAuth state
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("oauth_user_type");
        } catch (error: any) {
          let errorMessage = "Google authentication failed";
          let redirectPath: string | null = null;

          if (error.response?.data?.detail) {
            if (typeof error.response.data.detail === "string") {
              errorMessage = error.response.data.detail;
            } else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail
                .map((err: any) => err.msg || err)
                .join(", ");
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          const storedUserType = sessionStorage.getItem("oauth_user_type");
          const userTypeLabel = storedUserType === "creator" ? "Creator" : "Subscriber";

          // Detect error type and provide helpful messages with redirect paths
          const isAccountNotFound =
            errorMessage.toLowerCase().includes("no account found") ||
            errorMessage.toLowerCase().includes("please register first");

          const isAccountExists =
            errorMessage.toLowerCase().includes("email already registered") ||
            errorMessage.toLowerCase().includes("already registered") ||
            errorMessage.toLowerCase().includes("use the login flow");

          if (isAccountNotFound && storedUserType) {
            // User tried to login but account doesn't exist
            errorMessage = `No account found with this Google email. Please sign up first as a ${userTypeLabel}.`;
            redirectPath = `/register/${storedUserType}`;
            sessionStorage.setItem("oauth_error_redirect", redirectPath);
          } else if (isAccountExists && storedUserType) {
            // User tried to register but account already exists
            errorMessage = `This Google account is already registered. Please sign in instead.`;
            redirectPath = `/login/${storedUserType}`;
            sessionStorage.setItem("oauth_error_redirect", redirectPath);
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });

          // Clean up OAuth state on error
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("oauth_user_type");

          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Called after hydration completes - use store's set function
        if (!error) {
          // Use setTimeout to ensure this runs after React's render cycle
          setTimeout(() => {
            useAuthStore.setState({ isHydrated: true });
          }, 0);
        }
      },
    }
  )
);

// Initialize axios auth header from stored tokens on app load
if (typeof window !== "undefined") {
  const storedState = localStorage.getItem("auth-storage");
  if (storedState) {
    try {
      const { state } = JSON.parse(storedState);
      if (state?.tokens?.access) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${state.tokens.access}`;
        // Also update cookie
        Cookies.set("access_token", state.tokens.access, { secure: true, sameSite: "strict" });
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
}
