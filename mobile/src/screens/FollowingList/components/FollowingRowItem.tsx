// src/screens/FollowingList/components/FollowingRowItem.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import { Row } from "../types";
import { styles } from "../styles";

export function FollowingRowItem({
  item,
  onPressProfile,
  onToggleFollow,
}: {
  item: Row;
  onPressProfile: (profileUserId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPressProfile(item.id)}
      style={styles.card}
    >
      <Image
        source={
          item.avatar_url
            ? { uri: item.avatar_url }
            : require("../../../../assets/default-avatar.png")
        }
        style={styles.avatar}
        resizeMode="cover"
      />

      <View style={styles.usernameWrap}>
        <Text style={styles.username}>@{item.username ?? "unknown"}</Text>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleFollow(item.id);
        }}
        disabled={item.updating}
        style={[
          styles.followBtn,
          item.isFollowing ? styles.followBtnFollowing : styles.followBtnNotFollowing,
          { opacity: item.updating ? 0.5 : 1 },
        ]}
      >
        <Text
          style={[
            styles.followBtnText,
            item.isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextNotFollowing,
          ]}
        >
          {item.updating ? "..." : item.isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
