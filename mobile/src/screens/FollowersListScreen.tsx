// src/screens/FollowersListScreen.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  Pressable,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

type Row = {
  id: string;
  username: string | null;
  avatar_url: string | null;

  // for button UI
  isFollowing?: boolean;
  updating?: boolean;

  // for remove-follower (X)
  removing?: boolean;
};

type FollowJoinRow = {
  created_at: string;
  follower: Row | null;
};

const PAGE_SIZE = 30;

export default function FollowersListScreen({ route }: any) {
  const userId: string = route.params.userId; // profile you're viewing
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pageRef = React.useRef(0);
  const hasMoreRef = React.useRef(true);
  const isMountedRef = React.useRef(true);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
        prev.map((r) =>
          r.id === targetUserId ? { ...r, updating: false } : r
        )
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
        `@${row?.username || 'This user'} will no longer follow you.`,
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

  if (loading && rows.length === 0 && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search followers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? "No followers found." : "No followers yet."}
          </Text>
        }
        ListFooterComponent={
          loading && rows.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleProfilePress(item.id)}
            style={({ pressed }) => [
              styles.userItem,
              pressed && styles.userItemPressed,
            ]}
          >
            <View style={styles.userRow}>
              <View style={styles.leftBlock}>
                <Image
                  source={
                    item.avatar_url
                      ? { uri: item.avatar_url }
                      : require("../../assets/default-avatar.png")
                  }
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <Text style={styles.username}>@{item.username ?? "unknown"}</Text>
              </View>

              {/* Right side actions */}
              {item.id === currentUserId ? null : (
                <View style={styles.rightActions}>
                  <Pressable
                    onPress={() => toggleFollowFromList(item.id)}
                    disabled={item.updating || item.removing}
                    style={[
                      styles.followBtn,
                      item.isFollowing
                        ? styles.followingBtn
                        : styles.followBtnPrimary,
                      (item.updating || item.removing) && { opacity: 0.6 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.followBtnText,
                        item.isFollowing
                          ? styles.followingBtnText
                          : styles.followBtnTextPrimary,
                      ]}
                    >
                      {item.updating
                        ? "..."
                        : item.isFollowing
                          ? "Following"
                          : "Follow"}
                    </Text>
                  </Pressable>

                  {/* Only show remove button if viewing your own profile */}
                  {userId === currentUserId && (
                    <Pressable
                      onPress={() => removeFollower(item.id)}
                      disabled={item.removing}
                      style={[
                        styles.removeBtn,
                        item.removing && { opacity: 0.6 },
                      ]}
                      hitSlop={10}
                    >
                      <Text style={styles.removeBtnText}>
                        {item.removing ? "…" : "✕"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#fee",
  },
  errorText: {
    color: "#c33",
    textAlign: "center",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyText: {
    padding: 16,
    color: "#666",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  userItemPressed: {
    backgroundColor: "#f5f5f5",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16
  },

  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  username: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  followBtnPrimary: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  followingBtn: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },

  followBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },

  followBtnTextPrimary: {
    color: "#fff",
  },

  followingBtnText: {
    color: "#111",
  },

  removeBtn: {
    width: 14,
    height: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  removeBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    lineHeight: 18,
  },
});