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
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

type Row = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

export default function FollowingListScreen({ route }: any) {
  const userId: string = route.params.userId;
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      setCurrentUserId(userRes.user?.id ?? null);

      const { data: follows, error: followsErr } = await supabase
        .from("follows")
        .select("following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false });

      if (followsErr) throw followsErr;

      const ids = (follows ?? []).map((r: any) => r.following_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id,username,avatar_url")
        .in("id", ids);

      if (profErr) throw profErr;

      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const ordered = ids.map((id: string) => byId.get(id)).filter(Boolean) as Row[];

      setRows(ordered);
    } catch (e) {
      console.warn("Failed to load following", e);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshing]);

  React.useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  const filteredRows = React.useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter((row) => row.username?.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  const handleProfilePress = (profileUserId: string) => {
    if (profileUserId === currentUserId) navigation.navigate("Profile");
    else navigation.navigate("UserProfile", { userId: profileUserId });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 12,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <TextInput
          style={{
            height: 40,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 12,
            fontSize: 15,
          }}
          placeholder="Search following..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={{ padding: 16, color: "#666", textAlign: "center" }}>
            {searchQuery.trim() ? "No users found." : "Not following anyone yet."}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleProfilePress(item.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Image
              source={
                item.avatar_url
                  ? { uri: item.avatar_url }
                  : require("../../assets/default-avatar.png")
              }
              style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800" }}>@{item.username ?? "unknown"}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
