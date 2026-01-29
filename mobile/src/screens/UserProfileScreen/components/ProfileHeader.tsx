import React from "react";
import { View, Text, Image, ImageSourcePropType } from "react-native";
import { s } from "../styles";

export function ProfileHeader(props: {
  avatarSource: ImageSourcePropType;
  username: string | null;
  name: string | null;
}) {
  const { avatarSource, username, name } = props;

  return (
    <View style={{ alignItems: "center" }}>
      <Image source={avatarSource} style={s.avatar} />
      {username ? <Text style={s.username}>@{username}</Text> : null}
      <Text style={s.name}>{name ?? "Unknown User"}</Text>
    </View>
  );
}
