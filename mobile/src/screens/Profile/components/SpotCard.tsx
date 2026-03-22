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
      {/* Accent bar — always visible, gives each card a distinct top edge */}
      <View style={s.spotAccentBar} />

      {/* Name + time — always at the top */}
      <View style={s.spotHeader}>
        <Text style={s.spotName} numberOfLines={2}>{spot.name}</Text>
        <Text style={s.spotTime}>{timeAgo(spot.created_at)} ago</Text>
      </View>

      {/* Photos */}
      {spot.photos.length > 0 ? (
        <View style={s.spotPhotoRow}>
          {spot.photos.slice(0, 3).map((photo) => (
            <Image key={photo.id} source={{ uri: photo.signedUrl }} style={s.spotPhotoThumb} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      {/* Score chips */}
      {(spot.date_score != null || spot.atmosphere != null || spot.would_return != null) ? (
        <View style={s.spotScoreRow}>
          {spot.date_score != null ? (
            <View style={s.chipDate}>
              <Text style={s.chipDateText}>★ Date Score: {spot.date_score}/10</Text>
            </View>
          ) : null}
          {spot.atmosphere != null ? (
            <View style={s.chipAtmo}>
              <Text style={s.chipAtmoText}>✦ Atmosphere: {spot.atmosphere}/10</Text>
            </View>
          ) : null}
          {spot.would_return != null ? (
            <View style={[s.chipReturn, spot.would_return ? s.chipReturnYes : s.chipReturnNo]}>
              <Text style={[s.chipReturnText, spot.would_return ? s.chipReturnYesText : s.chipReturnNoText]}>
                {spot.would_return ? "Return!" : "✕ Skip"}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Tag pills */}
      {(spot.vibe || spot.price || spot.best_for) ? (
        <View style={s.spotMeta}>
          {spot.vibe ? <Text style={s.spotPill}>{spot.vibe}</Text> : null}
          {spot.price ? <Text style={s.spotPill}>{spot.price}</Text> : null}
          {spot.best_for ? <Text style={s.spotPill}>{spot.best_for}</Text> : null}
        </View>
      ) : null}

      {/* Went with */}
      {presentation.kind !== "none" ? (
        <>
          <View style={s.spotDivider} />
          <View style={s.spotWentWithRow}>
            <Text style={s.spotWentWithLabel}>Went with </Text>
            {presentation.kind === "regular" ? (
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
                      {user.name || (user.username ? `@${user.username}` : "unknown")}{idx < presentation.users.length - 1 ? ", " : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : presentation.kind === "partner_only" ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onPressTaggedUser(presentation.partner.id);
                }}
                hitSlop={8}
              >
                <Text style={s.spotTaggedUser}>{presentation.partner.name || (presentation.partner.username ? `@${presentation.partner.username}` : "unknown")}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onPressTaggedUser(presentation.partner.id);
                }}
                hitSlop={8}
              >
                <Text style={s.spotTaggedUser}>
                  {presentation.partner.name || (presentation.partner.username ? `@${presentation.partner.username}` : "unknown")}
                  <Text style={s.spotWentWithLabel}>
                    {" "}& {presentation.otherCount} {presentation.otherCount === 1 ? "other" : "others"}
                  </Text>
                </Text>
              </Pressable>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}
