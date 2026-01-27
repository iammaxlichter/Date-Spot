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
  TextInput
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { uploadProfilePicture } from "../lib/supabase/uploadProfilePicture";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Modal } from "react-native";

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
};

type PartnershipRow = {
  id: string;
  user_a: string;
  user_b: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  requested_by: string;
  created_at: string;
  responded_at: string | null;
};

type PartnerMini = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  name: string | null;
};

async function getMyAcceptedPartnership(myId: string): Promise<PartnershipRow | null> {
  const { data, error } = await supabase
    .from("partnerships")
    .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
    .eq("status", "accepted")
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    .order("responded_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as PartnershipRow) ?? null;
}

function otherUserId(p: PartnershipRow, me: string) {
  return p.user_a === me ? p.user_b : p.user_a;
}

async function getPartnerMini(userId: string): Promise<PartnerMini | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as PartnerMini | null) ?? null;
}


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
  const [editOpen, setEditOpen] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const [savingName, setSavingName] = React.useState(false);
  const [partner, setPartner] = React.useState<PartnerMini | null>(null);
  const [partnerLoading, setPartnerLoading] = React.useState(false);
  const [partnerMenuOpen, setPartnerMenuOpen] = React.useState(false);
  const [removingPartner, setRemovingPartner] = React.useState(false);


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
    setPartnerLoading(true);
    try {
      const p = await getMyAcceptedPartnership(user.id);
      if (!p) {
        setPartner(null);
      } else {
        const otherId = otherUserId(p, user.id);
        const other = await getPartnerMini(otherId);
        setPartner(other);
      }
    } finally {
      setPartnerLoading(false);
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

  const removePartner = async () => {
    if (!partner) return;
    if (removingPartner) return;

    try {
      setRemovingPartner(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const me = userRes?.user?.id;
      if (!me) throw new Error("Not authenticated");

      // 1) Find the accepted partnership between us
      const { data: pRow, error: pErr } = await supabase
        .from("partnerships")
        .select("id,user_a,user_b,status")
        .eq("status", "accepted")
        .or(
          `and(user_a.eq.${me},user_b.eq.${partner.id}),and(user_a.eq.${partner.id},user_b.eq.${me})`
        )
        .maybeSingle();

      if (pErr) throw pErr;
      if (!pRow) {
        // nothing to remove (already removed / stale UI)
        setPartner(null);
        setPartnerMenuOpen(false);
        return;
      }

      // 2) Cancel it (keep history)
      const { data: cancelledRow, error: cancelErr } = await supabase
        .from("partnerships")
        .update({ status: "cancelled", responded_at: new Date().toISOString() })
        .eq("id", pRow.id)
        .select("id,status")
        .single();

      if (cancelErr) throw cancelErr;

      if (!cancelledRow || cancelledRow.status !== "cancelled") {
        throw new Error("Partnership was not cancelled (permission / RLS issue).");
      }

      // 3) Create a feed event for BOTH users
      const { data: meProfile, error: meProfileErr } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", me)
        .maybeSingle();
      if (meProfileErr) throw meProfileErr;

      const { data: themProfile, error: themProfileErr } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", partner.id)
        .maybeSingle();
      if (themProfileErr) throw themProfileErr;

      const meU = meProfile?.username ?? "unknown";
      const themU = themProfile?.username ?? "unknown";

      const message = `@${meU} removed @${themU} as their DateSpot partner.`;

      const { error: eventErr } = await supabase.from("feed_events").insert([
        { user_id: pRow.user_a, type: "partnership", ref_id: pRow.id, message },
        { user_id: pRow.user_b, type: "partnership", ref_id: pRow.id, message },
      ]);

      if (eventErr) throw eventErr;

      // 4) Update UI
      setPartner(null);
      setPartnerMenuOpen(false);

      await loadProfile();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to remove partner.");
    } finally {
      setRemovingPartner(false);
    }
  };




  const saveName = React.useCallback(async () => {
    if (savingName) return;

    try {
      const next = nameDraft.trim();
      if (!next) {
        Alert.alert("Name required", "Please enter a name.");
        return;
      }

      setSavingName(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Not authenticated");

      const { data: updated, error: updateErr } = await supabase
        .from("profiles")
        .update({ name: next })
        .eq("id", user.id)
        .select("id,name,username,avatar_url,followers_count,following_count")
        .single();

      if (updateErr) throw updateErr;

      setProfile((p) =>
        p
          ? {
            ...(updated as ProfileRow),
            followers_count: p.followers_count,
            following_count: p.following_count,
          }
          : (updated as ProfileRow)
      );

      setEditOpen(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Update failed", e?.message ?? "Could not update name.");
    } finally {
      setSavingName(false);
    }
  }, [nameDraft, savingName]);


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

      <Pressable
        onPress={() => {
          setNameDraft(profile.name ?? "");
          setEditOpen(true);
        }}
      >
        <Text style={s.name}>{profile.name ?? "Your Name"}</Text>
      </Pressable>

      <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 14 }}>
        <View style={s.partnerCard}>

          {/* Header row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={s.partnerTitle}>DateSpot partner</Text>

            <Pressable onPress={() => setPartnerMenuOpen(true)} hitSlop={10}>
              <Text style={s.partnerDots}>⋯</Text>
            </Pressable>
          </View>

          {partnerLoading ? (
            <Text style={s.partnerBody}>Loading…</Text>
          ) : partner ? (
            <Pressable
              onPress={() => navigation.navigate("UserProfile", { userId: partner.id })}
              style={s.partnerRow}
            >
              <Image
                source={
                  partner.avatar_url
                    ? { uri: partner.avatar_url }
                    : require("../../assets/default-avatar.png")
                }
                style={s.partnerAvatar}
              />

              <Text style={s.partnerBody}>
                You're partnered with{" "}
                <Text style={{ fontWeight: "800" }}>
                  @{partner.username ?? "unknown"}
                </Text>
              </Text>
            </Pressable>
          ) : (
            <Text style={s.partnerBody}>You don’t have a DateSpot partner yet.</Text>
          )}
        </View>
      </View>



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

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit name</Text>

            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              style={s.modalInput}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
            />

            <View style={s.modalButtons}>
              <Pressable
                onPress={() => setEditOpen(false)}
                disabled={savingName}
                style={[
                  s.modalBtn,
                  s.modalBtnSecondary,
                  savingName && { opacity: 0.6 },
                ]}
              >
                <Text style={s.modalBtnTextSecondary}>Cancel</Text>
              </Pressable>


              <Pressable
                onPress={saveName}
                disabled={savingName}
                style={[
                  s.modalBtn,
                  s.modalBtnPrimary,
                  savingName && { opacity: 0.6 },
                ]}
              >
                <Text style={s.modalBtnTextPrimary}>
                  {savingName ? "Saving..." : "Save"}
                </Text>
              </Pressable>

            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={partnerMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPartnerMenuOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.menuCard}>
            {partner ? (
              <Pressable
                onPress={removePartner}
                disabled={removingPartner}
                style={[s.menuItem, removingPartner && { opacity: 0.6 }]}
              >
                <Text style={s.menuDanger}>
                  {removingPartner ? "Removing..." : "Remove DateSpot partner"}
                </Text>
              </Pressable>
            ) : null}

            <Pressable onPress={() => setPartnerMenuOpen(false)} style={s.menuItem}>
              <Text style={s.menuCancel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>



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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnPrimary: { backgroundColor: "#111" },
  modalBtnSecondary: { backgroundColor: "#f2f2f2" },
  modalBtnTextPrimary: { color: "#fff", fontWeight: "700" },
  modalBtnTextSecondary: { color: "#111", fontWeight: "700" },
  partnerCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 20
  },
  partnerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  partnerBody: { fontSize: 13, color: "#333" },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  partnerAvatar: { width: 36, height: 36, borderRadius: 18 },
  partnerLink: { fontSize: 13, color: "#111", fontWeight: "800" },
  partnerDots: {
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 6,
  },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    width: "100%",
    maxWidth: 320,
  },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  menuDanger: {
    color: "#d11a2a",
    fontWeight: "700",
    fontSize: 15,
  },

  menuCancel: {
    color: "#111",
    fontWeight: "700",
    fontSize: 15,
  },

});
