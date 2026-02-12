// src/screens/Home/hooks/useSpotCreation.ts
import { useMemo, useState } from "react";
import type { Region } from "react-native-maps";
import { Alert } from "react-native";
import { supabase } from "../../../services/supabase/client";
import type { Coords, NewSpotDraft } from "../types";
import * as FileSystem from "expo-file-system/legacy";
import { upsertSpotTags } from "../../../services/api/spotTags";

/* ============================================================
   Base64 decode helper (no atob dependency)
   ============================================================ */
function base64ToUint8Array(base64: string): Uint8Array {
  // RN doesn't reliably support atob/btoa. Decode base64 manually.
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, "");

  const bytes: number[] = [];
  let i = 0;

  while (i < cleaned.length) {
    const enc1 = chars.indexOf(cleaned.charAt(i++));
    const enc2 = chars.indexOf(cleaned.charAt(i++));
    const enc3 = chars.indexOf(cleaned.charAt(i++));
    const enc4 = chars.indexOf(cleaned.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);

    if (enc3 !== 64 && cleaned.charAt(i - 2) !== "=") bytes.push(chr2);
    if (enc4 !== 64 && cleaned.charAt(i - 1) !== "=") bytes.push(chr3);
  }

  return new Uint8Array(bytes);
}

/* ============================================================
   Photo upload helper
   ============================================================ */
/* ============================================================
   Photo upload helper
   ============================================================ */
async function uploadSpotPhotos(args: {
  spotId: string;
  userId: string;
  photos: { id: string; uri: string; mimeType: string }[];
}) {
  const { spotId, userId, photos } = args;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    const fileExt = photo.mimeType === "image/png" ? "png" : "jpg";
    const path = `${userId}/${spotId}/${photo.id}.${fileExt}`;

    try {
      // 1) Read local file:// as base64
      const base64 = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: "base64",
      });

      // 2) Convert base64 -> Uint8Array (safe for RN/Expo)
      const bytes = base64ToUint8Array(base64);

      // 3) Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("spot-photos")
        .upload(path, bytes, {
          contentType: photo.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('      ❌ Upload failed:', uploadError);
        console.error('      Error details:', JSON.stringify(uploadError, null, 2));
        continue; // don't abort everything
      }
      // 4) Insert DB row
      const { error: dbError } = await supabase.from("spot_photos").insert({
        spot_id: spotId,
        user_id: userId,
        path,
        position: i,
      });

      if (dbError) {
        console.error('      ❌ DB insert failed:', dbError);
      }
    } catch (err) {
      console.error('      ❌ Photo processing failed:', err);
    }
  }

}

/* ============================================================
   Draft helpers
   ============================================================ */
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

/* ============================================================
   Hook
   ============================================================ */
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

  /* ============================================================
     SAVE (with photos)
     ============================================================ */
  const saveNewSpot = async (
    photos: { id: string; uri: string; mimeType: string }[] = [],
    taggedUserIds: string[] = []
  ) => {
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

        atmosphere: draft.atmosphere ? String(draft.atmosphere) : null,
        date_score: draft.dateScore ? Number(draft.dateScore) : null,
        notes: draft.notes.trim() || null,
        vibe: draft.vibe ?? null,
        price: draft.price ?? null,
        best_for: draft.bestFor ?? null,
        would_return: draft.wouldReturn,
      };

      const { data, error } = await supabase
        .from("spots")
        .insert(payload)
        .select(
          "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
        )
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to save spot");

      // Upload photos AFTER spot exists
      if (photos.length > 0) {
        await uploadSpotPhotos({
          spotId: data.id,
          userId,
          photos,
        });
      }

      // Save tagged users after spot exists.
      await upsertSpotTags(data.id, taggedUserIds);

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

    // setters
    setIsPlacingPin,
    setShowNewSpotSheet,
  };
}
