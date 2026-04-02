import React from "react";
import { View, Text, Pressable } from "react-native";
import { s } from "../styles";

export function StatsRow(props: {
  followersCount: number;
  followingCount: number;
  spotsCount: number;
  onPressFollowers: () => void;
  onPressFollowing: () => void;
  onPressSpots: () => void;
}) {
  const { followersCount, followingCount, spotsCount, onPressFollowers, onPressFollowing, onPressSpots } = props;

  return (
    <View style={s.statsRow}>
      <Pressable style={({ pressed }) => [s.statBox, pressed && { opacity: 0.7 }]} onPress={onPressFollowers}>
        <Text style={s.statNumber}>{followersCount}</Text>
        <Text style={s.statLabel}>Followers</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [s.statBox, pressed && { opacity: 0.7 }]} onPress={onPressFollowing}>
        <Text style={s.statNumber}>{followingCount}</Text>
        <Text style={s.statLabel}>Following</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [s.statBox, pressed && { opacity: 0.7 }]} onPress={onPressSpots}>
        <Text style={s.statNumber}>{spotsCount}</Text>
        <Text style={s.statLabel}>Date Spots</Text>
      </Pressable>
    </View>
  );
}
