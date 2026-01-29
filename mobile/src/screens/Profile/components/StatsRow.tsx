import React from "react";
import { View, Text, Pressable } from "react-native";
import { s } from "../styles";

export function StatsRow(props: {
  followersCount: number;
  followingCount: number;
  onPressFollowers: () => void;
  onPressFollowing: () => void;
}) {
  const { followersCount, followingCount, onPressFollowers, onPressFollowing } = props;

  return (
    <View style={s.statsRow}>
      <Pressable style={s.statBox} onPress={onPressFollowers}>
        <Text style={s.statNumber}>{followersCount}</Text>
        <Text style={s.statLabel}>Followers</Text>
      </Pressable>

      <Pressable style={s.statBox} onPress={onPressFollowing}>
        <Text style={s.statNumber}>{followingCount}</Text>
        <Text style={s.statLabel}>Following</Text>
      </Pressable>
    </View>
  );
}
