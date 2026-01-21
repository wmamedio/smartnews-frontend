"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Tag,
  X,
  LayoutGrid,
  List,
  BookOpen,
  Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

import type { FeedItemStatus } from "@/lib/api/services/feed-items.service";
import type { SourceType, FeedSource } from "@/lib/api/services/feed-sources.service";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { AVAILABLE_SOURCE_TYPES, getSourceTypeLabel } from "@/lib/config/source-types";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import type { Feed } from "@/lib/types/feed";

export interface ContentFilterState {
  search?: string;
  status?: FeedItemStatus;
  source_type?: SourceType;
  date_range?: "today" | "week" | "month" | "all";
  feed_id?: number; // Story 1.3.5: Filter by feed
  feed_source_id?: number; // Filter by feed source
}

interface ContentFiltersProps {
  filters: ContentFilterState;
  onFiltersChange: (filters: ContentFilterState) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export function ContentFilters({
  filters,
  onFiltersChange,
  viewMode = "grid",
  onViewModeChange,
}: ContentFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feedSources, setFeedSources] = useState<FeedSource[]>([]);

  // Sync searchInput with filters.search when it changes externally (e.g., from URL params)
  useEffect(() => {
    if (filters.search !== undefined && filters.search !== searchInput) {
      setSearchInput(filters.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Story 1.3.5: Fetch feeds for filter dropdown
  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const response = await fetchCreatorFeeds({ limit: 100 });
        // Sort feeds alphabetically by name
        const sortedFeeds = (response.feeds || []).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );
        setFeeds(sortedFeeds);
      } catch (error) {
        console.error("Failed to fetch feeds:", error);
      }
    };
    loadFeeds();
  }, []);

  // Fetch feed sources for filter dropdown (excluding manual_url - single content)
  useEffect(() => {
    const loadFeedSources = async () => {
      try {
        const sources = await feedSourcesService.getAll();
        // Filter out manual_url (single content) and sort alphabetically by name
        const sortedSources = sources
          .filter((source) => source.source_type !== "manual_url")
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
        setFeedSources(sortedSources);
      } catch (error) {
        console.error("Failed to fetch feed sources:", error);
      }
    };
    loadFeedSources();
  }, []);

  // Debounce search input (300ms) and trim whitespace
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      if (trimmedSearch !== filters.search) {
        onFiltersChange({ ...filters, search: trimmedSearch || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleStatusFilter = (status?: FeedItemStatus) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSourceFilter = (source_type?: SourceType) => {
    onFiltersChange({ ...filters, source_type });
  };

  const handleDateRangeFilter = (date_range?: "today" | "week" | "month" | "all") => {
    onFiltersChange({ ...filters, date_range: date_range === "all" ? undefined : date_range });
  };

  // Story 1.3.5: Handle feed filter
  const handleFeedFilter = (feed_id?: number) => {
    onFiltersChange({ ...filters, feed_id });
  };

  // Handle feed source filter
  const handleFeedSourceFilter = (feed_source_id?: number) => {
    onFiltersChange({ ...filters, feed_source_id });
  };

  const clearFilter = (filterKey: keyof ContentFilterState) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    onFiltersChange(newFilters);
    if (filterKey === "search") {
      setSearchInput("");
    }
  };

  const clearAllFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== undefined);
  const hasActiveFilters = activeFilters.length > 0;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "ready_for_publish":
        return "Ready for Publish";
      case "published":
        return "Published";
      case "scheduled":
        return "Scheduled";
      case "draft":
        return "Draft";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getSourceLabel = (source: string) => {
    return getSourceTypeLabel(source as SourceType);
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return range;
    }
  };

  // Story 1.3.5: Get feed label
  const getFeedLabel = (feedId: number) => {
    const feed = feeds.find((f) => f.id === feedId);
    return feed?.name || `Feed #${feedId}`;
  };

  // Get feed source label
  const getFeedSourceLabel = (feedSourceId: number) => {
    const source = feedSources.find((s) => s.id === feedSourceId);
    return source?.name || `Source #${feedSourceId}`;
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content by title or description..."
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Status {filters.status && `(${getStatusLabel(filters.status)})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusFilter(undefined)}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter("rejected")}>
                Rejected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter("ready_for_publish")}>
                Ready for Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilter("published")}>
                Published
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range {filters.date_range && `(${getDateRangeLabel(filters.date_range)})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDateRangeFilter("all")}>
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeFilter("today")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeFilter("week")}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeFilter("month")}>
                This Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Story 1.3.5: Feed Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Feed {filters.feed_id && `(${getFeedLabel(filters.feed_id)})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFeedFilter(undefined)}>
                All Feeds
              </DropdownMenuItem>
              {feeds.map((feed) => (
                <DropdownMenuItem key={feed.id} onClick={() => handleFeedFilter(feed.id)}>
                  {feed.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Feed Source Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Feed Source{" "}
                {filters.feed_source_id && `(${getFeedSourceLabel(filters.feed_source_id)})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFeedSourceFilter(undefined)}>
                All Feed Sources
              </DropdownMenuItem>
              {feedSources.map((source) => (
                <DropdownMenuItem key={source.id} onClick={() => handleFeedSourceFilter(source.id)}>
                  {source.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="mr-2 h-4 w-4" />
                Source Type {filters.source_type && `(${getSourceLabel(filters.source_type)})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSourceFilter(undefined)}>
                All Sources
              </DropdownMenuItem>
              {AVAILABLE_SOURCE_TYPES.map((sourceType) => (
                <DropdownMenuItem
                  key={sourceType.value}
                  onClick={() => handleSourceFilter(sourceType.value)}
                >
                  {sourceType.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle (if provided) */}
          {onViewModeChange && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value) onViewModeChange(value as "grid" | "list");
                }}
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: &ldquo;{filters.search}&rdquo;
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("search")}
                aria-label="Remove search filter"
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {getStatusLabel(filters.status)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("status")}
                aria-label="Remove status filter"
              />
            </Badge>
          )}
          {filters.source_type && (
            <Badge variant="secondary" className="gap-1">
              Source Type: {getSourceLabel(filters.source_type)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("source_type")}
                aria-label="Remove source type filter"
              />
            </Badge>
          )}
          {filters.date_range && (
            <Badge variant="secondary" className="gap-1">
              Date: {getDateRangeLabel(filters.date_range)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("date_range")}
                aria-label="Remove date range filter"
              />
            </Badge>
          )}
          {filters.feed_id && (
            <Badge variant="secondary" className="gap-1">
              Feed: {getFeedLabel(filters.feed_id)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("feed_id")}
                aria-label="Remove feed filter"
              />
            </Badge>
          )}
          {filters.feed_source_id && (
            <Badge variant="secondary" className="gap-1">
              Feed Source: {getFeedSourceLabel(filters.feed_source_id)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("feed_source_id")}
                aria-label="Remove feed source filter"
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
