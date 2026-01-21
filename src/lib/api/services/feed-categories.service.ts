import apiClient from "../client";

/**
 * Feed category response from backend
 */
export interface FeedCategory {
  id: number;
  name: string;
  slug: string;
  feed_count: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Create feed category request
 */
export interface CreateFeedCategoryDTO {
  name: string;
  slug: string;
}

/**
 * Update feed category request
 */
export interface UpdateFeedCategoryDTO {
  name?: string;
  slug?: string;
}

class FeedCategoriesService {
  /**
   * Get all feed categories
   */
  async getAll(): Promise<FeedCategory[]> {
    const response = await apiClient.get<FeedCategory[]>("/feed-categories/");
    return response.data;
  }

  /**
   * Get a single feed category by slug
   */
  async getBySlug(slug: string): Promise<FeedCategory> {
    const response = await apiClient.get<FeedCategory>(`/feed-categories/${slug}`);
    return response.data;
  }

  /**
   * Create a new feed category
   */
  async create(data: CreateFeedCategoryDTO): Promise<FeedCategory> {
    const response = await apiClient.post<FeedCategory>("/feed-categories/", data);
    return response.data;
  }

  /**
   * Update an existing feed category
   */
  async update(slug: string, data: UpdateFeedCategoryDTO): Promise<FeedCategory> {
    const response = await apiClient.put<FeedCategory>(`/feed-categories/${slug}`, data);
    return response.data;
  }

  /**
   * Delete a feed category
   */
  async delete(slug: string): Promise<void> {
    await apiClient.delete(`/feed-categories/${slug}`);
  }
}

export const feedCategoriesService = new FeedCategoriesService();
