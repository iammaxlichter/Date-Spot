import { create } from "zustand";
import type { SpotFilters } from "../features/filters/types";
import { DEFAULT_SPOT_FILTERS } from "../features/filters/types";

type SpotFilterStore = {
  filters: SpotFilters;
  setFilters: (filters: SpotFilters) => void;
  resetFilters: () => void;
};

export const useSpotFiltersStore = create<SpotFilterStore>((set) => ({
  filters: DEFAULT_SPOT_FILTERS,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_SPOT_FILTERS }),
}));
