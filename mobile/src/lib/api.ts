// src/lib/api.ts
import { supabase } from "./supabase";

export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapProfile(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch profiles.
 * NOTE: With typical RLS, this may only return your own profile unless you allow more.
 */
export async function fetchUsers(): Promise<User[]> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!auth.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,name,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

/**
 * In Supabase you don't "create user" by POSTing.
 * Users are created via auth.signUp().
 * This function updates (upserts) the current user's profile.
 */
export async function createUser(input: { email: string; name?: string }) {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!auth.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: auth.user.id,
        name: input.name ?? null,
        // do NOT force email unless your schema expects it and RLS allows it
      },
      { onConflict: "id" }
    )
    .select("id,email,name,created_at,updated_at")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update profile");

  return mapProfile(data);
}
