// src/screens/FollowingList/components/FollowingRowItem.tsx
import React from "react";
import { View, Text, Image, Pressable } from "react-native";

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
    <Pressable
      onPress={() => onPressProfile(item.id)}
      style={({ pressed }) => [styles.userItem, pressed && styles.userItemPressed]}
    >
      <View style={styles.userRow}>
        <View style={styles.leftBlock}>
          <Image
            source={
              item.avatar_url
                ? { uri: item.avatar_url }
                : require("../../../../assets/default-avatar.png")
            }
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.username}>@{item.username ?? "unknown"}</Text>
        </View>

        <Pressable
          onPress={() => onToggleFollow(item.id)}
          disabled={item.updating}
          style={[
            styles.followBtn,
            item.isFollowing ? styles.followingBtn : styles.followBtnPrimary,
            item.updating && { opacity: 0.6 },
          ]}
        >
          <Text
            style={[
              styles.followBtnText,
              item.isFollowing ? styles.followingBtnText : styles.followBtnTextPrimary,
            ]}
          >
            {item.updating ? "..." : item.isFollowing ? "Following" : "Follow"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
