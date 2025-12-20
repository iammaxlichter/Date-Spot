// src/lib/api/users.ts
import { supabase } from "../supabase";

export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapProfileRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch users from `profiles`.
 * NOTE: With typical RLS, this will likely return only the logged-in user,
 * unless you've configured policies to allow reading others.
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

  return (data ?? []).map(mapProfileRow);
}

/**
 * Get the currently logged-in user (Auth + their profile row).
 */
export async function getCurrentUser(): Promise<User> {
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!auth.user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,name,created_at,updated_at")
    .eq("id", auth.user.id)
    .single();

  if (error) throw error;
  if (!profile) throw new Error("Profile not found");

  return mapProfileRow(profile);
}
