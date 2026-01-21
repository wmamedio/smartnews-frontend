import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Direct backend API URL - CORS is properly configured on backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 second timeout
      withCredentials: true, // Enable sending cookies with CORS requests
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private isPublicRoute(path: string): boolean {
    // Exact match routes
    if (path === "/" || path === "/discover") {
      return true;
    }

    // Prefix match routes
    const publicPrefixes = [
      "/feed/", // Public feed pages e.g., /feed/my-tech-feed
      "/creator/", // Public creator profiles
      "/login",
      "/register",
      "/auth/google",
    ];

    return publicPrefixes.some((route) => path.startsWith(route));
  }

  private redirectToLogin(message: string) {
    console.log("[API Client] redirectToLogin called:", message);

    // Check if we're on a public page - don't redirect if so
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      console.log("[API Client] Current path:", currentPath);

      if (this.isPublicRoute(currentPath)) {
        console.log("[API Client] Public route detected, cleaning cookies without redirect");
        // Just clean up cookies, don't redirect
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        return;
      }
    }

    // Clean up auth cookies
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");

    // Store session expiry message for toast display
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_error_message", message);
      sessionStorage.setItem("focus_email_input", "true");
    }

    // Determine login path based on current route
    const currentPath = window.location.pathname;
    const isCreatorRoute =
      currentPath.startsWith("/feeds") ||
      currentPath.startsWith("/content") ||
      currentPath.startsWith("/dashboard") ||
      currentPath.startsWith("/revenue") ||
      currentPath.startsWith("/settings");

    // Redirect to appropriate login page
    const loginPath = isCreatorRoute ? "/login/creator" : "/login/subscriber";
    console.log("[API Client] Redirecting to:", loginPath);

    // Force a full page redirect (bypass Next.js router)
    if (typeof window !== "undefined") {
      window.location.replace(loginPath);
    }
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get("access_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Check for "Could not validate credentials" error
        const errorDetail =
          (error.response?.data as any)?.detail || error.response?.statusText || "";
        const isCredentialError =
          (error.response?.status === 401 || error.response?.status === 403) &&
          (errorDetail.toLowerCase().includes("could not validate credentials") ||
            errorDetail.toLowerCase().includes("unauthorized") ||
            errorDetail.toLowerCase().includes("forbidden"));

        if (isCredentialError) {
          console.log("[API Client] Credential error detected:", {
            status: error.response?.status,
            detail: errorDetail,
            url: originalRequest?.url,
          });
        }

        // Handle 401 Unauthorized OR 403 Forbidden - both indicate session expiry
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          originalRequest &&
          !originalRequest._retry
        ) {
          // Debug: Log the actual error details we're receiving
          console.log("[API Client] 401/403 error received:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            detail: (error.response?.data as any)?.detail,
            url: originalRequest?.url,
            errorDetail,
            isCredentialError,
          });
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = Cookies.get("refresh_token");
          const accessToken = Cookies.get("access_token");

          // For ANY 401/403 error, check if we're on a protected route and redirect
          // This is simpler and more reliable than checking error messages
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isProtectedRoute = !this.isPublicRoute(currentPath);

            // If on protected route, redirect immediately on 401/403
            if (isProtectedRoute) {
              console.log(
                "[API Client] 401/403 on protected route, redirecting to login",
                currentPath
              );
              this.processQueue(error, null);
              this.isRefreshing = false;
              this.redirectToLogin("Your session has expired. Please login again.");
              return Promise.reject(error);
            }
          }

          // If user was never logged in (no tokens at all), just reject without redirecting
          // This allows public pages to handle 401/403 gracefully
          if (!refreshToken && !accessToken) {
            this.processQueue(error, null);
            this.isRefreshing = false;
            return Promise.reject(error);
          }

          // If refresh token is missing but we had access token, redirect
          if (!refreshToken) {
            this.processQueue(error, null);
            this.isRefreshing = false;
            this.redirectToLogin("Your session has expired. Please login again.");
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token } = response.data;
            Cookies.set("access_token", access_token, { secure: true, sameSite: "strict" });

            this.processQueue(null, access_token);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            this.redirectToLogin("Your session has expired. Please login again.");
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle validation errors
        if (error.response?.status === 422) {
          const validationError = error.response.data as any;
          return Promise.reject({
            ...error,
            validationErrors: validationError.detail,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.client;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient.instance;

// Export typed error interface
export interface ApiError extends AxiosError {
  validationErrors?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}
