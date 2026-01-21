# API Integration Guide

## Overview

This guide provides comprehensive documentation for integrating the SmartNews frontend with the FastAPI backend located at `https://localhost:8000/`.

## API Configuration

### Base Configuration

```typescript
// config/api.config.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000/",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",
  },
  // Creator
  CREATOR: {
    PROFILE: "/creator/profile",
    PROFILE_UPLOAD: "/creator/profile/upload",
    REVENUE_ESTIMATE: "/creator/revenue/estimate",
    REVENUE_PROJECTIONS: "/creator/revenue/projections",
    APPLY: "/creator/apply",
  },
  // Subscriber
  SUBSCRIBER: {
    PROFILE: "/subscriber/profile",
  },
  // Content
  FEEDS: "/feeds",
  FEED_ITEMS: "/source-items", // Renamed from /feed-items (2025-11-14)
  FEED_SOURCES: "/feed-sources",
  FEED_CATEGORIES: "/feed-categories",
  // Social
  SOCIAL: {
    CONNECT: "/social/connect",
    CALLBACK: "/social/callback",
    DISCONNECT: "/social/disconnect",
    STATS: "/social/stats",
  },
  // Subscriptions
  SUBSCRIPTIONS: "/subscriptions",
  // Analytics
  CONTENT_VIEWS: "/content-views",
} as const;
```

## API Client Setup

### Axios Client Configuration

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { API_CONFIG } from "@/config/api.config";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    this.failedQueue = [];
  }

  private async getAccessToken(): Promise<string | null> {
    // Get from cookie or local storage
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1] || null
    );
  }

  private async refreshToken() {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

## Service Layer

### Authentication Service

```typescript
// lib/api/services/auth.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "@/config/api.config";

export interface LoginCredentials {
  username: string; // Email is used as username
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  user_type: "creator" | "subscriber";
}

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: "creator" | "subscriber";
  created_at: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    // FastAPI OAuth2 expects form data
    const formData = new URLSearchParams();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    return apiClient.post<{ access_token: string; token_type: string }>(
      API_ENDPOINTS.AUTH.LOGIN,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }

  static async register(data: RegisterData) {
    return apiClient.post<User>(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  static async logout() {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  static async getCurrentUser() {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  }
}
```

### Creator Service

```typescript
// lib/api/services/creator.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "@/config/api.config";

export interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string;
  profile_picture: string;
  cover_image: string;
  categories: string[];
  social_links: SocialLink[];
  follower_count: number;
  is_verified: boolean;
  created_at: string;
}

export interface RevenueEstimate {
  total_monthly: number;
  breakdown: {
    platform: string;
    followers: number;
    estimated_revenue: number;
  }[];
  confidence_level: "high" | "medium" | "low";
}

export interface ApplicationRequest {
  motivation: string;
  content_plan: string;
  target_audience: string;
}

export class CreatorService {
  static async getProfile() {
    return apiClient.get<CreatorProfile>(API_ENDPOINTS.CREATOR.PROFILE);
  }

  static async createProfile(data: Partial<CreatorProfile>) {
    return apiClient.post<CreatorProfile>(API_ENDPOINTS.CREATOR.PROFILE, data);
  }

  static async updateProfile(data: Partial<CreatorProfile>) {
    return apiClient.put<CreatorProfile>(API_ENDPOINTS.CREATOR.PROFILE, data);
  }

  static async uploadProfileWithImages(formData: FormData) {
    return apiClient.upload<CreatorProfile>(API_ENDPOINTS.CREATOR.PROFILE_UPLOAD, formData);
  }

  static async getRevenueEstimate() {
    return apiClient.get<RevenueEstimate>(API_ENDPOINTS.CREATOR.REVENUE_ESTIMATE);
  }

  static async getRevenueProjections() {
    return apiClient.get(API_ENDPOINTS.CREATOR.REVENUE_PROJECTIONS);
  }

  static async submitApplication(data: ApplicationRequest) {
    return apiClient.post(API_ENDPOINTS.CREATOR.APPLY, data);
  }
}
```

### Feed Service

```typescript
// lib/api/services/feed.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "@/config/api.config";

export interface Feed {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  category_ids: string[];
  subscriber_count: number;
  schedule: string;
  is_active: boolean;
  created_at: string;
}

export interface FeedItem {
  id: string;
  feed_id: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  published_at: string;
  score: number;
  is_read?: boolean;
  user_rating?: number;
}

export interface CreateFeedRequest {
  name: string;
  description: string;
  category_ids: string[];
  schedule: "daily" | "weekly" | "biweekly";
}

export class FeedService {
  static async getFeeds(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    return apiClient.get<Feed[]>(API_ENDPOINTS.FEEDS, { params });
  }

  static async getFeed(id: string) {
    return apiClient.get<Feed>(`${API_ENDPOINTS.FEEDS}/${id}`);
  }

  static async createFeed(data: CreateFeedRequest) {
    return apiClient.post<Feed>(API_ENDPOINTS.FEEDS, data);
  }

  static async updateFeed(id: string, data: Partial<CreateFeedRequest>) {
    return apiClient.put<Feed>(`${API_ENDPOINTS.FEEDS}/${id}`, data);
  }

  static async deleteFeed(id: string) {
    return apiClient.delete(`${API_ENDPOINTS.FEEDS}/${id}`);
  }

  static async getFeedItems(
    feedId: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ) {
    return apiClient.get<FeedItem[]>(API_ENDPOINTS.FEED_ITEMS, {
      params: { feed_id: feedId, ...params },
    });
  }

  static async addFeedItem(data: {
    feed_id: string;
    url: string;
    title?: string;
    description?: string;
  }) {
    return apiClient.post<FeedItem>(API_ENDPOINTS.FEED_ITEMS, data);
  }

  static async rateFeedItem(itemId: string, rating: number) {
    return apiClient.post(`${API_ENDPOINTS.FEED_ITEMS}/${itemId}/rate`, { rating });
  }
}
```

### Subscription Service

```typescript
// lib/api/services/subscription.service.ts
import { apiClient } from "../client";
import { API_ENDPOINTS } from "@/config/api.config";

export interface Subscription {
  id: string;
  user_id: string;
  feed_id: string;
  feed: {
    id: string;
    name: string;
    creator: {
      id: string;
      name: string;
      avatar: string;
    };
  };
  preferences: {
    email_delivery: boolean;
    delivery_frequency: "immediate" | "daily" | "weekly";
  };
  created_at: string;
}

export class SubscriptionService {
  static async getSubscriptions() {
    return apiClient.get<Subscription[]>(API_ENDPOINTS.SUBSCRIPTIONS);
  }

  static async subscribe(feedId: string, referralCode?: string) {
    return apiClient.post<Subscription>(API_ENDPOINTS.SUBSCRIPTIONS, {
      feed_id: feedId,
      referral_code: referralCode,
    });
  }

  static async unsubscribe(subscriptionId: string) {
    return apiClient.delete(`${API_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}`);
  }

  static async updatePreferences(
    subscriptionId: string,
    preferences: Partial<Subscription["preferences"]>
  ) {
    return apiClient.put(
      `${API_ENDPOINTS.SUBSCRIPTIONS}/${subscriptionId}/preferences`,
      preferences
    );
  }
}
```

## React Hooks

### useAPI Hook

```typescript
// lib/hooks/useAPI.ts
import { useState, useEffect } from "react";
import { AxiosError } from "axios";

interface UseAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

export function useAPI<T>(apiCall: () => Promise<T>, options: UseAPIOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    refetch: execute,
  };
}
```

### Service Hooks

```typescript
// lib/hooks/api/useCreatorProfile.ts
import { useAPI } from "../useAPI";
import { CreatorService } from "@/lib/api/services/creator.service";

export function useCreatorProfile() {
  return useAPI(() => CreatorService.getProfile());
}

// lib/hooks/api/useFeeds.ts
export function useFeeds(params?: { category?: string; search?: string }) {
  return useAPI(() => FeedService.getFeeds(params), {
    immediate: true,
  });
}

// lib/hooks/api/useSubscribe.ts
import { useMutation } from "../useMutation";
import { SubscriptionService } from "@/lib/api/services/subscription.service";

export function useSubscribe() {
  return useMutation((feedId: string) => SubscriptionService.subscribe(feedId));
}
```

## Error Handling

### Error Types

```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function handleApiError(error: AxiosError): ApiError {
  if (error.response) {
    return new ApiError(
      error.response.status,
      error.response.data?.detail || error.message,
      error.response.data?.errors
    );
  }

  if (error.request) {
    return new ApiError(0, "Network error. Please check your connection.");
  }

  return new ApiError(0, error.message);
}
```

### Error Display Component

```typescript
// components/common/api-error.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api/errors';

export function ApiErrorAlert({ error }: { error: ApiError }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error {error.status}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      {error.errors && (
        <ul className="mt-2 list-disc list-inside">
          {Object.entries(error.errors).map(([field, messages]) => (
            <li key={field}>
              <strong>{field}:</strong> {messages.join(', ')}
            </li>
          ))}
        </ul>
      )}
    </Alert>
  );
}
```

## Request/Response Types

### Type Definitions

```typescript
// lib/types/api.types.ts

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Common response types
export interface SuccessResponse {
  message: string;
}

export interface ErrorResponse {
  detail: string;
  errors?: Record<string, string[]>;
}

// File upload
export interface FileUploadResponse {
  file_url: string;
  file_name: string;
  file_size: number;
}
```

## API Testing

### Mock Service for Development

```typescript
// lib/api/mock/mock-service.ts
export class MockApiService {
  private delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async login(credentials: LoginCredentials) {
    await this.delay(500);
    return {
      access_token: "mock-token",
      token_type: "bearer",
      user: {
        id: "1",
        email: credentials.username,
        name: "Test User",
        user_type: "creator" as const,
      },
    };
  }

  async getFeeds() {
    await this.delay(300);
    return [
      {
        id: "1",
        name: "Tech Insights",
        description: "Daily tech news",
        creator: { id: "1", name: "John Doe", avatar: "" },
        subscriber_count: 1234,
      },
    ];
  }
}

// Use mock service in development
export const apiService = process.env.NODE_ENV === "development" ? new MockApiService() : apiClient;
```

### API Integration Tests

```typescript
// __tests__/api/feed.service.test.ts
import { FeedService } from "@/lib/api/services/feed.service";

describe("FeedService", () => {
  it("fetches feeds with pagination", async () => {
    const feeds = await FeedService.getFeeds({ limit: 10, offset: 0 });

    expect(feeds).toBeInstanceOf(Array);
    expect(feeds.length).toBeLessThanOrEqual(10);
  });

  it("creates a new feed", async () => {
    const newFeed = await FeedService.createFeed({
      name: "Test Feed",
      description: "Test Description",
      category_ids: ["1"],
      schedule: "daily",
    });

    expect(newFeed).toHaveProperty("id");
    expect(newFeed.name).toBe("Test Feed");
  });
});
```

## Performance Optimization

### Request Caching

```typescript
// lib/api/cache.ts
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

### Request Deduplication

```typescript
// lib/api/dedup.ts
const pendingRequests = new Map<string, Promise<any>>();

export function dedupRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = request().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}
```

## OpenAPI Integration

### Generate Types from OpenAPI

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript https://localhost:8000//openapi.json -o lib/types/api-generated.ts
```

### Use Generated Types

```typescript
// lib/api/services/typed-service.ts
import type { paths } from "@/lib/types/api-generated";

type FeedResponse = paths["/feeds"]["get"]["responses"]["200"]["content"]["application/json"];

export async function getFeeds(): Promise<FeedResponse> {
  return apiClient.get("/feeds");
}
```
