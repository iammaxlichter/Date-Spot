import { create } from "zustand";
import type { SpotFilters } from "../features/filters/types";
import { DEFAULT_SPOT_FILTERS } from "../features/filters/types";

type SpotFilterStore = {
  filters: SpotFilters;
  showRelationshipUpdates: boolean;
  setFilters: (filters: SpotFilters) => void;
  setShowRelationshipUpdates: (show: boolean) => void;
  resetFilters: () => void;
};

export const useSpotFiltersStore = create<SpotFilterStore>((set) => ({
  filters: DEFAULT_SPOT_FILTERS,
  showRelationshipUpdates: true,
  setFilters: (filters) => set({ filters }),
  setShowRelationshipUpdates: (showRelationshipUpdates) => set({ showRelationshipUpdates }),
  resetFilters: () => set({ filters: DEFAULT_SPOT_FILTERS, showRelationshipUpdates: true }),
}));
