"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { feedSourcesService, type FeedSource } from "@/lib/api/services/feed-sources.service";
import { AddSourceWizard } from "./AddSourceWizard";
import { SourceCard } from "./SourceCard";
import { SourceFilters, type SourceFilterState } from "./SourceFilters";
import { NoFeedsAlert } from "@/components/content/NoFeedsAlert";
import { useCreatorFeeds } from "@/hooks/useCreatorFeeds";

export function SourceManager() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<FeedSource | null>(null);
  const [filters, setFilters] = useState<SourceFilterState>({});
  const [noFeedsAlertOpen, setNoFeedsAlertOpen] = useState(false);

  // Check if user has feeds
  const { hasFeeds, isLoading: isLoadingFeeds } = useCreatorFeeds();

  const {
    data: sources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feed-sources"],
    queryFn: () => feedSourcesService.getAll(),
  });

  // Apply filters to sources
  const filteredSources = useMemo(() => {
    if (!sources) return [];

    return sources.filter((source) => {
      // Search filter (by name or URL)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = source.name.toLowerCase().includes(searchLower);
        const matchesUrl = source.configuration?.url?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesUrl) return false;
      }

      // Source type filter
      if (filters.source_type && source.source_type !== filters.source_type) {
        return false;
      }

      // Active status filter
      if (filters.is_active !== undefined && source.is_active !== filters.is_active) {
        return false;
      }

      return true;
    });
  }, [sources, filters]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feed Sources</CardTitle>
          <CardDescription>Unable to load feed sources</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {(error as any)?.response?.data?.detail || "An error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Page header with title and button aligned */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Manage Sources</h2>
          <p className="text-muted-foreground">
            Add and manage your RSS feeds, websites, and social media sources
          </p>
        </div>
        <Button
          onClick={() => {
            if (!hasFeeds) {
              setNoFeedsAlertOpen(true);
            } else {
              setIsWizardOpen(true);
            }
          }}
          disabled={isLoadingFeeds}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Filters */}
      <SourceFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSources.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={(source) => setEditingSource(source)}
            />
          ))}
        </div>
      ) : sources && sources.length > 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">No sources match your filters</p>
              <Button variant="outline" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">No feed sources yet</p>
              <Button
                onClick={() => {
                  if (!hasFeeds) {
                    setNoFeedsAlertOpen(true);
                  } else {
                    setIsWizardOpen(true);
                  }
                }}
                disabled={isLoadingFeeds}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Source
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Wizard - Used for both creating and editing sources */}
      <AddSourceWizard
        open={isWizardOpen || !!editingSource}
        onOpenChange={(open) => {
          if (!open) {
            setIsWizardOpen(false);
            setEditingSource(null);
          }
        }}
        source={editingSource}
        onSourceCreated={() => setEditingSource(null)}
        hideToastActionButton
      />

      {/* No Feeds Alert - shown when user tries to add source without feeds */}
      <NoFeedsAlert
        open={noFeedsAlertOpen}
        onOpenChange={setNoFeedsAlertOpen}
        actionType="add-source"
      />
    </div>
  );
}
