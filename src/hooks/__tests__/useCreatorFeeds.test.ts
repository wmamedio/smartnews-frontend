import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatorFeeds } from "../useCreatorFeeds";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import React from "react";

// Mock dependencies
jest.mock("@/lib/api/feeds");

const mockedFetchCreatorFeeds = fetchCreatorFeeds as jest.MockedFunction<typeof fetchCreatorFeeds>;

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

// Helper to create mock feeds response
const createMockFeedsResponse = (overrides: Partial<any> = {}) =>
  ({
    feeds: [],
    total: 0,
    limit: 50,
    offset: 0,
    ...overrides,
  }) as any;

describe("useCreatorFeeds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Data Fetching", () => {
    it("should fetch creator feeds from API (AC 1, 6)", async () => {
      const mockFeeds = createMockFeedsResponse({
        feeds: [
          { id: 1, name: "Feed 1", status: "published" },
          { id: 2, name: "Feed 2", status: "draft" },
        ],
        total: 2,
      });

      mockedFetchCreatorFeeds.mockResolvedValue(mockFeeds);

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockedFetchCreatorFeeds).toHaveBeenCalled();
      expect(result.current.feeds).toEqual(mockFeeds.feeds);
      expect(result.current.totalFeeds).toBe(2);
    });
  });

  describe("hasFeeds boolean", () => {
    it("should return hasFeeds=true when feeds exist (AC 1)", async () => {
      const mockFeeds = createMockFeedsResponse({
        feeds: [{ id: 1, name: "Feed 1", status: "published" }],
        total: 1,
      });

      mockedFetchCreatorFeeds.mockResolvedValue(mockFeeds);

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasFeeds).toBe(true);
    });

    it("should return hasFeeds=false when no feeds (AC 1)", async () => {
      const mockFeeds = createMockFeedsResponse({ feeds: [], total: 0 });

      mockedFetchCreatorFeeds.mockResolvedValue(mockFeeds);

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasFeeds).toBe(false);
    });
  });

  describe("Loading State", () => {
    it("should provide loading state during fetch (AC 6)", async () => {
      // Create a promise that we control
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockedFetchCreatorFeeds.mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.feeds).toEqual([]);
      expect(result.current.hasFeeds).toBe(false);

      // Resolve the promise
      resolvePromise!({ feeds: [{ id: 1 }], total: 1 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasFeeds).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors (AC 6)", async () => {
      const apiError = new Error("API Error");
      mockedFetchCreatorFeeds.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.feeds).toEqual([]);
      expect(result.current.hasFeeds).toBe(false);
    });
  });

  describe("Refetch", () => {
    it("should provide refetch function", async () => {
      mockedFetchCreatorFeeds.mockResolvedValue(createMockFeedsResponse());

      const { result } = renderHook(() => useCreatorFeeds(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe("function");
    });
  });
});
