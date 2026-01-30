// src/screens/FollowersList/hooks/useFollowersList.ts
import React from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../services/supabase/client";

import { Row, FollowJoinRow } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

const PAGE_SIZE = 30;

export function useFollowersList({
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

        // current user
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const me = userRes.user?.id ?? null;

        if (!isMountedRef.current) return;
        setCurrentUserId(me);

        // pagination
        const currentPage = reset ? 0 : pageRef.current;
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // followers for this profile
        let q = supabase
          .from("follows")
          .select(
            `
            created_at,
            follower:profiles!follows_follower_profile_fkey (
              id,
              username,
              avatar_url
            )
          `
          )
          .eq("following_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);

        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          q = q.ilike("follower.username", `%${trimmedSearch}%`);
        }

        const { data, error: queryError } = await q.returns<FollowJoinRow[]>();
        if (queryError) throw queryError;

        if (!isMountedRef.current) return;

        const baseRows: Row[] = (data ?? [])
          .map((r) => r.follower)
          .filter(Boolean) as Row[];

        // If I'm logged in, determine whether I follow each of these followers
        let followingSet = new Set<string>();
        if (me && baseRows.length > 0) {
          const ids = baseRows.map((r) => r.id);

          const { data: mine, error: mineErr } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", me)
            .in("following_id", ids);

          if (mineErr) throw mineErr;

          followingSet = new Set((mine ?? []).map((x: any) => x.following_id));
        }

        const newRows: Row[] = baseRows.map((u) => ({
          ...u,
          isFollowing: me ? followingSet.has(u.id) : false,
          updating: false,
          removing: false,
        }));

        setRows((prev) => (reset ? newRows : [...prev, ...newRows]));

        hasMoreRef.current = newRows.length === PAGE_SIZE;
        pageRef.current = currentPage + 1;
      } catch (e) {
        console.error("Failed to load followers:", e);
        if (isMountedRef.current) {
          setError("Failed to load followers. Pull to refresh.");
          if (opts?.reset) setRows([]);
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
      if (!currentUserId) {
        Alert.alert("Not signed in", "Please sign in to follow people.");
        return;
      }

      const row = rows.find((r) => r.id === targetUserId);
      if (row?.updating) return;

      if (targetUserId === currentUserId) return;

      // optimistic
      setRows((prev) =>
        prev.map((r) =>
          r.id === targetUserId
            ? { ...r, isFollowing: !r.isFollowing, updating: true }
            : r
        )
      );

      const nextIsFollowing = !(row?.isFollowing ?? false);

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

        // rollback
        setRows((prev) =>
          prev.map((r) =>
            r.id === targetUserId
              ? { ...r, isFollowing: row?.isFollowing ?? false, updating: false }
              : r
          )
        );

        Alert.alert("Error", "Could not update follow status.");
        return;
      }

      // stop spinner
      setRows((prev) =>
        prev.map((r) => (r.id === targetUserId ? { ...r, updating: false } : r))
      );
    },
    [currentUserId, rows]
  );

  // Remove follower (X)
  const removeFollower = React.useCallback(
    async (followerId: string) => {
      if (!currentUserId) {
        Alert.alert("Not signed in", "Please sign in.");
        return;
      }

      // Only allow removing followers from your own profile
      if (userId !== currentUserId) {
        Alert.alert("Not allowed", "You can only remove followers from your own profile.");
        return;
      }

      const row = rows.find((r) => r.id === followerId);
      if (row?.removing) return;

      Alert.alert(
        "Remove follower?",
        `@${row?.username || "This user"} will no longer follow you.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              // Save snapshot for potential rollback
              const snapshot = [...rows];

              // Optimistic: remove from UI immediately
              setRows((prev) => prev.filter((r) => r.id !== followerId));

              try {
                console.log("Attempting to delete:", {
                  follower_id: followerId,
                  following_id: userId,
                  currentUserId: currentUserId,
                });

                // First, verify the relationship exists
                const { data: existing, error: checkError } = await supabase
                  .from("follows")
                  .select("*")
                  .eq("follower_id", followerId)
                  .eq("following_id", userId);

                if (checkError) {
                  console.error("Check error:", checkError);
                  throw checkError;
                }

                console.log("Existing relationship:", existing);

                if (!existing || existing.length === 0) {
                  throw new Error("Follow relationship does not exist in database");
                }

                // Now try to delete
                const { error, count } = await supabase
                  .from("follows")
                  .delete({ count: "exact" })
                  .eq("follower_id", followerId)
                  .eq("following_id", userId);

                if (error) {
                  console.error("Delete error:", error);
                  throw error;
                }

                console.log("Deleted rows:", count);

                // If no rows were deleted, it's an RLS policy issue
                if (count === 0) {
                  throw new Error("Delete blocked by RLS policy - check your Supabase policies");
                }
              } catch (e) {
                console.error("Remove follower failed:", e);

                // Rollback: restore the original list
                setRows(snapshot);

                const errorMsg = e instanceof Error ? e.message : "Could not remove follower";
                Alert.alert("Error", errorMsg);
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [currentUserId, rows, userId]
  );

  const handleLoadMore = React.useCallback(() => {
    if (!loading && !refreshing && hasMoreRef.current) load();
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
    removeFollower,
    currentUserId,
  };
}
