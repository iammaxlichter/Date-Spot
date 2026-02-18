import { supabase } from "../supabase/client";

export type Spot = {
  id: string;
  user_id?: string;
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
  author_id?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
};

export type FollowedSpotRow = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean;
};

export type FollowedSpotAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type FollowedDateSpot = {
  spot: FollowedSpotRow;
  author: FollowedSpotAuthor;
};

export type MapSpot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  user_id: string;
  created_at: string;
  atmosphere?: string | null;
  date_score?: number | null;
  author: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    name: string;
  };
};

type JoinedProfile = {
  id: string;
  avatar_url: string | null;
  username: string | null;
  name: string | null;
};

function extractProfilePicturePath(input: string | null | undefined): string | null {
  if (!input) return null;

  if (input.startsWith("http://") || input.startsWith("https://")) {
    const marker = "/profile_pictures/";
    const idx = input.indexOf(marker);
    if (idx === -1) return null;
    const after = input.slice(idx + marker.length);
    if (!after) return null;
    const clean = after.split("?")[0];
    return clean || null;
  }

  return input;
}

function normalizeJoinedProfile(input: unknown): JoinedProfile | null {
  if (!input) return null;
  if (Array.isArray(input)) return (input[0] as JoinedProfile | undefined) ?? null;
  return input as JoinedProfile;
}

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
 * Feed query used by FeedScreen (and map marker prep) to load DateSpots in one request.
 * Flow: query `spots` rows visible by RLS (self + followed users), join each row to
 * `profiles`, then shape each result as `{ spot, author }` so UI can use author avatar.
 */
export async function getFollowedDateSpots(limit = 25): Promise<FollowedDateSpot[]> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `
      id,user_id,name,latitude,longitude,created_at,
      atmosphere,date_score,notes,vibe,price,best_for,would_return,
      profiles!inner(id,name,username,avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as Array<
    FollowedSpotRow & {
      profiles: unknown;
    }
  >;

  return rows.map((row) => {
    const profile = normalizeJoinedProfile(row.profiles);
    return {
      spot: {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        created_at: row.created_at,
        atmosphere: row.atmosphere ?? null,
        date_score: row.date_score ?? null,
        notes: row.notes ?? null,
        vibe: row.vibe ?? null,
        price: row.price ?? null,
        best_for: row.best_for ?? null,
        would_return: row.would_return,
      },
      author: {
        id: profile?.id ?? row.user_id,
        name: profile?.name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
    };
  });
}

export async function getFollowedMapSpots(limit = 500): Promise<MapSpot[]> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `
      id,name,latitude,longitude,user_id,created_at,atmosphere,date_score,
      profiles:profiles!spots_user_id_fkey(id,avatar_url,username,name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    user_id: string;
    created_at: string;
    atmosphere: string | null;
    date_score: number | null;
    profiles: unknown;
  }>;

  const avatarPathBySpotId = new Map<string, string>();
  const avatarPaths = Array.from(
    new Set(
      rows
        .map((row) => {
          const profile = normalizeJoinedProfile(row.profiles);
          const raw = profile?.avatar_url ?? null;
          const path = extractProfilePicturePath(raw);
          if (path) avatarPathBySpotId.set(row.id, path);
          return path;
        })
        .filter((v): v is string => !!v)
    )
  );

  const signedAvatarByPath = new Map<string, string>();
  if (avatarPaths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from("profile_pictures")
      .createSignedUrls(avatarPaths, 3600);

    for (const item of signedData ?? []) {
      if (item?.path && item?.signedUrl) {
        signedAvatarByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => {
    const profile = normalizeJoinedProfile(row.profiles);
    const rawAvatar = profile?.avatar_url ?? null;
    const avatarPath = avatarPathBySpotId.get(row.id) ?? null;
    const resolvedAvatar =
      (avatarPath ? signedAvatarByPath.get(avatarPath) : null) ?? rawAvatar;

    return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    user_id: row.user_id,
    created_at: row.created_at,
    atmosphere: row.atmosphere ?? null,
    date_score: row.date_score ?? null,
    author: {
      id: profile?.id ?? row.user_id,
      avatar_url: resolvedAvatar,
      username: profile?.username ?? null,
      name: profile?.name ?? "",
    },
    };
  });
}

/**
 * Pulls user's spots then filters by radiusKm on client.
 */
export async function getNearbySpots(lat: number, lng: number, radiusKm = 10) {
  const rows = await getFollowedDateSpots(500);

  const filtered = rows.filter(({ spot }) => {
    const d = distanceKm(lat, lng, spot.latitude, spot.longitude);
    return d <= radiusKm;
  });

  return filtered.map(
    ({ spot, author }): Spot => ({
      id: spot.id,
      user_id: spot.user_id,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      address: null,

      atmosphereAverage: null,
      dateAverage: spot.date_score ?? null,
      totalRatings: 0,

      atmosphere: spot.atmosphere ?? null,
      date_score: spot.date_score ?? null,
      notes: spot.notes ?? null,
      vibe: spot.vibe ?? null,
      price: (spot.price as Spot["price"]) ?? null,
      best_for: (spot.best_for as Spot["best_for"]) ?? null,
      would_return: spot.would_return ?? null,
      author_id: author.id,
      author_name: author.name,
      author_username: author.username,
      author_avatar_url: author.avatar_url,
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
