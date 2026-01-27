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

function supaErrorText(e: any) {
  // supabase-js errors often have: message, code, details, hint
  const msg =
    e?.message ||
    e?.error?.message ||
    e?.details ||
    e?.hint ||
    (typeof e === "string" ? e : null);

  const code = e?.code || e?.error?.code;

  return {
    msg: msg ?? "Something went wrong.",
    code: code ? String(code) : null,
    details: e?.details ?? e?.hint ?? null,
  };
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

    // fetch partnership info
    const [myAccepted, theirAccepted, between] = await Promise.all([
      getAcceptedPartnershipForUser(currentUser.id),
      getAcceptedPartnershipForUser(userId),
      getActiveBetween(currentUser.id, userId),
    ]);

    setMeAccepted(myAccepted);
    setThemAccepted(theirAccepted);
    setPartnership(between);


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

  async function insertFeedEvent(userId: string, message: string, partnershipId?: string) {
    const { error } = await supabase.from("feed_events").insert({
      user_id: userId,
      type: "partnership",
      ref_id: partnershipId ?? null,
      message,
    });
    if (error) throw error;
  }



  const PartnerSection = () => {
    const me = currentUserId!;
    const them = userId;

    const iHavePartner = !!meAccepted;
    const theyHavePartner = !!themAccepted;

    const isBetweenPending = partnership?.status === "pending";
    const isBetweenAccepted = partnership?.status === "accepted";

    const incoming = isBetweenPending && partnership?.requested_by !== me;
    const outgoing = isBetweenPending && partnership?.requested_by === me;

    const disabledBecauseTaken = (!isBetweenAccepted && !isBetweenPending) && (iHavePartner || theyHavePartner);

    async function getUsername(userId: string): Promise<string> {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data?.username ?? "unknown";
    }

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

        const p = await requestPartner(me, them); // <-- returns inserted partnership row

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


    async function insertEventForBoth(userA: string, userB: string, partnershipId: string, message: string) {
      const { error } = await supabase.from("feed_events").insert([
        { user_id: userA, type: "partnership", ref_id: partnershipId, message },
        { user_id: userB, type: "partnership", ref_id: partnershipId, message },
      ]);
      if (error) throw error;
    }


    const onCancel = async () => {
      if (!partnership) return;
      if (partnerUpdating) return;

      try {
        setPartnerUpdating(true);

        const updated = await cancelRequest(partnership.id);

        const [meU, otherU] = await Promise.all([getUsername(me), getUsername(them)]);
        const msg = `@${meU} cancelled their DateSpot partnership request to @${otherU}.`;

        const { error } = await supabase.from("feed_events").insert([
          { user_id: updated.user_a, type: "partnership", ref_id: updated.id, message: msg },
          { user_id: updated.user_b, type: "partnership", ref_id: updated.id, message: msg },
        ]);
        if (error) throw error;

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
        <View style={{ width: "100%", paddingHorizontal: 24, marginBottom: 20, marginTop: 10 }}>
          <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 }}>
            <Text style={{ fontWeight: "800" }}>DateSpot partners</Text>
            <Text style={{ marginTop: 6, color: "#555" }}>
              You're connected.
            </Text>
          </View>
        </View>
      );
    }

    // Incoming request
    if (incoming) {
      return (
        <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 10 }}>
          <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 }}>
            <Text style={{ fontWeight: "800" }}>Partner request</Text>
            <Text style={{ marginTop: 6, color: "#555" }}>
              This person wants to connect as your DateSpot partner.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={onAccept}
                disabled={partnerUpdating}
                style={{
                  backgroundColor: "#111",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  opacity: partnerUpdating ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>Accept</Text>
              </Pressable>

              <Pressable
                onPress={onDecline}
                disabled={partnerUpdating}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  opacity: partnerUpdating ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#111", fontWeight: "800" }}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    // Outgoing request
    if (outgoing) {
      return (
        <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 10, marginBottom: 20 }}>
          <Pressable
            onPress={onCancel}
            disabled={partnerUpdating}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              opacity: partnerUpdating ? 0.6 : 1,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "800" }}>
              {partnerUpdating ? "..." : "Request sent (tap to cancel)"}
            </Text>
          </Pressable>
        </View>
      );
    }

    // If either user already has an accepted partner, don't allow starting anything new
    if (iHavePartner || theyHavePartner) {
      return (
        <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 10, marginBottom: 20 }}>
          <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 }}>
            <Text style={{ fontWeight: "800" }}>Unavailable</Text>
            <Text style={{ marginTop: 6, color: "#555" }}>
              {iHavePartner
                ? "You already have a DateSpot partner. Remove them before requesting someone new."
                : "This user already has a DateSpot partner."}
            </Text>
          </View>
        </View>
      );
    }


    // No relationship between you two
    return (
      <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 10, marginBottom: 20 }}>
        <Pressable
          onPress={() => {
            if (disabledBecauseTaken) return;
            onRequest();
          }}
          disabled={partnerUpdating || disabledBecauseTaken}
          style={{
            backgroundColor: disabledBecauseTaken ? "#eee" : "#111",
            paddingVertical: 12,
            borderRadius: 10,
            opacity: partnerUpdating ? 0.6 : 1,
            alignItems: "center",
          }}
        >
          <Text style={{ color: disabledBecauseTaken ? "#666" : "#fff", fontWeight: "800" }}>
            {disabledBecauseTaken
              ? "Unavailable (already partnered)"
              : partnerUpdating
                ? "Sending..."
                : "Ask to be DateSpot partner"}
          </Text>
        </Pressable>
      </View>
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

      {currentUserId && currentUserId !== userId ? (
        <PartnerSection />
      ) : null}

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
