import type { BestFor, Price } from "../../types/datespot";

export type SpotSortOption =
  | "newest"
  | "oldest"
  | "highestDateScore"
  | "highestAtmosphere";

export type SpotFilters = {
  sortOption: SpotSortOption;
  selectedVibes: string[];
  selectedAtmospheres: number[];
  selectedDateScores: number[];
  selectedPriceBuckets: Price[];
  selectedBestFors: BestFor[];
  selectedWouldReturn: boolean[];
  selectedUserIds: string[];
};

export const DEFAULT_SPOT_FILTERS: SpotFilters = {
  sortOption: "newest",
  selectedVibes: [],
  selectedAtmospheres: [],
  selectedDateScores: [],
  selectedPriceBuckets: [],
  selectedBestFors: [],
  selectedWouldReturn: [],
  selectedUserIds: [],
};

export const PRICE_BUCKETS: Price[] = [
  "$1-10",
  "$10-20",
  "$20-30",
  "$30-50",
  "$50-100",
  "$100+",
  "No $",
];

export const BEST_FOR_OPTIONS: BestFor[] = ["Day", "Night", "Sunrise", "Sunset", "Any"];

export const VIBE_PRESETS = [
  "Chill",
  "Romantic",
  "Energetic",
  "Intimate",
  "Social",
  "Aesthetic",
];
