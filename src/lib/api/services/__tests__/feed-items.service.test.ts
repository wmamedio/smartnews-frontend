import { feedItemsService, type FeedItem } from "../feed-items.service";
import apiClient from "../../client";

jest.mock("../../client");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("FeedItemsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch paginated feed items", async () => {
      const mockResponse = {
        items: [
          {
            id: 1,
            feed_source_id: 1,
            title: "Test Article",
            description: "Test description",
            link: "https://example.com/article",
            feed_source: { id: 1, name: "Test Source", source_type: "rss" },
            status: "pending" as const,
            content_hash: "hash123",
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await feedItemsService.getAll({ page: 1, per_page: 20 });

      expect(mockedApiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it("should include filters in query params", async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      await feedItemsService.getAll({
        search: "test",
        status: "published",
        feed_source_id: 1,
      });

      const callArgs = mockedApiClient.get.mock.calls[0][0] as string;
      expect(callArgs).toContain("search=test");
      expect(callArgs).toContain("status=published");
      expect(callArgs).toContain("feed_source_id=1");
    });
  });

  describe("create", () => {
    it("should create a new feed item", async () => {
      const newItem = {
        feed_source_id: 1,
        title: "New Article",
        description: "New description",
        link: "https://example.com/new",
      };

      const createdItem: FeedItem = {
        ...newItem,
        id: 1,
        feed_source: { id: 1, name: "Test Source", source_type: "rss" },
        status: "pending",
        content_hash: "hash123",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      mockedApiClient.post.mockResolvedValue({ data: createdItem });

      const result = await feedItemsService.create(newItem);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/source-items/", newItem);
      expect(result).toEqual(createdItem);
    });
  });

  // Removed createBulk test - method doesn't exist on backend

  describe("bulkAction", () => {
    it("should perform bulk action on items", async () => {
      const bulkData = {
        item_ids: [1, 2, 3],
        action: "publish" as const,
      };

      const mockResponse = {
        success: true,
        updated_count: 3,
        message: "Items published successfully",
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await feedItemsService.bulkAction(bulkData);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/source-items/bulk-action", bulkData);
      expect(result).toEqual(mockResponse);
    });
  });
});
