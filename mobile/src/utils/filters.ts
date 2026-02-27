import type { TaggedUser } from "../services/api/spotTags";
import type { BestFor, Price } from "../types/datespot";
import type { SpotFilters } from "../features/filters/types";
import { DEFAULT_SPOT_FILTERS } from "../features/filters/types";

type SpotLike = {
  created_at: string;
  user_id: string;
  vibe?: string | null;
  atmosphere?: string | number | null;
  date_score?: number | null;
  price?: string | null;
  best_for?: string | null;
  would_return?: boolean | null;
  tagged_users?: TaggedUser[];
};

function toBucketNumber(input: unknown): number | null {
  if (input == null) return null;
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function matchesPeopleFilter(spot: SpotLike, selectedUserIds: string[]): boolean {
  if (selectedUserIds.length === 0) return true;
  if (selectedUserIds.includes(spot.user_id)) return true;
  return (spot.tagged_users ?? []).some((u) => selectedUserIds.includes(u.id));
}

function sortScore(value: number | null | undefined): number {
  return value ?? Number.NEGATIVE_INFINITY;
}

function sortComparator<T extends SpotLike>(
  a: T,
  b: T,
  sortOption: SpotFilters["sortOption"]
): number {
  if (sortOption === "newest") {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }
  if (sortOption === "oldest") {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  if (sortOption === "highestDateScore") {
    return sortScore(b.date_score) - sortScore(a.date_score);
  }
  return sortScore(toBucketNumber(b.atmosphere)) - sortScore(toBucketNumber(a.atmosphere));
}

export function getActiveSpotFilterCount(filters: SpotFilters): number {
  let count = 0;
  if (filters.sortOption !== DEFAULT_SPOT_FILTERS.sortOption) count += 1;
  if (filters.selectedVibes.length > 0) count += 1;
  if (filters.selectedAtmospheres.length > 0) count += 1;
  if (filters.selectedDateScores.length > 0) count += 1;
  if (filters.selectedPriceBuckets.length > 0) count += 1;
  if (filters.selectedBestFors.length > 0) count += 1;
  if (filters.selectedWouldReturn.length > 0) count += 1;
  if (filters.selectedUserIds.length > 0) count += 1;
  return count;
}

export function hasActiveSpotFilters(filters: SpotFilters): boolean {
  return getActiveSpotFilterCount(filters) > 0;
}

export function applySpotFilters<T extends SpotLike>(spots: T[], filters: SpotFilters): T[] {
  const filtered = spots.filter((spot) => {
    // OR within category, AND across categories.
    if (filters.selectedVibes.length > 0 && !filters.selectedVibes.includes(spot.vibe ?? "")) {
      return false;
    }

    if (filters.selectedAtmospheres.length > 0) {
      const atmosphere = toBucketNumber(spot.atmosphere);
      if (atmosphere == null || !filters.selectedAtmospheres.includes(atmosphere)) {
        return false;
      }
    }

    if (filters.selectedDateScores.length > 0) {
      const dateScore = toBucketNumber(spot.date_score);
      if (dateScore == null || !filters.selectedDateScores.includes(dateScore)) {
        return false;
      }
    }

    if (filters.selectedPriceBuckets.length > 0) {
      if (!spot.price || !filters.selectedPriceBuckets.includes(spot.price as Price)) {
        return false;
      }
    }

    if (filters.selectedBestFors.length > 0) {
      if (!spot.best_for || !filters.selectedBestFors.includes(spot.best_for as BestFor)) {
        return false;
      }
    }

    if (filters.selectedWouldReturn.length > 0) {
      if (spot.would_return == null || !filters.selectedWouldReturn.includes(spot.would_return)) {
        return false;
      }
    }

    return matchesPeopleFilter(spot, filters.selectedUserIds);
  });

  // Stable sort: preserve original order when comparator result is equal.
  return filtered
    .map((spot, index) => ({ spot, index }))
    .sort((a, b) => {
      const compared = sortComparator(a.spot, b.spot, filters.sortOption);
      if (compared !== 0) return compared;
      return a.index - b.index;
    })
    .map((entry) => entry.spot);
}

/*
Manual test checklist:
1) Select two vibes and one price: results should match (vibe A OR vibe B) AND price.
2) Select people filter with one creator: map pins and feed spots should only show that user's spots.
3) Select people who are only tagged on spots (not creator): tagged spots should still appear.
4) Toggle sort newest/oldest: ordering changes, item membership stays the same.
5) Toggle sort highest date score / atmosphere: spots with null values appear last.
6) Tap Reset: map/feed return to unfiltered state and active indicators clear.
*/
