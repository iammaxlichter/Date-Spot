import React from "react";
import { View, Text } from "react-native";
import { s } from "../styles";
import type { SpotRow } from "../api/profileApi";

export function SpotCard(props: { spot: SpotRow; timeAgo: (iso: string) => string }) {
  const { spot, timeAgo } = props;

  return (
    <View style={s.spotCard}>
      <View style={s.spotHeader}>
        <Text style={s.spotName}>{spot.name}</Text>
        <Text style={s.spotTime}>{timeAgo(spot.created_at)} ago</Text>
      </View>

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
    </View>
  );
}
