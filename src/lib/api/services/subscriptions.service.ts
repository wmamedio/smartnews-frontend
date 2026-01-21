/**
 * Feed Subscriptions API Service (Story 1.6)
 * Handles subscriber's feed subscriptions
 */

import apiClient from "../client";
import type {
  FeedSubscriptionCreate,
  FeedSubscriptionResponse,
  FeedSubscriptionWithDetails,
  FeedSubscriptionUpdate,
} from "@/lib/types/feed";

/**
 * Get all subscriptions for authenticated subscriber
 * GET /feed-subscriptions/
 */
export async function getMySubscriptions(): Promise<FeedSubscriptionWithDetails[]> {
  const response = await apiClient.get<FeedSubscriptionWithDetails[]>("/feed-subscriptions/");
  return response.data;
}

/**
 * Subscribe to a feed
 * POST /feed-subscriptions/
 */
export async function createFeedSubscription(
  data: FeedSubscriptionCreate
): Promise<FeedSubscriptionResponse> {
  const response = await apiClient.post<FeedSubscriptionResponse>("/feed-subscriptions/", data);
  return response.data;
}

/**
 * Get specific subscription details
 * GET /feed-subscriptions/{subscription_id}
 */
export async function getSubscription(
  subscriptionId: number
): Promise<FeedSubscriptionWithDetails> {
  const response = await apiClient.get<FeedSubscriptionWithDetails>(
    `/feed-subscriptions/${subscriptionId}`
  );
  return response.data;
}

/**
 * Update subscription preferences (delivery method, frequency)
 * PUT /feed-subscriptions/{subscription_id}/preferences
 */
export async function updateSubscriptionPreferences(
  subscriptionId: number,
  data: FeedSubscriptionUpdate
): Promise<FeedSubscriptionResponse> {
  const response = await apiClient.put<FeedSubscriptionResponse>(
    `/feed-subscriptions/${subscriptionId}/preferences`,
    data
  );
  return response.data;
}

/**
 * Unsubscribe from a feed
 * DELETE /feed-subscriptions/{subscription_id}
 */
export async function unsubscribeFromFeed(subscriptionId: number): Promise<void> {
  await apiClient.delete(`/feed-subscriptions/${subscriptionId}`);
}

/**
 * Check if user is subscribed to a specific feed
 * Helper function that checks the subscriptions list
 */
export async function isSubscribedToFeed(feedId: number): Promise<boolean> {
  try {
    const subscriptions = await getMySubscriptions();
    return subscriptions.some((sub) => sub.feed_id === feedId && sub.is_active);
  } catch (error) {
    // If not authenticated or error, return false
    return false;
  }
}
