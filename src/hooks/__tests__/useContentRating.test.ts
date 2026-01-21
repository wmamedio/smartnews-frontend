import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContentRating } from "../useContentRating";
import { feedItemsService, type FeedItem } from "@/lib/api/services/feed-items.service";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { toast } from "sonner";
import React from "react";

// Mock dependencies
jest.mock("@/lib/api/services/feed-items.service");
jest.mock("@/lib/api/services/feed-sources.service");
jest.mock("@/lib/utils/keyword-dialog-preferences", () => ({
  shouldSkipKeywordDialog: jest.fn().mockReturnValue(false),
  shouldSkipKeywordDialogLibrary: jest.fn().mockReturnValue(false),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedFeedItemsService = feedItemsService as jest.Mocked<typeof feedItemsService>;
const mockedFeedSourcesService = feedSourcesService as jest.Mocked<typeof feedSourcesService>;
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

// Mock feed item
const createMockItem = (overrides: Partial<FeedItem> = {}): FeedItem =>
  ({
    id: 1,
    feed_source_id: 10,
    title: "Test Article",
    description: "Test description",
    link: "https://example.com/article",
    status: "pending",
    published_at: "2025-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    content_hash: "abc123",
    feed_source: { id: 10, name: "Test Source", source_type: "rss" },
    ...overrides,
  }) as FeedItem;

// Mock feed source for getById
const createMockFeedSource = (overrides: Partial<any> = {}) => ({
  id: 10,
  name: "Test Source",
  source_type: "rss" as const,
  configuration: { url: "https://example.com/feed" },
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  item_count: 0,
  good_keywords: [] as string[],
  bad_keywords: [] as string[],
  ...overrides,
});

describe("useContentRating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rating Status Updates", () => {
    it("should update item status to ready_for_publish on thumbs up", async () => {
      // Use status other than "pending" to skip rescore flow
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: [] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      expect(mockedFeedItemsService.updateStatus).toHaveBeenCalledWith(1, "ready_for_publish");
      expect(mockedToast.success).toHaveBeenCalledWith("Content marked as ready to publish");
    });

    it("should update item status to rejected on thumbs down", async () => {
      // Use status other than "pending" to skip rescore flow
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: [] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({ ...mockItem, status: "rejected" });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "down");
      });

      expect(mockedFeedItemsService.updateStatus).toHaveBeenCalledWith(1, "rejected");
      expect(mockedToast.error).toHaveBeenCalledWith("Content marked as rejected");
    });
  });

  describe("Keyword Extraction", () => {
    it("should trigger rescore for pending items without keywords", async () => {
      const mockItem = createMockItem({ status: "pending" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["tech", "ai"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue({ ...mockItem, keywords: [] });
      mockedFeedItemsService.rescoreAndWaitForKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(createMockFeedSource());

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      expect(mockedFeedItemsService.rescoreAndWaitForKeywords).toHaveBeenCalledWith(1);
    });
  });

  describe("Keyword Filtering", () => {
    it("should filter existing source keywords from suggestions", async () => {
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["tech", "ai", "existing"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(
        createMockFeedSource({ good_keywords: ["existing"] })
      );

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      // The dialog data should only contain keywords NOT already in the source
      expect(result.current.keywordDialogData?.keywords).toEqual(["tech", "ai"]);
      expect(result.current.keywordDialogData?.keywords).not.toContain("existing");
    });
  });

  describe("Keyword Dialog State", () => {
    it("should open keyword dialog when new keywords are found", async () => {
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["tech", "ai"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(createMockFeedSource());

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      expect(result.current.keywordDialogOpen).toBe(false);

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      expect(result.current.keywordDialogData).toEqual({
        keywords: ["tech", "ai"],
        mode: "good",
        itemId: 1,
        sourceId: 10,
        sourceName: "Test Source",
        existingKeywords: [],
      });
    });

    it("should set mode to bad when thumbs down", async () => {
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["spam"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({ ...mockItem, status: "rejected" });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(createMockFeedSource());

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "down");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      expect(result.current.keywordDialogData?.mode).toBe("bad");
    });
  });

  describe("Add Keywords Handler", () => {
    it("should add selected keywords to source", async () => {
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["tech", "ai"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(
        createMockFeedSource({ good_keywords: ["existing"] })
      );
      mockedFeedSourcesService.update.mockResolvedValue(createMockFeedSource());

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      // First, trigger rating to open dialog
      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      // Then add keywords
      await act(async () => {
        await result.current.handleAddKeywords(["tech"]);
      });

      expect(mockedFeedSourcesService.update).toHaveBeenCalledWith(10, {
        good_keywords: ["existing", "tech"],
      });

      expect(mockedToast.success).toHaveBeenCalledWith(expect.stringContaining("Added 1 keyword"));
    });
  });

  describe("Session Keyword Tracking", () => {
    it("should track keywords added during session per source", async () => {
      const mockItem = createMockItem({ status: "ready_for_publish" });
      const mockItemWithKeywords = { ...mockItem, keywords: ["tech", "ai", "ml"] };

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);
      mockedFeedSourcesService.getById.mockResolvedValue(createMockFeedSource());
      mockedFeedSourcesService.update.mockResolvedValue(createMockFeedSource());

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      // First rating - should show all 3 keywords
      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      expect(result.current.keywordDialogData?.keywords).toHaveLength(3);

      // Add "tech" keyword
      await act(async () => {
        await result.current.handleAddKeywords(["tech"]);
      });

      // Close dialog
      act(() => {
        result.current.setKeywordDialogOpen(false);
      });

      // Second rating on same source - "tech" should be filtered out
      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      await waitFor(() => {
        expect(result.current.keywordDialogOpen).toBe(true);
      });

      // Should only show "ai" and "ml" now (tech was added in session)
      expect(result.current.keywordDialogData?.keywords).toEqual(["ai", "ml"]);
    });
  });

  describe("Callback Handling", () => {
    it("should call onRatingSuccess callback after rating", async () => {
      const mockItem = createMockItem();
      const mockItemWithKeywords = { ...mockItem, keywords: [] };
      const onRatingSuccess = jest.fn();

      mockedFeedItemsService.updateStatus.mockResolvedValue({
        ...mockItem,
        status: "ready_for_publish",
      });
      mockedFeedItemsService.getWithKeywords.mockResolvedValue(mockItemWithKeywords);

      const { result } = renderHook(() => useContentRating({ onRatingSuccess }), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      expect(onRatingSuccess).toHaveBeenCalledWith(mockItem, "up");
    });
  });

  describe("Error Handling", () => {
    it("should show error toast on rating failure", async () => {
      const mockItem = createMockItem();
      mockedFeedItemsService.updateStatus.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useContentRating(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.handleRating(mockItem, "up");
      });

      expect(mockedToast.error).toHaveBeenCalledWith(
        "Failed to update content rating. Please try again."
      );
    });
  });
});
