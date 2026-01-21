"use client";

import { useState, useEffect } from "react";
import { Youtube, Twitter, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { socialService, type SocialConnection } from "@/lib/services/social-service";

// Reddit icon component (not in lucide-react)
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

interface SocialProvider {
  name: string;
  icon: any;
  color: string;
  description: string;
}

const socialProviders: Record<string, SocialProvider> = {
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "text-destructive",
    description: "Import videos and channel statistics",
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "text-primary",
    description: "Import saved tweets and bookmarks",
  },
  reddit: {
    name: "Reddit",
    icon: RedditIcon,
    color: "text-secondary",
    description: "Import saved posts and subreddits",
  },
};

interface SocialConnectionCardProps {
  connection: SocialConnection;
  onConnect: (provider: string) => Promise<void>;
  onDisconnect: (provider: string) => Promise<void>;
  onRefresh: (provider: string) => Promise<void>;
}

function SocialConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onRefresh,
}: SocialConnectionCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const provider = socialProviders[connection.provider];
  const Icon = provider.icon;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect(connection.provider);
      toast.success(`${provider.name} connected successfully!`);
    } catch (error) {
      toast.error(`Failed to connect ${provider.name}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection.provider);
      toast.success(`${provider.name} disconnected`);
    } catch (error) {
      toast.error(`Failed to disconnect ${provider.name}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(connection.provider);
      toast.success("Stats refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh stats");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left section - Icon, Name, Description */}
          <div className="flex items-center gap-4 flex-1">
            <div
              className={cn(
                "rounded-full p-3 flex items-center justify-center",
                provider.color,
                "bg-muted"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base">{provider.name}</h3>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            </div>
          </div>

          {/* Right section - Badge and Button */}
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className={cn(
                "text-white border-transparent",
                connection.isConnected
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-secondary hover:bg-secondary/90"
              )}
            >
              {connection.isConnected ? "Connected" : "Not Connected"}
            </Badge>
            {!connection.isConnected && (
              <Button onClick={handleConnect} disabled={isConnecting} className="min-w-[160px]">
                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isConnecting && <Icon className="mr-2 h-4 w-4" />}
                Connect {provider.name}
              </Button>
            )}
          </div>
        </div>

        {/* Connected State - Show below when connected */}
        {connection.isConnected && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">@{connection.username || "username"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {connection.followerCount?.toLocaleString() || "0"} subscribers
                  {connection.lastSyncedAt && (
                    <>
                      {" • "}
                      Last synced{" "}
                      {formatDistanceToNow(new Date(connection.lastSyncedAt), {
                        addSuffix: true,
                      })}
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Refresh
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isDisconnecting}>
                      Disconnect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disconnect {provider.name}?</DialogTitle>
                      <DialogDescription>
                        This will stop importing content from your {provider.name} account. Your
                        revenue estimation may be affected.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Disconnect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SocialConnections() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await socialService.getConnections();
      setConnections(data);
    } catch (error) {
      console.error("Failed to load social connections:", error);
      toast.error("Failed to load social connections");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    await socialService.connect(provider);
    await loadConnections(); // Refresh connections after connect
  };

  const handleDisconnect = async (provider: string) => {
    await socialService.disconnect(provider);
    await loadConnections(); // Refresh connections after disconnect
  };

  const handleRefresh = async (provider: string) => {
    await socialService.refreshStats(provider);
    await loadConnections(); // Refresh connections after stats refresh
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Connections</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <SocialConnectionCard
          key={connection.provider}
          connection={connection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
}
