import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

export function useProfileAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAvatar = useCallback(async () => {
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setAvatarUrl(data?.avatar_url ?? null);
    } catch (e) {
      console.error("Failed to load avatar", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  return { avatarUrl, loading, reloadAvatar: loadAvatar };
}
