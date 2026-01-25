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
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

type Row = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type FollowJoinRow = {
  created_at: string;
  follower: Row | null;
};

const PAGE_SIZE = 30;

export default function FollowersListScreen({ route }: any) {
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

        // Add search filter if present
        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          q = q.ilike("follower.username", `%${trimmedSearch}%`);
        }

        const { data, error: queryError } = await q.returns<FollowJoinRow[]>();
        if (queryError) throw queryError;

        if (!isMountedRef.current) return;

        // Process results
        const newRows: Row[] = (data ?? [])
          .map((r) => r.follower)
          .filter(Boolean) as Row[];

        setRows((prev) => (reset ? newRows : [...prev, ...newRows]));

        // Update pagination refs
        hasMoreRef.current = newRows.length === PAGE_SIZE;
        pageRef.current = currentPage + 1;

      } catch (e) {
        console.error("Failed to load followers:", e);
        if (isMountedRef.current) {
          setError("Failed to load followers. Pull to refresh.");
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
          placeholder="Search followers..."
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
            {/* HARD-ENFORCE the horizontal row here */}
            <View style={styles.userRow}>
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  avatarContainer: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  usernameContainer: {
    flex: 1,
    justifyContent: "center",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
    width: "100%",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  username: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },

});