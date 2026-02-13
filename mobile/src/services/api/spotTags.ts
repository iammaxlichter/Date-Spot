import { supabase } from "../supabase/client";
import { getActivePartner } from "./partnerships";

export type TaggedUser = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
};

type SpotTagRow = {
  spot_id: string;
  tagged_user_id: string;
};

type SpotTagTable = "date_spot_tags" | "spot_tags";

const ELIGIBLE_CACHE_TTL_MS = 5 * 60 * 1000;
const eligibleCache = new Map<string, { users: TaggedUser[]; expiresAt: number }>();
let resolvedTagTable: SpotTagTable | null = null;

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

async function resolveTagTable(): Promise<SpotTagTable> {
  if (resolvedTagTable) return resolvedTagTable;

  const preferred = await supabase.from("date_spot_tags").select("spot_id").limit(1);
  if (!preferred.error) {
    resolvedTagTable = "date_spot_tags";
    return resolvedTagTable;
  }

  resolvedTagTable = "spot_tags";
  return resolvedTagTable;
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

export async function fetchSpotTags(spotId: string): Promise<TaggedUser[]> {
  const table = await resolveTagTable();
  const { data: tagRows, error } = await supabase
    .from(table)
    .select("spot_id,tagged_user_id")
    .eq("spot_id", spotId);
  if (error) throw error;

  const rows = (tagRows ?? []) as SpotTagRow[];
  const taggedIds = unique(rows.map((row) => row.tagged_user_id));
  if (taggedIds.length === 0) return [];

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id,username,name,avatar_url")
    .in("id", taggedIds);
  if (profilesErr) throw profilesErr;

  const profileById = new Map<string, TaggedUser>();
  for (const p of (profiles ?? []) as TaggedUser[]) {
    profileById.set(p.id, p);
  }

  return taggedIds.map((id) => profileById.get(id)).filter((v): v is TaggedUser => Boolean(v));
}

export async function fetchSpotTagsForSpotIds(spotIds: string[]): Promise<Record<string, TaggedUser[]>> {
  const uniqueSpotIds = unique(spotIds);
  if (uniqueSpotIds.length === 0) return {};

  const table = await resolveTagTable();
  const { data: tagRows, error } = await supabase
    .from(table)
    .select("spot_id,tagged_user_id")
    .in("spot_id", uniqueSpotIds);
  if (error) throw error;

  const rows = (tagRows ?? []) as SpotTagRow[];
  const taggedIds = unique(rows.map((row) => row.tagged_user_id));
  const tagsBySpot: Record<string, TaggedUser[]> = {};
  for (const spotId of uniqueSpotIds) tagsBySpot[spotId] = [];

  if (taggedIds.length === 0) {
    return tagsBySpot;
  }

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id,username,name,avatar_url")
    .in("id", taggedIds);
  if (profilesErr) throw profilesErr;

  const profileById = new Map<string, TaggedUser>();
  for (const p of (profiles ?? []) as TaggedUser[]) {
    profileById.set(p.id, p);
  }

  for (const row of rows) {
    const profile = profileById.get(row.tagged_user_id);
    if (!profile) continue;
    tagsBySpot[row.spot_id].push(profile);
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

  const table = await resolveTagTable();
  const { data: existingRows, error: existingErr } = await supabase
    .from(table)
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
      .from(table)
      .delete()
      .eq("spot_id", spotId)
      .in("tagged_user_id", toDelete);
    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((taggedUserId) => ({
      spot_id: spotId,
      tagged_user_id: taggedUserId,
      ...(table === "spot_tags" ? { created_by: currentUserId } : {}),
    }));

    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
}
