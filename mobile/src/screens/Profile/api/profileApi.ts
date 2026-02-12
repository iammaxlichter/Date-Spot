import { supabase } from "../../../services/supabase/client";
import { fetchSpotTagsForSpotIds, type TaggedUser } from "../../../services/api/spotTags";

const SPOT_PHOTOS_BUCKET = "spot-photos";

export type SpotPhotoPreview = {
  id: string;
  path: string;
  position: number;
  signedUrl: string;
};

export type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
};

export type PartnershipRow = {
  id: string;
  user_a: string;
  user_b: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  requested_by: string;
  created_at: string;
  responded_at: string | null;
};

export type PartnerMini = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  name: string | null;
};

export type SpotRow = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean;
  photos: SpotPhotoPreview[];
  tagged_users: TaggedUser[];
};

export async function getMyAcceptedPartnership(myId: string): Promise<PartnershipRow | null> {
  const { data, error } = await supabase
    .from("partnerships")
    .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
    .eq("status", "accepted")
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    .order("responded_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as PartnershipRow) ?? null;
}

export function otherUserId(p: PartnershipRow, me: string) {
  return p.user_a === me ? p.user_b : p.user_a;
}

export async function getPartnerMini(userId: string): Promise<PartnerMini | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as PartnerMini | null) ?? null;
}

export async function fetchCounts(userId: string) {
  const [
    { count: followersCount, error: followersErr },
    { count: followingCount, error: followingErr },
  ] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  if (followersErr) throw followersErr;
  if (followingErr) throw followingErr;

  return {
    followers_count: followersCount ?? 0,
    following_count: followingCount ?? 0,
  };
}

export async function fetchUserSpots(userId: string): Promise<SpotRow[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("id,created_at,user_id,name,atmosphere,date_score,notes,vibe,price,best_for,would_return")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching spots:", error);
    throw error;
  }

  const spots = (data as Omit<SpotRow, "photos" | "tagged_users">[]) ?? [];
  if (!spots.length) return [];

  const spotIds = spots.map((s) => s.id);

  const [{ data: photoRows, error: photosErr }, tagsBySpot] = await Promise.all([
    supabase
      .from("spot_photos")
      .select("id,spot_id,path,position,created_at")
      .eq("user_id", userId)
      .in("spot_id", spotIds)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    fetchSpotTagsForSpotIds(spotIds),
  ]);

  if (photosErr) {
    console.error("Error fetching spot photos:", photosErr);
    return spots.map((s) => ({ ...s, photos: [], tagged_users: tagsBySpot[s.id] ?? [] }));
  }

  const rows =
    (photoRows as Array<{
      id: string;
      spot_id: string;
      path: string;
      position: number;
      created_at: string;
    }>) ?? [];

  const paths = rows.map((r) => r.path);
  const signedByPath = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData, error: signedErr } = await supabase.storage
      .from(SPOT_PHOTOS_BUCKET)
      .createSignedUrls(paths, 3600);

    if (signedErr) {
      console.error("Error creating signed photo URLs:", signedErr);
    } else {
      for (const item of signedData ?? []) {
        if (item?.path && item?.signedUrl) {
          signedByPath.set(item.path, item.signedUrl);
        }
      }
    }
  }

  const photosBySpot = new Map<string, SpotPhotoPreview[]>();
  for (const r of rows) {
    const list = photosBySpot.get(r.spot_id) ?? [];
    list.push({
      id: r.id,
      path: r.path,
      position: r.position,
      signedUrl: signedByPath.get(r.path) ?? "",
    });
    photosBySpot.set(r.spot_id, list);
  }

  return spots.map((s) => ({
    ...s,
    photos: (photosBySpot.get(s.id) ?? []).filter((p) => !!p.signedUrl),
    tagged_users: tagsBySpot[s.id] ?? [],
  }));
}

export function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
