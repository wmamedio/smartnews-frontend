"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreVertical, RefreshCw, Trash2, Edit, ExternalLink, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { feedSourcesService, type FeedSource } from "@/lib/api/services/feed-sources.service";
import { extractErrorMessage } from "@/lib/utils/error-handler";

interface SourceCardProps {
  source: FeedSource;
  onEdit?: (source: FeedSource) => void;
}

export function SourceCard({ source, onEdit }: SourceCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => feedSourcesService.delete(source.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
      toast.success("Source deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to delete source");
      toast.error(errorMessage);
      setIsDeleting(false);
    },
  });

  const pullMutation = useMutation({
    mutationFn: () => feedSourcesService.pullContent(source.id),
    onSuccess: (data) => {
      toast.success(data.message || "Content import started");
      queryClient.invalidateQueries({ queryKey: ["feed-items"] });
    },
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Failed to pull content");
      toast.error(errorMessage);
    },
  });

  const handleViewContent = () => {
    router.push(`/content/library?feed_source_id=${source.id}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  const getSourceTypeLabel = () => {
    switch (source.source_type) {
      case "rss":
        return "RSS Feed";
      case "manual_url":
        return "Manual URL";
      case "twitter":
        return "Twitter";
      case "youtube":
        return "YouTube";
      case "reddit":
        return "Reddit";
      case "csv":
        return "CSV Import";
      case "bookmarks":
        return "Bookmarks";
      default:
        return source.source_type;
    }
  };

  // Extract URL from configuration object
  const sourceUrl = source.configuration?.url as string | undefined;

  return (
    <Card className="relative h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="pr-8">
          <div className="space-y-0.5">
            <CardTitle className="text-sm">{source.name}</CardTitle>
            <CardDescription className="text-xs">
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  {sourceUrl.length > 40 ? `${sourceUrl.substring(0, 40)}...` : sourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardDescription>
          </div>
        </div>

        {/* 3-dot menu positioned absolutely in top-right corner */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewContent}>
                <Eye className="mr-2 h-4 w-4" />
                View Content
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => pullMutation.mutate()}
                disabled={pullMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Pull Content
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(source)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 mt-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {getSourceTypeLabel()}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <FileText className="h-3 w-3" />
            {source.item_count} {source.item_count === 1 ? "item" : "items"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 text-xs text-muted-foreground border-t">
        <div className="flex justify-between w-full">
          <span>Created {format(new Date(source.created_at), "MMM d, yyyy")}</span>
          {source.last_sync_at && (
            <span>Last synced {format(new Date(source.last_sync_at), "MMM d, yyyy")}</span>
          )}
        </div>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{source.name}&rdquo;? This will permanently
              remove the source and all its associated content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Source
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
