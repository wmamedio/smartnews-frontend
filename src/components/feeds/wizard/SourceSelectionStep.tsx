"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Rss,
  Globe,
  Twitter,
  Youtube,
  Edit,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WizardNavigation } from "./WizardNavigation";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import type { FeedSource } from "@/lib/api/services/feed-sources.service";
import { feedItemsService } from "@/lib/api/services/feed-items.service";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddSourceWizard } from "@/components/content/sources/AddSourceWizard";
import { InlineSourcePrompt } from "@/components/content/sources/InlineSourcePrompt";
import { extractErrorMessage } from "@/lib/utils/error-handler";

interface SourceSelectionStepProps {
  onNext: () => void;
  onBack?: (() => void) | null;
  onCancel?: () => void;
  /** Initial URL to pre-fill in the source wizard (from QuickAddCard "Create New Feed") */
  initialUrl?: string;
}

const sourceTypeIcons: Record<string, any> = {
  rss: Rss,
  manual_url: Globe,
  twitter: Twitter,
  youtube: Youtube,
};

// Component to display item count for a source
function SourceItemCount({ itemCount, isSelected }: { itemCount: number; isSelected: boolean }) {
  return (
    <Badge
      variant={isSelected ? "secondary" : "outline"}
      className={`gap-1 text-xs ${isSelected ? "border border-accent-foreground/20" : ""}`}
    >
      <FileText className="h-3 w-3" />
      {itemCount} {itemCount === 1 ? "item" : "items"}
    </Badge>
  );
}

export function SourceSelectionStep({
  onNext,
  onBack,
  onCancel,
  initialUrl,
}: SourceSelectionStepProps) {
  const { selectedSourceIds, addSource, removeSource } = useFeedBuilderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialUrl, setWizardInitialUrl] = useState("");
  const [editingSource, setEditingSource] = useState<FeedSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<FeedSource | null>(null);
  const [deleteSourceItemCount, setDeleteSourceItemCount] = useState<number>(0);
  const [isCheckingItemCount, setIsCheckingItemCount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pullingSourceId, setPullingSourceId] = useState<number | null>(null);
  const [hasAutoOpenedWizard, setHasAutoOpenedWizard] = useState(false);
  const [shouldAutoAdvanceToKeywords, setShouldAutoAdvanceToKeywords] = useState(false);

  const queryClient = useQueryClient();

  // Auto-open wizard with initial URL from QuickAddCard "Create New Feed"
  useEffect(() => {
    if (initialUrl && !hasAutoOpenedWizard) {
      setWizardInitialUrl(initialUrl);
      setIsWizardOpen(true);
      setHasAutoOpenedWizard(true);
      setShouldAutoAdvanceToKeywords(true); // Auto-advance when coming from QuickAddCard
    }
  }, [initialUrl, hasAutoOpenedWizard]);

  // Pull content mutation
  const pullMutation = useMutation({
    mutationFn: (sourceId: number) => feedSourcesService.pullContent(sourceId),
    onSuccess: (data, sourceId) => {
      toast.success(data.message || "Content import started");
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
      queryClient.invalidateQueries({ queryKey: ["source-stats", sourceId] });
      setPullingSourceId(null);
    },
    onError: (error: any, sourceId) => {
      const errorMessage = extractErrorMessage(error, "Failed to pull content");
      toast.error(errorMessage);
      setPullingSourceId(null);
    },
  });

  // Fetch feed sources
  const {
    data: sources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feed-sources-wizard"],
    queryFn: () => feedSourcesService.getAll(),
  });

  // Show error toast if source loading fails
  useEffect(() => {
    if (error) {
      const errorMessage = extractErrorMessage(error, "Failed to load sources");
      toast.error("Failed to load feed sources", {
        description: errorMessage,
      });
    }
  }, [error]);

  // Fetch item count when delete dialog opens
  useEffect(() => {
    const fetchItemCount = async () => {
      if (sourceToDelete) {
        setIsCheckingItemCount(true);
        try {
          const stats = await feedItemsService.getSourceStats(sourceToDelete.id);
          setDeleteSourceItemCount(stats?.total_items ?? 0);
        } catch (error) {
          console.error("Failed to fetch source stats:", error);
          setDeleteSourceItemCount(0);
        } finally {
          setIsCheckingItemCount(false);
        }
      } else {
        setDeleteSourceItemCount(0);
        setIsCheckingItemCount(false);
      }
    };

    fetchItemCount();
  }, [sourceToDelete]);

  // Filter sources based on search
  const filteredSources =
    sources?.filter(
      (source) =>
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.source_type.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const selectedSources = sources?.filter((s) => selectedSourceIds.includes(s.id)) || [];

  const handleToggleSource = (sourceId: number) => {
    if (selectedSourceIds.includes(sourceId)) {
      removeSource(sourceId);
    } else {
      addSource(sourceId);
    }
  };

  const handleNext = () => {
    if (selectedSourceIds.length === 0) {
      toast.error("Please select at least one source");
      return;
    }
    onNext();
  };

  const handleSourceCreated = (sourceId?: number) => {
    // Refetch sources after creation
    queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });

    // Automatically select the newly created source
    if (sourceId) {
      addSource(sourceId);
      toast.success("Source added to feed");
    }
  };

  const handleInlineUrlSubmit = (url: string) => {
    // Open wizard with initial URL from inline prompt
    setWizardInitialUrl(url);
    setIsWizardOpen(true);
  };

  const handlePullContent = (sourceId: number) => {
    setPullingSourceId(sourceId);
    pullMutation.mutate(sourceId);
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;

    try {
      setIsDeleting(true);

      // Item count is already checked before showing the dialog
      // Proceed with deletion
      await feedSourcesService.delete(sourceToDelete.id);

      toast.success("Source deleted successfully");

      // Remove from selection if it was selected
      if (selectedSourceIds.includes(sourceToDelete.id)) {
        removeSource(sourceToDelete.id);
      }

      // Refetch sources
      queryClient.invalidateQueries({ queryKey: ["feed-sources-wizard"] });
      setSourceToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete source:", error);

      // Handle specific error cases
      if (error.response?.status === 409 || error.response?.status === 400) {
        toast.error("Cannot delete source", {
          description:
            "This source has associated content or is being used by feeds. Please remove all content first.",
        });
      } else if (error.message === "Network Error" || !error.response) {
        toast.error("Connection error", {
          description:
            "Unable to connect to the server. Please check your internet connection and try again.",
        });
      } else {
        const errorMessage = extractErrorMessage(error, "Please try again");
        toast.error("Failed to delete source", {
          description: errorMessage,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Sources</CardTitle>
              <CardDescription>
                Choose sources (RSS, YouTube, Twitter, etc.) that will provide content for your
                stream
              </CardDescription>
            </div>
            <Button onClick={() => setIsWizardOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Source
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Sources Summary */}
          {selectedSources.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {selectedSources.length} source{selectedSources.length !== 1 ? "s" : ""}{" "}
                    selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedSourceIds.forEach(removeSource)}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSources.map((source) => {
                    const Icon = sourceTypeIcons[source.source_type] || Globe;
                    return (
                      <Badge key={source.id} variant="secondary" className="gap-1">
                        <Icon className="h-3 w-3" />
                        {source.name}
                        <button
                          onClick={() => removeSource(source.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Source List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSources.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No sources found matching your search
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <InlineSourcePrompt onUrlSubmit={handleInlineUrlSubmit} />
              )
            ) : (
              filteredSources.map((source) => {
                const Icon = sourceTypeIcons[source.source_type] || Globe;
                const isSelected = selectedSourceIds.includes(source.id);

                return (
                  <div
                    key={source.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected
                        ? "bg-accent border-primary text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onClick={() => handleToggleSource(source.id)}
                        className="mt-1 cursor-pointer"
                      />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleToggleSource(source.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                          />
                          <h4 className="font-medium text-sm">{source.name}</h4>
                        </div>
                        {source.configuration?.url && (
                          <p
                            className={`text-xs mt-1 line-clamp-1 ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                          >
                            {source.configuration.url}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={isSelected ? "secondary" : "outline"}
                            className={`text-xs ${isSelected ? "border border-accent-foreground/20" : ""}`}
                          >
                            {source.source_type}
                          </Badge>
                          {source.is_active ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${isSelected ? "border border-accent-foreground/20" : ""}`}
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                          <SourceItemCount itemCount={source.item_count} isSelected={isSelected} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePullContent(source.id);
                          }}
                          disabled={pullingSourceId === source.id}
                          title="Pull Content"
                        >
                          {pullingSourceId === source.id ? (
                            <Loader2
                              className={`h-4 w-4 animate-spin ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                            />
                          ) : (
                            <RefreshCw
                              className={`h-4 w-4 ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                            />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSource(source);
                          }}
                        >
                          <Edit
                            className={`h-4 w-4 ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSourceToDelete(source);
                          }}
                        >
                          <Trash2
                            className={`h-4 w-4 ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack || undefined}
        onNext={handleNext}
        backLabel="Back"
        nextLabel="Next: Preview"
        isNextDisabled={selectedSourceIds.length === 0}
      />

      {/* Source Wizard - Used for both creating and editing sources */}
      <AddSourceWizard
        open={isWizardOpen || !!editingSource}
        onOpenChange={(open) => {
          if (!open) {
            setIsWizardOpen(false);
            setEditingSource(null);
            setShouldAutoAdvanceToKeywords(false);
          }
        }}
        onSourceCreated={(sourceId) => {
          if (editingSource) {
            setEditingSource(null);
            handleSourceCreated();
          } else {
            handleSourceCreated(sourceId);
          }
        }}
        initialUrl={wizardInitialUrl}
        source={editingSource}
        autoAdvanceToKeywords={shouldAutoAdvanceToKeywords && !editingSource}
        hideToastActionButton
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {isCheckingItemCount ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span>Checking source content...</span>
                </div>
              ) : (
                <>
                  <p>
                    Are you sure you want to delete &quot;{sourceToDelete?.name}&quot;? This action
                    cannot be undone.
                  </p>
                  {deleteSourceItemCount > 0 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>
                        <strong>Warning:</strong> This source has {deleteSourceItemCount} content{" "}
                        {deleteSourceItemCount !== 1 ? "items" : "item"}. Sources with content
                        cannot be deleted. Please delete all content first or archive the source
                        instead.
                      </AlertDescription>
                    </Alert>
                  )}
                  {selectedSourceIds.includes(sourceToDelete?.id || 0) && (
                    <p className="text-sm">
                      This source is currently selected for this feed and will be removed from your
                      selection.
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting || isCheckingItemCount}>
              {deleteSourceItemCount > 0 ? "Close" : "Cancel"}
            </AlertDialogCancel>
            {!isCheckingItemCount && deleteSourceItemCount === 0 && (
              <AlertDialogAction
                onClick={handleDeleteSource}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
