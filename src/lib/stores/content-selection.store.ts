import { create } from "zustand";

interface ContentSelectionStore {
  selectedIds: Set<number>;
  toggleSelection: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
}

export const useContentSelection = create<ContentSelectionStore>((set, get) => ({
  selectedIds: new Set(),

  toggleSelection: (id: number) => {
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet };
    });
  },

  selectAll: (ids: number[]) => {
    set({ selectedIds: new Set(ids) });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  isSelected: (id: number) => {
    return get().selectedIds.has(id);
  },
}));
