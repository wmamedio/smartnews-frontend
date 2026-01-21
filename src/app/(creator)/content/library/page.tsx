"use client";

import * as React from "react";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentGrid } from "@/components/content/library/ContentGrid";
import { ContentCardGrid } from "@/components/content/library/ContentCardGrid";
import {
  ContentFilters,
  type ContentFilterState,
} from "@/components/content/library/ContentFilters";
import { BulkActionBar } from "@/components/content/library/BulkActionBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  feedItemsService,
  type FeedItemFilters,
  type FeedItemStatus,
} from "@/lib/api/services/feed-items.service";
import { useContentSelection } from "@/lib/stores/content-selection.store";
import { toast } from "sonner";
import { AddSourceWizard } from "@/components/content/sources/AddSourceWizard";
import { NoFeedsAlert } from "@/components/content/NoFeedsAlert";
import { useCreatorFeeds } from "@/hooks/useCreatorFeeds";

function ContentLibraryPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize page from URL params
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  // Initialize filters from URL params immediately using lazy initializer
  const [filters, setFilters] = useState<ContentFilterState>(() => {
    const initialFilters: ContentFilterState = {};

    const feedIdParam = searchParams.get("feed_id");
    if (feedIdParam) {
      initialFilters.feed_id = parseInt(feedIdParam, 10);
    }

    const feedSourceIdParam = searchParams.get("feed_source_id");
    if (feedSourceIdParam) {
      initialFilters.feed_source_id = parseInt(feedSourceIdParam, 10);
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      initialFilters.status = statusParam as FeedItemStatus;
    }

    const searchParam = searchParams.get("search");
    if (searchParam) {
      initialFilters.search = searchParam;
    }

    return initialFilters;
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addContentDialogOpen, setAddContentDialogOpen] = useState(false);
  const [noFeedsAlertOpen, setNoFeedsAlertOpen] = useState(false);

  // Check if user has feeds
  const { hasFeeds, isLoading: isLoadingFeeds } = useCreatorFeeds();

  // Selection store
  const { selectedIds, selectAll, clearSelection } = useContentSelection();

  // Handle page change - update URL
  const handlePageChange = React.useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);

      // Update URL with new page
      const params = new URLSearchParams(searchParams.toString());
      if (newPage === 1) {
        params.delete("page"); // Don't show page=1 in URL
      } else {
        params.set("page", newPage.toString());
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Update filters and page when URL params change
  useEffect(() => {
    const newFilters: ContentFilterState = {};

    const feedIdParam = searchParams.get("feed_id");
    if (feedIdParam) {
      newFilters.feed_id = parseInt(feedIdParam, 10);
    }

    const feedSourceIdParam = searchParams.get("feed_source_id");
    if (feedSourceIdParam) {
      newFilters.feed_source_id = parseInt(feedSourceIdParam, 10);
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      newFilters.status = statusParam as FeedItemStatus;
    }

    const searchParam = searchParams.get("search");
    if (searchParam) {
      newFilters.search = searchParam;
    }

    // Update page from URL
    const pageParam = searchParams.get("page");
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }

    // Only update if filters have actually changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);

    if (filtersChanged) {
      setFilters(newFilters);
      // Reset to page 1 when filters change
      if (currentPage !== 1) {
        handlePageChange(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("content-view");
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem("content-view", viewMode);
  }, [viewMode]);

  // Escape key clears selection (AC 5.2)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) {
        clearSelection();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedIds.size, clearSelection]);

  // Memoize API filters to prevent unnecessary re-renders and pagination resets
  const apiFilters = useMemo(() => {
    const converted: FeedItemFilters = {};

    if (filters.search) {
      converted.search = filters.search;
    }

    if (filters.status) {
      converted.status = filters.status;
    }

    if (filters.feed_id) {
      converted.feed_id = filters.feed_id;
    }

    if (filters.feed_source_id) {
      converted.feed_source_id = filters.feed_source_id;
    }

    if (filters.source_type) {
      converted.source_type = filters.source_type;
    }

    // Note: date_range filter would need backend support to be fully functional

    return converted;
  }, [
    filters.search,
    filters.status,
    filters.feed_id,
    filters.feed_source_id,
    filters.source_type,
  ]);

  // Fetch items for select all functionality
  const { data: itemsData } = useQuery({
    queryKey: [
      "feed-items",
      apiFilters.search,
      apiFilters.status,
      apiFilters.feed_id,
      apiFilters.feed_source_id,
      apiFilters.source_type,
      1,
      20,
    ],
    queryFn: () =>
      feedItemsService.getAll({
        ...apiFilters,
        page: 1,
        per_page: 20,
      }),
  });

  // Check if all selected items are published or ready_for_publish
  const selectedItemsStatus = React.useMemo(() => {
    if (!itemsData?.items || selectedIds.size === 0) return "mixed";

    const selectedItems = itemsData.items.filter((item) => selectedIds.has(item.id));
    const allPublished = selectedItems.every(
      (item) => item.status === "published" || item.status === "ready_for_publish"
    );
    const allUnpublished = selectedItems.every(
      (item) => item.status !== "published" && item.status !== "ready_for_publish"
    );

    if (allPublished) return "published";
    if (allUnpublished) return "unpublished";
    return "mixed";
  }, [itemsData, selectedIds]);

  const bulkPublishMutation = useMutation({
    mutationFn: (itemIds: number[]) => feedItemsService.bulkPublish(itemIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      toast.success(`Successfully marked ${data.updated_count} items as ready for publish`);
      clearSelection();
    },
    onError: (error: any) => {
      console.error("Bulk publish error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to mark items as ready for publish";
      toast.error(errorMsg);
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: (itemIds: number[]) => feedItemsService.bulkArchive(itemIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      toast.success(`Successfully archived ${data.updated_count} items`);
      clearSelection();
    },
    onError: (error: any) => {
      console.error("Bulk archive error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to archive items";
      toast.error(errorMsg);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      await Promise.all(itemIds.map((id) => feedItemsService.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      toast.success(`Successfully deleted ${selectedIds.size} items`);
      clearSelection();
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete items");
    },
  });

  const handleSelectAll = () => {
    if (itemsData?.items) {
      const allIds = itemsData.items.map((item) => item.id);
      if (selectedIds.size === allIds.length) {
        clearSelection();
      } else {
        selectAll(allIds);
      }
    }
  };

  const handlePublish = () => {
    if (selectedItemsStatus === "published") {
      // If items are published, unpublish them (archive)
      bulkArchiveMutation.mutate(Array.from(selectedIds));
    } else {
      // Otherwise, publish them
      bulkPublishMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Content Library</h2>
            <p className="text-muted-foreground">Browse and manage all imported content items</p>
          </div>
          <Button
            onClick={() => {
              if (!hasFeeds) {
                setNoFeedsAlertOpen(true);
              } else {
                setAddContentDialogOpen(true);
              }
            }}
            disabled={isLoadingFeeds}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>

        {/* Filters Bar */}
        <ContentFilters
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Content Display */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            {viewMode === "grid" ? (
              <ContentCardGrid
                filters={apiFilters}
                showSourceBadge={!filters.feed_source_id}
                page={currentPage}
                onPageChange={handlePageChange}
              />
            ) : (
              <ContentGrid filters={apiFilters} />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={itemsData?.items.length || 0}
        selectedItemsStatus={selectedItemsStatus}
        onSelectAll={handleSelectAll}
        onPublish={handlePublish}
        onDelete={handleDelete}
        onClearSelection={clearSelection}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected item(s). This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Content Dialog */}
      <AddSourceWizard
        open={addContentDialogOpen}
        onOpenChange={setAddContentDialogOpen}
        onSourceCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["feed-items"] });
        }}
      />

      {/* No Feeds Alert - shown when user tries to add content without feeds */}
      <NoFeedsAlert
        open={noFeedsAlertOpen}
        onOpenChange={setNoFeedsAlertOpen}
        actionType="add-content"
      />
    </>
  );
}

export default function ContentLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ContentLibraryPageContent />
    </Suspense>
  );
}
