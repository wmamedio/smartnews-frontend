import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentCard } from "../ContentCard";
import type { FeedItem } from "@/lib/api/services/feed-items.service";

// Mock the date-fns format function
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, formatStr: string) => "Jan 1, 2025"),
}));

describe("ContentCard", () => {
  const mockItem: FeedItem = {
    id: 1,
    feed_source_id: 10,
    feed_source: {
      id: 10,
      name: "Test Source",
      source_type: "rss",
    },
    title: "Test Article Title",
    description: "This is a test article description that should be clamped to two lines",
    link: "https://example.com/article",
    thumbnail: "https://example.com/thumbnail.jpg",
    status: "published",
    content_hash: "abc123",
    created_at: "2025-01-01T12:00:00Z",
    published_at: "2025-01-01T12:00:00Z",
  };

  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnPublish = jest.fn();
  const mockOnArchive = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with all props correctly", () => {
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onPublish={mockOnPublish}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
        />
      );

      // Title and description
      expect(screen.getByText("Test Article Title")).toBeInTheDocument();
      expect(screen.getByText(/This is a test article description/)).toBeInTheDocument();

      // Status badge
      expect(screen.getByText("published")).toBeInTheDocument();

      // Date (mocked)
      expect(screen.getByText("Jan 1, 2025")).toBeInTheDocument();

      // Checkbox
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("shows placeholder icon when no thumbnail", () => {
      const itemWithoutThumbnail = { ...mockItem, thumbnail: undefined };

      const { container } = render(
        <ContentCard item={itemWithoutThumbnail} isSelected={false} onSelect={mockOnSelect} />
      );

      // FileText icon should be present (Lucide icons render as SVG)
      const placeholder = container.querySelector(".text-muted-foreground\\/30");
      expect(placeholder).toBeInTheDocument();
    });

    it("displays thumbnail image when provided", () => {
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const image = screen.getByAltText("Test Article Title");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/thumbnail.jpg");
      expect(image).toHaveAttribute("loading", "lazy");
    });

    it("renders with correct status badge variants", () => {
      const statuses: Array<{ status: string; testId: string }> = [
        { status: "published", testId: "published" },
        { status: "pending", testId: "pending" },
        { status: "archived", testId: "archived" },
      ];

      statuses.forEach(({ status }) => {
        const itemWithStatus = { ...mockItem, status } as FeedItem;
        const { rerender } = render(
          <ContentCard item={itemWithStatus} isSelected={false} onSelect={mockOnSelect} />
        );

        expect(screen.getByText(status)).toBeInTheDocument();
        rerender(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);
      });
    });

    it("handles missing description gracefully", () => {
      const itemWithoutDescription = { ...mockItem, description: undefined };

      render(
        <ContentCard item={itemWithoutDescription} isSelected={false} onSelect={mockOnSelect} />
      );

      expect(screen.getByText("Test Article Title")).toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("checkbox toggles selection when clicked", async () => {
      const user = userEvent.setup();
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(mockOnSelect).toHaveBeenCalledWith(1);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it("shows ring highlight when selected", () => {
      const { container } = render(
        <ContentCard item={mockItem} isSelected={true} onSelect={mockOnSelect} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("ring-2", "ring-primary", "ring-offset-2");
    });

    it("checkbox has proper aria-label", () => {
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const checkbox = screen.getByLabelText("Select Test Article Title");
      expect(checkbox).toBeInTheDocument();
    });

    it("card click triggers selection", async () => {
      const user = userEvent.setup();
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      // Click on the card (not on checkbox or dropdown)
      const cardTitle = screen.getByText("Test Article Title");
      await user.click(cardTitle);

      expect(mockOnSelect).toHaveBeenCalledWith(1);
    });
  });

  describe("Keyboard Navigation (AC 5.2)", () => {
    it("Space key toggles selection", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />
      );

      const card = container.firstChild as HTMLElement;
      card.focus();

      await user.keyboard(" ");

      expect(mockOnSelect).toHaveBeenCalledWith(1);
    });

    it("Enter key opens dropdown menu", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const card = container.firstChild as HTMLElement;
      card.focus();

      await user.keyboard("{Enter}");

      // Dropdown menu should be visible
      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

    it("card is keyboard focusable", () => {
      const { container } = render(
        <ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute("tabIndex", "0");
      expect(card).toHaveAttribute("role", "button");
    });

    it("shows focus ring when focused", () => {
      const { container } = render(
        <ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />
      );

      const card = container.firstChild as HTMLElement;
      card.focus();

      // Should have focus styles
      expect(card).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-ring");
    });

    it("has correct aria-pressed state", () => {
      const { container, rerender } = render(
        <ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />
      );

      let card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute("aria-pressed", "false");

      rerender(<ContentCard item={mockItem} isSelected={true} onSelect={mockOnSelect} />);

      card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Dropdown Menu", () => {
    it("dropdown menu opens and shows Edit action", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      // Find and click the dropdown trigger (using button role)
      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      // Menu should be visible
      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

    it("Edit action calls onEdit handler", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      const editButton = await screen.findByText("Edit");
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
    });

    it("Publish action calls onPublish handler", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onPublish={mockOnPublish}
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      const publishButton = await screen.findByText("Publish");
      await user.click(publishButton);

      expect(mockOnPublish).toHaveBeenCalledWith(mockItem);
    });

    it("Archive action calls onArchive handler", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onArchive={mockOnArchive}
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      const archiveButton = await screen.findByText("Archive");
      await user.click(archiveButton);

      expect(mockOnArchive).toHaveBeenCalledWith(mockItem);
    });

    it("Delete action calls onDelete handler", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      const deleteButton = await screen.findByText("Delete");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockItem);
    });

    it("only shows actions that have handlers provided", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          // Only onEdit provided
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      await waitFor(() => {
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });

      // Other actions should not be present
      expect(screen.queryByText("Publish")).not.toBeInTheDocument();
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("dropdown trigger is hidden by default and visible on hover", () => {
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });

      // Should have opacity-0 class (hidden by default)
      expect(dropdownTrigger).toHaveClass("opacity-0");

      // Should have group-hover:opacity-100 class (visible on hover)
      expect(dropdownTrigger).toHaveClass("group-hover:opacity-100");
    });
  });

  describe("Hover Effects", () => {
    it("image scales on hover (via CSS class)", () => {
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const image = screen.getByAltText("Test Article Title");

      // Should have hover scale class
      expect(image).toHaveClass("group-hover:scale-105");
    });
  });

  describe("Event Handling", () => {
    it("does not trigger selection when clicking checkbox directly", async () => {
      const user = userEvent.setup();
      render(<ContentCard item={mockItem} isSelected={false} onSelect={mockOnSelect} />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Should only be called once from checkbox click, not from card click
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it("does not trigger selection when clicking dropdown button", async () => {
      const user = userEvent.setup();
      render(
        <ContentCard
          item={mockItem}
          isSelected={false}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const dropdownTrigger = screen.getByRole("button", { name: /Open actions menu/i });
      await user.click(dropdownTrigger);

      // onSelect should not be called when clicking dropdown
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });
});
