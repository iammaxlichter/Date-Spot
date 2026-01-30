import React from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  ImageSourcePropType,
  ScrollView,
  RefreshControl,
} from "react-native";
import { supabase } from "../../services/supabase/client";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getAcceptedPartnershipForUser,
  getActiveBetween,
  PartnershipRow,
} from "../../services/api/partnerships";

import { s } from "./styles";
import { ProfileHeader } from "./components/ProfileHeader";
import { FollowButton } from "./components/FollowButton";
import { StatsRow } from "./components/StatsRow";
import { PartnerSection } from "./components/PartnerSection";
import { PartnerMenuModal } from "./components/PartnerMenuModal";

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  following_count: number | null;
};

async function fetchCounts(userId: string) {
  const [
    { count: followersCount, error: followersErr },
    { count: followingCount, error: followingErr },
  ] = await Promise.all([
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

async function getUsername(id: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data?.username ?? "unknown";
}

async function insertEventForBoth(
  userA: string,
  userB: string,
  partnershipId: string,
  message: string
) {
  const { error } = await supabase.from("feed_events").insert([
    { user_id: userA, type: "partnership", ref_id: partnershipId, message },
    { user_id: userB, type: "partnership", ref_id: partnershipId, message },
  ]);
  if (error) throw error;
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

  const [partnership, setPartnership] = React.useState<PartnershipRow | null>(null);
  const [meAccepted, setMeAccepted] = React.useState<PartnershipRow | null>(null);
  const [themAccepted, setThemAccepted] = React.useState<PartnershipRow | null>(null);
  const [partnerUpdating, setPartnerUpdating] = React.useState(false);

  // 3-dots menu state (for removing partner)
  const [partnerMenuOpen, setPartnerMenuOpen] = React.useState(false);
  const [removingPartner, setRemovingPartner] = React.useState(false);

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

  const refreshPartnershipState = React.useCallback(async (me: string, them: string) => {
    const [myAccepted, theirAccepted, between] = await Promise.all([
      getAcceptedPartnershipForUser(me),
      getAcceptedPartnershipForUser(them),
      getActiveBetween(me, them),
    ]);

    setMeAccepted(myAccepted);
    setThemAccepted(theirAccepted);
    setPartnership(between);
  }, []);

  const loadProfile = React.useCallback(async (): Promise<void> => {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;

    const currentUser = userRes.user;
    if (!currentUser) throw new Error("Not authenticated");

    setCurrentUserId(currentUser.id);

    await refreshPartnershipState(currentUser.id, userId);

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
  }, [userId, refreshPartnershipState]);

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
        if (error && (error as any).code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
        if (error) throw error;
      }

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
      setIsFollowing(prevIsFollowing);
      setProfile(prevProfile);
      Alert.alert("Error", e?.message ?? "Failed to update follow status.");
    } finally {
      setFollowUpdating(false);
    }
  };

  // Remove partner (cancel accepted relationship)
  const removePartner = async () => {
    if (!currentUserId) return;
    if (removingPartner) return;

    // must be accepted between us
    if (!partnership || partnership.status !== "accepted") return;

    try {
      setRemovingPartner(true);

      const { data: cancelledRow, error: cancelErr } = await supabase
        .from("partnerships")
        .update({ status: "cancelled", responded_at: new Date().toISOString() })
        .eq("id", partnership.id)
        .select("id,status,user_a,user_b")
        .single();

      if (cancelErr) throw cancelErr;

      const meU = await getUsername(currentUserId);
      const themU = await getUsername(userId);
      const msg = `@${meU} removed @${themU} as their DateSpot partner.`;

      await insertEventForBoth(cancelledRow.user_a, cancelledRow.user_b, cancelledRow.id, msg);

      setPartnerMenuOpen(false);

      // Refresh local state so UI flips back to "Ask to be DateSpot partner"
      await refreshPartnershipState(currentUserId, userId);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to remove partner.");
    } finally {
      setRemovingPartner(false);
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
    : require("../../../assets/default-avatar.png");

  return (
    <>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ProfileHeader
          avatarSource={avatarSource}
          username={profile.username}
          name={profile.name}
        />

        <FollowButton
          isFollowing={isFollowing}
          followUpdating={followUpdating}
          onPress={toggleFollow}
        />

        <StatsRow
          followersCount={profile.followers_count ?? 0}
          followingCount={profile.following_count ?? 0}
          onPressFollowers={() => navigation.navigate("Followers", { userId: profile.id })}
          onPressFollowing={() => navigation.navigate("Following", { userId: profile.id })}
        />

        {currentUserId && currentUserId !== userId ? (
          <View style={s.partnerWrap}>
            <PartnerSection
              me={currentUserId}
              them={userId}
              partnership={partnership}
              meAccepted={meAccepted}
              themAccepted={themAccepted}
              partnerUpdating={partnerUpdating}
              setPartnerUpdating={setPartnerUpdating}
              refreshPartnershipState={refreshPartnershipState}
              getUsername={getUsername}
              insertEventForBoth={insertEventForBoth}
              onOpenMenu={() => setPartnerMenuOpen(true)}
            />

          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      <PartnerMenuModal
        visible={partnerMenuOpen}
        onClose={() => setPartnerMenuOpen(false)}
        onRemove={removePartner}
        removing={removingPartner}
      />
    </>
  );
}
