// src/screens/ProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ImageSourcePropType,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { uploadProfilePicture } from "../lib/supabase/uploadProfilePicture";
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

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);

  const loadProfile = React.useCallback(async (): Promise<void> => {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,username,avatar_url,followers_count,following_count")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    let row: ProfileRow;

    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: user.user_metadata?.name ?? "Your Name",
          username: user.user_metadata?.username ?? null,
          avatar_url: null,
          followers_count: 0,
          following_count: 0,
        })
        .select("id,name,username,avatar_url,followers_count,following_count")
        .single();

      if (createErr) throw createErr;
      row = created as ProfileRow;
    } else {
      row = data as ProfileRow;
    }

    // Always compute counts from follows table (source of truth)
    const counts = await fetchCounts(user.id);

    const merged: ProfileRow = {
      ...row,
      followers_count: counts.followers_count,
      following_count: counts.following_count,
    };
    setProfile(merged);

    // Optional: keep profile counters in sync in DB (don't block UI)
    void supabase
      .from("profiles")
      .update(counts)
      .eq("id", user.id);
  }, []);

  // Initial load
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

  // Refresh whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // NOTE: some setups type this as PromiseLike<void> (no .catch),
      // so use an async IIFE instead.
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

  const pickAndUploadAvatar = async () => {
    try {
      setUploading(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Not authenticated");

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const { publicUrl } = await uploadProfilePicture({
        userId: user.id,
        uri: asset.uri,
        mimeType: asset.mimeType ?? undefined,
      });

      const { data: updated, error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id,name,username,avatar_url,followers_count,following_count")
        .single();

      if (updateErr) throw updateErr;

      const counts = await fetchCounts(user.id);

      setProfile({
        ...(updated as ProfileRow),
        followers_count: counts.followers_count,
        following_count: counts.following_count,
      });

      void supabase.from("profiles").update(counts).eq("id", user.id);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Upload failed", e?.message ?? "Could not update avatar.");
    } finally {
      setUploading(false);
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Pressable onPress={pickAndUploadAvatar} disabled={uploading}>
        <Image source={avatarSource} style={s.avatar} />
        {uploading && (
          <View style={s.avatarOverlay}>
            <ActivityIndicator />
          </View>
        )}
      </Pressable>

      <Text style={s.hint}>Tap your picture to change it</Text>

      {profile.username ? <Text style={s.username}>@{profile.username}</Text> : null}

      <Text style={s.name}>{profile.name ?? "Your Name"}</Text>

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
    backgroundColor: "white"
  },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  avatarOverlay: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    top: 0,
    left: 0,
  },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 18 },
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
  hint: { marginBottom: 30, fontSize: 11, color: "#666" },
  username: { fontSize: 14, color: "#666", marginBottom: 10 },
});
