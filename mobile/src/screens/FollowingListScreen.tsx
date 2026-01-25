// src/screens/FollowingListScreen.tsx
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
  isFollowing?: boolean;
  updating?: boolean;
};

type FollowJoinRow = {
  created_at: string;
  following: Row | null;
};

const PAGE_SIZE = 30;

export default function FollowingListScreen({ route }: any) {
  const userId: string = route.params.userId;
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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  
  // Load function without page/hasMore in dependencies
  const load = React.useCallback(
    async (opts?: { reset?: boolean }) => {
      const reset = opts?.reset ?? false;

      // Don't load if we've reached the end and it's not a reset
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

        // Add search filter if present
        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          q = q.ilike("following.username", `%${trimmedSearch}%`);
        }

        const { data, error: queryError } = await q.returns<FollowJoinRow[]>();
        if (queryError) throw queryError;

        if (!isMountedRef.current) return;

        // Process results
        const newRows: Row[] = (data ?? [])
          .map((r) => r.following)
          .filter(Boolean)
          .map((u) => ({ ...u, isFollowing: true, updating: false })) as Row[];


        setRows((prev) => (reset ? newRows : [...prev, ...newRows]));

        // Update pagination refs
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

  // Initial load on mount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load when userId changes
  React.useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    load({ reset: true });
  }, [userId, load]);

  // Reload when search changes
  React.useEffect(() => {
    pageRef.current = 0;
    hasMoreRef.current = true;
    load({ reset: true });
  }, [debouncedSearch, load]);

  // Refresh when screen comes into focus
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

      // Prevent double-taps on same row
      const row = rows.find((r) => r.id === targetUserId);
      if (row?.updating) return;

      // Optimistic UI update
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

          // If already exists, treat as success
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

        // Rollback optimistic change
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

      // End updating state
      setRows((prev) =>
        prev.map((r) =>
          r.id === targetUserId ? { ...r, updating: false } : r
        )
      );
    },
    [currentUserId, rows]
  );

  const handleLoadMore = React.useCallback(() => {
    if (!loading && !refreshing && hasMoreRef.current) {
      load();
    }
  }, [loading, refreshing, load]);

  // Initial loading state
  if (loading && rows.length === 0 && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search following..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* List */}
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
            {searchQuery.trim() ? "No users found." : "Not following anyone yet."}
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

              <Pressable
                onPress={() => toggleFollowFromList(item.id)}
                disabled={item.updating}
                style={[
                  styles.followBtn,
                  item.isFollowing ? styles.followingBtn : styles.followBtnPrimary,
                  item.updating && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    styles.followBtnText,
                    item.isFollowing ? styles.followingBtnText : styles.followBtnTextPrimary,
                  ]}
                >
                  {item.updating ? "..." : item.isFollowing ? "Following" : "Follow"}
                </Text>
              </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 72,
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
    marginLeft: 12,
  },

  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
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


});