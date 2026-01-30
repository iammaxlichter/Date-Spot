import React from "react";
import { Pressable, Text } from "react-native";
import { s } from "../styles";

export function FollowButton(props: {
  isFollowing: boolean;
  followUpdating: boolean;
  onPress: () => void;
}) {
  const { isFollowing, followUpdating, onPress } = props;

  return (
    <Pressable
      style={[
        s.followButton,
        isFollowing && s.followingButton,
        followUpdating && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={followUpdating}
    >
      <Text style={[s.followButtonText, isFollowing && s.followingButtonText]}>
        {followUpdating ? "Updating..." : isFollowing ? "Following" : "Follow"}
      </Text>
    </Pressable>
  );
}
