// src/lib/api/places.ts
import { supabase } from "../supabase";

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;

  // these exist in your old API model; we'll keep them for compatibility
  address?: string | null;

  // old aggregated fields (you can remove later)
  atmosphereAverage: number | null;
  dateAverage: number | null;
  totalRatings: number;

  // new fields (used by your NewSpotSheet flow)
  atmosphere?: string | null;
  date_score?: number | null;
  notes?: string | null;
  vibe?: "Chill" | "Romantic" | "Energetic" | "Intimate" | "Social" | null;
  price?: "$" | "$$" | "$$$" | "$$$$" | "$$$$$" | null;
  best_for?: "Day" | "Night" | "Sunset" | "Any" | null;
  would_return?: boolean | null;
};

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in KM
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

/**
 * Supabase replacement for getNearbyPlaces
 * - Pulls user's spots
 * - Filters by radiusKm on the client
 */
export async function getNearbyPlaces(lat: number, lng: number, radiusKm = 10) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("spots")
    .select(
      "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const filtered = (data ?? []).filter((s) => {
    const d = distanceKm(lat, lng, s.latitude, s.longitude);
    return d <= radiusKm;
  });

  // Map to your existing Place shape so the rest of the app doesn't break
  return filtered.map(
    (s): Place => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      address: null,

      // you used to have averages/ratings count; you don't yet in supabase
      atmosphereAverage: null,
      dateAverage: s.date_score ?? null,
      totalRatings: 0,

      atmosphere: s.atmosphere ?? null,
      date_score: s.date_score ?? null,
      notes: s.notes ?? null,
      vibe: (s.vibe as any) ?? null,
      price: (s.price as any) ?? null,
      best_for: (s.best_for as any) ?? null,
      would_return: s.would_return ?? null,
    })
  );
}

/**
 * Supabase replacement for createPlace
 * Creates a spot row owned by the logged-in user
 */
export async function createPlace(input: {
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  googlePlaceId?: string | null; // currently ignored (not in schema yet)
}) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("spots")
    .insert({
      user_id: userId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .select(
      "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
    )
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create spot");

  const place: Place = {
    id: data.id,
    name: data.name,
    latitude: data.latitude,
    longitude: data.longitude,
    address: null,
    atmosphereAverage: null,
    dateAverage: data.date_score ?? null,
    totalRatings: 0,
    atmosphere: data.atmosphere ?? null,
    date_score: data.date_score ?? null,
    notes: data.notes ?? null,
    vibe: (data.vibe as any) ?? null,
    price: (data.price as any) ?? null,
    best_for: (data.best_for as any) ?? null,
    would_return: data.would_return ?? null,
  };

  return place;
}

/**
 * Supabase replacement for createSpotRating
 * In your current schema, ratings live ON the spot row,
 * so this is an UPDATE of the spot.
 */
export async function createSpotRating(
  placeId: string,
  input: {
    atmosphereScore: number; // you used numeric here before; we'll store as text for now
    dateScore: number;
    wouldReturn: boolean;
    notes?: string;
    vibe?: "Chill" | "Romantic" | "Energetic" | "Intimate" | "Social";
    price?: "$" | "$$" | "$$$" | "$$$$" | "$$$$$";
    bestFor?: "Day" | "Night" | "Sunset" | "Any";
  }
) {
  // Ensure logged in (and RLS will enforce ownership)
  await requireUserId();

  const { data, error } = await supabase
    .from("spots")
    .update({
      // mapping:
      // old "atmosphereScore" was a number; your table uses text "atmosphere"
      atmosphere: String(input.atmosphereScore),
      date_score: input.dateScore,
      would_return: input.wouldReturn,
      notes: input.notes ?? null,
      vibe: input.vibe ?? null,
      price: input.price ?? null,
      best_for: input.bestFor ?? null,
    })
    .eq("id", placeId)
    .select(
      "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
    )
    .single();

  if (error) throw error;
  return data;
}
