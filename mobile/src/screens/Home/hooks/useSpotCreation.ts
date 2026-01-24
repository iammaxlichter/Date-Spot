// src/screens/Home/hooks/useSpotCreation.ts
import { useMemo, useState } from "react";
import type { Region } from "react-native-maps";
import { Alert } from "react-native";
import { supabase } from "../../../lib/supabase";
import type { Coords, NewSpotDraft } from "../types";

function makeEmptyDraft(coords: Coords | null): NewSpotDraft {
  return {
    coords,
    name: "",
    atmosphere: "",
    dateScore: "",
    notes: "",
    vibe: null,
    price: null,
    bestFor: null,
    wouldReturn: true,
  };
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function useSpotCreation(params: { onSaved: (place: any) => void }) {
  const { onSaved } = params;

  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [showNewSpotSheet, setShowNewSpotSheet] = useState(false);

  const [draft, setDraft] = useState<NewSpotDraft>(() => makeEmptyDraft(null));

  const newSpotCoords = useMemo(() => draft.coords, [draft.coords]);

  const startNewSpot = (region: Region) => {
    const coords: Coords = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
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

  const setField = <K extends keyof NewSpotDraft>(
    key: K,
    value: NewSpotDraft[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Single-call save:
   * Inserts one row into Supabase "spots" with all fields.
   * (No more createPlace() + createSpotRating() two-step flow.)
   */
  const saveNewSpot = async () => {
    if (!draft.coords) return;

    if (!draft.name.trim()) {
      Alert.alert("Name required", "Please enter a name for the date spot.");
      return;
    }

    try {
      const userId = await requireUserId();

      const payload = {
        user_id: userId,
        name: draft.name.trim(),
        latitude: draft.coords.latitude,
        longitude: draft.coords.longitude,

        // your schema stores atmosphere as text, date_score as number
        atmosphere: draft.atmosphere ? String(draft.atmosphere) : null,
        date_score: draft.dateScore ? Number(draft.dateScore) : null,
        notes: draft.notes.trim() || null,
        vibe: draft.vibe ?? null,
        price: draft.price ?? null,
        best_for: draft.bestFor ?? null,
        would_return: draft.wouldReturn,
      };

      console.log("Saving spot (single insert)…");

      const { data, error } = await supabase
        .from("spots")
        .insert(payload)
        .select(
          "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
        )
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to save spot");

      onSaved(data);

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
