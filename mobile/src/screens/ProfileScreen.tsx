import React from "react";
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { uploadProfilePicture } from "../lib/supabase/uploadProfilePicture";

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
};

export default function ProfileScreen() {
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Not authenticated");

      // Fetch profile (if none, create a basic one)
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,followers_count,following_count")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name: user.user_metadata?.name ?? "Your Name",
            avatar_url: null,
            followers_count: 0,
            following_count: 0,
          })
          .select("id,name,avatar_url,followers_count,following_count")
          .single();

        if (createErr) throw createErr;
        setProfile(created as ProfileRow);
      } else {
        setProfile(data as ProfileRow);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
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
        .select("id,name,avatar_url,followers_count,following_count")
        .single();

      if (updateErr) throw updateErr;

      setProfile(updated as ProfileRow);
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

  const avatarUri =
    profile.avatar_url ||
    "../../assets/default-avatar.png"

  return (
    <View style={s.container}>
      
      <Pressable onPress={pickAndUploadAvatar} disabled={uploading}>
        <Image source={{ uri: avatarUri }} style={s.avatar} />
        {uploading && (
          <View style={s.avatarOverlay}>
            <ActivityIndicator />
          </View>
        )}
      </Pressable>
      <Text style={s.hint}>Tap your picture to change it</Text>

      

      <Text style={s.name}>{profile.name ?? "Your Name"}</Text>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNumber}>{profile.followers_count ?? 0}</Text>
          <Text style={s.statLabel}>Followers</Text>
        </View>

        <View style={s.statBox}>
          <Text style={s.statNumber}>{profile.following_count ?? 0}</Text>
          <Text style={s.statLabel}>Following</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 48 },
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
});
