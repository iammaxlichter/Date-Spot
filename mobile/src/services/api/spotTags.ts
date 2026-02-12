import { supabase } from "../supabase/client";

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

async function getMutualIds(currentUserId: string): Promise<Set<string>> {
  const [{ data: outgoing, error: outgoingErr }, { data: incoming, error: incomingErr }] =
    await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", currentUserId),
      supabase.from("follows").select("follower_id").eq("following_id", currentUserId),
    ]);

  if (outgoingErr) throw outgoingErr;
  if (incomingErr) throw incomingErr;

  const outgoingSet = new Set(
    (outgoing ?? []).map((row: any) => row.following_id).filter(Boolean)
  );

  const mutualIds = new Set<string>();
  for (const row of incoming ?? []) {
    const followerId = (row as any).follower_id as string | undefined;
    if (followerId && outgoingSet.has(followerId)) {
      mutualIds.add(followerId);
    }
  }
  return mutualIds;
}

export async function fetchEligibleTagUsers(
  currentUserId: string,
  opts?: { forceRefresh?: boolean }
): Promise<TaggedUser[]> {
  const forceRefresh = !!opts?.forceRefresh;
  const cached = eligibleCache.get(currentUserId);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.users;
  }

  const mutualIds = Array.from(await getMutualIds(currentUserId));
  if (mutualIds.length === 0) {
    eligibleCache.set(currentUserId, {
      users: [],
      expiresAt: Date.now() + ELIGIBLE_CACHE_TTL_MS,
    });
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,name,avatar_url")
    .in("id", mutualIds)
    .order("username", { ascending: true });

  if (error) throw error;

  const users = (data ?? []) as TaggedUser[];
  eligibleCache.set(currentUserId, {
    users,
    expiresAt: Date.now() + ELIGIBLE_CACHE_TTL_MS,
  });
  return users;
}

export async function fetchSpotTags(spotId: string): Promise<TaggedUser[]> {
  const { data: tagRows, error: tagsErr } = await supabase
    .from("spot_tags")
    .select("spot_id,tagged_user_id")
    .eq("spot_id", spotId);

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

  return taggedIds
    .map((id) => profileById.get(id))
    .filter((v): v is TaggedUser => Boolean(v));
}

export async function fetchSpotTagsForSpotIds(
  spotIds: string[]
): Promise<Record<string, TaggedUser[]>> {
  const uniqueSpotIds = unique(spotIds);
  if (uniqueSpotIds.length === 0) return {};

  const { data: tagRows, error: tagsErr } = await supabase
    .from("spot_tags")
    .select("spot_id,tagged_user_id")
    .in("spot_id", uniqueSpotIds);

  const rows = (tagRows ?? []) as SpotTagRow[];
  const taggedIds = unique(rows.map((row) => row.tagged_user_id));

  if (taggedIds.length === 0) {
    const empty: Record<string, TaggedUser[]> = {};
    for (const spotId of uniqueSpotIds) empty[spotId] = [];
    return empty;
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

  const tagsBySpot: Record<string, TaggedUser[]> = {};
  for (const spotId of uniqueSpotIds) tagsBySpot[spotId] = [];

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
  const mutualSet = await getMutualIds(currentUserId);

  const ineligible = cleanTargetIds.filter((id) => !mutualSet.has(id));
  if (ineligible.length > 0) {
    throw new Error("One or more selected users are not mutual followers.");
  }

  const { data: existingRows, error: existingErr } = await supabase
    .from("spot_tags")
    .select("tagged_user_id")
    .eq("spot_id", spotId)
    .eq("created_by", currentUserId);


  const existingIds = new Set(
    ((existingRows ?? []) as Array<{ tagged_user_id: string }>).map((row) => row.tagged_user_id)
  );

  const targetSet = new Set(cleanTargetIds);
  const toDelete = Array.from(existingIds).filter((id) => !targetSet.has(id));
  const toInsert = cleanTargetIds.filter((id) => !existingIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("spot_tags")
      .delete()
      .eq("spot_id", spotId)
      .eq("created_by", currentUserId)
      .in("tagged_user_id", toDelete);
    if (error) {
      throw error;
    }
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((taggedUserId) => ({
      spot_id: spotId,
      tagged_user_id: taggedUserId,
      created_by: currentUserId,
    }));

    const { error } = await supabase.from("spot_tags").insert(rows);
    if (error) {
      throw error;
    }
  }
}
