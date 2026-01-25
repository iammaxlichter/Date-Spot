// src/screens/Home/hooks/usePlacesAutocomplete.ts
import { useEffect, useState } from "react";
import type { Region } from "react-native-maps";
import { DEFAULT_AUTOCOMPLETE_RADIUS } from "../constants";
import type { GooglePrediction } from "../types";
import { fetchAutocomplete } from "../../../lib/google/places";

export function usePlacesAutocomplete(params: {
  region: Region | null;
  searchQuery: string;
  showSuggestions: boolean;
}) {
  const { region, searchQuery, showSuggestions } = params;

  const [googleResults, setGoogleResults] = useState<GooglePrediction[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!region) return;
    if (!showSuggestions) return;

    if (searchQuery.length < 2) {
      setGoogleResults([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setSearching(true);

        const json = await fetchAutocomplete({
          input: searchQuery,
          location: { latitude: region.latitude, longitude: region.longitude },
          radius: DEFAULT_AUTOCOMPLETE_RADIUS,
        });

        if (!cancelled) {
          setGoogleResults((json.predictions ?? []) as GooglePrediction[]);
        }
      } catch (err) {
        console.error("Places autocomplete error", err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, region, showSuggestions]);

  const clearGoogleResults = () => setGoogleResults([]);

  return { googleResults, searching, clearGoogleResults };
}
