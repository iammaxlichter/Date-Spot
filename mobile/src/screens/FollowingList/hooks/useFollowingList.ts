// src/screens/FollowingList/hooks/useFollowingList.ts
import React from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../services/supabase/client";

import { Row, FollowJoinRow } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

const PAGE_SIZE = 30;

export function useFollowingList({
  userId,
  navigation,
}: {
  userId: string;
  navigation: any;
}) {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pageRef = React.useRef(0);
  const hasMoreRef = React.useRef(true);
  const isMountedRef = React.useRef(true);

  const load = React.useCallback(
    async (opts?: { reset?: boolean }) => {
      const reset = opts?.reset ?? false;

      if (!reset && !hasMoreRef.current) return;

      try {
        if (reset) {
          setRefreshing(true);
          pageRef.current = 0;
          hasMoreRef.current = true;
        } else {
          setLoading(true);
        }

        setError(null);

        // Get current user
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        if (!isMountedRef.current) return;
        setCurrentUserId(userRes.user?.id ?? null);

        // Calculate pagination
        const currentPage = reset ? 0 : pageRef.current;
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Build query
        let q = supabase
          .from("follows")
          .select(
            `
            created_at,
            following:profiles!follows_following_profile_fkey (
              id,
              username,
              avatar_url
            )
          `
          )
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);

        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          q = q.ilike("following.username", `%${trimmedSearch}%`);
        }

        const { data, error: queryError } = await q.returns<FollowJoinRow[]>();
        if (queryError) throw queryError;

        if (!isMountedRef.current) return;

        const newRows: Row[] = (data ?? [])
          .map((r) => r.following)
          .filter(Boolean)
          .map((u) => ({ ...u, isFollowing: true, updating: false })) as Row[];

        setRows((prev) => (reset ? newRows : [...prev, ...newRows]));

        hasMoreRef.current = newRows.length === PAGE_SIZE;
        pageRef.current = currentPage + 1;
      } catch (e) {
        console.error("Failed to load following:", e);
        if (isMountedRef.current) {
          setError("Failed to load following. Pull to refresh.");
          if (reset) setRows([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId, debouncedSearch]
  );

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    load({ reset: true });
  }, [userId, load]);

  React.useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    load({ reset: true });
  }, [debouncedSearch, load]);

  useFocusEffect(
    React.useCallback(() => {
      pageRef.current = 0;
      hasMoreRef.current = true;
      load({ reset: true });
    }, [load])
  );

  const onRefresh = React.useCallback(async () => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    await load({ reset: true });
  }, [load]);

  const handleProfilePress = React.useCallback(
    (profileUserId: string) => {
      if (profileUserId === currentUserId) {
        navigation.navigate("Profile");
      } else {
        navigation.navigate("UserProfile", { userId: profileUserId });
      }
    },
    [currentUserId, navigation]
  );

  const toggleFollowFromList = React.useCallback(
    async (targetUserId: string) => {
      if (!currentUserId) return;

      const row = rows.find((r) => r.id === targetUserId);
      if (row?.updating) return;

      setRows((prev) =>
        prev.map((r) =>
          r.id === targetUserId
            ? { ...r, isFollowing: !r.isFollowing, updating: true }
            : r
        )
      );

      const nextIsFollowing = !(row?.isFollowing ?? true);

      try {
        if (nextIsFollowing) {
          const { error } = await supabase.from("follows").insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

          if (error && (error as any).code !== "23505") throw error;
        } else {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", currentUserId)
            .eq("following_id", targetUserId);

          if (error) throw error;
        }
      } catch (e) {
        console.error("Toggle follow failed:", e);

        setRows((prev) =>
          prev.map((r) =>
            r.id === targetUserId
              ? { ...r, isFollowing: row?.isFollowing ?? true, updating: false }
              : r
          )
        );

        Alert.alert("Error", "Could not update follow status.");
        return;
      }

      setRows((prev) =>
        prev.map((r) => (r.id === targetUserId ? { ...r, updating: false } : r))
      );
    },
    [currentUserId, rows]
  );

  const handleLoadMore = React.useCallback(() => {
    if (!loading && !refreshing && hasMoreRef.current) {
      load();
    }
  }, [loading, refreshing, load]);

  return {
    loading,
    refreshing,
    rows,
    error,
    searchQuery,
    setSearchQuery,
    onRefresh,
    handleLoadMore,
    handleProfilePress,
    toggleFollowFromList,
  };
}
