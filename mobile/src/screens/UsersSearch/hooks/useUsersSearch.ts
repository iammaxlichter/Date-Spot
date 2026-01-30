// src/screens/Users/hooks/useUsersSearch.tsx
import React from "react";
import { Alert } from "react-native";
import { supabase } from "../../../services/supabase/client"; 

import type { UserRow } from "../types";

export function useUsersSearch({ navigation }: { navigation: any }) {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<UserRow[]>([]);
  const [myId, setMyId] = React.useState<string | null>(null);
  const [followingIds, setFollowingIds] = React.useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const debounceRef = React.useRef<any>(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMyId(data.user?.id ?? null);
    })();
  }, []);

  const fetchFollowingStateForResults = React.useCallback(
    async (rows: UserRow[]) => {
      if (!myId || rows.length === 0) {
        setFollowingIds(new Set());
        return;
      }

      const ids = rows.map((r) => r.id);

      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", myId)
        .in("following_id", ids);

      if (error) {
        console.warn("Failed to load following state", error);
        setFollowingIds(new Set());
        return;
      }

      const s = new Set<string>((data ?? []).map((r: any) => r.following_id));
      setFollowingIds(s);
    },
    [myId]
  );

  const runSearch = React.useCallback(
    async (query: string) => {
      const cleaned = query.trim().toLowerCase();

      if (cleaned.length < 2) {
        setResults([]);
        setFollowingIds(new Set());
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("id,username,avatar_url")
          .ilike("username", `%${cleaned}%`)
          .order("username", { ascending: true })
          .limit(25);

        if (error) throw error;

        const filtered = (data ?? [])
          .filter((r: any) => r.username)
          .filter((r: any) => (myId ? r.id !== myId : true)) as UserRow[];

        setResults(filtered);
        await fetchFollowingStateForResults(filtered);
      } catch (e) {
        console.warn("User search failed", e);
        setResults([]);
        setFollowingIds(new Set());
      } finally {
        setLoading(false);
      }
    },
    [fetchFollowingStateForResults, myId]
  );

  const onChange = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9_]/g, "");
    setQ(sanitized);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(sanitized), 250);
  };

  const openProfile = (profileUserId: string) => {
    if (profileUserId === myId) navigation.navigate("Profile");
    else navigation.navigate("UserProfile", { userId: profileUserId });
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!myId) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    if (togglingId) return;
    setTogglingId(targetUserId);

    const isFollowing = followingIds.has(targetUserId);

    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", myId)
          .eq("following_id", targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: myId,
          following_id: targetUserId,
        });

        if (error) throw error;
      }
    } catch (e: any) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });

      Alert.alert("Failed", e?.message ?? "Could not update follow.");
    } finally {
      setTogglingId(null);
    }
  };

  return {
    q,
    setQ,
    loading,
    results,
    myId,
    followingIds,
    togglingId,
    onChange,
    openProfile,
    toggleFollow,
  };
}
