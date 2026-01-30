// src/screens/Feed/components/PendingPartnerBanner.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager } from "react-native";
import { acceptRequest, declineRequest, PartnershipRow, getAcceptedPartnershipForUser } from "../../../services/api/partnerships";
import { supabase } from "../../../services/supabase/client";

type Props = {
  me: string;
  partnership: PartnershipRow;
  onResolved: () => void;
  onAnyAccepted: () => void; // NEW: Called when ANY request is accepted
};

type LocalState = "idle" | "accepting" | "declining" | "accepted" | "declined" | "error";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

async function getUsername(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.username ?? "unknown";
}

export function PendingPartnerBanner({ me, partnership, onResolved, onAnyAccepted }: Props) {
  const [requesterUsername, setRequesterUsername] = React.useState<string>("Someone");
  const [state, setState] = React.useState<LocalState>("idle");
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const u = await getUsername(partnership.requested_by);
        setRequesterUsername(u);
      } catch {
        // ignore
      }
    })();
  }, [partnership.requested_by]);

  const incoming = partnership.status === "pending" && partnership.requested_by !== me;
  if (!incoming || hidden) return null;

  const disableAll = state !== "idle";

  const insertEventForBoth = async (message: string) => {
    const { error } = await supabase.from("feed_events").insert([
      { user_id: partnership.user_a, type: "partnership", ref_id: partnership.id, message },
      { user_id: partnership.user_b, type: "partnership", ref_id: partnership.id, message },
    ]);
    if (error) throw error;
  };

  const otherId = me === partnership.user_a ? partnership.user_b : partnership.user_a;

  const resolveOptimistically = async (action: "accept" | "decline") => {
    if (disableAll) return;

    // 1) instant UI feedback
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState(action === "accept" ? "accepting" : "declining");

    // If accepting, immediately hide ALL banners to prevent double-tap
    if (action === "accept") {
      onAnyAccepted(); // This will hide all banners in parent
    }

    // Small micro-delay so user sees the state change before we hide
    await new Promise((r) => setTimeout(r, 120));

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState(action === "accept" ? "accepted" : "declined");
    setHidden(true);

    try {
      // 2) do real work with validation
      if (action === "accept") {
        // Check if I already have a partner before accepting
        const myExisting = await getAcceptedPartnershipForUser(me);
        if (myExisting && myExisting.id !== partnership.id) {
          throw new Error("You already have a DateSpot partner.");
        }

        await acceptRequest(partnership.id);
      } else {
        await declineRequest(partnership.id);
      }

      const [meU, otherU] = await Promise.all([getUsername(me), getUsername(otherId)]);
      const msg =
        action === "accept"
          ? `@${meU} accepted the partnership request with @${otherU}.`
          : `@${meU} declined the partnership request with @${otherU}.`;

      await insertEventForBoth(msg);

      // 3) refresh feed (will pull in the new feed_events and updated partnership state)
      onResolved();
    } catch (e: any) {
      console.error(e);

      // rollback: show banner again
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHidden(false);
      setState("idle");

      Alert.alert("Error", e?.message ?? `Failed to ${action} request.`);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Date partner request</Text>

      {state === "idle" ? (
        <Text style={s.body}>@{requesterUsername} wants to be your DateSpot partner.</Text>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator />
          <Text style={s.body}>
            {state === "accepting" ? "Accepting..." : state === "declining" ? "Declining..." : "Updating..."}
          </Text>
        </View>
      )}

      <View style={s.row}>
        <Pressable
          style={[s.btn, s.btnPrimary, disableAll && { opacity: 0.6 }]}
          onPress={() => resolveOptimistically("accept")}
          disabled={disableAll}
        >
          <Text style={s.btnPrimaryText}>Accept</Text>
        </Pressable>

        <Pressable
          style={[s.btn, s.btnGhost, disableAll && { opacity: 0.6 }]}
          onPress={() => resolveOptimistically("decline")}
          disabled={disableAll}
        >
          <Text style={s.btnGhostText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  body: { fontSize: 13, color: "#333" },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnPrimary: { backgroundColor: "#111" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  btnGhostText: { color: "#111", fontWeight: "800" },
});