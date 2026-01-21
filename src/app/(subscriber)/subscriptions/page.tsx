"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubscriptionGrid } from "@/components/subscriber/subscriptions/SubscriptionGrid";
import { EmptySubscriptions } from "@/components/subscriber/subscriptions/EmptySubscriptions";
import { FrequencyModal } from "@/components/subscriber/subscriptions/FrequencyModal";
import { UnsubscribeDialog } from "@/components/subscriber/subscriptions/UnsubscribeDialog";
import { PublicHeader } from "@/components/subscriber/shared/PublicHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getMySubscriptions,
  updateSubscriptionPreferences,
  unsubscribeFromFeed,
} from "@/lib/api/services/subscriptions.service";
import type { FeedSubscriptionWithDetails } from "@/lib/types/feed";
import { toast } from "sonner";
import { Plus, AlertCircle, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<FeedSubscriptionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Frequency modal state
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<FeedSubscriptionWithDetails | null>(null);

  // Unsubscribe dialog state
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);
  const [unsubscribeTarget, setUnsubscribeTarget] = useState<FeedSubscriptionWithDetails | null>(
    null
  );

  // Check if user is a creator and show alert
  useEffect(() => {
    if (user && user.user_type === "creator") {
      toast.error(
        "You're logged in as a Creator. Please log out and sign in with a Subscriber account to view subscriptions.",
        { duration: 6000 }
      );
    }
  }, [user]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const data = await getMySubscriptions();
      const activeSubscriptions = data.filter((sub) => sub.is_active);
      setSubscriptions(activeSubscriptions);

      // Redirect to discover page if no subscriptions
      if (activeSubscriptions.length === 0) {
        router.push("/discover");
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch subscriptions on mount
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Handle view content
  const handleViewContent = (subscription: FeedSubscriptionWithDetails) => {
    router.push(`/feed/${subscription.feed.slug}`);
  };

  // Handle edit frequency
  const handleEditFrequency = (subscription: FeedSubscriptionWithDetails) => {
    setSelectedSubscription(subscription);
    setShowFrequencyModal(true);
  };

  // Save frequency changes
  const handleSaveFrequency = async (subscriptionId: number, frequency: string) => {
    try {
      await updateSubscriptionPreferences(subscriptionId, {
        delivery_frequency: frequency,
      });

      // Update local state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId ? { ...sub, delivery_frequency: frequency } : sub
        )
      );

      toast.success("Delivery frequency updated!");
    } catch (error: unknown) {
      console.error("Failed to update frequency:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to update frequency");
      throw error; // Re-throw to prevent modal from closing
    }
  };

  // Handle unsubscribe
  const handleUnsubscribe = (subscription: FeedSubscriptionWithDetails) => {
    setUnsubscribeTarget(subscription);
    setShowUnsubscribeDialog(true);
  };

  // Confirm unsubscribe
  const handleConfirmUnsubscribe = async (subscriptionId: number) => {
    try {
      await unsubscribeFromFeed(subscriptionId);

      // Remove from local state with animation
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId));

      toast.success("Unsubscribed successfully");
    } catch (error: unknown) {
      console.error("Failed to unsubscribe:", error);
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to unsubscribe");
    }
  };

  // Handle logout (for creator alert)
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-4">
      {/* Public Header */}
      <PublicHeader />

      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/discover">Discover</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Subscriptions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Creator Alert */}
      {user && user.user_type === "creator" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Account Type</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span>
              You&apos;re logged in as a <strong>Creator</strong>. This page is for subscribers
              only. Please log out and sign in with a Subscriber account.
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="ml-4">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            My Subscriptions
            {subscriptions.length > 0 && (
              <span className="ml-2 text-muted-foreground">({subscriptions.length})</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your feed subscriptions and preferences
          </p>
        </div>

        <Button asChild>
          <Link href="/discover">
            <Plus className="mr-2 h-4 w-4" />
            Browse More
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <SubscriptionGrid
          subscriptions={[]}
          isLoading={true}
          onViewContent={handleViewContent}
          onEditFrequency={handleEditFrequency}
          onUnsubscribe={handleUnsubscribe}
        />
      ) : subscriptions.length === 0 ? (
        <EmptySubscriptions />
      ) : (
        <SubscriptionGrid
          subscriptions={subscriptions}
          isLoading={false}
          onViewContent={handleViewContent}
          onEditFrequency={handleEditFrequency}
          onUnsubscribe={handleUnsubscribe}
        />
      )}

      {/* Frequency Modal */}
      <FrequencyModal
        open={showFrequencyModal}
        onOpenChange={setShowFrequencyModal}
        subscription={selectedSubscription}
        onSave={handleSaveFrequency}
      />

      {/* Unsubscribe Dialog */}
      <UnsubscribeDialog
        open={showUnsubscribeDialog}
        onOpenChange={setShowUnsubscribeDialog}
        subscription={unsubscribeTarget}
        onConfirm={handleConfirmUnsubscribe}
      />
    </div>
  );
}
