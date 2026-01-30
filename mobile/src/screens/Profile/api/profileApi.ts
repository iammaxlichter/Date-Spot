import { supabase } from "../../../services/supabase/client";

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

  return (data as SpotRow[]) ?? [];
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
