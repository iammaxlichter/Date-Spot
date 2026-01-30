// src/screens/Users/components/UserRowItem.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { styles } from "../styles";
import type { UserRow } from "../types";

export function UserRowItem({
  item,
  isFollowing,
  isBusy,
  onPressRow,
  onPressFollow,
}: {
  item: UserRow;
  isFollowing: boolean;
  isBusy: boolean;
  onPressRow: () => void;
  onPressFollow: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressRow}
      style={styles.row}
    >
      <Image
        source={
          item.avatar_url
            ? { uri: item.avatar_url }
            : require("../../../../assets/default-avatar.png")
        }
        style={styles.avatar}
      />

      <View style={styles.usernameWrap}>
        <Text style={styles.username}>@{item.username}</Text>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation?.();
          onPressFollow();
        }}
        disabled={isBusy}
        style={[
          styles.followBtn,
          isFollowing ? styles.followBtnFollowing : styles.followBtnNotFollowing,
          { opacity: isBusy ? 0.6 : 1 },
        ]}
      >
        <Text
          style={[
            styles.followBtnText,
            isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextNotFollowing,
          ]}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
