import React from "react";
import { View, Text } from "react-native";
import { s } from "../styles";
import { UserAvatar } from "../../../components/UserAvatar";

export function ProfileHeader(props: {
  avatarUri?: string | null;
  username: string | null;
  name: string | null;
}) {
  const { avatarUri, username, name } = props;

  return (
    <View style={{ alignItems: "center" }}>
      <View style={s.avatarRing}>
        <UserAvatar uri={avatarUri} size={118} style={s.avatar} />
      </View>
      {username ? <Text style={s.username}>@{username}</Text> : null}
      <Text style={s.name}>{name ?? "Unknown User"}</Text>
    </View>
  );
}
