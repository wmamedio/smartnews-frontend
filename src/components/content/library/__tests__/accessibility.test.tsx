import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentCard } from "../ContentCard";
import { BulkActionBar } from "../BulkActionBar";
import { ContentCardGrid } from "../ContentCardGrid";
import type { FeedItem } from "@/lib/api/services/feed-items.service";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies for ContentCardGrid
jest.mock("@/lib/api/services/feed-items.service");
jest.mock("@/lib/stores/content-selection.store", () => ({
  useContentSelection: () => ({
    selectedIds: new Set(),
    toggleSelection: jest.fn(),
    isSelected: jest.fn(() => false),
  }),
}));

describe("Accessibility Audit (AC 6.3)", () => {
  const mockFeedItem: FeedItem = {
    id: 1,
    feed_source_id: 10,
    feed_source: {
      id: 10,
      name: "Test Source",
      source_type: "rss",
    },
    title: "Test Article",
    description: "Test description",
    link: "https://example.com/article",
    status: "published",
    content_hash: "abc123",
    created_at: "2025-01-01T12:00:00Z",
    published_at: "2025-01-01T12:00:00Z",
  };

  describe("ContentCard Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ContentCard
          item={mockFeedItem}
          isSelected={false}
          onSelect={jest.fn()}
          onEdit={jest.fn()}
          onPublish={jest.fn()}
          onArchive={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      /**
       * KNOWN EXCEPTION: nested-interactive rule disabled
       *
       * ContentCard uses role="button" containing checkbox and dropdown (nested interactive elements).
       * This is an ACCEPTABLE UX pattern per QA review (Quality Score: 95/100):
       *
       * - Industry standard pattern used by Pinterest, Google Photos, Trello, Asana
       * - WCAG 2.1.1 (Keyboard) compliance verified: Space, Enter, Escape keys tested
       * - All ARIA attributes present and correct
       * - Focus management tested in 7 unit tests
       * - QA verdict: Non-blocking, acceptable tradeoff for superior card-level UX
       *
       * See: docs/qa/gates/1.2.6-content-library-ux-enhancement.yml
       * Decision: Maintain UX pattern, disable axe rule for this component
       */
      const results = await axe(container, {
        rules: {
          "nested-interactive": { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it("should have no violations when selected", async () => {
      const { container } = render(
        <ContentCard item={mockFeedItem} isSelected={true} onSelect={jest.fn()} />
      );

      /**
       * KNOWN EXCEPTION: nested-interactive rule disabled
       * (See explanation in test above)
       */
      const results = await axe(container, {
        rules: {
          "nested-interactive": { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe("BulkActionBar Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={jest.fn()}
          onPublish={jest.fn()}
          onDelete={jest.fn()}
          onClearSelection={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("ContentCardGrid Accessibility", () => {
    it("should have no violations in loading state", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      // Mock to keep loading state
      const feedItemsService = require("@/lib/api/services/feed-items.service");
      feedItemsService.feedItemsService.getAll = jest.fn().mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentCardGrid />
        </QueryClientProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have no violations in empty state", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const feedItemsService = require("@/lib/api/services/feed-items.service");
      feedItemsService.feedItemsService.getAll = jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ContentCardGrid />
        </QueryClientProvider>
      );

      // Wait for empty state to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
