import { feedSourcesService, type FeedSource } from "../feed-sources.service";
import apiClient from "../../client";

jest.mock("../../client");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("FeedSourcesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all feed sources", async () => {
      const mockSources: FeedSource[] = [
        {
          id: 1,
          source_type: "rss",
          name: "Test RSS Feed",
          configuration: { url: "https://example.com/feed.xml" },
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          item_count: 10,
        },
        {
          id: 2,
          source_type: "manual_url",
          name: "Manual URL Source",
          configuration: { url: "https://example.com" },
          is_active: true,
          created_at: "2025-01-02T00:00:00Z",
          item_count: 5,
        },
      ];

      mockedApiClient.get.mockResolvedValue({ data: mockSources });

      const result = await feedSourcesService.getAll();

      expect(mockedApiClient.get).toHaveBeenCalledWith("/feed-sources/");
      expect(result).toEqual(mockSources);
    });
  });

  describe("getById", () => {
    it("should fetch a single feed source by ID", async () => {
      const mockSource: FeedSource = {
        id: 1,
        source_type: "rss",
        name: "Test Feed",
        configuration: { url: "https://example.com/feed.xml" },
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        item_count: 20,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockSource });

      const result = await feedSourcesService.getById(1);

      expect(mockedApiClient.get).toHaveBeenCalledWith("/feed-sources/1");
      expect(result).toEqual(mockSource);
    });
  });

  describe("create", () => {
    it("should create a new feed source", async () => {
      const newSource = {
        source_type: "rss" as const,
        name: "New Feed",
        configuration: { url: "https://example.com/feed.xml" },
      };

      const createdSource: FeedSource = {
        id: 1,
        source_type: "rss",
        name: "New Feed",
        configuration: { url: "https://example.com/feed.xml" },
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        item_count: 0,
      };

      mockedApiClient.post.mockResolvedValue({ data: createdSource });

      const result = await feedSourcesService.create(newSource);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/feed-sources/", newSource);
      expect(result).toEqual(createdSource);
    });
  });

  describe("update", () => {
    it("should update an existing feed source", async () => {
      const updateData = {
        name: "Updated Feed Name",
        is_active: false,
      };

      const updatedSource: FeedSource = {
        id: 1,
        source_type: "rss",
        name: "Updated Feed Name",
        configuration: { url: "https://example.com/feed.xml" },
        is_active: false,
        created_at: "2025-01-01T00:00:00Z",
        item_count: 15,
      };

      mockedApiClient.put.mockResolvedValue({ data: updatedSource });

      const result = await feedSourcesService.update(1, updateData);

      expect(mockedApiClient.put).toHaveBeenCalledWith("/feed-sources/1", updateData);
      expect(result).toEqual(updatedSource);
    });
  });

  describe("delete", () => {
    it("should delete a feed source", async () => {
      mockedApiClient.delete.mockResolvedValue({ data: {} });

      await feedSourcesService.delete(1);

      expect(mockedApiClient.delete).toHaveBeenCalledWith("/feed-sources/1");
    });
  });

  describe("pullContent", () => {
    it("should trigger content pull from a feed source", async () => {
      const mockResponse = {
        task_id: "task-123",
        status: "started",
        message: "Content import started",
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await feedSourcesService.pullContent(1);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/source-items/1/pull", null, {
        params: { async_mode: true },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
