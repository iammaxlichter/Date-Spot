// src/lib/partnerships.ts
import { supabase } from "./supabase";

export type PartnershipStatus = "pending" | "accepted" | "declined" | "cancelled";

export type PartnershipRow = {
  id: string;
  user_a: string;
  user_b: string;
  status: PartnershipStatus;
  requested_by: string;
  created_at: string;
  responded_at: string | null;
};

export function otherUserId(p: PartnershipRow, me: string) {
  return p.user_a === me ? p.user_b : p.user_a;
}

export async function isMutualFollow(me: string, them: string): Promise<boolean> {
  const [{ data: a, error: e1 }, { data: b, error: e2 }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", me)
      .eq("following_id", them)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", them)
      .eq("following_id", me)
      .maybeSingle(),
  ]);

  // If RLS blocks or any error happens, treat as "not mutual"
  if (e1 || e2) return false;

  return !!a && !!b;
}

export async function getAcceptedPartnershipForUser(userId: string) {
  const { data, error } = await supabase
    .from("partnerships")
    .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
    .eq("status", "accepted")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .maybeSingle();

  if (error) throw error;
  return (data as PartnershipRow | null) ?? null;
}

export async function getActiveBetween(me: string, them: string) {
  const { data, error } = await supabase
    .from("partnerships")
    .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
    .in("status", ["pending", "accepted"])
    .or(`and(user_a.eq.${me},user_b.eq.${them}),and(user_a.eq.${them},user_b.eq.${me})`)
    .maybeSingle();

  if (error) throw error;
  return (data as PartnershipRow | null) ?? null;
}

export async function requestPartner(me: string, them: string) {
  try {
    // Double-check no existing active partnership
    const existing = await getActiveBetween(me, them);
    if (existing) {
      throw new Error("An active partnership already exists between you two.");
    }

    // Check if either user already has an accepted partnership
    const [myPartnership, theirPartnership] = await Promise.all([
      getAcceptedPartnershipForUser(me),
      getAcceptedPartnershipForUser(them),
    ]);

    if (myPartnership) {
      throw new Error("You already have a DateSpot partner.");
    }

    if (theirPartnership) {
      throw new Error("This user already has a DateSpot partner.");
    }

    // Verify mutual follow
    const mutual = await isMutualFollow(me, them);
    if (!mutual) {
      throw new Error("You must both follow each other to become partners.");
    }

    const { data, error } = await supabase
      .from("partnerships")
      .insert({ user_a: me, user_b: them, status: "pending", requested_by: me })
      .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
      .single();

    if (error) throw error;
    return data as PartnershipRow;
  } catch (e: any) {
    const msg =
      e?.message?.trim() ||
      e?.error_description?.trim() ||
      e?.details?.trim() ||
      "Could not send partner request.";
    throw new Error(msg);
  }
}

export async function cancelRequest(partnershipId: string) {
  const { data, error } = await supabase
    .from("partnerships")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", partnershipId)
    .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
    .single();

  if (error) throw error;
  return data as PartnershipRow;
}

export async function acceptRequest(partnershipId: string) {
  try {
    // First, get the partnership details
    const { data: partnership, error: fetchError } = await supabase
      .from("partnerships")
      .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
      .eq("id", partnershipId)
      .single();

    if (fetchError) throw fetchError;
    if (!partnership) throw new Error("Partnership not found.");
    if (partnership.status !== "pending") {
      throw new Error("This partnership request is no longer pending.");
    }

    // Check if either user now has an accepted partnership (race condition protection)
    const [userAPartnership, userBPartnership] = await Promise.all([
      getAcceptedPartnershipForUser(partnership.user_a),
      getAcceptedPartnershipForUser(partnership.user_b),
    ]);

    if (userAPartnership && userAPartnership.id !== partnershipId) {
      throw new Error("One of you already has a DateSpot partner.");
    }

    if (userBPartnership && userBPartnership.id !== partnershipId) {
      throw new Error("One of you already has a DateSpot partner.");
    }

    // Accept the partnership (trigger will auto-decline others)
    const { data, error } = await supabase
      .from("partnerships")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", partnershipId)
      .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
      .single();

    if (error) throw error;
    return data as PartnershipRow;
  } catch (e: any) {
    const msg =
      e?.message?.trim() ||
      e?.error_description?.trim() ||
      e?.details?.trim() ||
      "Could not accept partnership request.";
    throw new Error(msg);
  }
}

export async function declineRequest(partnershipId: string) {
  const { error } = await supabase
    .from("partnerships")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", partnershipId);

  if (error) throw error;
}