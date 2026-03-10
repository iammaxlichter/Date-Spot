// src/screens/FollowersList/components/FollowersRowItem.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { Row } from "../types";
import { styles } from "../styles";
import { UserAvatar } from "../../../components/UserAvatar";

export function FollowersRowItem({
  item,
  currentUserId,
  viewedUserId,
  onPressProfile,
  onToggleFollow,
  onRemoveFollower,
}: {
  item: Row;
  currentUserId: string | null;
  viewedUserId: string;
  onPressProfile: (profileUserId: string) => void;
  onToggleFollow: (targetUserId: string) => void;
  onRemoveFollower: (followerId: string) => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPressProfile(item.id)} style={styles.card}>
      <UserAvatar uri={item.avatar_url} size={46} style={styles.avatar} />

      <View style={styles.usernameWrap}>
        <Text style={styles.username}>@{item.username ?? "unknown"}</Text>
      </View>

      {item.id === currentUserId ? null : (
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFollow(item.id);
            }}
            disabled={item.updating || item.removing}
            style={[
              styles.followBtn,
              item.isFollowing ? styles.followBtnFollowing : styles.followBtnNotFollowing,
              { opacity: item.updating || item.removing ? 0.5 : 1 },
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

          {viewedUserId === currentUserId && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onRemoveFollower(item.id);
              }}
              disabled={item.removing}
              style={[styles.removeBtn, { opacity: item.removing ? 0.5 : 1 }]}
              hitSlop={10}
            >
              <Text style={styles.removeBtnText}>{item.removing ? "..." : "X"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
