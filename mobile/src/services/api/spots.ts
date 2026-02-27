import { supabase } from "../supabase/client";
import { fetchSpotTagsForSpotIds, type TaggedUser } from "./spotTags";
import type { SpotFilters } from "../../features/filters/types";

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
  notes?: string | null;
  vibe?: string | null;
  price?: string | null;
  best_for?: string | null;
  would_return?: boolean | null;
  tagged_users?: TaggedUser[];
  author: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    name: string;
  };
};

export type MapPerson = {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
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

function toAtmosphereFilterValues(values: number[]): string[] {
  return values.map((v) => String(v));
}

async function signProfileAvatarUrls(
  profileRows: Array<{ key: string; avatar_url: string | null }>
): Promise<Map<string, string>> {
  const avatarPathByKey = new Map<string, string>();
  const avatarPaths = Array.from(
    new Set(
      profileRows
        .map((row) => {
          const path = extractProfilePicturePath(row.avatar_url);
          if (path) avatarPathByKey.set(row.key, path);
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

  const resolvedByKey = new Map<string, string>();
  for (const row of profileRows) {
    const path = avatarPathByKey.get(row.key);
    if (!path) continue;
    const signed = signedAvatarByPath.get(path);
    if (signed) resolvedByKey.set(row.key, signed);
  }
  return resolvedByKey;
}

async function resolvePeopleFilteredSpotIds(selectedUserIds: string[]): Promise<string[] | null> {
  if (selectedUserIds.length === 0) return null;

  const [{ data: creatorRows, error: creatorErr }, { data: taggedRows, error: taggedErr }] =
    await Promise.all([
      supabase.from("spots").select("id").in("user_id", selectedUserIds),
      supabase.from("date_spot_tags").select("spot_id").in("tagged_user_id", selectedUserIds),
    ]);

  if (creatorErr) throw creatorErr;
  if (taggedErr) throw taggedErr;

  const ids = new Set<string>();
  for (const row of (creatorRows ?? []) as Array<{ id: string }>) {
    if (row.id) ids.add(row.id);
  }
  for (const row of (taggedRows ?? []) as Array<{ spot_id: string }>) {
    if (row.spot_id) ids.add(row.spot_id);
  }
  return Array.from(ids);
}

function applyServerFiltersToSpotsQuery<TQuery>(query: TQuery, filters?: SpotFilters): TQuery {
  if (!filters) return query;

  let next = query as any;

  if (filters.selectedVibes.length > 0) {
    next = next.in("vibe", filters.selectedVibes);
  }
  if (filters.selectedAtmospheres.length > 0) {
    next = next.in("atmosphere", toAtmosphereFilterValues(filters.selectedAtmospheres));
  }
  if (filters.selectedDateScores.length > 0) {
    next = next.in("date_score", filters.selectedDateScores);
  }
  if (filters.selectedPriceBuckets.length > 0) {
    next = next.in("price", filters.selectedPriceBuckets);
  }
  if (filters.selectedBestFors.length > 0) {
    next = next.in("best_for", filters.selectedBestFors);
  }
  if (filters.selectedWouldReturn.length === 1) {
    next = next.eq("would_return", filters.selectedWouldReturn[0]);
  }

  if (filters.sortOption === "newest") {
    next = next.order("created_at", { ascending: false });
  } else if (filters.sortOption === "oldest") {
    next = next.order("created_at", { ascending: true });
  } else if (filters.sortOption === "highestDateScore") {
    next = next.order("date_score", { ascending: false, nullsFirst: false });
  } else {
    // highestAtmosphere is stored as text in current schema; fallback sort remains client-side.
    next = next.order("created_at", { ascending: false });
  }

  return next as TQuery;
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
export async function getFollowedDateSpots(
  limit = 25,
  filters?: SpotFilters
): Promise<FollowedDateSpot[]> {
  const peopleSpotIds = await resolvePeopleFilteredSpotIds(filters?.selectedUserIds ?? []);
  if (filters?.selectedUserIds?.length && peopleSpotIds && peopleSpotIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("spots")
    .select(
      `
      id,user_id,name,latitude,longitude,created_at,
      atmosphere,date_score,notes,vibe,price,best_for,would_return,
      profiles!inner(id,name,username,avatar_url)
    `
    );

  if (peopleSpotIds && peopleSpotIds.length > 0) {
    query = query.in("id", peopleSpotIds);
  }

  query = applyServerFiltersToSpotsQuery(query, filters).limit(limit);

  const { data, error } = await query;

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

export async function getFollowedMapSpots(limit = 500, filters?: SpotFilters): Promise<MapSpot[]> {
  const peopleSpotIds = await resolvePeopleFilteredSpotIds(filters?.selectedUserIds ?? []);
  if (filters?.selectedUserIds?.length && peopleSpotIds && peopleSpotIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("spots")
    .select(
      `
      id,name,latitude,longitude,user_id,created_at,atmosphere,date_score,notes,vibe,price,best_for,would_return,
      profiles:profiles!spots_user_id_fkey(id,avatar_url,username,name)
    `
    );

  if (peopleSpotIds && peopleSpotIds.length > 0) {
    query = query.in("id", peopleSpotIds);
  }

  query = applyServerFiltersToSpotsQuery(query, filters).limit(limit);

  const { data, error } = await query;

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
    notes: string | null;
    vibe: string | null;
    price: string | null;
    best_for: string | null;
    would_return: boolean | null;
    profiles: unknown;
  }>;

  const tagsBySpot = await fetchSpotTagsForSpotIds(rows.map((row) => row.id));

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
    notes: row.notes ?? null,
    vibe: row.vibe ?? null,
    price: row.price ?? null,
    best_for: row.best_for ?? null,
    would_return: row.would_return ?? null,
    tagged_users: tagsBySpot[row.id] ?? [],
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
 * Lightweight list of people represented on the map (same source visibility as map spots).
 * Used by FiltersScreen People section (id + display name + avatar).
 */
export async function getPeopleOnMyMap(limit = 500): Promise<MapPerson[]> {
  const { data, error } = await supabase
    .from("spots")
    .select(
      `
      user_id,
      created_at,
      profiles:profiles!spots_user_id_fkey(id,avatar_url,username,name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    user_id: string;
    created_at: string;
    profiles: unknown;
  }>;

  const byUserId = new Map<
    string,
    { user_id: string; display_name: string; username: string | null; avatar_url: string | null }
  >();

  for (const row of rows) {
    if (!row.user_id || byUserId.has(row.user_id)) continue;
    const profile = normalizeJoinedProfile(row.profiles);
    const displayName =
      (profile?.name ?? "").trim() ||
      (profile?.username ? `@${profile.username}` : "").trim() ||
      "Unknown user";

    byUserId.set(row.user_id, {
      user_id: row.user_id,
      display_name: displayName,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
    });
  }

  const people = Array.from(byUserId.values());
  const signedByUserId = await signProfileAvatarUrls(
    people.map((person) => ({ key: person.user_id, avatar_url: person.avatar_url }))
  );

  return people
    .map((person) => ({
      ...person,
      avatar_url: signedByUserId.get(person.user_id) ?? person.avatar_url,
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}

export async function getMapSpotVibes(limit = 500): Promise<string[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("vibe,created_at")
    .not("vibe", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return Array.from(
    new Set(
      ((data ?? []) as Array<{ vibe: string | null }>)
        .map((row) => (row.vibe ?? "").trim())
        .filter((v) => v.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
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
