// src/screens/UserProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ImageSourcePropType,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
};

async function fetchCounts(userId: string) {
  const [{ count: followersCount, error: followersErr }, { count: followingCount, error: followingErr }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

  if (followersErr) throw followersErr;
  if (followingErr) throw followingErr;

  return {
    followers_count: followersCount ?? 0,
    following_count: followingCount ?? 0,
  };
}

export default function UserProfileScreen({ route }: any) {
  const userId: string = route.params.userId;
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [followUpdating, setFollowUpdating] = React.useState(false);

  const latest = React.useRef<{ isFollowing: boolean; profile: ProfileRow | null }>({
    isFollowing: false,
    profile: null,
  });

  React.useEffect(() => {
    latest.current.isFollowing = isFollowing;
  }, [isFollowing]);

  React.useEffect(() => {
    latest.current.profile = profile;
  }, [profile]);

  const loadProfile = React.useCallback(async (): Promise<void> => {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const currentUser = userRes.user;
    if (!currentUser) throw new Error("Not authenticated");

    setCurrentUserId(currentUser.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,username,avatar_url,followers_count,following_count")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const counts = await fetchCounts(userId);

    setProfile({
      ...(data as ProfileRow),
      followers_count: counts.followers_count,
      following_count: counts.following_count,
    });

    const { data: followData, error: followErr } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId)
      .maybeSingle();

    if (followErr) throw followErr;
    setIsFollowing(!!followData);

    void supabase.from("profiles").update(counts).eq("id", userId);
  }, [userId]);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadProfile();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfile]);

  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          await loadProfile();
        } catch (e) {
          console.error("Focus refresh failed:", e);
        }
      })();
    }, [loadProfile])
  );

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const toggleFollow = async () => {
    if (!currentUserId || !latest.current.profile) return;
    if (followUpdating) return;

    setFollowUpdating(true);

    const prevIsFollowing = latest.current.isFollowing;
    const nextIsFollowing = !prevIsFollowing;
    const prevProfile = latest.current.profile;

    // Optimistic UI (followers_count only on viewed profile)
    setIsFollowing(nextIsFollowing);
    setProfile({
      ...prevProfile,
      followers_count: Math.max(
        0,
        (prevProfile.followers_count ?? 0) + (nextIsFollowing ? 1 : -1)
      ),
    });

    try {
      if (nextIsFollowing) {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: userId,
        });

        // If already followed (unique constraint), treat as success
        if (error && (error as any).code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;
      }

      // Re-fetch truth to prevent drift/double-decrement bugs
      const counts = await fetchCounts(userId);

      setProfile((p) =>
        p
          ? {
              ...p,
              followers_count: counts.followers_count,
              following_count: counts.following_count,
            }
          : p
      );

      void supabase.from("profiles").update(counts).eq("id", userId);
    } catch (e: any) {
      console.error(e);

      // rollback
      setIsFollowing(prevIsFollowing);
      setProfile(prevProfile);

      Alert.alert("Error", e?.message ?? "Failed to update follow status.");
    } finally {
      setFollowUpdating(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={[s.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const avatarSource: ImageSourcePropType = profile.avatar_url
    ? { uri: profile.avatar_url }
    : require("../../assets/default-avatar.png");

  return (
    <ScrollView
      contentContainerStyle={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Image source={avatarSource} style={s.avatar} />

      {profile.username ? <Text style={s.username}>@{profile.username}</Text> : null}

      <Text style={s.name}>{profile.name ?? "Unknown User"}</Text>

      <Pressable
        style={[
          s.followButton,
          isFollowing && s.followingButton,
          followUpdating && { opacity: 0.6 },
        ]}
        onPress={toggleFollow}
        disabled={followUpdating}
      >
        <Text style={[s.followButtonText, isFollowing && s.followingButtonText]}>
          {followUpdating ? "Updating..." : isFollowing ? "Following" : "Follow"}
        </Text>
      </Pressable>

      <View style={s.statsRow}>
        <Pressable
          style={s.statBox}
          onPress={() => navigation.navigate("Followers", { userId: profile.id })}
        >
          <Text style={s.statNumber}>{profile.followers_count ?? 0}</Text>
          <Text style={s.statLabel}>Followers</Text>
        </Pressable>

        <Pressable
          style={s.statBox}
          onPress={() => navigation.navigate("Following", { userId: profile.id })}
        >
          <Text style={s.statNumber}>{profile.following_count ?? 0}</Text>
          <Text style={s.statLabel}>Following</Text>
        </Pressable>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 120,
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  username: { fontSize: 14, color: "#666", marginBottom: 10 },
  followButton: {
    backgroundColor: "#111",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 24,
  },
  followingButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  followButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  followingButtonText: {
    color: "#111",
  },
  statsRow: { flexDirection: "row", gap: 22 },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 120,
  },
  statNumber: { fontSize: 20, fontWeight: "700" },
  statLabel: { marginTop: 4, fontSize: 13, color: "#666" },
});
