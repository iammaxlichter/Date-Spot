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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabase/client";
import { PendingPartnerBanner } from "./components/PendingPartnerBanner";
import { PartnershipRow, getAcceptedPartnerIdsForUsers } from "../../services/api/partnerships";
import { fetchSpotTagsForSpotIds, type TaggedUser } from "../../services/api/spotTags";
import { buildTagPresentation } from "../../features/tags/tagPresentation";
import { getFollowedDateSpots } from "../../services/api/spots";
import { applySpotFilters } from "../../utils/filters";
import { useSpotFiltersStore } from "../../stores/spotFiltersStore";
import type { SpotFilters } from "../../features/filters/types";
import { UserAvatar } from "../../components/UserAvatar";

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
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  photos: SpotPhotoPreview[];
  tagged_users: TaggedUser[];
  partner_tagged_user_id: string | null;
};

type FeedEvent = {
  id: string;
  created_at: string;
  message: string;
  type: "partnership";
  ref_id: string | null;
  users?: [EventUserMini, EventUserMini];
};

type EventUserMini = {
  id: string;
  name: string | null;
  username: string | null;
};

type FeedItem =
  | { kind: "spot"; created_at: string; spot: FeedRow }
  | { kind: "event"; created_at: string; event: FeedEvent };

type FeedData = {
  feedItems: FeedItem[];
  spots: FeedRow[];
  userId: string;
  pendingIncoming: PartnershipRow[];
  hasAccepted: boolean;
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function replaceOnce(source: string, find: string, replaceWith: string) {
  const idx = source.indexOf(find);
  if (idx === -1) return source;
  return `${source.slice(0, idx)}${replaceWith}${source.slice(idx + find.length)}`;
}

function eventDisplayName(user: EventUserMini) {
  return (user.name ?? user.username ?? "unknown").trim() || "unknown";
}

async function fetchFeedData(filters: SpotFilters): Promise<FeedData> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes.user;
  if (!user) throw new Error("Not authenticated");

  const [spotsData, acceptedResult, pendingResult, eventsResult] = await Promise.all([
    getFollowedDateSpots(25, filters),
    supabase
      .from("partnerships")
      .select("id")
      .eq("status", "accepted")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .maybeSingle(),
    supabase
      .from("partnerships")
      .select("id,user_a,user_b,status,requested_by,created_at,responded_at")
      .eq("status", "pending")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("feed_events")
      .select("id,created_at,message,type,ref_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (acceptedResult.error) throw acceptedResult.error;
  if (pendingResult.error) throw pendingResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const spotsRaw: Omit<FeedRow, "photos" | "tagged_users" | "partner_tagged_user_id">[] = (
    spotsData ?? []
  ).map((item) => ({
    ...item.spot,
    author: item.author,
  }));

  const spotIds = spotsRaw.map((sp) => sp.id);
  const authorIds = Array.from(new Set(spotsRaw.map((sp) => sp.user_id)));

  let spots: FeedRow[] = spotsRaw.map((sp) => ({
    ...sp,
    photos: [],
    tagged_users: [],
    partner_tagged_user_id: null,
  }));

  if (spotsRaw.length > 0) {
    const [partnerByAuthor, photoResult, tagsBySpot] = await Promise.all([
      getAcceptedPartnerIdsForUsers(authorIds),
      supabase
        .from("spot_photos")
        .select("id,spot_id,path,position,created_at")
        .in("spot_id", spotIds)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      fetchSpotTagsForSpotIds(spotIds),
    ]);

    if (photoResult.error) {
      console.error("[feed] failed to load spot photos:", photoResult.error);
      spots = spotsRaw.map((sp) => ({
        ...sp,
        photos: [],
        tagged_users: tagsBySpot[sp.id] ?? [],
        partner_tagged_user_id: partnerByAuthor[sp.user_id] ?? null,
      }));
    } else {
      const photoRows =
        (photoResult.data as Array<{
          id: string;
          spot_id: string;
          path: string;
          position: number;
          created_at: string;
        }>) ?? [];

      const paths = photoRows.map((r) => r.path);
      const signedByPath = new Map<string, string>();

      if (paths.length > 0) {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("spot-photos")
          .createSignedUrls(paths, 3600);

        if (signedErr) {
          console.error("[feed] failed to sign spot photos:", signedErr);
        } else {
          for (const itm of signedData ?? []) {
            if (itm?.path && itm?.signedUrl) signedByPath.set(itm.path, itm.signedUrl);
          }
        }
      }

      const photosBySpot = new Map<string, SpotPhotoPreview[]>();
      for (const r of photoRows) {
        const list = photosBySpot.get(r.spot_id) ?? [];
        list.push({
          id: r.id,
          path: r.path,
          position: r.position,
          signedUrl: signedByPath.get(r.path) ?? "",
        });
        photosBySpot.set(r.spot_id, list);
      }

      spots = spotsRaw.map((sp) => ({
        ...sp,
        photos: (photosBySpot.get(sp.id) ?? []).filter((p) => !!p.signedUrl),
        tagged_users: tagsBySpot[sp.id] ?? [],
        partner_tagged_user_id: partnerByAuthor[sp.user_id] ?? null,
      }));
    }
  }

  const incoming = (pendingResult.data ?? []).filter(
    (p: any) => p.requested_by !== user.id
  ) as PartnershipRow[];

  const evs = (eventsResult.data ?? []) as FeedEvent[];
  const partnershipIds = Array.from(
    new Set(evs.map((ev) => ev.ref_id).filter((id): id is string => !!id))
  );

  let evsWithUsers: FeedEvent[] = evs;
  if (partnershipIds.length > 0) {
    const { data: partnerships, error: partnershipsErr } = await supabase
      .from("partnerships")
      .select("id,user_a,user_b")
      .in("id", partnershipIds);

    if (!partnershipsErr && partnerships) {
      const profileIds = Array.from(
        new Set(
          partnerships.flatMap((p: any) => [p.user_a, p.user_b]).filter(Boolean)
        )
      );

      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id,name,username")
        .in("id", profileIds);

      if (!profilesErr && profiles) {
        const partnershipById = new Map(
          partnerships.map((p: any) => [p.id as string, p as { id: string; user_a: string; user_b: string }])
        );
        const profileById = new Map(
          profiles.map((p: any) => [p.id as string, p as EventUserMini])
        );

        evsWithUsers = evs.map((ev) => {
          if (!ev.ref_id) return ev;
          const partnership = partnershipById.get(ev.ref_id);
          if (!partnership) return ev;
          const userA = profileById.get(partnership.user_a);
          const userB = profileById.get(partnership.user_b);
          if (!userA || !userB) return ev;
          return { ...ev, users: [userA, userB] };
        });
      }
    }
  }

  const feedItems: FeedItem[] = [
    ...spots.map((spot) => ({ kind: "spot" as const, created_at: spot.created_at, spot })),
    ...evsWithUsers.map((event) => ({ kind: "event" as const, created_at: event.created_at, event })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    feedItems,
    spots,
    userId: user.id,
    pendingIncoming: incoming,
    hasAccepted: !!acceptedResult.data?.id,
  };
}

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const bannerLockRef = React.useRef(false);
  const [localHideAllBanners, setLocalHideAllBanners] = React.useState(false);
  const filters = useSpotFiltersStore((state) => state.filters);

  const { data, isLoading, isRefetching, refetch, isError, error } = useQuery<FeedData>({
    queryKey: ["feed", filters],
    queryFn: () => fetchFeedData(filters),
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (isError && error) {
      Alert.alert("Error", (error as Error)?.message ?? "Failed to load feed.");
    }
  }, [isError, error]);

  useFocusEffect(
    React.useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const feedEvents = React.useMemo(
    () =>
      (data?.feedItems ?? []).filter(
        (item): item is Extract<FeedItem, { kind: "event" }> => item.kind === "event"
      ),
    [data?.feedItems]
  );
  const filteredSpots = React.useMemo(
    () => applySpotFilters(data?.spots ?? [], filters),
    [data?.spots, filters]
  );
  const feedItems = React.useMemo(() => {
    const spotItems: FeedItem[] = filteredSpots.map((spot) => ({
      kind: "spot",
      created_at: spot.created_at,
      spot,
    }));

    if (filters.sortOption === "newest" || filters.sortOption === "oldest") {
      const all = [...spotItems, ...feedEvents];
      all.sort((a, b) => {
        const delta = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return filters.sortOption === "newest" ? delta : -delta;
      });
      return all;
    }

    return [
      ...spotItems,
      ...[...feedEvents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    ];
  }, [feedEvents, filteredSpots, filters.sortOption]);

  const currentUserId = data?.userId ?? null;
  const pendingIncoming = data?.pendingIncoming ?? [];
  const hideAllBanners =
    localHideAllBanners || bannerLockRef.current || (data?.hasAccepted ?? false);
  const bannersReady = !isLoading;

  const onRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const goProfile = (userId: string) => {
    if (currentUserId && userId === currentUserId) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("UserProfile", { userId });
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    // Partnership event card
    if (item.kind === "event") {
      const ev = item.event;
      const users = ev.users;
      const defaultEventMessage = <Text style={s.eventMessage}>{ev.message}</Text>;
      let eventMessageNode = defaultEventMessage;
      let eventPeopleNode: React.ReactNode = null;

      if (users && users.length === 2) {
        const userA = users[0];
        const userB = users[1];
        const labelA = eventDisplayName(userA);
        const labelB = eventDisplayName(userB);

        let firstUser = userA;
        let firstLabel = labelA;
        let secondUser = userB;
        let secondLabel = labelB;

        const aPos = ev.message.indexOf(labelA);
        const bPos = ev.message.indexOf(labelB);
        if (aPos >= 0 && bPos >= 0 && bPos < aPos) {
          firstUser = userB;
          firstLabel = labelB;
          secondUser = userA;
          secondLabel = labelA;
        }

        const tokenA = "__EVENT_USER_A__";
        const tokenB = "__EVENT_USER_B__";
        const tokenized = replaceOnce(replaceOnce(ev.message, firstLabel, tokenA), secondLabel, tokenB);
        eventPeopleNode = (
          <Text style={s.eventPeopleRow}>
            People:{" "}
            <Text style={s.eventMessageLink} onPress={() => goProfile(firstUser.id)}>
              {firstLabel}
            </Text>
            {" & "}
            <Text style={s.eventMessageLink} onPress={() => goProfile(secondUser.id)}>
              {secondLabel}
            </Text>
          </Text>
        );

        if (tokenized.includes(tokenA) && tokenized.includes(tokenB)) {
          const parts = tokenized.split(/(__EVENT_USER_A__|__EVENT_USER_B__)/g);
          eventMessageNode = (
            <Text style={s.eventMessage}>
              {parts.map((part, idx) => {
                if (part === tokenA) {
                  return (
                    <Text key={`a-${idx}`} style={s.eventMessageLink} onPress={() => goProfile(firstUser.id)}>
                      {firstLabel}
                    </Text>
                  );
                }
                if (part === tokenB) {
                  return (
                    <Text key={`b-${idx}`} style={s.eventMessageLink} onPress={() => goProfile(secondUser.id)}>
                      {secondLabel}
                    </Text>
                  );
                }
                return <Text key={`t-${idx}`}>{part}</Text>;
              })}
            </Text>
          );
          eventPeopleNode = null;
        }
      }

      return (
        <View style={s.card}>
          <View style={s.accentBar} />
          <View style={s.cardInner}>
            <Text style={s.eventEyebrow}>Partnership Update</Text>
            {eventMessageNode}
            {eventPeopleNode}
            <Text style={s.eventTime}>{timeAgo(ev.created_at)} ago</Text>
          </View>
        </View>
      );
    }

    // Spot card
    const spot = item.spot;
    const author = spot.author;
    const presentation = buildTagPresentation(spot.tagged_users, spot.partner_tagged_user_id);

    return (
      <Pressable
        style={({ pressed }) => [s.cardWrap, pressed && { opacity: 0.92 }]}
        onPress={() => navigation.navigate("SpotDetails", { spotId: spot.id })}
      >
        <View style={s.card}>
        <View style={s.accentBar} />
        <View style={s.cardInner}>

          {/* Author row */}
          <Pressable style={s.authorRow} onPress={() => goProfile(spot.user_id)} hitSlop={8}>
            <UserAvatar uri={author?.avatar_url} size={36} style={s.authorAvatar} />
            <Text style={s.authorUsername}>
              {author?.name ?? (author?.username ? `@${author.username}` : "@unknown")}
            </Text>
            <Text style={s.authorTime}>{timeAgo(spot.created_at)} ago</Text>
          </Pressable>

          {/* Spot name */}
          <Text style={s.spotName} numberOfLines={2}>{spot.name}</Text>

          {/* Photos */}
          {spot.photos.length > 0 ? (
            <View style={s.photoRow}>
              {spot.photos.slice(0, 3).map((p) => (
                <Image key={p.id} source={{ uri: p.signedUrl }} style={s.photoThumb} resizeMode="cover" />
              ))}
            </View>
          ) : null}

          {/* Score chips */}
          {(spot.date_score != null || spot.atmosphere != null || spot.would_return != null) ? (
            <View style={s.scoreRow}>
              {spot.date_score != null ? (
                <View style={s.chipDate}>
                  <Text style={s.chipDateText}>{"★"} Date Score: {spot.date_score}/10</Text>
                </View>
              ) : null}
              {spot.atmosphere != null ? (
                <View style={s.chipAtmo}>
                  <Text style={s.chipAtmoText}>{"✦"} Atmosphere: {spot.atmosphere}/10</Text>
                </View>
              ) : null}
              {spot.would_return != null ? (
                <View style={[s.chipReturn, spot.would_return ? s.chipReturnYes : s.chipReturnNo]}>
                  <Text style={[s.chipReturnText, spot.would_return ? s.chipReturnYesText : s.chipReturnNoText]}>
                    {spot.would_return ? "Return!" : "Skip"}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Tag pills */}
          {(spot.vibe || spot.price || spot.best_for) ? (
            <View style={s.metaRow}>
              {spot.vibe ? <Text style={s.pill}>{spot.vibe}</Text> : null}
              {spot.price ? <Text style={s.pill}>{spot.price}</Text> : null}
              {spot.best_for ? <Text style={s.pill}>{spot.best_for}</Text> : null}
            </View>
          ) : null}

          {/* Went with */}
          {presentation.kind !== "none" ? (
            <>
              <View style={s.divider} />
              <View style={s.wentWithRow}>
                <Text style={s.wentWithLabel}>Went with </Text>
                {presentation.kind === "partner_only" ? (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); goProfile(presentation.partner.id); }}
                    hitSlop={8}
                  >
                    <Text style={s.wentWithUser}>
                      {presentation.partner.name ||
                        (presentation.partner.username ? `@${presentation.partner.username}` : "unknown")}
                    </Text>
                  </Pressable>
                ) : presentation.kind === "partner_with_others" ? (
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); goProfile(presentation.partner.id); }}
                    hitSlop={8}
                  >
                    <Text style={s.wentWithUser}>
                      {presentation.partner.name ||
                        (presentation.partner.username ? `@${presentation.partner.username}` : "unknown")}
                      <Text style={s.wentWithLabel}>
                        {" "}{"&"} {presentation.otherCount}{" "}
                        {presentation.otherCount === 1 ? "other" : "others"}
                      </Text>
                    </Text>
                  </Pressable>
                ) : (
                  <View style={s.wentWithUsersWrap}>
                    {presentation.users.map((u, idx) => (
                      <Pressable
                        key={u.id}
                        onPress={(e) => { e.stopPropagation(); goProfile(u.id); }}
                        hitSlop={8}
                      >
                        <Text style={s.wentWithUser}>
                          {u.name || (u.username ? `@${u.username}` : "unknown")}
                          {idx < presentation.users.length - 1 ? ", " : ""}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[s.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#E21E4D" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <FlatList
        data={feedItems}
        ListHeaderComponent={
          <View>
            {bannersReady && currentUserId && pendingIncoming.length > 0 && !hideAllBanners
              ? pendingIncoming.map((partnership) => (
                <PendingPartnerBanner
                  key={partnership.id}
                  me={currentUserId}
                  partnership={partnership}
                  onResolved={() => void refetch()}
                  onAnyAccepted={() => {
                    bannerLockRef.current = true;
                    setLocalHideAllBanners(true);
                    void refetch();
                  }}
                />
              ))
              : null}
          </View>
        }
        keyExtractor={(x) =>
          x.kind === "spot" ? `spot:${x.spot.id}` : `event:${x.event.id}`
        }
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#E21E4D"
            titleColor="#E21E4D"
            colors={["#E21E4D"]}
            progressBackgroundColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEyebrow}>Your Feed</Text>
            <Text style={s.emptyTitle}>No spots yet</Text>
            <Text style={s.emptyText}>
              Follow people and their Date Spots will show up here.
            </Text>
          </View>
        }
        ListFooterComponent={
          feedItems.length > 0 ? (
            <View style={s.footer}>
              <Text style={s.footerText}>{"You're all caught up!"}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 },

  // Card shell
  cardWrap: {},
  card: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 20,
    backgroundColor: "#fff",
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  accentBar: { height: 4, backgroundColor: "#FDE7ED" },
  cardInner: { padding: 16 },

  // Author row
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  authorAvatar: { backgroundColor: "#EFEFEF" },
  authorUsername: { fontSize: 14, fontWeight: "700", color: "#1D1D1D", flex: 1 },
  authorTime: { fontSize: 12, color: "#9D9D9D" },

  // Spot content
  spotName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1D1D1D",
    lineHeight: 22,
    marginBottom: 10,
  },
  photoRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F2F2F2",
  },

  // Score chips
  scoreRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  chipDate: {
    backgroundColor: "#E21E4D",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipDateText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  chipAtmo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipAtmoText: { color: "#444", fontSize: 12, fontWeight: "700" },
  chipReturn: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipReturnYes: { backgroundColor: "#DCFCE7" },
  chipReturnNo: { backgroundColor: "#F5F5F5" },
  chipReturnText: { fontSize: 12, fontWeight: "700" },
  chipReturnYesText: { color: "#16A34A" },
  chipReturnNoText: { color: "#888" },

  // Tag pills
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  pill: {
    borderWidth: 1,
    borderColor: "#FDD5DE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    color: "#1D1D1D",
    backgroundColor: "#FFF5F7",
  },

  // Went with
  divider: { height: 1, backgroundColor: "#F2F2F2", marginVertical: 12 },
  wentWithRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  wentWithLabel: { fontSize: 13, color: "#6D6D6D", fontWeight: "500" },
  wentWithUsersWrap: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  wentWithUser: { fontSize: 13, color: "#D91B46", fontWeight: "700" },

  // Partnership event card
  eventEyebrow: {
    color: "#D91B46",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  eventMessage: { fontSize: 14, color: "#1D1D1D", fontWeight: "500", lineHeight: 20, marginBottom: 6 },
  eventMessageLink: {
    color: "#D91B46",
    fontWeight: "800",
  },
  eventTime: { fontSize: 12, color: "#9D9D9D" },
  eventPeopleRow: { fontSize: 12, color: "#6D6D6D", marginBottom: 6 },

  // Empty state
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyEyebrow: {
    color: "#D91B46",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 26, fontWeight: "800", color: "#1D1D1D", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#6D6D6D", textAlign: "center", lineHeight: 20 },

  // Footer
  footer: { alignItems: "center", paddingVertical: 32 },
  footerText: { fontSize: 13, color: "#C0C0C0", fontWeight: "500" },
});
