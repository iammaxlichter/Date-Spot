import { supabase } from "../supabase/client";

export type Spot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;

  // kept for compatibility
  address?: string | null;

  // old aggregated fields (you can remove later)
  atmosphereAverage: number | null;
  dateAverage: number | null;
  totalRatings: number;

  // new fields (used by your NewSpotSheet flow)
  atmosphere?: string | null;
  date_score?: number | null;
  notes?: string | null;
  vibe?: string | null;
  price?:
    | "$1-10"
    | "$10-20"
    | "$20-30"
    | "$30-50"
    | "$50-100"
    | "$100+"
    | "No $"
    | null;
  best_for?: "Day" | "Night" | "Sunrise" | "Sunset" | "Any" | null;
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
 * Pulls user's spots then filters by radiusKm on client.
 */
export async function getNearbySpots(lat: number, lng: number, radiusKm = 10) {
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

  return filtered.map(
    (s): Spot => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      address: null,

      atmosphereAverage: null,
      dateAverage: s.date_score ?? null,
      totalRatings: 0,

      atmosphere: s.atmosphere ?? null,
      date_score: s.date_score ?? null,
      notes: s.notes ?? null,
      vibe: s.vibe ?? null,
      price: s.price ?? null,
      best_for: s.best_for ?? null,
      would_return: s.would_return ?? null,
    })
  );
}

/**
 * Creates a spot row owned by the logged-in user.
 */
export async function createSpot(input: {
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

  const spot: Spot = {
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
    vibe: data.vibe ?? null,
    price: data.price ?? null,
    best_for: data.best_for ?? null,
    would_return: data.would_return ?? null,
  };

  return spot;
}

/**
 * Updates the spot row with the user's rating fields.
 */
export async function rateSpot(
  spotId: string,
  input: {
    atmosphereScore: number;
    dateScore: number;
    wouldReturn: boolean;
    notes?: string;
    vibe?: string;
    price?:
      | "$1-10"
      | "$10-20"
      | "$20-30"
      | "$30-50"
      | "$50-100"
      | "$100+"
      | "No $";
    bestFor?: "Day" | "Night" | "Sunrise" | "Sunset" | "Any";
  }
) {
  await requireUserId();

  const { data, error } = await supabase
    .from("spots")
    .update({
      atmosphere: String(input.atmosphereScore),
      date_score: input.dateScore,
      would_return: input.wouldReturn,
      notes: input.notes ?? null,
      vibe: input.vibe ?? null,
      price: input.price ?? null,
      best_for: input.bestFor ?? null,
    })
    .eq("id", spotId)
    .select(
      "id,name,latitude,longitude,atmosphere,date_score,notes,vibe,price,best_for,would_return,created_at"
    )
    .single();

  if (error) throw error;
  return data;
}
