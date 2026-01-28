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
  Modal,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  getAcceptedPartnershipForUser,
  getActiveBetween,
  requestPartner,
  cancelRequest,
  acceptRequest,
  declineRequest,
  PartnershipRow,
} from "../lib/partnerships";
import { isMutualFollow } from "../lib/partnerships";

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

  async function getUsername(id: string): Promise<string> {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data?.username ?? "unknown";
  }

  async function insertEventForBoth(userA: string, userB: string, partnershipId: string, message: string) {
    const { error } = await supabase.from("feed_events").insert([
      { user_id: userA, type: "partnership", ref_id: partnershipId, message },
      { user_id: userB, type: "partnership", ref_id: partnershipId, message },
    ]);
    if (error) throw error;
  }

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

  const PartnerSection = () => {
    const me = currentUserId!;
    const them = userId;

    const iHavePartner = !!meAccepted;
    const theyHavePartner = !!themAccepted;

    const isBetweenPending = partnership?.status === "pending";
    const isBetweenAccepted = partnership?.status === "accepted";

    const incoming = isBetweenPending && partnership?.requested_by !== me;
    const outgoing = isBetweenPending && partnership?.requested_by === me;

    // only allow menu when YOU are partnered with THIS profile
    const isMyPartner =
      isBetweenAccepted &&
      meAccepted &&
      (meAccepted.user_a === them || meAccepted.user_b === them);

    const disabledBecauseTaken =
      !isBetweenAccepted && !isBetweenPending && (iHavePartner || theyHavePartner);

    const onRequest = async () => {
      if (partnerUpdating) return;

      try {
        setPartnerUpdating(true);

        const ok = await isMutualFollow(me, them);
        if (!ok) {
          Alert.alert(
            "Follow each other to partner",
            "You both need to follow each other before you can become DateSpot partners."
          );
          return;
        }

        const p = await requestPartner(me, them);

        const [meU, otherU] = await Promise.all([getUsername(me), getUsername(them)]);
        const msg = `@${meU} sent a DateSpot partnership request to @${otherU}.`;

        await insertEventForBoth(p.user_a, p.user_b, p.id, msg);

        await refreshPartnershipState(me, them);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to send request.");
      } finally {
        setPartnerUpdating(false);
      }
    };

    const onCancel = async () => {
      if (!partnership) return;
      if (partnerUpdating) return;

      try {
        setPartnerUpdating(true);

        const updated = await cancelRequest(partnership.id);

        const [meU, otherU] = await Promise.all([getUsername(me), getUsername(them)]);
        const msg = `@${meU} cancelled their DateSpot partnership request to @${otherU}.`;

        await insertEventForBoth(updated.user_a, updated.user_b, updated.id, msg);

        await refreshPartnershipState(me, them);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to cancel request.");
      } finally {
        setPartnerUpdating(false);
      }
    };

    const onAccept = async () => {
      if (!partnership) return;
      if (partnerUpdating) return;

      try {
        setPartnerUpdating(true);
        await acceptRequest(partnership.id);
        await refreshPartnershipState(me, them);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to accept.");
      } finally {
        setPartnerUpdating(false);
      }
    };

    const onDecline = async () => {
      if (!partnership) return;
      if (partnerUpdating) return;

      try {
        setPartnerUpdating(true);
        await declineRequest(partnership.id);
        await refreshPartnershipState(me, them);
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "Failed to decline.");
      } finally {
        setPartnerUpdating(false);
      }
    };

    // Already partners
    if (isBetweenAccepted) {
      return (
        <View style={s.partnerCard}>
          <View style={s.partnerHeaderRow}>
            <Text style={s.partnerTitle}>DateSpot partners</Text>

            {isMyPartner ? (
              <Pressable onPress={() => setPartnerMenuOpen(true)} hitSlop={10}>
                <Text style={s.partnerDots}>⋯</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={s.partnerBody}>You're connected.</Text>
        </View>
      );
    }

    // Incoming request
    if (incoming) {
      return (
        <View style={s.partnerCard}>
          <Text style={s.partnerTitle}>Partner request</Text>
          <Text style={[s.partnerBody, { marginTop: 6 }]}>
            This person wants to connect as your DateSpot partner.
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={onAccept}
              disabled={partnerUpdating}
              style={[s.primaryBtn, partnerUpdating && { opacity: 0.6 }]}
            >
              <Text style={s.primaryBtnText}>Accept</Text>
            </Pressable>

            <Pressable
              onPress={onDecline}
              disabled={partnerUpdating}
              style={[s.secondaryBtn, partnerUpdating && { opacity: 0.6 }]}
            >
              <Text style={s.secondaryBtnText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Outgoing request
    if (outgoing) {
      return (
        <Pressable
          onPress={onCancel}
          disabled={partnerUpdating}
          style={[s.outgoingPill, partnerUpdating && { opacity: 0.6 }]}
        >
          <Text style={{ fontWeight: "800" }}>
            {partnerUpdating ? "..." : "Request sent (tap to cancel)"}
          </Text>
        </Pressable>
      );
    }

    // If either user already has an accepted partner, don't allow starting anything new
    if (iHavePartner || theyHavePartner) {
      return (
        <View style={s.partnerCard}>
          <Text style={s.partnerTitle}>Unavailable</Text>
          <Text style={[s.partnerBody, { marginTop: 6 }]}>
            {iHavePartner
              ? "You already have a DateSpot partner. Remove them before requesting someone new."
              : "This user already has a DateSpot partner."}
          </Text>
        </View>
      );
    }

    // No relationship between you two
    return (
      <Pressable
        onPress={() => {
          if (disabledBecauseTaken) return;
          onRequest();
        }}
        disabled={partnerUpdating || disabledBecauseTaken}
        style={[
          s.primaryWideBtn,
          disabledBecauseTaken && { backgroundColor: "#eee" },
          partnerUpdating && { opacity: 0.6 },
        ]}
      >
        <Text style={[s.primaryWideBtnText, disabledBecauseTaken && { color: "#666" }]}>
          {disabledBecauseTaken
            ? "Unavailable (already partnered)"
            : partnerUpdating
            ? "Sending..."
            : "Ask to be DateSpot partner"}
        </Text>
      </Pressable>
    );
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
    <>
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

        {currentUserId && currentUserId !== userId ? (
          <View style={s.partnerWrap}>
            <PartnerSection />
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Partner menu modal */}
      <Modal
        visible={partnerMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPartnerMenuOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.menuCard}>
            <Pressable
              onPress={removePartner}
              disabled={removingPartner}
              style={[s.menuItem, removingPartner && { opacity: 0.6 }]}
            >
              <Text style={s.menuDanger}>
                {removingPartner ? "Removing..." : "Remove DateSpot partner"}
              </Text>
            </Pressable>

            <Pressable onPress={() => setPartnerMenuOpen(false)} style={s.menuItem}>
              <Text style={s.menuCancel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 120,
    backgroundColor: "white",
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

  partnerWrap: { width: "100%", paddingHorizontal: 24, marginTop: 24 },

  partnerCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  partnerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partnerTitle: { fontSize: 14, fontWeight: "800" },
  partnerBody: { fontSize: 13, color: "#333" },
  partnerDots: {
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 6,
  },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#111", fontWeight: "800" },

  outgoingPill: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryWideBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryWideBtnText: { color: "#fff", fontWeight: "800" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
