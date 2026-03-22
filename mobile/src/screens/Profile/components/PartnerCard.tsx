import React from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { s } from "../styles";
import type { PartnerMini } from "../api/profileApi";

export function PartnerCard(props: {
  partner: PartnerMini | null;
  partnerLoading: boolean;
  sharedDatesCount: number;
  onOpenMenu: () => void;
  onPressPartner: () => void;
  onPressDateCount: () => void;
}) {
  const { partner, partnerLoading, sharedDatesCount, onOpenMenu, onPressPartner, onPressDateCount } = props;

  return (
    <View style={{ width: "100%", paddingHorizontal: 24, marginTop: 24 }}>
      <View style={s.partnerCard}>
        <View style={s.partnerCardHeader}>
          <Text style={s.partnerTitle}>Date Spot Partner</Text>
          {partner && !partnerLoading ? (
            <Pressable onPress={onOpenMenu} hitSlop={12}>
              <Text style={s.partnerDots}>⋯</Text>
            </Pressable>
          ) : null}
        </View>

        {partnerLoading ? (
          <ActivityIndicator size="small" color="#E21E4D" />
        ) : partner ? (
          <>
            <View style={s.partnerRow}>
              <Pressable onPress={onPressPartner} hitSlop={6}>
                <Image
                  source={
                    partner.avatar_url
                      ? { uri: partner.avatar_url }
                      : require("../../../../assets/default-avatar.png")
                  }
                  style={s.partnerAvatar}
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Pressable onPress={onPressPartner} hitSlop={6} style={{ alignSelf: "flex-start" }}>
                  <Text style={s.partnerName} numberOfLines={1}>
                    {partner.name ?? partner.username ?? "Unknown"}
                  </Text>
                  {partner.username ? (
                    <Text style={s.partnerUsername}>@{partner.username}</Text>
                  ) : null}
                </Pressable>
              </View>
            </View>

            <View style={s.partnerDivider} />

            <Pressable
              onPress={onPressDateCount}
              style={({ pressed }) => [s.partnerStatPill, pressed && { opacity: 0.7 }]}
            >
              <Text style={s.partnerStatCount}>{sharedDatesCount}</Text>
              <Text style={s.partnerStatLabel}>
                {sharedDatesCount === 1 ? "date logged together" : "dates logged together"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.partnerEmptyText}>No partner yet</Text>
            <Text style={s.partnerEmptySubtext}>
              Connect with someone and your Date Spot partner will appear here.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
