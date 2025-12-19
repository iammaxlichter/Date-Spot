// src/screens/Home/hooks/useSpotCreation.ts
import { useMemo, useState } from "react";
import type { Region } from "react-native-maps";
import { Alert } from "react-native";
import { createPlace, createSpotRating } from "../../../lib/api/places";
import type { Coords, NewSpotDraft } from "../types";

function makeEmptyDraft(coords: Coords | null): NewSpotDraft {
  return {
    coords,
    name: "",
    atmosphere: "8",
    dateScore: "8",
    notes: "",
    vibe: null,
    price: null,
    bestFor: null,
    wouldReturn: true,
  };
}

export function useSpotCreation(params: {
  onSaved: (place: any) => void;
}) {
  const { onSaved } = params;

  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [showNewSpotSheet, setShowNewSpotSheet] = useState(false);

  const [draft, setDraft] = useState<NewSpotDraft>(() => makeEmptyDraft(null));

  const newSpotCoords = useMemo(() => draft.coords, [draft.coords]);

  const startNewSpot = (region: Region) => {
    const coords: Coords = { latitude: region.latitude, longitude: region.longitude };
    setDraft(makeEmptyDraft(coords));
    setIsPlacingPin(true);
    setShowNewSpotSheet(false);
  };

  const cancelNewSpot = () => {
    setShowNewSpotSheet(false);
    setIsPlacingPin(false);
    setDraft(makeEmptyDraft(null));
  };

  const goToDetails = () => {
    setIsPlacingPin(false);
    setShowNewSpotSheet(true);
  };

  const updateCoords = (coords: Coords) => {
    setDraft((prev) => ({ ...prev, coords }));
  };

  const setField = <K extends keyof NewSpotDraft>(key: K, value: NewSpotDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveNewSpot = async () => {
    if (!draft.coords) return;

    if (!draft.name.trim()) {
      Alert.alert("Name required", "Please enter a name for the date spot.");
      return;
    }

    try {
      console.log("Creating place…");
      const place = await createPlace({
        name: draft.name.trim(),
        latitude: draft.coords.latitude,
        longitude: draft.coords.longitude,
      });

      console.log("Place created → creating rating…");
      await createSpotRating(place.id, {
        atmosphereScore: Number(draft.atmosphere),
        dateScore: Number(draft.dateScore),
        notes: draft.notes.trim() || undefined,
        vibe: draft.vibe ?? undefined,
        price: draft.price ?? undefined,
        bestFor: draft.bestFor ?? undefined,
        wouldReturn: draft.wouldReturn,
      });

      onSaved(place);

      Alert.alert("Success!", "Your date spot has been saved.");

      setShowNewSpotSheet(false);
      setIsPlacingPin(false);
      setDraft(makeEmptyDraft(null));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save date spot.");
    }
  };

  return {
    // state
    isPlacingPin,
    showNewSpotSheet,
    draft,
    newSpotCoords,

    // actions
    startNewSpot,
    cancelNewSpot,
    goToDetails,
    updateCoords,
    setField,
    saveNewSpot,

    // setters (if you need them)
    setIsPlacingPin,
    setShowNewSpotSheet,
  };
}
