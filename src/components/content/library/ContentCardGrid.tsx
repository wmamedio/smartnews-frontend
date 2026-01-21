"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feedItemsService,
  type FeedItem,
  type FeedItemFilters,
} from "@/lib/api/services/feed-items.service";
import { useContentSelection } from "@/lib/stores/content-selection.store";
import { ContentCard } from "./ContentCard";
import { KeywordRefinementDialog } from "@/components/content/preview/KeywordRefinementDialog";
import { ContentPreviewModal } from "@/components/creator/content/ContentPreviewModal";
import { useContentRating } from "@/hooks/useContentRating";

interface ContentCardGridProps {
  filters?: FeedItemFilters;
  onItemEdit?: (item: FeedItem) => void;
  onItemPublish?: (item: FeedItem) => void;
  onItemArchive?: (item: FeedItem) => void;
  onItemDelete?: (item: FeedItem) => void;
  showSourceBadge?: boolean; // Show source name badge on cards
  // Controlled pagination props
  page?: number; // 1-indexed page number from URL
  onPageChange?: (page: number) => void; // Callback when page changes
}

export function ContentCardGrid({
  filters,
  onItemEdit,
  onItemPublish,
  onItemArchive,
  onItemDelete,
  showSourceBadge = false,
  page,
  onPageChange,
}: ContentCardGridProps) {
  const queryClient = useQueryClient();
  const pageSize = 20;

  // Use controlled pagination if props provided, otherwise internal state
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = page ?? internalPage;

  const setCurrentPage = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Use Zustand selection store
  const { selectedIds, toggleSelection } = useContentSelection();

  // Hover state for rating buttons
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  // Content rating hook - centralizes all rating logic
  const {
    handleRating,
    handleAddKeywords,
    keywordDialogOpen,
    setKeywordDialogOpen,
    keywordDialogData,
  } = useContentRating({
    isLibraryContext: true,
    invalidateQueryKeys: [["feed-items"]],
  });

  // Preview modal state (Story 1.6.2)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<FeedItem | null>(null);

  // Handle preview modal open
  const handlePreview = (item: FeedItem) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Reset to page 1 when filters change (only for internal pagination)
  const prevFiltersRef = React.useRef<string | undefined>(undefined);
  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    if (prevFiltersRef.current !== undefined && prevFiltersRef.current !== filtersString) {
      // Only reset internal page if not controlled
      if (!onPageChange) {
        setInternalPage(1);
      }
    }
    prevFiltersRef.current = filtersString;
  }, [filtersString, onPageChange]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "feed-items",
      filters?.search,
      filters?.status,
      filters?.feed_id,
      filters?.feed_source_id,
      filters?.source_type,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      feedItemsService.getAll({
        ...filters,
        page: currentPage,
        per_page: pageSize,
      }),
  });

  const handleSelect = (id: number) => {
    toggleSelection(id);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (data && currentPage < data.total_pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Prefetch adjacent pages on hover for instant navigation
  const prefetchPage = (pageNum: number) => {
    if (pageNum < 1 || (data && pageNum > data.total_pages)) return;

    queryClient.prefetchQuery({
      queryKey: [
        "feed-items",
        filters?.search,
        filters?.status,
        filters?.feed_id,
        filters?.feed_source_id,
        filters?.source_type,
        pageNum,
        pageSize,
      ],
      queryFn: () =>
        feedItemsService.getAll({
          ...filters,
          page: pageNum,
          per_page: pageSize,
        }),
      staleTime: 30000, // Consider fresh for 30 seconds
    });
  };

  const handlePrefetchPrevious = () => {
    if (currentPage > 1) {
      prefetchPage(currentPage - 1);
    }
  };

  const handlePrefetchNext = () => {
    if (data && currentPage < data.total_pages) {
      prefetchPage(currentPage + 1);
    }
  };

  const canPreviousPage = currentPage > 1;
  const canNextPage = data ? currentPage < data.total_pages : false;
  const totalPages = data?.total_pages || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No content items found</h3>
        <p className="text-sm text-muted-foreground">
          {filters ? "Try adjusting your filters" : "Start by importing content from sources"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Card Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <ContentCard
                item={item}
                isSelected={selectedIds.has(item.id)}
                onSelect={handleSelect}
                onEdit={onItemEdit}
                onPublish={onItemPublish}
                onArchive={onItemArchive}
                onDelete={onItemDelete}
                enableRating={true}
                isHovered={hoveredItemId === item.id}
                onThumbsUp={() => handleRating(item, "up")}
                onThumbsDown={() => handleRating(item, "down")}
                showSourceBadge={showSourceBadge}
                onPreview={handlePreview}
              />
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.size > 0 && (
              <span>
                {selectedIds.size} of {data.items.length} item(s) selected
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              onMouseEnter={handlePrefetchPrevious}
              onFocus={handlePrefetchPrevious}
              disabled={!canPreviousPage}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              onMouseEnter={handlePrefetchNext}
              onFocus={handlePrefetchNext}
              disabled={!canNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Keyword Refinement Dialog */}
      {keywordDialogData && (
        <KeywordRefinementDialog
          open={keywordDialogOpen}
          onOpenChange={setKeywordDialogOpen}
          keywords={keywordDialogData.keywords}
          mode={keywordDialogData.mode}
          onAddKeywords={handleAddKeywords}
          sourceName={keywordDialogData.sourceName}
          isLibraryContext={true}
        />
      )}

      {/* Content Preview Modal (Story 1.6.2) */}
      <ContentPreviewModal
        item={previewItem}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        enableRating={true}
        onThumbsUp={
          previewItem
            ? () => {
                handleRating(previewItem, "up");
                setPreviewModalOpen(false);
              }
            : undefined
        }
        onThumbsDown={
          previewItem
            ? () => {
                handleRating(previewItem, "down");
                setPreviewModalOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}
