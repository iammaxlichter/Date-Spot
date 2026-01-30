// src/screens/FollowersList/components/FollowersRowItem.tsx
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Alert } from "react-native";

import { Row } from "../types";
import { styles } from "../styles";

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

        {/* Right side actions */}
        {item.id === currentUserId ? null : (
          <View style={styles.rightActions}>
            <Pressable
              onPress={() => onToggleFollow(item.id)}
              disabled={item.updating || item.removing}
              style={[
                styles.followBtn,
                item.isFollowing ? styles.followingBtn : styles.followBtnPrimary,
                (item.updating || item.removing) && { opacity: 0.6 },
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

            {/* Only show remove button if viewing your own profile */}
            {viewedUserId === currentUserId && (
              <Pressable
                onPress={() => onRemoveFollower(item.id)}
                disabled={item.removing}
                style={[styles.removeBtn, item.removing && { opacity: 0.6 }]}
                hitSlop={10}
              >
                <Text style={styles.removeBtnText}>{item.removing ? "…" : "✕"}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
