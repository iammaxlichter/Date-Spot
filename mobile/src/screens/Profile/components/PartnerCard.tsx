import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { s } from "../styles";
import type { PartnerMini } from "../api/profileApi";

export function PartnerCard(props: {
  partner: PartnerMini | null;
  partnerLoading: boolean;
  onOpenMenu: () => void;
  onPressPartner: () => void;
}) {
  const { partner, partnerLoading, onOpenMenu, onPressPartner } = props;

  return (
    <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 24 }}>
      <View style={s.partnerCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.partnerTitle}>DateSpot partner</Text>
          <Pressable onPress={onOpenMenu} hitSlop={10}>
            <Text style={s.partnerDots}>⋯</Text>
          </Pressable>
        </View>

        {partnerLoading ? (
          <Text style={s.partnerBody}>Loading…</Text>
        ) : partner ? (
          <Pressable onPress={onPressPartner} style={s.partnerRow}>
            <Image
              source={
                partner.avatar_url
                  ? { uri: partner.avatar_url }
                  : require("../../../../assets/default-avatar.png")
              }
              style={s.partnerAvatar}
            />
            <Text style={s.partnerBody}>
              You're partnered with{" "}
              <Text style={{ fontWeight: "800" }}>@{partner.username ?? "unknown"}</Text>
            </Text>
          </Pressable>
        ) : (
          <Text style={s.partnerBody}>You don't have a DateSpot partner yet.</Text>
        )}
      </View>
    </View>
  );
}
