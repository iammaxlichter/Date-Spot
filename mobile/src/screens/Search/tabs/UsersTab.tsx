import React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { useNavigation } from "@react-navigation/native";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function UsersTab() {
  const navigation = useNavigation<any>();

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

  const renderItem = ({ item }: { item: UserRow }) => {
    const isFollowing = followingIds.has(item.id);
    const isBusy = togglingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openProfile(item.id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Image
          source={
            item.avatar_url
              ? { uri: item.avatar_url }
              : require("../../../../assets/default-avatar.png")
          }
          style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12 }}
        />

        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <Text style={{ fontWeight: "700" }}>@{item.username}</Text>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation(); // ✅ prevents row press when tapping button
            toggleFollow(item.id);
          }}
          disabled={isBusy}
          style={{
            backgroundColor: isFollowing ? "#fff" : "#111",
            borderWidth: 1,
            borderColor: "#111",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            opacity: isBusy ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: isFollowing ? "#111" : "white",
              fontWeight: "800",
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16 }}>
        <TextInput
          value={q}
          onChangeText={onChange}
          autoCapitalize="none"
          placeholder="Search by username..."
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 12,
            borderRadius: 10,
          }}
        />

        {loading ? (
          <View style={{ marginTop: 10 }}>
            <ActivityIndicator />
          </View>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          q.trim().length >= 2 && !loading ? (
            <Text style={{ marginLeft: 16, color: "#666" }}>No users found.</Text>
          ) : (
            <Text style={{ marginLeft: 16, color: "#666" }}>
              Type at least 2 characters.
            </Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}
