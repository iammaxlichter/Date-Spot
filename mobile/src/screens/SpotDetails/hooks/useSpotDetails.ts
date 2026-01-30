// src/screens/SpotDetails/hooks/useSpotDetails.ts
import * as React from "react";
import { Alert, ImageSourcePropType } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../services/supabase/client";
import type { SpotFull } from "../types";

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

export function useSpotDetails(args: { spotId: string; navigation: any }) {
  const { spotId, navigation } = args;

  const [loading, setLoading] = React.useState(true);
  const [spot, setSpot] = React.useState<SpotFull | null>(null);
  const [expandedNotes, setExpandedNotes] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        setCurrentUserId(userRes.user?.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("spots")
        .select(
          `
          id, created_at, user_id,
          name, atmosphere, date_score, notes, vibe, price, best_for, would_return,
          profiles ( id, username, avatar_url )
        `
        )
        .eq("id", spotId)
        .single();

      if (error) throw error;

      setSpot(data as unknown as SpotFull);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to load DateSpot.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, spotId]);

  // initial load
  React.useEffect(() => {
    void load();
  }, [load]);

  // refresh when coming back (after EditSpot save)
  useFocusEffect(
    React.useCallback(() => {
      void load();
      return () => {};
    }, [load])
  );

  const isOwner = !!currentUserId && !!spot && spot.user_id === currentUserId;

  const profile = spot?.profiles ?? null;
  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : require("../../../../assets/default-avatar.png");

  const username = profile?.username ? `@${profile.username}` : "@unknown";

  const notes = (spot?.notes ?? "").trim();
  const shortNotes =
    notes.length > 180 ? notes.slice(0, 180).trimEnd() + "…" : notes;

  const onEdit = React.useCallback(() => {
    if (!spot) return;
    navigation.navigate("EditSpot", { spotId: spot.id });
  }, [navigation, spot]);

  const onProfilePress = React.useCallback(() => {
    if (!spot) return;

    if (spot.user_id === currentUserId) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("UserProfile", { userId: spot.user_id });
    }
  }, [currentUserId, navigation, spot]);

  const timeAgoText = spot ? `${timeAgo(spot.created_at)} ago` : "";

  return {
    loading,
    spot,
    expandedNotes,
    setExpandedNotes,
    isOwner,
    avatarSource,
    username,
    notes,
    shortNotes,
    onEdit,
    onProfilePress,
    timeAgoText,
  };
}
