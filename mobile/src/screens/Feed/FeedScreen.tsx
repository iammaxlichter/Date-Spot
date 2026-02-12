// src/screens/FeedScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../services/supabase/client";
import { PendingPartnerBanner } from "./components/PendingPartnerBanner";
import { PartnershipRow } from "../../services/api/partnerships";

type ProfileMini = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type SpotPhotoPreview = {
  id: string;
  path: string;
  position: number;
  signedUrl: string;
};

type FeedRow = {
  id: string;
  created_at: string;
  user_id: string;

  name: string;
  atmosphere: string | null;
  date_score: number | null;
  notes: string | null;
  vibe: string | null;
  price: string | null;
  best_for: string | null;
  would_return: boolean;

  profiles: ProfileMini;
  photos: SpotPhotoPreview[];
};

type FeedEvent = {
  id: string;
  created_at: string;
  message: string;
  type: "partnership";
};

type FeedItem =
  | { kind: "spot"; created_at: string; spot: FeedRow }
  | { kind: "event"; created_at: string; event: FeedEvent };

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

export default function FeedScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [rows, setRows] = React.useState<FeedRow[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [pendingIncoming, setPendingIncoming] = React.useState<PartnershipRow[]>([]);
  const [events, setEvents] = React.useState<FeedEvent[]>([]);
  const [feedItems, setFeedItems] = React.useState<FeedItem[]>([]);

  // banner controls
  const [hideAllBanners, setHideAllBanners] = React.useState(false);

  // NEW: hard gate to prevent any banner render until this load decides banner state
  const [bannersReady, setBannersReady] = React.useState(false);

  // NEW: once we accept, lock banners off immediately for this screen lifetime
  const bannerLockRef = React.useRef(false);

  // prevent stale overlapping loads from committing (race fix)
  const loadSeqRef = React.useRef(0);

  const loadFeed = React.useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const isStale = () => seq !== loadSeqRef.current;

    try {
      // During reload, do NOT render banners at all until we recompute them.
      if (!isStale()) setBannersReady(false);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Not authenticated");

      if (!isStale()) setCurrentUserId(user.id);

      // follows
      const { data: follows, error: followsErr } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsErr) throw followsErr;

      const followingIds = (follows ?? [])
        .map((f: any) => f.following_id)
        .filter(Boolean);

      const feedUserIds = Array.from(new Set([user.id, ...followingIds]));

      // Fetch spots + (accepted partnership + pending) + events
      const spotsPromise = supabase
        .from("spots")
        .select(
          `
          id, created_at, user_id,
          name, atmosphere, date_score, notes, vibe, price, best_for, would_return,
          profiles!inner ( id, username, avatar_url )
        `
        )
        .in("user_id", feedUserIds)
        .order("created_at", { ascending: false })
        .limit(25);

      const acceptedPromise = supabase
        .from("partnerships")
        .select("id")
        .eq("status", "accepted")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle();

      const pendingPromise = supabase
        .from("partnerships")
        .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
        .eq("status", "pending")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const eventsPromise = supabase
        .from("feed_events")
        .select("id,created_at,message,type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const [
        { data: spotsData, error: spotsErr },
        { data: acceptedData, error: acceptedErr },
        { data: pendingData, error: pendingErr },
        { data: eventsData, error: eventsErr },
      ] = await Promise.all([spotsPromise, acceptedPromise, pendingPromise, eventsPromise]);

      if (spotsErr) throw spotsErr;
      if (acceptedErr) throw acceptedErr;
      if (pendingErr) throw pendingErr;
      if (eventsErr) throw eventsErr;

      if (isStale()) return;

      // Filter incoming pending
      const incoming = (pendingData ?? []).filter((p: any) => p.requested_by !== user.id);

      // Decide banner hide:
      // - if we locally locked (accepted just happened), hide
      // - OR if server shows an accepted partnership, hide
      const serverHasAccepted = !!acceptedData?.id;
      const shouldHide = bannerLockRef.current || serverHasAccepted;

      setHideAllBanners(shouldHide);
      setPendingIncoming(incoming);

      // Now banners are allowed to render (but shouldHide may prevent them)
      setBannersReady(true);

      // Merge feed items
      const spotsRaw = ((spotsData ?? []) as unknown) as Omit<FeedRow, "photos">[];
      let spots: FeedRow[] = spotsRaw.map((s) => ({ ...s, photos: [] }));

      if (spotsRaw.length > 0) {
        const spotIds = spotsRaw.map((s) => s.id);
        const { data: photoRows, error: photosErr } = await supabase
          .from("spot_photos")
          .select("id,spot_id,path,position,created_at")
          .in("spot_id", spotIds)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });

        if (photosErr) {
          console.error("[feed] failed to load spot photos:", photosErr);
        } else {
          const rows =
            (photoRows as Array<{
              id: string;
              spot_id: string;
              path: string;
              position: number;
              created_at: string;
            }>) ?? [];

          const paths = rows.map((r) => r.path);
          const signedByPath = new Map<string, string>();

          if (paths.length > 0) {
            const { data: signedData, error: signedErr } = await supabase.storage
              .from("spot-photos")
              .createSignedUrls(paths, 3600);

            if (signedErr) {
              console.error("[feed] failed to sign spot photos:", signedErr);
            } else {
              for (const item of signedData ?? []) {
                if (item?.path && item?.signedUrl) {
                  signedByPath.set(item.path, item.signedUrl);
                }
              }
            }
          }

          const photosBySpot = new Map<string, SpotPhotoPreview[]>();
          for (const r of rows) {
            const list = photosBySpot.get(r.spot_id) ?? [];
            list.push({
              id: r.id,
              path: r.path,
              position: r.position,
              signedUrl: signedByPath.get(r.path) ?? "",
            });
            photosBySpot.set(r.spot_id, list);
          }

          spots = spotsRaw.map((s) => ({
            ...s,
            photos: (photosBySpot.get(s.id) ?? []).filter((p) => !!p.signedUrl),
          }));
        }
      }

      const evs = (eventsData ?? []) as FeedEvent[];

      const merged: FeedItem[] = [
        ...spots.map((s) => ({ kind: "spot" as const, created_at: s.created_at, spot: s })),
        ...evs.map((e) => ({ kind: "event" as const, created_at: e.created_at, event: e })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(merged);
      setRows(spots);
      setEvents(evs);
    } catch (e: any) {
      if (seq !== loadSeqRef.current) return;
      throw e;
    }
  }, []);

  // initial load
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadFeed();
      } catch (e: any) {
        console.error(e);
        Alert.alert("Error", e?.message ?? "Failed to load feed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFeed]);

  // refresh whenever you return to the feed screen
  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        try {
          await loadFeed();
        } catch (e) {
          console.error("Feed focus refresh failed:", e);
        }
      })();
    }, [loadFeed])
  );

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadFeed();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to refresh feed.");
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed]);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.kind === "event") {
      const e = item.event;
      return (
        <View style={s.card}>
          <Text style={{ fontSize: 14, fontWeight: "800", marginBottom: 6 }}>
            Partnership update
          </Text>
          <Text style={{ fontSize: 13, color: "#333" }}>{e.message}</Text>
          <Text style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
            {timeAgo(e.created_at)} ago
          </Text>
        </View>
      );
    }

    const spot = item.spot;
    const profile = spot.profiles;

    const avatarSource = profile?.avatar_url
      ? { uri: profile.avatar_url }
      : require("../../../assets/default-avatar.png");

    const username = profile?.username ? `@${profile.username}` : "@unknown";

    const handleProfilePress = () => {
      if (currentUserId && spot.user_id === currentUserId) {
        navigation.navigate("Profile");
      } else {
        navigation.navigate("UserProfile", { userId: spot.user_id });
      }
    };

    const handleSpotPress = () => {
      navigation.navigate("SpotDetails", { spotId: spot.id });
    };

    return (
      <Pressable onPress={handleSpotPress} style={s.card}>
        <View style={s.headerRow}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleProfilePress();
            }}
            hitSlop={8}
          >
            <Image source={avatarSource} style={s.avatar} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleProfilePress();
              }}
              hitSlop={8}
            >
              <Text style={s.username}>{username}</Text>
            </Pressable>

            <Text style={s.time}>{timeAgo(spot.created_at)} ago</Text>
          </View>
        </View>

        <Text style={s.spotName}>{spot.name}</Text>
        {spot.photos.length > 0 ? (
          <View style={s.photoRow}>
            {spot.photos.slice(0, 4).map((p) => (
              <Image key={p.id} source={{ uri: p.signedUrl }} style={s.photoThumb} />
            ))}
          </View>
        ) : null}

        <View style={s.metricsRow}>
          <Text style={s.metric}>Atmosphere: {spot.atmosphere ?? "—"}</Text>
          <Text style={s.metric}>Date score: {spot.date_score ?? "—"}</Text>
        </View>

        <View style={s.metaRow}>
          {spot.vibe ? <Text style={s.pill}>{spot.vibe}</Text> : null}
          {spot.price ? <Text style={s.pill}>{spot.price}</Text> : null}
          {spot.best_for ? <Text style={s.pill}>{spot.best_for}</Text> : null}
          <Text style={[s.pill, spot.would_return ? s.pillYes : s.pillNo]}>
            {spot.would_return ? "Would return" : "Would not return"}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, textAlign: "center" }}>Loading feed…</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <FlatList
        data={feedItems}
        ListHeaderComponent={
          <View>
            {/* IMPORTANT: banners only render when bannersReady=true */}
            {bannersReady &&
            currentUserId &&
            pendingIncoming.length > 0 &&
            !hideAllBanners ? (
              <>
                {pendingIncoming.map((partnership) => (
                  <PendingPartnerBanner
                    key={partnership.id}
                    me={currentUserId}
                    partnership={partnership}
                    onResolved={() => loadFeed()}
                    onAnyAccepted={() => {
                      // hard lock immediately (no flash), and clear local pending
                      bannerLockRef.current = true;
                      setHideAllBanners(true);
                      setPendingIncoming([]);
                      setBannersReady(true);
                    }}
                  />
                ))}
              </>
            ) : null}
          </View>
        }
        keyExtractor={(x) => (x.kind === "spot" ? `spot:${x.spot.id}` : `event:${x.event.id}`)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No spots yet</Text>
            <Text style={s.emptyText}>Create your first DateSpot and it&apos;ll show up here.</Text>
          </View>
        }
        ListFooterComponent={
          rows.length > 0 ? (
            <View style={s.footer}>
              <Text style={s.footerText}>You&apos;ve reached the bottom of your feed!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },

  username: { fontSize: 14, fontWeight: "800", color: "#111" },
  time: { fontSize: 12, color: "#777", marginTop: 2 },

  spotName: { fontSize: 18, fontWeight: "800", marginTop: 4, color: "#111" },
  photoRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  metricsRow: { flexDirection: "row", gap: 14, marginTop: 10 },
  metric: { fontSize: 13, color: "#333" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  pill: {
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  pillYes: { backgroundColor: "#f2fff7", borderColor: "#d6ffe6" },
  pillNo: { backgroundColor: "#fff6f6", borderColor: "#ffe0e0" },

  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  emptyText: { fontSize: 13, color: "#666", textAlign: "center" },
  footer: { alignItems: "center", paddingVertical: 100 },
  footerText: { fontSize: 14, color: "#999", fontStyle: "italic" },
});
