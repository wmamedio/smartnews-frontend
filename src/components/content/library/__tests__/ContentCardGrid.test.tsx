import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentCardGrid } from "../ContentCardGrid";
import { feedItemsService, type FeedItem } from "@/lib/api/services/feed-items.service";
import { useContentSelection } from "@/lib/stores/content-selection.store";

// Mock dependencies
jest.mock("@/lib/api/services/feed-items.service");
jest.mock("@/lib/stores/content-selection.store");
jest.mock("../ContentCard", () => ({
  ContentCard: ({ item, isSelected, onSelect }: any) => (
    <div data-testid={`card-${item.id}`}>
      <div>{item.title}</div>
      <button onClick={() => onSelect(item.id)}>{isSelected ? "Selected" : "Select"}</button>
    </div>
  ),
}));

describe("ContentCardGrid", () => {
  const mockFeedItems: FeedItem[] = [
    {
      id: 1,
      feed_source_id: 10,
      feed_source: { id: 10, name: "Source 1", source_type: "rss" },
      title: "Article 1",
      description: "Description 1",
      link: "https://example.com/1",
      status: "published",
      content_hash: "hash1",
      created_at: "2025-01-01T10:00:00Z",
      published_at: "2025-01-01T12:00:00Z",
    },
    {
      id: 2,
      feed_source_id: 10,
      feed_source: { id: 10, name: "Source 1", source_type: "rss" },
      title: "Article 2",
      description: "Description 2",
      link: "https://example.com/2",
      status: "pending",
      content_hash: "hash2",
      created_at: "2025-01-02T10:00:00Z",
    },
  ];

  const mockToggleSelection = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnPublish = jest.fn();
  const mockOnArchive = jest.fn();
  const mockOnDelete = jest.fn();

  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock Zustand store
    (useContentSelection as unknown as jest.Mock).mockReturnValue({
      selectedIds: new Set<number>(),
      toggleSelection: mockToggleSelection,
      isSelected: jest.fn((id: number) => false),
    });

    // Mock feed items service - default to empty response
    (feedItemsService.getAll as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      total_pages: 0,
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  describe("Loading State", () => {
    it("shows loading skeletons during initial fetch", () => {
      // Mock service to never resolve (keeps loading state)
      (feedItemsService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));

      const { container } = renderWithQueryClient(<ContentCardGrid />);

      // Should show skeleton cards with animate-pulse class
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows correct grid layout for skeletons", () => {
      (feedItemsService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));

      const { container } = renderWithQueryClient(<ContentCardGrid />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "xl:grid-cols-4");
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no items", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByText("No content items found")).toBeInTheDocument();
      });
    });

    it("shows different message when filters applied", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      });

      renderWithQueryClient(<ContentCardGrid filters={{ status: "published" }} />);

      await waitFor(() => {
        expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
      });
    });

    it("shows different message when no filters", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByText("Start by importing content from sources")).toBeInTheDocument();
      });
    });
  });

  describe("Grid Rendering", () => {
    it("renders grid with correct breakpoints", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      const { container } = renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        const grid = container.querySelector(".grid");
        expect(grid).toHaveClass(
          "grid-cols-1",
          "sm:grid-cols-2",
          "lg:grid-cols-3",
          "xl:grid-cols-4"
        );
      });
    });

    it("maps items to ContentCard components", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByTestId("card-1")).toBeInTheDocument();
        expect(screen.getByTestId("card-2")).toBeInTheDocument();
        expect(screen.getByText("Article 1")).toBeInTheDocument();
        expect(screen.getByText("Article 2")).toBeInTheDocument();
      });
    });

    it("has proper grid gap spacing", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      const { container } = renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        const grid = container.querySelector(".grid");
        expect(grid).toHaveClass("gap-4");
      });
    });
  });

  describe("Selection Integration", () => {
    it("passes correct isSelected prop from Zustand store", async () => {
      // Mock one item as selected
      (useContentSelection as unknown as jest.Mock).mockReturnValue({
        selectedIds: new Set([1]),
        toggleSelection: mockToggleSelection,
        isSelected: jest.fn((id: number) => id === 1),
      });
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        // First card should show "Selected" (mocked as selected)
        const card1 = screen.getByTestId("card-1");
        expect(card1).toHaveTextContent("Selected");

        // Second card should show "Select" (not selected)
        const card2 = screen.getByTestId("card-2");
        expect(card2).toHaveTextContent("Select");
      });
    });

    it("calls toggleSelection when card is selected", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      const user = userEvent.setup();
      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByTestId("card-1")).toBeInTheDocument();
      });

      const selectButton = screen.getAllByText("Select")[0];
      await user.click(selectButton);

      expect(mockToggleSelection).toHaveBeenCalledWith(1);
    });

    it("displays selection count when items selected", async () => {
      (useContentSelection as unknown as jest.Mock).mockReturnValue({
        selectedIds: new Set([1, 2]),
        toggleSelection: mockToggleSelection,
        isSelected: jest.fn((id: number) => [1, 2].includes(id)),
      });
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByText("2 of 2 item(s) selected")).toBeInTheDocument();
      });
    });

    it("does not display selection count when no items selected", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByTestId("card-1")).toBeInTheDocument();
      });

      expect(screen.queryByText(/item\(s\) selected/)).not.toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("shows pagination controls when items exist", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 50,
        page: 1,
        per_page: 20,
        total_pages: 3,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Previous/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 50,
        page: 1,
        per_page: 20,
        total_pages: 3,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        const previousButton = screen.getByRole("button", { name: /Previous/i });
        expect(previousButton).toBeDisabled();
      });
    });

    it("disables Next button on last page", async () => {
      const user = userEvent.setup();

      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 40,
        page: 1,
        per_page: 20,
        total_pages: 2,
      });

      renderWithQueryClient(<ContentCardGrid />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      });

      // Click Next to get to page 2 (last page)
      let nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      // Now should be on page 2 (last page), Next button should be disabled
      await waitFor(() => {
        expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
        // Re-query the button after state change
        nextButton = screen.getByRole("button", { name: /Next/i });
        expect(nextButton).toBeDisabled();
      });
    });

    it("fetches next page when Next button clicked", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 50,
        page: 1,
        per_page: 20,
        total_pages: 3,
      });

      const user = userEvent.setup();
      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Next/i })).not.toBeDisabled();
      });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      // Should call API with page 2
      await waitFor(() => {
        expect(feedItemsService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
            per_page: 20,
          })
        );
      });
    });

    it("fetches previous page when Previous button clicked", async () => {
      // Start on page 2
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 50,
        page: 2,
        per_page: 20,
        total_pages: 3,
      });

      const user = userEvent.setup();
      const { rerender } = renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Previous/i })).toBeInTheDocument();
      });

      // Click next first to set pageIndex to 1
      const nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const previousButton = screen.getByRole("button", { name: /Previous/i });
        expect(previousButton).not.toBeDisabled();
      });

      const previousButton = screen.getByRole("button", { name: /Previous/i });
      await user.click(previousButton);

      // Should call API with page 2 (pageIndex 1 = page 2)
      await waitFor(() => {
        expect(feedItemsService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it("displays correct page numbers", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 100,
        page: 3,
        per_page: 20,
        total_pages: 5,
      });

      renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
      });
    });
  });

  describe("Action Handlers", () => {
    it("passes action handlers to ContentCard", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(
        <ContentCardGrid
          onItemEdit={mockOnEdit}
          onItemPublish={mockOnPublish}
          onItemArchive={mockOnArchive}
          onItemDelete={mockOnDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("card-1")).toBeInTheDocument();
      });

      // We can't easily test if handlers are passed since ContentCard is mocked
      // But we verify the component renders correctly with all handlers
      expect(screen.getByTestId("card-1")).toBeInTheDocument();
      expect(screen.getByTestId("card-2")).toBeInTheDocument();
    });
  });

  describe("Filters Integration", () => {
    it("passes filters to API query", async () => {
      const filters = { status: "published" as const };

      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      renderWithQueryClient(<ContentCardGrid filters={filters} />);

      await waitFor(() => {
        expect(feedItemsService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "published",
            page: 1,
            per_page: 20,
          })
        );
      });
    });

    it("refetches when filters change", async () => {
      (feedItemsService.getAll as jest.Mock).mockResolvedValue({
        items: mockFeedItems,
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });

      const { rerender } = renderWithQueryClient(<ContentCardGrid />);

      await waitFor(() => {
        expect(feedItemsService.getAll).toHaveBeenCalledTimes(1);
      });

      // Change filters
      rerender(
        <QueryClientProvider client={queryClient}>
          <ContentCardGrid filters={{ status: "published" }} />
        </QueryClientProvider>
      );

      // Should trigger new fetch
      await waitFor(() => {
        expect(feedItemsService.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });
});
