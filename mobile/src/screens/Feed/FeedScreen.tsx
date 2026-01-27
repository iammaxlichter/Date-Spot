// src/screens/FeedScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

type ProfileMini = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type FeedRow = {
  id: string;
  created_at: string;
  user_id: string;

  name: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean;

  profiles: ProfileMini; // Changed from ProfileMini[] to ProfileMini
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function FeedScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [rows, setRows] = React.useState<FeedRow[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const loadFeed = React.useCallback(async () => {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not authenticated");

    setCurrentUserId(user.id);

    const { data: follows, error: followsErr } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followsErr) throw followsErr;

    const followingIds = (follows ?? [])
      .map((f: any) => f.following_id)
      .filter(Boolean);

    const feedUserIds = Array.from(new Set([user.id, ...followingIds]));

    const { data, error } = await supabase
      .from("spots")
      .select(`
      id, created_at, user_id,
      name, atmosphere, date_score, notes, vibe, price, best_for, would_return,
      profiles!inner ( id, username, avatar_url )
    `)
      .in("user_id", feedUserIds)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;

    setRows(((data ?? []) as unknown) as FeedRow[]);
  }, []);

  // initial load
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadFeed();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to load feed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFeed]);

  // refresh whenever you return to the feed screen
  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          await loadFeed();
        } catch (e) {
          console.error("Feed focus refresh failed:", e);
        }
      })();
    }, [loadFeed])
  );

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadFeed();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to refresh feed.");
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  const renderItem = ({ item }: { item: FeedRow }) => {
    const profile = item.profiles;

    const avatarSource = profile?.avatar_url
      ? { uri: profile.avatar_url }
      : require("../../../assets/default-avatar.png");

    const username = profile?.username ? `@${profile.username}` : "@unknown";

    const handleProfilePress = () => {
      if (currentUserId && item.user_id === currentUserId) {
        navigation.navigate("Profile");
      } else {
        navigation.navigate("UserProfile", { userId: item.user_id });
      }
    };

    const handleSpotPress = () => {
      navigation.navigate("SpotDetails", { spotId: item.id });
    };

    return (
      <Pressable onPress={handleSpotPress} style={s.card}>
        <View style={s.headerRow}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleProfilePress();
            }}
            hitSlop={8}
          >
            <Image source={avatarSource} style={s.avatar} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleProfilePress();
              }}
              hitSlop={8}
            >
              <Text style={s.username}>{username}</Text>
            </Pressable>

            <Text style={s.time}>{timeAgo(item.created_at)} ago</Text>
          </View>
        </View>

        <Text style={s.spotName}>{item.name}</Text>

        <View style={s.metricsRow}>
          <Text style={s.metric}>Atmosphere: {item.atmosphere ?? "—"}</Text>
          <Text style={s.metric}>Date score: {item.date_score ?? "—"}</Text>
        </View>

        <View style={s.metaRow}>
          {item.vibe ? <Text style={s.pill}>{item.vibe}</Text> : null}
          {item.price ? <Text style={s.pill}>{item.price}</Text> : null}
          {item.best_for ? <Text style={s.pill}>{item.best_for}</Text> : null}
          <Text style={[s.pill, item.would_return ? s.pillYes : s.pillNo]}>
            {item.would_return ? "Would return" : "Would not return"}
          </Text>
        </View>
      </Pressable>
    );
  };


  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, textAlign: "center" }}>Loading feed…</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <FlatList
        data={rows}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No spots yet</Text>
            <Text style={s.emptyText}>Create your first DateSpot and it’ll show up here.</Text>
          </View>
        }
        ListFooterComponent={
          rows.length > 0 ? (
            <View style={s.footer}>
              <Text style={s.footerText}>You've reached the bottom of your feed!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },

  username: { fontSize: 14, fontWeight: "800", color: "#111" },
  time: { fontSize: 12, color: "#777", marginTop: 2 },

  spotName: { fontSize: 18, fontWeight: "800", marginTop: 4, color: "#111" },

  metricsRow: { flexDirection: "row", gap: 14, marginTop: 10 },
  metric: { fontSize: 13, color: "#333" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  pill: {
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  pillYes: { backgroundColor: "#f2fff7", borderColor: "#d6ffe6" },
  pillNo: { backgroundColor: "#fff6f6", borderColor: "#ffe0e0" },

  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#666", textAlign: "center" },
  footer: { alignItems: "center", paddingVertical: 100 },
  footerText: { fontSize: 14, color: "#999", fontStyle: "italic" },
});
