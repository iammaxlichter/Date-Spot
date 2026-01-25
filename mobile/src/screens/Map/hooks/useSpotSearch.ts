// src/screens/Home/hooks/useSpotSearch.ts
import { useMemo, useState } from "react";
import type { Place } from "../../../lib/api/places";

export function useSpotSearch(spots: Place[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const localMatches = useMemo(() => {
    if (!searchQuery.length) return [];
    return spots.filter((spot) =>
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, spots]);

  return {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    localMatches,
  };
}
