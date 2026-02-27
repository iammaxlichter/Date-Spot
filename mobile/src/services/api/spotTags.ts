import { supabase } from "../supabase/client";
import { getActivePartner } from "./partnerships";

export type TaggedUser = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
};

// Hardcoded — eliminates the resolveTagTable() probe query on every cold load.
const TAG_TABLE = "date_spot_tags" as const;

const ELIGIBLE_CACHE_TTL_MS = 5 * 60 * 1000;
const eligibleCache = new Map<string, { users: TaggedUser[]; expiresAt: number }>();

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function assertSpotOwner(spotId: string, currentUserId: string) {
  const { data, error } = await supabase
    .from("spots")
    .select("id,user_id")
    .eq("id", spotId)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Spot not found.");
  if ((data as any).user_id !== currentUserId) {
    throw new Error("Only the spot owner can update tags.");
  }
}

async function getFollowingIds(currentUserId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  if (error) throw error;

  return new Set((data ?? []).map((row: any) => row.following_id).filter(Boolean));
}

async function getMutualIds(currentUserId: string): Promise<Set<string>> {
  const [{ data: outgoing, error: outgoingErr }, { data: incoming, error: incomingErr }] =
    await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", currentUserId),
      supabase.from("follows").select("follower_id").eq("following_id", currentUserId),
    ]);

  if (outgoingErr) throw outgoingErr;
  if (incomingErr) throw incomingErr;

  const outgoingSet = new Set((outgoing ?? []).map((row: any) => row.following_id).filter(Boolean));

  const mutualIds = new Set<string>();
  for (const row of incoming ?? []) {
    const followerId = (row as any).follower_id as string | undefined;
    if (followerId && outgoingSet.has(followerId)) {
      mutualIds.add(followerId);
    }
  }
  return mutualIds;
}

async function getAllowedTagIds(currentUserId: string): Promise<Set<string>> {
  const [followingIds, mutualIds, partner] = await Promise.all([
    getFollowingIds(currentUserId),
    getMutualIds(currentUserId),
    getActivePartner(currentUserId),
  ]);

  const allowed = new Set<string>();
  for (const id of followingIds) allowed.add(id);
  for (const id of mutualIds) allowed.add(id);
  if (partner?.id) allowed.add(partner.id);
  return allowed;
}

export async function fetchEligibleTagUsers(
  currentUserId: string,
  opts?: { forceRefresh?: boolean; alwaysIncludeUserIds?: string[] }
): Promise<TaggedUser[]> {
  const forceRefresh = !!opts?.forceRefresh;
  const alwaysInclude = unique(opts?.alwaysIncludeUserIds ?? []);
  const cacheKey = `${currentUserId}:${alwaysInclude.sort().join(",")}`;
  const cached = eligibleCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.users;
  }

  const allowedIds = await getAllowedTagIds(currentUserId);
  for (const id of alwaysInclude) allowedIds.add(id);

  const ids = Array.from(allowedIds);
  if (ids.length === 0) {
    eligibleCache.set(cacheKey, {
      users: [],
      expiresAt: Date.now() + ELIGIBLE_CACHE_TTL_MS,
    });
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,name,avatar_url")
    .in("id", ids)
    .order("username", { ascending: true });

  if (error) throw error;

  const users = (data ?? []) as TaggedUser[];
  eligibleCache.set(cacheKey, {
    users,
    expiresAt: Date.now() + ELIGIBLE_CACHE_TTL_MS,
  });
  return users;
}

/**
 * Single-query version: joins profiles inline via the tagged_user_id FK.
 * Replaces the old 2-query approach (fetch tag rows, then fetch profiles separately).
 */
export async function fetchSpotTags(spotId: string): Promise<TaggedUser[]> {
  const { data, error } = await supabase
    .from(TAG_TABLE)
    .select("tagged_user:profiles!tagged_user_id(id,username,name,avatar_url)")
    .eq("spot_id", spotId);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{ tagged_user: TaggedUser | null }>)
    .map((row) => row.tagged_user)
    .filter((v): v is TaggedUser => Boolean(v));
}

/**
 * Single-query version for batch spot IDs.
 * Old code: 1 probe query + 1 tags query + 1 profiles query = 3 round-trips.
 * New code: 1 joined query = 1 round-trip.
 */
export async function fetchSpotTagsForSpotIds(
  spotIds: string[]
): Promise<Record<string, TaggedUser[]>> {
  const uniqueSpotIds = unique(spotIds);
  const tagsBySpot: Record<string, TaggedUser[]> = {};
  for (const id of uniqueSpotIds) tagsBySpot[id] = [];

  if (uniqueSpotIds.length === 0) return tagsBySpot;

  const { data, error } = await supabase
    .from(TAG_TABLE)
    .select("spot_id,tagged_user:profiles!tagged_user_id(id,username,name,avatar_url)")
    .in("spot_id", uniqueSpotIds);

  if (error) throw error;

  for (const row of (data ?? []) as unknown as Array<{
    spot_id: string;
    tagged_user: TaggedUser | null;
  }>) {
    if (!row.tagged_user || !tagsBySpot[row.spot_id]) continue;
    tagsBySpot[row.spot_id].push(row.tagged_user);
  }

  return tagsBySpot;
}

export async function upsertSpotTags(spotId: string, taggedUserIds: string[]): Promise<void> {
  const currentUserId = await requireUserId();
  await assertSpotOwner(spotId, currentUserId);

  const cleanTargetIds = unique(taggedUserIds);
  const allowedIds = await getAllowedTagIds(currentUserId);
  const ineligible = cleanTargetIds.filter((id) => !allowedIds.has(id));
  if (ineligible.length > 0) {
    throw new Error("One or more selected users are not eligible to be tagged.");
  }

  const { data: existingRows, error: existingErr } = await supabase
    .from(TAG_TABLE)
    .select("tagged_user_id")
    .eq("spot_id", spotId);
  if (existingErr) throw existingErr;

  const existingIds = new Set(
    ((existingRows ?? []) as Array<{ tagged_user_id: string }>).map((row) => row.tagged_user_id)
  );

  const targetSet = new Set(cleanTargetIds);
  const toDelete = Array.from(existingIds).filter((id) => !targetSet.has(id));
  const toInsert = cleanTargetIds.filter((id) => !existingIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from(TAG_TABLE)
      .delete()
      .eq("spot_id", spotId)
      .in("tagged_user_id", toDelete);
    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((taggedUserId) => ({
      spot_id: spotId,
      tagged_user_id: taggedUserId,
    }));

    const { error } = await supabase.from(TAG_TABLE).insert(rows);
    if (error) throw error;
  }
}
