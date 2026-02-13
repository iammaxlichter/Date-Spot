import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { s } from "../styles";
import type { SpotRow } from "../api/profileApi";
import { buildTagPresentation } from "../../../features/tags/tagPresentation";

export function SpotCard(props: {
  spot: SpotRow;
  timeAgo: (iso: string) => string;
  onPressTaggedUser: (userId: string) => void;
  activePartnerId: string | null;
}) {
  const { spot, timeAgo, onPressTaggedUser, activePartnerId } = props;
  const presentation = buildTagPresentation(spot.tagged_users, activePartnerId);

  return (
    <View style={s.spotCard}>
      <View style={s.spotHeader}>
        <Text style={s.spotName}>{spot.name}</Text>
        <Text style={s.spotTime}>{timeAgo(spot.created_at)} ago</Text>
      </View>

      {spot.photos.length > 0 ? (
        <View style={s.spotPhotoRow}>
          {spot.photos.slice(0, 4).map((photo) => (
            <Image key={photo.id} source={{ uri: photo.signedUrl }} style={s.spotPhotoThumb} />
          ))}
        </View>
      ) : null}

      <View style={s.spotMetrics}>
        <Text style={s.spotMetric}>Atmosphere: {spot.atmosphere ?? "—"}</Text>
        <Text style={s.spotMetric}>Date score: {spot.date_score ?? "—"}</Text>
      </View>

      <View style={s.spotMeta}>
        {spot.vibe ? <Text style={s.spotPill}>{spot.vibe}</Text> : null}
        {spot.price ? <Text style={s.spotPill}>{spot.price}</Text> : null}
        {spot.best_for ? <Text style={s.spotPill}>{spot.best_for}</Text> : null}

        <Text style={[s.spotPill, spot.would_return ? s.pillYes : s.pillNo]}>
          {spot.would_return ? "Would return" : "Would not return"}
        </Text>
      </View>

      {presentation.kind === "none" ? null : presentation.kind === "regular" ? (
        <View style={s.spotWentWithRow}>
          <Text style={s.spotWentWithLabel}>Went with: </Text>
          <View style={s.spotWentWithUsersWrap}>
            {presentation.users.map((user, idx) => (
              <Pressable
                key={user.id}
                onPress={(e) => {
                  e.stopPropagation();
                  onPressTaggedUser(user.id);
                }}
                hitSlop={8}
              >
                <Text style={s.spotTaggedUser}>
                  @{user.username ?? "unknown"}
                  {idx < presentation.users.length - 1 ? ", " : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : presentation.kind === "partner_only" ? (
        <View style={s.spotWentWithRow}>
          <Text style={s.spotPartnerLine}>With @{presentation.partner.username ?? "unknown"} {"\u2764"}</Text>
        </View>
      ) : (
        <View style={s.spotWentWithRow}>
          <Text style={s.spotPartnerLine}>
            With @{presentation.partner.username ?? "unknown"} and {presentation.otherCount}{" "}
            {presentation.otherCount === 1 ? "other" : "others"}
          </Text>
        </View>
      )}
    </View>
  );
}
