import { supabase } from "../supabase/client";

export async function register(email: string, name: string, password: string) {
  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // stored as user_metadata
    },
  });

  if (error) throw error;

  // If your DB trigger creates the profile row, you're done.
  // But we can also upsert name into profiles to be safe.
  if (data.user) {
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        name,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      throw profileErr;
    }
  }

  return data; // contains session/user (session may be null if email confirmation is enabled)
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data; // { user, session }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
