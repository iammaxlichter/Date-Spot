// src/navigation/hooks/useAuthSession.tsx
import React from "react";
import { supabase } from "../../services/supabase/client";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
};

function deriveDisplayName(user: AuthUser): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (meta.name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.given_name as string | undefined);
  const normalizedMeta = (fromMeta ?? "").trim();
  if (normalizedMeta) return normalizedMeta.slice(0, 40);

  const emailLocal = (user.email ?? "").split("@")[0]?.trim();
  if (emailLocal) return emailLocal.slice(0, 40);
  return "Date Spot User";
}

function deriveAvatarUrl(user: AuthUser): string | null {
  const meta = user.user_metadata ?? {};
  const raw = (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined);
  const normalized = (raw ?? "").trim();
  return normalized || null;
}

function normalizeMetadataUsername(user: AuthUser): string | null {
  const meta = user.user_metadata ?? {};
  const fromMeta = (meta.username as string | undefined)?.trim().toLowerCase();
  if (!fromMeta) return null;
  if (!/^[a-z0-9_]{3,20}$/.test(fromMeta)) return null;
  return fromMeta;
}

async function ensureProfileExists(user: AuthUser): Promise<void> {
  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id,name,username,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) throw readErr;

  const existingName = (existing?.name ?? "").trim();
  const existingUsername = (existing?.username ?? "").trim();
  const existingAvatar = (existing?.avatar_url ?? "").trim();

  const desiredName = existingName || deriveDisplayName(user) || "";
  const desiredUsername = existingUsername || normalizeMetadataUsername(user);
  const desiredAvatarUrl = existingAvatar || deriveAvatarUrl(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      name: desiredName,
      username: desiredUsername,
      avatar_url: desiredAvatarUrl,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export function useAuthSession() {
  const [session, setSession] = React.useState<any>(null);
  const [booting, setBooting] = React.useState(true);
  const bootstrapInFlightRef = React.useRef<Set<string>>(new Set());

  const ensureProfileBootstrap = React.useCallback(async (user: AuthUser | null | undefined) => {
    if (!user?.id) return;
    if (bootstrapInFlightRef.current.has(user.id)) return;

    bootstrapInFlightRef.current.add(user.id);
    try {
      await ensureProfileExists(user);
    } catch (err) {
      console.error("Failed to bootstrap profile from auth user:", err);
    } finally {
      bootstrapInFlightRef.current.delete(user.id);
    }
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await ensureProfileBootstrap(data.session?.user as AuthUser | null | undefined);
      setSession(data.session);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void ensureProfileBootstrap(session?.user as AuthUser | null | undefined);
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [ensureProfileBootstrap]);

  return { session, booting };
}
