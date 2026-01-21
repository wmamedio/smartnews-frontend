"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Calendar,
  Users,
  ExternalLink,
  Edit,
  LayoutGrid,
  List,
  Trash2,
  Send,
  FileText,
  MoreVertical,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCreatorFeeds } from "@/lib/api/feeds";
import type { Feed } from "@/lib/types/feed";
import { DeleteFeedDialog } from "@/components/feeds/dialogs/DeleteFeedDialog";
import { SendFeedDialog } from "@/components/feeds/dialogs/SendFeedDialog";
import { formatScheduleDisplay } from "@/lib/utils/schedule-formatter";

export default function FeedsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch feeds (includes subscriber_count and items_count from backend)
  const { data: feedsData, isLoading } = useQuery({
    queryKey: ["creator-feeds"],
    queryFn: () => fetchCreatorFeeds({ limit: 50 }),
    retry: false, // Don't retry on 401 - let API client handle redirect
  });

  // Filter out draft feeds (temporary feeds from incomplete wizard)
  const allFeeds = (feedsData?.feeds || []).filter((feed) => feed.status !== "draft");

  // Filter feeds by search query
  const filteredFeeds = searchQuery
    ? allFeeds.filter(
        (feed) =>
          feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feed.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFeeds;

  // Filter feeds by schedule presence (backend now returns schedule in feed object)
  const automaticFeeds = filteredFeeds.filter((f) => f.schedule !== null);
  const manualFeeds = filteredFeeds.filter((f) => f.schedule === null);

  // Handle successful deletion with optimistic update
  const handleDeleteSuccess = (deletedFeedId: number) => {
    // Optimistically update cache for immediate UI feedback
    queryClient.setQueryData(["creator-feeds"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        feeds: old.feeds.filter((f: Feed) => f.id !== deletedFeedId),
      };
    });

    // Invalidate schedule cache for deleted feed
    queryClient.removeQueries({ queryKey: ["feed-schedule", deletedFeedId] });

    // Force immediate refetch to sync with server
    queryClient.invalidateQueries({
      queryKey: ["creator-feeds"],
      refetchType: "active",
    });
  };

  const FeedCard = ({ feed }: { feed: Feed }) => {
    // Schedule is now included in feed object from backend
    const scheduleDisplay = formatScheduleDisplay(feed.schedule);

    return (
      <Card className="hover:shadow-md transition-shadow flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{feed.name}</CardTitle>
              {feed.categories && feed.categories.length > 0 && (
                <Badge variant="outline" className="text-xs mt-2">
                  <Tag className="h-3 w-3 mr-1" />
                  {feed.categories[0].name}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent group">
                  <MoreVertical className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <SendFeedDialog
                  feed={feed}
                  onSendSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
                  }}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/feeds/${feed.id}/edit`} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/content/library?feed_id=${feed.id}`} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Content
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/feed/${feed.slug}`} className="cursor-pointer" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteFeedDialog
                  feed={feed}
                  onDeleteSuccess={handleDeleteSuccess}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>{feed.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {/* Content area - can be used for additional info in future */}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {feed.subscriber_count ?? 0} subscriber
                {(feed.subscriber_count ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>
                {feed.items_count ?? 0} item
                {(feed.items_count ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{scheduleDisplay}</span>
          </div>
        </CardFooter>
      </Card>
    );
  };

  const FeedsListView = ({ feeds }: { feeds: Feed[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-[140px]">Category</TableHead>
            <TableHead className="w-[120px]">Subscribers</TableHead>
            <TableHead className="w-[100px]">Items</TableHead>
            <TableHead className="w-[200px]">Schedule</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed) => {
            // Schedule is now included in feed object from backend
            const scheduleDisplay = formatScheduleDisplay(feed.schedule);

            return (
              <TableRow key={feed.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{feed.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {feed.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {feed.categories && feed.categories.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{feed.categories[0].name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{feed.subscriber_count ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{feed.items_count ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{scheduleDisplay}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-transparent group"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <SendFeedDialog
                        feed={feed}
                        onSendSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ["creator-feeds"] });
                        }}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/feeds/${feed.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/content/library?feed_id=${feed.id}`}
                          className="cursor-pointer"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Content
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/feed/${feed.slug}`}
                          className="cursor-pointer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteFeedDialog
                        feed={feed}
                        onDeleteSuccess={handleDeleteSuccess}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
  return (
    <>
      <div className="p-6">
        {/* Page Title & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Feeds</h2>
            <p className="text-muted-foreground">Create and manage your content feeds</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/feeds/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Feed
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Feeds</TabsTrigger>
              <TabsTrigger value="automatic">Automatic Delivery</TabsTrigger>
              <TabsTrigger value="manual">Manual Delivery</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as "list" | "grid")}
              >
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feeds..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredFeeds.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16">
                <CardHeader className="text-center">
                  <CardTitle>{searchQuery ? "No feeds found" : "No feeds yet"}</CardTitle>
                  <CardDescription>
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Create your first feed to start curating content for your subscribers"}
                  </CardDescription>
                </CardHeader>
                {!searchQuery && (
                  <CardFooter>
                    <Button asChild>
                      <Link href="/feeds/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Feed
                      </Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ) : viewMode === "list" ? (
              <FeedsListView feeds={filteredFeeds} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFeeds.map((feed) => (
                  <FeedCard key={feed.id} feed={feed} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="automatic" className="space-y-4 mt-4">
            {automaticFeeds.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16">
                <CardHeader className="text-center">
                  <CardTitle>No automatic delivery feeds</CardTitle>
                  <CardDescription>
                    Feeds with scheduled automatic delivery will appear here
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : viewMode === "list" ? (
              <FeedsListView feeds={automaticFeeds} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {automaticFeeds.map((feed) => (
                  <FeedCard key={feed.id} feed={feed} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            {manualFeeds.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16">
                <CardHeader className="text-center">
                  <CardTitle>No manual delivery feeds</CardTitle>
                  <CardDescription>
                    Feeds that require manual sending will appear here
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : viewMode === "list" ? (
              <FeedsListView feeds={manualFeeds} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {manualFeeds.map((feed) => (
                  <FeedCard key={feed.id} feed={feed} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
