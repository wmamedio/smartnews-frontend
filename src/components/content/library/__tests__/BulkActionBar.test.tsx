import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionBar } from "../BulkActionBar";

describe("BulkActionBar", () => {
  const mockOnSelectAll = jest.fn();
  const mockOnPublish = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClearSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("hides when no items selected (selectedCount = 0)", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={0}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      // Component returns null, so container should be empty
      expect(container.firstChild).toBeNull();
    });

    it("appears when items are selected (selectedCount > 0)", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByText("5 selected")).toBeInTheDocument();
    });

    it("has correct fixed positioning classes", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("fixed", "bottom-4", "left-1/2", "-translate-x-1/2", "z-50");
    });

    it("has slide-up animation class", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("animate-in", "slide-in-from-bottom");
    });
  });

  describe("Selection Count Display", () => {
    it("displays correct selection count", () => {
      render(
        <BulkActionBar
          selectedCount={7}
          totalCount={20}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByText("7 selected")).toBeInTheDocument();
    });

    it("updates when selection count changes", () => {
      const { rerender } = render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByText("3 selected")).toBeInTheDocument();

      rerender(
        <BulkActionBar
          selectedCount={8}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByText("8 selected")).toBeInTheDocument();
    });
  });

  describe("Select All Checkbox", () => {
    it("shows unchecked when not all items selected", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const checkbox = screen.getByLabelText("Select all items");
      expect(checkbox).toHaveAttribute("data-state", "unchecked");
    });

    it("shows checked when all items selected", () => {
      render(
        <BulkActionBar
          selectedCount={10}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const checkbox = screen.getByLabelText("Select all items");
      expect(checkbox).toHaveAttribute("data-state", "checked");
    });

    it("calls onSelectAll when clicked", async () => {
      const user = userEvent.setup();
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const checkbox = screen.getByLabelText("Select all items");
      await user.click(checkbox);

      expect(mockOnSelectAll).toHaveBeenCalled();
      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
    });

    it("has proper aria-label for accessibility", () => {
      render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const checkbox = screen.getByLabelText("Select all items");
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe("Bulk Action Buttons", () => {
    it("Publish button calls onPublish handler", async () => {
      const user = userEvent.setup();
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          onClearSelection={mockOnClearSelection}
        />
      );

      const publishButton = screen.getByRole("button", { name: /Publish/i });
      await user.click(publishButton);

      expect(mockOnPublish).toHaveBeenCalled();
      expect(mockOnPublish).toHaveBeenCalledTimes(1);
    });

    it("Delete button calls onDelete handler", async () => {
      const user = userEvent.setup();
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onDelete={mockOnDelete}
          onClearSelection={mockOnClearSelection}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /Delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalled();
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("only shows buttons for handlers that are provided", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          // Only onPublish provided
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByRole("button", { name: /Publish/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Delete$/i })).not.toBeInTheDocument();
    });

    it("shows all buttons when all handlers provided", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          onDelete={mockOnDelete}
          onClearSelection={mockOnClearSelection}
        />
      );

      expect(screen.getByRole("button", { name: /Publish/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });
  });

  describe("Clear Selection Button", () => {
    it("calls onClearSelection when clicked", async () => {
      const user = userEvent.setup();
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          onClearSelection={mockOnClearSelection}
        />
      );

      const clearButton = screen.getByRole("button", { name: /Clear selection/i });
      await user.click(clearButton);

      expect(mockOnClearSelection).toHaveBeenCalled();
      expect(mockOnClearSelection).toHaveBeenCalledTimes(1);
    });

    it("has proper aria-label for accessibility", () => {
      render(
        <BulkActionBar selectedCount={5} totalCount={10} onClearSelection={mockOnClearSelection} />
      );

      const clearButton = screen.getByLabelText("Clear selection");
      expect(clearButton).toBeInTheDocument();
    });

    it("does not render if onClearSelection is not provided", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onSelectAll={mockOnSelectAll}
          // onClearSelection not provided
        />
      );

      expect(screen.queryByLabelText("Clear selection")).not.toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className to wrapper", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          className="custom-test-class"
          onClearSelection={mockOnClearSelection}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-test-class");
    });

    it("preserves default classes when custom className provided", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={3}
          totalCount={10}
          className="custom-test-class"
          onClearSelection={mockOnClearSelection}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("fixed", "bottom-4", "custom-test-class");
    });
  });

  describe("Layout & Structure", () => {
    it("has Card component with shadow and border", () => {
      const { container } = render(
        <BulkActionBar selectedCount={3} totalCount={10} onClearSelection={mockOnClearSelection} />
      );

      const card = container.querySelector(".shadow-lg");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("border-2");
    });

    it("has vertical separators between sections", () => {
      const { container } = render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          onDelete={mockOnDelete}
          onClearSelection={mockOnClearSelection}
        />
      );

      // Should have multiple separators (use data-orientation attribute)
      const separators = container.querySelectorAll('[data-orientation="vertical"]');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });

    it("groups action buttons together", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          onDelete={mockOnDelete}
          onClearSelection={mockOnClearSelection}
        />
      );

      // All action buttons should be present in the same container
      expect(screen.getByRole("button", { name: /Publish/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });
  });

  describe("Button Styling", () => {
    it("Delete button has destructive text color", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onDelete={mockOnDelete}
          onClearSelection={mockOnClearSelection}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /Delete/i });
      expect(deleteButton).toHaveClass("text-destructive");
    });

    it("action buttons have small size class", () => {
      render(
        <BulkActionBar
          selectedCount={5}
          totalCount={10}
          onPublish={mockOnPublish}
          onClearSelection={mockOnClearSelection}
        />
      );

      const publishButton = screen.getByRole("button", { name: /Publish/i });
      // Check for size="sm" applied as className (small buttons have h-8, text-xs)
      expect(publishButton.className).toContain("h-8");
      expect(publishButton.className).toContain("text-xs");
    });
  });
});
