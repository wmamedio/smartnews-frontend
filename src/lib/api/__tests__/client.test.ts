import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Mock modules before importing anything else
jest.mock("axios");
jest.mock("js-cookie");
jest.mock("@/lib/stores/auth-store", () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCookies = Cookies as jest.Mocked<typeof Cookies>;

describe("API Client", () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let responseInterceptor: any;
  let responseErrorInterceptor: any;

  beforeAll(() => {
    // Set up the mock before any imports - create a callable mock function
    const mockClientFunction = jest.fn().mockResolvedValue({ data: "success" });

    mockAxiosInstance = Object.assign(mockClientFunction, {
      interceptors: {
        request: {
          use: jest.fn((onFulfilled) => {
            requestInterceptor = onFulfilled;
            return 0;
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            responseInterceptor = onFulfilled;
            responseErrorInterceptor = onRejected;
            return 0;
          }),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
    });
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementation
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  describe("Configuration", () => {
    it("creates axios instance with correct config", async () => {
      // Import the client here to trigger initialization
      const { default: apiClient } = await import("../client");

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://localhost:8000",
          timeout: 30000,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  describe("Request Interceptor", () => {
    beforeEach(async () => {
      // Import to ensure interceptors are set up
      await import("../client");
    });

    it("adds access token to request headers when available", () => {
      (mockedCookies.get as jest.Mock).mockReturnValue("mock-access-token");

      const config: InternalAxiosRequestConfig = {
        headers: {} as any,
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe("Bearer mock-access-token");
    });

    it("does not add authorization header when token is missing", () => {
      (mockedCookies.get as jest.Mock).mockReturnValue(undefined);

      const config: InternalAxiosRequestConfig = {
        headers: {} as any,
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it("preserves existing headers", () => {
      (mockedCookies.get as jest.Mock).mockReturnValue("mock-access-token");

      const config: InternalAxiosRequestConfig = {
        headers: {
          "X-Custom-Header": "custom-value",
        } as any,
      } as InternalAxiosRequestConfig;

      const result = requestInterceptor(config);

      expect(result.headers["X-Custom-Header"]).toBe("custom-value");
      expect(result.headers.Authorization).toBe("Bearer mock-access-token");
    });
  });

  describe("Response Interceptor", () => {
    beforeEach(async () => {
      await import("../client");
    });

    it("passes through successful responses", () => {
      const response = {
        data: { success: true },
        status: 200,
      };

      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });
  });

  describe("Error Interceptor", () => {
    const mockRefreshToken = jest.fn();
    const mockLogout = jest.fn();

    beforeEach(async () => {
      const { useAuthStore } = await import("@/lib/stores/auth-store");
      (useAuthStore.getState as jest.Mock) = jest.fn(() => ({
        refreshToken: mockRefreshToken,
        logout: mockLogout,
      }));

      await import("../client");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("attempts token refresh on 401 error", async () => {
      const originalRequest = {
        url: "/api/protected",
        headers: {} as any,
        _retry: false,
      };

      const error = {
        response: {
          status: 401,
          data: {},
          statusText: "Unauthorized",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
        config: originalRequest,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      } as AxiosError;

      // Mock axios.post for refresh token call
      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { access_token: "new-token" },
      });

      // Mock cookies
      (mockedCookies.get as jest.Mock).mockReturnValue("refresh-token");
      mockedCookies.set.mockImplementation(() => undefined);

      // Reset mock to allow function calls
      (mockAxiosInstance as jest.Mock).mockResolvedValueOnce({ data: "success" });

      await responseErrorInterceptor(error);

      expect(axios.post).toHaveBeenCalledWith("https://localhost:8000/auth/refresh", {
        refresh_token: "refresh-token",
      });
      expect(originalRequest._retry).toBe(true);
    });

    it("does not retry if request has already been retried", async () => {
      const originalRequest = {
        url: "/api/protected",
        headers: {} as any,
        _retry: true,
      };

      const error = {
        response: {
          status: 401,
          data: {},
          statusText: "Unauthorized",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
        config: originalRequest,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockRefreshToken).not.toHaveBeenCalled();
    });

    it("does not retry on non-401 errors", async () => {
      const error = {
        response: {
          status: 500,
        },
        config: {
          url: "/api/endpoint",
        },
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 500",
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockRefreshToken).not.toHaveBeenCalled();
    });

    it("rejects when refresh token fails", async () => {
      const originalRequest = {
        url: "/api/protected",
        headers: {} as any,
        _retry: false,
      };

      const error = {
        response: {
          status: 401,
          data: {},
          statusText: "Unauthorized",
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
        config: originalRequest,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      } as AxiosError;

      // Mock refresh token failure
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error("Refresh failed"));
      (mockedCookies.get as jest.Mock).mockReturnValue("refresh-token");
      mockedCookies.remove.mockImplementation(() => undefined);

      await expect(responseErrorInterceptor(error)).rejects.toEqual(new Error("Refresh failed"));

      expect(axios.post).toHaveBeenCalledWith("https://localhost:8000/auth/refresh", {
        refresh_token: "refresh-token",
      });
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it("handles errors without response", async () => {
      const error = {
        message: "Network Error",
        config: {
          url: "/api/endpoint",
        },
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockRefreshToken).not.toHaveBeenCalled();
    });

    it("handles errors without config", async () => {
      const error = {
        response: {
          status: 401,
        },
        config: undefined, // Explicitly undefined config
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("API Methods", () => {
    it("exports the configured axios instance", async () => {
      const { default: apiClient } = await import("../client");

      expect(apiClient).toBeDefined();
      expect(apiClient).toBe(mockAxiosInstance);
    });
  });
});
