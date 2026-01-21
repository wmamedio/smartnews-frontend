import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSmartImport, pullAndRescoreSource } from "../useSmartImport";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { toast } from "sonner";
import React from "react";

// Mock dependencies
jest.mock("@/lib/api/services/feed-sources.service");
jest.mock("@/lib/api/services/feed-items.service");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedFeedSourcesService = feedSourcesService as jest.Mocked<typeof feedSourcesService>;
const mockedFeedItemsService = feedItemsService as jest.Mocked<typeof feedItemsService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

// Helper to create mock feed source (use `as any` for test mocks)
const createMockFeedSource = (overrides: Partial<any> = {}) =>
  ({
    id: 1,
    name: "Test Source",
    source_type: "manual_url" as const,
    configuration: { url: "https://example.com" },
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    item_count: 0,
    ...overrides,
  }) as any;

// Helper to create mock source item (use `as any` for test mocks)
const createMockSourceItem = (overrides: Partial<any> = {}) =>
  ({
    id: 100,
    feed_source_id: 1,
    feed_source: { id: 1, name: "Test Source", source_type: "manual_url" },
    title: "Test Article Title",
    description: "Test description",
    link: "https://example.com/article",
    status: "pending",
    created_at: "2025-01-01T00:00:00Z",
    content_hash: "abc123",
    ...overrides,
  }) as any;

// Helper to create mock smart import response
const createMockSmartImportResponse = (overrides: Partial<any> = {}) =>
  ({
    feed_source: createMockFeedSource(),
    source_item: createMockSourceItem(),
    classification: "single_content" as const,
    detected_type: "manual_url" as const,
    is_new: true,
    ...overrides,
  }) as any;

describe("useSmartImport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Single Content Import", () => {
    const mockSingleContentResponse = createMockSmartImportResponse({
      feed_source: createMockFeedSource({ id: 1, name: "Test Article" }),
    });

    it("should call smart-import API with provided URL (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockSingleContentResponse);
      mockedFeedItemsService.updateStatus.mockResolvedValue(
        createMockSourceItem({ status: "ready_for_publish" })
      );

      const { result } = renderHook(() => useSmartImport(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(mockedFeedSourcesService.smartImport).toHaveBeenCalledWith(
          "https://example.com/article"
        );
      });
    });

    it("should auto-approve single content when autoApproveSingleContent=true (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockSingleContentResponse);
      mockedFeedItemsService.updateStatus.mockResolvedValue(
        createMockSourceItem({ status: "ready_for_publish" })
      );

      const { result } = renderHook(() => useSmartImport({ autoApproveSingleContent: true }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(mockedFeedItemsService.updateStatus).toHaveBeenCalledWith(100, "ready_for_publish");
      });
    });

    it("should NOT auto-approve when autoApproveSingleContent=false (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockSingleContentResponse);

      const { result } = renderHook(() => useSmartImport({ autoApproveSingleContent: false }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(mockedFeedSourcesService.smartImport).toHaveBeenCalled();
      });

      expect(mockedFeedItemsService.updateStatus).not.toHaveBeenCalled();
    });

    it("should call onSingleContentSuccess callback for single content (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockSingleContentResponse);
      mockedFeedItemsService.updateStatus.mockResolvedValue(
        createMockSourceItem({ status: "ready_for_publish" })
      );

      const onSingleContentSuccess = jest.fn();
      const { result } = renderHook(() => useSmartImport({ onSingleContentSuccess }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(onSingleContentSuccess).toHaveBeenCalledWith(mockSingleContentResponse);
      });
    });

    it("should show success toast for single content import (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockSingleContentResponse);
      mockedFeedItemsService.updateStatus.mockResolvedValue(
        createMockSourceItem({ status: "ready_for_publish" })
      );

      const { result } = renderHook(() => useSmartImport(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(mockedToast.success).toHaveBeenCalledWith(
          expect.stringContaining("Content imported"),
          expect.any(Object)
        );
      });
    });
  });

  describe("Continuous Feed Import", () => {
    const mockContinuousFeedResponse = createMockSmartImportResponse({
      feed_source: createMockFeedSource({ id: 2, name: "RSS Feed", source_type: "rss" }),
      source_item: null,
      classification: "continuous_feed",
      detected_type: "rss",
    });

    const mockKeywordSuggestions = {
      is_valid: true,
      suggested_keywords: {
        good_keywords: ["technology", "AI"],
        bad_keywords: ["spam", "ads"],
      },
    } as any;

    it("should fetch AI keyword suggestions for continuous feeds (AC 3)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockContinuousFeedResponse);
      mockedFeedSourcesService.validateUrl.mockResolvedValue(mockKeywordSuggestions);

      const { result } = renderHook(() => useSmartImport(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.importUrl("https://example.com/feed.xml");
      });

      await waitFor(() => {
        expect(mockedFeedSourcesService.validateUrl).toHaveBeenCalledWith(
          "https://example.com/feed.xml"
        );
      });
    });

    it("should call onContinuousFeedDetected callback with source and keywords (AC 3)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockContinuousFeedResponse);
      mockedFeedSourcesService.validateUrl.mockResolvedValue(mockKeywordSuggestions);

      const onContinuousFeedDetected = jest.fn();
      const { result } = renderHook(() => useSmartImport({ onContinuousFeedDetected }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.importUrl("https://example.com/feed.xml");
      });

      await waitFor(() => {
        expect(onContinuousFeedDetected).toHaveBeenCalledWith(
          mockContinuousFeedResponse.feed_source,
          { good: ["technology", "AI"], bad: ["spam", "ads"] }
        );
      });
    });

    it("should show info toast for continuous feed detection (AC 2)", async () => {
      mockedFeedSourcesService.smartImport.mockResolvedValue(mockContinuousFeedResponse);
      mockedFeedSourcesService.validateUrl.mockResolvedValue(mockKeywordSuggestions);

      const { result } = renderHook(() => useSmartImport(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.importUrl("https://example.com/feed.xml");
      });

      await waitFor(() => {
        expect(mockedToast.info).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully with error toast (AC 2)", async () => {
      const apiError = { response: { data: { detail: "Invalid URL" } } };
      mockedFeedSourcesService.smartImport.mockRejectedValue(apiError);

      const onError = jest.fn();
      const { result } = renderHook(() => useSmartImport({ onError }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.importUrl("https://invalid-url");
      });

      await waitFor(() => {
        expect(mockedToast.error).toHaveBeenCalledWith(
          "Failed to import content",
          expect.any(Object)
        );
        expect(onError).toHaveBeenCalledWith(apiError);
      });
    });
  });

  describe("Query Invalidation", () => {
    it("should invalidate relevant queries after successful import (AC 2)", async () => {
      const mockResponse = createMockSmartImportResponse({
        feed_source: createMockFeedSource({ id: 1, name: "Test" }),
        source_item: createMockSourceItem({ id: 100, title: "Test" }),
      });

      mockedFeedSourcesService.smartImport.mockResolvedValue(mockResponse);
      mockedFeedItemsService.updateStatus.mockResolvedValue(
        createMockSourceItem({ status: "ready_for_publish" })
      );

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useSmartImport(), { wrapper });

      await act(async () => {
        result.current.importUrl("https://example.com/article");
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalled();
      });
    });
  });
});

describe("pullAndRescoreSource", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should pull content and rescore all items", async () => {
    mockedFeedSourcesService.pullContent.mockResolvedValue({
      task_id: "pull-task-123",
      status: "completed",
      message: "Content pulled successfully",
    });
    mockedFeedSourcesService.rescoreAll.mockResolvedValue({
      message: "Rescore complete",
      task_id: "rescore-task-123",
      feed_source_id: 1,
    });

    const queryClient = new QueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    await pullAndRescoreSource(1, queryClient);

    expect(mockedFeedSourcesService.pullContent).toHaveBeenCalledWith(1, false);
    expect(mockedFeedSourcesService.rescoreAll).toHaveBeenCalledWith(1);
    expect(invalidateQueriesSpy).toHaveBeenCalled();
    expect(mockedToast.success).toHaveBeenCalled();
  });

  it("should show error toast on failure", async () => {
    mockedFeedSourcesService.pullContent.mockRejectedValue(new Error("Pull failed"));

    const queryClient = new QueryClient();

    await expect(pullAndRescoreSource(1, queryClient)).rejects.toThrow();
    expect(mockedToast.error).toHaveBeenCalled();
  });
});
