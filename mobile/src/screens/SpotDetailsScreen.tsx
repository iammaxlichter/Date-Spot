// src/screens/SpotDetailsScreen.tsx
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    Pressable,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";

type ProfileMini = {
    id: string;
    username: string | null;
    avatar_url: string | null;
};

type SpotFull = {
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

    profiles: ProfileMini | null;
};

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

export default function SpotDetailsScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const spotId: string = route.params.spotId;

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
            } catch (e) {
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

            setSpot((data as unknown) as SpotFull);
        } catch (e: any) {
            console.error(e);
            Alert.alert("Error", e?.message ?? "Failed to load DateSpot.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [navigation, spotId]);

    React.useEffect(() => {
        void load();
    }, [load]);

    if (loading) {
        return (
            <View style={[s.screen, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading DateSpot…</Text>
            </View>
        );
    }

    if (!spot) return null;

    const isOwner = !!currentUserId && spot.user_id === currentUserId;

    const profile = spot.profiles;
    const avatarSource = profile?.avatar_url
        ? { uri: profile.avatar_url }
        : require("../../assets/default-avatar.png");
    const username = profile?.username ? `@${profile.username}` : "@unknown";

    const notes = (spot.notes ?? "").trim();
    const shortNotes = notes.length > 180 ? notes.slice(0, 180).trimEnd() + "…" : notes;

    const onEdit = () => {
        navigation.navigate("EditSpot", { spotId: spot.id });
    };

    const handleProfilePress = () => {
        if (spot.user_id === currentUserId) {
            navigation.navigate("Profile");
        } else {
            navigation.navigate("UserProfile", { userId: spot.user_id });
        }
    };


    return (
        <ScrollView style={s.screen} contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
            <View style={s.card}>
                {/* ✅ top-right edit button (only for owner) */}
                {isOwner ? (
                    <Pressable onPress={onEdit} hitSlop={10} style={s.editBtn}>
                        <Text style={s.editBtnText}>Edit</Text>
                    </Pressable>
                ) : null}

                <View style={s.headerRow}>
                    <Pressable onPress={handleProfilePress} hitSlop={6}>
                        <Image source={avatarSource} style={s.avatar} />
                    </Pressable>

                    <View>
                        <Pressable onPress={handleProfilePress} hitSlop={6}>
                            <Text style={s.username}>{username}</Text>
                        </Pressable>

                        <Text style={s.time}>{timeAgo(spot.created_at)} ago</Text>
                    </View>
                </View>


                <Text style={s.title}>{spot.name}</Text>

                <View style={s.section}>
                    <View style={s.row}>
                        <Text style={s.k}>Atmosphere</Text>
                        <Text style={s.v}>{spot.atmosphere ?? "—"}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.k}>Date score</Text>
                        <Text style={s.v}>{spot.date_score ?? "—"}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.k}>Would return</Text>
                        <Text style={s.v}>{spot.would_return ? "Yes" : "No"}</Text>
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.label}>Tags</Text>
                    <View style={s.metaRow}>
                        {spot.vibe ? <Text style={s.pill}>{spot.vibe}</Text> : null}
                        {spot.price ? <Text style={s.pill}>{spot.price}</Text> : null}
                        {spot.best_for ? <Text style={s.pill}>{spot.best_for}</Text> : null}
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.label}>Notes</Text>
                    <Text style={s.notes}>{expandedNotes ? (notes || "—") : (shortNotes || "—")}</Text>

                    {notes.length > 180 ? (
                        <Pressable onPress={() => setExpandedNotes((x) => !x)} hitSlop={8}>
                            <Text style={s.link}>{expandedNotes ? "Show less" : "Show more"}</Text>
                        </Pressable>
                    ) : null}
                </View>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#fff" },

    card: {
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#fff",
        position: "relative", // ✅ needed for absolute edit button
    },

    editBtn: {
        position: "absolute",
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
        zIndex: 10,
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#111",
    },

    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 10 },

    username: { fontSize: 14, fontWeight: "800", color: "#111" },
    time: { fontSize: 12, color: "#777", marginTop: 2 },

    title: { fontSize: 22, fontWeight: "900", color: "#111", marginTop: 6 },

    section: { marginTop: 14 },
    label: { fontSize: 13, fontWeight: "800", color: "#111", marginBottom: 8 },

    row: { flexDirection: "row", justifyContent: "space-between", gap: 14, paddingVertical: 6 },
    k: { fontSize: 13, color: "#666" },
    v: { fontSize: 13, color: "#111", fontWeight: "700" },

    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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

    notes: { fontSize: 13, lineHeight: 18, color: "#222" },
    link: { marginTop: 8, fontSize: 13, fontWeight: "800", color: "#111" },
});
