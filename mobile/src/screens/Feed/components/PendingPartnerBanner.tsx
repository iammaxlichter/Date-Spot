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

async function getDisplayName(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.name || data?.username || "unknown";
}

export function PendingPartnerBanner({ me, partnership, onResolved, onAnyAccepted }: Props) {
  const [requesterUsername, setRequesterUsername] = React.useState<string>("Someone");
  const [state, setState] = React.useState<LocalState>("idle");
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const u = await getDisplayName(partnership.requested_by);
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
          throw new Error("You already have a Date Spot partner.");
        }

        await acceptRequest(partnership.id);
      } else {
        await declineRequest(partnership.id);
      }

      const [meU, otherU] = await Promise.all([getDisplayName(me), getDisplayName(otherId)]);
      const msg =
        action === "accept"
          ? `${meU} accepted the partnership request with ${otherU}.`
          : `${meU} declined the partnership request with ${otherU}.`;

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
      <View style={s.accentBar} />
      <View style={s.inner}>
        <Text style={s.eyebrow}>Partner Request</Text>

        {state === "idle" ? (
          <Text style={s.body}>
            <Text style={s.boldName}>{requesterUsername}</Text> wants to be your Date Spot partner.
          </Text>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator size="small" color="#E21E4D" />
            <Text style={s.body}>
              {state === "accepting" ? "Accepting..." : state === "declining" ? "Declining..." : "Updating..."}
            </Text>
          </View>
        )}

        <View style={s.row}>
          <Pressable
            style={[s.btnPrimary, disableAll && { opacity: 0.6 }]}
            onPress={() => resolveOptimistically("accept")}
            disabled={disableAll}
          >
            <Text style={s.btnPrimaryText}>Accept</Text>
          </Pressable>

          <Pressable
            style={[s.btnGhost, disableAll && { opacity: 0.6 }]}
            onPress={() => resolveOptimistically("decline")}
            disabled={disableAll}
          >
            <Text style={s.btnGhostText}>Decline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 20,
    backgroundColor: "#fff",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  accentBar: { height: 4, backgroundColor: "#FDE7ED" },
  inner: { padding: 16 },
  eyebrow: {
    color: "#D91B46",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  body: { fontSize: 14, color: "#6D6D6D", lineHeight: 20, marginBottom: 16 },
  boldName: { color: "#1D1D1D", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#1D1D1D",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnGhost: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#EFEFEF",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  btnGhostText: { color: "#1D1D1D", fontWeight: "700", fontSize: 14 },
});
