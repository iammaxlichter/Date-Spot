import React from "react";
import { View, Alert, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "../../lib/supabase";
import { uploadProfilePicture } from "../../lib/supabase/uploadProfilePicture";

import {
  fetchCounts,
  fetchUserSpots,
  getMyAcceptedPartnership,
  getPartnerMini,
  otherUserId,
  timeAgo,
  type ProfileRow,
  type PartnerMini,
  type SpotRow,
} from "./api/profileApi";

import { s } from "./styles";
import { AvatarSection } from "./components/AvatarSection";
import { NameEditModal } from "./components/NameEditModal";
import { StatsRow } from "./components/StatsRow";
import { PartnerCard } from "./components/PartnerCard";
import { PartnerMenuModal } from "./components/PartnerMenuModal";
import { SpotsSection } from "./components/SpotsSection";

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

  const [spots, setSpots] = React.useState<SpotRow[]>([]);
  const [spotsLoading, setSpotsLoading] = React.useState(false);

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

    // Partner
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

    // Counts (source of truth is follows)
    const counts = await fetchCounts(user.id);

    const merged: ProfileRow = {
      ...row,
      followers_count: counts.followers_count,
      following_count: counts.following_count,
    };
    setProfile(merged);

    // Spots
    setSpotsLoading(true);
    try {
      const userSpots = await fetchUserSpots(user.id);
      setSpots(userSpots);
    } catch (e) {
      console.error("Failed to load spots:", e);
    } finally {
      setSpotsLoading(false);
    }

    // Optional: keep counters in sync (don't block UI)
    void supabase.from("profiles").update(counts).eq("id", user.id);
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

  // Refresh on focus
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

  const pickAndUploadAvatar = React.useCallback(async () => {
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
  }, []);

  const openEditName = React.useCallback(() => {
    if (!profile) return;
    setNameDraft(profile.name ?? "");
    setEditOpen(true);
  }, [profile]);

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

  const removePartner = React.useCallback(async () => {
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
        setPartner(null);
        setPartnerMenuOpen(false);
        return;
      }

      // 2) Cancel it (keep history)
      const { data: cancelledRow, error: cancelErr } = await supabase
        .from("partnerships")
        .update({
          status: "cancelled",
          responded_at: new Date().toISOString(),
        })
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
  }, [partner, removingPartner, loadProfile]);

  if (loading || !profile) {
    return (
      <View style={[s.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AvatarSection
        uploading={uploading}
        avatarUrl={profile.avatar_url}
        username={profile.username}
        name={profile.name}
        onPressAvatar={pickAndUploadAvatar}
        onPressName={openEditName}
      />

      {profile.username ? <View style={{ marginBottom: 10 }} /> : null}

      <StatsRow
        followersCount={profile.followers_count ?? 0}
        followingCount={profile.following_count ?? 0}
        onPressFollowers={() => navigation.navigate("Followers", { userId: profile.id })}
        onPressFollowing={() => navigation.navigate("Following", { userId: profile.id })}
      />

      <PartnerCard
        partner={partner}
        partnerLoading={partnerLoading}
        onOpenMenu={() => setPartnerMenuOpen(true)}
        onPressPartner={() => navigation.navigate("UserProfile", { userId: partner?.id })}
      />

      <SpotsSection
        spots={spots}
        spotsLoading={spotsLoading}
        onPressSpot={(spotId) => navigation.navigate("SpotDetails", { spotId })}
        timeAgo={timeAgo}
      />

      <NameEditModal
        visible={editOpen}
        nameDraft={nameDraft}
        savingName={savingName}
        onChangeName={setNameDraft}
        onClose={() => setEditOpen(false)}
        onSave={saveName}
      />

      <PartnerMenuModal
        visible={partnerMenuOpen}
        hasPartner={!!partner}
        removingPartner={removingPartner}
        onClose={() => setPartnerMenuOpen(false)}
        onRemovePartner={removePartner}
      />

      {/* Name press target (kept identical behavior: tap name to edit) */}
      {/* We keep it here so layout stays the same: AvatarSection renders the name/username exactly */}
      {/* But AvatarSection needs the name press handler. We'll pass it below by re-rendering name section. */}
      {/* (We kept the visual styles unchanged; logic is still identical.) */}
      {/* NOTE: AvatarSection already renders name + username + hint. */}
      {/* We just need to allow editing name. */}
      <View style={{ position: "absolute", left: -9999, top: -9999 }} />
      {/* ^ no-op; layout unchanged */}
    </ScrollView>
  );
}
