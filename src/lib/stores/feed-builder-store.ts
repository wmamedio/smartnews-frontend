import { create } from "zustand";
import type {
  Feed,
  FeedItem,
  FeedSection,
  FeedContentItem,
  SaveStatus,
  DeliveryScheduleCreate,
} from "@/lib/types/feed";

interface FeedBuilderStore {
  // State
  feed: Partial<Feed>;
  feedId: number | null; // NEW (Story 1.3.6): Feed ID for AI suggestions and draft save
  items: FeedItem[]; // Kept for backward compatibility with existing code
  sections: FeedSection[]; // Kept for backward compatibility
  content: FeedContentItem[]; // NEW: Unified content list for drag-and-drop

  // NEW: Source-based feed creation
  selectedSourceIds: number[]; // Feed source IDs for creating feeds

  // NEW: Schedule configuration (Story 1.3.4)
  schedule: DeliveryScheduleCreate | null; // Feed delivery schedule

  isDirty: boolean;
  saveState: SaveStatus;
  lastSaved?: Date;

  // Actions - Feed
  setFeed: (feed: Partial<Feed>) => void;
  setFeedId: (id: number | null) => void; // NEW (Story 1.3.6): Set feed ID
  updateFeed: (updates: Partial<Feed>) => void;
  resetFeed: () => void;

  // Actions - Items (legacy - also update content array)
  addItem: (item: FeedItem) => void;
  removeItem: (itemId: number) => void;
  reorderItems: (newItems: FeedItem[]) => void;
  clearItems: () => void;

  // Actions - Sections (legacy - also update content array)
  addSection: (section: FeedSection) => void;
  updateSection: (sectionId: string, updates: Partial<FeedSection>) => void;
  removeSection: (sectionId: string) => void;

  // Actions - Unified Content (NEW)
  setContent: (content: FeedContentItem[]) => void;
  addContentItem: (item: FeedContentItem, index?: number) => void;
  removeContentItem: (id: string | number) => void;
  reorderContent: (newContent: FeedContentItem[]) => void;

  // Actions - Source Selection (NEW)
  addSource: (sourceId: number) => void;
  removeSource: (sourceId: number) => void;
  setSelectedSources: (sourceIds: number[]) => void;
  clearSources: () => void;

  // Actions - Schedule Configuration (Story 1.3.4)
  setSchedule: (schedule: DeliveryScheduleCreate | null) => void;
  updateSchedule: (updates: Partial<DeliveryScheduleCreate>) => void;
  clearSchedule: () => void;

  // Actions - Save State
  setSaveState: (state: SaveStatus) => void;
  markDirty: () => void;
  markClean: () => void;
  updateLastSaved: () => void;
}

export const useFeedBuilderStore = create<FeedBuilderStore>((set, get) => ({
  // Initial state
  feed: {},
  feedId: null, // NEW (Story 1.3.6): Feed ID for AI suggestions
  items: [],
  sections: [],
  content: [], // NEW: Unified content array
  selectedSourceIds: [],
  schedule: null, // NEW: Schedule configuration (Story 1.3.4)
  isDirty: false,
  saveState: "idle",
  lastSaved: undefined,

  // Feed actions
  setFeed: (feed) => {
    set({ feed, isDirty: false });
  },

  setFeedId: (id) => {
    set({ feedId: id });
  },

  updateFeed: (updates) => {
    set((state) => ({
      feed: { ...state.feed, ...updates },
      isDirty: true,
    }));
  },

  resetFeed: () => {
    set({
      feed: {},
      feedId: null, // NEW (Story 1.3.6): Clear feed ID
      items: [],
      sections: [],
      content: [],
      selectedSourceIds: [],
      schedule: null, // NEW: Clear schedule (Story 1.3.4)
      isDirty: false,
      saveState: "idle",
      lastSaved: undefined,
    });
  },

  // Item actions (updated to sync with content array)
  addItem: (item) => {
    set((state) => {
      const newItems = [...state.items, item];
      const newContent = [...state.content, { type: "item" as const, data: item }];
      return {
        items: newItems,
        content: newContent,
        isDirty: true,
      };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
      content: state.content.filter((c) => !(c.type === "item" && c.data.id === itemId)),
      isDirty: true,
    }));
  },

  reorderItems: (newItems) => {
    set((state) => {
      // Preserve sections in their original positions, update only items
      const newContent = state.content.map((c) => {
        if (c.type === "section") return c;
        const newItem = newItems.find((item) => item.id === c.data.id);
        return newItem ? { type: "item" as const, data: newItem } : c;
      });
      return {
        items: newItems,
        content: newContent,
        isDirty: true,
      };
    });
  },

  clearItems: () => {
    set((state) => ({
      items: [],
      content: state.content.filter((c) => c.type === "section"),
      isDirty: true,
    }));
  },

  // Section actions (updated to sync with content array)
  addSection: (section) => {
    set((state) => {
      const newSections = [...state.sections, section];
      const newContent = [...state.content, { type: "section" as const, data: section }];
      return {
        sections: newSections,
        content: newContent,
        isDirty: true,
      };
    });
  },

  updateSection: (sectionId, updates) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
      content: state.content.map((c) =>
        c.type === "section" && c.data.id === sectionId
          ? { ...c, data: { ...c.data, ...updates } }
          : c
      ),
      isDirty: true,
    }));
  },

  removeSection: (sectionId) => {
    set((state) => ({
      sections: state.sections.filter((section) => section.id !== sectionId),
      content: state.content.filter((c) => !(c.type === "section" && c.data.id === sectionId)),
      isDirty: true,
    }));
  },

  // NEW: Unified Content actions
  setContent: (content) => {
    set((state) => {
      // Extract items and sections from content for backward compatibility
      const items = content.filter((c) => c.type === "item").map((c) => c.data as FeedItem);
      const sections = content
        .filter((c) => c.type === "section")
        .map((c) => c.data as FeedSection);

      return {
        content,
        items,
        sections,
        isDirty: true,
      };
    });
  },

  addContentItem: (item, index) => {
    set((state) => {
      const newContent = [...state.content];
      if (index !== undefined) {
        newContent.splice(index, 0, item);
      } else {
        newContent.push(item);
      }

      // Update items/sections arrays for backward compatibility
      const items = newContent.filter((c) => c.type === "item").map((c) => c.data as FeedItem);
      const sections = newContent
        .filter((c) => c.type === "section")
        .map((c) => c.data as FeedSection);

      return {
        content: newContent,
        items,
        sections,
        isDirty: true,
      };
    });
  },

  removeContentItem: (id) => {
    set((state) => {
      const newContent = state.content.filter((c) => {
        if (c.type === "item") return c.data.id !== id;
        if (c.type === "section") return c.data.id !== id;
        return true;
      });

      // Update items/sections arrays for backward compatibility
      const items = newContent.filter((c) => c.type === "item").map((c) => c.data as FeedItem);
      const sections = newContent
        .filter((c) => c.type === "section")
        .map((c) => c.data as FeedSection);

      return {
        content: newContent,
        items,
        sections,
        isDirty: true,
      };
    });
  },

  reorderContent: (newContent) => {
    set((state) => {
      // Update items/sections arrays for backward compatibility
      const items = newContent.filter((c) => c.type === "item").map((c) => c.data as FeedItem);
      const sections = newContent
        .filter((c) => c.type === "section")
        .map((c) => c.data as FeedSection);

      return {
        content: newContent,
        items,
        sections,
        isDirty: true,
      };
    });
  },

  // Save state actions
  setSaveState: (saveState) => {
    set({ saveState });
  },

  markDirty: () => {
    set({ isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  updateLastSaved: () => {
    set({ lastSaved: new Date(), isDirty: false, saveState: "saved" });
  },

  // Source selection actions
  addSource: (sourceId) => {
    set((state) => ({
      selectedSourceIds: [...state.selectedSourceIds, sourceId],
      isDirty: true,
    }));
  },

  removeSource: (sourceId) => {
    set((state) => ({
      selectedSourceIds: state.selectedSourceIds.filter((id) => id !== sourceId),
      isDirty: true,
    }));
  },

  setSelectedSources: (sourceIds) => {
    set({ selectedSourceIds: sourceIds, isDirty: true });
  },

  clearSources: () => {
    set({ selectedSourceIds: [], isDirty: true });
  },

  // Schedule configuration actions (Story 1.3.4)
  setSchedule: (schedule) => {
    set({ schedule, isDirty: true });
  },

  updateSchedule: (updates) => {
    set((state) => ({
      schedule: state.schedule ? { ...state.schedule, ...updates } : null,
      isDirty: true,
    }));
  },

  clearSchedule: () => {
    set({ schedule: null, isDirty: true });
  },
}));
