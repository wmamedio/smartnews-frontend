import { renderHook, act, waitFor } from "@testing-library/react";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "../auth-store";

// Mock axios and js-cookie
jest.mock("axios");
jest.mock("js-cookie");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

describe("AuthStore", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset zustand store state
    localStorage.clear();

    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Reset axios mock to clear any previous mock implementations
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedCookies.get.mockReset();
    mockedCookies.set.mockReset();
    mockedCookies.remove.mockReset();
  });

  describe("login", () => {
    it("successfully logs in user", async () => {
      const mockResponse = {
        status: 200,
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: {
            id: "1",
            email: "test@example.com",
            user_type: "creator",
            isVerified: true,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password123",
          rememberMe: true,
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(result.current.tokens).toEqual({
        access: "mock-access-token",
        refresh: "mock-refresh-token",
      });

      // Check cookies were set with remember me
      expect(mockedCookies.set).toHaveBeenCalledWith(
        "access_token",
        "mock-access-token",
        expect.objectContaining({
          expires: 7,
          secure: true,
          sameSite: "strict",
        })
      );
    });

    it("handles login error with detail message", async () => {
      const errorMessage = "Invalid credentials";
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorMessage,
          },
        },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({
            email: "test@example.com",
            password: "wrong-password",
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("handles login without remember me", async () => {
      const mockResponse = {
        status: 200,
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: { id: "1", email: "test@example.com", user_type: "creator" },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password123",
          rememberMe: false,
        });
      });

      // Check cookies were set without expires (session cookies)
      expect(mockedCookies.set).toHaveBeenCalledWith(
        "access_token",
        "mock-access-token",
        expect.objectContaining({
          secure: true,
          sameSite: "strict",
        })
      );
      expect(mockedCookies.set).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expires: 7 })
      );
    });
  });

  describe("register", () => {
    it("successfully registers and logs in user", async () => {
      const registerResponse = { data: { success: true } };
      const loginResponse = {
        status: 200,
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: { id: "1", email: "new@example.com", user_type: "creator" },
        },
      };

      mockedAxios.post
        .mockResolvedValueOnce(registerResponse) // Register call
        .mockResolvedValueOnce(loginResponse); // Auto-login call

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: "new@example.com",
          password: "password123",
          firstName: "Test",
          lastName: "User",
          user_type: "creator",
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("new@example.com");
    });

    it("handles registration error", async () => {
      const errorMessage = "Email already exists";
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            detail: errorMessage,
          },
        },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.register({
            email: "existing@example.com",
            password: "password123",
            firstName: "Test",
            lastName: "User",
            user_type: "creator",
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("logout", () => {
    it("clears auth state and tokens", async () => {
      // Setup initial authenticated state
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: "1",
          email: "test@example.com",
          user_type: "creator",
          isVerified: true,
        });
      });

      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockedCookies.remove).toHaveBeenCalledWith("access_token");
      expect(mockedCookies.remove).toHaveBeenCalledWith("refresh_token");
    });

    it("handles logout API failure gracefully", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state even if API call fails
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("refreshToken", () => {
    it("successfully refreshes access token", async () => {
      const mockResponse = {
        data: {
          access_token: "new-access-token",
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      (mockedCookies.get as jest.Mock).mockReturnValue("mock-refresh-token");
      mockedCookies.set.mockImplementation(() => undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial tokens and user state
      act(() => {
        // Manually set store state to simulate an authenticated user with tokens
        const store = useAuthStore.getState();
        useAuthStore.setState({
          ...store,
          user: {
            id: "1",
            email: "test@example.com",
            user_type: "creator",
            isVerified: true,
          },
          tokens: {
            access: "old-access-token",
            refresh: "mock-refresh-token",
          },
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockedCookies.set).toHaveBeenCalledWith(
        "access_token",
        "new-access-token",
        expect.objectContaining({
          secure: true,
          sameSite: "strict",
        })
      );
    });

    it("logs out user when refresh token is missing", async () => {
      (mockedCookies.get as jest.Mock).mockReturnValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("logs out user when refresh fails", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Invalid refresh token"));
      (mockedCookies.get as jest.Mock).mockReturnValue("invalid-refresh-token");

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("fetches and sets current user", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        user_type: "creator",
        isVerified: true,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.getCurrentUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("handles get current user error", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Unauthorized"));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.getCurrentUser();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      const { result } = renderHook(() => useAuthStore());

      // Set an error
      act(() => {
        result.current.login({ email: "", password: "" }).catch(() => {});
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Google OAuth", () => {
    // Mock crypto.randomUUID
    const mockRandomUUID = jest.fn();
    const originalCrypto = global.crypto;

    beforeAll(() => {
      // Mock crypto.randomUUID
      Object.defineProperty(global, "crypto", {
        value: {
          randomUUID: mockRandomUUID,
        },
        writable: true,
        configurable: true,
      });
    });

    afterAll(() => {
      global.crypto = originalCrypto;
    });

    beforeEach(() => {
      // Reset sessionStorage
      sessionStorage.clear();
      // Reset mock
      mockRandomUUID.mockReset();
    });

    describe("googleSSO", () => {
      it("successfully initiates unified SSO for creator registration", async () => {
        const mockBackendState = "backend-generated-state-123";
        const mockResponse = {
          data: {
            redirect_url: `https://accounts.google.com/o/oauth2/v2/auth?state=${mockBackendState}&client_id=...`,
          },
        };

        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const response = await result.current.googleSSO("creator");
          expect(response.redirect_url).toBe(mockResponse.data.redirect_url);
        });

        // Verify backend's state was extracted and stored in sessionStorage
        expect(sessionStorage.getItem("oauth_state")).toBe(mockBackendState);
        expect(sessionStorage.getItem("oauth_user_type")).toBe("creator");

        // Verify API call to unified endpoint
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining("/auth/sso/authenticate?user_type=creator"),
          {},
          { withCredentials: true }
        );
      });

      it("successfully initiates unified SSO for subscriber login with affiliate", async () => {
        const mockBackendState = "backend-generated-state-456";
        const mockResponse = {
          data: {
            redirect_url: `https://accounts.google.com/o/oauth2/v2/auth?state=${mockBackendState}&client_id=...`,
          },
        };

        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const response = await result.current.googleSSO("subscriber", "affiliate123");
          expect(response.redirect_url).toBe(mockResponse.data.redirect_url);
        });

        // Verify backend's state was extracted and stored
        expect(sessionStorage.getItem("oauth_state")).toBe(mockBackendState);

        // Verify API call includes both user_type and affiliate_hash (unified endpoint)
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining(
            "/auth/sso/authenticate?user_type=subscriber&affiliate_hash=affiliate123"
          ),
          {},
          { withCredentials: true }
        );
      });

      it("successfully initiates unified SSO without user type (login mode)", async () => {
        const mockBackendState = "backend-generated-state-789";
        const mockResponse = {
          data: {
            redirect_url: `https://accounts.google.com/o/oauth2/v2/auth?state=${mockBackendState}&client_id=...`,
          },
        };

        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          const response = await result.current.googleSSO();
          expect(response.redirect_url).toBe(mockResponse.data.redirect_url);
        });

        // Verify backend's state was stored
        expect(sessionStorage.getItem("oauth_state")).toBe(mockBackendState);

        // Verify API call to unified endpoint without user_type
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining("/auth/sso/authenticate"),
          {},
          { withCredentials: true }
        );
      });

      it("handles missing OAuth URL in SSO response", async () => {
        const mockResponse = {
          data: {},
        };

        mockedAxios.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          try {
            await result.current.googleSSO("creator");
          } catch (error) {
            expect(error).toBeDefined();
          }
        });

        expect(result.current.error).toBe("Failed to initiate Google SSO");
      });

      it("handles API error during SSO initiation", async () => {
        mockedAxios.post.mockRejectedValueOnce({
          response: {
            data: {
              detail: "Invalid user type",
            },
          },
        });

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          try {
            await result.current.googleSSO("creator");
          } catch (error) {
            expect(error).toBeDefined();
          }
        });

        expect(result.current.error).toBe("Invalid user type");
      });
    });

    describe("handleGoogleCallback", () => {
      it("successfully handles unified SSO callback - new user (registration)", async () => {
        const mockState = "mock-state-123";
        sessionStorage.setItem("oauth_state", mockState);

        const mockResponse = {
          data: {
            access_token: "mock-oauth-access-token",
            refresh_token: "mock-oauth-refresh-token",
            user: {
              id: "1",
              email: "test@example.com",
              user_type: "creator",
              isVerified: true,
            },
            is_new_user: true,
          },
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          await result.current.handleGoogleCallback("auth-code-123", mockState);
        });

        // Verify user authenticated
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockResponse.data.user);
        expect(result.current.tokens).toEqual({
          access: "mock-oauth-access-token",
          refresh: "mock-oauth-refresh-token",
        });

        // Verify unified endpoint was called
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining("/auth/sso/callback?code=auth-code-123&state=mock-state-123"),
          { withCredentials: true }
        );

        // Verify cookies set
        expect(mockedCookies.set).toHaveBeenCalledWith(
          "access_token",
          "mock-oauth-access-token",
          expect.objectContaining({
            expires: 7,
            secure: true,
            sameSite: "strict",
          })
        );

        // Verify new user flag set from unified endpoint response
        expect(sessionStorage.getItem("justSignedUp")).toBe("true");

        // Verify OAuth state cleaned up
        expect(sessionStorage.getItem("oauth_state")).toBeNull();
        expect(sessionStorage.getItem("oauth_user_type")).toBeNull();
      });

      it("successfully handles unified SSO callback - existing user (login)", async () => {
        const mockState = "mock-state-456";
        sessionStorage.setItem("oauth_state", mockState);

        const mockResponse = {
          data: {
            access_token: "mock-oauth-access-token",
            refresh_token: "mock-oauth-refresh-token",
            user: {
              id: "2",
              email: "existing@example.com",
              user_type: "subscriber",
              isVerified: true,
            },
            is_new_user: false,
          },
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          await result.current.handleGoogleCallback("auth-code-456", mockState);
        });

        // Verify user authenticated
        expect(result.current.isAuthenticated).toBe(true);

        // Verify new user flag NOT set for existing user (is_new_user: false)
        expect(sessionStorage.getItem("justSignedUp")).toBeNull();
      });

      it("rejects callback with invalid state parameter", async () => {
        const storedState = "stored-state-123";
        sessionStorage.setItem("oauth_state", storedState);

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          try {
            await result.current.handleGoogleCallback("auth-code-123", "wrong-state-456");
          } catch (error: any) {
            expect(error.message).toContain("Invalid OAuth state parameter");
          }
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toContain("Invalid OAuth state parameter");
      });

      it("rejects callback with missing stored state", async () => {
        // No state stored in sessionStorage

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          try {
            await result.current.handleGoogleCallback("auth-code-123", "some-state");
          } catch (error: any) {
            expect(error.message).toContain("Invalid OAuth state parameter");
          }
        });

        expect(result.current.isAuthenticated).toBe(false);
      });

      it("handles unified endpoint API error during callback processing", async () => {
        const mockState = "mock-state-789";
        sessionStorage.setItem("oauth_state", mockState);

        mockedAxios.get.mockRejectedValueOnce({
          response: {
            data: {
              detail: "Invalid authorization code",
            },
          },
        });

        const { result } = renderHook(() => useAuthStore());

        await act(async () => {
          try {
            await result.current.handleGoogleCallback("invalid-code", mockState);
          } catch (error) {
            expect(error).toBeDefined();
          }
        });

        expect(result.current.error).toBe("Invalid authorization code");
        expect(result.current.isAuthenticated).toBe(false);

        // Verify OAuth state cleaned up even on error
        expect(sessionStorage.getItem("oauth_state")).toBeNull();
      });
    });
  });
});
