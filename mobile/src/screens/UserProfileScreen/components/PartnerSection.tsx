import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { s } from "../styles";
import {
  requestPartner,
  cancelRequest,
  acceptRequest,
  declineRequest,
  isMutualFollow,
  PartnershipRow,
} from "../../../services/api/partnerships";

type Props = {
  me: string;
  them: string;

  partnership: PartnershipRow | null;
  meAccepted: PartnershipRow | null;
  themAccepted: PartnershipRow | null;

  partnerUpdating: boolean;
  setPartnerUpdating: (v: boolean) => void;

  refreshPartnershipState: (me: string, them: string) => Promise<void>;

  getUsername: (id: string) => Promise<string>;
  insertEventForBoth: (
    userA: string,
    userB: string,
    partnershipId: string,
    message: string
  ) => Promise<void>;

  onOpenMenu: () => void;
};

export function PartnerSection(props: Props) {
  const {
    me,
    them,
    partnership,
    meAccepted,
    themAccepted,
    partnerUpdating,
    setPartnerUpdating,
    refreshPartnershipState,
    getUsername,
    insertEventForBoth,
    onOpenMenu,
  } = props;

  const iHavePartner = !!meAccepted;
  const theyHavePartner = !!themAccepted;

  const isBetweenPending = partnership?.status === "pending";
  const isBetweenAccepted = partnership?.status === "accepted";

  const incoming = isBetweenPending && partnership?.requested_by !== me;
  const outgoing = isBetweenPending && partnership?.requested_by === me;

  const isMyPartner =
    isBetweenAccepted &&
    meAccepted &&
    (meAccepted.user_a === them || meAccepted.user_b === them);

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
    if (!partnership || partnerUpdating) return;

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
    if (!partnership || partnerUpdating) return;

    try {
      setPartnerUpdating(true);
      await acceptRequest(partnership.id);
      await refreshPartnershipState(me, them);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to accept.");
    } finally {
      setPartnerUpdating(false);
    }
  };

  const onDecline = async () => {
    if (!partnership || partnerUpdating) return;

    try {
      setPartnerUpdating(true);
      await declineRequest(partnership.id);
      await refreshPartnershipState(me, them);
    } catch (e: any) {
      console.error(e);
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
            <Pressable onPress={onOpenMenu} hitSlop={10}>
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

  // Block if either already partnered
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

  // Default: request button
  return (
    <Pressable
      onPress={onRequest}
      disabled={partnerUpdating}
      style={[s.primaryWideBtn, partnerUpdating && { opacity: 0.6 }]}
    >
      <Text style={s.primaryWideBtnText}>
        {partnerUpdating ? "Sending..." : "Ask to be DateSpot partner"}
      </Text>
    </Pressable>
  );
}
